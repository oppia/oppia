// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for maintaining the open/closed status of the
 * hamburger-menu sidebar.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarStatusService {
  constructor(private wds: WindowDimensionsService) {}

  private sidebarIsShown: boolean = false;
  private hamburgerIconClicked: boolean = false;

  private _openSidebar(): void {
    if (this.wds.isWindowNarrow() && !this.sidebarIsShown) {
      this.sidebarIsShown = true;
    }
  }

  private _closeSidebar(): void {
    if (this.sidebarIsShown) {
      this.sidebarIsShown = false;
    }
  }

  isSidebarShown(): boolean {
    return this.sidebarIsShown;
  }

  openSidebar(): void {
    this._openSidebar();
  }

  closeSidebar(): void {
    this._closeSidebar();
  }

  toggleHamburgerIconStatus(event: Event): void {
    if (!this.hamburgerIconClicked) {
      this.hamburgerIconClicked = true;
      event.stopPropagation();
    } else {
      this.hamburgerIconClicked = false;
    }
  }

  isHamburgerIconclicked(): boolean {
    return this.hamburgerIconClicked;
  }

  toggleSidebar(): void {
    if (!this.sidebarIsShown) {
      this._openSidebar();
    } else {
      this._closeSidebar();
    }
  }

  onDocumentClick(): void {
    if (this.hamburgerIconClicked) {
      this.sidebarIsShown = false;
      this.hamburgerIconClicked = false;
    }
  }
}

angular.module('oppia').factory(
  'SidebarStatusService', downgradeInjectable(SidebarStatusService));
