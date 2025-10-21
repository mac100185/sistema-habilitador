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
- **4200** - Portainer (gestión de contenedores)

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
git clone http://CualquierDominio:3000/agarcia/sistema-habilitador.git

# Ingresar al directorio
cd sistema-habilitador
```

**Opción B - Descarga directa:**
```bash
# Descargar archivo comprimido
wget http://CualquierDominio:3000/agarcia/sistema-habilitador/archive/main.zip

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
chmod +x sist_hab_prod_instalar.sh
chmod +x sist_hab_prod_instalar_sin_docker.sh
chmod +x sist_hab_prod_instalar_herramientas.sh
chmod +x sist_hab_prod_desinstalar.sh
chmod +x restart-container.sh
chmod +x stop-container.sh
chmod +x copiar_evidencias.sh
chmod +x reestablecer_evidencias.sh
```

---

## 🐳 Despliegue con Docker

### Opción 1: Instalación Completa (Sin Docker Previo)

Si el servidor **NO tiene Docker instalado**, ejecute:

```bash
# Desde la carpeta Scripts/
./sist_hab_prod_instalar_herramientas.sh
```

Este script instalará:
- Docker Engine
- Docker Compose
- Portainer (Gestión de contenedores)
- Dependencias necesarias

Después de la instalación de herramientas, ejecute:

```bash
./sist_hab_prod_instalar.sh
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
./sist_hab_prod_instalar_herramientas.sh

# Desplegar la aplicación
./sist_hab_prod_instalar_sin_docker.sh
```

### Verificar el Despliegue

```bash
# Ver contenedores en ejecución
docker ps

# Verificar logs del contenedor principal
docker logs sistema-habilitador-web

# Verificar logs de la base de datos
docker logs sistema-habilitador-db

# Ver estado de servicios
docker-compose ps
```

**Contenedores desplegados:**
- `sistema-habilitador-web` - Aplicación Node.js (Puerto 7777)
- `sistema-habilitador-db` - Base de datos MySQL (Puerto 3306)
- `sistema-habilitador-phpmyadmin` - Gestor de BD (Puerto 82)
- `portainer` - Gestor Docker (Puerto 4200)

---

## 🌐 Acceso al Sistema

### Paso 1: Configurar Archivo Hosts

Para acceder al sistema desde una estación de trabajo (NO desde el servidor Docker), debe configurar el archivo `hosts`.

**En Windows:**
```
Archivo: C:\Windows\System32\drivers\etc\hosts

Agregar la línea:
10.10.0.112    hack_tool
```

**En Linux/Mac:**
```bash
# Editar archivo hosts
sudo nano /etc/hosts

# Agregar la línea:
10.10.0.112    hack_tool
```

**Nota:** Reemplace `10.10.0.112` con la IP real de su servidor Docker.

### Paso 2: Identificar la IP del Servidor

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
URL: http://hack_tool:82/
Descripción: Administración de base de datos MySQL
```

#### 📊 Gestor de Contenedores (Portainer)
```
URL: http://10.10.0.112:4200/
Descripción: Gestión visual de Docker
```

---

## 🔑 Credenciales Iniciales

### ⚠️ IMPORTANTE: Cambiar Credenciales en el Primer Inicio

El sistema viene con credenciales por defecto que **DEBEN ser cambiadas inmediatamente** después de la primera instalación por razones de seguridad.

### Credenciales del Sistema Habilitador

**Página de Acceso:** `http://hack_tool:7777/login.html`

```
Usuario:    admin
Contraseña: admin123
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

### Credenciales de Portainer

**Página de Acceso:** `http://10.10.0.112:4200/`

```
En el primer acceso, Portainer solicitará crear un usuario administrador.
```

**🔴 ACCIÓN REQUERIDA:**
1. En el primer acceso, cree un usuario administrador con contraseña segura
2. Complete la configuración inicial
3. Guarde las credenciales en un lugar seguro

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
sudo ufw allow 4200/tcp   # Portainer (opcional)
sudo ufw allow 22/tcp     # SSH
sudo ufw enable

# Verificar reglas
sudo ufw status
```

#### ✅ Paso 5: Habilitar HTTPS (Opcional pero Recomendado)

Para producción, se recomienda usar un proxy inverso con SSL:

```bash
# Instalar Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Configurar proxy para el puerto 7777
sudo nano /etc/nginx/sites-available/sistema-habilitador

# Contenido básico:
server {
    listen 80;
    server_name hack_tool;
    
    location / {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activar configuración
sudo ln -s /etc/nginx/sites-available/sistema-habilitador /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtener certificado SSL (si tiene dominio público)
sudo certbot --nginx -d tu-dominio.com
```

#### ✅ Paso 6: Configurar Backups Automáticos

```bash
# Crear script de backup diario
sudo nano /usr/local/bin/backup-sistema-habilitador.sh

# Contenido del script:
#!/bin/bash
BACKUP_DIR="/backups/sistema-habilitador"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker exec sistema-habilitador-db mysqldump -u root -pquanium sisthabpro > "$BACKUP_DIR/sisthabpro_$DATE.sql"

# Backup de evidencias
cd /ruta/al/sistema-habilitador/Scripts
./copiar_evidencias.sh

# Rotar backups (mantener últimos 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-sistema-habilitador.sh

# Crear tarea programada
sudo crontab -e

# Agregar línea (backup diario a las 2 AM):
0 2 * * * /usr/local/bin/backup-sistema-habilitador.sh
```

### Recomendaciones Adicionales de Seguridad

1. **Actualizar Regularmente:**
   ```bash
   cd sistema-habilitador
   git pull origin main
   docker-compose down
   docker-compose up -d --build
   ```

2. **Monitorear Logs:**
   ```bash
   # Ver logs en tiempo real
   docker logs -f sistema-habilitador-web
   
   # Buscar errores
   docker logs sistema-habilitador-web | grep -i error
   ```

3. **Limitar Acceso:**
   - Usar VPN para acceso remoto
   - Configurar autenticación de dos factores (2FA)
   - Implementar lista blanca de IPs

4. **Auditoría:**
   - Revisar usuarios activos mensualmente
   - Auditar cambios en la base de datos
   - Monitorear intentos de acceso fallidos

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
./sist_hab_prod_desinstalar.sh
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

## 💾 Copias de Respaldo

### Realizar Backup Completo

#### Paso 1: Backup de Base de Datos

**Método A - Usando PhpMyAdmin (Interfaz Gráfica):**
1. Acceder a: `http://hack_tool:82/`
2. Iniciar sesión con credenciales de root
3. Seleccionar base de datos `sisthabpro`
4. Click en pestaña **"Exportar"**
5. Seleccionar método: **"Rápido"**
6. Formato: **"SQL"**
7. Click en botón **"Exportar"**
8. Guardar archivo `sisthabpro.sql`
9. Repetir para base de datos `seguridadapi`

**Método B - Usando Línea de Comandos (Recomendado):**
```bash
# Backup de base de datos principal
docker exec sistema-habilitador-db mysqldump \
  -u root -pquanium sisthabpro > sisthabpro_backup_$(date +%Y%m%d).sql

# Backup de base de datos API
docker exec sistema-habilitador-db mysqldump \
  -u root -pquanium seguridadapi > seguridadapi_backup_$(date +%Y%m%d).sql

# Comprimir backups
tar -czf db_backup_$(date +%Y%m%d).tar.gz *.sql
```

#### Paso 2: Backup de Evidencias/Imágenes

```bash
# Ingresar a la carpeta Scripts
cd /ruta/al/sistema-habilitador/Scripts

# Ejecutar script de backup
./copiar_evidencias.sh

# Seguir las instrucciones en pantalla
# El script creará un archivo backup.zip con todas las imágenes
```

**El script realizará:**
1. Localiza la carpeta de evidencias dentro del volumen Docker
2. Comprime todas las imágenes
3. Guarda el archivo `backup.zip` en la ubicación especificada

#### Paso 3: Backup de Configuración

```bash
# Copiar archivo de configuración
cp /ruta/al/sistema-habilitador/.env .env_backup_$(date +%Y%m%d)

# Backup de docker-compose
cp /ruta/al/sistema-habilitador/compose.yaml compose_backup_$(date +%Y%m%d).yaml
```

#### Paso 4: Crear Backup Completo

```bash
# Crear directorio de backup
mkdir -p /backups/sistema-habilitador/$(date +%Y%m%d)

# Copiar todos los archivos de backup
cp sisthabpro_backup_*.sql /backups/sistema-habilitador/$(date +%Y%m%d)/
cp seguridadapi_backup_*.sql /backups/sistema-habilitador/$(date +%Y%m%d)/
cp backup.zip /backups/sistema-habilitador/$(date +%Y%m%d)/
cp .env_backup_* /backups/sistema-habilitador/$(date +%Y%m%d)/
cp compose_backup_*.yaml /backups/sistema-habilitador/$(date +%Y%m%d)/

# Comprimir todo
cd /backups/sistema-habilitador/
tar -czf sistema_habilitador_full_backup_$(date +%Y%m%d).tar.gz $(date +%Y%m%d)/

# Mover a ubicación segura (ejemplo: servidor remoto)
scp sistema_habilitador_full_backup_*.tar.gz usuario@servidor-backup:/ruta/backups/
```

### Restaurar desde Backup

#### Paso 1: Preparar Servidor Web para Evidencias

En una máquina con Windows (usando XAMPP):

```
1. Instalar XAMPP desde https://www.apachefriends.org/
2. Iniciar el módulo Apache
3. Copiar backup.zip a: C:\xampp\htdocs\
4. Anotar la IP de la máquina Windows: 192.168.1.100 (ejemplo)
```

#### Paso 2: Restaurar Evidencias/Imágenes

```bash
# Desde el servidor Docker, en la carpeta Scripts/
cd /ruta/al/sistema-habilitador/Scripts

# Ejecutar script de restauración
./reestablecer_evidencias.sh

# Cuando solicite la URL, proporcionar:
http://192.168.1.100/backup.zip
```

**El script realizará:**
1. Descarga el archivo backup.zip desde el servidor web
2. Extrae las imágenes
3. Las restaura en el volumen Docker correspondiente
4. Verifica la integridad de los archivos

#### Paso 3: Restaurar Base de Datos

**Método A - Usando PhpMyAdmin:**

1. Acceder a: `http://hack_tool:82/`
2. Iniciar sesión
3. **Eliminar** base de datos existente `sisthabpro` (si existe)
4. Crear nueva base de datos:
   - Nombre: `sisthabpro`
   - Cotejamiento: `utf8mb4_unicode_ci`
5. Seleccionar la base de datos `sisthabpro`
6. Click en pestaña **"Importar"**
7. Click en **"Elegir archivo"**
8. Seleccionar archivo `sisthabpro.sql`
9. Click en **"Importar"**
10. Esperar confirmación de éxito
11. Repetir proceso para `seguridadapi`

**Método B - Usando Línea de Comandos (Recomendado):**

```bash
# Restaurar base de datos principal
docker exec -i sistema-habilitador-db mysql \
  -u root -pquanium sisthabpro < sisthabpro_backup.sql

# Restaurar base de datos API
docker exec -i sistema-habilitador-db mysql \
  -u root -pquanium seguridadapi < seguridadapi_backup.sql

# Verificar restauración
docker exec sistema-habilitador-db mysql \
  -u root -pquanium -e "USE sisthabpro; SHOW TABLES;"
```

#### Paso 4: Verificar Restauración

```bash
# Reiniciar contenedores
cd Scripts/
./restart-container.sh

# Verificar logs
docker logs sistema-habilitador-web

# Acceder al sistema y verificar:
# - Login funciona correctamente
# - Los datos están presentes
# - Las imágenes se visualizan
```

---

## 🔧 Resolución de Problemas

### Problema: No puedo acceder a http://hack_tool:7777/

**Soluciones:**

1. **Verificar configuración de hosts:**
   ```bash
   # En Windows
   notepad C:\Windows\System32\drivers\etc\hosts
   
   # En Linux/Mac
   cat /etc/hosts | grep hack_tool
   ```
   Debe contener: `IP_DEL_SERVIDOR    hack_tool`

2. **Verificar que el contenedor esté corriendo:**
   ```bash
   docker ps | grep sistema-habilitador-web
   ```

3. **Verificar logs del contenedor:**
   ```bash
   docker logs sistema-habilitador-web
   ```

4. **Verificar conectividad:**
   ```bash
   # Desde la máquina cliente
   ping hack_tool
   telnet hack_tool 7777
   ```

5. **Reiniciar contenedores:**
   ```bash
   cd Scripts/
   ./restart-container.sh
   ```

### Problema: Error de conexión a base de datos

**Soluciones:**

1. **Verificar que MySQL esté corriendo:**
   ```bash
   docker ps | grep sistema-habilitador-db
   ```

2. **Verificar logs de MySQL:**
   ```bash
   docker logs sistema-habilitador-db
   ```

3. **Verificar credenciales en .env:**
   ```bash
   cat .env | grep DB_PASSWORD
   ```

4. **Verificar conexión desde el contenedor web:**
   ```bash
   docker exec -it sistema-habilitador-web /bin/bash
   mysql -h db -u root -pquanium -e "SHOW DATABASES;"
   exit
   ```

5. **Reiniciar solo el contenedor de BD:**
   ```bash
   docker restart sistema-habilitador-db
   ```

### Problema: Las imágenes no se cargan

**Soluciones:**

1. **Verificar volumen de imágenes:**
   ```bash
   docker volume ls | grep sistema-habilitador
   docker volume inspect sistema-habilitador_imagen_data
   ```

2. **Verificar permisos:**
   ```bash
   docker exec -it sistema-habilitador-web /bin/bash
   ls -la /app/src/publico/imagen4/
   chmod -R 755 /app/src/publico/imagen4/
   exit
   ```

3. **Verificar ruta en navegador:**
   - Abrir DevTools (F12)
   - Ver pestaña Network
   - Verificar respuesta de las imágenes

### Problema: Login no funciona

**Soluciones:**

1. **Verificar credenciales:**
   - Usuario: `admin`
   - Contraseña: `admin123` (inicial)

2. **Limpiar caché del navegador:**
   - Ctrl + Shift + Delete
   - Limpiar caché y cookies

3. **Verificar en modo incógnito:**
   - Abrir navegador en modo incógnito
   - Intentar login nuevamente

4. **Verificar JWT_SECRET en .env:**
   ```bash
   cat .env | grep JWT_SECRET
   ```

5. **Verificar logs del servidor:**
   ```bash
   docker logs sistema-habilitador-web | grep -i error
   ```

### Problema: PhpMyAdmin no carga

**Soluciones:**

1. **Verificar puerto 82:**
   ```bash
   docker ps | grep phpmyadmin
   netstat -tuln | grep 82
   ```

2. **Verificar URL correcta:**
   - Debe ser: `http://hack_tool:82/`
   - O: `http://IP_SERVIDOR:82/`

3. **Reiniciar PhpMyAdmin:**
   ```bash
   docker restart sistema-habilitador-phpmyadmin
   ```

### Problema: Contenedores no inician

**Soluciones:**

1. **Ver errores específicos:**
   ```bash
   docker-compose logs
   ```

2. **Verificar puertos disponibles:**
   ```bash
   sudo netstat -tuln | grep -E ':(7777|82|3306|4200)'
   ```

3. **Liberar puertos si están ocupados:**
   ```bash
   # Identificar proceso usando el puerto
   sudo lsof -i :7777
   
   # Detener proceso (reemplazar PID)
   sudo kill -9 PID
   ```

4. **Reconstruir desde cero:**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Problema: Espacio en disco lleno

**Soluciones:**

1. **Verificar espacio:**
   ```bash
   df -h
   du -sh /var/lib/docker/
   ```

2. **Limpiar Docker:**
   ```bash
   docker system prune -a --volumes -f
   ```

3. **Eliminar backups antiguos:**
   ```bash
   find /backups -name "*.sql" -mtime +30 -delete
   ```

### Problema: Rendimiento lento

**Soluciones:**

1. **Verificar recursos:**
   ```bash
   docker stats
   ```

2. **Aumentar límites de contenedor:**
   ```yaml
   # Editar compose.yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
   ```

3. **Optimizar base de datos:**
   ```sql
   OPTIMIZE TABLE nombre_tabla;
   ANALYZE TABLE nombre_tabla;
   ```

4. **Limpiar logs:**
   ```bash
   truncate -s 0 /var/lib/docker/containers/*/*-json.log
   ```

---

## 📞 Soporte y Contacto

### Información del Proyecto
- **Nombre:** Sistema Habilitador
- **Versión:** 1.1.0
- **Repositorio:** http://CualquierDominio:3000/agarcia/sistema-habilitador

### Recursos Adicionales
- **Documentación de Cambios:** Ver `CAMBIOS_SEGURIDAD.md`
- **Documentación de Docker:** https://docs.docker.com/
- **Documentación de MySQL:** https://dev.mysql.com/doc/

### Obtener Ayuda

1. **Revisar la documentación completa**
2. **Verificar logs