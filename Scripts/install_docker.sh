#!/bin/sh
echo "INICIO DEL PROCESO DE INSTALACIÓN DE DOCKER"
echo "======================================================================================="
echo "Instalación de Docker"
apt update
apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-cache policy docker-ce
apt install docker-ce -y
