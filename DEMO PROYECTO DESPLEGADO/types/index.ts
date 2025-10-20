// Tipos principales para el Sistema de Reservas

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  location: 'interior' | 'exterior' | 'terraza' | 'privado';
  isAvailable: boolean;
  positionX?: number; // Relative X position (0-100)
  positionY?: number; // Relative Y position (0-100)
  zoneId?: string; // Reference to zone for better organization
}

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Date;
  time: string;
  guests: number;
  tableId?: string;
  preferredLocation?: 'interior' | 'exterior' | 'terraza' | 'privado' | 'any';
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: Date;
}

export interface DashboardStats {
  todayReservations: number;
  weekReservations: number;
  averageGuests: number;
  occupancyRate: number;
}

export interface Zone {
  id: string;
  name: string;
  displayName: string;
  color: string;
  boundaryX?: number;
  boundaryY?: number;
  width?: number;
  height?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableMapData {
  tables: Table[];
  zones: Zone[];
}
