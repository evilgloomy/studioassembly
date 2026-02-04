import { Outlet } from 'react-router-dom';
import { CaerholdAdminSidebar } from './CaerholdAdminSidebar';

export function CaerholdAdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <CaerholdAdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
