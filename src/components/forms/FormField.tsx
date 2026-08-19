'use client'

import { useId, type ReactNode } from 'react'

// Accessibility primitive shared by both inquiry forms. Every field gets:
//   - a visible <label> tied to the control via htmlFor/id (never placeholder-only)
//   - an optional error string rendered in an aria-live="polite" region and
//     wired to the control via aria-describedby, so screen readers announce
//     validation errors when they appear
//   - min-height on the control area so touch targets clear 44px on mobile
//   - visible focus rings via Tailwind focus-visible utilities
//   - a required marker rendered as text ("*"), not colour-only, so it works
//     for colour-blind users and screen readers alike

interface Props {
  label: string
  required?: boolean
  error?: string | null
  helpText?: string
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
}

export function FormField({ label, required, error, helpText, children }: Props) {
  const id = useId()
  const errorId = `${id}-error`
  const helpId = `${id}-help`
  const describedBy = [error ? errorId : null, helpText ? helpId : null]
    .filter(Boolean)
    .join(' ') || undefined
  const invalid = Boolean(error)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-white">
        {label}
        {required && (
          <span aria-hidden="true" className="text-[#FFCC00] ml-1">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children({ id, describedBy, invalid })}
      {helpText && (
        <p id={helpId} className="text-xs text-white/50">
          {helpText}
        </p>
      )}
      <p id={errorId} role="alert" aria-live="polite" className="min-h-[1.25rem] text-sm text-red-400">
        {error ? (
          <>
            <span aria-hidden="true">✕ </span>
            {error}
          </>
        ) : (
          ''
        )}
      </p>
    </div>
  )
}

// Shared class strings for consistent styling + touch target sizing across
// both forms. min-h-11 == 44px, matching WCAG 2.1 target-size guidance.
export const inputClass =
  'w-full min-h-11 px-4 py-2 bg-black border border-white/20 text-white rounded-md ' +
  'placeholder:text-white/30 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCC00] focus-visible:border-[#FFCC00] ' +
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500 ' +
  'disabled:opacity-50'

export const buttonClass =
  'min-h-11 px-6 py-3 bg-[#FFCC00] text-black font-bold uppercase tracking-widest text-sm rounded-md ' +
  'hover:bg-[#FFCC00]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed'
