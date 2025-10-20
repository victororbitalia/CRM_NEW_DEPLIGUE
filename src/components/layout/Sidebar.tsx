import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}

function SidebarItem({ href, icon, label, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
      )}
    >
      <div className="mr-3 h-5 w-5">{icon}</div>
      {label}
    </Link>
  );
}

interface SidebarProps {
  restaurantName?: string;
}

export default function Sidebar({ restaurantName = 'Mi Restaurante' }: SidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col h-full bg-white border-r border-secondary-200">
      <div className="flex items-center h-16 px-4 border-b border-secondary-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-lg bg-restaurant-gold flex items-center justify-center mr-3">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">{restaurantName}</h2>
            <p className="text-xs text-secondary-500">Panel de Control</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        <SidebarItem
          href="/dashboard"
          icon={
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
          label="Dashboard"
          active={pathname === '/dashboard'}
        />
        
        <SidebarItem
          href="/reservations"
          icon={
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          label="Reservas"
          active={pathname.startsWith('/reservations')}
        />
        
        <SidebarItem
          href="/tables"
          icon={
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          label="Mesas"
          active={pathname.startsWith('/tables')}
        />
        
        <SidebarItem
          href="/restaurant"
          icon={
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
              />
            </svg>
          }
          label="Restaurante"
          active={pathname.startsWith('/restaurant')}
        />
        
        <SidebarItem
          href="/settings"
          icon={
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          label="Configuración"
          active={pathname.startsWith('/settings')}
        />
      </nav>
      
      <div className="p-4 border-t border-secondary-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-secondary-200 flex items-center justify-center mr-3">
            <svg
              className="h-4 w-4 text-secondary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900">Usuario</p>
            <Link href="/auth/logout" className="text-xs text-secondary-500 hover:text-secondary-700">
              Cerrar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}