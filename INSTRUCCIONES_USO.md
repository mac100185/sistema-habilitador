# INSTRUCCIONES DE USO - SISTEMA HABILITADOR

## 🚀 INICIO RÁPIDO

### 1. Instalación del Sistema

```bash
cd /home/server/sistema-habilitador/Scripts
./sist_hab_prod_instalar_sin_docker.sh
```

**Tiempo estimado**: 5-10 minutos

### 2. Verificar la Instalación

```bash
cd /home/server/sistema-habilitador/Scripts
./verificar_instalacion.sh
```

Este script verificará:
- ✅ Contenedores Docker
- ✅ Base de datos MySQL
- ✅ Tabla de usuarios
- ✅ Aplicación web funcionando
- ✅ Conectividad entre servicios

### 3. Acceder al Sistema

**Aplicación Web**: http://localhost:7777/ o http://IP_SERVIDOR:7777/

**Credenciales por defecto**:

| Usuario   | Password        | Rol      |
|-----------|-----------------|----------|
| admin     | Admin2024!      | admin    |
| analista  | Analista2024!   | analista |

⚠️ **CAMBIAR ESTAS CONTRASEÑAS EN PRODUCCIÓN**

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Cómo Funciona

1. **Login**: Ingresar en `/login.html` con usuario y contraseña
2. **Token JWT**: El sistema genera un token válido por 8 horas
3. **Navegación**: El token se guarda localmente y se envía en cada petición
4. **Expiración**: Al expirar el token, se redirige automáticamente al login

### Roles de Usuario

- **admin**: Acceso completo a todas las funciones
- **analista**: Acceso a consultas y modificaciones
- **user**: Acceso a consultas básicas
- **viewer**: Solo visualización

### Rutas Protegidas

Todas las páginas HTML (excepto `login.html`) requieren autenticación.
Todas las rutas `/api/*` (excepto `/api/auth/*`) requieren token JWT.

---

## 📊 GESTIÓN DE LOGS

### Extraer Logs del Sistema

```bash
cd Scripts
./extraer_logs.sh
```

**Opciones disponibles**:
1. Extraer logs de todos los contenedores
2. Extraer logs de la aplicación
3. Extraer logs de MySQL
4. Ver logs en tiempo real
5. Generar reporte completo

Los logs se guardan en: `logs_exportados/`

### Ver Logs Individuales

```bash
# Ver logs de la aplicación
docker logs sist-hab-prod

# Ver logs de MySQL
docker logs sist-hab-db-prod

# Ver logs en tiempo real
docker logs -f sist-hab-prod
```

---

## 🔧 COMANDOS ÚTILES

### Gestión de Contenedores

```bash
# Ver estado de contenedores
docker ps -a

# Reiniciar aplicación
docker restart sist-hab-prod

# Reiniciar MySQL
docker restart sist-hab-db-prod

# Reiniciar todos los servicios
docker-compose restart

# Detener todos los servicios
docker-compose down

# Iniciar todos los servicios
docker-compose up -d
```

### Verificación de Salud

```bash
# Health check de la aplicación
curl http://localhost:7777/api/health

# Verificar conectividad MySQL
docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium

# Verificar tabla de usuarios
docker exec sist-hab-db-prod mysql -u root -pquanium -e "SELECT username, email, role FROM sisthabpro.usuarios;"
```

### Acceso a Base de Datos

```bash
# Conectar a MySQL desde línea de comandos
docker exec -it sist-hab-db-prod mysql -u root -pquanium sisthabpro

# Exportar base de datos
docker exec sist-hab-db-prod mysqldump -u root -pquanium sisthabpro > backup_$(date +%Y%m%d).sql

# Importar base de datos
docker exec -i sist-hab-db-prod mysql -u root -pquanium sisthabpro < backup.sql
```

---

## 👥 GESTIÓN DE USUARIOS

### Crear Nuevo Usuario (Desde MySQL)

```bash
docker exec -it sist-hab-db-prod mysql -u root -pquanium sisthabpro
```

```sql
-- Generar hash de contraseña primero usando el script
-- Luego insertar usuario
INSERT INTO usuarios (username, email, password, nombre, apellido, role, activo, fecha_creacion)
VALUES ('nuevo_usuario', 'email@example.com', 'HASH_BCRYPT', 'Nombre', 'Apellido', 'user', 1, NOW());
```

### Generar Hash de Contraseña

```bash
docker exec -it sist-hab-prod node Scripts/generar_hash_password.js "MiPassword123"
```

O modo interactivo:
```bash
docker exec -it sist-hab-prod node Scripts/generar_hash_password.js
```

### Cambiar Contraseña de Usuario

```bash
# 1. Generar nuevo hash
docker exec -it sist-hab-prod node Scripts/generar_hash_password.js "NuevaPassword"

# 2. Actualizar en base de datos
docker exec -it sist-hab-db-prod mysql -u root -pquanium sisthabpro -e \
"UPDATE usuarios SET password='NUEVO_HASH' WHERE username='admin';"
```

### Activar/Desactivar Usuario

```bash
# Desactivar
docker exec sist-hab-db-prod mysql -u root -pquanium -e \
"UPDATE sisthabpro.usuarios SET activo=0 WHERE username='usuario';"

# Activar
docker exec sist-hab-db-prod mysql -u root -pquanium -e \
"UPDATE sisthabpro.usuarios SET activo=1 WHERE username='usuario';"
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: MySQL no inicia

**Síntomas**: Contenedor `sist-hab-db-prod` se reinicia constantemente

**Solución**:
```bash
# Ver logs de MySQL
docker logs sist-hab-db-prod

# Recrear contenedor y volumen
docker-compose down -v
docker-compose up -d

# Esperar 2-3 minutos para que MySQL inicialice
```

### Problema: No se puede conectar a la base de datos

**Síntomas**: Error "getaddrinfo EAI_AGAIN dbsh"

**Solución**:
```bash
# Verificar que MySQL esté corriendo
docker ps | grep sist-hab-db-prod

# Verificar conectividad de red
docker exec sist-hab-prod ping -c 3 dbsh

# Reiniciar contenedor de aplicación
docker restart sist-hab-prod
```

### Problema: Tabla de usuarios no existe

**Síntomas**: Error al hacer login, tabla 'usuarios' no existe

**Solución**:
```bash
# Ejecutar script de usuarios
docker exec sist-hab-db-prod mysql -u root -pquanium sisthabpro < /docker-entrypoint-initdb.d/02-usuarios.sql

# O desde el host
docker cp db/usuarios.sql sist-hab-db-prod:/tmp/usuarios.sql
docker exec sist-hab-db-prod mysql -u root -pquanium sisthabpro -e "source /tmp/usuarios.sql"
```

### Problema: Login no funciona

**Síntomas**: No se puede iniciar sesión con credenciales correctas

**Solución**:
```bash
# 1. Verificar que la tabla de usuarios existe
docker exec sist-hab-db-prod mysql -u root -pquanium -e "SHOW TABLES FROM sisthabpro LIKE 'usuarios';"

# 2. Verificar usuarios existentes
docker exec sist-hab-db-prod mysql -u root -pquanium -e "SELECT username, email, role, activo FROM sisthabpro.usuarios;"

# 3. Recrear usuarios por defecto
docker exec sist-hab-db-prod mysql -u root -pquanium sisthabpro < /docker-entrypoint-initdb.d/02-usuarios.sql
```

### Problema: Página se queda cargando

**Síntomas**: La aplicación no responde o se queda en blanco

**Solución**:
```bash
# Verificar que la aplicación esté corriendo
docker logs sist-hab-prod | tail -20

# Verificar health check
curl http://localhost:7777/api/health

# Reiniciar aplicación
docker restart sist-hab-prod
```

### Problema: "Session expired" constantemente

**Síntomas**: El sistema pide login continuamente

**Solución**:
1. Limpiar caché del navegador
2. Borrar localStorage:
   - Abrir consola del navegador (F12)
   - Ejecutar: `localStorage.clear()`
3. Verificar que JWT_SECRET no haya cambiado

---

## 📦 SERVICIOS DISPONIBLES

### Aplicación Principal
- **URL**: http://localhost:7777/
- **Descripción**: Sistema de gestión de habilitadores de seguridad
- **Puerto**: 7777

### phpMyAdmin
- **URL**: http://localhost:82/
- **Usuario**: root
- **Contraseña**: quanium
- **Base de datos**: sisthabpro

### Draw.io
- **HTTP**: http://localhost:83/
- **HTTPS**: http://localhost:84/
- **Modo offline**: Agregar `?offline=1` a la URL

---

## 🔄 ACTUALIZACIÓN DEL SISTEMA

### Actualizar desde Git

```bash
# 1. Detener servicios
docker-compose down

# 2. Actualizar código
git pull origin main

# 3. Reconstruir imagen
docker-compose build --no-cache

# 4. Iniciar servicios
docker-compose up -d

# 5. Verificar
./Scripts/verificar_instalacion.sh
```

### Actualizar Solo la Aplicación

```bash
# Detener aplicación
docker stop sist-hab-prod

# Reconstruir imagen
docker build -t sistema-habilitador-prod:latest .

# Reiniciar aplicación
docker start sist-hab-prod
```

---

## 📚 ARCHIVOS IMPORTANTES

### Configuración
- `compose.yaml` - Configuración de Docker Compose
- `Dockerfile` - Definición de la imagen Docker
- `package.json` - Dependencias de Node.js

### Base de Datos
- `db/sisthabpro.sql` - Estructura principal de BD
- `db/usuarios.sql` - Tabla de usuarios y procedimientos

### Scripts
- `Scripts/sist_hab_prod_instalar_sin_docker.sh` - Instalación completa
- `Scripts/extraer_logs.sh` - Extracción de logs
- `Scripts/verificar_instalacion.sh` - Verificación del sistema
- `Scripts/generar_hash_password.js` - Generador de hashes

### Código Fuente
- `src/index.js` - Punto de entrada de la aplicación
- `src/middleware/auth.js` - Middleware de autenticación
- `src/routes/login.js` - Rutas de autenticación
- `src/routes/seguridad_defen.js` - Rutas principales

### Documentación
- `CAMBIOS_AUTENTICACION.md` - Detalles del sistema de autenticación
- `INSTRUCCIONES_USO.md` - Este archivo
- `README.md` - Documentación general

---

## 🔒 SEGURIDAD

### Recomendaciones para Producción

1. **Cambiar credenciales por defecto**:
   - Usuarios: admin y analista
   - Contraseña de MySQL: quanium

2. **Configurar JWT_SECRET único**:
   ```bash
   # Editar compose.yaml
   JWT_SECRET=mi-secreto-super-seguro-y-unico-2024
   ```

3. **Usar HTTPS**:
   - Configurar certificados SSL
   - Usar proxy reverso (Nginx/Apache)

4. **Limitar acceso a puertos**:
   - Solo exponer puerto 7777 (aplicación)
   - Puertos 3306, 82, 83, 84 solo en red interna

5. **Backups regulares**:
   ```bash
   # Backup diario automático
   docker exec sist-hab-db-prod mysqldump -u root -pquanium sisthabpro > backup_$(date +%Y%m%d).sql
   ```

6. **Monitorear logs**:
   ```bash
   # Ejecutar diariamente
   ./Scripts/extraer_logs.sh
   ```

---

## 📞 SOPORTE Y AYUDA

### Diagnóstico Rápido

```bash
# Ejecutar verificación completa
./Scripts/verificar_instalacion.sh

# Generar reporte de logs
./Scripts/extraer_logs.sh
# Seleccionar opción 9: Reporte completo
```

### Información del Sistema

```bash
# Estado general
docker ps -a
docker stats --no-stream

# Uso de espacio
docker system df

# Logs recientes
docker logs --tail 50 sist-hab-prod
```

### Documentos de Referencia

- **CAMBIOS_AUTENTICACION.md**: Sistema de autenticación en detalle
- **CAMBIOS_SEGURIDAD.md**: Medidas de seguridad implementadas
- **README.md**: Documentación general del proyecto

---

## 📝 NOTAS ADICIONALES

### Variables de Entorno Importantes

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| DB_HOST | Host de MySQL | dbsh |
| DB_PORT | Puerto de MySQL | 3306 |
| DB_USER | Usuario de MySQL | quanium |
| DB_PASSWORD | Contraseña de MySQL | quanium |
| DB_NAME | Nombre de BD | sisthabpro |
| PORT | Puerto de la app | 7777 |
| NODE_ENV | Ambiente | production |
| JWT_SECRET | Secreto JWT | (cambiar en prod) |
| JWT_EXPIRES_IN | Expiración JWT | 8h |

### Puertos Utilizados

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 7777 | Aplicación | Sistema Habilitador |
| 3306 | MySQL | Base de datos |
| 82 | phpMyAdmin | Gestión de BD |
| 83 | Draw.io | Diagramas (HTTP) |
| 84 | Draw.io | Diagramas (HTTPS) |

---

**Última actualización**: 2024  
**Versión del sistema**: 1.1.0  
**Compatible con**: Node.js 18.16.1, Docker 20+