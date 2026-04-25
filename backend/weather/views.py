import csv
from django.http import HttpResponse
from django.core.cache import cache
from rest_framework import generics, views
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import WeatherData
from .serializers import WeatherDataSerializer
from .insights_service import InsightsService

class WeatherPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'size'
    max_page_size = 100

class WeatherListView(generics.ListAPIView):
    serializer_class = WeatherDataSerializer
    pagination_class = WeatherPagination

    def get_queryset(self):
        queryset = WeatherData.objects.all()
        city = self.request.query_params.get('city', None)
        if city is not None:
            # 1. Sincronizar datos si es necesario (si no existen o tienen más de 5 minutos)
            from .services import get_weather
            from django.utils import timezone
            from datetime import timedelta
            
            latest = WeatherData.objects.filter(city__iexact=city).order_by('-timestamp').first()
            if not latest or (timezone.now() - latest.timestamp) > timedelta(minutes=5):
                try:
                    get_weather(city)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Error fetching weather for {city} in view: {e}")

            # 2. Filtro por ciudad (case-insensitive) y ordenamiento
            queryset = queryset.filter(city__iexact=city).order_by('-timestamp')
        else:
            queryset = queryset.order_by('-timestamp')
        return queryset

class DashboardDataView(views.APIView):
    def get(self, request, *args, **kwargs):
        cache_key = "dashboard_data_recent"
        cached_data = cache.get(cache_key)
        
        # 1. Estrategia de Caché: Intentar obtener de Redis
        if cached_data:
            return Response(cached_data)
            
        # 2. Si no hay caché, consultar base de datos
        # Usamos distinct('city') de PostgreSQL para obtener el registro más reciente por ciudad
        latest_weather = WeatherData.objects.order_by('city', '-timestamp').distinct('city')
        serializer = WeatherDataSerializer(latest_weather, many=True)
        
        data = serializer.data
        # 3. Guardar en Redis con un TTL de 5 minutos (300 segundos)
        cache.set(cache_key, data, timeout=300)
        
        return Response(data)

class ExportWeatherCSVView(views.APIView):
    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="weather_history.csv"'

        writer = csv.writer(response)
        # Escribir cabeceras
        writer.writerow(['ID', 'City', 'Temperature', 'Humidity', 'Wind Speed', 'Timestamp'])

        # Volcar datos
        weather_data = WeatherData.objects.all().order_by('-timestamp')
        for data in weather_data:
            writer.writerow([
                data.id,
                data.city,
                data.temperature,
                data.humidity,
                data.wind_speed,
                data.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            ])

        return response

class WeatherInsightsView(views.APIView):
    def get(self, request, *args, **kwargs):
        try:
            insights = InsightsService.generate_insights()
            return Response(insights)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error generating insights: {e}")
            return Response({"error": "Failed to generate insights"}, status=500)
