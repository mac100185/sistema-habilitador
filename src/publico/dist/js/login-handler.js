/**
 * Login Handler para Sistema Habilitador
 * Maneja autenticación, captcha y redirección
 */

(function () {
  "use strict";

  // Configuración
  const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_HOST : "";
  let captchaData = null;

  // Elementos del DOM (se obtienen en init cuando el DOM está listo)
  let loginForm = null;
  let usernameInput = null;
  let passwordInput = null;
  let loginButton = null;

  /**
   * Inicializar el manejador de login
   */
  function init() {
    console.log("🔐 Inicializando sistema de login (login-handler)...");

    // Obtener elementos del DOM ahora que está cargado
    loginForm = document.getElementById("login-form");
    if (!loginForm) {
      loginForm = document.getElementById("ko895"); // Fallback al ID antiguo
    }
    usernameInput = document.getElementById("Usuario");
    passwordInput = document.getElementById("dfs654");
    loginButton = document.getElementById("erbo696");

    // Verificar si ya hay sesión activa
    checkExistingSession();

    // Configurar evento de submit del formulario
    if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
      console.log("✓ Formulario de login encontrado y eventos configurados");

      // Marcar que login-handler está manejando el login activamente
      window.loginHandlerActive = true;
    } else {
      console.log("ℹ️ Formulario no encontrado, jimlg.js manejará el login");
      window.loginHandlerActive = false;
      return; // Salir de init si no hay formulario
    }

    // También configurar evento click del botón como backup
    if (loginButton) {
      loginButton.addEventListener("click", function (e) {
        e.preventDefault();
        handleLogin(e);
      });
    }

    // Cargar captcha si está disponible
    loadCaptcha();

    // Mostrar mensaje de error si viene en la URL
    showUrlError();

    console.log("✓ Sistema de login inicializado (login-handler)");
  }

  /**
   * Verificar si existe una sesión activa
   */
  function checkExistingSession() {
    const token = localStorage.getItem("token");

    if (token) {
      // Verificar si el token es válido
      fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            // Token válido, redirigir a index
            console.log("✓ Sesión válida encontrada, redirigiendo...");
            window.location.href = "/index.html";
          } else {
            // Token inválido, limpiar
            console.log("✗ Token inválido, limpiando sesión");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        })
        .catch((error) => {
          console.error("Error verificando sesión:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }

  /**
   * Cargar captcha desde el servidor
   */
  function loadCaptcha() {
    // Por ahora, el captcha es opcional
    console.log("ℹ Captcha opcional en esta versión");
  }

  /**
   * Mostrar error de la URL
   */
  function showUrlError() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error === "session_expired") {
      showMessage(
        "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
        "warning",
      );
    } else if (error === "unauthorized") {
      showMessage("Acceso no autorizado. Por favor, inicie sesión.", "warning");
    }
  }

  /**
   * Manejar el evento de login
   */
  async function handleLogin(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    console.log("🔐 login-handler: Procesando login para usuario:", username);

    // Validar campos
    if (!username || !password) {
      showMessage("Por favor, ingrese usuario y contraseña", "error");
      return;
    }

    // Deshabilitar botón mientras se procesa
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = "Ingresando...";
    }

    try {
      console.log("🔐 login-handler: Intentando autenticación...");

      // Realizar login
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login exitoso
        console.log("✓ login-handler: Login exitoso");

        // Guardar token y datos del usuario
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Mostrar mensaje de éxito
        showMessage("¡Bienvenido! Redirigiendo...", "success");

        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 1000);
      } else {
        // Login fallido
        console.error("✗ login-handler: Login fallido:", data.message);
        showMessage(
          data.message || "Usuario o contraseña incorrectos",
          "error",
        );

        // Limpiar contraseña
        if (passwordInput) {
          passwordInput.value = "";
          passwordInput.focus();
        }
      }
    } catch (error) {
      console.error("✗ login-handler: Error en login:", error);
      showMessage("Error de conexión. Por favor, intente nuevamente.", "error");
    } finally {
      // Rehabilitar botón
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = "Ingresar";
      }
    }
  }

  /**
   * Mostrar mensaje al usuario
   */
  function showMessage(message, type = "info") {
    // Intentar usar SweetAlert2 si está disponible
    if (typeof Swal !== "undefined") {
      const icon =
        type === "error"
          ? "error"
          : type === "warning"
            ? "warning"
            : type === "success"
              ? "success"
              : "info";

      Swal.fire({
        icon: icon,
        title:
          type === "error"
            ? "Error"
            : type === "warning"
              ? "Atención"
              : type === "success"
                ? "Éxito"
                : "Información",
        text: message,
        confirmButtonText: "Aceptar",
        timer: type === "success" ? 2000 : undefined,
        timerProgressBar: type === "success",
      });
    } else {
      // Fallback a alert nativo
      alert(message);
    }

    // También mostrar en consola
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Utilidad para hacer logout
   */
  window.logout = function () {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Opcional: notificar al servidor
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch((err) => console.error("Error en logout:", err));
    }

    window.location.href = "/login.html";
  };

  /**
   * Utilidad para obtener el usuario actual
   */
  window.getCurrentUser = function () {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  /**
   * Utilidad para obtener el token
   */
  window.getAuthToken = function () {
    return localStorage.getItem("token");
  };

  /**
   * Interceptor para peticiones AJAX (jQuery)
   */
  if (typeof $ !== "undefined" && $.ajaxSetup) {
    $.ajaxSetup({
      beforeSend: function (xhr, settings) {
        // No agregar token a peticiones de login/auth
        if (
          settings.url.indexOf("/api/auth/login") === -1 &&
          settings.url.indexOf("/api/auth/captcha") === -1
        ) {
          const token = localStorage.getItem("token");
          if (token) {
            xhr.setRequestHeader("Authorization", "Bearer " + token);
          }
        }
      },
      error: function (xhr, status, error) {
        if (xhr.status === 401 || xhr.status === 403) {
          // Token expirado o no válido
          console.log("✗ Sesión expirada o no autorizada");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login.html?error=session_expired";
        }
      },
    });
  }

  // Inicializar cuando el DOM esté listo
  // Siempre usar DOMContentLoaded o load para asegurar que el DOM esté completamente cargado
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else if (document.readyState === "interactive") {
    // DOM está parseado pero recursos aún cargando, usar DOMContentLoaded como seguridad
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM completamente listo, ejecutar inmediatamente
    init();
  }

  console.log("📝 login-handler.js cargado y activo");
})();
