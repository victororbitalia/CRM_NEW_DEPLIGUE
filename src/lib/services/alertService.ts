import AnalyticsService from './analyticsService';
import { AnalyticsFilters } from './analyticsService';
import TrendService from './trendService';

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actionRequired?: boolean;
  recommendedActions?: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  threshold: number;
  timeWindow: number; // in minutes
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notificationChannels: string[]; // email, sms, push, webhook
  cooldownPeriod: number; // in minutes
  lastTriggered?: Date;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the alert service
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.loadDefaultRules();
    this.loadDefaultChannels();
    
    // Evaluate alerts every minute
    this.evaluationInterval = setInterval(() => {
      this.evaluateRules();
    }, 60000);
  }

  /**
   * Stop the alert service
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  /**
   * Load default alert rules
   */
  private loadDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_cancellation_rate',
        name: 'High Cancellation Rate',
        description: 'Alert when cancellation rate exceeds 20%',
        metric: 'cancellationRate',
        condition: 'greater_than',
        threshold: 20,
        timeWindow: 60,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
        cooldownPeriod: 30,
      },
      {
        id: 'low_occupancy_rate',
        name: 'Low Occupancy Rate',
        description: 'Alert when occupancy rate drops below 40%',
        metric: 'occupancyRate',
        condition: 'less_than',
        threshold: 40,
        timeWindow: 30,
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email'],
        cooldownPeriod: 60,
      },
      {
        id: 'no_show_spike',
        name: 'No-Show Spike',
        description: 'Alert when no-show rate increases by 50% compared to previous period',
        metric: 'noShowRate',
        condition: 'percentage_change',
        threshold: 50,
        timeWindow: 120,
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'sms'],
        cooldownPeriod: 15,
      },
      {
        id: 'revenue_decline',
        name: 'Revenue Decline',
        description: 'Alert when revenue declines by 25% compared to previous period',
        metric: 'totalRevenue',
        condition: 'percentage_change',
        threshold: -25,
        timeWindow: 1440, // 24 hours
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email'],
        cooldownPeriod: 120,
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Load default notification channels
   */
  private loadDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'default_email',
        name: 'Default Email',
        type: 'email',
        config: {
          recipients: ['manager@restaurant.com'],
          template: 'alert',
        },
        enabled: true,
      },
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateRules(): Promise<void> {
    if (!this.isRunning) return;

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      
      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceLastTriggered = (new Date().getTime() - rule.lastTriggered.getTime()) / 60000;
        if (timeSinceLastTriggered < rule.cooldownPeriod) continue;
      }

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Get current metrics
    const filters: AnalyticsFilters = {
      startDate: new Date(Date.now() - rule.timeWindow * 60000),
      endDate: new Date(),
    };

    const metrics = await AnalyticsService.getDashboardMetrics(filters);
    
    // Extract the metric value from the response
    let currentValue: number;
    if (rule.metric in metrics.summary) {
      currentValue = metrics.summary[rule.metric as keyof typeof metrics.summary] as unknown as number;
    } else {
      return; // Skip if metric not found
    }
    
    if (currentValue === undefined || currentValue === null) return;

    let isTriggered = false;

    switch (rule.condition) {
      case 'greater_than':
        isTriggered = currentValue > rule.threshold;
        break;
      case 'less_than':
        isTriggered = currentValue < rule.threshold;
        break;
      case 'equals':
        isTriggered = currentValue === rule.threshold;
        break;
      case 'not_equals':
        isTriggered = currentValue !== rule.threshold;
        break;
      case 'percentage_change':
        // For percentage change, we need to compare with previous period
        const previousFilters: AnalyticsFilters = {
          startDate: new Date(Date.now() - (rule.timeWindow * 2) * 60000),
          endDate: new Date(Date.now() - rule.timeWindow * 60000),
        };
        const previousMetrics = await AnalyticsService.getDashboardMetrics(previousFilters);
        
        // Extract the metric value from the response
        let previousValue: number;
        if (rule.metric in previousMetrics.summary) {
          previousValue = previousMetrics.summary[rule.metric as keyof typeof previousMetrics.summary] as unknown as number;
        } else {
          return; // Skip if metric not found
        }
        
        if (previousValue && previousValue !== 0) {
          const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
          isTriggered = rule.threshold > 0 
            ? percentageChange > rule.threshold
            : percentageChange < rule.threshold;
        }
        break;
    }

    if (isTriggered) {
      await this.triggerAlert(rule, currentValue);
      rule.lastTriggered = new Date();
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alertId = this.generateId();
    const alert: Alert = {
      id: alertId,
      type: rule.severity === 'critical' ? 'critical' : rule.severity === 'warning' ? 'warning' : 'info',
      title: rule.name,
      message: this.generateAlertMessage(rule, currentValue),
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      actionRequired: rule.severity === 'critical',
      recommendedActions: this.generateRecommendedActions(rule, currentValue),
    };

    this.alerts.set(alertId, alert);

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    switch (rule.metric) {
      case 'cancellationRate':
        return `Cancellation rate is ${currentValue.toFixed(1)}%, which exceeds the threshold of ${rule.threshold}%.`;
      case 'occupancyRate':
        return `Occupancy rate is ${currentValue.toFixed(1)}%, which is below the threshold of ${rule.threshold}%.`;
      case 'noShowRate':
        return `No-show rate has changed significantly compared to the previous period.`;
      case 'totalRevenue':
        return `Revenue has declined by ${Math.abs(currentValue).toFixed(1)}% compared to the previous period.`;
      default:
        return `Metric ${rule.metric} has value ${currentValue}, which exceeds the threshold of ${rule.threshold}.`;
    }
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(rule: AlertRule, currentValue: number): string[] {
    switch (rule.metric) {
      case 'cancellationRate':
        return [
          'Review cancellation reasons and address common issues',
          'Implement confirmation reminders',
          'Consider reducing deposit requirements for frequent cancellers',
        ];
      case 'occupancyRate':
        return [
          'Run promotions for low-traffic periods',
          'Review pricing and availability',
          'Implement targeted marketing campaigns',
        ];
      case 'noShowRate':
        return [
          'Increase deposit requirements',
          'Implement reminder system',
          'Review customer history for repeat no-shows',
        ];
      case 'totalRevenue':
        return [
          'Review menu pricing and offerings',
          'Analyze customer spending patterns',
          'Implement upselling strategies',
        ];
      default:
        return ['Investigate the underlying cause of this alert'];
    }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        console.error(`Error sending notification via channel ${channelId}:`, error);
      }
    }
  }

  /**
   * Send a notification via a specific channel
   */
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(alert, channel);
        break;
      case 'sms':
        await this.sendSMSNotification(alert, channel);
        break;
      case 'push':
        await this.sendPushNotification(alert, channel);
        break;
      case 'webhook':
        await this.sendWebhookNotification(alert, channel);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // This would integrate with an email service
    console.log(`Sending email notification for alert ${alert.id}:`, alert.message);
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // This would integrate with an SMS service
    console.log(`Sending SMS notification for alert ${alert.id}:`, alert.message);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // This would integrate with a push notification service
    console.log(`Sending push notification for alert ${alert.id}:`, alert.message);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // This would send a POST request to a webhook URL
    console.log(`Sending webhook notification for alert ${alert.id}:`, alert.message);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Add a custom alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Update an alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  /**
   * Delete an alert rule
   */
  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Add a notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  /**
   * Update a notification channel
   */
  updateChannel(channelId: string, updates: Partial<NotificationChannel>): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      this.channels.set(channelId, { ...channel, ...updates });
    }
  }

  /**
   * Delete a notification channel
   */
  deleteChannel(channelId: string): void {
    this.channels.delete(channelId);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export default new AlertService();