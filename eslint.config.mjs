// WHY-77: flat config restore. eslint-config-next@16 ships flat-native
// entries at these two subpaths — no FlatCompat / @eslint/eslintrc required.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // WHY-77 triage: raw apostrophes in JSX render correctly. The rule is
      // legacy pedantry from a pre-modern-JSX era. Signal-to-noise is worse
      // than the (nonexistent) rendering issue. Follow-up in the triage
      // ticket if we ever want strict HTML entities.
      'react/no-unescaped-entities': 'off',

      // Standard convention: underscore-prefixed identifiers are
      // intentionally unused. Applies to args, destructured vars, and
      // catch bindings.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Scoped disable: normalize(row: any) in Supabase adapters and
    // pickPayload(body: any) in admin API routes are deliberate. The
    // supabase-js client returns untyped rows and JSON request bodies
    // are untyped by definition. Rest of the codebase keeps the rule on
    // so new `any` usage outside these paths still gets caught. Full
    // fix (Supabase codegen + zod-parse bodies) tracked in WHY-80.
    files: ['src/lib/**', 'src/app/api/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      '.vercel/**',
      'node_modules/**',
      'next-env.d.ts',
    ],
  },
]
