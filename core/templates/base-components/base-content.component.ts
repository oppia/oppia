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

import { Component, Directive } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { CookieService } from 'ngx-cookie';
import { BottomNavbarStatusService } from 'services/bottom-navbar-status.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';

@Component({
  selector: 'oppia-base-content',
  templateUrl: './base-content.component.html'
})
export class BaseContentComponent {
  loadingMessage: string = '';
  mobileNavOptionsAreShown: boolean = false;
  iframed: boolean;
  DEV_MODE = AppConstants.DEV_MODE;
  COOKIE_NAME_COOKIES_ACKNOWLEDGED = 'OPPIA_COOKIES_ACKNOWLEDGED';
  ONE_YEAR_IN_MSECS = 31536000000;

  constructor(
    private windowRef: WindowRef,
    private backgroundMaskService: BackgroundMaskService,
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private keyboardShortcutService: KeyboardShortcutService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private sidebarStatusService: SidebarStatusService,
    private urlService: UrlService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    /**
     * Redirect any developers using the old appspot URL to the
     * test server (see issue #7867 for details).
     */
    if (this.isMainProdServer()) {
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

    // TODO(sll): Use 'touchstart' for mobile.
    this.windowRef.nativeWindow.document.addEventListener('click', () => {
      this.sidebarStatusService.onDocumentClick();
    });
  }

  getHeaderText(): string {
    return this.pageTitleService.getPageTitleForMobileView();
  }

  getSubheaderText(): string {
    return this.pageTitleService.getPageSubtitleForMobileView();
  }

  isMainProdServer(): boolean {
    return this.windowRef.nativeWindow.location.hostname ===
      'oppiaserver.appspot.com';
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

  hasAcknowledgedCookies(): boolean {
    let cookieSetDateMsecs = this.cookieService.get(
      this.COOKIE_NAME_COOKIES_ACKNOWLEDGED);
    return (
      !!cookieSetDateMsecs &&
      Number(cookieSetDateMsecs) > AppConstants.COOKIE_POLICY_LAST_UPDATED_MSECS
    );
  }

  acknowledgeCookies(): void {
    let currentDateInUnixTimeMsecs = new Date().valueOf();
    let cookieOptions = {
      expires: new Date(currentDateInUnixTimeMsecs + this.ONE_YEAR_IN_MSECS)
    };
    this.cookieService.put(
      this.COOKIE_NAME_COOKIES_ACKNOWLEDGED, String(currentDateInUnixTimeMsecs),
      cookieOptions);
  }
}

/**
 * This directive is used as selector for navbar breadcrumb transclusion.
 */
@Directive({
  selector: 'navbar-breadcrumb'
})
export class BaseContentNavBarBreadCrumbDirective {}


/**
 * This directive is used as selector for page footer transclusion.
 */
@Directive({
  selector: 'page-footer'
})
export class BaseContentPageFooterDirective {}

angular.module('oppia').directive('oppiaBaseContent',
  downgradeComponent({
    component: BaseContentComponent
  }) as angular.IDirectiveFactory);
