// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Base Transclusion Component.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import constants from 'assets/constants';
import { BottomNavbarStatusService } from 'services/bottom-navbar-status.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';

@Component({
  selector: 'base-content',
  templateUrl: './base-content.component.html'
})
export class BaseContentComponent {
  @Input() backButtonShown: boolean;
  loadingMessage: string = '';
  mobileNavOptionsAreShown: boolean = false;
  iframed: boolean;
  DEV_MODE = constants.DEV_MODE;

  constructor(
    private windowRef: WindowRef,
    private backgroundMaskService: BackgroundMaskService,
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private keyboardShortcutService: KeyboardShortcutService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private sidebarStatusService: SidebarStatusService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    if (this.windowRef.nativeWindow.location.hostname ===
      'oppiaserver.appspot.com') {
      this.windowRef.nativeWindow.location.href = (
        'https://oppiatestserver.appspot.com' +
        this.windowRef.nativeWindow.location.pathname +
        this.windowRef.nativeWindow.location.search +
        this.windowRef.nativeWindow.location.hash);
    }
    this.iframed = this.urlService.isIframed();
    this.loaderService.onLoadingMessageChange.subscribe(
      (message: string) => this.loadingMessage = message
    );
    this.keyboardShortcutService.bindNavigationShortcuts();
  }

  isSidebarShown(): boolean {
    return this.sidebarStatusService.isSidebarShown();
  }

  isBottomNavbarShown(): boolean {
    return this.bottomNavbarStatusService.isBottomNavbarEnabled();
  }

  closeSidebarOnSwipe(): void {
    this.sidebarStatusService.closeSidebar();
  }

  toggleMobileNavOptions(): void {
    this.mobileNavOptionsAreShown = !this.mobileNavOptionsAreShown;
  }

  isBackgroundMaskActive(): boolean {
    return this.backgroundMaskService.isMaskActive();
  }

  skipToMainContent(): void {
    let mainContentElement: HTMLElement = document.getElementById(
      'oppia-main-content');

    if (!mainContentElement) {
      throw new Error('Variable mainContentElement is undefined.');
    }
    mainContentElement.tabIndex = -1;
    mainContentElement.scrollIntoView();
    mainContentElement.focus();
  }

  getHeaderText(): string {
    return this.pageTitleService.getPageTitleForMobileView();
  }

  getSubheaderText(): string {
    return this.pageTitleService.getPageSubtitleForMobileView();
  }
}

angular.module('oppia').directive('baseContent',
  downgradeComponent({ component: BaseContentComponent }));

// require('base-components/loading-message.component.ts');
// require('base-components/warnings-and-alerts.component.ts');
// require('pages/OppiaFooterDirective.ts');

// require('services/bottom-navbar-status.service.ts');
// require('services/contextual/url.service.ts');
// require('services/keyboard-shortcut.service.ts');
// require('services/page-title.service.ts');
// require('services/stateful/background-mask.service.ts');

// angular.module('oppia').directive('baseContent', [
//   function() {
//     return {
//       restrict: 'E',
//       scope: {},
//       bindToController: {
//         backButtonShown: '<'
//       },
//       transclude: {
//         breadcrumb: '?navbarBreadcrumb',
//         preLogoAction: '?navbarPreLogoAction',
//         content: 'content',
//         footer: '?pageFooter',
//         navOptions: '?navOptions',
//         mobileNavOptions: '?mobileNavOptions',
//       },
//       template: require('./base-content.directive.html'),
//       controllerAs: '$ctrl',
//       controller: ['$rootScope', '$scope', '$window', 'BackgroundMaskService',
//         'BottomNavbarStatusService', 'KeyboardShortcutService',
//         'LoaderService', 'PageTitleService', 'SidebarStatusService',
//         'UrlService',
//         function(
//             $rootScope, $scope, $window, BackgroundMaskService,
//             BottomNavbarStatusService, KeyboardShortcutService,
//             LoaderService, PageTitleService, SidebarStatusService,
//             UrlService) {
//           // Mimic redirection behaviour in the backend (see issue #7867 for
//           // details).
//           if ($window.location.hostname === 'oppiaserver.appspot.com') {
//             $window.location.href = (
//               'https://oppiatestserver.appspot.com' +
//               $window.location.pathname +
//               $window.location.search +
//               $window.location.hash);
//           }

//           $scope.getHeaderText = () => {
//             return PageTitleService.getPageTitleForMobileView();
//           };

//           $scope.getSubheaderText = () => {
//             return PageTitleService.getPageSubtitleForMobileView();
//           };

//           var ctrl = this;
//           ctrl.loadingMessage = '';
//           ctrl.mobileNavOptionsAreShown = false;
//           ctrl.isSidebarShown = () => SidebarStatusService.isSidebarShown();
//           ctrl.closeSidebarOnSwipe = () => SidebarStatusService.closeSidebar();
//           ctrl.toggleMobileNavOptions = () => {
//             ctrl.mobileNavOptionsAreShown = !ctrl.mobileNavOptionsAreShown;
//           };
//           ctrl.isBackgroundMaskActive = () => (
//             BackgroundMaskService.isMaskActive());
//           ctrl.skipToMainContent = function() {
//             var mainContentElement = document.getElementById(
//               'oppia-main-content');

//             if (!mainContentElement) {
//               throw new Error('Variable mainContentElement is undefined.');
//             }
//             mainContentElement.tabIndex = -1;
//             mainContentElement.scrollIntoView();
//             mainContentElement.focus();
//           };
//           ctrl.$onInit = function() {
//             ctrl.iframed = UrlService.isIframed();

//             ctrl.isBottomNavbarShown = () => {
//               return BottomNavbarStatusService.isBottomNavbarEnabled();
//             };

//             ctrl.DEV_MODE = $rootScope.DEV_MODE;
//             LoaderService.onLoadingMessageChange.subscribe(
//               (message: string) => this.loadingMessage = message
//             );
//           };

//           KeyboardShortcutService.bindNavigationShortcuts();
//         }
//       ]
//     };
//   }
// ]);
