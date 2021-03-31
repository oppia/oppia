import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SidebarStatusService } from 'services/sidebar-status.service';

@Component({
  selector: 'side-navigation-bar-wrapper',
  template: '<side-navigation-bar [display]="isSidebarShown()">' +
  '<side-navigation-bar>'
})
export class SideNavigationBarWrapperComponent {
  constructor(
    private sidebarStatusService: SidebarStatusService
  ) {}

  isSidebarShown(): boolean {
    return this.sidebarStatusService.isSidebarShown();
  }
}

angular.module('oppia').directive('sideNavigationBarWrapper',
  downgradeComponent({ component: SideNavigationBarWrapperComponent }));
