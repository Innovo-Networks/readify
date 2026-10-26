'use client'
import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget for the auth forms. The token is passed to Supabase
 * (captchaToken), which verifies it with the secret set in Supabase Attack Protection.
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, nothing renders and forms submit
 * without a token, so the site keeps working until the key is configured.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
export const TURNSTILE_ENABLED = Boolean(SITE_KEY)

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export default function TurnstileWidget({
  onToken,
  resetKey,
}: {
  onToken: (token: string | null) => void
  /** Change this value after each submit: Turnstile tokens are single use. */
  resetKey: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.dataset.turnstile = 'true'
        document.head.appendChild(script)
      }
      script.addEventListener('load', render)
    }

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!SITE_KEY || !widgetIdRef.current || !window.turnstile) return
    window.turnstile.reset(widgetIdRef.current)
    onTokenRef.current(null)
  }, [resetKey])

  if (!SITE_KEY) return null
  return <div ref={containerRef} className="flex justify-center" />
}
