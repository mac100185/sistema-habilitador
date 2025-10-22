#!/bin/bash

# ============================================================================
# Script de Verificación Post-Instalación
# Sistema Habilitador - Gestión de Seguridad y Controles
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Función para imprimir encabezado
print_header() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

# Función para imprimir test
print_test() {
    echo -e "${CYAN}[TEST] $1${NC}"
}

# Función para resultado exitoso
print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

# Función para resultado fallido
print_failure() {
    echo -e "${RED}  ✗ $1${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

# Función para advertencia
print_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

# Función para información
print_info() {
    echo -e "  ℹ $1"
}

echo ""
print_header "VERIFICACIÓN DE INSTALACIÓN - SISTEMA HABILITADOR"
echo ""

# ============================================================================
# 1. VERIFICAR DOCKER
# ============================================================================
print_header "1. VERIFICANDO DOCKER"
echo ""

print_test "Docker instalado"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker instalado: $DOCKER_VERSION"
else
    print_failure "Docker no está instalado"
fi

print_test "Docker corriendo"
if docker info &> /dev/null; then
    print_success "Docker daemon está corriendo"
else
    print_failure "Docker daemon no está corriendo"
fi

print_test "Docker Compose instalado"
if docker-compose --version &> /dev/null 2>&1 || docker compose version &> /dev/null 2>&1; then
    COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || docker compose version 2>/dev/null)
    print_success "Docker Compose instalado: $COMPOSE_VERSION"
else
    print_failure "Docker Compose no está instalado"
fi

echo ""

# ============================================================================
# 2. VERIFICAR CONTENEDORES
# ============================================================================
print_header "2. VERIFICANDO CONTENEDORES"
echo ""

CONTAINERS=("sist-hab-prod" "sist-hab-db-prod" "sist-hab-phpmyadmin-prod" "sist-hab-drawio-prod")

for container in "${CONTAINERS[@]}"; do
    print_test "Contenedor: $container"

    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker ps --filter "name=${container}" --format "{{.Status}}")
        print_success "RUNNING - $STATUS"
    elif docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker ps -a --filter "name=${container}" --format "{{.Status}}")
        print_failure "STOPPED - $STATUS"
        print_info "Intente: docker start ${container}"
    else
        print_failure "NO EXISTE"
        print_info "El contenedor no fue creado"
    fi
done

echo ""

# ============================================================================
# 3. VERIFICAR IMÁGENES
# ============================================================================
print_header "3. VERIFICANDO IMÁGENES DOCKER"
echo ""

IMAGES=("sistema-habilitador-prod:latest" "mysql:8.1.0" "phpmyadmin/phpmyadmin" "jgraph/drawio")

for image in "${IMAGES[@]}"; do
    print_test "Imagen: $image"

    if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${image}$"; then
        SIZE=$(docker images --format "{{.Size}}" "${image}")
        print_success "Descargada - Tamaño: $SIZE"
    else
        print_failure "No encontrada"
    fi
done

echo ""

# ============================================================================
# 4. VERIFICAR RED
# ============================================================================
print_header "4. VERIFICANDO REDES DOCKER"
echo ""

print_test "Red sistema-habilitador"
if docker network ls | grep -q "sistema-habilitador"; then
    print_success "Red creada"
    NETWORK_NAME=$(docker network ls | grep sistema-habilitador | awk '{print $2}')
    print_info "Nombre de red: $NETWORK_NAME"
else
    print_warning "Red no encontrada (se usará red por defecto)"
fi

echo ""

# ============================================================================
# 5. VERIFICAR VOLÚMENES
# ============================================================================
print_header "5. VERIFICANDO VOLÚMENES"
echo ""

VOLUMES=("mysql_data" "imagen_data")

for volume in "${VOLUMES[@]}"; do
    print_test "Volumen: $volume"

    if docker volume ls | grep -q "${volume}"; then
        VOLUME_SIZE=$(docker system df -v | grep "${volume}" | awk '{print $3}' | head -1)
        print_success "Creado - Tamaño: ${VOLUME_SIZE:-N/A}"
    else
        print_failure "No encontrado"
    fi
done

echo ""

# ============================================================================
# 6. VERIFICAR MYSQL
# ============================================================================
print_header "6. VERIFICANDO BASE DE DATOS MYSQL"
echo ""

print_test "MySQL respondiendo"
if docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium &> /dev/null; then
    print_success "MySQL está respondiendo"
else
    print_failure "MySQL no responde"
fi

print_test "Base de datos 'sisthabpro'"
if docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro;" &> /dev/null; then
    print_success "Base de datos 'sisthabpro' existe"

    # Contar tablas
    TABLE_COUNT=$(docker exec sist-hab-db-prod mysql -u root -pquanium -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sisthabpro';" 2>/dev/null)
    print_info "Total de tablas: $TABLE_COUNT"
else
    print_failure "Base de datos 'sisthabpro' no existe"
fi

print_test "Tabla 'usuarios'"
if docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SHOW TABLES LIKE 'usuarios';" 2>/dev/null | grep -q usuarios; then
    print_success "Tabla 'usuarios' existe"

    # Contar usuarios
    USER_COUNT=$(docker exec sist-hab-db-prod mysql -u root -pquanium -se "SELECT COUNT(*) FROM sisthabpro.usuarios;" 2>/dev/null)
    print_info "Total de usuarios: $USER_COUNT"

    # Listar usuarios
    print_info "Usuarios registrados:"
    docker exec sist-hab-db-prod mysql -u root -pquanium -se "SELECT username, email, role, activo FROM sisthabpro.usuarios;" 2>/dev/null | while read line; do
        print_info "  - $line"
    done
else
    print_failure "Tabla 'usuarios' no existe"
    print_warning "Ejecute: docker exec sist-hab-db-prod mysql -u root -pquanium sisthabpro < /docker-entrypoint-initdb.d/02-usuarios.sql"
fi

echo ""

# ============================================================================
# 7. VERIFICAR APLICACIÓN WEB
# ============================================================================
print_header "7. VERIFICANDO APLICACIÓN WEB"
echo ""

print_test "Contenedor de aplicación corriendo"
if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
    print_success "Contenedor corriendo"
else
    print_failure "Contenedor no está corriendo"
fi

print_test "Node.js en el contenedor"
if docker exec sist-hab-prod node --version &> /dev/null; then
    NODE_VERSION=$(docker exec sist-hab-prod node --version 2>/dev/null)
    print_success "Node.js instalado: $NODE_VERSION"
else
    print_failure "Node.js no disponible"
fi

print_test "Dependencias instaladas (node_modules)"
if docker exec sist-hab-prod test -d node_modules &> /dev/null; then
    MODULE_COUNT=$(docker exec sist-hab-prod find node_modules -maxdepth 1 -type d 2>/dev/null | wc -l)
    print_success "node_modules existe con $MODULE_COUNT módulos"
else
    print_failure "node_modules no existe"
    print_warning "Ejecute: docker exec sist-hab-prod npm install"
fi

print_test "Aplicación respondiendo (Health Check)"
HEALTH_CHECK=$(docker exec sist-hab-prod wget -qO- http://localhost:7777/api/health 2>/dev/null)
if [ $? -eq 0 ] && echo "$HEALTH_CHECK" | grep -q "ok"; then
    print_success "Aplicación respondiendo en puerto 7777"
    print_info "Health check: OK"
else
    print_failure "Aplicación no responde en puerto 7777"
fi

print_test "Conectividad con base de datos desde la app"
if docker exec sist-hab-prod ping -c 2 dbsh &> /dev/null; then
    print_success "Conectividad de red con 'dbsh': OK"
else
    print_failure "No hay conectividad con 'dbsh'"
fi

echo ""

# ============================================================================
# 8. VERIFICAR PUERTOS
# ============================================================================
print_header "8. VERIFICANDO PUERTOS EXPUESTOS"
echo ""

PORTS=("7777:Aplicación Web" "3306:MySQL" "82:phpMyAdmin" "83:Draw.io HTTP" "84:Draw.io HTTPS")

for port_info in "${PORTS[@]}"; do
    PORT=$(echo $port_info | cut -d: -f1)
    DESC=$(echo $port_info | cut -d: -f2)

    print_test "Puerto $PORT ($DESC)"

    if netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
        print_success "Puerto $PORT está escuchando"
    else
        print_warning "Puerto $PORT no está escuchando"
    fi
done

echo ""

# ============================================================================
# 9. VERIFICAR ACCESO WEB
# ============================================================================
print_header "9. VERIFICANDO ACCESO WEB"
echo ""

IP_ADDRESS=$(hostname -I | cut -f1 -d' ')

print_test "Acceso a aplicación web"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:7777 2>/dev/null | grep -q "200\|301\|302"; then
    print_success "Aplicación accesible en http://localhost:7777"
    print_info "También en: http://${IP_ADDRESS}:7777"
else
    print_warning "No se pudo verificar acceso (puede ser normal si requiere autenticación)"
fi

print_test "Acceso a Health Check"
if curl -s http://localhost:7777/api/health 2>/dev/null | grep -q "ok"; then
    print_success "Health Check accesible: http://localhost:7777/api/health"
else
    print_failure "Health Check no accesible"
fi

print_test "Acceso a phpMyAdmin"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:82 2>/dev/null | grep -q "200"; then
    print_success "phpMyAdmin accesible en http://localhost:82"
else
    print_warning "phpMyAdmin no accesible en http://localhost:82"
fi

echo ""

# ============================================================================
# 10. VERIFICAR LOGS
# ============================================================================
print_header "10. VERIFICANDO LOGS"
echo ""

print_test "Logs de aplicación"
LOG_LINES=$(docker logs sist-hab-prod 2>&1 | wc -l)
ERROR_COUNT=$(docker logs sist-hab-prod 2>&1 | grep -ic error)
print_info "Líneas de log: $LOG_LINES"
print_info "Errores encontrados: $ERROR_COUNT"

if [ $ERROR_COUNT -gt 10 ]; then
    print_warning "Se encontraron $ERROR_COUNT errores en los logs"
    print_info "Ejecute: docker logs sist-hab-prod | grep -i error"
else
    print_success "Cantidad de errores es aceptable"
fi

echo ""

# ============================================================================
# 11. VERIFICAR ARCHIVOS DE CONFIGURACIÓN
# ============================================================================
print_header "11. VERIFICANDO ARCHIVOS DE CONFIGURACIÓN"
echo ""

CONFIG_FILES=("compose.yaml" "Dockerfile" "package.json" "db/usuarios.sql" "db/sisthabpro.sql")

for file in "${CONFIG_FILES[@]}"; do
    print_test "Archivo: $file"

    if [ -f "$file" ]; then
        FILE_SIZE=$(du -h "$file" | cut -f1)
        print_success "Existe - Tamaño: $FILE_SIZE"
    else
        print_failure "No encontrado"
    fi
done

echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
print_header "RESUMEN DE VERIFICACIÓN"
echo ""

echo -e "${CYAN}Total de pruebas ejecutadas: ${TESTS_TOTAL}${NC}"
echo -e "${GREEN}Pruebas exitosas: ${TESTS_PASSED}${NC}"
echo -e "${RED}Pruebas fallidas: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ INSTALACIÓN COMPLETAMENTE VERIFICADA${NC}"
    echo -e "${GREEN}✓ El sistema está listo para usar${NC}"
    EXIT_CODE=0
elif [ $TESTS_FAILED -lt 5 ]; then
    echo -e "${YELLOW}⚠ INSTALACIÓN PARCIALMENTE VERIFICADA${NC}"
    echo -e "${YELLOW}⚠ Hay algunos problemas menores que deben revisarse${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}✗ INSTALACIÓN CON PROBLEMAS${NC}"
    echo -e "${RED}✗ Se detectaron múltiples problemas que requieren atención${NC}"
    EXIT_CODE=2
fi

echo ""
print_header "INFORMACIÓN DE ACCESO"
echo ""

echo -e "${CYAN}URLs de Acceso:${NC}"
echo "  • Aplicación Web: http://${IP_ADDRESS}:7777/"
echo "  • Health Check: http://${IP_ADDRESS}:7777/api/health"
echo "  • phpMyAdmin: http://${IP_ADDRESS}:82/"
echo "  • Draw.io: http://${IP_ADDRESS}:83/"
echo ""

echo -e "${CYAN}Credenciales por Defecto:${NC}"
echo "  • Usuario Admin:"
echo "    - Username: admin"
echo "    - Password: Admin2024!"
echo "    - Role: admin"
echo ""
echo "  • Usuario Analista:"
echo "    - Username: analista"
echo "    - Password: Analista2024!"
echo "    - Role: analista"
echo ""
echo -e "${YELLOW}⚠ IMPORTANTE: Cambiar estas contraseñas en producción${NC}"
echo ""

echo -e "${CYAN}Comandos Útiles:${NC}"
echo "  • Ver logs: docker logs sist-hab-prod"
echo "  • Reiniciar app: docker restart sist-hab-prod"
echo "  • Extraer logs: ./Scripts/extraer_logs.sh"
echo "  • Estado: docker ps -a"
echo ""

print_header "FIN DE VERIFICACIÓN"
echo ""

exit $EXIT_CODE
