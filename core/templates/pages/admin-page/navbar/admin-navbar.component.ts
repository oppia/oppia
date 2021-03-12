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
 * @fileoverview Component for the navigation bar in the admin panel.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { AdminRouterService } from 'pages/admin-page/services/admin-router.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';
import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';
import { AppConstants } from 'app.constants';

// angular.module('oppia').directive('adminNavbar', [
//   'AdminRouterService', 'UrlInterpolationService', 'ADMIN_TAB_URLS',
//   'LOGOUT_URL', 'PROFILE_URL_TEMPLATE',
//   function(
//       AdminRouterService, UrlInterpolationService, ADMIN_TAB_URLS,
//       LOGOUT_URL, PROFILE_URL_TEMPLATE) {
//     return {
//       restrict: 'E',
//       scope: {},
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/pages/admin-page/navbar/admin-navbar.directive.html'),
//       controllerAs: '$ctrl',
//       controller: ['$rootScope', 'UserService',
//         function($rootScope, UserService) {
//           var ctrl = this;
//           ctrl.isActivitiesTabOpen = function() {
//             return AdminRouterService.isActivitiesTabOpen();
//           };
//           ctrl.isJobsTabOpen = function() {
//             return AdminRouterService.isJobsTabOpen();
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
//           ctrl.activateProfileDropdown = function() {
//             return ctrl.profileDropdownIsActive = true;
//           };
//           ctrl.deactivateProfileDropdown = function() {
//             return ctrl.profileDropdownIsActive = false;
//           };
//           ctrl.activateDropdownMenu = function() {
//             return ctrl.dropdownMenuisActive = true;
//           };
//           ctrl.deactivateDropdownMenu = function() {
//             return ctrl.dropdownMenuisActive = false;
//           };
//           ctrl.$onInit = function() {
//             ctrl.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
//             UserService.getProfileImageDataUrlAsync().then(
//               function(dataUrl) {
//                 ctrl.profilePictureDataUrl = dataUrl;
//                 // TODO(#8521): Remove the use of $rootScope.$apply()
//                 // once the controller is migrated to angular.
//                 $rootScope.$applyAsync();
//               });

//             ctrl.getStaticImageUrl = function(imagePath) {
//               return UrlInterpolationService.getStaticImageUrl(imagePath);
//             };

//             ctrl.username = '';
//             ctrl.isModerator = null;
//             ctrl.isSuperAdmin = null;
//             ctrl.profileUrl = '';
//             UserService.getUserInfoAsync().then(function(userInfo) {
//               ctrl.username = userInfo.getUsername();
//               ctrl.isModerator = userInfo.isModerator();
//               ctrl.isSuperAdmin = userInfo.isSuperAdmin();

//               ctrl.profileUrl = (
//                 UrlInterpolationService.interpolateUrl(PROFILE_URL_TEMPLATE, {
//                   username: ctrl.username
//                 })
//               );
//               // TODO(#8521): Remove the use of $rootScope.$apply()
//               // once the controller is migrated to angular.
//               $rootScope.$applyAsync();
//             });

//             ctrl.logoutUrl = LOGOUT_URL;

//             ctrl.profileDropdownIsActive = false;
//             ctrl.dropdownMenuisActive = false;
//           };
//         }]
//     };
//   }
// ]);

@Component({
  selector: 'admin-navbar',
  templateUrl: './admin-navbar.component.html',
  styleUrls: []
})
export class AdminNavbarComponent implements OnInit {
  profilePictureDataUrl: string = '';
  imagePath: string;
  username: string = '';
  isModerator: boolean = null;
  isSuperAdmin: boolean = null;
  profileUrl: string = '';
  ADMIN_TAB_URLS = AdminPageConstants.ADMIN_TAB_URLS;
  logoutUrl = AppConstants.LOGOUT_URL;
  profileDropdownIsActive = false;
  dropdownMenuIsActive = false;

  constructor(
    private adminRouterService: AdminRouterService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private domSanitizer: DomSanitizer
  ) {}

  getStaticImageUrl(imagePath: string) {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  };

  isActivitiesTabOpen() {
    return this.adminRouterService.isActivitiesTabOpen();
  };

  isJobsTabOpen() {
    return this.adminRouterService.isJobsTabOpen();
  };

  isConfigTabOpen() {
    return this.adminRouterService.isConfigTabOpen();
  };

  isFeaturesTabOpen() {
    return this.adminRouterService.isFeaturesTabOpen();
  };

  isRolesTabOpen() {
    return this.adminRouterService.isRolesTabOpen();
  };

  isMiscTabOpen() {
    return this.adminRouterService.isMiscTabOpen();
  };

  activateProfileDropdown() {
    return this.profileDropdownIsActive = true;
  };

  deactivateProfileDropdown() {
    return this.profileDropdownIsActive = false;
  };

  activateDropdownMenu() {
    return this.dropdownMenuIsActive = true;
  };

  deactivateDropdownMenu() {
    return this.dropdownMenuIsActive = false;
  };

  sanitizeImageUrl(imageUrl: string): SafeUrl {
    return this.domSanitizer.bypassSecurityTrustUrl(imageUrl);
  }

  async getProfileImageDataAsync(): Promise<void> {
    let dataUrl = await this.userService.getProfileImageDataUrlAsync();
    this.profilePictureDataUrl = dataUrl;
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();
    this.isModerator = userInfo.isModerator();
    this.isSuperAdmin = userInfo.isSuperAdmin();

    this.profileUrl = (
      this.urlInterpolationService.interpolateUrl(AdminPageConstants.PROFILE_URL_TEMPLATE, {
        username: this.username
      })
    );
  }

  ngOnInit() {
    console.log(this.logoutUrl)
    this.getProfileImageDataAsync();
    this.getUserInfoAsync();
  }

}

angular.module('oppia').directive(
  'adminNavbar', downgradeComponent(
    {component: AdminNavbarComponent}));