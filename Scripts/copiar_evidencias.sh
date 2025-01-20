#!/bin/sh
a=$(pwd)
echo "======================================================================================="
echo "INICIO DE COPIA DE RESPALDO DE LA CARPETA DE EVIDENCIAS"
echo "======================================================================================="
mkdir ${a}/backup
docker cp sist-hab-prod:/quanium/app/src/publico/imagen4 ${a}/backup
zip -r backup.zip backup/
rm /var/www/html/backup.zip
cp backup.zip /var/www/html/
rm backup.zip
rm -r backup
service apache2 start
b=$(hostname -I | cut -f1 -d' ')
echo "======================================================================================="
echo "INGRESAR A LA SIGUIENTE RUTA QUE DESCARGARÁ EL COMPRIMIDO DE LAS EVIDENCIAS"
echo "======================================================================================="
echo "http://${b}/backup.zip"
echo "======================================================================================="
echo "FINALIZACIÓN DE COPIA DE RESPALDO DE LA CARPETA DE EVIDENCIAS"
echo "======================================================================================="