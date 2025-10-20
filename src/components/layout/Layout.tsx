import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  actions?: ReactNode;
  restaurantName?: string;
}

export default function Layout({
  children,
  title,
  user,
  actions,
  restaurantName,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar restaurantName={restaurantName} />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header title={title} user={user} actions={actions} />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto bg-secondary-50">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}