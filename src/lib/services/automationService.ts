import { Reservation, WaitlistEntry, Customer } from '@/hooks';
import { ReservationService } from './reservationService';
import { NotificationService } from './notificationService';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'reservation_created' | 'reservation_confirmed' | 'reservation_cancelled' | 'no_show' | 'waitlist_added' | 'time_based';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  isActive: boolean;
  priority: number;
}

export interface TimeBasedTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // Cron expression
  action: () => Promise<void>;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class AutomationService {
  private static automationRules: AutomationRule[] = [
    {
      id: 'auto-confirm',
      name: 'Auto-confirm small reservations',
      description: 'Automatically confirm reservations for small parties during off-peak hours',
      trigger: 'reservation_created',
      conditions: {
        partySize: { lessThan: 4 },
        timeSlot: { in: ['12:00-14:00', '22:00-23:00'] },
        dayOfWeek: { in: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'] },
      },
      actions: {
        confirmReservation: true,
        sendConfirmation: true,
      },
      isActive: true,
      priority: 5,
    },
    {
      id: 'waitlist-reminder',
      name: 'Waitlist reminder',
      description: 'Send reminder to waitlist customers when a table becomes available',
      trigger: 'waitlist_added',
      conditions: {
        priority: { greaterThan: 3 },
      },
      actions: {
        sendWaitlistNotification: true,
      },
      isActive: true,
      priority: 3,
    },
    {
      id: 'no-show-followup',
      name: 'No-show follow-up',
      description: 'Follow up with customers who miss their reservations',
      trigger: 'no_show',
      conditions: {
        customerHistory: { noShowRate: { lessThan: 20 } },
      },
      actions: {
        sendFollowUpEmail: true,
        offerDiscount: true,
      },
      isActive: true,
      priority: 2,
    },
    {
      id: 'vip-recognition',
      name: 'VIP recognition',
      description: 'Recognize and reward VIP customers',
      trigger: 'reservation_created',
      conditions: {
        customer: { isVip: true },
      },
      actions: {
        prioritizeReservation: true,
        sendVipNotification: true,
      },
      isActive: true,
      priority: 10,
    },
  ];
  
  private static timeBasedTasks: TimeBasedTask[] = [
    {
      id: 'process-expired-waitlist',
      name: 'Process expired waitlist entries',
      description: 'Mark expired waitlist entries as expired',
      schedule: '0 */6 * * *', // Every 6 hours
      action: async () => {
        // This would be implemented with the waitlist hook
        console.log('Processing expired waitlist entries');
      },
      isActive: true,
    },
    {
      id: 'send-reminders',
      name: 'Send reservation reminders',
      description: 'Send reminder emails for upcoming reservations',
      schedule: '0 9,17 * * *', // 9 AM and 5 PM
      action: async () => {
        // This would fetch upcoming reservations and send reminders
        console.log('Sending reservation reminders');
      },
      isActive: true,
    },
    {
      id: 'generate-reports',
      name: 'Generate daily reports',
      description: 'Generate daily reservation and customer reports',
      schedule: '0 1 * * *', // 1 AM
      action: async () => {
        // This would generate and send daily reports
        console.log('Generating daily reports');
      },
      isActive: true,
    },
  ];
  
  /**
   * Process automation rules for a trigger event
   */
  static async processAutomationRules(
    trigger: string,
    data: any,
    relatedData?: any
  ): Promise<void> {
    try {
      // Get rules that match the trigger and are active
      const matchingRules = this.automationRules.filter(
        rule => rule.trigger === trigger && rule.isActive
      );
      
      // Sort by priority (highest first)
      matchingRules.sort((a, b) => b.priority - a.priority);
      
      // Process each rule
      for (const rule of matchingRules) {
        // Check if conditions are met
        if (this.evaluateConditions(rule.conditions, data, relatedData)) {
          // Execute actions
          await this.executeActions(rule.actions, data, relatedData);
        }
      }
    } catch (error) {
      console.error('Error processing automation rules:', error);
    }
  }
  
  /**
   * Evaluate conditions for an automation rule
   */
  private static evaluateConditions(
    conditions: Record<string, any>,
    data: any,
    relatedData?: any
  ): boolean {
    // This is a simplified implementation
    // In a real application, this would be more sophisticated
    
    for (const [key, condition] of Object.entries(conditions)) {
      let value;
      
      // Get the value from data or relatedData
      if (key.includes('.')) {
        const keys = key.split('.');
        value = keys.reduce((obj, k) => obj?.[k], { ...data, ...relatedData });
      } else {
        value = data[key] || relatedData?.[key];
      }
      
      // Evaluate the condition
      if (!this.evaluateCondition(value, condition)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(value: any, condition: any): boolean {
    if (typeof condition === 'object' && condition !== null) {
      for (const [operator, operand] of Object.entries(condition)) {
        switch (operator) {
          case 'equals':
            return value === operand;
          case 'notEquals':
            return value !== operand;
          case 'greaterThan':
            return Number(value) > Number(operand);
          case 'lessThan':
            return Number(value) < Number(operand);
          case 'greaterThanOrEqual':
            return Number(value) >= Number(operand);
          case 'lessThanOrEqual':
            return Number(value) <= Number(operand);
          case 'in':
            return Array.isArray(operand) && operand.includes(value);
          case 'notIn':
            return Array.isArray(operand) && !operand.includes(value);
          case 'contains':
            return typeof value === 'string' && value.includes(String(operand));
          default:
            return false;
        }
      }
    }
    
    return value === condition;
  }
  
  /**
   * Execute actions for an automation rule
   */
  private static async executeActions(
    actions: Record<string, any>,
    data: any,
    relatedData?: any
  ): Promise<void> {
    for (const [action, params] of Object.entries(actions)) {
      switch (action) {
        case 'confirmReservation':
          if (data.id && params) {
            // This would use the reservation hook to confirm the reservation
            console.log(`Auto-confirming reservation ${data.id}`);
          }
          break;
          
        case 'sendConfirmation':
          if (data && params) {
            const notification = NotificationService.generateConfirmationNotification(data);
            await NotificationService.sendNotification(notification);
          }
          break;
          
        case 'sendWaitlistNotification':
          if (data && relatedData?.time && relatedData?.date) {
            const notification = NotificationService.generateWaitlistNotification(
              data,
              relatedData.time,
              relatedData.date
            );
            await NotificationService.sendNotification(notification);
          }
          break;
          
        case 'sendFollowUpEmail':
          if (data.customerId && params) {
            // This would generate and send a follow-up email
            console.log(`Sending follow-up email to customer ${data.customerId}`);
          }
          break;
          
        case 'offerDiscount':
          if (data.customerId && params) {
            // This would generate and send a discount offer
            console.log(`Offering discount to customer ${data.customerId}`);
          }
          break;
          
        case 'prioritizeReservation':
          if (data.id && params) {
            // This would prioritize the reservation
            console.log(`Prioritizing reservation ${data.id}`);
          }
          break;
          
        case 'sendVipNotification':
          if (data.customerId && params) {
            // This would send a VIP notification
            console.log(`Sending VIP notification to customer ${data.customerId}`);
          }
          break;
          
        default:
          console.log(`Unknown action: ${action}`);
      }
    }
  }
  
  /**
   * Register a new automation rule
   */
  static registerAutomationRule(rule: AutomationRule): void {
    this.automationRules.push(rule);
  }
  
  /**
   * Update an existing automation rule
   */
  static updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    const index = this.automationRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.automationRules[index] = { ...this.automationRules[index], ...updates };
      return true;
    }
    return false;
  }
  
  /**
   * Delete an automation rule
   */
  static deleteAutomationRule(ruleId: string): boolean {
    const index = this.automationRules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.automationRules.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Get all automation rules
   */
  static getAutomationRules(): AutomationRule[] {
    return [...this.automationRules];
  }
  
  /**
   * Get active automation rules
   */
  static getActiveAutomationRules(): AutomationRule[] {
    return this.automationRules.filter(rule => rule.isActive);
  }
  
  /**
   * Register a new time-based task
   */
  static registerTimeBasedTask(task: TimeBasedTask): void {
    this.timeBasedTasks.push(task);
  }
  
  /**
   * Get all time-based tasks
   */
  static getTimeBasedTasks(): TimeBasedTask[] {
    return [...this.timeBasedTasks];
  }
  
  /**
   * Get active time-based tasks
   */
  static getActiveTimeBasedTasks(): TimeBasedTask[] {
    return this.timeBasedTasks.filter(task => task.isActive);
  }
  
  /**
   * Execute a time-based task
   */
  static async executeTimeBasedTask(taskId: string): Promise<void> {
    const task = this.timeBasedTasks.find(t => t.id === taskId);
    if (task && task.isActive) {
      try {
        await task.action();
        task.lastRun = new Date();
        console.log(`Executed time-based task: ${task.name}`);
      } catch (error) {
        console.error(`Error executing time-based task ${task.name}:`, error);
      }
    }
  }
  
  /**
   * Process time-based tasks that are due to run
   */
  static async processDueTimeBasedTasks(): Promise<void> {
    const now = new Date();
    
    for (const task of this.timeBasedTasks) {
      if (task.isActive && task.nextRun && task.nextRun <= now) {
        await this.executeTimeBasedTask(task.id);
        
        // Calculate next run time (simplified implementation)
        // In a real application, this would use a cron parser
        task.nextRun = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
      }
    }
  }
}

export default AutomationService;