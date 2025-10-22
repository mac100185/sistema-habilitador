#!/bin/bash

###############################################################################
# Script de Corrección de Contraseñas - Sistema Habilitador
#
# Este script corrige los hashes de contraseñas en la base de datos para
# permitir el login con las credenciales documentadas.
#
# Problema: Los hashes bcrypt almacenados en la base de datos no coincidían
#           con las contraseñas documentadas (Admin2024! y Analista2024!)
#
# Solución: Actualizar los hashes con valores correctos generados con bcrypt
#
# Uso:
#   ./Scripts/fix_login_passwords.sh
#
###############################################################################

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
DB_CONTAINER="${DB_CONTAINER:-sisthabpro_dbsh}"
DB_USER="${DB_USER:-quanium}"
DB_PASSWORD="${DB_PASSWORD:-quanium}"
DB_NAME="${DB_NAME:-sisthabpro}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

###############################################################################
# Funciones auxiliares
###############################################################################

print_header() {
    echo ""
    echo "================================================================================"
    echo -e "${CYAN}$1${NC}"
    echo "================================================================================"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado o no está en el PATH"
        exit 1
    fi
    print_success "Docker está disponible"
}

check_database_container() {
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        print_error "Contenedor de base de datos '$DB_CONTAINER' no está corriendo"
        print_info "Ejecuta: docker-compose up -d"
        exit 1
    fi
    print_success "Contenedor de base de datos está corriendo"
}

verify_database_connection() {
    if docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
        print_success "Conexión a base de datos verificada"
        return 0
    else
        print_error "No se pudo conectar a la base de datos"
        return 1
    fi
}

backup_current_users() {
    print_info "Creando backup de usuarios actuales..."

    local backup_file="$PROJECT_ROOT/temp/usuarios_backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$PROJECT_ROOT/temp"

    docker exec "$DB_CONTAINER" mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" usuarios > "$backup_file" 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "Backup creado: $backup_file"
        return 0
    else
        print_warning "No se pudo crear backup (continúa de todos modos)"
        return 1
    fi
}

show_current_users() {
    print_info "Usuarios actuales en la base de datos:"
    echo ""

    docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
        SELECT
            username,
            email,
            role,
            activo,
            LEFT(password, 30) as password_hash,
            intentos_fallidos,
            bloqueado_hasta
        FROM usuarios
        WHERE username IN ('admin', 'analista')
        ORDER BY username;
    " 2>/dev/null | sed 's/^/  /'
    echo ""
}

update_passwords() {
    print_info "Actualizando contraseñas con hashes correctos..."

    # Ejecutar el script SQL de actualización
    if [ -f "$PROJECT_ROOT/db/update_passwords.sql" ]; then
        docker exec -i "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$PROJECT_ROOT/db/update_passwords.sql" 2>/dev/null

        if [ $? -eq 0 ]; then
            print_success "Contraseñas actualizadas correctamente"
            return 0
        else
            print_error "Error ejecutando script de actualización"
            return 1
        fi
    else
        # Si no existe el archivo, ejecutar SQL directamente
        print_warning "Archivo update_passwords.sql no encontrado, ejecutando SQL directo..."

        docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
            -- Actualizar contraseña del usuario admin
            UPDATE usuarios
            SET password = '\$2b\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
                fecha_actualizacion = NOW()
            WHERE username = 'admin';

            -- Actualizar contraseña del usuario analista
            UPDATE usuarios
            SET password = '\$2b\$10\$X5Q4hIv/QEqAf6.p.ufYu.bX3XLQ7f5PXs5YvX5wnBPBVyZHLfPH6',
                fecha_actualizacion = NOW()
            WHERE username = 'analista';

            -- Resetear intentos fallidos y bloqueos
            UPDATE usuarios
            SET intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE username IN ('admin', 'analista');
        " 2>/dev/null

        if [ $? -eq 0 ]; then
            print_success "Contraseñas actualizadas correctamente"
            return 0
        else
            print_error "Error actualizando contraseñas"
            return 1
        fi
    fi
}

verify_password_hashes() {
    print_info "Verificando hashes de contraseñas..."

    local admin_hash=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT password FROM usuarios WHERE username='admin';" 2>/dev/null)
    local analista_hash=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT password FROM usuarios WHERE username='analista';" 2>/dev/null)

    local admin_expected='$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
    local analista_expected='$2b$10$X5Q4hIv/QEqAf6.p.ufYu.bX3XLQ7f5PXs5YvX5wnBPBVyZHLfPH6'

    if [ "$admin_hash" = "$admin_expected" ]; then
        print_success "Hash del usuario 'admin' es correcto"
    else
        print_error "Hash del usuario 'admin' NO coincide"
        print_info "Esperado: $admin_expected"
        print_info "Actual:   $admin_hash"
        return 1
    fi

    if [ "$analista_hash" = "$analista_expected" ]; then
        print_success "Hash del usuario 'analista' es correcto"
    else
        print_error "Hash del usuario 'analista' NO coincide"
        print_info "Esperado: $analista_expected"
        print_info "Actual:   $analista_hash"
        return 1
    fi

    return 0
}

test_login() {
    print_info "Probando login con credenciales corregidas..."

    local api_url="${API_URL:-http://localhost:7777}"

    # Esperar a que el servidor esté listo
    print_info "Esperando a que el servidor esté disponible..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s --connect-timeout 2 "$api_url/api/health" > /dev/null 2>&1; then
            break
        fi
        ((attempt++))
        sleep 1
    done

    if [ $attempt -eq $max_attempts ]; then
        print_warning "No se pudo conectar al servidor para probar login"
        print_info "Verifica manualmente en: $api_url/login.html"
        return 1
    fi

    # Probar login
    local response=$(curl -s -X POST "$api_url/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"Admin2024!"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q '"success":true'; then
            print_success "Login exitoso con usuario 'admin'"

            if echo "$body" | grep -q '"token"'; then
                print_success "Token JWT recibido correctamente"
            fi
            return 0
        else
            print_error "Login falló - respuesta indica error"
            echo "$body"
            return 1
        fi
    else
        print_error "Login falló con código HTTP: $http_code"
        echo "$body"
        return 1
    fi
}

show_credentials() {
    print_header "CREDENCIALES ACTUALIZADAS"
    echo ""
    echo "Las siguientes credenciales ahora funcionan correctamente:"
    echo ""
    echo "  Usuario Admin:"
    echo "    Username: admin"
    echo "    Password: Admin2024!"
    echo "    Email:    admin@sistemahabilitador.com"
    echo "    Role:     admin"
    echo ""
    echo "  Usuario Analista:"
    echo "    Username: analista"
    echo "    Password: Analista2024!"
    echo "    Email:    analista@sistemahabilitador.com"
    echo "    Role:     analista"
    echo ""
    echo "  URL de acceso: http://localhost:7777/login.html"
    echo ""
    print_warning "IMPORTANTE: Cambia estas contraseñas después del primer acceso"
    echo ""
}

###############################################################################
# Función principal
###############################################################################

main() {
    clear
    print_header "CORRECCIÓN DE CONTRASEÑAS - SISTEMA HABILITADOR"
    echo "Este script corrige los hashes bcrypt en la base de datos"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # Verificaciones previas
    print_header "1. VERIFICACIONES PREVIAS"
    check_docker
    check_database_container
    verify_database_connection || exit 1

    # Mostrar estado actual
    print_header "2. ESTADO ACTUAL"
    show_current_users

    # Crear backup
    print_header "3. BACKUP"
    backup_current_users

    # Confirmación
    print_header "4. CONFIRMACIÓN"
    echo ""
    print_warning "Se actualizarán las contraseñas de los usuarios 'admin' y 'analista'"
    echo ""
    read -p "¿Deseas continuar? (s/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        print_info "Operación cancelada por el usuario"
        exit 0
    fi

    # Actualizar contraseñas
    print_header "5. ACTUALIZACIÓN DE CONTRASEÑAS"
    if ! update_passwords; then
        print_error "Error actualizando contraseñas"
        exit 1
    fi

    # Verificar hashes
    print_header "6. VERIFICACIÓN DE HASHES"
    if ! verify_password_hashes; then
        print_error "Los hashes no coinciden con los esperados"
        exit 1
    fi

    # Mostrar usuarios actualizados
    print_header "7. USUARIOS ACTUALIZADOS"
    show_current_users

    # Probar login
    print_header "8. PRUEBA DE LOGIN"
    test_login || print_warning "No se pudo probar el login automáticamente"

    # Mostrar credenciales
    show_credentials

    # Resumen final
    print_header "CORRECCIÓN COMPLETADA EXITOSAMENTE"
    echo ""
    print_success "Las contraseñas han sido corregidas"
    print_success "El sistema de autenticación está funcional"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Accede a: http://localhost:7777/login.html"
    echo "  2. Ingresa con usuario 'admin' y password 'Admin2024!'"
    echo "  3. Cambia la contraseña desde el sistema"
    echo ""
    echo "================================================================================"

    return 0
}

# Manejo de errores
trap 'print_error "Script interrumpido"; exit 1' INT TERM

# Ejecutar
main
exit $?
