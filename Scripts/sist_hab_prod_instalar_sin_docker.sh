#!/bin/sh
echo "INICIO DEL PROCESO DE INSTALACIÓN"
echo "======================================================================================="
#git clone http://10.10.0.194:3000/agarcia/sistema-habilitador.git
echo "======================================================================================="
echo "Se cambia al directorio de trabajo"
cd ..
cd ..
cd sistema-habilitador
echo "Se inicia la creación de las imágenes y contenedores"
echo "======================================================================================="
docker compose up -d
echo "======================================================================================="
echo "Proceso de creación de imágenes y contenedores completado"
echo "==========LISTA DE CONTENEDORES========================================================"
docker ps -a
echo "==========LISTA DE IMÁGENES============================================================"
docker images
echo "==========LISTA DE REDES INTERNAS DE DOCKER============================================"
docker network ls
echo "======================================================================================="
echo "Inicio de copiado de datos en la base de datos"
echo "Esto puede tomar 5 minutos, espere y no cancele el proceso"
echo "Inicio de la copia ....................."
sleep 1m
echo "1 minuto de 5 minutos"
sleep 1m
echo "2 minutos de 5 minutos"
sleep 1m
echo "3 minutos de 5 minutos"
sleep 1m
echo "4 minutos de 5 minutos"
sleep 1m
echo "5 minutos de 5 minutos"
echo "Tiempo de copiado de datos terminado"
echo "======================================================================================="
echo "Reinicio del contenedor sist-hab-prod"
docker stop sist-hab-prod
docker start sist-hab-prod
docker ps -a
echo "======================================================================================="
echo "======================================================================================="
echo "PROCESO DE INSTALACIÓN TERMINADO"
echo "======================================================================================="
echo "======================================================================================="
echo "Importante agregar en el archivo HOST de su sistema cliente la siguiente línea"
echo "======================================================================================="
a=$(hostname -I | cut -f1 -d' ')
echo "${a} hack_tool"
echo "======================================================================================="
echo "======================================================================================="
echo "Para acceder a los servicios debe abrir en un navegador web las siguientes direcciones:"
echo "======================================================================================="
echo "SISTEMA HABILITADOR WEB"
echo "======================================================================================="
echo "http://hack_tool:7777/"
echo "======================================================================================="
echo "GESTIÓN DE LA BASE DE DATOS (Nota: la base de datos es: sisthabpro el usuario es: root y la clave es: quanium)"
echo "======================================================================================="
echo "http://hack_tool:82/"
echo "======================================================================================="
echo "GESTIÓN DE DRAW.IO"
echo "======================================================================================="
echo "http://${a}:83/?offline=1&https=0"
echo " "
echo "https://${a}:84/?offline=1"
echo "======================================================================================="
echo "GESTIÓN DEL SERVIDOR DOCKER"
echo "======================================================================================="
echo "https://${a}:4200/"
echo "======================================================================================="
echo "======================================================================================="
echo "======================================================================================="