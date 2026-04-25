# Generated manually to prepare initial migrations without Django environment
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='WeatherData',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('city', models.CharField(max_length=255)),
                ('temperature', models.FloatField()),
                ('humidity', models.FloatField()),
                ('wind_speed', models.FloatField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'weather_data',
                'ordering': ['-timestamp'],
            },
        ),
    ]
