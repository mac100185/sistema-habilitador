#!/bin/sh
echo "======================================================================================="
echo "INICIO DE RESTAURACIÓN DE LA CARPETA DE EVIDENCIAS"
echo "======================================================================================="
echo "Eliminación del contenido de la carpte de evidencias en el contenedor"
echo "======================================================================================="
docker exec -it sist-hab-prod bash
cd src/publico/imagen4/
rm *.*
exit
echo "Ingrese la dirección IP del servidor web Xampp del cual se descarga el archivo backup.zip"
echo "IP:"
read a
echo "======================================================================================="
echo "Obtención de la evidencia respaldada"
echo "======================================================================================="
wget http://${a}/backup.zip
unzip backup.zip
echo "Inicio de la copia de respaldo en el contenedor"
echo "======================================================================================="
docker cp backup/imagen4 sist-hab-prod:/quanium/app/src/publico
rm backup.zip
rm -r backup/
echo "======================================================================================="
echo "FINALIZACIÓN DE RESTAURACIÓN DE LA CARPETA DE EVIDENCIAS"
echo "======================================================================================="