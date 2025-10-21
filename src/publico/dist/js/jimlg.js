$(document).ready(function () {
  // Función de inicio de sesión
  $("#erbo696").click(function (e) {
    e.preventDefault();

    const usuario = $("#Usuario").val();
    const password = $("#dfs654").val();

    // Validación básica
    if (!usuario || !password) {
      alert("Por favor, completa todos los campos");
      return;
    }

    // Preparar datos para cifrado
    const data = {
      user: usuario,
      pass: password,
    };
    const datao = JSON.stringify(data);

    // Cifrar con la clave pública RSA
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(
      atob(
        "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFqY1dlODVxdGhtZGxJK1h5MCtqMgoweWpGQTkxaXA4Yzd2Qy9Xb1hxc054UmlweXd2NHdPOTE2cEhzTEEwTWgydEF2R01zbU9QRzE4NHNoNngyQ2tECkRwNmpqd2wzSHAvUG1TVUMvREJiYlBORkh4aFEzcFdLTGlGMDhMbElqcHdxazhzY0htaldDWmc2TzEvWVVNZGUKVk9YREVYY29md1pFL3RpZzJjZ0RxT2N5dGxOS2oxa01XTmhMM1RjaU9KZEd2VmFOL2xSK2E3d0hGZDZSbnJSMQpkTFR3S21zMkptZm1pbjFZdS83dWFZZ0Rlc2VJcWc5eEpKek9GdTJXTGZjdWFpVER1ODZYbnlSYmxsR1VuSnhNCkJ1RzNkZ3EvQ2s1dGtIOWRHQVljVTZrc04yK0htdU55Wmx1OVJULytQekxDZTQ3MjJGR3I4bjlWSFhNMlZFVXAKZ1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t",
      ),
    );

    const encrypted = encrypt.encrypt(datao);

    if (!encrypted) {
      alert("Error al cifrar los datos");
      return;
    }

    // Limpiar el formulario
    $("#ko895").trigger("reset");

    // Obtener URL del API desde la configuración centralizada
    const apiUrl = window.APP_CONFIG
      ? window.APP_CONFIG.API_HOST + window.APP_CONFIG.ENDPOINTS.TOKEN
      : window.host + "/api/token";

    // Mostrar indicador de carga (si existe Swal)
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Autenticando...",
        text: "Por favor espera",
        allowOutsideClick: false,
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
        oeiro: encrypted,
      }),
    })
      .then(function (response) {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error("Error en la autenticación: " + response.status);
        }
      })
      .then(function (texto) {
        console.log("Autenticación exitosa:", texto);

        // Cerrar indicador de carga
        if (typeof Swal !== "undefined") {
          Swal.close();
        }

        // Guardar token si viene en la respuesta
        try {
          const data = JSON.parse(texto);
          if (data.token) {
            localStorage.setItem("authToken", data.token);
          }
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            // Redirigir al index por defecto
            window.location.href = "index.html";
          }
        } catch (e) {
          // Si no es JSON, solo redirigir
          window.location.href = "index.html";
        }
      })
      .catch(function (err) {
        console.error("Error en login:", err);

        // Mostrar error al usuario
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Error de Autenticación",
            text: "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.",
            confirmButtonText: "Aceptar",
          });
        } else {
          alert(
            "Error de autenticación. Por favor, verifica tus credenciales.",
          );
        }

        // Recargar el formulario
        window.location.reload();
      });

    return false;
  });

  // Permitir enviar con Enter en el campo de password
  $("#dfs654").keypress(function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $("#erbo696").click();
    }
  });

  // Validación en tiempo real
  $("#Usuario, #dfs654").on("input", function () {
    $(this).removeClass("is-invalid");
  });

  // Focus automático en el campo de usuario al cargar
  $("#Usuario").focus();
});
