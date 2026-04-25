# Reglas del Agente - Proyecto Weather Dashboard

Este documento define las reglas, tecnologías y requerimientos que el Agente (yo) debe seguir rigurosamente durante el desarrollo de este proyecto, basado en la "Prueba Técnica – Full Stack Advanced".

## 1. Stack Tecnológico Obligatorio
### Backend
- **Framework:** Django + Django REST Framework (DRF)
- **Base de Datos:** PostgreSQL
- **Caché:** Redis (Obligatorio)
- **Tiempo Real:** Django Channels (WebSockets)
- **Tareas en Segundo Plano (Opcional pero valorado):** Celery

### Frontend
- **Framework:** React + Vite
- **UI / Componentes:** Ant Design
- **Manejo de Estado:** Zustand, Redux o Context/useState.

### Infraestructura
- **Contenedores:** Docker y docker-compose.
- **Servicios Docker:** Backend, Frontend, Redis, PostgreSQL.
- **Despliegue:** Preparar para Heroku (o similar).

## 2. Reglas de Desarrollo Backend
1. **Modelo Principal (`WeatherData`):**
   - Campos: `id`, `city`, `temperature`, `humidity`, `wind_speed`, `timestamp`.
2. **Consumo de API Externa:**
   - Usar OpenWeather (o similar).
   - Manejar caídas y errores de la API externa (Fallback: devolver datos de la BD si la API falla).
3. **Persistencia y Caché:**
   - Guardar todo el histórico de datos consultados.
   - Usar Redis para cachear datos recientes por ciudad definiendo un TTL adecuado.
4. **API REST y Paginación:**
   - `GET /weather/` (Obligatorio implementar paginación limit/offset o page/size).
   - `GET /weather?city=...`
   - Endpoint optimizado: `/dashboard-data/`
   - Endpoint de exportación CSV.
5. **WebSockets (Tiempo Real):**
   - Emitir eventos por WebSocket al Frontend cuando se inserten nuevos datos en la base de datos.
6. **Seguridad:**
   - Validar inputs. Prevenir SQL Injection y XSS. (No se requiere autenticación).

## 3. Reglas de Desarrollo Frontend
1. **Dashboard y Comparación:**
   - Permitir seleccionar y comparar exactamente dos ciudades.
   - Mostrar Cards con: Temperatura, Humedad y Viento.
2. **Visualización de Datos:**
   - **Tabla:** Mostrar `WeatherData` consumiendo la paginación del backend y permitir filtrar por ciudad.
   - **Gráficos:** Series de tiempo y comparación entre ciudades.
3. **Tiempo Real:**
   - Conectarse al WebSocket del Backend y actualizar la UI automáticamente sin recargar.
4. **Modo Offline (Importante):**
   - Detectar pérdida de conexión y mostrar indicador visual "offline".
   - Mostrar el último estado disponible (usando `localStorage` o `IndexedDB`).
   - Re-sincronizar automáticamente al recuperar la conexión.
5. **Exportación e Impresión:**
   - Botón para descargar datos en CSV.
   - Botón para imprimir el dashboard.
6. **UX/UI:**
   - Diseño responsivo.
   - Manejar estados de carga (Loading states) y mostrar mensajes de error amigables.

## 4. Flujo de Trabajo del Sistema
Frontend -> Backend API -> Redis Cache -> PostgreSQL -> API Externa (OpenWeather)
                                                         |
                                                         v
                                                    WebSocket (Tiempo real) -> Frontend

## 5. Criterios de Calidad (Checklist continuo)
- [ ] Código limpio y separación de responsabilidades.
- [ ] Uso eficiente de la caché y consultas optimizadas a la BD.
- [ ] Dockerización completa (docker-compose up debe levantar todo).
- [ ] Manejo correcto de la reconexión de WebSockets.
- [ ] README.md con arquitectura, decisiones técnicas y pasos de ejecución.
- [ ] (Bonus) Pruebas unitarias.
