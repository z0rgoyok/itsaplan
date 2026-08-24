'use client';

import Script from 'next/script';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react';

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: 'auto';
      callback(token: string): void;
      'expired-callback'(): void;
      'error-callback'(): void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface AuthTurnstileHandle {
  reset(): void;
}

interface AuthTurnstileProps {
  onTokenChange(token: string): void;
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

export const authCaptchaEnabled = Boolean(siteKey);

function AuthTurnstile({ onTokenChange }: AuthTurnstileProps, ref: Ref<AuthTurnstileHandle>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: 'auth',
      theme: 'auto',
      callback: (token) => onTokenChangeRef.current(token),
      'expired-callback': () => onTokenChangeRef.current(''),
      'error-callback': () => onTokenChangeRef.current(''),
    });
  }, []);

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenChangeRef.current('');
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    },
  }));

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [renderWidget]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="flex min-h-[65px] justify-center" />
    </>
  );
}

export default forwardRef(AuthTurnstile);
