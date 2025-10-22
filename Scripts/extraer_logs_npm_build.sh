#!/bin/bash

# ============================================================================
# Script para extraer logs de instalación NPM durante el build de Docker
# Sistema Habilitador - Versión 1.0
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="./logs_exportados"
BUILD_LOG="${LOG_DIR}/npm_build_${TIMESTAMP}.log"
COMPOSE_FILE="../compose.yaml"
DOCKERFILE="../Dockerfile"

# Crear directorio de logs si no existe
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}     EXTRACTOR DE LOGS NPM BUILD - SISTEMA HABILITADOR                    ${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Función para imprimir mensajes
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Función para extraer logs del build anterior
extract_previous_build_logs() {
    print_message "${BLUE}" "Extrayendo logs del último build..."

    {
        echo "============================================================================"
        echo "LOGS DE BUILD ANTERIOR - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== INFORMACIÓN DE LA IMAGEN ACTUAL ==="
        IMAGE_ID=$(docker images sistema-habilitador-prod:latest -q 2>/dev/null)
        if [ -n "$IMAGE_ID" ]; then
            echo "Image ID: $IMAGE_ID"
            echo ""
            echo "Información de la imagen:"
            docker inspect "$IMAGE_ID" --format '
Image: {{.RepoTags}}
Created: {{.Created}}
Size: {{.Size}} bytes
Architecture: {{.Architecture}}
OS: {{.Os}}
' 2>/dev/null
            echo ""

            echo "=== HISTORIAL DE BUILD ==="
            docker history "$IMAGE_ID" --no-trunc 2>/dev/null
            echo ""

            echo "=== CAPAS DE LA IMAGEN ==="
            docker history "$IMAGE_ID" --format "{{.CreatedBy}}" --no-trunc 2>/dev/null
            echo ""
        else
            echo "No se encontró la imagen sistema-habilitador-prod:latest"
        fi

        echo "=== LOGS DE DOCKER DAEMON (BUILDS RECIENTES) ==="
        if command -v journalctl &> /dev/null; then
            print_message "${CYAN}" "Buscando logs en journalctl..."
            journalctl -u docker.service --since "24 hours ago" --no-pager | grep -iE "build|npm install|RUN" | tail -500
        elif [ -f /var/log/docker.log ]; then
            tail -500 /var/log/docker.log | grep -iE "build|npm"
        elif [ -f /var/log/syslog ]; then
            tail -500 /var/log/syslog | grep -iE "docker.*build|npm"
        else
            echo "No se encontraron logs del daemon de Docker"
        fi
        echo ""

        echo "=== ERRORES DE BUILD ==="
        if command -v journalctl &> /dev/null; then
            journalctl -u docker.service --since "24 hours ago" --no-pager | grep -iE "error.*build|failed.*npm|exit code" | tail -200
        fi
        echo ""

    } > "${BUILD_LOG}"

    print_message "${GREEN}" "✓ Logs extraídos en: ${BUILD_LOG}"
}

# Función para hacer build con logs detallados
build_with_logs() {
    local build_output="${LOG_DIR}/npm_build_realtime_${TIMESTAMP}.log"

    print_message "${BLUE}" "============================================================================"
    print_message "${BLUE}" "Iniciando build con captura de logs detallados..."
    print_message "${BLUE}" "============================================================================"
    echo ""

    print_message "${YELLOW}" "Los logs se guardarán en: ${build_output}"
    print_message "${YELLOW}" "Este proceso puede tomar varios minutos..."
    echo ""

    cd ..

    {
        echo "============================================================================"
        echo "BUILD EN TIEMPO REAL - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== DOCKERFILE UTILIZADO ==="
        if [ -f "$DOCKERFILE" ]; then
            cat "$DOCKERFILE"
        fi
        echo ""
        echo "============================================================================"
        echo ""

        echo "=== INICIO DEL BUILD ==="
        echo ""

        # Build con output completo
        docker compose build --no-cache --progress=plain 2>&1

        BUILD_EXIT_CODE=$?

        echo ""
        echo "============================================================================"
        echo "=== FIN DEL BUILD ==="
        echo "Exit Code: $BUILD_EXIT_CODE"
        echo "Timestamp: $(date)"
        echo "============================================================================"

    } | tee "${build_output}"

    cd Scripts

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_message "${GREEN}" "✓ Build completado exitosamente"
        print_message "${GREEN}" "✓ Logs guardados en: ${build_output}"

        # Extraer logs de npm del contenedor recién creado
        extract_npm_from_container "${build_output}"
    else
        print_message "${RED}" "✗ Build falló"
        print_message "${YELLOW}" "Revise los logs en: ${build_output}"

        # Analizar errores
        analyze_build_errors "${build_output}"
    fi
}

# Función para extraer logs de npm del contenedor
extract_npm_from_container() {
    local build_output=$1
    local npm_container_log="${LOG_DIR}/npm_container_${TIMESTAMP}.log"

    print_message "${BLUE}" "Extrayendo logs de NPM del contenedor..."

    # Iniciar contenedor temporalmente si no está corriendo
    if ! docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
        print_message "${YELLOW}" "Iniciando contenedor temporalmente..."
        docker compose up -d websh 2>/dev/null
        sleep 5
    fi

    {
        echo "============================================================================"
        echo "LOGS NPM DENTRO DEL CONTENEDOR - $(date)"
        echo "============================================================================"
        echo ""

        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            echo "=== LOG DE INSTALACIÓN NPM (desde /tmp/npm-install.log) ==="
            docker exec sist-hab-prod cat /tmp/npm-install.log 2>/dev/null || echo "Archivo no encontrado"
            echo ""

            echo "=== VERSIONES INSTALADAS ==="
            docker exec sist-hab-prod node --version 2>&1
            docker exec sist-hab-prod npm --version 2>&1
            echo ""

            echo "=== PAQUETES INSTALADOS ==="
            docker exec sist-hab-prod npm list --depth=0 2>&1
            echo ""

            echo "=== VERIFICACIÓN DE PAQUETES CRÍTICOS ==="
            critical_packages=("express" "mysql2" "bcrypt" "jsonwebtoken" "dotenv" "@bestdon/nodejs-captcha")
            for pkg in "${critical_packages[@]}"; do
                echo "Verificando: $pkg"
                docker exec sist-hab-prod npm list "$pkg" 2>&1
            done
            echo ""

            echo "=== TAMAÑO DE NODE_MODULES ==="
            docker exec sist-hab-prod du -sh node_modules 2>&1
            echo ""

            echo "=== PROBLEMAS EN DEPENDENCIAS ==="
            docker exec sist-hab-prod npm list 2>&1 | grep -iE "UNMET|missing|invalid|WARN" || echo "Sin problemas detectados"

        else
            echo "ERROR: No se pudo acceder al contenedor"
        fi

    } > "${npm_container_log}"

    print_message "${GREEN}" "✓ Logs de NPM extraídos: ${npm_container_log}"
}

# Función para analizar errores de build
analyze_build_errors() {
    local build_log=$1
    local error_analysis="${LOG_DIR}/error_analysis_${TIMESTAMP}.log"

    print_message "${BLUE}" "Analizando errores del build..."

    {
        echo "============================================================================"
        echo "ANÁLISIS DE ERRORES - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== ERRORES CRÍTICOS ==="
        grep -iE "error|fatal|failed|exit code" "$build_log" | tail -50
        echo ""

        echo "=== PROBLEMAS DE APT/PAQUETES DEBIAN ==="
        grep -iE "apt-get|dpkg|package|repository|signature|GPG" "$build_log" | grep -i error | tail -30
        echo ""

        echo "=== PROBLEMAS DE NPM ==="
        grep -iE "npm ERR|npm WARN|gyp ERR" "$build_log" | tail -50
        echo ""

        echo "=== PROBLEMAS DE RED/CONECTIVIDAD ==="
        grep -iE "timeout|ECONNREFUSED|ETIMEDOUT|network|fetch failed" "$build_log" | tail -30
        echo ""

        echo "=== PROBLEMAS DE PERMISOS ==="
        grep -iE "permission denied|EACCES|EPERM" "$build_log" | tail -20
        echo ""

        echo "=== ÚLTIMO ERROR ANTES DEL FALLO ==="
        tail -100 "$build_log" | grep -iE "error|failed" | tail -10
        echo ""

        echo "============================================================================"
        echo "=== POSIBLES SOLUCIONES ==="
        echo "============================================================================"

        if grep -q "invalid signature\|GPG error" "$build_log"; then
            echo ""
            echo "PROBLEMA: Errores de GPG/Firma de paquetes Debian"
            echo "SOLUCIÓN:"
            echo "  1. El Dockerfile ha sido actualizado con correcciones de GPG"
            echo "  2. Intente hacer build nuevamente: docker compose build --no-cache"
            echo "  3. Si persiste, verifique conectividad a repositorios Debian"
        fi

        if grep -q "npm ERR\|gyp ERR" "$build_log"; then
            echo ""
            echo "PROBLEMA: Errores en instalación de paquetes NPM"
            echo "SOLUCIÓN:"
            echo "  1. Verifique conectividad a registry.npmjs.org"
            echo "  2. Revise que las versiones en package.json sean compatibles con Node 18.16.1"
            echo "  3. Considere limpiar caché: docker builder prune -a"
        fi

        if grep -q "ECONNREFUSED\|timeout\|network" "$build_log"; then
            echo ""
            echo "PROBLEMA: Problemas de conectividad de red"
            echo "SOLUCIÓN:"
            echo "  1. Verifique su conexión a Internet"
            echo "  2. Revise configuración de proxy/firewall"
            echo "  3. Intente configurar DNS de Docker: /etc/docker/daemon.json"
        fi

        if grep -q "EACCES\|permission denied" "$build_log"; then
            echo ""
            echo "PROBLEMA: Problemas de permisos"
            echo "SOLUCIÓN:"
            echo "  1. Verifique permisos de usuario Docker"
            echo "  2. El Dockerfile ahora usa usuario 'node' no privilegiado"
            echo "  3. Asegúrese de tener permisos en directorios montados"
        fi

    } > "${error_analysis}"

    cat "${error_analysis}"
    print_message "${GREEN}" "✓ Análisis guardado en: ${error_analysis}"
}

# Función para verificar dependencias antes del build
verify_build_requirements() {
    print_message "${BLUE}" "Verificando requisitos para el build..."
    echo ""

    local all_ok=true

    # Verificar Docker
    if command -v docker &> /dev/null; then
        print_message "${GREEN}" "✓ Docker instalado: $(docker --version)"
    else
        print_message "${RED}" "✗ Docker no instalado"
        all_ok=false
    fi

    # Verificar Docker Compose
    if docker compose version &> /dev/null 2>&1; then
        print_message "${GREEN}" "✓ Docker Compose instalado: $(docker compose version)"
    elif command -v docker-compose &> /dev/null; then
        print_message "${GREEN}" "✓ Docker Compose instalado: $(docker-compose --version)"
    else
        print_message "${RED}" "✗ Docker Compose no instalado"
        all_ok=false
    fi

    # Verificar que Docker esté corriendo
    if docker info &> /dev/null; then
        print_message "${GREEN}" "✓ Docker daemon corriendo"
    else
        print_message "${RED}" "✗ Docker daemon no está corriendo"
        all_ok=false
    fi

    # Verificar archivos necesarios
    if [ -f "$COMPOSE_FILE" ]; then
        print_message "${GREEN}" "✓ Archivo compose.yaml encontrado"
    else
        print_message "${RED}" "✗ Archivo compose.yaml no encontrado"
        all_ok=false
    fi

    if [ -f "$DOCKERFILE" ]; then
        print_message "${GREEN}" "✓ Dockerfile encontrado"
    else
        print_message "${RED}" "✗ Dockerfile no encontrado"
        all_ok=false
    fi

    if [ -f "../package.json" ]; then
        print_message "${GREEN}" "✓ package.json encontrado"
        echo "  Node version requerida: $(grep -o '"node": "[^"]*"' ../package.json | cut -d'"' -f4)"
    else
        print_message "${RED}" "✗ package.json no encontrado"
        all_ok=false
    fi

    # Verificar espacio en disco
    available_space=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available_space" -gt 5 ]; then
        print_message "${GREEN}" "✓ Espacio en disco suficiente: ${available_space}GB disponibles"
    else
        print_message "${YELLOW}" "⚠ Espacio en disco limitado: ${available_space}GB disponibles"
    fi

    # Verificar conectividad
    if ping -c 1 registry.npmjs.org &> /dev/null; then
        print_message "${GREEN}" "✓ Conectividad a registry.npmjs.org"
    else
        print_message "${YELLOW}" "⚠ No se pudo verificar conectividad a registry.npmjs.org"
    fi

    echo ""

    if [ "$all_ok" = true ]; then
        print_message "${GREEN}" "Todos los requisitos cumplidos. Puede proceder con el build."
        return 0
    else
        print_message "${RED}" "Faltan requisitos. Corrija los problemas antes de continuar."
        return 1
    fi
}

# Función para limpiar builds anteriores
clean_previous_builds() {
    print_message "${YELLOW}" "¿Desea limpiar imágenes y contenedores anteriores? (s/n): "
    read -r response

    if [[ "$response" =~ ^[Ss]$ ]]; then
        print_message "${BLUE}" "Limpiando builds anteriores..."

        # Detener y eliminar contenedores
        docker compose down 2>/dev/null

        # Eliminar imagen anterior
        docker rmi sistema-habilitador-prod:latest 2>/dev/null

        # Limpiar builder cache
        docker builder prune -f

        print_message "${GREEN}" "✓ Limpieza completada"
    fi
}

# Menú principal
show_menu() {
    echo ""
    print_message "${YELLOW}" "Seleccione una opción:"
    echo "1) Verificar requisitos del sistema"
    echo "2) Extraer logs del build anterior"
    echo "3) Hacer build nuevo con captura de logs"
    echo "4) Limpiar builds anteriores"
    echo "5) Build completo (limpiar + build + logs)"
    echo "6) Ver logs de npm en contenedor actual"
    echo "0) Salir"
    echo ""
}

main() {
    while true; do
        show_menu
        read -p "Opción: " option

        case $option in
            1)
                verify_build_requirements
                ;;
            2)
                extract_previous_build_logs
                ;;
            3)
                build_with_logs
                ;;
            4)
                clean_previous_builds
                ;;
            5)
                if verify_build_requirements; then
                    clean_previous_builds
                    build_with_logs
                else
                    print_message "${RED}" "Corrija los problemas antes de continuar"
                fi
                ;;
            6)
                extract_npm_from_container "none"
                ;;
            0)
                print_message "${GREEN}" "Saliendo..."
                exit 0
                ;;
            *)
                print_message "${RED}" "Opción inválida"
                ;;
        esac

        echo ""
        read -p "Presione Enter para continuar..."
    done
}

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_message "${RED}" "Error: Docker no está instalado"
    exit 1
fi

# Ejecutar menú principal
main
