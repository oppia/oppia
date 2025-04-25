import { Component, Input, OnInit } from '@angular/core';
import { WindowRef } from 'services/contextual/window-ref.service';

export interface BreadcrumbItem {
  label: string;
  url: string;
  level: number;
}

@Component({
  selector: 'oppia-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  @Input() items: BreadcrumbItem[] = [];
  isMobile: boolean = false;

  constructor(private windowRef: WindowRef) {}

  ngOnInit(): void {
    // Check if we're on mobile
    this.isMobile = this.windowRef.nativeWindow.innerWidth < 768;

    // Listen for window resize events
    this.windowRef.nativeWindow.addEventListener('resize', () => {
      this.isMobile = this.windowRef.nativeWindow.innerWidth < 768;
    });
  }

  /**
   * Returns the items to display based on device type.
   * For mobile, only returns the immediate parent (last item).
   * For desktop, returns up to 3 levels.
   */
  getDisplayItems(): BreadcrumbItem[] {
    if (this.isMobile) {
      // On mobile, only show the immediate parent
      return this.items.length > 0 ? [this.items[this.items.length - 2]] : [];
    }
    // On desktop, show up to 3 levels
    return this.items.slice(-3);
  }
} 