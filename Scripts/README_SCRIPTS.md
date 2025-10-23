# Scripts del Sistema Habilitador

Este directorio contiene scripts para la gestión, instalación, diagnóstico y extracción de logs del Sistema Habilitador.

## 📋 Índice

- [Scripts de Instalación](#scripts-de-instalación)
- [Scripts de Logs y Diagnóstico](#scripts-de-logs-y-diagnóstico)
- [Scripts de Gestión](#scripts-de-gestión)
- [Scripts de Corrección de Login](#scripts-de-corrección-de-login)
- [Solución de Problemas](#solución-de-problemas)

---

## 🔐 Scripts de Corrección de Login

### `generate_correct_hashes.js` ⚠️ IMPORTANTE
**Propósito:** Genera los hashes bcrypt correctos para las contraseñas Admin2024! y Analista2024!

**Cuándo usar:** Si no puedes hacer login con las credenciales documentadas.

**Uso:**
```bash
# Generar hashes correctos
docker exec sist-hab-prod node Scripts/generate_correct_hashes.js

# El script mostrará los comandos SQL UPDATE que debes ejecutar
```

### `fix_login_passwords.sh`
**Propósito:** Script automático que actualiza las contraseñas en la base de datos.

**Uso:**
```bash
cd Scripts
./fix_login_passwords.sh
```

### Solución Manual de Login
Si los scripts anteriores no funcionan, usa este proceso manual:

**Paso 1:** Generar hashes correctos
```bash
docker exec sist-hab-prod node Scripts/generate_correct_hashes.js > hashes.txt
```

**Paso 2:** Actualizar base de datos
```bash
# Conectar a MySQL
docker exec -it sist-hab-db-prod mysql -u root -pquanium sisthabpro

# Ejecutar los UPDATE que genera el script
# Ejemplo:
# UPDATE usuarios SET password = '$2b$10$...' WHERE username = 'admin';
# UPDATE usuarios SET password = '$2b$10$...' WHERE username = 'analista';
# COMMIT;
```

**Paso 3:** Verificar
```bash
curl -X POST http://localhost:7777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2024!"}'
```

---

## 🚀 Scripts de Instalación

### `build_seguro.sh` ⭐ RECOMENDADO
**Propósito:** Script mejorado para build robusto con manejo de errores GPG y verificación completa.

**Características:**
- ✅ Verifica requisitos del sistema
- ✅ Limpia builds anteriores
- ✅ Maneja errores de GPG de repositorios Debian
- ✅ Captura logs detallados del proceso
- ✅ Verifica imagen creada
- ✅ Inicia y verifica contenedores
- ✅ Análisis automático de errores

**Uso:**
```bash
cd Scripts
./build_seguro.sh
```

**Proceso:**
1. Verificación de requisitos (Docker, Docker Compose, espacio en disco)
2. Limpieza de imágenes y contenedores anteriores
3. Build de la imagen con logs detallados
4. Verificación de la imagen creada
5. Inicio de todos los contenedores
6. Verificación de servicios (MySQL, aplicación)
7. Reporte final de estado

**Logs generados:**
- `logs_exportados/build_seguro_YYYYMMDD_HHMMSS.log`

---

### `sist_hab_prod_instalar.sh`
**Propósito:** Instalación estándar del sistema completo.

**Uso:**
```bash
cd Scripts
./sist_hab_prod_instalar.sh
```

---

### `sist_hab_prod_instalar_sin_docker.sh`
**Propósito:** Instalación sin necesidad de tener Docker previamente instalado.

**Uso:**
```bash
cd Scripts
./sist_hab_prod_instalar_sin_docker.sh
```

---

## 📊 Scripts de Logs y Diagnóstico

### `extraer_logs.sh` ⭐ PRINCIPAL
**Propósito:** Extractor completo de logs con múltiples opciones y diagnóstico automático.

**Características:**
- Extracción de logs de todos los contenedores
- Logs de instalación y build
- Logs de npm dentro del contenedor
- Información del sistema
- Logs de Docker daemon
- Diagnóstico automático de problemas
- Seguimiento en tiempo real
- Generación de reportes completos

**Uso:**
```bash
cd Scripts
./extraer_logs.sh
```

**Menú interactivo:**
```
1) Extraer logs de todos los contenedores
2) Extraer logs del contenedor de aplicación (sist-hab-prod)
3) Extraer logs del contenedor de base de datos (sist-hab-db-prod)
4) Extraer logs del contenedor de phpMyAdmin (sist-hab-phpmyadmin-prod)
5) Extraer logs del contenedor de Draw.io (sist-hab-drawio-prod)
6) Extraer logs de instalación/build de imágenes Docker
7) Ver logs en tiempo real (seguimiento)
8) Extraer información del sistema y estado de contenedores
9) Generar reporte completo (logs + estado + diagnóstico) ⭐
10) Extraer logs de instalación npm dentro del contenedor
11) Verificar dependencias de Node instaladas
12) Extraer logs de Docker daemon y sistema
0) Salir
```

**Opción recomendada para problemas:**
- Opción 9: Genera un reporte completo con toda la información necesaria para diagnóstico

**Logs generados:**
- `logs_exportados/logs_TIMESTAMP_<contenedor>.log` - Logs de cada contenedor
- `logs_exportados/logs_TIMESTAMP_build_installation.log` - Logs de build
- `logs_exportados/logs_TIMESTAMP_npm_installation.log` - Logs de npm
- `logs_exportados/logs_TIMESTAMP_system_info.log` - Info del sistema
- `logs_exportados/logs_TIMESTAMP_docker_daemon.log` - Logs de Docker daemon
- `logs_exportados/logs_TIMESTAMP_diagnostico.log` - Diagnóstico automático
- `logs_exportados/reporte_completo_TIMESTAMP.tar.gz` - Archivo comprimido

---

### `extraer_logs_npm_build.sh`
**Propósito:** Especializado en logs de instalación de dependencias NPM durante el build.

**Características:**
- Extracción de logs de build anterior
- Build nuevo con captura detallada
- Análisis de errores de npm
- Verificación de dependencias instaladas
- Análisis de problemas de compilación de módulos nativos

**Uso:**
```bash
cd Scripts
./extraer_logs_npm_build.sh
```

**Menú:**
```
1) Verificar requisitos del sistema
2) Extraer logs del build anterior
3) Hacer build nuevo con captura de logs
4) Limpiar builds anteriores
5) Build completo (limpiar + build + logs) ⭐
6) Ver logs de npm en contenedor actual
0) Salir
```

**Cuándo usar:**
- Errores durante `npm install`
- Problemas con módulos nativos (bcrypt, canvas)
- Verificar qué dependencias se instalaron
- Depurar errores de compilación

**Logs generados:**
- `logs_exportados/npm_build_TIMESTAMP.log`
- `logs_exportados/npm_build_realtime_TIMESTAMP.log`
- `logs_exportados/npm_container_TIMESTAMP.log`
- `logs_exportados/error_analysis_TIMESTAMP.log`

---

### `verificar_instalacion.sh`
**Propósito:** Verifica que la instalación esté completa y funcionando correctamente.

**Uso:**
```bash
cd Scripts
./verificar_instalacion.sh
```

**Verifica:**
- Estado de contenedores
- Conectividad de red
- Base de datos y tablas
- Aplicación respondiendo
- Puertos expuestos
- Dependencias de Node

---

## 🛠️ Scripts de Gestión

### `restart-container.sh`
**Propósito:** Reinicia un contenedor específico.

**Uso:**
```bash
cd Scripts
./restart-container.sh
```

---

### `stop-containers.sh`
**Propósito:** Detiene todos los contenedores del sistema.

**Uso:**
```bash
cd Scripts
./stop-containers.sh
```

---

### `sist_hab_prod_desinstalar.sh`
**Propósito:** Desinstala completamente el sistema (contenedores, imágenes, volúmenes).

**Uso:**
```bash
cd Scripts
./sist_hab_prod_desinstalar.sh
```

**⚠️ ADVERTENCIA:** Este script elimina todos los datos. Haga backup antes de ejecutar.

---

### `copiar_evidencias.sh`
**Propósito:** Copia evidencias/archivos del sistema.

**Uso:**
```bash
cd Scripts
./copiar_evidencias.sh
```

---

### `reestablecer_evidencias.sh`
**Propósito:** Restaura evidencias desde backup.

**Uso:**
```bash
cd Scripts
./reestablecer_evidencias.sh
```

---

## 🔧 Solución de Problemas

### Problema: Error de GPG durante el build
```
Error: At least one invalid signature was encountered
```

**Solución:**
1. Usar el nuevo `build_seguro.sh`:
```bash
cd Scripts
./build_seguro.sh
```

2. El Dockerfile ha sido corregido con:
   - Actualización de ca-certificates
   - Instalación de gnupg
   - Limpieza de listas de apt
   - Uso de `--allow-releaseinfo-change`

---

### Problema: Contenedores no inician
**Solución:**
1. Extraer logs para diagnóstico:
```bash
cd Scripts
./extraer_logs.sh
# Seleccionar opción 9 (Reporte completo)
```

2. Revisar logs específicos:
```bash
docker logs sist-hab-prod
docker logs sist-hab-db-prod
```

3. Verificar instalación:
```bash
./verificar_instalacion.sh
```

---

### Problema: Errores en instalación de npm
**Solución:**
1. Usar script especializado:
```bash
cd Scripts
./extraer_logs_npm_build.sh
# Seleccionar opción 5 (Build completo)
```

2. Revisar dependencias instaladas:
```bash
./extraer_logs.sh
# Seleccionar opción 11 (Verificar dependencias)
```

3. Verificar conectividad a NPM registry:
```bash
ping registry.npmjs.org
```

---

### Problema: Aplicación no responde en puerto 7777
**Solución:**
1. Verificar estado del contenedor:
```bash
docker ps -a
docker logs sist-hab-prod
```

2. Verificar health check:
```bash
curl http://localhost:7777/api/health
```

3. Verificar puertos:
```bash
netstat -tuln | grep 7777
# o
ss -tuln | grep 7777
```

4. Revisar logs de la aplicación:
```bash
cd Scripts
./extraer_logs.sh
# Opción 2 (Logs de aplicación)
```

---

### Problema: Base de datos no conecta
**Solución:**
1. Verificar MySQL:
```bash
docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium
```

2. Verificar tablas:
```bash
docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SHOW TABLES;"
```

3. Revisar logs de base de datos:
```bash
cd Scripts
./extraer_logs.sh
# Opción 3 (Logs de base de datos)
```

---

## 📁 Directorio de Logs

Todos los logs se guardan en:
```
Scripts/logs_exportados/
```

**Estructura típica:**
```
logs_exportados/
├── logs_20251022_032753_sist-hab-prod.log
├── logs_20251022_032753_sist-hab-db-prod.log
├── logs_20251022_032753_build_installation.log
├── logs_20251022_032753_npm_installation.log
├── logs_20251022_032753_system_info.log
├── logs_20251022_032753_docker_daemon.log
├── logs_20251022_032753_diagnostico.log
└── reporte_completo_20251022_032753.tar.gz
```

---

## 🎯 Flujo de Trabajo Recomendado

### Primera Instalación
```bash
cd Scripts
./build_seguro.sh
```

### Verificar Instalación
```bash
./verificar_instalacion.sh
```

### Si hay problemas
```bash
./extraer_logs.sh
# Opción 9: Reporte completo
```

### Para problemas específicos de npm
```bash
./extraer_logs_npm_build.sh
# Opción 5: Build completo
```

### Reinstalación completa
```bash
./sist_hab_prod_desinstalar.sh
./build_seguro.sh
```

---

## 📝 Notas Importantes

1. **Permisos de ejecución:** Todos los scripts tienen permisos de ejecución. Si no los tienen:
```bash
chmod +x *.sh
```

2. **Directorio de trabajo:** Ejecute los scripts desde el directorio `Scripts/`

3. **Logs:** Los logs se acumulan. Limpie periódicamente:
```bash
rm -rf logs_exportados/*
```

4. **Versión de Node:** El sistema está configurado para Node 18.16.1 específicamente

5. **Espacios en disco:** El build requiere al menos 5GB de espacio libre

---

## 🆘 Soporte

Si ninguna de las soluciones funciona:

1. Generar reporte completo:
```bash
cd Scripts
./extraer_logs.sh  # Opción 9
```

2. Enviar el archivo comprimido generado:
```
logs_exportados/reporte_completo_TIMESTAMP.tar.gz
```

3. Incluir información del sistema:
```bash
uname -a
docker --version
docker compose version
```

---

## 📚 Documentación Adicional

- `CAMBIOS_AUTENTICACION.md` - Sistema de autenticación
- `CAMBIOS_SEGURIDAD.md` - Mejoras de seguridad
- `INSTRUCCIONES_USO.md` - Manual de usuario
- `README.md` - Información general del proyecto

---

**Última actualización:** Octubre 2025
**Versión de scripts:** 2.0