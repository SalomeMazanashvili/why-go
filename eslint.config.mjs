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

      // WHY-77 triage: normalize(row: any) in Supabase adapters (lib and
      // /api/admin/*) is deliberate — the supabase-js client returns
      // untyped rows and we shape them into our own types. Dropping this
      // rule requires generating types with `supabase gen types`, tracked
      // as a follow-up.
      '@typescript-eslint/no-explicit-any': 'off',

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
    ignores: [
      '.next/**',
      '.vercel/**',
      'node_modules/**',
      'next-env.d.ts',
    ],
  },
]
