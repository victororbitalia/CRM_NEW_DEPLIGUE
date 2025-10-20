// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Table types
export interface Table {
  id: string;
  number: string;
  capacity: number;
  location: TableLocation;
  status: TableStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TableLocation {
  INTERIOR = 'INTERIOR',
  EXTERIOR = 'EXTERIOR',
  TERRACE = 'TERRACE',
  PRIVATE = 'PRIVATE',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
}

// Reservation types
export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Date;
  time: string;
  partySize: number;
  tableId?: string;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  user: User;
  token: string;
  refreshToken: string;
}

// Form types
export interface CreateReservationData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: string;
  specialRequests?: string;
}

export interface CreateTableData {
  number: string;
  capacity: number;
  location: TableLocation;
}

export interface UpdateRestaurantData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone?: string;
}