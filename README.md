# Sistema Habilitador - Guía Completa de Instalación y Uso

## 📋 Tabla de Contenidos

1. [¿Qué es el Sistema Habilitador?](#qué-es-el-sistema-habilitador)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación Paso a Paso](#instalación-paso-a-paso)
4. [Despliegue con Docker](#despliegue-con-docker)
5. [Acceso al Sistema](#acceso-al-sistema)
6. [Credenciales Iniciales](#credenciales-iniciales)
7. [Configuración de Seguridad](#configuración-de-seguridad)
8. [Administración del Sistema](#administración-del-sistema)
9. [Copias de Respaldo](#copias-de-respaldo)
10. [Resolución de Problemas](#resolución-de-problemas)

---

## 🎯 ¿Qué es el Sistema Habilitador?

El **Sistema Habilitador** es una plataforma de gestión y seguimiento de controles de seguridad diseñada para equipos de trabajo (SQUADS) y sus proyectos (INICIATIVAS).

### Características Principales:
- ✅ Gestión de habilitadores/controles de seguridad
- ✅ Seguimiento por equipos y proyectos
- ✅ Sistema de documentación integrado
- ✅ Editor WYSIWYG con soporte para código
- ✅ Gestión de evidencias e imágenes
- ✅ Reportes y exportación de datos
- ✅ Interfaz web responsive

---

## 💻 Requisitos del Sistema

### Requisitos Mínimos:
- **Sistema Operativo:** Linux Ubuntu Server 22.04 LTS (recomendado) o similar
- **Espacio en Disco:** 4 GB mínimo (8 GB recomendado)
- **Memoria RAM:** 4 GB mínimo (8 GB recomendado)
- **Procesador:** 2 cores mínimo (4 cores recomendado)
- **Red:** Acceso a Internet para descarga inicial

### Software Necesario:
- Docker Engine 20.10 o superior
- Docker Compose 2.0 o superior
- Git (opcional, para clonar repositorio)
- Navegador web moderno (Chrome, Firefox, Edge)

### Puertos Requeridos:
- **7777** - Aplicación web principal
- **82** - PhpMyAdmin (gestión de base de datos)
- **3306** - MySQL (interno, opcional exponer)
- **4200** - Shell in a Box (gestión de contenedores)
- **83** - Draw.IO (gestor de diagramas)
- **84** - Draw.IO (gestor de diagramas)

---

## 🚀 Instalación Paso a Paso

### Paso 1: Preparación del Servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar utilidades necesarias
sudo apt install -y curl wget git zip unzip net-tools

# Verificar que los puertos estén disponibles
sudo netstat -tuln | grep -E ':(7777|82|3306|4200)'
```

### Paso 2: Obtener el Sistema Habilitador

**Opción A - Usando Git (Recomendado):**
```bash
# Clonar el repositorio
git clone https://github.com/mac100185/sistema-habilitador.git

# Ingresar al directorio
cd sistema-habilitador
```

**Opción B - Descarga directa:**
```bash
# Descargar archivo comprimido
wget https://github.com/mac100185/sistema-habilitador/archive/main.zip

# Descomprimir
unzip main.zip

# Ingresar al directorio
cd sistema-habilitador
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración (IMPORTANTE: Cambiar contraseñas)
nano .env
```

**Contenido mínimo del archivo .env:**
```env
# Base de Datos Principal
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_NAME=sisthabpro

# Base de Datos API de Seguridad
DB_HOST_API=10.10.0.112
DB_PORT_API=3306
DB_USER_API=root
DB_PASSWORD_API=TU_PASSWORD_SEGURO_AQUI
DB_NAME_API=seguridadapi

# Seguridad JWT
JWT_SECRET=TU_SECRET_JWT_MUY_LARGO_Y_ALEATORIO
JWT_EXPIRATION=24h

# Configuración de la Aplicación
NODE_ENV=production
PORT=7777
```

### Paso 4: Otorgar Permisos a Scripts

```bash
# Ingresar a la carpeta de scripts
cd Scripts

# Otorgar permisos de ejecución
chmod +x *.sh

## 🐳 Despliegue con Docker

### Opción 1: Instalación Completa

Si el servidor **NO tiene Docker instalado**, ejecute:

```bash
# Desde la carpeta Scripts/
./instalar_herramientas.sh
./install_docker.sh

```

Este script instalará:
- Docker Engine
- Docker Compose
- Portainer (Gestión de contenedores)
- Dependencias necesarias

Después de la instalación de herramientas, ejecute:

```bash
./build_seguro.sh
```

**El proceso realizará:**
1. ✅ Verificación de dependencias
2. ✅ Construcción de imágenes Docker
3. ✅ Creación de volúmenes persistentes
4. ✅ Despliegue de contenedores
5. ✅ Inicialización de base de datos
6. ✅ Configuración de red interna
7. ✅ Health checks de servicios

**Tiempo estimado:** 5-10 minutos

### Opción 2: Instalación con Docker Existente

Si el servidor **YA tiene Docker instalado**, ejecute:

```bash
# Instalar solo herramientas adicionales
./nstalar_herramientas.sh

# Desplegar la aplicación
./build_seguro.sh
```

### Verificar el Despliegue

```bash
# Ver contenedores en ejecución
docker ps
# Verificar el estado de los servicios

./verificar_servicios.sh
```

**Contenedores desplegados:**
- `sist-hab-prod` - Aplicación Node.js (Puerto 7777)
- `sistema-habilitador-db` - Base de datos MySQL (Puerto 3306)
- `sist-hab-db-prod` - Gestor de BD (Puerto 82)
- `Draw.IO` - Gestor de Diagramas (Puerto 83, 84)
- `Shell in a Box` - Gestor Docker (Puerto 4200)
sist-hab-drawio-prod
---

## 🌐 Acceso al Sistema

### Paso 1: Configurar Archivo Hosts

Para acceder al sistema desde una estación de trabajo (NO desde el servidor Docker), debe configurar el archivo `hosts`.

**En Windows:**
```
Archivo: C:\Windows\System32\drivers\etc\hosts

Agregar la línea:
IP    hack_tool
```

**En Linux/Mac:**
```bash
# Editar archivo hosts
sudo nano /etc/hosts

# Agregar la línea:
IP    hack_tool
```

**Nota:** Reemplace `IP` con la dirección IP real de su servidor Docker.

### Paso 2: Identificar la IP del Servidor (Opcional)

```bash
# Desde el servidor Docker, ejecute:
ip addr show

# O use:
hostname -I

# O consulte la configuración de red:
ifconfig
```

### Paso 3: Acceder a los Servicios Web

Una vez configurado el archivo hosts, abra un navegador web y acceda a:

#### 🔐 Sistema Habilitador Principal
```
URL: http://hack_tool:7777/login.html
Descripción: Interfaz principal de la aplicación
```

#### 🗄️ Gestor de Base de Datos (PhpMyAdmin)
```
URL: http://IP:82/
Descripción: Administración de base de datos MySQL
```

#### 📊 Gestor de Contenedores (Portainer)
```
URL: http://IP:4200/
Descripción: Gestión visual de Docker
```

#### 📊 Gestor de Diagramas (Draw.IO)
```
http://IP:83/?offline=1&https=0"
https://IP:84/?offline=1"
```
---

## 🔑 Credenciales Iniciales

### ⚠️ IMPORTANTE: Cambiar Credenciales en el Primer Inicio

El sistema viene con credenciales por defecto que **DEBEN ser cambiadas inmediatamente** después de la primera instalación por razones de seguridad.

### Credenciales del Sistema Habilitador

**Página de Acceso:** `http://hack_tool:7777/login.html`

```
Usuario:    admin
Contraseña: admin
Usuario:    analista
Contraseña: analista
```

**🔴 ACCIÓN REQUERIDA:**
1. Inicie sesión con las credenciales anteriores
2. Acceda al panel de administración
3. Cambie la contraseña del usuario `admin`
4. Cree usuarios adicionales según sea necesario
5. Elimine o desactive usuarios de prueba

### Credenciales de PhpMyAdmin

**Página de Acceso:** `http://hack_tool:82/`

```
Usuario:    root
Contraseña: quanium
```

**🔴 ACCIÓN REQUERIDA:**
1. Inicie sesión en PhpMyAdmin
2. Vaya a: "Cuentas de Usuario" → "root" → "Editar privilegios"
3. Cambie la contraseña:
   ```sql
   ALTER USER 'root'@'%' IDENTIFIED BY 'NuevaPasswordSegura123!';
   FLUSH PRIVILEGES;
   ```
4. Actualice el archivo `.env` con la nueva contraseña:
   ```bash
   DB_PASSWORD=NuevaPasswordSegura123!
   DB_PASSWORD_API=NuevaPasswordSegura123!
   ```
5. Reinicie los contenedores:
   ```bash
   cd Scripts/
   ./restart-container.sh
   ```

### Bases de Datos

El sistema utiliza dos bases de datos:

**Base de Datos Principal:**
```
Nombre:     sisthabpro
Usuario:    root
Contraseña: quanium (CAMBIAR)
Charset:    utf8mb4_unicode_ci
```

**Base de Datos API de Seguridad:**
```
Nombre:     seguridadapi
Usuario:    root
Contraseña: quanium (CAMBIAR)
Charset:    utf8mb4_unicode_ci
```

---

## 🔒 Configuración de Seguridad

### Checklist de Seguridad Post-Instalación

#### ✅ Paso 1: Cambiar Todas las Contraseñas
- [ ] Cambiar contraseña de usuario `admin` en el sistema
- [ ] Cambiar contraseña de `root` en MySQL
- [ ] Crear contraseña para Portainer
- [ ] Generar nuevo `JWT_SECRET` aleatorio

#### ✅ Paso 2: Actualizar Variables de Entorno
```bash
# Editar archivo .env
nano /ruta/al/sistema-habilitador/.env

# Generar JWT_SECRET seguro
openssl rand -base64 64

# Actualizar contraseñas en .env
DB_PASSWORD=NuevaPasswordSegura
DB_PASSWORD_API=NuevaPasswordSegura
JWT_SECRET=SecretGeneradoConOpenssl
```

#### ✅ Paso 3: Reiniciar Servicios
```bash
cd Scripts/
./restart-container.sh
```

#### ✅ Paso 4: Configurar Firewall
```bash
# Permitir solo puertos necesarios
sudo ufw allow 7777/tcp   # Sistema Habilitador
sudo ufw allow 82/tcp     # PhpMyAdmin (opcional, puede cerrarse)
sudo ufw allow 4200/tcp   # Shel in a Box (opcional)
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 83/tcp     # Drawio
sudo ufw allow 84/tcp     # Drawio
sudo ufw enable

# Verificar reglas
sudo ufw status
```

---

## ⚙️ Administración del Sistema

### Comandos Básicos de Docker

```bash
# Ver contenedores en ejecución
docker ps

# Ver todos los contenedores (incluso detenidos)
docker ps -a

# Ver logs de un contenedor
docker logs [nombre-contenedor]
docker logs -f [nombre-contenedor]  # Seguir logs en tiempo real

# Ingresar a un contenedor
docker exec -it sistema-habilitador-web /bin/bash

# Ver uso de recursos
docker stats

# Ver imágenes disponibles
docker images

# Ver volúmenes
docker volume ls
```

### Scripts de Administración Incluidos

#### 🔄 Reiniciar Contenedores
```bash
cd Scripts/
./restart-container.sh
```
- Reinicia el contenedor principal sin pérdida de datos
- Útil después de cambios en configuración

#### ⏸️ Detener Contenedores
```bash
cd Scripts/
./stop-container.sh
```
- Detiene todos los contenedores del sistema
- Los datos se mantienen en volúmenes persistentes

#### 🚀 Iniciar Contenedores
```bash
# Desde el directorio raíz del proyecto
docker-compose up -d
```

#### 🗑️ Desinstalar Sistema
```bash
cd Scripts/
./desinstalar.sh
```
- ⚠️ **ADVERTENCIA:** Elimina todos los contenedores y volúmenes
- Realice backup antes de desinstalar

### Mantenimiento Regular

#### Limpieza de Docker
```bash
# Eliminar contenedores detenidos
docker container prune -f

# Eliminar imágenes no utilizadas
docker image prune -a -f

# Eliminar volúmenes no utilizados
docker volume prune -f

# Limpieza completa del sistema
docker system prune -a --volumes -f
```

#### Actualizar Dependencias
```bash
# Actualizar imágenes base
docker-compose pull

# Reconstruir con nuevas imágenes
docker-compose up -d --build
```

#### Verificar Salud del Sistema
```bash
# Verificar health checks
docker inspect --format='{{.State.Health.Status}}' sistema-habilitador-web

# Ver detalles de salud
docker inspect sistema-habilitador-web | grep -A 20 Health
```

---
