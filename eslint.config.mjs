import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts de utilidad (no son parte del bundle de producción)
    "scripts/**",
  ]),
  // Reglas personalizadas
  {
    rules: {
      // `any` es necesario en schemas de Sanity, rutas API dinámicas y adaptadores externos.
      // Se baja a warn para no bloquear el build.
      "@typescript-eslint/no-explicit-any": "warn",
      // Comillas literales en JSX son válidas en español (tildes, comillas tipográficas, etc.)
      "react/no-unescaped-entities": "off",
      // El patrón setMounted(true) en useEffect es estándar para evitar hidratación
      // en SSR. La regla del React Compiler es demasiado estricta para este caso.
      "react-hooks/set-state-in-effect": "warn",
      // Variables no usadas: warn en vez de error para no bloquear el build.
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
