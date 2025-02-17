import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClickTrackerService {
  private clickHistory: string[] = [];
  private readonly maxLength = 50;

  constructor() {
    document.addEventListener('click', event => this.trackClick(event));
  }

  trackClick(event: Event): void {
    try {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Checking for .e2e-* class
      const e2eClass = Array.from(target.classList).find(cls =>
        cls.startsWith('e2e-')
      );
      if (e2eClass) {
        this.clickHistory.push(e2eClass);

        // Checking for maximum length and size constraints
        let clickDataSize = new Blob([JSON.stringify(this.clickHistory)]).size;
        while (
          (this.clickHistory.length > this.maxLength ||
            clickDataSize > 16 * 1024) &&
          this.clickHistory.length > 0
        ) {
          this.clickHistory.shift();
          clickDataSize = new Blob([JSON.stringify(this.clickHistory)]).size;
        }
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  getClickHistory(): string[] {
    return this.clickHistory;
  }
}
