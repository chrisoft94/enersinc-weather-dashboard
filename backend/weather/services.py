import os
import requests
import logging
from django.utils import timezone
from django.conf import settings
from .models import WeatherData

logger = logging.getLogger(__name__)

def get_weather(city_name):
    """
    Consulta la One Call API 3.0 de OpenWeather para una ciudad.
    Como la API 3.0 requiere latitud y longitud, usamos primero
    la API de Geocoding para obtener las coordenadas.
    Si falla, retorna el último registro almacenado (Fallback).
    """
    try:
        # 1. Obtener coordenadas (Lat/Lon) mediante Geocoding API
        geo_url = settings.OPENWEATHER_GEO_URL
        geo_params = {
            "q": city_name,
            "limit": 1,
            "appid": settings.OPENWEATHER_API_KEY
        }
        geo_resp = requests.get(geo_url, params=geo_params, timeout=5)
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        
        if not geo_data:
            raise ValueError(f"Ciudad '{city_name}' no encontrada en OpenWeather.")
            
        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        
        # 2. Consultar Current Weather API 2.5 (La API 3.0 falla por suscripción)
        url = settings.OPENWEATHER_API_URL
        params = {
            "lat": lat,
            "lon": lon,
            "units": "metric",
            "appid": settings.OPENWEATHER_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # 3. Mapear datos y guardar en la base de datos (Estructura API 2.5)
        weather_record = WeatherData.objects.create(
            city=city_name,
            temperature=data.get("main", {}).get("temp"),
            humidity=data.get("main", {}).get("humidity"),
            wind_speed=data.get("wind", {}).get("speed")
        )
        return weather_record
        
    except (requests.RequestException, ValueError, KeyError, IndexError) as e:
        logger.error(f"Error consultando OpenWeather para {city_name}: {e}")
        
        # 4. Fallback: Buscar el último registro almacenado para esa ciudad
        fallback_record = WeatherData.objects.filter(city__iexact=city_name).order_by('-timestamp').first()
        
        if fallback_record:
            logger.info(f"Retornando datos de Fallback (BD) para {city_name}.")
            return fallback_record
        else:
            raise Exception("La API de clima falló y no hay datos históricos disponibles en la BD para el fallback.")
