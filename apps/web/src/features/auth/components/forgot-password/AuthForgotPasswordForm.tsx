'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthFormHeader from '../AuthFormHeader';
import AuthMessagePanel from '../AuthMessagePanel';
import { sendPasswordResetEmail } from '../../services/auth.service';
import { useAuthAction } from '../../hooks/useAuthAction';
import AuthTurnstile, { authCaptchaEnabled, type AuthTurnstileHandle } from '../AuthTurnstile';

// Asks for the address and mails a reset link. The answer is the same whether or not
// an account exists, so this screen never tells the visitor which it was.
export default function AuthForgotPasswordForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<AuthTurnstileHandle>(null);
  const [sent, setSent] = useState(false);
  const { error, pending, run } = useAuthAction();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    run(
      async () => {
        try {
          await sendPasswordResetEmail(email, captchaToken);
          setSent(true);
        } finally {
          captchaRef.current?.reset();
        }
      },
      { redirect: false },
    );
  }

  if (sent) {
    return (
      <AuthMessagePanel
        title={t('forgotPassword.sentTitle')}
        description={t('forgotPassword.sentDescription', { email })}
        footer={
          <Link href="/login" className="underline underline-offset-4">
            {t('forgotPassword.backToSignIn')}
          </Link>
        }
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-6 md:p-8">
      <FieldGroup>
        <AuthFormHeader
          title={t('forgotPassword.title')}
          description={t('forgotPassword.subtitle')}
        />

        <Field>
          <FieldLabel htmlFor="email">{t('fields.email')}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={t('fields.emailPlaceholder')}
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </Field>

        {error && <FieldError>{error}</FieldError>}

        <AuthTurnstile ref={captchaRef} onTokenChange={setCaptchaToken} />

        <Field>
          <Button type="submit" disabled={pending || (authCaptchaEnabled && !captchaToken)}>
            {pending ? t('forgotPassword.submitPending') : t('forgotPassword.submit')}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          {t('forgotPassword.remembered')}{' '}
          <Link href="/login" className="underline underline-offset-4">
            {t('forgotPassword.signIn')}
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
