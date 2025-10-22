# 🚀 INICIO RÁPIDO - Sistema Habilitador

**¡Instala el sistema en 3 pasos!**

---

## ⚡ Instalación Rápida

### Paso 1: Ir al directorio de scripts
```bash
cd sistema-habilitador/Scripts
```

### Paso 2: Ejecutar instalación automática
```bash
./build_seguro.sh
```

### Paso 3: Verificar que todo funciona
```bash
./verificacion_rapida.sh
```

**¡LISTO!** El sistema está corriendo.

---

## 🌐 Acceder al Sistema

### Aplicación Web
- **URL:** http://localhost:7777
- **Usuario Admin:** `admin`
- **Contraseña:** `Admin2024!`

### Otros Servicios
- **phpMyAdmin:** http://localhost:82
- **Draw.io:** http://localhost:83

---

## 🔧 Si Algo Falla

### Opción 1: Verificación Rápida
```bash
cd Scripts
./verificacion_rapida.sh
```

### Opción 2: Ver Logs
```bash
./extraer_logs.sh
# Seleccionar opción 9: Reporte completo
```

### Opción 3: Reinstalar
```bash
./sist_hab_prod_desinstalar.sh
./build_seguro.sh
```

---

## 📋 Requisitos

- ✅ Docker instalado
- ✅ Docker Compose instalado
- ✅ Mínimo 5GB de espacio libre
- ✅ Conexión a Internet

---

## ⏱️ Tiempos Esperados

- **Instalación completa:** 7-10 minutos
- **Verificación:** < 1 minuto
- **Primer inicio:** 1-2 minutos

---

## 📚 Documentación Completa

Para más detalles, consultar:
- `CORRECCIONES_APLICADAS.md` - Resumen de correcciones
- `Scripts/README_SCRIPTS.md` - Guía completa de scripts
- `CAMBIOS_TECNICOS.md` - Documentación técnica
- `INSTRUCCIONES_USO.md` - Manual de usuario

---

## 🆘 Soporte

Si necesitas ayuda después de seguir estos pasos:

1. Genera un reporte:
   ```bash
   cd Scripts
   ./extraer_logs.sh  # Opción 9
   ```

2. El archivo generado estará en:
   ```
   Scripts/logs_exportados/reporte_completo_TIMESTAMP.tar.gz
   ```

---

**Versión:** 2.0  
**Última actualización:** Octubre 2025