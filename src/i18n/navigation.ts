import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware wrappers for next/link and next/navigation. Use these instead
// of the bare imports so URLs stay correct under `localePrefix: 'as-needed'`
// (Georgian at /, English at /en/*).
export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation(routing)
