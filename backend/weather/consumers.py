import json
from channels.generic.websocket import AsyncWebsocketConsumer

class WeatherConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "weather_updates"
        
        # Unir el WebSocket al grupo
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Abandonar el grupo
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Recibir mensaje del grupo
    async def weather_update(self, event):
        data = event['data']
        
        # Enviar actualización al cliente Frontend
        await self.send(text_data=json.dumps({
            'type': 'weather_update',
            'data': data
        }))
