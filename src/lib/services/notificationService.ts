import { Reservation, Customer } from '@/hooks';

export interface NotificationData {
  recipient: string;
  subject?: string;
  content: string;
  channel: 'email' | 'sms' | 'push';
  type: 'confirmation' | 'reminder' | 'cancellation' | 'promotion' | 'waitlist' | 'custom';
  reservationId?: string;
  customerId?: string;
}

export interface NotificationTemplate {
  subject: string;
  content: string;
  channel: 'email' | 'sms' | 'push';
  type: 'confirmation' | 'reminder' | 'cancellation' | 'promotion' | 'waitlist' | 'custom';
}

export class NotificationService {
  // Default reminder times (in hours before reservation)
  private static readonly REMINDER_TIMES = [24, 2];
  
  /**
   * Send a notification
   */
  static async sendNotification(data: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would call an email/SMS service
      // For now, we'll just log the notification
      console.log('Sending notification:', data);
      
      // Mock API call
      const response = await fetch('/api/reservations/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }
  
  /**
   * Generate reservation confirmation notification
   */
  static generateConfirmationNotification(reservation: Reservation): NotificationData {
    const customerName = reservation.customerName;
    const date = new Date(reservation.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = reservation.startTime;
    const partySize = reservation.partySize;
    const table = reservation.tableName ? `Table ${reservation.tableName}` : 'To be assigned';
    
    return {
      recipient: reservation.customerEmail,
      subject: `Reservation Confirmation - ${date} at ${time}`,
      content: `
        Dear ${customerName},
        
        Your reservation has been confirmed with the following details:
        
        Date: ${date}
        Time: ${time}
        Party Size: ${partySize}
        Table: ${table}
        
        Please arrive on time. If you need to cancel or modify your reservation, please contact us at least 2 hours in advance.
        
        We look forward to welcoming you!
        
        Best regards,
        The Restaurant Team
      `,
      channel: 'email',
      type: 'confirmation',
      reservationId: reservation.id,
      customerId: reservation.customerId,
    };
  }
  
  /**
   * Generate reservation reminder notification
   */
  static generateReminderNotification(reservation: Reservation, hoursBefore: number): NotificationData {
    const customerName = reservation.customerName;
    const date = new Date(reservation.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = reservation.startTime;
    const partySize = reservation.partySize;
    const table = reservation.tableName ? `Table ${reservation.tableName}` : 'To be assigned';
    
    return {
      recipient: reservation.customerEmail,
      subject: `Reservation Reminder - ${date} at ${time}`,
      content: `
        Dear ${customerName},
        
        This is a friendly reminder about your upcoming reservation:
        
        Date: ${date}
        Time: ${time}
        Party Size: ${partySize}
        Table: ${table}
        
        Your reservation is in ${hoursBefore} hours.
        
        If you need to cancel or modify your reservation, please contact us as soon as possible.
        
        We look forward to welcoming you!
        
        Best regards,
        The Restaurant Team
      `,
      channel: 'email',
      type: 'reminder',
      reservationId: reservation.id,
      customerId: reservation.customerId,
    };
  }
  
  /**
   * Generate reservation cancellation notification
   */
  static generateCancellationNotification(reservation: Reservation): NotificationData {
    const customerName = reservation.customerName;
    const date = new Date(reservation.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = reservation.startTime;
    
    return {
      recipient: reservation.customerEmail,
      subject: `Reservation Cancelled - ${date} at ${time}`,
      content: `
        Dear ${customerName},
        
        Your reservation has been cancelled with the following details:
        
        Date: ${date}
        Time: ${time}
        
        If you did not request this cancellation, please contact us immediately.
        
        We hope to see you again soon!
        
        Best regards,
        The Restaurant Team
      `,
      channel: 'email',
      type: 'cancellation',
      reservationId: reservation.id,
      customerId: reservation.customerId,
    };
  }
  
  /**
   * Generate waitlist notification
   */
  static generateWaitlistNotification(waitlistEntry: any, availableTime: string, availableDate: Date): NotificationData {
    const customerName = waitlistEntry.customer.firstName;
    const date = availableDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const partySize = waitlistEntry.partySize;
    
    return {
      recipient: waitlistEntry.customer.email,
      subject: `Table Available - ${date} at ${availableTime}`,
      content: `
        Dear ${customerName},
        
        Good news! A table has become available for your waitlist request:
        
        Date: ${date}
        Time: ${availableTime}
        Party Size: ${partySize}
        
        This offer is valid for a limited time. Please confirm your acceptance as soon as possible.
        
        To accept this offer, please reply to this email or call us at [Restaurant Phone Number].
        
        We look forward to welcoming you!
        
        Best regards,
        The Restaurant Team
      `,
      channel: 'email',
      type: 'waitlist',
      customerId: waitlistEntry.customer.id,
    };
  }
  
  /**
   * Generate promotional notification
   */
  static generatePromotionalNotification(customer: Customer, promotion: {
    title: string;
    description: string;
    validUntil: Date;
    discount?: number;
  }): NotificationData {
    const customerName = `${customer.firstName} ${customer.lastName}`;
    const validUntil = promotion.validUntil.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return {
      recipient: customer.email,
      subject: promotion.title,
      content: `
        Dear ${customerName},
        
        We have a special offer just for you:
        
        ${promotion.description}
        
        ${promotion.discount ? `Enjoy ${promotion.discount}% off your next visit!` : ''}
        
        Valid until: ${validUntil}
        
        To redeem this offer, use promo code: ${customer.id.toUpperCase()}
        
        We look forward to serving you soon!
        
        Best regards,
        The Restaurant Team
      `,
      channel: 'email',
      type: 'promotion',
      customerId: customer.id,
    };
  }
  
  /**
   * Schedule reminder notifications for a reservation
   */
  static scheduleReminderNotifications(reservation: Reservation): void {
    const reservationDateTime = new Date(`${reservation.date.toISOString().split('T')[0]}T${reservation.startTime}:00`);
    
    this.REMINDER_TIMES.forEach(hoursBefore => {
      const reminderTime = new Date(reservationDateTime.getTime() - hoursBefore * 60 * 60 * 1000);
      
      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        // In a real implementation, this would use a job scheduler
        // For now, we'll just log the scheduled reminder
        console.log(`Reminder scheduled for ${hoursBefore} hours before reservation at ${reminderTime}`);
      }
    });
  }
  
  /**
   * Send multiple notifications in bulk
   */
  static async sendBulkNotifications(notifications: NotificationData[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    // Process notifications in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async notification => {
        const result = await this.sendNotification(notification);
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${notification.recipient}: ${result.error}`);
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    return results;
  }
  
  /**
   * Check if a customer has opted out of notifications
   */
  static hasOptedOut(customer: Customer, channel: 'email' | 'sms' | 'push'): boolean {
    // In a real implementation, this would check the customer's notification preferences
    // For now, we'll assume no one has opted out
    return false;
  }
  
  /**
   * Get the preferred notification channel for a customer
   */
  static getPreferredChannel(customer: Customer): 'email' | 'sms' | 'push' {
    // In a real implementation, this would check the customer's notification preferences
    // For now, we'll default to email
    return 'email';
  }
}

export default NotificationService;