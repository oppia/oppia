import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BreadcrumbItem } from './breadcrumb.component';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  breadcrumbs$: Observable<BreadcrumbItem[]> = this.breadcrumbsSubject.asObservable();

  constructor() {}

  /**
   * Sets the current breadcrumb trail
   */
  setBreadcrumbs(items: BreadcrumbItem[]): void {
    // Ensure items are sorted by level
    const sortedItems = [...items].sort((a, b) => a.level - b.level);
    this.breadcrumbsSubject.next(sortedItems);
  }

  /**
   * Clears the current breadcrumb trail
   */
  clearBreadcrumbs(): void {
    this.breadcrumbsSubject.next([]);
  }

  /**
   * Gets the current breadcrumb trail
   */
  getCurrentBreadcrumbs(): BreadcrumbItem[] {
    return this.breadcrumbsSubject.getValue();
  }

  /**
   * Updates a specific level in the breadcrumb trail
   */
  updateBreadcrumbLevel(level: number, item: Partial<BreadcrumbItem>): void {
    const current = this.getCurrentBreadcrumbs();
    const index = current.findIndex(i => i.level === level);
    
    if (index !== -1) {
      const updated = [...current];
      updated[index] = { ...updated[index], ...item };
      this.setBreadcrumbs(updated);
    }
  }
} 