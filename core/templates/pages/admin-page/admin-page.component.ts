// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Data and component for the Oppia admin page.
 */

import { ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { AdminRouterService } from './services/admin-router.service';

@Component({
  selector: 'oppia-admin-page',
  templateUrl: './admin-page.component.html'
})
export class AdminPageComponent {
  statusMessage = '';
  inDevMode = AppConstants.DEV_MODE;
  adminPageTabChange: EventEmitter<string> = new EventEmitter();

  constructor(
    private adminRouterService: AdminRouterService,
    private changeDetectorRef: ChangeDetectorRef,
    private platformFeatureService: PlatformFeatureService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.adminRouterService.showTab(
      this.windowRef.nativeWindow.location.hash);
    this.windowRef.nativeWindow.onhashchange = () => {
      this.adminRouterService.showTab(
        this.windowRef.nativeWindow.location.hash);
    };
  }

  isActivitiesTabOpen(): boolean {
    return this.adminRouterService.isActivitiesTabOpen();
  }

  isConfigTabOpen(): boolean {
    return this.adminRouterService.isConfigTabOpen();
  }

  isFeaturesTabOpen(): boolean {
    return this.adminRouterService.isFeaturesTabOpen();
  }

  isRolesTabOpen(): boolean {
    return this.adminRouterService.isRolesTabOpen();
  }

  isMiscTabOpen(): boolean {
    return this.adminRouterService.isMiscTabOpen();
  }

  setStatusMessage(statusMessage: string): void {
    this.statusMessage = statusMessage;
    this.changeDetectorRef.detectChanges();
  }

  isDummyFeatureEnabled(): boolean {
    return this.platformFeatureService.status.DummyFeature.isEnabled;
  }
}

angular.module('oppia').directive('oppiaAdminPage',
  downgradeComponent({
    component: AdminPageComponent
  }) as angular.IDirectiveFactory);
