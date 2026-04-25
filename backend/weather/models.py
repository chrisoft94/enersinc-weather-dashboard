from django.db import models

class WeatherData(models.Model):
    id = models.BigAutoField(primary_key=True)
    city = models.CharField(max_length=255)
    temperature = models.FloatField()
    humidity = models.FloatField()
    wind_speed = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'weather_data'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.city} - {self.temperature}°C"
