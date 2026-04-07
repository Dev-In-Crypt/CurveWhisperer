import { Alert, WhaleAlert, GraduationAlert } from '../utils/types.js';

const MAX_ALERTS = 200;

export class AlertStore {
  private alerts: Alert[] = [];

  addAlert(alert: Alert): void {
    this.alerts.push(alert);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts = this.alerts.slice(-MAX_ALERTS);
    }
  }

  getRecent(limit: number = 20): Alert[] {
    return this.alerts.slice(-limit).reverse();
  }

  getByToken(address: string, limit: number = 10): Alert[] {
    const key = address.toLowerCase();
    return this.alerts
      .filter(a => a.tokenAddress.toLowerCase() === key)
      .slice(-limit)
      .reverse();
  }

  getByType(type: 'whale' | 'graduation', limit: number = 20): Alert[] {
    return this.alerts
      .filter(a => {
        if (type === 'whale') return 'alertType' in a;
        return 'timeToGraduate' in a;
      })
      .slice(-limit)
      .reverse();
  }

  get graduationsToday(): number {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.alerts.filter(
      a => 'timeToGraduate' in a && a.timestamp >= startOfDay.getTime()
    ).length;
  }
}
