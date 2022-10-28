// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * bottom navigation bar.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';


@Injectable({
  providedIn: 'root'
})
export class BottomNavbarStatusService {
  bottomNavbarIsEnabled: boolean = false;
  constructor(private windowDimensionsService: WindowDimensionsService) {}

  markBottomNavbarStatus(status: boolean): void {
    this.bottomNavbarIsEnabled = status;
  }

  isBottomNavbarEnabled(): boolean {
    return (
      this.bottomNavbarIsEnabled &&
          this.windowDimensionsService.getWidth() < 1000);
  }
}

angular.module('oppia').factory(
  'BottomNavbarStatusService', downgradeInjectable(BottomNavbarStatusService));
