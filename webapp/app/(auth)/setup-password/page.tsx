import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetupPasswordForm } from './setup-password-form';

export const metadata: Metadata = {
  title: 'Definir credenciais | Caritas Diocese de Caxias do Sul',
};

export default function SetupPasswordPage() {
  return (
    <Suspense>
      <SetupPasswordForm />
    </Suspense>
  );
}
