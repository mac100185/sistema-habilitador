#!/bin/bash

################################################################################
# SCRIPT DE DIAGNÓSTICO Y REPARACIÓN - SISTEMA HABILITADOR
################################################################################
# Este script diagnostica y repara problemas comunes del sistema:
# - Problemas de conexión a base de datos
# - Contenedores no iniciando correctamente
# - Credenciales incorrectas
# - Problemas de red Docker
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "=============================================================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================================================="
}

# Verificar si se está ejecutando como root o con sudo
check_permissions() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Ejecutando como root"
    fi
}

# Verificar que Docker esté instalado y corriendo
check_docker() {
    print_header "1. VERIFICANDO DOCKER"

    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        echo "Por favor instale Docker antes de continuar"
        exit 1
    fi
    print_success "Docker está instalado"

    if ! docker info &> /dev/null; then
        print_error "Docker daemon no está corriendo"
        echo "Por favor inicie Docker: sudo systemctl start docker"
        exit 1
    fi
    print_success "Docker daemon está corriendo"

    docker --version
}

# Verificar Docker Compose
check_docker_compose() {
    print_header "2. VERIFICANDO DOCKER COMPOSE"

    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose no está disponible"
        exit 1
    fi
    print_success "Docker Compose está disponible"
    docker compose version
}

# Verificar estado de contenedores
check_containers() {
    print_header "3. VERIFICANDO ESTADO DE CONTENEDORES"

    echo ""
    echo "Contenedores del sistema:"
    docker ps -a --filter "name=sist-hab" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo ""

    # Verificar cada contenedor
    if docker ps --filter "name=sist-hab-db-prod" --filter "status=running" | grep -q sist-hab-db-prod; then
        print_success "sist-hab-db-prod está corriendo"
    else
        print_error "sist-hab-db-prod NO está corriendo"
        NEEDS_RESTART=true
    fi

    if docker ps --filter "name=sist-hab-prod" --filter "status=running" | grep -q sist-hab-prod; then
        print_success "sist-hab-prod está corriendo"
    else
        print_error "sist-hab-prod NO está corriendo"
        NEEDS_RESTART=true
    fi

    if docker ps --filter "name=sist-hab-phpmyadmin-prod" --filter "status=running" | grep -q sist-hab-phpmyadmin-prod; then
        print_success "sist-hab-phpmyadmin-prod está corriendo"
    else
        print_warning "sist-hab-phpmyadmin-prod NO está corriendo (opcional)"
    fi
}

# Verificar logs de contenedores
check_container_logs() {
    print_header "4. VERIFICANDO LOGS DE CONTENEDORES"

    echo ""
    print_info "Últimas líneas de logs de sist-hab-db-prod:"
    docker logs sist-hab-db-prod --tail 20 2>&1 | grep -E "ERROR|error|ready|started|failed|mysqld" || echo "Sin errores críticos"

    echo ""
    print_info "Últimas líneas de logs de sist-hab-prod:"
    docker logs sist-hab-prod --tail 20 2>&1 | grep -E "ERROR|error|✅|❌|conecta|ECONNREFUSED" || echo "Sin errores críticos"
}

# Verificar conectividad de red
check_network() {
    print_header "5. VERIFICANDO RED DOCKER"

    if docker network ls | grep -q sist-hab-network; then
        print_success "Red sist-hab-network existe"
    else
        print_error "Red sist-hab-network NO existe"
        NEEDS_RESTART=true
    fi

    echo ""
    print_info "Contenedores en la red:"
    docker network inspect sist-hab-network 2>/dev/null | grep -A 2 "Name" | grep -E "Name|IPv4Address" || print_warning "No se pudo inspeccionar la red"
}

# Verificar salud de la base de datos
check_database_health() {
    print_header "6. VERIFICANDO SALUD DE LA BASE DE DATOS"

    if docker ps --filter "name=sist-hab-db-prod" --filter "status=running" | grep -q sist-hab-db-prod; then
        echo ""
        print_info "Intentando ping a MySQL..."
        if docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium 2>/dev/null | grep -q "alive"; then
            print_success "MySQL responde correctamente"
        else
            print_error "MySQL NO responde"
            NEEDS_DB_INIT=true
        fi

        echo ""
        print_info "Verificando base de datos sisthabpro..."
        if docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SELECT COUNT(*) FROM usuarios;" 2>/dev/null | grep -q "[0-9]"; then
            print_success "Base de datos sisthabpro existe y tiene usuarios"
            USER_COUNT=$(docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SELECT COUNT(*) as count FROM usuarios;" 2>/dev/null | tail -1)
            echo "   Usuarios en la base de datos: $USER_COUNT"
        else
            print_error "Base de datos sisthabpro NO está inicializada correctamente"
            NEEDS_DB_INIT=true
        fi
    else
        print_error "Contenedor de base de datos no está corriendo"
    fi
}

# Verificar salud de la aplicación web
check_web_health() {
    print_header "7. VERIFICANDO SALUD DE LA APLICACIÓN WEB"

    if docker ps --filter "name=sist-hab-prod" --filter "status=running" | grep -q sist-hab-prod; then
        echo ""
        print_info "Verificando endpoint de salud..."

        HEALTH_RESPONSE=$(docker exec sist-hab-prod wget -q -O - http://localhost:7777/api/health 2>/dev/null || echo "failed")

        if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
            print_success "Aplicación responde correctamente"
            echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
        else
            print_error "Aplicación NO responde correctamente"
            echo "Respuesta: $HEALTH_RESPONSE"
        fi
    else
        print_error "Contenedor de aplicación no está corriendo"
    fi
}

# Verificar archivo .env
check_env_file() {
    print_header "8. VERIFICANDO CONFIGURACIÓN (.env)"

    if [ -f ".env" ]; then
        print_success "Archivo .env existe"

        # Verificar variables críticas
        if grep -q "JWT_SECRET=" .env && ! grep -q "JWT_SECRET=$" .env && ! grep -q "JWT_SECRET=temporary" .env; then
            print_success "JWT_SECRET está configurado"
        else
            print_warning "JWT_SECRET necesita ser configurado"
        fi

        if grep -q "DB_PASSWORD=quanium" .env; then
            print_warning "DB_PASSWORD usa valor por defecto (considere cambiarlo en producción)"
        fi
    else
        print_warning "Archivo .env NO existe (se creará automáticamente al iniciar)"
    fi
}

# Verificar archivos SQL de inicialización
check_sql_files() {
    print_header "9. VERIFICANDO ARCHIVOS SQL"

    if [ -f "db/sisthabpro.sql" ]; then
        print_success "db/sisthabpro.sql existe"
    else
        print_error "db/sisthabpro.sql NO existe"
    fi

    if [ -f "db/usuarios.sql" ]; then
        print_success "db/usuarios.sql existe"

        # Verificar que tenga usuarios de prueba
        if grep -q "INSERT INTO \`usuarios\`" db/usuarios.sql; then
            print_success "Archivo contiene datos de usuarios"
        else
            print_warning "Archivo no contiene datos de usuarios"
        fi
    else
        print_error "db/usuarios.sql NO existe"
    fi
}

# Función para reiniciar servicios
restart_services() {
    print_header "REINICIANDO SERVICIOS"

    read -p "¿Desea reiniciar los servicios? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        print_info "Deteniendo contenedores..."
        docker compose down

        print_info "Esperando 5 segundos..."
        sleep 5

        print_info "Iniciando contenedores..."
        docker compose up -d

        print_info "Esperando a que los servicios estén listos (60 segundos)..."
        sleep 60

        print_success "Servicios reiniciados"

        # Verificar estado después del reinicio
        check_containers
        check_web_health
    fi
}

# Función para reconstruir la base de datos
rebuild_database() {
    print_header "RECONSTRUIR BASE DE DATOS"

    print_warning "ADVERTENCIA: Esto eliminará todos los datos existentes en la base de datos"
    read -p "¿Está seguro que desea continuar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        print_info "Deteniendo contenedor de base de datos..."
        docker compose stop dbsh

        print_info "Eliminando volumen de base de datos..."
        docker volume rm sist-hab_mysql_data 2>/dev/null || print_warning "Volumen no existe o no se pudo eliminar"

        print_info "Iniciando contenedor de base de datos..."
        docker compose up -d dbsh

        print_info "Esperando a que la base de datos esté lista (90 segundos)..."
        sleep 90

        print_success "Base de datos reconstruida"

        print_info "Reiniciando aplicación web..."
        docker compose restart websh

        sleep 20

        check_database_health
    fi
}

# Función para mostrar credenciales
show_credentials() {
    print_header "CREDENCIALES DEL SISTEMA"

    echo ""
    echo "Base de Datos MySQL:"
    echo "  Host: dbsh (o localhost:3306 desde el host)"
    echo "  Usuario root: root"
    echo "  Contraseña root: quanium"
    echo "  Base de datos: sisthabpro"
    echo "  Usuario aplicación: quanium"
    echo "  Contraseña aplicación: quanium"
    echo ""
    echo "Usuarios de la Aplicación Web:"
    echo "  Admin:"
    echo "    Username: admin"
    echo "    Password: admin"
    echo "    Role: admin"
    echo ""
    echo "  Analista:"
    echo "    Username: analista"
    echo "    Password: analista"
    echo "    Role: analista"
    echo ""
    echo "URLs de Acceso:"
    echo "  Aplicación Web: http://localhost:7777"
    echo "  Health Check: http://localhost:7777/api/health"
    echo "  phpMyAdmin: http://localhost:82"
    echo "  Draw.io: http://localhost:83"
}

# Función para mostrar opciones de reparación
show_repair_options() {
    print_header "OPCIONES DE REPARACIÓN"

    echo ""
    echo "Acciones disponibles:"
    echo "  1. Reiniciar servicios"
    echo "  2. Reconstruir base de datos (elimina datos existentes)"
    echo "  3. Ver credenciales del sistema"
    echo "  4. Ver logs detallados"
    echo "  5. Salir"
    echo ""
    read -p "Seleccione una opción (1-5): " -n 1 -r
    echo

    case $REPLY in
        1)
            restart_services
            ;;
        2)
            rebuild_database
            ;;
        3)
            show_credentials
            ;;
        4)
            print_header "LOGS DETALLADOS"
            echo ""
            print_info "Logs de sist-hab-db-prod:"
            docker logs sist-hab-db-prod --tail 50
            echo ""
            print_info "Logs de sist-hab-prod:"
            docker logs sist-hab-prod --tail 50
            ;;
        5)
            print_info "Saliendo..."
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            ;;
    esac
}

# Función principal
main() {
    clear

    print_header "SISTEMA HABILITADOR - DIAGNÓSTICO Y REPARACIÓN"
    echo "Script de diagnóstico automático"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"

    # Variables de control
    NEEDS_RESTART=false
    NEEDS_DB_INIT=false

    # Ejecutar verificaciones
    check_permissions
    check_docker
    check_docker_compose
    check_containers
    check_network
    check_env_file
    check_sql_files
    check_database_health
    check_web_health
    check_container_logs

    # Resumen
    print_header "RESUMEN DE DIAGNÓSTICO"

    if [ "$NEEDS_RESTART" = true ] || [ "$NEEDS_DB_INIT" = true ]; then
        echo ""
        print_warning "Se detectaron problemas que requieren atención"

        if [ "$NEEDS_RESTART" = true ]; then
            echo "  - Algunos contenedores no están corriendo"
        fi

        if [ "$NEEDS_DB_INIT" = true ]; then
            echo "  - La base de datos necesita inicialización"
        fi

        echo ""
        show_repair_options
    else
        echo ""
        print_success "Todos los servicios están funcionando correctamente"
        echo ""
        show_credentials
    fi
}

# Cambiar al directorio del proyecto
cd "$(dirname "$0")/.." || exit 1

# Ejecutar función principal
main

print_header "FIN DEL DIAGNÓSTICO"
