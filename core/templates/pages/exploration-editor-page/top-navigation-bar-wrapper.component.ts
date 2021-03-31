import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SidebarStatusService } from 'services/sidebar-status.service';

@Component({
  selector: 'top-navigation-wrapper',
  template: '<top-navigation-bar [toggle]="this.toggleSidebar.bind(this)">' +
  '</top-navigation-bar>'
})
export class TopNavigationBarWrapperComponent {
  constructor(
    private sidebarStatusService: SidebarStatusService
  ) {}

  toggleSidebar(): void {
    this.sidebarStatusService.toggleSidebar();
  }
}

angular.module('oppia').directive('topNavigationWrapper',
  downgradeComponent({ component: TopNavigationBarWrapperComponent }));
