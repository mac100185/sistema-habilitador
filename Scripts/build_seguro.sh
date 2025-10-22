#!/bin/bash

# ============================================================================
# Script de Build Seguro - Sistema Habilitador
# Maneja errores de GPG, verifica dependencias y hace build robusto
# ============================================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="./logs_exportados"
BUILD_LOG="${LOG_DIR}/build_seguro_${TIMESTAMP}.log"

mkdir -p "${LOG_DIR}"

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "${BLUE}" "============================================================================"
    print_message "${BLUE}" "$1"
    print_message "${BLUE}" "============================================================================"
    echo ""
}

# Verificar requisitos
verificar_requisitos() {
    print_header "VERIFICANDO REQUISITOS DEL SISTEMA"

    local all_ok=true

    # Docker
    if command -v docker &> /dev/null; then
        print_message "${GREEN}" "✓ Docker: $(docker --version)"
    else
        print_message "${RED}" "✗ Docker no instalado"
        all_ok=false
    fi

    # Docker Compose
    if docker compose version &> /dev/null 2>&1; then
        print_message "${GREEN}" "✓ Docker Compose: $(docker compose version --short)"
    else
        print_message "${RED}" "✗ Docker Compose no instalado"
        all_ok=false
    fi

    # Docker daemon
    if docker info &> /dev/null; then
        print_message "${GREEN}" "✓ Docker daemon corriendo"
    else
        print_message "${RED}" "✗ Docker daemon no está corriendo"
        all_ok=false
    fi

    # Espacio en disco
    available=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available" -gt 5 ]; then
        print_message "${GREEN}" "✓ Espacio disponible: ${available}GB"
    else
        print_message "${YELLOW}" "⚠ Espacio limitado: ${available}GB"
    fi

    # Conectividad
    if ping -c 1 registry.npmjs.org &> /dev/null; then
        print_message "${GREEN}" "✓ Conectividad a NPM registry"
    else
        print_message "${YELLOW}" "⚠ Sin conectividad a NPM registry (puede fallar el build)"
    fi

    echo ""

    if [ "$all_ok" = false ]; then
        print_message "${RED}" "Faltan requisitos. Corrija antes de continuar."
        return 1
    fi

    return 0
}

# Limpiar builds anteriores
limpiar_builds() {
    print_header "LIMPIANDO BUILDS ANTERIORES"

    print_message "${YELLOW}" "Deteniendo contenedores..."
    docker compose down 2>&1 | tee -a "${BUILD_LOG}"

    print_message "${YELLOW}" "Eliminando imágenes antiguas..."
    docker rmi sistema-habilitador-prod:latest 2>&1 | tee -a "${BUILD_LOG}"

    print_message "${YELLOW}" "Limpiando cache de builder..."
    docker builder prune -f 2>&1 | tee -a "${BUILD_LOG}"

    print_message "${GREEN}" "✓ Limpieza completada"
}

# Build con manejo de errores
hacer_build() {
    print_header "INICIANDO BUILD DE LA IMAGEN"

    cd ..

    {
        echo "============================================================================"
        echo "BUILD LOG - $(date)"
        echo "============================================================================"
        echo ""

        print_message "${CYAN}" "Ejecutando: docker compose build --no-cache --progress=plain"
        echo ""

        docker compose build --no-cache --progress=plain 2>&1
        echo $? > /tmp/build_exit_code.txt

        echo ""
        echo "============================================================================"
        echo "Build Exit Code: $(cat /tmp/build_exit_code.txt)"
        echo "============================================================================"

    } | tee -a "${BUILD_LOG}"

    BUILD_EXIT=$(cat /tmp/build_exit_code.txt 2>/dev/null || echo "1")
    rm -f /tmp/build_exit_code.txt

    cd Scripts

    if [ "$BUILD_EXIT" -eq 0 ] 2>/dev/null; then
        print_message "${GREEN}" "✓ BUILD EXITOSO"
        return 0
    else
        print_message "${RED}" "✗ BUILD FALLÓ"
        analizar_errores
        return 1
    fi
}

# Analizar errores del build
analizar_errores() {
    print_header "ANÁLISIS DE ERRORES"

    if grep -q "invalid signature\|GPG error" "${BUILD_LOG}"; then
        print_message "${RED}" "ERROR: Problemas con firmas GPG de repositorios Debian"
        echo ""
        print_message "${YELLOW}" "Posibles causas:"
        echo "  - Repositorios de Debian con firmas corruptas"
        echo "  - Problemas de red durante la descarga de keys"
        echo "  - Cache de Docker con información antigua"
        echo ""
        print_message "${CYAN}" "Soluciones aplicadas en el Dockerfile:"
        echo "  ✓ Actualización de ca-certificates"
        echo "  ✓ Instalación de gnupg"
        echo "  ✓ Limpieza de listas de paquetes"
        echo "  ✓ Uso de --allow-releaseinfo-change"
        echo ""
        print_message "${GREEN}" "Acción recomendada:"
        echo "  El Dockerfile ha sido corregido. Intente el build nuevamente."
    fi

    if grep -q "npm ERR\|gyp ERR" "${BUILD_LOG}"; then
        print_message "${RED}" "ERROR: Problemas con instalación de paquetes NPM"
        echo ""
        print_message "${YELLOW}" "Revise:"
        echo "  - Conectividad a registry.npmjs.org"
        echo "  - Compatibilidad de paquetes con Node 18.16.1"
        echo "  - Logs específicos de npm en el archivo de log"
    fi

    if grep -q "ECONNREFUSED\|timeout\|ETIMEDOUT" "${BUILD_LOG}"; then
        print_message "${RED}" "ERROR: Problemas de conectividad de red"
        echo ""
        print_message "${YELLOW}" "Verifique:"
        echo "  - Conexión a Internet"
        echo "  - Configuración de proxy/firewall"
        echo "  - DNS de Docker (/etc/docker/daemon.json)"
    fi

    echo ""
    print_message "${CYAN}" "Log completo guardado en: ${BUILD_LOG}"
}

# Verificar imagen creada
verificar_imagen() {
    print_header "VERIFICANDO IMAGEN CREADA"

    IMAGE_ID=$(docker images sistema-habilitador-prod:latest -q 2>/dev/null)

    if [ -n "$IMAGE_ID" ]; then
        print_message "${GREEN}" "✓ Imagen creada exitosamente"
        echo ""
        docker images sistema-habilitador-prod:latest
        echo ""

        print_message "${CYAN}" "Tamaño de la imagen:"
        docker images sistema-habilitador-prod:latest --format "{{.Size}}"
        echo ""

        print_message "${CYAN}" "Verificando Node y NPM en la imagen..."
        docker run --rm sistema-habilitador-prod:latest node --version
        docker run --rm sistema-habilitador-prod:latest npm --version
        echo ""

        return 0
    else
        print_message "${RED}" "✗ No se creó la imagen"
        return 1
    fi
}

# Iniciar contenedores
iniciar_contenedores() {
    print_header "INICIANDO CONTENEDORES"

    cd ..

    print_message "${CYAN}" "Ejecutando: docker compose up -d"
    docker compose up -d 2>&1 | tee -a "${BUILD_LOG}"
    echo ${PIPESTATUS[0]} > /tmp/compose_exit_code.txt

    COMPOSE_EXIT=$(cat /tmp/compose_exit_code.txt 2>/dev/null || echo "1")
    rm -f /tmp/compose_exit_code.txt

    cd Scripts

    if [ "$COMPOSE_EXIT" -eq 0 ] 2>/dev/null; then
        print_message "${GREEN}" "✓ Contenedores iniciados"
        echo ""
        docker compose ps
        return 0
    else
        print_message "${RED}" "✗ Error al iniciar contenedores"
        return 1
    fi
}

# Esperar servicios
esperar_servicios() {
    print_header "ESPERANDO INICIALIZACIÓN DE SERVICIOS"

    print_message "${YELLOW}" "Esperando base de datos (60 segundos)..."
    sleep 60

    print_message "${YELLOW}" "Verificando servicios..."

    # Verificar MySQL
    if docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium &> /dev/null; then
        print_message "${GREEN}" "✓ MySQL respondiendo"
    else
        print_message "${YELLOW}" "⚠ MySQL aún no responde"
    fi

    # Verificar aplicación
    sleep 10
    if docker exec sist-hab-prod wget --spider -q http://localhost:7777/api/health 2>/dev/null; then
        print_message "${GREEN}" "✓ Aplicación respondiendo"
    else
        print_message "${YELLOW}" "⚠ Aplicación aún no responde"
    fi
}

# Verificar instalación completa
verificar_instalacion() {
    print_header "VERIFICACIÓN FINAL"

    echo ""
    print_message "${CYAN}" "Estado de contenedores:"
    docker compose ps
    echo ""

    print_message "${CYAN}" "Servicios expuestos:"
    echo "  - Aplicación:  http://localhost:7777"
    echo "  - phpMyAdmin:  http://localhost:82"
    echo "  - Draw.io:     http://localhost:83"
    echo ""

    print_message "${CYAN}" "Health check:"
    if curl -s http://localhost:7777/api/health &> /dev/null; then
        print_message "${GREEN}" "✓ API respondiendo correctamente"
    else
        print_message "${YELLOW}" "⚠ API no responde (puede necesitar más tiempo)"
    fi

    echo ""
    print_message "${CYAN}" "Para ver logs en tiempo real:"
    echo "  docker logs -f sist-hab-prod"
    echo ""

    print_message "${CYAN}" "Para extraer logs completos:"
    echo "  cd Scripts"
    echo "  ./extraer_logs.sh"
}

# Menú principal
menu_principal() {
    print_header "BUILD SEGURO - SISTEMA HABILITADOR"

    echo "Este script realizará:"
    echo "  1. Verificación de requisitos"
    echo "  2. Limpieza de builds anteriores"
    echo "  3. Build de la imagen Docker"
    echo "  4. Verificación de la imagen"
    echo "  5. Inicio de contenedores"
    echo "  6. Verificación de servicios"
    echo ""

    read -p "¿Desea continuar? (s/n): " respuesta

    if [[ ! "$respuesta" =~ ^[Ss]$ ]]; then
        print_message "${YELLOW}" "Operación cancelada"
        exit 0
    fi
}

# Main
main() {
    menu_principal

    # Paso 1: Verificar requisitos
    if ! verificar_requisitos; then
        exit 1
    fi

    # Paso 2: Limpiar
    limpiar_builds

    # Paso 3: Build
    if ! hacer_build; then
        print_message "${RED}" "El build falló. Revise el log: ${BUILD_LOG}"
        exit 1
    fi

    # Paso 4: Verificar imagen
    if ! verificar_imagen; then
        exit 1
    fi

    # Paso 5: Iniciar contenedores
    if ! iniciar_contenedores; then
        print_message "${RED}" "Error al iniciar contenedores"
        exit 1
    fi

    # Paso 6: Esperar servicios
    esperar_servicios

    # Paso 7: Verificación final
    verificar_instalacion

    print_header "PROCESO COMPLETADO EXITOSAMENTE"

    print_message "${GREEN}" "✓ Sistema instalado y corriendo"
    print_message "${CYAN}" "Log completo: ${BUILD_LOG}"

    echo ""
}

# Verificar que estamos en el directorio correcto
if [ ! -f "../compose.yaml" ]; then
    print_message "${RED}" "Error: Ejecute este script desde el directorio Scripts/"
    exit 1
fi

# Ejecutar
main
