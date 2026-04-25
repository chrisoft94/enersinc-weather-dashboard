from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import WeatherData
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=WeatherData)
def emit_weather_update(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        if channel_layer is not None:
            data = {
                'id': instance.id,
                'city': instance.city,
                'temperature': instance.temperature,
                'humidity': instance.humidity,
                'wind_speed': instance.wind_speed,
                'timestamp': instance.timestamp.isoformat()
            }
            
            # Emitir al grupo 'weather_updates' de Channels
            async_to_sync(channel_layer.group_send)(
                "weather_updates",
                {
                    "type": "weather.update",  # Mapea al método weather_update del consumer
                    "data": data
                }
            )
            logger.info(f"Signal emitida: Nuevo dato de {instance.city} enviado por WebSockets.")
