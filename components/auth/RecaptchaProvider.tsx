/**
 * Provider de reCAPTCHA v3
 * Envuelve la app para habilitar reCAPTCHA
 */

'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  // Solo renderizar si hay site key configurada
  if (!RECAPTCHA_SITE_KEY) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
        nonce: undefined,
      }}
      useRecaptchaNet={false}
      useEnterprise={false}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}

