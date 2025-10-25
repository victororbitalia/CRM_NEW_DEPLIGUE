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

export interface CreateRestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  timezone: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  currency?: string;
}

export interface RestaurantWithRelations extends Restaurant {
  settings?: any;
  areas?: any[];
  tables?: any[];
  operatingHours?: any[];
  businessRules?: any[];
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

// Area types
export interface Area {
  id: string;
  name: string;
  description?: string;
  maxCapacity: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
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

export interface CreateAreaData {
  name: string;
  description?: string;
  maxCapacity: number;
  isActive?: boolean;
}

export interface UpdateAreaData {
  name?: string;
  description?: string;
  maxCapacity?: number;
  isActive?: boolean;
}

export interface OperatingHour {
  id: string;
  dayOfWeek: number; // 0-6, where 0 is Sunday
  openTime: string;   // formato 'HH:mm'
  closeTime: string;  // formato 'HH:mm'
  isClosed?: boolean; // opcional, para días cerrados
  specialDate?: Date; // opcional, para días especiales
  isSpecialDay?: boolean; // opcional, para días especiales
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOperatingHourData {
  dayOfWeek: number; // 0-6, where 0 is Sunday
  openTime: string;   // formato 'HH:mm'
  closeTime: string;  // formato 'HH:mm'
  isClosed?: boolean; // opcional, para días cerrados
  specialDate?: Date; // opcional, para días especiales
  isSpecialDay?: boolean; // opcional, para días especiales
}

export interface UpdateOperatingHourData {
  dayOfWeek?: number;
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
  specialDate?: Date;
  isSpecialDay?: boolean;
}

export interface CreateBusinessRuleData {
  name: string;
  ruleType: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  conditions?: Record<string, any> | null;
  actions?: Record<string, any> | null;
}

export interface UpdateBusinessRuleData {
  name?: string;
  ruleType?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  conditions?: Record<string, any> | null;
  actions?: Record<string, any> | null;
}

export interface UpdateRestaurantData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  timezone?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  currency?: string;
}

export interface RestaurantSettings {
  id: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  defaultReservationDuration?: number;
  maxAdvanceBookingDays?: number;
  minAdvanceBookingHours?: number;
  maxPartySize?: number;
  enableOnlineBookings?: boolean;
  enableWaitlist?: boolean;
  confirmationEmailEnabled?: boolean;
  reminderEmailEnabled?: boolean;
  reminderEmailHoursBefore?: number;
  cancellationEmailEnabled?: boolean;
  autoCancelNoShowMinutes?: number;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateRestaurantSettingsData {
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  defaultReservationDuration?: number;
  maxAdvanceBookingDays?: number;
  minAdvanceBookingHours?: number;
  maxPartySize?: number;
  enableOnlineBookings?: boolean;
  enableWaitlist?: boolean;
  confirmationEmailEnabled?: boolean;
  reminderEmailEnabled?: boolean;
  reminderEmailHoursBefore?: number;
  cancellationEmailEnabled?: boolean;
  autoCancelNoShowMinutes?: number;
}