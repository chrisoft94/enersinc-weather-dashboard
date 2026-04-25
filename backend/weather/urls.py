from django.urls import path
from .views import WeatherListView, DashboardDataView, ExportWeatherCSVView, WeatherInsightsView

urlpatterns = [
    path('weather/', WeatherListView.as_view(), name='weather-list'),
    path('dashboard-data/', DashboardDataView.as_view(), name='dashboard-data'),
    path('export/', ExportWeatherCSVView.as_view(), name='weather-export'),
    path('weather-insights/', WeatherInsightsView.as_view(), name='weather-insights'),
]
