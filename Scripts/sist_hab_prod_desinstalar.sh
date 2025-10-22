#!/bin/bash

# ============================================================================
# Script de Desinstalación - Sistema Habilitador
# Versión: 3.0 - Mejorado con opciones de preservación
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

print_header() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
}

# ============================================================================
# VERIFICAR DOCKER
# ============================================================================
verificar_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "${RED}" "✗" "Docker no está instalado"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_message "${RED}" "✗" "Docker daemon no está corriendo"
        exit 1
    fi
}

# ============================================================================
# MENÚ PRINCIPAL
# ============================================================================
mostrar_menu() {
    print_header "DESINSTALACIÓN - SISTEMA HABILITADOR"

    echo "Seleccione el tipo de desinstalación:"
    echo ""
    echo "1) Desinstalación LIMPIA (Recomendado)"
    echo "   - Detiene y elimina contenedores"
    echo "   - Elimina imagen Docker"
    echo "   - Elimina red"
    echo "   - CONSERVA el código fuente"
    echo "   - CONSERVA los volúmenes de datos"
    echo ""
    echo "2) Desinstalación COMPLETA con datos"
    echo "   - Todo lo anterior"
    echo "   - ELIMINA volúmenes de datos (MySQL, imágenes)"
    echo "   - CONSERVA el código fuente"
    echo ""
    echo "3) Desinstalación TOTAL"
    echo "   - Todo lo anterior"
    echo "   - ELIMINA el directorio completo del proyecto"
    echo "   ⚠️  ADVERTENCIA: Se perderá TODO (código + datos)"
    echo ""
    echo "4) Solo detener contenedores (sin eliminar)"
    echo ""
    echo "0) Cancelar"
    echo ""
    echo -n "Opción: "
    read opcion
}

# ============================================================================
# DESINSTALACIÓN LIMPIA
# ============================================================================
desinstalacion_limpia() {
    print_header "DESINSTALACIÓN LIMPIA"

    echo "Se detendrán y eliminarán:"
    echo "  - Contenedores del sistema"
    echo "  - Imagen Docker"
    echo "  - Red Docker"
    echo ""
    echo "Se CONSERVARÁN:"
    echo "  - Código fuente del proyecto"
    echo "  - Volúmenes de datos (MySQL, imágenes)"
    echo ""
    echo -n "¿Desea continuar? (s/N): "
    read confirmar

    if [[ ! "$confirmar" =~ ^[Ss]$ ]]; then
        print_message "${YELLOW}" "ℹ" "Operación cancelada"
        exit 0
    fi

    # Detener contenedores
    print_message "${BLUE}" "→" "Deteniendo contenedores..."
    docker stop sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true
    print_message "${GREEN}" "✓" "Contenedores detenidos"

    # Eliminar contenedores
    print_message "${BLUE}" "→" "Eliminando contenedores..."
    docker rm sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true
    print_message "${GREEN}" "✓" "Contenedores eliminados"

    # Eliminar imagen
    print_message "${BLUE}" "→" "Eliminando imagen Docker..."
    docker rmi sistema-habilitador-prod 2>/dev/null || true
    print_message "${GREEN}" "✓" "Imagen eliminada"

    # Eliminar red
    print_message "${BLUE}" "→" "Eliminando red Docker..."
    docker network rm sist-hab-network 2>/dev/null || true
    print_message "${GREEN}" "✓" "Red eliminada"

    print_header "DESINSTALACIÓN LIMPIA COMPLETADA"
    print_message "${GREEN}" "✓" "Sistema desinstalado correctamente"
    print_message "${GREEN}" "ℹ" "Código fuente conservado en: $(pwd)"
    print_message "${GREEN}" "ℹ" "Volúmenes de datos conservados"
    echo ""
    echo "Para reinstalar, ejecute: ./build_seguro.sh"
}

# ============================================================================
# DESINSTALACIÓN COMPLETA CON DATOS
# ============================================================================
desinstalacion_completa_con_datos() {
    print_header "DESINSTALACIÓN COMPLETA CON DATOS"

    echo "Se eliminarán:"
    echo "  - Contenedores del sistema"
    echo "  - Imagen Docker"
    echo "  - Red Docker"
    echo "  - Volúmenes de datos (MySQL, imágenes)"
    echo ""
    echo "Se CONSERVARÁ:"
    echo "  - Código fuente del proyecto"
    echo ""
    echo -e "${RED}⚠️  ADVERTENCIA: Se perderán TODOS los datos de la base de datos${NC}"
    echo ""
    echo -n "¿Desea continuar? (s/N): "
    read confirmar

    if [[ ! "$confirmar" =~ ^[Ss]$ ]]; then
        print_message "${YELLOW}" "ℹ" "Operación cancelada"
        exit 0
    fi

    # Ejecutar desinstalación limpia primero
    print_message "${BLUE}" "→" "Ejecutando desinstalación limpia..."

    docker stop sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true
    docker rm sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true
    docker rmi sistema-habilitador-prod 2>/dev/null || true
    docker network rm sist-hab-network 2>/dev/null || true

    # Eliminar volúmenes
    print_message "${BLUE}" "→" "Eliminando volúmenes de datos..."
    docker volume rm sist-hab_mysql_data 2>/dev/null || true
    docker volume rm sist-hab_imagen_data 2>/dev/null || true
    print_message "${GREEN}" "✓" "Volúmenes eliminados"

    print_header "DESINSTALACIÓN COMPLETA FINALIZADA"
    print_message "${GREEN}" "✓" "Sistema y datos eliminados correctamente"
    print_message "${GREEN}" "ℹ" "Código fuente conservado en: $(pwd)"
    echo ""
    echo "Para reinstalar, ejecute: ./build_seguro.sh"
    echo "Nota: Se creará una base de datos nueva"
}

# ============================================================================
# DESINSTALACIÓN TOTAL
# ============================================================================
desinstalacion_total() {
    print_header "DESINSTALACIÓN TOTAL"

    echo -e "${RED}⚠️  ADVERTENCIA CRÍTICA ⚠️${NC}"
    echo ""
    echo "Se eliminará COMPLETAMENTE:"
    echo "  - Contenedores del sistema"
    echo "  - Imagen Docker"
    echo "  - Red Docker"
    echo "  - Volúmenes de datos"
    echo "  - TODO el código fuente del proyecto"
    echo ""
    echo -e "${RED}Esta acción es IRREVERSIBLE${NC}"
    echo ""
    echo -n "¿Está COMPLETAMENTE seguro? (escriba 'ELIMINAR TODO'): "
    read confirmar

    if [[ "$confirmar" != "ELIMINAR TODO" ]]; then
        print_message "${YELLOW}" "ℹ" "Operación cancelada por seguridad"
        exit 0
    fi

    echo ""
    echo -n "Confirmación final. ¿Proceder? (s/N): "
    read confirmar_final

    if [[ ! "$confirmar_final" =~ ^[Ss]$ ]]; then
        print_message "${YELLOW}" "ℹ" "Operación cancelada"
        exit 0
    fi

    # Ejecutar desinstalación completa
    print_message "${BLUE}" "→" "Eliminando contenedores y recursos..."

    docker stop sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true
    docker rm sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true
    docker rmi sistema-habilitador-prod 2>/dev/null || true
    docker network rm sist-hab-network 2>/dev/null || true
    docker volume rm sist-hab_mysql_data sist-hab_imagen_data 2>/dev/null || true

    # Eliminar directorio del proyecto
    print_message "${BLUE}" "→" "Eliminando directorio del proyecto..."
    cd ../..
    rm -rf sistema-habilitador
    print_message "${GREEN}" "✓" "Directorio eliminado"

    print_header "DESINSTALACIÓN TOTAL COMPLETADA"
    print_message "${GREEN}" "✓" "Sistema completamente eliminado"
    echo ""
    echo "Estado actual del sistema:"
    echo ""
    docker ps -a | grep -E "(sist-hab|sistema-habilitador)" || echo "  ✓ No hay contenedores del sistema"
    echo ""
    docker images | grep sistema-habilitador || echo "  ✓ No hay imágenes del sistema"
    echo ""
    docker network ls | grep sist-hab || echo "  ✓ No hay redes del sistema"
}

# ============================================================================
# SOLO DETENER
# ============================================================================
solo_detener() {
    print_header "DETENER CONTENEDORES"

    print_message "${BLUE}" "→" "Deteniendo contenedores..."
    docker stop sist-hab-prod sist-hab-db-prod sist-hab-phpmyadmin-prod sist-hab-drawio-prod 2>/dev/null || true

    print_message "${GREEN}" "✓" "Contenedores detenidos"
    echo ""
    echo "Los contenedores están detenidos pero no eliminados."
    echo "Para reiniciar: docker compose up -d"
    echo "Para eliminar: ejecute este script nuevamente"
}

# ============================================================================
# MOSTRAR ESTADO ACTUAL
# ============================================================================
mostrar_estado() {
    print_header "ESTADO ACTUAL DEL SISTEMA"

    echo "Contenedores:"
    docker ps -a | grep -E "(CONTAINER|sist-hab)" || echo "  - No hay contenedores del sistema"
    echo ""

    echo "Imágenes:"
    docker images | grep -E "(REPOSITORY|sistema-habilitador)" || echo "  - No hay imágenes del sistema"
    echo ""

    echo "Redes:"
    docker network ls | grep -E "(NETWORK|sist-hab)" || echo "  - No hay redes del sistema"
    echo ""

    echo "Volúmenes:"
    docker volume ls | grep -E "(DRIVER|sist-hab)" || echo "  - No hay volúmenes del sistema"
    echo ""
}

# ============================================================================
# MAIN
# ============================================================================
main() {
    # Verificar Docker
    verificar_docker

    # Mostrar estado actual
    mostrar_estado

    # Mostrar menú
    mostrar_menu

    # Ejecutar opción
    case $opcion in
        1)
            desinstalacion_limpia
            ;;
        2)
            desinstalacion_completa_con_datos
            ;;
        3)
            desinstalacion_total
            ;;
        4)
            solo_detener
            ;;
        0)
            print_message "${YELLOW}" "ℹ" "Operación cancelada"
            exit 0
            ;;
        *)
            print_message "${RED}" "✗" "Opción inválida"
            exit 1
            ;;
    esac

    # Limpiar sistema Docker (opcional)
    echo ""
    echo -n "¿Desea limpiar recursos Docker no utilizados? (s/N): "
    read limpiar

    if [[ "$limpiar" =~ ^[Ss]$ ]]; then
        print_message "${BLUE}" "→" "Limpiando sistema Docker..."
        docker system prune -f
        print_message "${GREEN}" "✓" "Sistema Docker limpiado"
    fi

    echo ""
    print_message "${GREEN}" "✓" "Proceso completado"
    echo ""
}

# Ejecutar
main
