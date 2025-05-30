# Jobless Journal Backend - Deployment Guide

## 📦 Deployment con Dokploy

Este proyecto está listo para ser deployado con Dokploy utilizando Docker.

### 🛠️ Prerequisitos

1. **Dokploy instalado** en tu servidor
2. **Variables de entorno** configuradas
3. **Dominio** apuntando a tu servidor (opcional)

### 🔧 Variables de Entorno Requeridas

Configure las siguientes variables de entorno en Dokploy:

```env
NODE_ENV=production
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key
OPENAI_API_KEY=tu_openai_api_key
ALLOWED_ORIGINS=https://tu-dominio.com,https://otro-dominio.com
PORT=3001
```

### 🚀 Pasos para Deployment

1. **Conectar repositorio** en Dokploy
2. **Configurar variables de entorno**
3. **Seleccionar tipo de deployment**: Docker Compose
4. **Configurar puerto**: 3001
5. **Deploy!**

### 🏗️ Estructura del Proyecto

```
backend/
├── Dockerfile              # Configuración Docker
├── docker-compose.yml      # Configuración Docker Compose
├── .dockerignore           # Archivos ignorados por Docker
├── package.json            # Dependencias Node.js
├── server.js              # Servidor Express
├── posts/                 # Posts del journal
└── .env                   # Variables de entorno (local)
```

### 🔍 Health Check

El servicio incluye un health check en:
- **Endpoint**: `/api/health`
- **Puerto**: 3001
- **Respuesta**: `{"status":"OK","timestamp":"...","service":"jobless-journal-backend"}`

### 📡 API Endpoints

- `GET /api/status` - Estado del servicio
- `GET /api/posts` - Lista todos los posts
- `GET /api/posts/:slug` - Obtiene un post específico
- `POST /api/gpt/comentar` - Genera comentario con IA
- `GET /api/comments/:slug` - Obtiene comentarios
- `POST /api/comments/:slug` - Añade comentario
- `GET /api/health` - Health check

### 🐳 Comandos Docker Locales

```bash
# Build
docker build -t jobless-journal-backend .

# Run
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

### 🔒 Seguridad

- CORS configurado para producción
- Variables de entorno protegidas
- Health checks habilitados
- Restart automático del contenedor

### 🌐 Dominio y SSL

Dokploy puede configurar automáticamente:
- Certificados SSL con Let's Encrypt
- Proxy reverso
- Balanceador de carga

### 📊 Monitoreo

El health check permite monitorear:
- Estado del servicio
- Tiempo de respuesta
- Reinicio automático si falla
