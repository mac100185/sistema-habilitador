#Dependientes
#Node (Recomendado v18.16.1)
FROM node:latest

#Directorio de trabajo
WORKDIR /quanium/app

#Copia de archivos de dependencias
COPY package*.json ./

#Instalacion de Node
RUN npm upgrade -g npm
RUN npm config set registry https://registry.npmjs.org
RUN npm install

#Puerto de escucha
#EXPOSE 7777

#Volumen permanente
#VOLUME [ "/quanium/app/src/publico/imagen4 " ]

#Copia de todos los archivos del proyecto
COPY . .


#Corre el aplicativo
CMD ["npm", "start"]
