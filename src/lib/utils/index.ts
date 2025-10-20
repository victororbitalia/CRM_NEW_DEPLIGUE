import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(dateObj);
}

// Format time to readable string
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const formattedHour = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${formattedHour}:${minutes} ${ampm}`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Spanish format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:(?:\+|00)34\s?)?(?:6|7|8|9)\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Calculate time difference in minutes
export function getTimeDifference(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes - startTotalMinutes;
}

// Check if a time is within operating hours
export function isWithinOperatingHours(
  time: string,
  openingTime: string,
  closingTime: string
): boolean {
  const [hours, minutes] = time.split(':').map(Number);
  const [openingHours, openingMinutes] = openingTime.split(':').map(Number);
  const [closingHours, closingMinutes] = closingTime.split(':').map(Number);
  
  const timeInMinutes = hours * 60 + minutes;
  const openingInMinutes = openingHours * 60 + openingMinutes;
  const closingInMinutes = closingHours * 60 + closingMinutes;
  
  return timeInMinutes >= openingInMinutes && timeInMinutes <= closingInMinutes;
}

// Debounce function
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Format currency (EUR)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Get status color based on reservation or table status
export function getStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
    case 'AVAILABLE':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'NO_SHOW':
    case 'MAINTENANCE':
      return 'error';
    case 'SEATED':
    case 'OCCUPIED':
    case 'COMPLETED':
    case 'RESERVED':
      return 'secondary';
    default:
      return 'secondary';
  }
}

// Get status text in Spanish
export function getStatusText(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmada';
    case 'PENDING':
      return 'Pendiente';
    case 'CANCELLED':
      return 'Cancelada';
    case 'NO_SHOW':
      return 'No presentado';
    case 'SEATED':
      return 'Sentado';
    case 'COMPLETED':
      return 'Completada';
    case 'AVAILABLE':
      return 'Disponible';
    case 'OCCUPIED':
      return 'Ocupada';
    case 'RESERVED':
      return 'Reservada';
    case 'MAINTENANCE':
      return 'Mantenimiento';
    default:
      return status;
  }
}

// Get location text in Spanish
export function getLocationText(location: string): string {
  switch (location) {
    case 'INTERIOR':
      return 'Interior';
    case 'EXTERIOR':
      return 'Exterior';
    case 'TERRACE':
      return 'Terraza';
    case 'PRIVATE':
      return 'Privado';
    default:
      return location;
  }
}

// Get role text in Spanish
export function getRoleText(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'MANAGER':
      return 'Gerente';
    case 'STAFF':
      return 'Personal';
    default:
      return role;
  }
}