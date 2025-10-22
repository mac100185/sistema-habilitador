/**
 * JIMLG - Sistema de Login Simplificado
 * Compatible con nuevo sistema de autenticación
 * Sin dependencia de JSEncrypt
 */

$(document).ready(function () {
  console.log("📋 jimlg.js: Sistema de login cargado");

  // Verificar si login-handler.js ya está manejando el login
  if (window.loginHandlerActive) {
    console.log(
      "ℹ️ jimlg.js: login-handler.js ya está activo, delegando funcionalidad",
    );
    return;
  }

  // Función de inicio de sesión
  $("#erbo696").click(function (e) {
    e.preventDefault();

    const usuario = $("#Usuario").val();
    const password = $("#dfs654").val();

    // Validación básica
    if (!usuario || !password) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Campos requeridos",
          text: "Por favor, completa todos los campos",
          confirmButtonText: "Aceptar",
        });
      } else {
        alert("Por favor, completa todos los campos");
      }
      return;
    }

    // Deshabilitar botón mientras procesa
    const $button = $("#erbo696");
    const originalText = $button.text();
    $button.prop("disabled", true).text("Ingresando...");

    // Obtener URL del API desde la configuración centralizada
    const apiUrl = window.APP_CONFIG
      ? window.APP_CONFIG.API_HOST + "/api/auth/login"
      : "/api/auth/login";

    console.log("🔐 jimlg.js: Intentando login para usuario:", usuario);

    // Mostrar indicador de carga
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Autenticando...",
        text: "Por favor espera",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    // Realizar petición de autenticación
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usuario,
        password: password,
      }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { status: response.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status === 200 && result.data.success) {
          console.log("✓ jimlg.js: Autenticación exitosa");

          // Guardar token y datos del usuario
          if (result.data.token) {
            localStorage.setItem("token", result.data.token);
          }
          if (result.data.user) {
            localStorage.setItem("user", JSON.stringify(result.data.user));
          }

          // Cerrar indicador de carga
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "success",
              title: "¡Bienvenido!",
              text: "Redirigiendo...",
              timer: 1500,
              showConfirmButton: false,
            });
          }

          // Redirigir después de un breve delay
          setTimeout(function () {
            window.location.href = result.data.redirectUrl || "index.html";
          }, 1500);
        } else {
          throw new Error(result.data.message || "Error de autenticación");
        }
      })
      .catch(function (err) {
        console.error("✗ jimlg.js: Error en login:", err);

        // Rehabilitar botón
        $button.prop("disabled", false).text(originalText);

        // Mostrar error al usuario
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Error de Autenticación",
            text:
              err.message ||
              "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.",
            confirmButtonText: "Aceptar",
          });
        } else {
          alert(
            err.message ||
              "Error de autenticación. Por favor, verifica tus credenciales.",
          );
        }

        // Limpiar el campo de password
        $("#dfs654").val("").focus();
      });

    return false;
  });

  // Permitir enviar con Enter en el campo de password
  $("#dfs654").keypress(function (e) {
    if (e.which === 13 || e.keyCode === 13) {
      e.preventDefault();
      $("#erbo696").click();
    }
  });

  // Permitir enviar con Enter en el campo de usuario
  $("#Usuario").keypress(function (e) {
    if (e.which === 13 || e.keyCode === 13) {
      e.preventDefault();
      $("#dfs654").focus();
    }
  });

  // Validación en tiempo real
  $("#Usuario, #dfs654").on("input", function () {
    $(this).removeClass("is-invalid");
  });

  // Focus automático en el campo de usuario al cargar
  setTimeout(function () {
    $("#Usuario").focus();
  }, 100);

  // Verificar si hay sesión activa
  const token = localStorage.getItem("token");
  if (token) {
    console.log("ℹ️ jimlg.js: Token encontrado, verificando validez...");
    // Dejar que auth-guard o login-handler lo manejen
  }
});
