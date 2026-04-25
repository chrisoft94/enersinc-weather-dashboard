from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Exponemos la app weather bajo el prefijo api/
    path('api/', include('weather.urls')),
]
