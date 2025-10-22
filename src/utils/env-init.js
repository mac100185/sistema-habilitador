/**
 * Inicializador de Variables de Entorno
 * Sistema Habilitador
 *
 * Este módulo se encarga de:
 * - Crear archivo .env desde .env.example si no existe
 * - Autogenerar JWT_SECRET si no está configurado
 * - Validar configuración crítica
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class EnvInitializer {
  constructor() {
    this.projectRoot = path.join(__dirname, "..", "..");
    this.envPath = path.join(this.projectRoot, ".env");
    this.envExamplePath = path.join(this.projectRoot, ".env.example");
  }

  /**
   * Inicializar variables de entorno
   */
  initialize() {
    console.log("🔧 Inicializando configuración de variables de entorno...");

    // Verificar si .env existe
    if (!fs.existsSync(this.envPath)) {
      console.log(
        "📝 Archivo .env no encontrado, creando desde .env.example...",
      );
      this.createEnvFromExample();
    }

    // Cargar variables de entorno
    require("dotenv").config({ path: this.envPath });

    // Verificar y generar JWT_SECRET si es necesario
    this.ensureJwtSecret();

    // Recargar variables de entorno después de modificaciones
    require("dotenv").config({ path: this.envPath, override: true });

    console.log("✅ Configuración de variables de entorno completada\n");
  }

  /**
   * Crear archivo .env desde .env.example
   */
  createEnvFromExample() {
    try {
      if (fs.existsSync(this.envExamplePath)) {
        // Leer contenido de .env.example
        let envContent = fs.readFileSync(this.envExamplePath, "utf8");

        // Escribir archivo .env
        fs.writeFileSync(this.envPath, envContent, "utf8");
        console.log("✓ Archivo .env creado desde .env.example");
      } else {
        // Si no existe .env.example, crear un .env básico
        console.log("⚠ .env.example no encontrado, creando .env básico...");
        this.createBasicEnv();
      }
    } catch (error) {
      console.error("❌ Error creando archivo .env:", error.message);
      // Crear .env básico como fallback
      this.createBasicEnv();
    }
  }

  /**
   * Crear archivo .env básico con valores mínimos
   */
  createBasicEnv() {
    const basicEnv = `# Configuración Básica - Sistema Habilitador
# Generado automáticamente

# Base de Datos
DB_HOST=dbsh
DB_PORT=3306
DB_USER=quanium
DB_PASSWORD=quanium
DB_NAME=sisthabpro

# Servidor
PORT=7777
NODE_ENV=production

# Seguridad (autogenerado)
JWT_SECRET=temporary-will-be-replaced
JWT_EXPIRES_IN=8h

# CORS
ALLOWED_ORIGINS=*
`;

    fs.writeFileSync(this.envPath, basicEnv, "utf8");
    console.log("✓ Archivo .env básico creado");
  }

  /**
   * Verificar y generar JWT_SECRET si es necesario
   */
  ensureJwtSecret() {
    const currentSecret = process.env.JWT_SECRET;

    // Lista de valores que se consideran "por defecto" y deben ser reemplazados
    const defaultSecrets = [
      "your-secret-key-here-change-in-production",
      "sistema-habilitador-secret-key-2024",
      "sistema-habilitador-secret-key-prod-2024-change-this",
      "temporary-will-be-replaced",
      "auto-generated-on-first-start",
      "",
      undefined,
      null,
    ];

    const needsNewSecret =
      !currentSecret ||
      defaultSecrets.includes(currentSecret) ||
      currentSecret.length < 32;

    if (needsNewSecret) {
      console.log("🔐 Generando JWT_SECRET automáticamente...");
      const newSecret = this.generateJwtSecret();
      this.updateEnvVariable("JWT_SECRET", newSecret);
      process.env.JWT_SECRET = newSecret;
      console.log("✓ JWT_SECRET generado y guardado en .env");
      console.log(`   Longitud: ${newSecret.length} caracteres`);
    } else {
      console.log("✓ JWT_SECRET ya está configurado correctamente");
    }
  }

  /**
   * Generar un JWT_SECRET seguro
   */
  generateJwtSecret() {
    // Generar 64 bytes aleatorios y convertir a base64
    // Esto resulta en un string de aproximadamente 88 caracteres
    return crypto.randomBytes(64).toString("base64");
  }

  /**
   * Actualizar una variable en el archivo .env
   */
  updateEnvVariable(key, value) {
    try {
      let envContent = "";

      // Leer contenido actual si existe
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, "utf8");
      }

      // Buscar si la variable ya existe
      const keyRegex = new RegExp(`^${key}=.*$`, "m");
      const newLine = `${key}=${value}`;

      if (keyRegex.test(envContent)) {
        // Reemplazar valor existente
        envContent = envContent.replace(keyRegex, newLine);
      } else {
        // Agregar nueva variable
        // Buscar la sección de seguridad o agregar al final
        const securitySectionRegex =
          /# ?=+ ?\n# ?CONFIGURACIÓN DE SEGURIDAD\n# ?=+ ?/i;

        if (securitySectionRegex.test(envContent)) {
          // Agregar después de la sección de seguridad
          envContent = envContent.replace(
            securitySectionRegex,
            (match) => `${match}\n${newLine}`,
          );
        } else {
          // Agregar al final del archivo
          if (!envContent.endsWith("\n")) {
            envContent += "\n";
          }
          envContent += `\n# Seguridad\n${newLine}\n`;
        }
      }

      // Escribir archivo actualizado
      fs.writeFileSync(this.envPath, envContent, "utf8");
    } catch (error) {
      console.error(`❌ Error actualizando ${key} en .env:`, error.message);
    }
  }

  /**
   * Validar que las variables críticas estén configuradas
   */
  validateCriticalVariables() {
    const critical = [
      "DB_HOST",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "JWT_SECRET",
      "PORT",
    ];

    const missing = [];
    const warnings = [];

    critical.forEach((key) => {
      const value = process.env[key];
      if (!value || value === "" || value === "undefined") {
        missing.push(key);
      }
    });

    // Advertencias adicionales
    if (process.env.NODE_ENV === "production") {
      if (process.env.DB_PASSWORD === "quanium") {
        warnings.push("DB_PASSWORD usa valor por defecto en producción");
      }
      if (process.env.ALLOWED_ORIGINS === "*") {
        warnings.push("ALLOWED_ORIGINS permite todos los orígenes (*)");
      }
    }

    if (missing.length > 0) {
      console.error("❌ Variables de entorno críticas faltantes:");
      missing.forEach((key) => console.error(`   - ${key}`));
      return false;
    }

    if (warnings.length > 0) {
      console.warn("⚠️  Advertencias de seguridad:");
      warnings.forEach((msg) => console.warn(`   - ${msg}`));
    }

    return true;
  }

  /**
   * Obtener información de la configuración actual
   */
  getConfigInfo() {
    return {
      envFileExists: fs.existsSync(this.envPath),
      envExampleExists: fs.existsSync(this.envExamplePath),
      jwtSecretConfigured: !!(
        process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
      ),
      nodeEnv: process.env.NODE_ENV || "development",
      port: process.env.PORT || "7777",
      dbHost: process.env.DB_HOST || "dbsh",
      dbName: process.env.DB_NAME || "sisthabpro",
    };
  }

  /**
   * Mostrar información de la configuración
   */
  displayConfigInfo() {
    const info = this.getConfigInfo();

    console.log("📋 Estado de la configuración:");
    console.log(
      `   Archivo .env: ${info.envFileExists ? "✓ Existe" : "✗ No existe"}`,
    );
    console.log(
      `   JWT_SECRET: ${info.jwtSecretConfigured ? "✓ Configurado" : "✗ No configurado"}`,
    );
    console.log(`   Ambiente: ${info.nodeEnv}`);
    console.log(`   Puerto: ${info.port}`);
    console.log(`   Base de datos: ${info.dbName}@${info.dbHost}`);
    console.log("");
  }
}

/**
 * Función principal de inicialización
 */
function initializeEnvironment() {
  const initializer = new EnvInitializer();

  try {
    initializer.initialize();
    initializer.displayConfigInfo();

    // Validar variables críticas
    const isValid = initializer.validateCriticalVariables();

    return isValid;
  } catch (error) {
    console.error("❌ Error fatal inicializando variables de entorno:", error);
    return false;
  }
}

/**
 * Si se ejecuta directamente
 */
if (require.main === module) {
  const success = initializeEnvironment();
  process.exit(success ? 0 : 1);
}

module.exports = {
  EnvInitializer,
  initializeEnvironment,
};
