# Deploy con Dokploy - Jobless Journal Backend

## Archivos creados para el deployment

- `Dockerfile` - Configuración de la imagen Docker
- `.dockerignore` - Archivos a excluir del build
- `docker-compose.yml` - Para testing local
- `dokploy.json` - Configuración específica de Dokploy
- `.env.example` - Plantilla de variables de entorno

## Pasos para hacer deploy en Dokploy

### 1. Preparar el proyecto
```bash
# Asegúrate de que todos los archivos estén committeados
git add .
git commit -m "Add Dokploy deployment configuration"
git push
```

### 2. En Dokploy:

1. **Crear nueva aplicación**
   - Conecta tu repositorio Git
   - Selecciona la rama a deployar (main/master)
   - Dokploy detectará automáticamente el Dockerfile

2. **Configurar variables de entorno**
   En la sección de "Environment Variables" añade:
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=tu_supabase_url
   SUPABASE_KEY=tu_supabase_key
   OPENAI_API_KEY=tu_openai_key
   ALLOWED_ORIGINS=https://tu-dominio.com
   ```

3. **Configurar el puerto**
   - Puerto de la aplicación: `3001`
   - Dokploy asignará automáticamente un puerto externo

4. **Configurar el dominio** (opcional)
   - Añade tu dominio personalizado
   - Configura SSL automático

### 3. Deploy
- Haz clic en "Deploy"
- Dokploy hará el build automáticamente
- Monitorea los logs durante el deployment

## Testing local con Docker

```bash
# Build de la imagen
npm run docker:build

# Correr con variables de entorno
npm run docker:run

# O usar docker-compose
npm run docker:compose
```

## Health Check

La aplicación incluye un endpoint de health check en `/api/health` que Dokploy puede usar para verificar que la aplicación está funcionando correctamente.

## Estructura del proyecto después del deployment

```
/app
├── server.js
├── package.json
├── posts/
├── node_modules/
└── ...otros archivos
```

## Variables de entorno requeridas

- `NODE_ENV`: Debe ser 'production'
- `PORT`: Puerto del servidor (3001)
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_KEY`: Clave anónima de Supabase
- `OPENAI_API_KEY`: Tu API key de OpenAI
- `ALLOWED_ORIGINS`: Dominios permitidos para CORS (separados por comas)

## Notas importantes

- El directorio `posts/` se monta como volumen read-only
- La aplicación usa un usuario no-root por seguridad
- Los logs se envían a stdout para que Dokploy los capture
- El health check está configurado en el puerto 3001
