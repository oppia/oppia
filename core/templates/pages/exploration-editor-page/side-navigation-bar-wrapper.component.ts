// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for usage of side-navigation-bar
 * directly in *mainpage.html files
 *
 * Note developers: This wrapper component can be removed after migration
 * of top navigation bar directive is complete
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SidebarStatusService } from 'services/sidebar-status.service';

@Component({
  selector: 'oppia-side-navigation-bar-wrapper',
  template: '<oppia-side-navigation-bar [display]="isSidebarShown()">' +
  '<oppia-side-navigation-bar>'
})
export class SideNavigationBarWrapperComponent {
  constructor(
    private sidebarStatusService: SidebarStatusService
  ) {}

  isSidebarShown(): boolean {
    return this.sidebarStatusService.isSidebarShown();
  }
}

angular.module('oppia').directive('oppiaSideNavigationBarWrapper',
  downgradeComponent({
    component: SideNavigationBarWrapperComponent
  }) as angular.IDirectiveFactory);
