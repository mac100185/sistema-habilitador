#!/bin/sh
echo "INICIO DEL PROCESO DE INSTALACIÓN"
echo "======================================================================================="
apt-get update
apt install zip -y
apt install apache2 -y
apt install net-tools -y
apt-get install openssl shellinabox -y
service ssh start
service shellinabox start
a=$(hostname -I | cut -f1 -d' ')
echo "GESTIÓN DE SHELLINABOX"
echo "======================================================================================="
echo "https://${a}:4200"
echo "======================================================================================="

