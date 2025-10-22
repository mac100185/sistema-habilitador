#Dependientes
#Node v18.16.1 (Compatible y estable)
FROM node:18.16.1-slim

#Directorio de trabajo
WORKDIR /quanium/app

#Actualizar CA certificates y configurar GPG antes de instalar paquetes
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get update --allow-releaseinfo-change && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    gnupg \
    && update-ca-certificates

#Instalar dependencias del sistema necesarias para canvas (nodejs-captcha) y wget para healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

#Copia de archivos de dependencias
COPY package*.json ./

#Instalacion de Node - Usar versión compatible con Node 18.16.1
RUN npm install -g npm@9.8.1 && \
    npm config set registry https://registry.npmjs.org && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

#Instalar dependencias con logs detallados
RUN echo "=== INICIO DE INSTALACIÓN DE DEPENDENCIAS ===" && \
    npm install --production --verbose 2>&1 | tee /tmp/npm-install.log && \
    echo "=== FIN DE INSTALACIÓN DE DEPENDENCIAS ===" && \
    echo "Dependencias instaladas exitosamente" && \
    ls -la node_modules | head -20

#Verificar instalación de dependencias críticas
RUN node -e "console.log('Node version:', process.version)" && \
    node -e "console.log('NPM version:'); const {execSync} = require('child_process'); console.log(execSync('npm -v').toString())" && \
    test -d node_modules || (echo "ERROR: node_modules no existe" && exit 1) && \
    echo "Verificación de dependencias completada"

#Puerto de escucha
EXPOSE 7777

#Volumen permanente
VOLUME ["/quanium/app/src/publico/imagen4"]

#Copia de todos los archivos del proyecto
COPY . .

#Crear directorio de imágenes si no existe y establecer permisos
RUN mkdir -p /quanium/app/src/publico/imagen4 && \
    chmod -R 777 /quanium/app/src/publico/imagen4 && \
    chmod -R 755 /quanium/app

#Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:7777/api/health || exit 1

#Corre el aplicativo
CMD ["npm", "start"]
