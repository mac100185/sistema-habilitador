#!/bin/bash

# ============================================================================
# Script para extraer logs del Sistema Habilitador
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="./logs_exportados"
LOG_FILE="${LOG_DIR}/logs_${TIMESTAMP}"
CONTENEDORES=("sist-hab-prod" "sist-hab-db-prod" "sist-hab-phpmyadmin-prod" "sist-hab-drawio-prod")

# Crear directorio de logs si no existe
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}           EXTRACTOR DE LOGS - SISTEMA HABILITADOR                         ${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Función para imprimir mensajes
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Función para mostrar menú
show_menu() {
    echo ""
    print_message "${YELLOW}" "Seleccione una opción:"
    echo "1) Extraer logs de todos los contenedores"
    echo "2) Extraer logs del contenedor de aplicación (sist-hab-prod)"
    echo "3) Extraer logs del contenedor de base de datos (sist-hab-db-prod)"
    echo "4) Extraer logs del contenedor de phpMyAdmin (sist-hab-phpmyadmin-prod)"
    echo "5) Extraer logs del contenedor de Draw.io (sist-hab-drawio-prod)"
    echo "6) Extraer logs de instalación/build de imágenes Docker"
    echo "7) Ver logs en tiempo real (seguimiento)"
    echo "8) Extraer información del sistema y estado de contenedores"
    echo "9) Generar reporte completo (logs + estado + diagnóstico)"
    echo "0) Salir"
    echo ""
}

# Función para extraer logs de un contenedor
extract_container_logs() {
    local container_name=$1
    local output_file="${LOG_FILE}_${container_name}.log"

    print_message "${BLUE}" "Extrayendo logs de ${container_name}..."

    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        docker logs "${container_name}" > "${output_file}" 2>&1

        if [ $? -eq 0 ]; then
            local log_size=$(du -h "${output_file}" | cut -f1)
            print_message "${GREEN}" "✓ Logs extraídos: ${output_file} (${log_size})"
        else
            print_message "${RED}" "✗ Error al extraer logs de ${container_name}"
        fi
    else
        print_message "${YELLOW}" "⚠ Contenedor ${container_name} no encontrado"
    fi
}

# Función para extraer logs de todos los contenedores
extract_all_logs() {
    print_message "${GREEN}" "Extrayendo logs de todos los contenedores..."
    echo ""

    for container in "${CONTENEDORES[@]}"; do
        extract_container_logs "${container}"
    done

    print_message "${GREEN}" "✓ Extracción completada"
}

# Función para ver logs en tiempo real
follow_logs() {
    echo ""
    print_message "${YELLOW}" "Seleccione el contenedor para seguimiento en tiempo real:"
    echo "1) sist-hab-prod (Aplicación)"
    echo "2) sist-hab-db-prod (Base de datos)"
    echo "3) sist-hab-phpmyadmin-prod (phpMyAdmin)"
    echo "4) sist-hab-drawio-prod (Draw.io)"
    echo "5) Todos los contenedores"
    echo ""
    read -p "Opción: " follow_option

    case $follow_option in
        1)
            print_message "${BLUE}" "Siguiendo logs de sist-hab-prod (Ctrl+C para salir)..."
            docker logs -f sist-hab-prod
            ;;
        2)
            print_message "${BLUE}" "Siguiendo logs de sist-hab-db-prod (Ctrl+C para salir)..."
            docker logs -f sist-hab-db-prod
            ;;
        3)
            print_message "${BLUE}" "Siguiendo logs de sist-hab-phpmyadmin-prod (Ctrl+C para salir)..."
            docker logs -f sist-hab-phpmyadmin-prod
            ;;
        4)
            print_message "${BLUE}" "Siguiendo logs de sist-hab-drawio-prod (Ctrl+C para salir)..."
            docker logs -f sist-hab-drawio-prod
            ;;
        5)
            print_message "${BLUE}" "Siguiendo logs de todos los contenedores (Ctrl+C para salir)..."
            docker-compose logs -f
            ;;
        *)
            print_message "${RED}" "Opción inválida"
            ;;
    esac
}

# Función para extraer logs de build
extract_build_logs() {
    local build_log="${LOG_FILE}_build_installation.log"

    print_message "${BLUE}" "Extrayendo información de instalación y build..."

    {
        echo "============================================================================"
        echo "LOGS DE INSTALACIÓN Y BUILD - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== IMÁGENES DOCKER ==="
        docker images | grep -E "sistema-habilitador|mysql|phpmyadmin|drawio"
        echo ""

        echo "=== HISTORIAL DE BUILD (última imagen sistema-habilitador) ==="
        IMAGE_ID=$(docker images sistema-habilitador-prod:latest -q)
        if [ -n "$IMAGE_ID" ]; then
            docker history "$IMAGE_ID"
        else
            echo "No se encontró la imagen sistema-habilitador-prod:latest"
        fi
        echo ""

        echo "=== INSPECT DE LA IMAGEN ==="
        if [ -n "$IMAGE_ID" ]; then
            docker inspect "$IMAGE_ID"
        fi
        echo ""

        echo "=== LOGS DE DOCKER DAEMON (últimas 200 líneas) ==="
        if [ -f /var/log/docker.log ]; then
            tail -200 /var/log/docker.log
        elif [ -f /var/log/syslog ]; then
            tail -200 /var/log/syslog | grep docker
        else
            echo "No se encontraron logs del daemon de Docker"
        fi

    } > "${build_log}" 2>&1

    local log_size=$(du -h "${build_log}" | cut -f1)
    print_message "${GREEN}" "✓ Logs de build extraídos: ${build_log} (${log_size})"
}

# Función para extraer estado del sistema
extract_system_info() {
    local system_info="${LOG_FILE}_system_info.log"

    print_message "${BLUE}" "Extrayendo información del sistema..."

    {
        echo "============================================================================"
        echo "INFORMACIÓN DEL SISTEMA - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== HOSTNAME Y SISTEMA OPERATIVO ==="
        echo "Hostname: $(hostname)"
        echo "OS: $(uname -a)"
        if [ -f /etc/os-release ]; then
            cat /etc/os-release
        fi
        echo ""

        echo "=== VERSIONES ==="
        echo "Docker version:"
        docker --version
        echo "Docker Compose version:"
        docker-compose --version 2>/dev/null || docker compose version
        echo "Node version (en contenedor):"
        docker exec sist-hab-prod node --version 2>/dev/null || echo "No disponible"
        echo "NPM version (en contenedor):"
        docker exec sist-hab-prod npm --version 2>/dev/null || echo "No disponible"
        echo ""

        echo "=== ESTADO DE CONTENEDORES ==="
        docker ps -a
        echo ""

        echo "=== ESTADO DETALLADO DE CONTENEDORES ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "--- ${container} ---"
                docker inspect "${container}" | grep -A 10 "State"
                echo ""
            fi
        done

        echo "=== REDES DOCKER ==="
        docker network ls
        echo ""
        docker network inspect sistema-habilitador_default 2>/dev/null || \
        docker network inspect sistema-habilitador_sistema-habilitador-network 2>/dev/null || \
        echo "Red no encontrada"
        echo ""

        echo "=== VOLÚMENES DOCKER ==="
        docker volume ls | grep sistema-habilitador
        echo ""

        echo "=== USO DE RECURSOS ==="
        docker stats --no-stream
        echo ""

        echo "=== ESPACIO EN DISCO ==="
        df -h
        echo ""

        echo "=== ESPACIO USADO POR DOCKER ==="
        docker system df
        echo ""

        echo "=== PROCESOS EN CONTENEDOR DE APLICACIÓN ==="
        docker exec sist-hab-prod ps aux 2>/dev/null || echo "No disponible"
        echo ""

        echo "=== VARIABLES DE ENTORNO (contenedor aplicación) ==="
        docker exec sist-hab-prod env 2>/dev/null | grep -v PASSWORD | grep -v SECRET || echo "No disponible"
        echo ""

        echo "=== PUERTOS EXPUESTOS ==="
        docker ps --format "table {{.Names}}\t{{.Ports}}"
        echo ""

        echo "=== CONECTIVIDAD DE RED ==="
        echo "Ping desde app a base de datos:"
        docker exec sist-hab-prod ping -c 3 dbsh 2>/dev/null || echo "No disponible"
        echo ""

        echo "=== LOGS DE ERRORES RECIENTES (últimas 50 líneas) ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "--- Errores en ${container} ---"
                docker logs "${container}" 2>&1 | grep -i error | tail -50
                echo ""
            fi
        done

    } > "${system_info}" 2>&1

    local log_size=$(du -h "${system_info}" | cut -f1)
    print_message "${GREEN}" "✓ Información del sistema extraída: ${system_info} (${log_size})"
}

# Función para generar reporte completo
generate_full_report() {
    print_message "${GREEN}" "Generando reporte completo..."
    echo ""

    extract_all_logs
    echo ""
    extract_build_logs
    echo ""
    extract_system_info
    echo ""

    # Crear archivo comprimido con todos los logs
    local archive_name="${LOG_DIR}/reporte_completo_${TIMESTAMP}.tar.gz"
    tar -czf "${archive_name}" "${LOG_FILE}"* 2>/dev/null

    if [ $? -eq 0 ]; then
        local archive_size=$(du -h "${archive_name}" | cut -f1)
        print_message "${GREEN}" "✓ Reporte comprimido generado: ${archive_name} (${archive_size})"
    fi

    echo ""
    print_message "${GREEN}" "============================================================================"
    print_message "${GREEN}" "REPORTE COMPLETO GENERADO EXITOSAMENTE"
    print_message "${GREEN}" "============================================================================"
    print_message "${YELLOW}" "Ubicación de archivos: ${LOG_DIR}/"
    ls -lh "${LOG_FILE}"* 2>/dev/null
}

# Función para diagnosticar problemas comunes
diagnose_issues() {
    local diag_file="${LOG_FILE}_diagnostico.log"

    print_message "${BLUE}" "Ejecutando diagnóstico de problemas comunes..."

    {
        echo "============================================================================"
        echo "DIAGNÓSTICO DE PROBLEMAS COMUNES - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== VERIFICANDO CONTENEDORES ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "✓ ${container}: RUNNING"
            elif docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "✗ ${container}: STOPPED o ERROR"
                echo "  Estado:"
                docker ps -a --filter "name=${container}" --format "  {{.Status}}"
                echo "  Últimas líneas de log:"
                docker logs --tail 20 "${container}" 2>&1 | sed 's/^/    /'
            else
                echo "✗ ${container}: NO EXISTE"
            fi
            echo ""
        done

        echo "=== VERIFICANDO CONECTIVIDAD DE BASE DE DATOS ==="
        if docker exec sist-hab-prod ping -c 2 dbsh > /dev/null 2>&1; then
            echo "✓ Conectividad de red con base de datos: OK"
        else
            echo "✗ Conectividad de red con base de datos: FALLO"
        fi
        echo ""

        echo "=== VERIFICANDO MYSQL ==="
        if docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium > /dev/null 2>&1; then
            echo "✓ MySQL responde: OK"
            echo "  Bases de datos:"
            docker exec sist-hab-db-prod mysql -u root -pquanium -e "SHOW DATABASES;" 2>/dev/null | sed 's/^/    /'
        else
            echo "✗ MySQL no responde o hay error de autenticación"
        fi
        echo ""

        echo "=== VERIFICANDO TABLA DE USUARIOS ==="
        if docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SHOW TABLES LIKE 'usuarios';" 2>/dev/null | grep -q usuarios; then
            echo "✓ Tabla 'usuarios' existe"
            USER_COUNT=$(docker exec sist-hab-db-prod mysql -u root -pquanium -se "SELECT COUNT(*) FROM sisthabpro.usuarios;" 2>/dev/null)
            echo "  Total de usuarios: ${USER_COUNT}"
        else
            echo "✗ Tabla 'usuarios' NO existe"
        fi
        echo ""

        echo "=== VERIFICANDO APLICACIÓN WEB ==="
        if docker exec sist-hab-prod wget --spider -q http://localhost:7777/api/health 2>/dev/null; then
            echo "✓ Aplicación responde en puerto 7777: OK"
        else
            echo "✗ Aplicación NO responde en puerto 7777"
        fi
        echo ""

        echo "=== VERIFICANDO PUERTOS EXPUESTOS ==="
        if netstat -tuln 2>/dev/null | grep -q ":7777"; then
            echo "✓ Puerto 7777 (Aplicación) está escuchando"
        else
            echo "✗ Puerto 7777 (Aplicación) NO está escuchando"
        fi

        if netstat -tuln 2>/dev/null | grep -q ":3306"; then
            echo "✓ Puerto 3306 (MySQL) está escuchando"
        else
            echo "✗ Puerto 3306 (MySQL) NO está escuchando"
        fi
        echo ""

        echo "=== VERIFICANDO DEPENDENCIAS DE NODE ==="
        docker exec sist-hab-prod test -d node_modules && echo "✓ node_modules existe" || echo "✗ node_modules NO existe"
        echo ""

        echo "=== ERRORES CRÍTICOS EN LOGS ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                ERROR_COUNT=$(docker logs "${container}" 2>&1 | grep -ic error)
                echo "${container}: ${ERROR_COUNT} errores encontrados"
            fi
        done

    } > "${diag_file}" 2>&1

    # Mostrar diagnóstico en pantalla también
    cat "${diag_file}"

    local log_size=$(du -h "${diag_file}" | cut -f1)
    print_message "${GREEN}" "✓ Diagnóstico guardado en: ${diag_file} (${log_size})"
}

# Menú principal
main() {
    while true; do
        show_menu
        read -p "Seleccione una opción: " option

        case $option in
            1)
                extract_all_logs
                ;;
            2)
                extract_container_logs "sist-hab-prod"
                ;;
            3)
                extract_container_logs "sist-hab-db-prod"
                ;;
            4)
                extract_container_logs "sist-hab-phpmyadmin-prod"
                ;;
            5)
                extract_container_logs "sist-hab-drawio-prod"
                ;;
            6)
                extract_build_logs
                ;;
            7)
                follow_logs
                ;;
            8)
                extract_system_info
                diagnose_issues
                ;;
            9)
                generate_full_report
                diagnose_issues
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

# Verificar si Docker está corriendo
if ! docker info &> /dev/null; then
    print_message "${RED}" "Error: Docker no está corriendo"
    exit 1
fi

# Ejecutar menú principal
main
