import { AuthGuard } from '@/components/auth-guard';
import { AppTopbar } from '@/components/app-topbar';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-dvh bg-slate-100">
        <AppTopbar />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto bg-slate-100">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
