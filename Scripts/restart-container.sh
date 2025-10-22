#!/bin/sh
docker stop sist-hab-prod
docker start sist-hab-prod
docker ps -a

