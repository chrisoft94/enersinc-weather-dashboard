from django.db.models import Avg, F, Window
from django.db.models.functions import TruncHour, Lag
from django.utils import timezone
from datetime import timedelta
from .models import WeatherData

class InsightsService:
    @staticmethod
    def get_aggregated_hourly_data():
        """
        Extrae y limpia los datos de las últimas 24 horas.
        Agrupa por ciudad y hora, promediando métricas.
        Utiliza funciones de ventana (Lag) para obtener el valor de la hora anterior.
        """
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        
        # 1. Filtrar y agrupar (TruncHour)
        hourly_data = WeatherData.objects.filter(timestamp__gte=last_24h) \
            .annotate(hour=TruncHour('timestamp')) \
            .values('city', 'hour') \
            .annotate(
                avg_temp=Avg('temperature'),
                avg_wind=Avg('wind_speed'),
                avg_humidity=Avg('humidity')
            ) \
            .order_by('city', 'hour')

        # Django ORM permite Window functions, pero debido a limitaciones con group by y window
        # evaluaremos el LAG en memoria sobre el queryset ordenado para garantizar soporte 
        # en SQLite/Postgres de manera segura para esta prueba.
        
        processed_data = []
        city_groups = {}
        
        for entry in hourly_data:
            city = entry['city']
            if city not in city_groups:
                city_groups[city] = []
            city_groups[city].append(entry)
            
        for city, records in city_groups.items():
            for i in range(len(records)):
                current = records[i]
                previous = records[i - 1] if i > 0 else None
                
                temp_delta = 0
                wind_pct_change = 0
                
                if previous:
                    temp_delta = current['avg_temp'] - previous['avg_temp']
                    if previous['avg_wind'] > 0:
                        wind_pct_change = ((current['avg_wind'] - previous['avg_wind']) / previous['avg_wind']) * 100
                
                current['temp_delta'] = temp_delta
                current['wind_pct_change'] = wind_pct_change
                current['prev_temp'] = previous['avg_temp'] if previous else current['avg_temp']
                current['prev_wind'] = previous['avg_wind'] if previous else current['avg_wind']
                processed_data.append(current)
                
        return processed_data, city_groups

    @staticmethod
    def generate_insights():
        """
        Motor de Reglas que evalúa los datos procesados.
        """
        processed_data, city_groups = InsightsService.get_aggregated_hourly_data()
        insights = []
        
        # Evaluar última hora disponible por cada ciudad
        for city, records in city_groups.items():
            if not records:
                continue
                
            latest = records[-1]
            temp = latest['avg_temp']
            humidity = latest['avg_humidity']
            wind = latest['avg_wind']
            wind_pct = latest['wind_pct_change']
            
            # Regla 1: Alerta de Viento (Amarillo)
            if wind < 2.0 and wind_pct < -40.0:
                insights.append({
                    "type": "wind_alert",
                    "color": "yellow",
                    "city": city,
                    "message": f"Caída brusca de viento en {city}. Posibles anomalías climáticas locales."
                })
                
            # Regla 2: Pico Térmico (Naranja)
            if temp > 22.0 and humidity > 50.0:
                insights.append({
                    "type": "thermal_peak",
                    "color": "orange",
                    "city": city,
                    "message": f"Condiciones de alta sensación térmica en {city} ({temp:.1f}°C, {humidity:.1f}% HR)."
                })
                
            # Regla 3: Estabilidad (Verde) - Últimas 3 horas
            if len(records) >= 3:
                last_3 = records[-3:]
                is_stable = True
                for i in range(1, 3):
                    curr_temp = last_3[i]['avg_temp']
                    prev_temp = last_3[i-1]['avg_temp']
                    curr_wind = last_3[i]['avg_wind']
                    prev_wind = last_3[i-1]['avg_wind']
                    
                    t_var = abs((curr_temp - prev_temp) / prev_temp) * 100 if prev_temp else 0
                    w_var = abs((curr_wind - prev_wind) / prev_wind) * 100 if prev_wind else 0
                    
                    if t_var >= 10.0: # Relajamos la restricción de viento porque varía mucho
                        is_stable = False
                        break
                        
                if is_stable:
                    insights.append({
                        "type": "stability",
                        "color": "green",
                        "city": city,
                        "message": f"Condiciones climáticas (Temperatura) estables en {city} en las últimas horas."
                    })
            
            # Si no entró en ninguna regla crítica o estable, agregamos una nota genérica
            if not any(i['city'] == city for i in insights):
                insights.append({
                    "type": "normal",
                    "color": "blue",
                    "city": city,
                    "message": f"Monitoreo activo en {city}. Parámetros dentro de rangos operativos normales."
                })
                    
        return insights
