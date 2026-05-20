import type { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Esqueci minha senha | Caritas Diocese de Caxias do Sul',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
