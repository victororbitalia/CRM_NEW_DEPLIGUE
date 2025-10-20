import Layout from '@/components/layout/Layout';

export default function DashboardPage() {
  return (
    <Layout
      title="Dashboard"
      user={{
        name: 'Administrador',
        email: 'admin@restaurante.com',
        role: 'Administrador',
      }}
      restaurantName="Mi Restaurante"
    >
      <div className="fade-in">
        <h1 className="text-2xl font-semibold text-secondary-900 mb-6">
          Panel de Control
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-primary-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Reservas hoy</p>
                <p className="text-2xl font-semibold text-secondary-900">24</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-success-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Mesas disponibles</p>
                <p className="text-2xl font-semibold text-secondary-900">12</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-warning-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-warning-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Próxima reserva</p>
                <p className="text-2xl font-semibold text-secondary-900">19:30</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-error-100 rounded-lg p-3">
                <svg
                  className="h-6 w-6 text-error-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Cancelaciones</p>
                <p className="text-2xl font-semibold text-secondary-900">2</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-medium text-secondary-900 mb-4">
              Reservas recientes
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-secondary-100">
                <div>
                  <p className="text-sm font-medium text-secondary-900">Juan Pérez</p>
                  <p className="text-sm text-secondary-500">Mesa 5 - 4 personas - 20:00</p>
                </div>
                <span className="status-confirmed">Confirmada</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-secondary-100">
                <div>
                  <p className="text-sm font-medium text-secondary-900">María García</p>
                  <p className="text-sm text-secondary-500">Mesa 2 - 2 personas - 21:00</p>
                </div>
                <span className="status-pending">Pendiente</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-secondary-900">Carlos López</p>
                  <p className="text-sm text-secondary-500">Mesa 8 - 6 personas - 22:00</p>
                </div>
                <span className="status-confirmed">Confirmada</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-medium text-secondary-900 mb-4">
              Estado de mesas
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-success-50 rounded-lg">
                <p className="text-2xl font-semibold text-success-600">12</p>
                <p className="text-sm text-success-800">Disponibles</p>
              </div>
              <div className="text-center p-3 bg-error-50 rounded-lg">
                <p className="text-2xl font-semibold text-error-600">8</p>
                <p className="text-sm text-error-800">Ocupadas</p>
              </div>
              <div className="text-center p-3 bg-warning-50 rounded-lg">
                <p className="text-2xl font-semibold text-warning-600">4</p>
                <p className="text-sm text-warning-800">Reservadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}