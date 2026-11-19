const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class TelemetryBatcher {
  private queue: Record<string, unknown>[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private batchSize = 10;
  private flushInterval = 3000; // 3 seconds

  log(activityType: string, details: Record<string, unknown> = {}, moduleId?: string, durationMs?: number) {
    this.queue.push({ activityType, details, moduleId, durationMs });
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const payload = [...this.queue];
    this.queue = [];

    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/analytics/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activities: payload })
      });
    } catch (error) {
      console.error('Failed to log batch telemetry:', error);
      // Optional: push back to queue on fail
    }
  }
}

export const telemetryBatcher = new TelemetryBatcher();

// Keep original logActivity for backwards compatibility, but map it to batcher
export const logActivity = (activityType: string, details: Record<string, unknown> = {}, moduleId?: string, durationMs?: number) => {
  telemetryBatcher.log(activityType, details, moduleId, durationMs);
};

export const getFacultyAnalytics = async () => {
  const token = sessionStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/analytics/faculty/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
};

export const getGlobalFeed = async () => {
  const token = sessionStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/analytics/faculty/feed`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch global feed');
  return res.json();
};
