import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Redefinir senha | Caritas Diocese de Caxias do Sul',
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
