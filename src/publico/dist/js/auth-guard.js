/**
 * Auth Guard para Sistema Habilitador
 * Verifica autenticación en páginas protegidas
 * Incluir este script en TODAS las páginas que requieren autenticación
 */

(function() {
    'use strict';

    // Configuración
    const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_HOST : '';
    const LOGIN_URL = '/login.html';
    const PUBLIC_PAGES = ['/login.html', '/404.html'];

    /**
     * Verificar si la página actual es pública
     */
    function isPublicPage() {
        const currentPath = window.location.pathname;
        return PUBLIC_PAGES.some(page => currentPath.endsWith(page));
    }

    /**
     * Verificar autenticación
     */
    async function checkAuth() {
        // Si es una página pública, no verificar
        if (isPublicPage()) {
            console.log('📖 Página pública, no se requiere autenticación');
            return;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            console.log('🔒 No se encontró token, redirigiendo a login...');
            redirectToLogin('No hay sesión activa');
            return;
        }

        try {
            // Verificar token con el servidor
            const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.log('🔒 Token inválido o expirado');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                redirectToLogin('Sesión expirada');
                return;
            }

            const data = await response.json();

            if (!data.success) {
                console.log('🔒 Verificación de token fallida');
                redirectToLogin('Sesión inválida');
                return;
            }

            console.log('✓ Autenticación verificada');

            // Actualizar información del usuario si cambió
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Mostrar información del usuario en la página
            displayUserInfo();

        } catch (error) {
            console.error('Error verificando autenticación:', error);
            // No redirigir en caso de error de red, permitir trabajo offline
            console.log('⚠ Error de red, permitiendo acceso offline');
        }
    }

    /**
     * Redirigir a login
     */
    function redirectToLogin(reason = '') {
        const currentPath = window.location.pathname;
        let redirectUrl = LOGIN_URL;

        if (reason === 'Sesión expirada') {
            redirectUrl += '?error=session_expired';
        } else if (reason === 'Sesión inválida') {
            redirectUrl += '?error=unauthorized';
        }

        // Guardar URL actual para redirigir después del login (opcional)
        if (currentPath !== LOGIN_URL) {
            sessionStorage.setItem('redirect_after_login', currentPath);
        }

        window.location.href = redirectUrl;
    }

    /**
     * Mostrar información del usuario en la interfaz
     */
    function displayUserInfo() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        try {
            const user = JSON.parse(userStr);

            // Actualizar elementos con clase 'user-name'
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = user.username || user.email || 'Usuario';
            });

            // Actualizar elementos con clase 'user-email'
            document.querySelectorAll('.user-email').forEach(el => {
                el.textContent = user.email || '';
            });

            // Actualizar elementos con clase 'user-role'
            document.querySelectorAll('.user-role').forEach(el => {
                const roleNames = {
                    'admin': 'Administrador',
                    'analista': 'Analista',
                    'user': 'Usuario',
                    'viewer': 'Visualizador'
                };
                el.textContent = roleNames[user.role] || user.role || 'Usuario';
            });

            // Mostrar/ocultar elementos según rol
            const userRole = user.role || 'user';

            // Ocultar elementos admin-only si no es admin
            if (userRole !== 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'none';
                });
            }

            // Ocultar elementos analista-only si no es admin ni analista
            if (userRole !== 'admin' && userRole !== 'analista') {
                document.querySelectorAll('.analista-only').forEach(el => {
                    el.style.display = 'none';
                });
            }

        } catch (error) {
            console.error('Error procesando información del usuario:', error);
        }
    }

    /**
     * Configurar botón de logout
     */
    function setupLogoutButtons() {
        document.querySelectorAll('.logout-btn, [data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        });
    }

    /**
     * Realizar logout
     */
    function logout() {
        const token = localStorage.getItem('token');

        // Notificar al servidor
        if (token) {
            fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(err => console.error('Error en logout:', err));
        }

        // Limpiar datos locales
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        // Redirigir a login
        window.location.href = LOGIN_URL;
    }

    /**
     * Obtener usuario actual
     */
    function getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Verificar si el usuario tiene un rol específico
     */
    function hasRole(role) {
        const user = getCurrentUser();
        if (!user || !user.role) return false;

        // Admin tiene acceso a todo
        if (user.role === 'admin') return true;

        // Verificar rol específico
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        return user.role === role;
    }

    /**
     * Interceptor para peticiones fetch
     */
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, config = {}] = args;

        // No modificar peticiones a endpoints de autenticación
        if (typeof url === 'string' &&
            (url.includes('/api/auth/login') ||
             url.includes('/api/auth/register') ||
             url.includes('/api/auth/captcha'))) {
            return originalFetch.apply(this, args);
        }

        // Agregar token a las peticiones API
        const token = localStorage.getItem('token');
        if (token && typeof url === 'string' && url.includes('/api/')) {
            config.headers = config.headers || {};
            if (!config.headers['Authorization']) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Realizar petición
        return originalFetch.apply(this, [url, config])
            .then(response => {
                // Verificar si la respuesta es 401 (no autorizado)
                if (response.status === 401 || response.status === 403) {
                    console.log('🔒 Respuesta no autorizada, limpiando sesión...');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    // No redirigir si ya estamos en login
                    if (!isPublicPage()) {
                        redirectToLogin('Sesión expirada');
                    }
                }
                return response;
            });
    };

    /**
     * Interceptor para peticiones jQuery AJAX
     */
    if (typeof $ !== 'undefined' && $.ajaxSetup) {
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                // No agregar token a peticiones de autenticación
                if (settings.url.includes('/api/auth/login') ||
                    settings.url.includes('/api/auth/register') ||
                    settings.url.includes('/api/auth/captcha')) {
                    return;
                }

                // Agregar token a peticiones API
                const token = localStorage.getItem('token');
                if (token && settings.url.includes('/api/')) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            },
            error: function(xhr, status, error) {
                if (xhr.status === 401 || xhr.status === 403) {
                    console.log('🔒 Respuesta AJAX no autorizada');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    if (!isPublicPage()) {
                        redirectToLogin('Sesión expirada');
                    }
                }
            }
        });
    }

    /**
     * Renovar token periódicamente (opcional)
     */
    function setupTokenRefresh() {
        // Renovar token cada 30 minutos
        setInterval(() => {
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${API_BASE_URL}/api/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        console.log('🔒 Token expirado durante renovación');
                        redirectToLogin('Sesión expirada');
                    }
                })
                .catch(error => {
                    console.error('Error renovando token:', error);
                });
            }
        }, 30 * 60 * 1000); // 30 minutos
    }

    /**
     * Inicializar Auth Guard
     */
    function init() {
        console.log('🛡️ Auth Guard inicializando...');

        // Verificar autenticación inmediatamente
        checkAuth();

        // Configurar botones de logout
        setupLogoutButtons();

        // Configurar renovación de token
        setupTokenRefresh();

        console.log('✓ Auth Guard activo');
    }

    // Exportar funciones útiles al objeto global
    window.AuthGuard = {
        checkAuth: checkAuth,
        logout: logout,
        getCurrentUser: getCurrentUser,
        hasRole: hasRole,
        isPublicPage: isPublicPage
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🛡️ Auth Guard cargado');

})();
