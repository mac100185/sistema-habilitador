#!/bin/sh
docker stop sist-hab-prod
docker stop sist-hab-phpmyadmin-prod
docker stop sist-hab-db-prod
docker stop sist-hab-drawio-prod
docker ps -a
#init 0
