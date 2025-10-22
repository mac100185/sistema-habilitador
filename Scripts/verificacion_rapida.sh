#!/bin/bash

# ============================================================================
# Script de Verificación Rápida - Sistema Habilitador
# Verificación post-instalación en menos de 1 minuto
# ============================================================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    local color=$1
    local symbol=$2
    local message=$3
    echo -e "${color}${symbol} ${message}${NC}"
}

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}            VERIFICACIÓN RÁPIDA - SISTEMA HABILITADOR                      ${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Contador de errores
ERRORS=0
WARNINGS=0

# 1. Verificar Docker
echo -e "${BLUE}[1/10] Verificando Docker...${NC}"
if docker info &> /dev/null; then
    print_message "${GREEN}" "✓" "Docker daemon corriendo"
else
    print_message "${RED}" "✗" "Docker daemon NO está corriendo"
    ((ERRORS++))
fi

# 2. Verificar imágenes
echo -e "${BLUE}[2/10] Verificando imágenes...${NC}"
if docker images sistema-habilitador-prod:latest -q 2>/dev/null | grep -q .; then
    SIZE=$(docker images sistema-habilitador-prod:latest --format "{{.Size}}")
    print_message "${GREEN}" "✓" "Imagen sistema-habilitador-prod existe (${SIZE})"
else
    print_message "${RED}" "✗" "Imagen sistema-habilitador-prod NO existe"
    ((ERRORS++))
fi

# 3. Verificar contenedores
echo -e "${BLUE}[3/10] Verificando contenedores...${NC}"

CONTAINERS=("sist-hab-prod" "sist-hab-db-prod" "sist-hab-phpmyadmin-prod" "sist-hab-drawio-prod")
for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        UPTIME=$(docker ps --filter "name=${container}" --format "{{.Status}}" | grep -o "Up.*")
        print_message "${GREEN}" "✓" "${container} corriendo (${UPTIME})"
    elif docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker ps -a --filter "name=${container}" --format "{{.Status}}")
        print_message "${YELLOW}" "⚠" "${container} existe pero no está corriendo (${STATUS})"
        ((WARNINGS++))
    else
        print_message "${RED}" "✗" "${container} NO existe"
        ((ERRORS++))
    fi
done

# 4. Verificar puertos
echo -e "${BLUE}[4/10] Verificando puertos...${NC}"
PORTS=("7777:Aplicación" "3306:MySQL" "82:phpMyAdmin" "83:Draw.io")
for port_info in "${PORTS[@]}"; do
    PORT=$(echo $port_info | cut -d: -f1)
    NAME=$(echo $port_info | cut -d: -f2)
    if netstat -tuln 2>/dev/null | grep -q ":${PORT} " || ss -tuln 2>/dev/null | grep -q ":${PORT} "; then
        print_message "${GREEN}" "✓" "Puerto ${PORT} (${NAME}) escuchando"
    else
        print_message "${YELLOW}" "⚠" "Puerto ${PORT} (${NAME}) NO escuchando"
        ((WARNINGS++))
    fi
done

# 5. Verificar MySQL
echo -e "${BLUE}[5/10] Verificando MySQL...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^sist-hab-db-prod$"; then
    if docker exec sist-hab-db-prod mysqladmin ping -h localhost -u root -pquanium &> /dev/null; then
        print_message "${GREEN}" "✓" "MySQL respondiendo correctamente"
    else
        print_message "${YELLOW}" "⚠" "MySQL NO responde (puede estar iniciando)"
        ((WARNINGS++))
    fi
else
    print_message "${RED}" "✗" "Contenedor MySQL no está corriendo"
    ((ERRORS++))
fi

# 6. Verificar base de datos
echo -e "${BLUE}[6/10] Verificando base de datos...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^sist-hab-db-prod$"; then
    if docker exec sist-hab-db-prod mysql -u root -pquanium -e "USE sisthabpro; SELECT 1;" &> /dev/null; then
        print_message "${GREEN}" "✓" "Base de datos 'sisthabpro' existe"
        USER_COUNT=$(docker exec sist-hab-db-prod mysql -u root -pquanium -se "SELECT COUNT(*) FROM sisthabpro.usuarios;" 2>/dev/null || echo "0")
        print_message "${GREEN}" "✓" "Tabla usuarios con ${USER_COUNT} registros"
    else
        print_message "${YELLOW}" "⚠" "Base de datos no accesible"
        ((WARNINGS++))
    fi
fi

# 7. Verificar conectividad interna
echo -e "${BLUE}[7/10] Verificando conectividad interna...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
    if docker exec sist-hab-prod ping -c 2 dbsh &> /dev/null; then
        print_message "${GREEN}" "✓" "Conectividad app -> base de datos OK"
    else
        print_message "${YELLOW}" "⚠" "Sin conectividad entre contenedores"
        ((WARNINGS++))
    fi
fi

# 8. Verificar aplicación
echo -e "${BLUE}[8/10] Verificando aplicación...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
    if docker exec sist-hab-prod test -d node_modules; then
        print_message "${GREEN}" "✓" "Dependencias Node instaladas"
    else
        print_message "${RED}" "✗" "node_modules NO existe"
        ((ERRORS++))
    fi

    if docker exec sist-hab-prod node --version &> /dev/null; then
        NODE_VER=$(docker exec sist-hab-prod node --version 2>/dev/null)
        print_message "${GREEN}" "✓" "Node ${NODE_VER} disponible"
    else
        print_message "${RED}" "✗" "Node NO disponible"
        ((ERRORS++))
    fi
fi

# 9. Verificar API health
echo -e "${BLUE}[9/10] Verificando API...${NC}"
if curl -s http://localhost:7777/api/health &> /dev/null; then
    RESPONSE=$(curl -s http://localhost:7777/api/health | grep -o '"status":"ok"' || echo "")
    if [ -n "$RESPONSE" ]; then
        print_message "${GREEN}" "✓" "API health endpoint respondiendo"
    else
        print_message "${YELLOW}" "⚠" "API responde pero health check falló"
        ((WARNINGS++))
    fi
elif docker ps --format '{{.Names}}' | grep -q "^sist-hab-prod$"; then
    if docker exec sist-hab-prod wget --spider -q http://localhost:7777/api/health 2>/dev/null; then
        print_message "${GREEN}" "✓" "API respondiendo (verificado internamente)"
    else
        print_message "${YELLOW}" "⚠" "API no responde aún (puede estar iniciando)"
        ((WARNINGS++))
    fi
else
    print_message "${RED}" "✗" "Contenedor de aplicación no corriendo"
    ((ERRORS++))
fi

# 10. Verificar volúmenes
echo -e "${BLUE}[10/10] Verificando volúmenes...${NC}"
VOLUMES=$(docker volume ls --format '{{.Name}}' | grep sistema-habilitador | wc -l)
if [ "$VOLUMES" -gt 0 ]; then
    print_message "${GREEN}" "✓" "${VOLUMES} volúmenes de datos creados"
else
    print_message "${YELLOW}" "⚠" "No se encontraron volúmenes"
    ((WARNINGS++))
fi

# Resumen
echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}                            RESUMEN                                        ${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_message "${GREEN}" "✓" "SISTEMA COMPLETAMENTE FUNCIONAL"
    echo ""
    echo -e "${GREEN}Accesos:${NC}"
    echo "  • Aplicación:  http://localhost:7777"
    echo "  • phpMyAdmin:  http://localhost:82"
    echo "  • Draw.io:     http://localhost:83"
    echo ""
    echo -e "${GREEN}Credenciales:${NC}"
    echo "  • Admin:    admin / Admin2024!"
    echo "  • Analista: analista / Analista2024!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    print_message "${YELLOW}" "⚠" "SISTEMA FUNCIONAL CON ${WARNINGS} ADVERTENCIAS"
    echo ""
    echo "El sistema está corriendo pero algunas verificaciones fallaron."
    echo "Esto puede ser normal si los servicios están iniciando."
    echo ""
    echo "Espere 1-2 minutos y ejecute de nuevo:"
    echo "  ./verificacion_rapida.sh"
    echo ""
    echo "O verifique logs:"
    echo "  docker logs sist-hab-prod"
    echo "  docker logs sist-hab-db-prod"
    exit 0
else
    print_message "${RED}" "✗" "ERRORES DETECTADOS: ${ERRORS} | Advertencias: ${WARNINGS}"
    echo ""
    echo -e "${YELLOW}Acciones recomendadas:${NC}"
    echo ""
    echo "1. Ver logs de contenedores:"
    echo "   docker logs sist-hab-prod"
    echo "   docker logs sist-hab-db-prod"
    echo ""
    echo "2. Verificar estado de contenedores:"
    echo "   docker compose ps"
    echo ""
    echo "3. Extraer logs completos para análisis:"
    echo "   cd Scripts"
    echo "   ./extraer_logs.sh"
    echo "   # Seleccionar opción 9 (Reporte completo)"
    echo ""
    echo "4. Si los problemas persisten, reintentar build:"
    echo "   ./build_seguro.sh"
    echo ""
    exit 1
fi
