#!/bin/bash

###############################################################################
# Script de Verificación Rápida del Sistema de Login
# Sistema Habilitador
#
# Este script verifica que las correcciones aplicadas al sistema de
# autenticación funcionan correctamente.
#
# Uso:
#   ./Scripts/verificar_login.sh
###############################################################################

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_HOST="${API_HOST:-localhost}"
API_PORT="${API_PORT:-7777}"
API_URL="http://${API_HOST}:${API_PORT}"

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Funciones auxiliares
###############################################################################

print_header() {
    echo ""
    echo "================================================================================"
    echo -e "${BLUE}$1${NC}"
    echo "================================================================================"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

###############################################################################
# Tests
###############################################################################

test_server_running() {
    print_header "1. Verificando que el servidor está corriendo"

    if curl -s --connect-timeout 5 "${API_URL}/api/health" > /dev/null 2>&1; then
        print_success "Servidor accesible en ${API_URL}"
        return 0
    else
        print_error "No se pudo conectar al servidor en ${API_URL}"
        print_info "Verifica que el contenedor esté corriendo: docker-compose ps"
        return 1
    fi
}

test_health_check() {
    print_header "2. Verificando Health Check"

    RESPONSE=$(curl -s "${API_URL}/api/health")

    if echo "$RESPONSE" | grep -q '"status":"ok"'; then
        print_success "Health check OK"

        if echo "$RESPONSE" | grep -q '"database":"connected"'; then
            print_success "Base de datos conectada"
        else
            print_warning "Base de datos no conectada"
        fi
        return 0
    else
        print_error "Health check falló"
        echo "Respuesta: $RESPONSE"
        return 1
    fi
}

test_login_endpoint() {
    print_header "3. Verificando endpoint de login"

    # Intentar login con credenciales por defecto
    RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"Admin2024!"}' \
        -w "\n%{http_code}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -q '"success":true'; then
            print_success "Login exitoso con credenciales admin"

            # Verificar que se recibió un token
            if echo "$BODY" | grep -q '"token"'; then
                print_success "Token JWT recibido correctamente"

                # Extraer el token para uso posterior
                TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
                export LOGIN_TOKEN="$TOKEN"
                return 0
            else
                print_error "No se recibió token JWT en la respuesta"
                return 1
            fi
        else
            print_error "Login falló - respuesta indica error"
            echo "Respuesta: $BODY"
            return 1
        fi
    elif [ "$HTTP_CODE" = "401" ]; then
        print_error "Credenciales incorrectas o usuario no existe"
        print_info "Ejecuta: docker exec -it sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro < db/usuarios.sql"
        return 1
    else
        print_error "Error HTTP $HTTP_CODE"
        echo "Respuesta: $BODY"
        return 1
    fi
}

test_token_verification() {
    print_header "4. Verificando validación de token"

    if [ -z "$LOGIN_TOKEN" ]; then
        print_warning "No hay token disponible, saltando prueba"
        return 0
    fi

    RESPONSE=$(curl -s -X GET "${API_URL}/api/auth/verify" \
        -H "Authorization: Bearer ${LOGIN_TOKEN}" \
        -w "\n%{http_code}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -q '"success":true'; then
            print_success "Token validado correctamente"
            return 0
        else
            print_error "Token inválido según el servidor"
            return 1
        fi
    else
        print_error "Error HTTP $HTTP_CODE al validar token"
        echo "Respuesta: $BODY"
        return 1
    fi
}

test_html_files() {
    print_header "5. Verificando archivos HTML"

    # Verificar que login.html existe y tiene el formulario correcto
    if [ -f "src/publico/login.html" ]; then
        print_success "Archivo login.html existe"

        if grep -q 'id="login-form"' src/publico/login.html; then
            print_success "Formulario tiene ID correcto: login-form"
        else
            print_error "Formulario no tiene ID 'login-form'"
            return 1
        fi

        if grep -q 'type="submit"' src/publico/login.html; then
            print_success "Botón tiene type='submit' correcto"
        else
            print_error "Botón no tiene type='submit'"
            return 1
        fi
    else
        print_error "Archivo login.html no encontrado"
        return 1
    fi

    return 0
}

test_javascript_files() {
    print_header "6. Verificando archivos JavaScript"

    local all_ok=0

    # Verificar login-handler.js
    if [ -f "src/publico/dist/js/login-handler.js" ]; then
        print_success "Archivo login-handler.js existe"

        if grep -q 'getElementById("login-form")' src/publico/dist/js/login-handler.js; then
            print_success "login-handler.js busca formulario correcto"
        else
            print_warning "login-handler.js podría no buscar el formulario correcto"
        fi
    else
        print_error "Archivo login-handler.js no encontrado"
        all_ok=1
    fi

    # Verificar jimlg.js
    if [ -f "src/publico/dist/js/jimlg.js" ]; then
        print_success "Archivo jimlg.js existe"
    else
        print_error "Archivo jimlg.js no encontrado"
        all_ok=1
    fi

    # Verificar config.js
    if [ -f "src/publico/config.js" ]; then
        print_success "Archivo config.js existe"
    else
        print_error "Archivo config.js no encontrado"
        all_ok=1
    fi

    return $all_ok
}

test_database_users() {
    print_header "7. Verificando usuarios en base de datos"

    # Verificar si podemos conectar al contenedor de base de datos
    if docker ps | grep -q "sisthabpro_dbsh\|dbsh"; then
        print_success "Contenedor de base de datos está corriendo"

        # Intentar contar usuarios
        USER_COUNT=$(docker exec sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro -sN -e "SELECT COUNT(*) FROM usuarios WHERE activo = 1;" 2>/dev/null)

        if [ $? -eq 0 ]; then
            if [ "$USER_COUNT" -gt 0 ]; then
                print_success "Base de datos tiene $USER_COUNT usuario(s) activo(s)"

                # Verificar que existe el usuario admin
                ADMIN_EXISTS=$(docker exec sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro -sN -e "SELECT COUNT(*) FROM usuarios WHERE username = 'admin' AND activo = 1;" 2>/dev/null)

                if [ "$ADMIN_EXISTS" -eq 1 ]; then
                    print_success "Usuario admin existe y está activo"
                else
                    print_warning "Usuario admin no encontrado"
                    print_info "Ejecuta: docker exec -it sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro < db/usuarios.sql"
                fi
            else
                print_warning "No hay usuarios activos en la base de datos"
                print_info "Ejecuta: docker exec -it sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro < db/usuarios.sql"
            fi
        else
            print_warning "No se pudo consultar la tabla de usuarios"
        fi
    else
        print_warning "Contenedor de base de datos no está corriendo"
        print_info "Ejecuta: docker-compose up -d"
    fi

    return 0
}

###############################################################################
# Función principal
###############################################################################

main() {
    clear
    print_header "VERIFICACIÓN DEL SISTEMA DE AUTENTICACIÓN"
    echo "Sistema Habilitador - Post Corrección"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "API URL: $API_URL"
    echo ""

    # Ejecutar tests
    test_server_running
    test_health_check
    test_html_files
    test_javascript_files
    test_database_users
    test_login_endpoint
    test_token_verification

    # Resumen
    print_header "RESUMEN"
    echo ""
    echo -e "Tests exitosos: ${GREEN}${TESTS_PASSED}${NC}"
    echo -e "Tests fallidos:  ${RED}${TESTS_FAILED}${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ TODAS LAS VERIFICACIONES PASARON${NC}"
        echo ""
        echo "El sistema de autenticación está funcionando correctamente."
        echo ""
        echo "Puedes acceder al sistema en:"
        echo "  ${API_URL}/login.html"
        echo ""
        echo "Credenciales por defecto:"
        echo "  Usuario: admin"
        echo "  Contraseña: Admin2024!"
        echo ""
        echo "================================================================================"
        return 0
    else
        echo -e "${RED}✗ ALGUNAS VERIFICACIONES FALLARON${NC}"
        echo ""
        echo "Por favor revisa los errores arriba y:"
        echo "  1. Verifica que el servidor esté corriendo: docker-compose ps"
        echo "  2. Verifica los logs: docker-compose logs -f hack_tool"
        echo "  3. Inicializa la base de datos si es necesario:"
        echo "     docker exec -it sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro < db/usuarios.sql"
        echo ""
        echo "Para más información consulta: CORRECCION_AUTENTICACION.md"
        echo "================================================================================"
        return 1
    fi
}

# Ejecutar
main
exit $?
