#!/bin/bash

# ============================================================================
# Script para extraer logs del Sistema Habilitador
# Versión mejorada con soporte para logs de instalación y dependencias npm
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
LOG_FILE="${LOG_DIR}/logs_${TIMESTAMP}"
CONTENEDORES=("sist-hab-prod" "sist-hab-db-prod" "sist-hab-phpmyadmin-prod" "sist-hab-drawio-prod")
COMPOSE_FILE="../compose.yaml"

# Crear directorio de logs si no existe
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}           EXTRACTOR DE LOGS - SISTEMA HABILITADOR                         ${NC}"
echo -e "${BLUE}                    Versión 2.0 - Mejorada                                 ${NC}"
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
    echo "10) Extraer logs de instalación npm dentro del contenedor"
    echo "11) Verificar dependencias de Node instaladas"
    echo "12) Extraer logs de Docker daemon y sistema"
    echo "0) Salir"
    echo ""
}

# Función para extraer logs de un contenedor
extract_container_logs() {
    local container_name=$1
    local output_file="${LOG_FILE}_${container_name}.log"

    print_message "${BLUE}" "Extrayendo logs de ${container_name}..."

    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        {
            echo "============================================================================"
            echo "LOGS DEL CONTENEDOR: ${container_name}"
            echo "Fecha de extracción: $(date)"
            echo "============================================================================"
            echo ""
            docker logs "${container_name}" 2>&1
            echo ""
            echo "============================================================================"
            echo "FIN DE LOGS - ${container_name}"
            echo "============================================================================"
        } > "${output_file}"

        if [ $? -eq 0 ]; then
            local log_size=$(du -h "${output_file}" | cut -f1)
            local line_count=$(wc -l < "${output_file}")
            print_message "${GREEN}" "✓ Logs extraídos: ${output_file}"
            print_message "${CYAN}" "  Tamaño: ${log_size} | Líneas: ${line_count}"
        else
            print_message "${RED}" "✗ Error al extraer logs de ${container_name}"
        fi
    else
        print_message "${YELLOW}" "⚠ Contenedor ${container_name} no encontrado"
        echo "Contenedor no encontrado: ${container_name}" > "${output_file}"
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
            docker compose -f "${COMPOSE_FILE}" logs -f 2>/dev/null || docker-compose logs -f
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
        docker images | grep -E "sistema-habilitador|mysql|phpmyadmin|drawio|node"
        echo ""

        echo "=== HISTORIAL DE BUILD (última imagen sistema-habilitador) ==="
        IMAGE_ID=$(docker images sistema-habilitador-prod:latest -q 2>/dev/null)
        if [ -n "$IMAGE_ID" ]; then
            echo "Image ID: $IMAGE_ID"
            docker history "$IMAGE_ID" --no-trunc
        else
            echo "No se encontró la imagen sistema-habilitador-prod:latest"
            echo ""
            echo "Buscando otras variantes de la imagen..."
            docker images | grep sistema-habilitador
        fi
        echo ""

        echo "=== INSPECT DE LA IMAGEN ==="
        if [ -n "$IMAGE_ID" ]; then
            docker inspect "$IMAGE_ID"
        else
            echo "No hay imagen para inspeccionar"
        fi
        echo ""

        echo "=== ÚLTIMO BUILD DE DOCKER COMPOSE ==="
        if [ -f "${COMPOSE_FILE}" ]; then
            echo "Archivo compose encontrado: ${COMPOSE_FILE}"
            docker compose -f "${COMPOSE_FILE}" config 2>&1 || docker-compose config 2>&1
        else
            echo "No se encontró archivo compose.yaml"
        fi
        echo ""

        echo "=== LOGS DE BUILDKIT (si disponible) ==="
        docker buildx ls 2>/dev/null || echo "Buildx no disponible"
        echo ""

        echo "=== LOGS DE DOCKER DAEMON (últimas 300 líneas) ==="
        if [ -f /var/log/docker.log ]; then
            tail -300 /var/log/docker.log
        elif [ -f /var/log/syslog ]; then
            tail -300 /var/log/syslog | grep -i docker
        elif command -v journalctl &> /dev/null; then
            journalctl -u docker.service -n 300 --no-pager
        else
            echo "No se encontraron logs del daemon de Docker"
        fi
        echo ""

        echo "=== ERRORES DE BUILD RECIENTES ==="
        if command -v journalctl &> /dev/null; then
            journalctl -u docker.service --since "1 hour ago" --no-pager | grep -i "error\|failed\|fatal" | tail -50
        fi

    } > "${build_log}" 2>&1

    local log_size=$(du -h "${build_log}" | cut -f1)
    print_message "${GREEN}" "✓ Logs de build extraídos: ${build_log} (${log_size})"
}

# Función para extraer logs de instalación NPM dentro del contenedor
extract_npm_logs() {
    local npm_log="${LOG_FILE}_npm_installation.log"

    print_message "${BLUE}" "Extrayendo logs de instalación NPM del contenedor..."

    {
        echo "============================================================================"
        echo "LOGS DE INSTALACIÓN NPM - $(date)"
        echo "============================================================================"
        echo ""

        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            echo "=== VERSIONES DE NODE Y NPM EN CONTENEDOR ==="
            docker exec sist-hab-prod node --version 2>&1
            docker exec sist-hab-prod npm --version 2>&1
            echo ""

            echo "=== CONFIGURACIÓN NPM ==="
            docker exec sist-hab-prod npm config list 2>&1
            echo ""

            echo "=== LISTA DE DEPENDENCIAS INSTALADAS ==="
            docker exec sist-hab-prod npm list --depth=0 2>&1
            echo ""

            echo "=== DEPENDENCIAS CON TODAS LAS VERSIONES ==="
            docker exec sist-hab-prod npm list 2>&1
            echo ""

            echo "=== VERIFICAR DEPENDENCIAS CRÍTICAS ==="
            critical_deps=("express" "mysql2" "bcrypt" "jsonwebtoken" "@bestdon/nodejs-captcha" "multer")
            for dep in "${critical_deps[@]}"; do
                echo "Verificando: $dep"
                docker exec sist-hab-prod npm list "$dep" 2>&1
            done
            echo ""

            echo "=== LOG DE NPM DENTRO DEL CONTENEDOR (si existe) ==="
            docker exec sist-hab-prod cat /tmp/npm-install.log 2>/dev/null || echo "No se encontró /tmp/npm-install.log"
            echo ""

            echo "=== DIRECTORIO NODE_MODULES ==="
            docker exec sist-hab-prod ls -lah node_modules 2>&1 | head -50
            echo ""

            echo "=== TAMAÑO DE NODE_MODULES ==="
            docker exec sist-hab-prod du -sh node_modules 2>&1
            echo ""

            echo "=== PAQUETES CON PROBLEMAS O WARNINGS ==="
            docker exec sist-hab-prod npm list --depth=0 2>&1 | grep -i "UNMET\|missing\|invalid\|extraneous" || echo "No se encontraron problemas"
            echo ""

            echo "=== SCRIPTS DISPONIBLES EN PACKAGE.JSON ==="
            docker exec sist-hab-prod npm run 2>&1
            echo ""

        else
            echo "ERROR: Contenedor sist-hab-prod no está corriendo"
            echo "Intentando extraer información de la imagen..."

            IMAGE_ID=$(docker images sistema-habilitador-prod:latest -q 2>/dev/null)
            if [ -n "$IMAGE_ID" ]; then
                echo "=== ANÁLISIS DE LA IMAGEN ==="
                docker run --rm "$IMAGE_ID" node --version 2>&1
                docker run --rm "$IMAGE_ID" npm --version 2>&1
                docker run --rm "$IMAGE_ID" ls -la /quanium/app/node_modules 2>&1 | head -30
            else
                echo "No se encontró la imagen sistema-habilitador-prod:latest"
            fi
        fi

    } > "${npm_log}" 2>&1

    local log_size=$(du -h "${npm_log}" | cut -f1)
    print_message "${GREEN}" "✓ Logs de NPM extraídos: ${npm_log} (${log_size})"
}

# Función para verificar dependencias de Node
verify_node_dependencies() {
    local verify_log="${LOG_FILE}_node_verification.log"

    print_message "${BLUE}" "Verificando dependencias de Node..."

    {
        echo "============================================================================"
        echo "VERIFICACIÓN DE DEPENDENCIAS NODE - $(date)"
        echo "============================================================================"
        echo ""

        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then

            echo "=== VERIFICACIÓN DE DEPENDENCIAS CRÍTICAS ==="
            echo ""

            # Verificar cada dependencia del package.json
            deps=("express" "mysql2" "bcrypt" "jsonwebtoken" "dotenv" "cors" "helmet"
                  "express-session" "express-rate-limit" "morgan" "multer" "body-parser"
                  "@bestdon/nodejs-captcha" "crypto-js" "node-forge" "node-jsencrypt"
                  "ejs" "moment" "multiparty")

            for dep in "${deps[@]}"; do
                echo "-------------------------------------------------------------------"
                echo "Dependencia: $dep"
                if docker exec sist-hab-prod test -d "node_modules/$dep" 2>/dev/null; then
                    echo "Estado: ✓ INSTALADA"
                    docker exec sist-hab-prod npm list "$dep" 2>&1 | grep -E "$dep@|── " | head -5
                else
                    echo "Estado: ✗ NO ENCONTRADA"
                fi
                echo ""
            done

            echo "============================================================================"
            echo "=== VERIFICACIÓN DE VULNERABILIDADES ==="
            docker exec sist-hab-prod npm audit 2>&1 || echo "npm audit no disponible"
            echo ""

            echo "=== VERIFICACIÓN DE PAQUETES DESACTUALIZADOS ==="
            docker exec sist-hab-prod npm outdated 2>&1 || echo "Todos los paquetes actualizados"
            echo ""

            echo "=== INTEGRIDAD DE PACKAGE-LOCK.JSON ==="
            if docker exec sist-hab-prod test -f package-lock.json 2>/dev/null; then
                echo "✓ package-lock.json existe"
                docker exec sist-hab-prod head -20 package-lock.json 2>&1
            else
                echo "✗ package-lock.json no encontrado"
            fi
            echo ""

            echo "=== VERIFICACIÓN DE MÓDULOS NATIVOS ==="
            echo "Verificando bcrypt (módulo nativo)..."
            docker exec sist-hab-prod node -e "try { const bcrypt = require('bcrypt'); console.log('bcrypt OK - version:', bcrypt.getRounds(10)); } catch(e) { console.log('ERROR bcrypt:', e.message); }" 2>&1

            echo "Verificando canvas (para captcha)..."
            docker exec sist-hab-prod node -e "try { const canvas = require('canvas'); console.log('canvas OK'); } catch(e) { console.log('canvas no disponible o no requerido:', e.message); }" 2>&1
            echo ""

            echo "=== TEST DE IMPORTACIÓN DE MÓDULOS PRINCIPALES ==="
            docker exec sist-hab-prod node -e "
                const modules = ['express', 'mysql2', 'bcrypt', 'jsonwebtoken', 'dotenv'];
                modules.forEach(mod => {
                    try {
                        require(mod);
                        console.log('✓', mod);
                    } catch(e) {
                        console.log('✗', mod, '-', e.message);
                    }
                });
            " 2>&1
            echo ""

        else
            echo "ERROR: Contenedor sist-hab-prod no está corriendo"
            echo "Inicie el contenedor para verificar las dependencias"
        fi

    } > "${verify_log}" 2>&1

    cat "${verify_log}"

    local log_size=$(du -h "${verify_log}" | cut -f1)
    print_message "${GREEN}" "✓ Verificación guardada en: ${verify_log} (${log_size})"
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
        echo "FQDN: $(hostname -f 2>/dev/null || echo 'N/A')"
        echo "IP Address: $(hostname -I | cut -f1 -d' ')"
        echo "OS: $(uname -a)"
        if [ -f /etc/os-release ]; then
            echo ""
            cat /etc/os-release
        fi
        echo ""

        echo "=== VERSIONES DE SOFTWARE ==="
        echo "Docker version:"
        docker --version
        echo ""
        echo "Docker Compose version:"
        docker compose version 2>/dev/null || docker-compose --version 2>/dev/null
        echo ""
        echo "Node version (host):"
        node --version 2>/dev/null || echo "Node no instalado en host"
        echo ""
        echo "NPM version (host):"
        npm --version 2>/dev/null || echo "NPM no instalado en host"
        echo ""
        echo "Node version (en contenedor):"
        docker exec sist-hab-prod node --version 2>/dev/null || echo "Contenedor no disponible"
        echo ""
        echo "NPM version (en contenedor):"
        docker exec sist-hab-prod npm --version 2>/dev/null || echo "Contenedor no disponible"
        echo ""

        echo "=== ESTADO DE CONTENEDORES ==="
        docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
        echo ""

        echo "=== ESTADO DETALLADO DE CONTENEDORES ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "============================================================"
                echo "Contenedor: ${container}"
                echo "============================================================"
                docker inspect "${container}" --format '
Status: {{.State.Status}}
Running: {{.State.Running}}
StartedAt: {{.State.StartedAt}}
FinishedAt: {{.State.FinishedAt}}
ExitCode: {{.State.ExitCode}}
Error: {{.State.Error}}
RestartCount: {{.RestartCount}}
Health: {{.State.Health.Status}}
' 2>/dev/null
                echo ""
            fi
        done

        echo "=== REDES DOCKER ==="
        docker network ls
        echo ""
        echo "=== DETALLE DE RED DEL SISTEMA HABILITADOR ==="
        NETWORK_NAME=$(docker network ls --format '{{.Name}}' | grep -E "sistema-habilitador|default" | head -1)
        if [ -n "$NETWORK_NAME" ]; then
            docker network inspect "$NETWORK_NAME" 2>/dev/null
        else
            echo "Red no encontrada"
        fi
        echo ""

        echo "=== VOLÚMENES DOCKER ==="
        docker volume ls
        echo ""
        echo "=== DETALLE DE VOLÚMENES DEL SISTEMA ==="
        docker volume ls --format '{{.Name}}' | grep sistema-habilitador | while read vol; do
            echo "--- Volumen: $vol ---"
            docker volume inspect "$vol" 2>/dev/null
            echo ""
        done

        echo "=== USO DE RECURSOS POR CONTENEDOR ==="
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        echo ""

        echo "=== ESPACIO EN DISCO DEL HOST ==="
        df -h
        echo ""

        echo "=== ESPACIO USADO POR DOCKER ==="
        docker system df -v
        echo ""

        echo "=== MEMORIA Y CPU DEL SISTEMA ==="
        free -h 2>/dev/null || echo "Comando free no disponible"
        echo ""
        cat /proc/cpuinfo 2>/dev/null | grep "model name" | head -1 || echo "Info CPU no disponible"
        echo "CPU cores: $(nproc 2>/dev/null || echo 'N/A')"
        echo ""

        echo "=== PROCESOS EN CONTENEDOR DE APLICACIÓN ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            docker exec sist-hab-prod ps aux 2>/dev/null
        else
            echo "Contenedor no disponible"
        fi
        echo ""

        echo "=== VARIABLES DE ENTORNO (contenedor aplicación - sin secretos) ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            docker exec sist-hab-prod env 2>/dev/null | grep -v -E "PASSWORD|SECRET|KEY" | sort
        else
            echo "Contenedor no disponible"
        fi
        echo ""

        echo "=== PUERTOS EXPUESTOS Y EN USO ==="
        netstat -tuln 2>/dev/null | grep -E "7777|3306|82|83|84" || ss -tuln 2>/dev/null | grep -E "7777|3306|82|83|84" || echo "Comando netstat/ss no disponible"
        echo ""
        docker ps --format "table {{.Names}}\t{{.Ports}}"
        echo ""

        echo "=== CONECTIVIDAD DE RED ENTRE CONTENEDORES ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            echo "Ping desde app a base de datos (dbsh):"
            docker exec sist-hab-prod ping -c 3 dbsh 2>/dev/null || echo "Ping falló o no disponible"
            echo ""
            echo "Resolución DNS de dbsh:"
            docker exec sist-hab-prod nslookup dbsh 2>/dev/null || docker exec sist-hab-prod getent hosts dbsh 2>/dev/null || echo "Resolución DNS no disponible"
        else
            echo "Contenedor de aplicación no disponible"
        fi
        echo ""

        echo "=== ARCHIVOS DE CONFIGURACIÓN ==="
        echo "--- package.json ---"
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            docker exec sist-hab-prod cat package.json 2>/dev/null
        else
            echo "Contenedor no disponible"
        fi
        echo ""

        echo "=== ESTRUCTURA DE DIRECTORIOS EN CONTENEDOR ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            docker exec sist-hab-prod find /quanium/app -maxdepth 3 -type d 2>/dev/null | sort
        else
            echo "Contenedor no disponible"
        fi
        echo ""

        echo "=== LOGS DE ERRORES RECIENTES (últimas 100 líneas) ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "-------------------------------------------------------------------"
                echo "Errores en ${container}:"
                docker logs "${container}" 2>&1 | grep -iE "error|fatal|exception|failed" | tail -100 || echo "Sin errores recientes"
                echo ""
            fi
        done

    } > "${system_info}" 2>&1

    local log_size=$(du -h "${system_info}" | cut -f1)
    print_message "${GREEN}" "✓ Información del sistema extraída: ${system_info} (${log_size})"
}

# Función para extraer logs de Docker daemon y sistema
extract_docker_daemon_logs() {
    local daemon_log="${LOG_FILE}_docker_daemon.log"

    print_message "${BLUE}" "Extrayendo logs de Docker daemon y sistema..."

    {
        echo "============================================================================"
        echo "LOGS DE DOCKER DAEMON Y SISTEMA - $(date)"
        echo "============================================================================"
        echo ""

        echo "=== INFORMACIÓN DEL DAEMON DE DOCKER ==="
        docker info 2>&1
        echo ""

        echo "=== LOGS DEL SERVICIO DOCKER (últimas 500 líneas) ==="
        if command -v journalctl &> /dev/null; then
            journalctl -u docker.service -n 500 --no-pager
        elif [ -f /var/log/docker.log ]; then
            tail -500 /var/log/docker.log
        elif [ -f /var/log/syslog ]; then
            tail -500 /var/log/syslog | grep docker
        else
            echo "No se encontraron logs del daemon"
        fi
        echo ""

        echo "=== ERRORES CRÍTICOS DEL DAEMON (última hora) ==="
        if command -v journalctl &> /dev/null; then
            journalctl -u docker.service --since "1 hour ago" --no-pager | grep -iE "error|fatal|failed|warning" | tail -200
        fi
        echo ""

        echo "=== CONFIGURACIÓN DEL DAEMON ==="
        if [ -f /etc/docker/daemon.json ]; then
            cat /etc/docker/daemon.json
        else
            echo "No se encontró /etc/docker/daemon.json"
        fi
        echo ""

        echo "=== EVENTOS DE DOCKER (última hora) ==="
        docker events --since 1h --until 0s 2>&1 | tail -100 || echo "No hay eventos recientes"
        echo ""

        echo "=== LOGS DE BUILDKIT ==="
        if command -v journalctl &> /dev/null; then
            journalctl --since "24 hours ago" --no-pager | grep -i buildkit | tail -100 || echo "No hay logs de buildkit"
        fi
        echo ""

        echo "=== LOGS DEL SISTEMA RELACIONADOS CON DOCKER ==="
        if command -v journalctl &> /dev/null; then
            journalctl --since "1 hour ago" --no-pager | grep -iE "docker|container|compose" | tail -200
        fi

    } > "${daemon_log}" 2>&1

    local log_size=$(du -h "${daemon_log}" | cut -f1)
    print_message "${GREEN}" "✓ Logs de daemon extraídos: ${daemon_log} (${log_size})"
}

# Función para generar reporte completo
generate_full_report() {
    print_message "${GREEN}" "Generando reporte completo..."
    echo ""

    extract_all_logs
    echo ""
    extract_build_logs
    echo ""
    extract_npm_logs
    echo ""
    extract_system_info
    echo ""
    extract_docker_daemon_logs
    echo ""
    diagnose_issues

    # Crear archivo comprimido con todos los logs
    local archive_name="${LOG_DIR}/reporte_completo_${TIMESTAMP}.tar.gz"
    tar -czf "${archive_name}" "${LOG_FILE}"* 2>/dev/null

    if [ $? -eq 0 ]; then
        local archive_size=$(du -h "${archive_name}" | cut -f1)
        print_message "${GREEN}" "✓ Reporte comprimido generado: ${archive_name} (${archive_size})"
    fi

    echo ""
    print_message "${GREEN}" "============================================================================"
    print_message "${GREEN}" "               REPORTE COMPLETO GENERADO EXITOSAMENTE"
    print_message "${GREEN}" "============================================================================"
    print_message "${YELLOW}" "Ubicación de archivos: ${LOG_DIR}/"
    echo ""
    ls -lh "${LOG_DIR}" | tail -20
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
                UPTIME=$(docker inspect --format='{{.State.StartedAt}}' "${container}" 2>/dev/null)
                echo "  Iniciado: ${UPTIME}"
            elif docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                echo "✗ ${container}: STOPPED o ERROR"
                echo "  Estado:"
                docker ps -a --filter "name=${container}" --format "  {{.Status}}"
                echo "  Exit Code:"
                docker inspect --format='  {{.State.ExitCode}}' "${container}" 2>/dev/null
                echo "  Últimas líneas de log:"
                docker logs --tail 20 "${container}" 2>&1 | sed 's/^/    /'
            else
                echo "✗ ${container}: NO EXISTE"
            fi
            echo ""
        done

        echo "=== VERIFICANDO CONECTIVIDAD DE BASE DE DATOS ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            if docker exec sist-hab-prod ping -c 2 dbsh > /dev/null 2>&1; then
                echo "✓ Conectividad de red con base de datos: OK"
            else
                echo "✗ Conectividad de red con base de datos: FALLO"
            fi
        else
            echo "⚠ Contenedor de aplicación no está corriendo"
        fi
        echo ""

        echo "=== VERIFICANDO MYSQL ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-db-prod$"; then
            if docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium > /dev/null 2>&1; then
                echo "✓ MySQL responde: OK"
                echo "  Bases de datos:"
                docker exec sist-hab-db-prod mysql -u root -pquanium -e "SHOW DATABASES;" 2>/dev/null | sed 's/^/    /'
            else
                echo "✗ MySQL no responde o hay error de autenticación"
            fi
        else
            echo "⚠ Contenedor de base de datos no está corriendo"
        fi
        echo ""

        echo "=== VERIFICANDO TABLA DE USUARIOS ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-db-prod$"; then
            if docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SHOW TABLES LIKE 'usuarios';" 2>/dev/null | grep -q usuarios; then
                echo "✓ Tabla 'usuarios' existe"
                USER_COUNT=$(docker exec sist-hab-db-prod mysql -u root -pquanium -se "SELECT COUNT(*) FROM sisthabpro.usuarios;" 2>/dev/null)
                echo "  Total de usuarios: ${USER_COUNT}"
            else
                echo "✗ Tabla 'usuarios' NO existe"
            fi
        else
            echo "⚠ Contenedor de base de datos no está corriendo"
        fi
        echo ""

        echo "=== VERIFICANDO APLICACIÓN WEB ==="
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            if docker exec sist-hab-prod wget --spider -q http://localhost:7777/api/health 2>/dev/null; then
                echo "✓ Aplicación responde en puerto 7777: OK"
            else
                echo "✗ Aplicación NO responde en puerto 7777"
            fi
        else
            echo "⚠ Contenedor de aplicación no está corriendo"
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
        if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
            docker exec sist-hab-prod test -d node_modules && echo "✓ node_modules existe" || echo "✗ node_modules NO existe"
        else
            echo "⚠ Contenedor de aplicación no está corriendo"
        fi
        echo ""

        echo "=== ERRORES CRÍTICOS EN LOGS ==="
        for container in "${CONTENEDORES[@]}"; do
            if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
                ERROR_COUNT=$(docker logs "${container}" 2>&1 | grep -ic error)
                echo "${container}: ${ERROR_COUNT} errores encontrados"
            fi
        done
        echo ""

        echo "=== RECOMENDACIONES ==="
        ALL_RUNNING=true
        for container in "${CONTENEDORES[@]}"; do
            if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
                ALL_RUNNING=false
                break
            fi
        done

        if [ "$ALL_RUNNING" = false ]; then
            echo "⚠ PROBLEMA: No todos los contenedores están corriendo"
            echo "  Recomendación: Revisar logs de contenedores detenidos"
            echo "  Comando: docker logs <nombre-contenedor>"
        else
            echo "✓ Todos los contenedores están corriendo"
        fi
        echo ""

        echo "=== COMANDOS ÚTILES PARA DIAGNÓSTICO ==="
        echo "Ver logs en tiempo real: docker logs -f sist-hab-prod"
        echo "Reiniciar contenedor: docker restart sist-hab-prod"
        echo "Reconstruir imagen: docker compose build --no-cache"
        echo "Ver estado de servicios: docker compose ps"
        echo "Ejecutar shell en contenedor: docker exec -it sist-hab-prod /bin/sh"

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
                ;;
            10)
                extract_npm_logs
                ;;
            11)
                verify_node_dependencies
                ;;
            12)
                extract_docker_daemon_logs
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
