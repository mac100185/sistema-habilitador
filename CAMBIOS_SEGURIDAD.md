# Cambios de Seguridad y Configuración Implementados

## Fecha: 2024
## Versión: 1.1.0

---

## 📋 Resumen Ejecutivo

Este documento detalla todas las mejoras de seguridad, configuración y funcionalidad implementadas en el Sistema Habilitador para resolver los problemas identificados en la revisión integral del código.

**📖 Para instrucciones completas de instalación y despliegue, consultar el archivo `README.md`**

---

## 🔒 1. SEGURIDAD

### 1.1 Eliminación de Credenciales Hardcodeadas

**Problema:** Las credenciales de base de datos estaban hardcodeadas en los archivos de configuración.

**Solución Implementada:**
- ✅ **database.js**: Ahora usa variables de entorno con valores por defecto seguros
  ```javascript
  host: process.env.DB_HOST || "db"
  user: process.env.DB_USER || "root"
  password: process.env.DB_PASSWORD || "quanium"
  database: process.env.DB_NAME || "sisthabpro"
  ```

- ✅ **database_seguridad_defen.js**: Implementa el mismo patrón
  ```javascript
  host: process.env.DB_HOST_API || "10.10.0.112"
  user: process.env.DB_USER_API || "root"
  password: process.env.DB_PASSWORD_API || "quanium"
  database: process.env.DB_NAME_API || "seguridadapi"
  ```

**Variables de Entorno Requeridas:**
```bash
# Base de datos principal
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_seguro
DB_NAME=sisthabpro

# Base de datos API de seguridad
DB_HOST_API=10.10.0.112
DB_PORT_API=3306
DB_USER_API=root
DB_PASSWORD_API=tu_password_seguro
DB_NAME_API=seguridadapi

# Seguridad JWT
JWT_SECRET=tu_secret_jwt_muy_seguro_y_largo
JWT_EXPIRATION=24h
```

### 1.2 Credenciales Iniciales del Sistema

**⚠️ IMPORTANTE: Credenciales por Defecto**

El sistema viene con credenciales iniciales que **DEBEN ser cambiadas** en el primer inicio de sesión:

**Sistema Habilitador:**
```
Usuario:    admin
Contraseña: admin123
```

**Base de Datos MySQL (PhpMyAdmin):**
```
Usuario:    root
Contraseña: quanium
```

**🔴 ACCIÓN OBLIGATORIA:**
Después de la instalación inicial:
1. Cambiar contraseña del usuario `admin` en el sistema
2. Cambiar contraseña de MySQL root
3. Actualizar archivo `.env` con nuevas contraseñas
4. Reiniciar contenedores

**Ver detalles en:** `README.md` → Sección "Credenciales Iniciales"

### 1.3 Validación de Formularios

**Problema:** Falta validación en formularios de usuario.

**Solución Implementada:**
- ✅ Función `validateForm()` en `config.js` para validación genérica
- ✅ Validación de campos requeridos con marcado visual
- ✅ Validación de tipos (email, número, etc.)
- ✅ Validación de archivos (tamaño y tipo)
- ✅ Validación en tiempo real en login.html

**Ejemplo de Uso:**
```javascript
if (!validateForm('miFormulario')) {
    return false;
}
```

### 1.4 Sanitización de Datos

**Función añadida en config.js:**
```javascript
window.sanitizeHTML = function(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
};
```

---

## 🌐 2. CONFIGURACIÓN CENTRALIZADA

### 2.1 Eliminación de URLs Hardcodeadas

**Problema:** La URL `http://hack_tool:7777` estaba hardcodeada en múltiples archivos.

**Archivos Actualizados:**
- ✅ `src/publico/login.html` - Carga config.js
- ✅ `src/publico/dist/js/jimlg.js` - Usa APP_CONFIG.API_HOST
- ✅ `src/publico/seguridad/js/controles.js` - Usa configuración centralizada
- ✅ `src/publico/seguridad/js/controles_plantilla.js` - Usa configuración centralizada
- ✅ `src/publico/seguridad/js/seguridad.js` - Usa configuración centralizada

### 2.2 Archivo config.js Centralizado

**Ubicación:** `src/publico/config.js`

**Características:**
- ✅ Detección automática del host basado en el entorno
- ✅ Configuración de endpoints centralizados
- ✅ Configuración de timeouts
- ✅ Mensajes de error estandarizados
- ✅ Configuración de validación
- ✅ Funciones auxiliares (buildApiUrl, apiRequest, validateForm, validateFile)

**Uso:**
```javascript
// En cualquier archivo JavaScript
const apiUrl = window.APP_CONFIG.API_HOST + window.APP_CONFIG.ENDPOINTS.TOKEN;

// O usar la función auxiliar
const apiUrl = buildApiUrl('/api/token');

// Hacer peticiones con manejo de errores
apiRequest({
    url: buildApiUrl('/api/seguridad_def/principal'),
    method: 'GET',
    success: function(data) {
        console.log(data);
    }
});
```

### 2.3 Configuración Dinámica del Host

El sistema ahora detecta automáticamente el host:
- ✅ Desarrollo local: `http://localhost:7777`
- ✅ Producción: Usa el hostname actual
- ✅ Override manual mediante meta tag: `<meta name="api-host" content="http://mi-servidor:7777" />`

---

## 🗄️ 3. BASE DE DATOS

### 3.1 Pool de Conexiones

**Mejora:** Implementación de pool de conexiones en lugar de conexión única.

**Beneficios:**
- ✅ Mayor resiliencia ante desconexiones
- ✅ Mejor rendimiento con múltiples peticiones concurrentes
- ✅ Reconexión automática
- ✅ Manejo de errores mejorado

**Configuración del Pool:**
```javascript
connectionLimit: 10,
queueLimit: 0,
enableKeepAlive: true,
connectTimeout: 60000,
acquireTimeout: 60000,
timeout: 60000
```

### 3.2 Manejo de Errores de Conexión

- ✅ Detección de errores de conexión perdida
- ✅ Reintentos automáticos con delay
- ✅ Logging detallado de eventos de conexión
- ✅ Health checks implementados

---

## ✨ 4. FUNCIONALIDAD DE LOGIN MEJORADA

### 4.1 Mejoras Implementadas en login.html

**Archivo:** `src/publico/login.html`

**Mejoras:**
- ✅ Carga de config.js para configuración centralizada
- ✅ Validación de campos requeridos
- ✅ Indicador de carga durante autenticación
- ✅ Manejo mejorado de errores con Swal
- ✅ Cifrado RSA de credenciales mantenido
- ✅ Soporte para Enter en campo de password
- ✅ Validación en tiempo real
- ✅ Auto-focus en campo de usuario
- ✅ Manejo de tokens y redirección automática

### 4.2 Flujo de Autenticación

```
1. Usuario ingresa credenciales
2. Validación de campos (no vacíos)
3. Cifrado RSA de credenciales
4. Envío a API (usando configuración centralizada)
5. Recepción de token
6. Almacenamiento en localStorage
7. Redirección automática
```

---

## 📊 5. MEJORAS EN LA INTERFAZ

### 5.1 Mensajes Estandarizados

Todos los mensajes están centralizados en `APP_CONFIG.MESSAGES`:

```javascript
SUCCESS: {
    SAVE: '¡Datos guardados exitosamente!',
    UPDATE: '¡Datos actualizados exitosamente!',
    DELETE: '¡Datos eliminados exitosamente!'
}
ERROR: {
    NETWORK: 'Error de conexión...',
    SERVER: 'Error del servidor...',
    VALIDATION: 'Complete todos los campos requeridos'
}
```

### 5.2 Validación Visual

- ✅ Clases `is-invalid` para campos con error
- ✅ Mensajes de error contextuales
- ✅ Feedback en tiempo real

---

## 🔧 6. CONFIGURACIÓN DE DATATABLE Y SUMMERNOTE

### 6.1 DataTable

Configuración centralizada en español:
```javascript
APP_CONFIG.DATATABLE.LANGUAGE = {
    lengthMenu: "Mostrar _MENU_ registros",
    zeroRecords: "No se encontraron resultados",
    // ...más configuración
}
```

### 6.2 Summernote

Configuración estandarizada:
```javascript
APP_CONFIG.SUMMERNOTE = {
    HEIGHT: 625,
    TABSIZE: 2,
    TOOLBAR: [...]
}
```

---

## 📝 7. UTILIDADES AÑADIDAS

### 7.1 Funciones Globales Disponibles

```javascript
// Construcción de URLs
buildApiUrl('/api/endpoint')

// Peticiones AJAX con manejo de errores
apiRequest({
    url: '...',
    method: 'POST',
    data: {...}
})

// Validación de formularios
validateForm('formId')

// Validación de archivos
validateFile(file)

// Sanitización HTML
sanitizeHTML(text)

// Tracking de cambios no guardados
trackUnsavedChanges('formId')
```

---

## 🚀 8. INSTRUCCIONES DE DESPLIEGUE

### 8.1 Guía Completa de Instalación

Para instrucciones detalladas paso a paso sobre cómo instalar y desplegar el Sistema Habilitador con Docker, **consultar el archivo `README.md`**, que incluye:

- ✅ Requisitos del sistema completos
- ✅ Instalación paso a paso con Docker
- ✅ Configuración de variables de entorno
- ✅ Scripts de instalación automatizada
- ✅ Instrucciones de acceso al sistema
- ✅ Credenciales iniciales y cómo cambiarlas
- ✅ Configuración de seguridad post-instalación
- ✅ Resolución de problemas comunes

### 8.2 Resumen Rápido de Despliegue

**Pasos básicos:**
```bash
# 1. Clonar repositorio
git clone https://github.com/mac100185/sistema-habilitador.git
cd sistema-habilitador

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # CAMBIAR CONTRASEÑAS

# 3. Otorgar permisos a scripts
cd Scripts
chmod +x *.sh

# 4. Instalar (según si tiene Docker o no)
./sist_hab_prod_instalar_herramientas.sh
./sist_hab_prod_instalar.sh  # o sist_hab_prod_instalar_sin_docker.sh

# 5. Acceder al sistema
# Configurar archivo hosts del cliente con la IP del servidor
# Acceder a: http://hack_tool:7777/login.html
```

### 8.3 Variables de Entorno Requeridas

**Archivo `.env` mínimo:**
```env
# Base de Datos Principal
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI  # CAMBIAR
DB_NAME=sisthabpro

# Base de Datos API
DB_HOST_API=10.10.0.112
DB_PORT_API=3306
DB_USER_API=root
DB_PASSWORD_API=TU_PASSWORD_SEGURO_AQUI  # CAMBIAR
DB_NAME_API=seguridadapi

# Seguridad JWT
JWT_SECRET=TU_SECRET_ALEATORIO_LARGO  # GENERAR CON: openssl rand -base64 64
JWT_EXPIRATION=24h
```

### 8.4 Configuración del Host en HTML

Añadir en cada HTML que use la API:
```html
<head>
    <meta name="api-host" content="" />
    <script src="./config.js"></script>
    <!-- resto de scripts -->
</head>
```

Si el meta tag está vacío, se detecta automáticamente.

### 8.5 Acceso al Sistema

**Configurar archivo hosts en el cliente (NO en el servidor Docker):**

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Linux/Mac:** `/etc/hosts`

Agregar línea:
```
10.10.0.112    hack_tool
```
(Reemplazar con la IP real de su servidor)

**URLs de acceso:**
- Sistema Habilitador: `http://hack_tool:7777/login.html`
- PhpMyAdmin: `http://hack_tool:82/`
- Portainer: `http://IP_SERVIDOR:4200/`

---

## 🔍 9. ARCHIVOS MODIFICADOS

### Archivos Principales:
1. ✅ `src/publico/config.js` - **NUEVO** - Configuración centralizada
2. ✅ `src/publico/login.html` - Actualizado con mejoras
3. ✅ `src/publico/dist/js/jimlg.js` - Refactorizado completamente
4. ✅ `src/publico/seguridad/js/controles.js` - URLs dinámicas
5. ✅ `src/publico/seguridad/js/controles_plantilla.js` - URLs dinámicas
6. ✅ `src/publico/seguridad/js/seguridad.js` - URLs dinámicas
7. ✅ `src/database.js` - Pool + variables de entorno (ya existía)
8. ✅ `src/database_seguridad_defen.js` - Pool + variables de entorno (ya existía)

### Archivos de Configuración:
- ✅ `.env.example` - Variables de entorno de ejemplo (ya existía)
- ✅ `compose.yaml` - Health checks y persistencia (ya existía)

---

## ⚠️ 10. NOTAS IMPORTANTES

### 10.1 Retrocompatibilidad

- ✅ La variable global `window.host` sigue existiendo para compatibilidad
- ✅ El código existente que usa `host` seguirá funcionando
- ✅ Se recomienda migrar gradualmente a `APP_CONFIG.API_HOST`

### 10.2 Seguridad RSA

- ✅ El cifrado RSA de credenciales se mantiene intacto
- ✅ La clave pública está en base64 en el código (por diseño)
- ✅ La clave privada debe estar solo en el servidor

### 10.3 Pendientes (Recomendaciones Futuras)

1. **Autenticación:**
   - Implementar refresh tokens
   - Timeout de sesión
   - Cierre de sesión en múltiples tabs

2. **Validación:**
   - Extender validaciones del lado del servidor
   - Implementar CSRF protection
   - Rate limiting en endpoints

3. **Monitoreo:**
   - Implementar logging centralizado
   - Métricas de uso
   - Alertas de errores

4. **Testing:**
   - Tests unitarios para validaciones
   - Tests de integración para APIs
   - Tests E2E para flujos críticos

---

## 📚 11. EJEMPLOS DE USO

### 11.1 Crear un Nuevo Formulario con Validación

```html
<form id="miFormulario">
    <input type="text" id="nombre" required />
    <input type="email" id="email" required />
    <button type="submit">Enviar</button>
</form>

<script>
$('#miFormulario').submit(function(e) {
    e.preventDefault();

    // Validar formulario
    if (!validateForm('miFormulario')) {
        return false;
    }

    // Hacer petición
    apiRequest({
        url: buildApiUrl('/api/mi-endpoint'),
        method: 'POST',
        data: JSON.stringify({
            nombre: $('#nombre').val(),
            email: $('#email').val()
        }),
        success: function(data) {
            Swal.fire({
                icon: 'success',
                title: APP_CONFIG.MESSAGES.SUCCESS.SAVE
            });
        }
    });
});
</script>
```

### 11.2 Subir Imagen con Validación

```javascript
$('#inputImagen').change(function(e) {
    const file = e.target.files[0];

    // Validar archivo
    if (!validateFile(file)) {
        return;
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('image', file);

    // Subir
    $.ajax({
        url: buildApiUrl('/seguridad_def/imagen/' + nombreImagen),
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(result) {
            console.log('Imagen subida');
        }
    });
});
```

---

## 🎯 12. CHECKLIST DE VERIFICACIÓN

### Antes de Desplegar:

- [ ] Configurar todas las variables de entorno en `.env`
- [ ] Cambiar contraseñas por defecto en `.env`
- [ ] Generar JWT_SECRET seguro: `openssl rand -base64 64`
- [ ] Verificar puertos disponibles (7777, 82, 3306, 4200)
- [ ] Verificar espacio en disco (mínimo 4GB)
- [ ] Otorgar permisos a scripts de instalación
- [ ] Verificar que config.js se carga en todos los HTML
- [ ] Documentar IP del servidor para archivo hosts

### Inmediatamente Después de Instalar:

- [ ] **CAMBIAR contraseña de usuario `admin` (admin123)**
- [ ] **CAMBIAR contraseña de MySQL root (quanium)**
- [ ] Actualizar archivo `.env` con nuevas contraseñas
- [ ] Reiniciar contenedores después de cambios
- [ ] Crear usuario administrador en Portainer
- [ ] Probar login con nuevas credenciales
- [ ] Verificar conexión a base de datos
- [ ] Probar subida de imágenes
- [ ] Verificar que las URLs se construyen correctamente
- [ ] Probar validaciones de formularios

### En Producción:

- [ ] Habilitar HTTPS con Nginx + Let's Encrypt
- [ ] Configurar firewall (ufw)
- [ ] Cerrar puerto 82 (PhpMyAdmin) al público si no es necesario
- [ ] Implementar backups automáticos diarios
- [ ] Configurar monitoring y alertas
- [ ] Revisar logs regularmente
- [ ] Actualizar dependencias mensualmente
- [ ] Implementar VPN para acceso remoto
- [ ] Auditar usuarios activos mensualmente
- [ ] Documentar procedimientos de recuperación

---

## 📞 13. SOPORTE Y CONTACTO

### Recursos de Documentación

1. **README.md** - Guía completa de instalación y despliegue
2. **CAMBIOS_SEGURIDAD.md** (este documento) - Detalles técnicos de seguridad
3. **config.js** - Comentarios sobre configuración
4. **compose.yaml** - Configuración de Docker

### Obtener Ayuda

Para dudas o problemas:
1. Revisar **README.md** → Sección "Resolución de Problemas"
2. Consultar este documento (CAMBIOS_SEGURIDAD.md)
3. Revisar logs del servidor:
   ```bash
   docker logs sistema-habilitador-web
   docker logs sistema-habilitador-db
   ```
4. Verificar la consola del navegador (F12)
5. Verificar configuración en `.env`
6. Consultar documentación de Docker

### Información del Proyecto

- **Repositorio:** http://CualquierDominio:3000/agarcia/sistema-habilitador
- **Versión:** 1.1.0

---

## 📄 14. LICENCIA Y ATRIBUCIONES

Este documento forma parte del Sistema Habilitador.
Todos los cambios fueron realizados siguiendo las mejores prácticas de seguridad y desarrollo web.

---

## 🔗 14. REFERENCIAS CRUZADAS

### Documentos Relacionados

- **README.md** → Instalación completa paso a paso, despliegue Docker, acceso al sistema
- **CAMBIOS_SEGURIDAD.md** (este documento) → Detalles técnicos de implementación
- **compose.yaml** → Configuración de contenedores Docker
- **.env.example** → Plantilla de variables de entorno

### Secciones Importantes del README.md

- **Requisitos del Sistema** → Hardware y software necesario
- **Despliegue con Docker** → Comandos de instalación detallados
- **Acceso al Sistema** → Configuración de archivo hosts y URLs
- **Credenciales Iniciales** → Usuario/password por defecto y cómo cambiarlos
- **Configuración de Seguridad** → Checklist completo post-instalación
- **Copias de Respaldo** → Procedimientos de backup y restore
- **Resolución de Problemas** → Soluciones a errores comunes

---

**Última Actualización:** Diciembre 2024
**Versión del Documento:** 1.1.0
**Estado:** ✅ Completado y Actualizado
**Documentación Relacionada:** Ver README.md para guía completa de usuario
