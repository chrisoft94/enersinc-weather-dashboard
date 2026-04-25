```mermaid
flowchart TD
    %% Estilos
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef backend fill:#092e20,stroke:#333,stroke-width:2px,color:#fff
    classDef db fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    classDef cache fill:#dc382d,stroke:#333,stroke-width:2px,color:#fff
    classDef external fill:#f39c12,stroke:#333,stroke-width:2px,color:#fff

    %% Nodos
    Client["Navegador Web<br/>(React + Zustand + Ant Design)"]:::frontend
    DjangoAPI["Django REST Framework<br/>(Endpoints HTTP)"]:::backend
    Channels["Django Channels<br/>(WebSockets)"]:::backend
    Redis["Redis<br/>(Caché & Message Broker)"]:::cache
    PostgreSQL["PostgreSQL<br/>(Persistencia de Datos)"]:::db
    OpenWeather["OpenWeather API<br/>(External Service)"]:::external
    Celery["Celery/Cron<br/>(Background Tasks - Opcional)"]:::backend

    %% Flujos de Comunicación HTTP
    Client <-->|REST API /api/weather/| DjangoAPI
    
    %% Lógica de Backend
    DjangoAPI -->|Consulta / Guarda Datos| PostgreSQL
    DjangoAPI <-->|Lee / Escribe Caché| Redis
    DjangoAPI -->|Consulta externa (Si no hay caché)| OpenWeather
    
    %% Flujos de Comunicación WebSocket
    Client <-->|ws://.../ws/weather/| Channels
    Channels <-->|Pub/Sub| Redis
    DjangoAPI -.->|Emite Evento de Actualización| Channels
    
    %% Background Tasks (opcional)
    Celery -.->|Actualiza Clima Periódicamente| OpenWeather
    Celery -.->|Guarda| PostgreSQL
    Celery -.->|Emite Evento| Channels
```