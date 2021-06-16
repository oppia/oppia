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

import { Component, EventEmitter } from '@angular/core';
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
  }

  isDummyFeatureEnabled(): boolean {
    return this.platformFeatureService.status.DummyFeature.isEnabled;
  }
}

angular.module('oppia').directive('oppiaAdminPage',
  downgradeComponent({
    component: AdminPageComponent
  }) as angular.IDirectiveFactory);


//   'UrlInterpolationService', function(UrlInterpolationService) {
//     return {
//       restrict: 'E',
//       scope: {},
//       bindToController: {},
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/pages/admin-page/admin-page.directive.html'),
//       controllerAs: '$ctrl',
//       controller: [
//         '$location', '$rootScope', '$scope',
//         'AdminRouterService', 'CsrfTokenService', 'PlatformFeatureService',
//         'DEV_MODE',
//         function(
//             $location, $rootScope, $scope,
//             AdminRouterService, CsrfTokenService, PlatformFeatureService,
//             DEV_MODE) {
//           var ctrl = this;
//           ctrl.isActivitiesTabOpen = function() {
//             return AdminRouterService.isActivitiesTabOpen();
//           };
//           ctrl.isConfigTabOpen = function() {
//             return AdminRouterService.isConfigTabOpen();
//           };
//           ctrl.isFeaturesTabOpen = function() {
//             return AdminRouterService.isFeaturesTabOpen();
//           };
//           ctrl.isRolesTabOpen = function() {
//             return AdminRouterService.isRolesTabOpen();
//           };
//           ctrl.isMiscTabOpen = function() {
//             return AdminRouterService.isMiscTabOpen();
//           };
//           ctrl.setStatusMessage = function(statusMessage) {
//             ctrl.statusMessage = statusMessage;
//             // TODO(#8521): Remove the use of $rootScope.$apply()
//             // once the directive is migrated to angular.
//             $rootScope.$applyAsync();
//           };

//           ctrl.isDummyFeatureEnabled = function() {
//             return PlatformFeatureService.status.DummyFeature.isEnabled;
//           };

//           ctrl.$onInit = function() {
//             $scope.$on('$locationChangeSuccess', function() {
//               AdminRouterService.showTab($location.path().replace('/', '#'));
//             });
//             ctrl.inDevMode = DEV_MODE;
//             ctrl.statusMessage = '';
//             CsrfTokenService.initializeToken();
//           };
//         }
//       ]
//     };
//   }
// ]);
