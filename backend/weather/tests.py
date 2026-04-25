from django.test import TestCase
from django.urls import reverse
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import requests
from .models import WeatherData
from .services import get_weather

class WeatherTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.city1 = "Bogota"
        self.city2 = "Medellin"
        
        # Poblar base de datos inicial
        # 15 registros para Bogota para probar paginación
        for i in range(15):
            WeatherData.objects.create(
                city=self.city1,
                temperature=20.0 + i,
                humidity=50.0,
                wind_speed=5.0
            )
            
        # 1 registro para Medellin
        WeatherData.objects.create(
            city=self.city2,
            temperature=25.0,
            humidity=60.0,
            wind_speed=10.0
        )
        
        # Limpiar caché antes de cada test
        cache.clear()

    # ==========================================
    # 1. 🧪 Endpoints y Paginación
    # ==========================================
    def test_weather_list_pagination(self):
        url = reverse('weather-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar la estructura de paginación nativa
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)
        
        # El tamaño por defecto configurado es 10
        self.assertEqual(len(response.data['results']), 10)
        self.assertEqual(response.data['count'], 16) # 15 (Bogota) + 1 (Medellin)
        
    def test_weather_list_custom_pagination_size(self):
        url = reverse('weather-list')
        response = self.client.get(url, {'size': 5})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Se verifica que respete el parámetro size=5
        self.assertEqual(len(response.data['results']), 5)

    def test_dashboard_endpoint_returns_success(self):
        url = reverse('dashboard-data')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Distinct city devolverá 2 registros (Bogota y Medellin)
        self.assertEqual(len(response.data), 2)

    # ==========================================
    # 2. 🗃️ Caché
    # ==========================================
    def test_dashboard_data_uses_cache(self):
        url = reverse('dashboard-data')
        
        # Petición 1: Consulta a BD y guarda en caché
        response1 = self.client.get(url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Verificar que efectivamente se guardó en la caché subyacente
        cached_data = cache.get("dashboard_data_recent")
        self.assertIsNotNone(cached_data)
        self.assertEqual(response1.data, cached_data)
        
        # Petición 2: Debería leer desde la caché
        # Mockeamos el método get de la caché de la vista para asegurar que se llama
        with patch('weather.views.cache.get') as mock_cache_get:
            mock_cache_get.return_value = cached_data
            response2 = self.client.get(url)
            
            # Verificamos que se interceptó el valor en caché
            mock_cache_get.assert_called_once_with("dashboard_data_recent")
            self.assertEqual(response2.data, cached_data)

    # ==========================================
    # 3. 🛡️ Mocks y Resiliencia
    # ==========================================
    @patch('weather.services.requests.get')
    def test_get_weather_success(self, mock_get):
        # Simular respuestas exitosas de API de Geocoding y luego One Call API
        mock_response_geo = MagicMock()
        mock_response_geo.json.return_value = [{"lat": 4.6097, "lon": -74.0817}]
        mock_response_geo.raise_for_status.return_value = None
        
        mock_response_weather = MagicMock()
        mock_response_weather.json.return_value = {
            "main": {"temp": 18.5, "humidity": 70},
            "wind": {"speed": 4.5}
        }
        mock_response_weather.raise_for_status.return_value = None
        
        # Asignar side_effect para devolver primero geo_response, luego weather_response
        mock_get.side_effect = [mock_response_geo, mock_response_weather]
        
        # Ejecutar
        record = get_weather(self.city1)
        
        # Validaciones de éxito
        self.assertEqual(record.city, self.city1)
        self.assertEqual(record.temperature, 18.5)
        self.assertEqual(WeatherData.objects.filter(city=self.city1).count(), 16) # 15 iniciales + 1 nuevo

    @patch('weather.services.requests.get')
    def test_get_weather_api_failure_fallback(self, mock_get):
        # Simular error crítico (Timeout, 500, Offline)
        mock_get.side_effect = requests.RequestException("OpenWeather API Down")
        
        # Obtenemos el registro más reciente existente de Bogota manualmente
        latest_existing = WeatherData.objects.filter(city=self.city1).order_by('-timestamp').first()
        
        # Ejecutar el servicio que debería fallar externamente y activar el Fallback
        fallback_record = get_weather(self.city1)
        
        # Validaciones de resiliencia
        self.assertEqual(fallback_record.id, latest_existing.id)
        self.assertEqual(fallback_record.city, self.city1)
        # La cantidad de datos no debió aumentar
        self.assertEqual(WeatherData.objects.filter(city=self.city1).count(), 15)

    @patch('weather.services.requests.get')
    def test_get_weather_api_failure_no_fallback(self, mock_get):
        # Simular error crítico para una ciudad de la que NO tenemos historial
        mock_get.side_effect = requests.RequestException("OpenWeather API Down")
        
        # Validar que si no hay historial para usar de fallback, el servicio lance la excepción controlada
        with self.assertRaises(Exception) as context:
            get_weather("CiudadInventada")
            
        self.assertIn("La API de clima falló y no hay datos", str(context.exception))
