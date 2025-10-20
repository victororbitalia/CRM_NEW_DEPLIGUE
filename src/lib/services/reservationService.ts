import { 
  Reservation, 
  CreateReservationData, 
  UpdateReservationData,
  WaitlistEntry,
  CreateWaitlistEntryData,
  Customer
} from '@/hooks';

// Business logic for reservation management
export class ReservationService {
  // Default reservation duration in minutes
  private static readonly DEFAULT_DURATION = 120;
  
  // Default advance booking limits
  private static readonly MIN_ADVANCE_HOURS = 2;
  private static readonly MAX_ADVANCE_DAYS = 30;
  
  // Default party size limits
  private static readonly MIN_PARTY_SIZE = 1;
  private static readonly MAX_PARTY_SIZE = 20;
  
  /**
   * Validate reservation data before creation
   */
  static validateReservationData(data: CreateReservationData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!data.customerId) {
      errors.push('Customer is required');
    }
    
    if (!data.date) {
      errors.push('Date is required');
    }
    
    if (!data.startTime) {
      errors.push('Start time is required');
    }
    
    if (!data.partySize) {
      errors.push('Party size is required');
    }
    
    // Validate party size
    if (data.partySize < this.MIN_PARTY_SIZE || data.partySize > this.MAX_PARTY_SIZE) {
      errors.push(`Party size must be between ${this.MIN_PARTY_SIZE} and ${this.MAX_PARTY_SIZE}`);
    }
    
    // Validate date is not in the past
    const reservationDate = new Date(data.date);
    const now = new Date();
    const minDateTime = new Date(now.getTime() + this.MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    
    if (reservationDate < minDateTime) {
      errors.push(`Reservation must be made at least ${this.MIN_ADVANCE_HOURS} hours in advance`);
    }
    
    // Validate date is not too far in the future
    const maxDateTime = new Date(now.getTime() + this.MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
    if (reservationDate > maxDateTime) {
      errors.push(`Reservation cannot be made more than ${this.MAX_ADVANCE_DAYS} days in advance`);
    }
    
    // Validate start time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(data.startTime)) {
      errors.push('Start time must be in HH:MM format (24-hour)');
    }
    
    // Calculate end time if not provided
    const startTime = new Date(`${data.date.toISOString().split('T')[0]}T${data.startTime}:00`);
    let endTimeStr = data.endTime;
    
    if (!endTimeStr) {
      const endTime = new Date(startTime.getTime() + this.DEFAULT_DURATION * 60 * 1000);
      endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Validate end time is after start time
    const endDateTime = new Date(`${data.date.toISOString().split('T')[0]}T${endTimeStr}:00`);
    if (endDateTime <= startTime) {
      errors.push('End time must be after start time');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if a time slot conflicts with existing reservations
   */
  static hasTimeConflict(
    existingReservations: Reservation[],
    date: Date,
    startTime: string,
    endTime: string,
    tableId?: string,
    excludeReservationId?: string
  ): boolean {
    const newStartTime = new Date(`${date.toISOString().split('T')[0]}T${startTime}:00`);
    const newEndTime = new Date(`${date.toISOString().split('T')[0]}T${endTime}:00`);
    
    return existingReservations.some(reservation => {
      // Skip the reservation being updated
      if (excludeReservationId && reservation.id === excludeReservationId) {
        return false;
      }
      
      // Skip if table is specified and doesn't match
      if (tableId && reservation.tableId && reservation.tableId !== tableId) {
        return false;
      }
      
      // Skip if statuses are not active
      if (!['pending', 'confirmed', 'seated'].includes(reservation.status)) {
        return false;
      }
      
      // Check if dates match
      const reservationDate = new Date(reservation.date);
      if (reservationDate.toDateString() !== date.toDateString()) {
        return false;
      }
      
      // Parse reservation times
      const reservationStartTime = new Date(`${date.toISOString().split('T')[0]}T${reservation.startTime}:00`);
      const reservationEndTime = new Date(`${date.toISOString().split('T')[0]}T${reservation.endTime}:00`);
      
      // Check for overlap
      return (
        (newStartTime < reservationEndTime && newEndTime > reservationStartTime)
      );
    });
  }
  
  /**
   * Calculate priority for waitlist entry
   */
  static calculateWaitlistPriority(
    partySize: number,
    customer?: Customer,
    customPriority?: number
  ): number {
    let priority = customPriority || 0;
    
    // Increase priority for larger parties
    priority += Math.floor(partySize / 4);
    
    // Increase priority for VIP customers
    if (customer?.isVip) {
      priority += 5;
    }
    
    return priority;
  }
  
  /**
   * Process waitlist when a table becomes available
   */
  static processWaitlistForTable(
    waitlistEntries: WaitlistEntry[],
    tableId: string,
    tableCapacity: number,
    availableTime: string,
    availableDate: Date
  ): WaitlistEntry | null {
    // Filter entries that match the criteria
    const eligibleEntries = waitlistEntries.filter(entry => {
      // Check if entry is still waiting
      if (entry.status !== 'waiting') return false;
      
      // Check if entry has expired
      if (new Date(entry.expiresAt) < new Date()) return false;
      
      // Check if party size fits
      if (entry.partySize > tableCapacity) return false;
      
      // Check if date matches
      if (new Date(entry.date).toDateString() !== availableDate.toDateString()) return false;
      
      // Check if preferred time is compatible
      if (entry.preferredTime) {
        // In a real implementation, this would be more sophisticated
        // For now, we'll just check if it's within a reasonable range
        const [entryHour] = entry.preferredTime.split(':').map(Number);
        const [availableHour] = availableTime.split(':').map(Number);
        
        if (Math.abs(entryHour - availableHour) > 2) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by priority (highest first) and then by creation time (earliest first)
    eligibleEntries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Return the highest priority entry
    return eligibleEntries.length > 0 ? eligibleEntries[0] : null;
  }
  
  /**
   * Check if a customer can be blacklisted
   */
  static canBlacklistCustomer(customer: Customer, reason?: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if customer is already blacklisted
    if (customer.isBlacklisted) {
      errors.push('Customer is already blacklisted');
    }
    
    // Check if reason is provided
    if (!reason || reason.trim() === '') {
      errors.push('A reason is required to blacklist a customer');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if a customer can be marked as VIP
   */
  static canMarkAsVip(customer: Customer): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if customer is already VIP
    if (customer.isVip) {
      errors.push('Customer is already marked as VIP');
    }
    
    // Check if customer is blacklisted
    if (customer.isBlacklisted) {
      errors.push('Cannot mark a blacklisted customer as VIP');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Generate reservation summary for notifications
   */
  static generateReservationSummary(reservation: Reservation): string {
    const customerName = `${reservation.customerName}`;
    const date = new Date(reservation.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = reservation.startTime;
    const partySize = reservation.partySize;
    const table = reservation.tableName ? `Table ${reservation.tableName}` : 'Not assigned';
    
    return `Reservation for ${customerName}\nDate: ${date}\nTime: ${time}\nParty Size: ${partySize}\nTable: ${table}`;
  }
  
  /**
   * Calculate no-show rate for a customer
   */
  static calculateNoShowRate(customerReservations: Reservation[]): number {
    if (customerReservations.length === 0) return 0;
    
    const noShowCount = customerReservations.filter(r => r.status === 'no_show').length;
    return (noShowCount / customerReservations.length) * 100;
  }
  
  /**
   * Determine if a customer is at risk of no-show
   */
  static isNoShowRisk(customerReservations: Reservation[], threshold: number = 20): boolean {
    const noShowRate = this.calculateNoShowRate(customerReservations);
    return noShowRate >= threshold;
  }
  
  /**
   * Generate customer insights based on reservation history
   */
  static generateCustomerInsights(customerReservations: Reservation[]): {
    totalReservations: number;
    completedReservations: number;
    cancelledReservations: number;
    noShowReservations: number;
    noShowRate: number;
    averagePartySize: number;
    favoriteDayOfWeek: string;
    favoriteTimeSlot: string;
    isRegular: boolean;
    isVipCandidate: boolean;
  } {
    const total = customerReservations.length;
    const completed = customerReservations.filter(r => r.status === 'completed').length;
    const cancelled = customerReservations.filter(r => r.status === 'cancelled').length;
    const noShow = customerReservations.filter(r => r.status === 'no_show').length;
    const noShowRate = this.calculateNoShowRate(customerReservations);
    
    // Calculate average party size
    const totalPartySize = customerReservations.reduce((sum, r) => sum + r.partySize, 0);
    const averagePartySize = total > 0 ? totalPartySize / total : 0;
    
    // Find favorite day of week
    const dayCounts: Record<string, number> = {};
    customerReservations.forEach(r => {
      const day = new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    const favoriteDayOfWeek = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    // Find favorite time slot
    const timeCounts: Record<string, number> = {};
    customerReservations.forEach(r => {
      const time = r.startTime;
      timeCounts[time] = (timeCounts[time] || 0) + 1;
    });
    
    const favoriteTimeSlot = Object.entries(timeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    // Determine if customer is regular (has at least 5 reservations)
    const isRegular = total >= 5;
    
    // Determine if customer is VIP candidate (low no-show rate, regular customer)
    const isVipCandidate = isRegular && noShowRate < 5 && completed >= total * 0.9;
    
    return {
      totalReservations: total,
      completedReservations: completed,
      cancelledReservations: cancelled,
      noShowReservations: noShow,
      noShowRate,
      averagePartySize,
      favoriteDayOfWeek,
      favoriteTimeSlot,
      isRegular,
      isVipCandidate,
    };
  }
}

export default ReservationService;