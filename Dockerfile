# Usar la imagen oficial de Node.js LTS
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código de la aplicación
COPY . .

# Crear directorio de logs (opcional)
RUN mkdir -p logs

# Exponer el puerto que usa la aplicación
EXPOSE 3001

# Establecer variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Crear un usuario no-root para mayor seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar la propiedad de los archivos al usuario nodejs
RUN chown -R nextjs:nodejs /app
USER nextjs

# Comando para iniciar la aplicación
CMD ["npm", "start"]
