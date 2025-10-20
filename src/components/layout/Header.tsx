import { ReactNode } from 'react';
import Button from '../ui/Button';

interface HeaderProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  actions?: ReactNode;
}

export default function Header({ title = 'CRM Restaurante', user, actions }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-secondary-900">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
            
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                  <p className="text-xs text-secondary-500">{user.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}