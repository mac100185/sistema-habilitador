// Configuración centralizada de la aplicación
// Este archivo debe ser el primero en cargarse en los HTML

(function(window) {
    'use strict';

    // Configuración del host/API
    const getApiHost = () => {
        // Intentar obtener del meta tag en el HTML
        const metaTag = document.querySelector('meta[name="api-host"]');
        if (metaTag && metaTag.content) {
            return metaTag.content;
        }

        // Detectar automáticamente basado en el hostname actual
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port || '7777';

        // Si estamos en desarrollo local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${port}`;
        }

        // Si estamos en producción, usar el mismo host
        return `${protocol}//${hostname}:${port}`;
    };

    // Configuración global de la aplicación
    window.APP_CONFIG = {
        // URL base del API
        API_HOST: getApiHost(),

        // Endpoints principales
        ENDPOINTS: {
            TOKEN: '/api/token',
            SEGURIDAD_DEF: '/api/seguridad_def',
            IMAGEN: '/seguridad_def/imagen'
        },

        // Configuración de timeouts (en milisegundos)
        TIMEOUTS: {
            REQUEST: 30000,  // 30 segundos
            UPLOAD: 120000   // 2 minutos para uploads
        },

        // Configuración de validación
        VALIDATION: {
            MAX_FILE_SIZE: 10485760, // 10MB en bytes
            ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
            MIN_PASSWORD_LENGTH: 8,
            MAX_TEXT_LENGTH: 5000,
            REQUIRED_FIELDS_MARK: '*'
        },

        // Configuración de mensajes
        MESSAGES: {
            SUCCESS: {
                SAVE: '¡Datos guardados exitosamente!',
                UPDATE: '¡Datos actualizados exitosamente!',
                DELETE: '¡Datos eliminados exitosamente!',
                UPLOAD: '¡Archivo subido exitosamente!'
            },
            ERROR: {
                NETWORK: 'Error de conexión. Por favor, verifica tu conexión a internet.',
                SERVER: 'Error del servidor. Inténtalo más tarde.',
                VALIDATION: 'Por favor, completa todos los campos requeridos.',
                FILE_SIZE: 'El archivo excede el tamaño máximo permitido.',
                FILE_TYPE: 'Tipo de archivo no permitido.',
                TIMEOUT: 'La petición ha excedido el tiempo de espera.',
                GENERIC: 'Ha ocurrido un error inesperado.'
            },
            WARNING: {
                UNSAVED_CHANGES: '¿Estás seguro? Hay cambios sin guardar.',
                DELETE_CONFIRM: '¿Estás seguro de que deseas eliminar este elemento?',
                LEAVE_PAGE: 'Tienes cambios sin guardar. ¿Deseas salir?'
            }
        },

        // Configuración de DataTables
        DATATABLE: {
            LANGUAGE: {
                lengthMenu: "Mostrar _MENU_ registros",
                zeroRecords: "No se encontraron resultados",
                info: "Registros del _START_ al _END_ de un total de _TOTAL_ registros",
                infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
                infoFiltered: "(filtrado de un total de _MAX_ registros)",
                search: "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior"
                },
                processing: "Procesando..."
            },
            PAGE_LENGTH: 25,
            PAGE_LENGTH_MENU: [10, 25, 50, 100]
        },

        // Configuración de Summernote
        SUMMERNOTE: {
            HEIGHT: 625,
            TABSIZE: 2,
            TOOLBAR: [
                ['style', ['style', 'bold', 'italic', 'underline', 'clear']],
                ['font', ['superscript', 'subscript']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ]
        }
    };

    // Variable global para compatibilidad con código existente
    window.host = window.APP_CONFIG.API_HOST;

    // Función auxiliar para construir URLs completas
    window.buildApiUrl = function(endpoint) {
        return window.APP_CONFIG.API_HOST + endpoint;
    };

    // Función para hacer peticiones AJAX con manejo de errores estandarizado
    window.apiRequest = function(options) {
        const defaults = {
            timeout: window.APP_CONFIG.TIMEOUTS.REQUEST,
            dataType: 'json',
            error: function(xhr, status, error) {
                console.error('API Request Error:', {
                    url: options.url,
                    status: status,
                    error: error,
                    response: xhr.responseText
                });

                let errorMessage = window.APP_CONFIG.MESSAGES.ERROR.GENERIC;

                if (status === 'timeout') {
                    errorMessage = window.APP_CONFIG.MESSAGES.ERROR.TIMEOUT;
                } else if (status === 'error') {
                    if (xhr.status === 0) {
                        errorMessage = window.APP_CONFIG.MESSAGES.ERROR.NETWORK;
                    } else if (xhr.status >= 500) {
                        errorMessage = window.APP_CONFIG.MESSAGES.ERROR.SERVER;
                    }
                }

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorMessage
                    });
                } else {
                    alert(errorMessage);
                }

                if (options.onError) {
                    options.onError(xhr, status, error);
                }
            }
        };

        const settings = Object.assign({}, defaults, options);
        return $.ajax(settings);
    };

    // Función de validación genérica
    window.validateForm = function(formId) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error('Form not found:', formId);
            return false;
        }

        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value || field.value.trim() === '') {
                isValid = false;
                field.classList.add('is-invalid');

                // Agregar mensaje de error si no existe
                if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('invalid-feedback')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'invalid-feedback';
                    errorDiv.textContent = 'Este campo es requerido';
                    field.parentNode.insertBefore(errorDiv, field.nextSibling);
                }
            } else {
                field.classList.remove('is-invalid');
                const errorDiv = field.nextElementSibling;
                if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                    errorDiv.remove();
                }
            }

            // Validar según tipo de campo
            if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    isValid = false;
                    field.classList.add('is-invalid');
                }
            }

            if (field.type === 'number' && field.value) {
                if (field.min && parseFloat(field.value) < parseFloat(field.min)) {
                    isValid = false;
                    field.classList.add('is-invalid');
                }
                if (field.max && parseFloat(field.value) > parseFloat(field.max)) {
                    isValid = false;
                    field.classList.add('is-invalid');
                }
            }
        });

        if (!isValid) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validación',
                    text: window.APP_CONFIG.MESSAGES.ERROR.VALIDATION
                });
            }
        }

        return isValid;
    };

    // Función para validar archivos
    window.validateFile = function(file) {
        const config = window.APP_CONFIG.VALIDATION;

        if (file.size > config.MAX_FILE_SIZE) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Archivo muy grande',
                    text: window.APP_CONFIG.MESSAGES.ERROR.FILE_SIZE
                });
            }
            return false;
        }

        if (!config.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Tipo de archivo no permitido',
                    text: window.APP_CONFIG.MESSAGES.ERROR.FILE_TYPE
                });
            }
            return false;
        }

        return true;
    };

    // Función para sanitizar HTML (prevenir XSS)
    window.sanitizeHTML = function(text) {
        const element = document.createElement('div');
        element.textContent = text;
        return element.innerHTML;
    };

    // Detectar cambios no guardados en formularios
    window.trackUnsavedChanges = function(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        let hasChanges = false;

        form.addEventListener('change', function() {
            hasChanges = true;
        });

        form.addEventListener('submit', function() {
            hasChanges = false;
        });

        window.addEventListener('beforeunload', function(e) {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = window.APP_CONFIG.MESSAGES.WARNING.LEAVE_PAGE;
                return e.returnValue;
            }
        });
    };

    // Log de inicialización
    console.log('🚀 Configuración de la aplicación cargada:', {
        API_HOST: window.APP_CONFIG.API_HOST,
        Version: '1.0.0'
    });

})(window);
