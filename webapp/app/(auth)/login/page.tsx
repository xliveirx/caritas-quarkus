import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar | Caritas Diocese de Caxias do Sul',
  description: 'Acesse a plataforma Caritas com as credenciais da sua paróquia.',
};

export default function LoginPage() {
  return <LoginForm />;
}
