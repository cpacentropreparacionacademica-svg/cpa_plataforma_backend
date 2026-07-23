// Configuración plana de ESLint 9.
//
// El repositorio declaraba el script `yarn lint` y la dependencia de ESLint 9, pero no
// existía ningún archivo de configuración: `yarn lint` (y por tanto `yarn check`, que CI
// ejecuta) fallaba siempre con «ESLint couldn't find an eslint.config.(js|mjs|cjs) file».
// Esta configuración restablece la verificación sin endurecer reglas de golpe: se centra
// en errores reales, no en estilo, que ya cubre Prettier.

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // El runtime heredado en JavaScript no se compila ni se despliega: `nest build`
      // solo incluye src/**/*.ts. Se excluye para no bloquear el lint con código inerte.
      'src/**/*.js',
      'scripts/**',
      'eslint.config.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    rules: {
      // El código contable usa `any` en las filas devueltas por consultas SQL crudas.
      // Se reporta como aviso para no ocultarlo, sin bloquear la verificación.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Los errores contables nunca deben silenciarse con bloques vacíos.
      'no-empty': ['error', { allowEmptyCatch: false }],
      eqeqeq: ['error', 'smart'],
      'no-console': 'off',
    },
  },
  {
    // Las specs de smoke cargan la aplicación con `require` para controlar el momento
    // exacto de arranque respecto a las variables de entorno. Es deliberado.
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
