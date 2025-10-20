// Export all custom hooks
export { default as useNotifications } from './useNotifications';
export { default as usePrisma } from './usePrisma';
export { default as useTables } from './useTables';
export { useApiTokens } from './useApiTokens';

// Reservation-related hooks
export { default as useReservations } from './useReservations';
export { default as useReservationCalendar } from './useReservationCalendar';
export { default as useAvailability } from './useAvailability';
export { default as useWaitlist } from './useWaitlist';
export { default as useCustomers } from './useCustomers';

// Re-export types for convenience
export type {
  Reservation,
  CreateReservationData,
  UpdateReservationData,
  ReservationFilters,
} from './useReservations';

export type {
  CalendarReservation,
  TimeSlot,
  CalendarDay,
  AvailabilityResult,
} from './useReservationCalendar';

export type {
  AvailabilityRequest,
} from './useAvailability';

export type {
  WaitlistEntry,
  CreateWaitlistEntryData,
  UpdateWaitlistEntryData,
  WaitlistFilters,
} from './useWaitlist';

export type {
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerFilters,
} from './useCustomers';