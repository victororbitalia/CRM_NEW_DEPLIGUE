import AnalyticsService from './analyticsService';
import { AnalyticsFilters } from './analyticsService';

export interface RealtimeSubscription {
  id: string;
  filters: AnalyticsFilters;
  callback: (data: any) => void;
  interval?: number;
}

export interface RealtimeEvent {
  type: 'reservation_created' | 'reservation_updated' | 'reservation_cancelled' | 'table_updated';
  data: any;
  timestamp: Date;
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private eventQueue: RealtimeEvent[] = [];
  private isProcessing = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second
  private ws: WebSocket | null = null;
  private wsUrl: string;

  constructor() {
    // Determine WebSocket URL based on environment
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.wsUrl = `${protocol}//${window.location.host}/api/analytics/realtime`;
    } else {
      // Server-side fallback
      this.wsUrl = process.env.WS_URL || 'ws://localhost:3000/api/analytics/realtime';
    }
  }

  /**
   * Subscribe to real-time analytics updates
   */
  subscribe(filters: AnalyticsFilters, callback: (data: any) => void, interval?: number): string {
    const id = this.generateId();
    const subscription: RealtimeSubscription = {
      id,
      filters,
      callback,
      interval: interval || 30000, // Default 30 seconds
    };

    this.subscriptions.set(id, subscription);

    // Connect WebSocket if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    return id;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.processEventQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: any): void {
    if (data.type === 'analytics_update') {
      // Find matching subscriptions and call their callbacks
      this.subscriptions.forEach((subscription) => {
        // Check if the update matches the subscription filters
        if (this.matchesFilters(data.filters, subscription.filters)) {
          subscription.callback(data.data);
        }
      });
    } else if (data.type === 'event') {
      // Add event to queue for processing
      this.eventQueue.push({
        type: data.eventType,
        data: data.eventData,
        timestamp: new Date(),
      });

      this.processEventQueue();
    }
  }

  /**
   * Process event queue
   */
  private processEventQueue(): void {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.processEvent(event);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a single event
   */
  private processEvent(event: RealtimeEvent): void {
    // Find matching subscriptions and notify them
    this.subscriptions.forEach((subscription) => {
      subscription.callback({
        event,
        timestamp: new Date(),
      });
    });
  }

  /**
   * Check if filters match
   */
  private matchesFilters(eventFilters: any, subscriptionFilters: AnalyticsFilters): boolean {
    // Simple filter matching logic
    if (subscriptionFilters.restaurantId && eventFilters.restaurantId !== subscriptionFilters.restaurantId) {
      return false;
    }

    if (subscriptionFilters.areaId && eventFilters.areaId !== subscriptionFilters.areaId) {
      return false;
    }

    return true;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send a message through WebSocket
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  /**
   * Get connection status
   */
  get connectionStatus(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'closed';
    }
  }

  /**
   * Set up polling fallback for browsers that don't support WebSocket
   */
  setupPollingFallback(): void {
    // Check if WebSocket is supported
    if (typeof WebSocket === 'undefined') {
      console.log('WebSocket not supported, using polling fallback');
      
      // Set up polling for each subscription
      this.subscriptions.forEach((subscription) => {
        setInterval(async () => {
          try {
            const data = await AnalyticsService.getDashboardMetrics(subscription.filters);
            subscription.callback(data);
          } catch (error) {
            console.error('Error fetching analytics data:', error);
          }
        }, subscription.interval);
      });
    }
  }
}

export default new RealtimeService();