# CAMBIOS REALIZADOS - SISTEMA DE AUTENTICACIÓN Y CORRECCIONES

## Fecha: 2024
## Versión: 1.1.0

---

## 📋 RESUMEN DE PROBLEMAS CORREGIDOS

### 1. ✅ Problemas con el despliegue en Docker
- **Problema**: El contenedor MySQL se reiniciaba constantemente
- **Solución**: 
  - Ajustado el healthcheck de MySQL con más reintentos (10) y tiempo de inicio (60s)
  - Agregado comando de autenticación nativa en MySQL
  - Ordenados los scripts SQL de inicialización (01-sisthabpro.sql, 02-usuarios.sql)
  - Agregada red Docker específica para mejor aislamiento

### 2. ✅ Los usuarios no se almacenan en la base de datos
- **Problema**: No existía tabla de usuarios ni sistema de autenticación
- **Solución**:
  - Creada tabla `usuarios` con todos los campos necesarios
  - Creadas tablas adicionales: `sesiones` y `auditoria_usuarios`
  - Implementados procedimientos almacenados para gestión de usuarios
  - Agregados usuarios por defecto (admin y analista)

### 3. ✅ login.html no funciona
- **Problema**: No había backend para procesar el login
- **Solución**:
  - Implementado sistema completo de autenticación con JWT
  - Creados endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/captcha`
  - Implementado sistema de captcha funcional
  - Integrado bcrypt para hash seguro de contraseñas

### 4. ✅ Acceso sin validación de autenticación y autorización
- **Problema**: Se podía acceder directamente a index.html, seguridad.html sin autenticación
- **Solución**:
  - Implementado middleware de autenticación JWT
  - Protegidas todas las rutas `/api/*` excepto las públicas
  - Implementado middleware para proteger archivos HTML
  - Agregado sistema de roles (admin, analista, user, viewer)

### 5. ✅ Variable DB_HOST_API sin uso claro
- **Problema**: Variable DB_HOST_API=10.10.0.112 no se usaba y no estaba documentada
- **Solución**:
  - Eliminada del compose.yaml
  - Documentado que era una configuración legacy no implementada
  - Simplificada configuración de base de datos

### 6. ✅ Errores de conexión DNS
- **Problema**: Error "getaddrinfo EAI_AGAIN dbsh"
- **Solución**:
  - Mejorado depends_on con condition: service_healthy
  - Aumentado tiempo de espera de MySQL
  - Agregada red Docker específica para mejor resolución DNS

---

## 🔐 NUEVO SISTEMA DE AUTENTICACIÓN

### Middleware de Autenticación
Ubicación: `src/middleware/auth.js`

Funciones principales:
- `verifyToken`: Verifica token JWT
- `verifyRole`: Verifica roles específicos
- `generateToken`: Genera tokens JWT
- `verifyUserExists`: Verifica existencia y estado del usuario

### Rutas de Autenticación
Ubicación: `src/routes/login.js`

Endpoints implementados:
- `GET /api/auth/captcha` - Generar captcha
- `POST /api/auth/verify-captcha` - Verificar captcha
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/verify` - Verificar token válido

### Base de Datos - Tabla de Usuarios
Ubicación: `db/usuarios.sql`

Estructura de tabla `usuarios`:
```sql
- id (PK)
- username (UNIQUE)
- email (UNIQUE)
- password (hash bcrypt)
- nombre
- apellido
- role (admin, analista, user, viewer)
- activo
- fecha_creacion
- fecha_actualizacion
- ultimo_acceso
- intentos_fallidos
- bloqueado_hasta
```

---

## 👥 USUARIOS POR DEFECTO

### Usuario Administrador
- **Username**: `admin`
- **Password**: `Admin2024!`
- **Role**: `admin`
- **Email**: `admin@sistemahabilitador.com`

### Usuario Analista
- **Username**: `analista`
- **Password**: `Analista2024!`
- **Role**: `analista`
- **Email**: `analista@sistemahabilitador.com`

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en el primer uso en producción

---

## 🔧 NUEVAS DEPENDENCIAS

Agregadas al `package.json`:
- `bcrypt`: ^5.1.0 - Hash seguro de contraseñas
- `express-rate-limit`: ^6.7.0 - Limitación de peticiones
- `express-session`: ^1.17.3 - Gestión de sesiones
- `dotenv`: ^16.0.3 - Variables de entorno

---

## 📊 SCRIPT DE LOGS

### Nuevo Script: `Scripts/extraer_logs.sh`

Funcionalidades:
1. Extraer logs de todos los contenedores
2. Extraer logs individuales por contenedor
3. Ver logs en tiempo real (seguimiento)
4. Extraer logs de instalación/build
5. Generar información del sistema
6. Diagnóstico automático de problemas
7. Generar reporte completo comprimido

**Uso**:
```bash
cd Scripts
./extraer_logs.sh
```

El script crea directorio `logs_exportados/` con todos los logs.

---

## 🐳 CAMBIOS EN DOCKER

### compose.yaml
- Eliminada variable `DB_HOST_API` y relacionadas
- Agregada red `sistema-habilitador-network`
- Mejorados healthchecks de todos los servicios
- Agregado montaje de `usuarios.sql` en inicialización
- Configuradas variables de entorno para JWT

### Dockerfile
- Instalado `wget` para healthcheck
- Actualizada versión de npm a 9.8.1 (compatible con Node 18.16.1)
- Optimizado para producción con `npm install --production`
- Creado directorio de imágenes automáticamente

---

## 🔒 RUTAS PROTEGIDAS vs PÚBLICAS

### Rutas Públicas (No requieren autenticación):
- `/login.html`
- `/api/health`
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/captcha`
- `/api/auth/verify-captcha`

### Rutas Protegidas (Requieren token JWT):
- `/index.html`
- `/seguridad.html`
- `/api/seguridad_def/*`
- `/api/evidencia/*`
- Todos los demás endpoints `/api/*`

---

## 📝 CÓMO USAR EL SISTEMA DE AUTENTICACIÓN

### 1. Login desde Frontend
```javascript
// Obtener captcha
fetch('/api/auth/captcha')
  .then(res => res.json())
  .then(data => {
    // Mostrar imagen: data.image
    // Guardar ID: data.captchaId
  });

// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'Admin2024!',
    captchaId: captchaId,
    captchaValue: captchaValue
  })
})
.then(res => res.json())
.then(data => {
  // Guardar token: localStorage.setItem('token', data.token)
});
```

### 2. Usar Token en Peticiones
```javascript
fetch('/api/seguridad_def/combo/squads', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
```

### 3. Verificar Autenticación
```javascript
fetch('/api/auth/verify', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})
```

---

## 🛠️ HERRAMIENTAS ADICIONALES

### Generar Hash de Contraseña
Script: `Scripts/generar_hash_password.js`

**Uso**:
```bash
# En el contenedor
docker exec -it sist-hab-prod node Scripts/generar_hash_password.js "MiPassword123"

# O modo interactivo
docker exec -it sist-hab-prod node Scripts/generar_hash_password.js
```

---

## 🚀 INSTRUCCIONES DE DESPLIEGUE

### 1. Detener contenedores existentes
```bash
docker-compose down -v
```

### 2. Limpiar imágenes antiguas (opcional)
```bash
docker rmi sistema-habilitador-prod:latest
```

### 3. Desplegar con nuevo código
```bash
cd Scripts
./sist_hab_prod_instalar_sin_docker.sh
```

### 4. Verificar logs
```bash
./extraer_logs.sh
# Seleccionar opción 9 (Reporte completo + diagnóstico)
```

### 5. Verificar servicios
- Aplicación: http://localhost:7777/ (redirige a login)
- Health check: http://localhost:7777/api/health
- phpMyAdmin: http://localhost:82/
- Draw.io: http://localhost:83/

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Si MySQL no inicia:
```bash
# Ver logs
docker logs sist-hab-db-prod

# Verificar volumen
docker volume inspect sistema-habilitador_mysql_data

# Recrear desde cero
docker-compose down -v
docker-compose up -d
```

### Si la aplicación no conecta a MySQL:
```bash
# Verificar conectividad
docker exec sist-hab-prod ping dbsh

# Verificar variables de entorno
docker exec sist-hab-prod env | grep DB_

# Ver logs de la app
docker logs sist-hab-prod
```

### Si no se puede hacer login:
```bash
# Verificar tabla de usuarios
docker exec sist-hab-db-prod mysql -u root -pquanium -e "SELECT id, username, email, role, activo FROM sisthabpro.usuarios;"

# Recrear usuarios
docker exec sist-hab-db-prod mysql -u root -pquanium sisthabpro < /docker-entrypoint-initdb.d/02-usuarios.sql
```

---

## 📚 ARCHIVOS MODIFICADOS/CREADOS

### Archivos Nuevos:
- `src/middleware/auth.js` - Middleware de autenticación
- `db/usuarios.sql` - Tabla de usuarios y procedimientos
- `Scripts/extraer_logs.sh` - Script de logs
- `Scripts/generar_hash_password.js` - Generador de hashes
- `CAMBIOS_AUTENTICACION.md` - Este documento

### Archivos Modificados:
- `src/index.js` - Integración de autenticación
- `src/routes/login.js` - Implementación completa de login
- `package.json` - Nuevas dependencias
- `compose.yaml` - Configuración mejorada
- `Dockerfile` - Optimizaciones

---

## ⚠️ NOTAS IMPORTANTES

1. **Cambiar contraseñas por defecto** en producción
2. **JWT_SECRET** debe ser única en producción (usar variable de entorno)
3. Los logs se almacenan en `logs_exportados/`
4. El captcha expira en 5 minutos
5. Los usuarios se bloquean después de 5 intentos fallidos (30 min)
6. Las sesiones JWT expiran en 8 horas por defecto

---

## 🔄 PRÓXIMOS PASOS RECOMENDADOS

1. [ ] Implementar interfaz de login en `login.html`
2. [ ] Agregar gestión de usuarios en el panel de administración
3. [ ] Implementar recuperación de contraseña
4. [ ] Agregar logs de auditoría en interfaz web
5. [ ] Implementar refresh tokens
6. [ ] Agregar autenticación de dos factores (2FA)
7. [ ] Configurar HTTPS con certificados SSL

---

## 📞 SOPORTE

Para problemas o dudas:
1. Revisar logs: `./Scripts/extraer_logs.sh`
2. Ejecutar diagnóstico: Opción 8 o 9 del script de logs
3. Verificar estado de contenedores: `docker ps -a`
4. Revisar este documento

---

**Documento generado automáticamente**
**Última actualización**: 2024