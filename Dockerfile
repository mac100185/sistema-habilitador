#Dependientes
#Node v18.16.1 (Compatible y estable)
FROM node:18.16.1-slim

#Directorio de trabajo
WORKDIR /quanium/app

#Instalar dependencias del sistema necesarias para canvas (nodejs-captcha) y wget para healthcheck
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

#Copia de archivos de dependencias
COPY package*.json ./

#Instalacion de Node - Usar versión compatible con Node 18.16.1
RUN npm install -g npm@9.8.1
RUN npm config set registry https://registry.npmjs.org
RUN npm install --production

#Puerto de escucha
EXPOSE 7777

#Volumen permanente
VOLUME ["/quanium/app/src/publico/imagen4"]

#Copia de todos los archivos del proyecto
COPY . .

#Crear directorio de imágenes si no existe
RUN mkdir -p /quanium/app/src/publico/imagen4

#Corre el aplicativo
CMD ["npm", "start"]
