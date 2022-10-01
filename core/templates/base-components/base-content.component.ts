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

import { ChangeDetectorRef, Component, Directive } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { CookieService } from 'ngx-cookie';
import { Subscription } from 'rxjs';
import { BottomNavbarStatusService } from 'services/bottom-navbar-status.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { NavigationEnd, Router } from '@angular/router';

import './base-content.component.css';


@Component({
  selector: 'oppia-base-content',
  templateUrl: './base-content.component.html'
})
export class BaseContentComponent {
  loadingMessage: string = '';
  mobileNavOptionsAreShown: boolean = false;
  iframed: boolean = false;
  DEV_MODE = AppConstants.DEV_MODE;
  COOKIE_NAME_COOKIES_ACKNOWLEDGED = 'OPPIA_COOKIES_ACKNOWLEDGED';
  ONE_YEAR_IN_MSECS = 31536000000;
  directiveSubscriptions = new Subscription();

  constructor(
    private windowRef: WindowRef,
    private backgroundMaskService: BackgroundMaskService,
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private changeDetectorRef: ChangeDetectorRef,
    private keyboardShortcutService: KeyboardShortcutService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private sidebarStatusService: SidebarStatusService,
    private urlService: UrlService,
    private cookieService: CookieService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    /**
     * Scroll to the top of the page while navigating
     * through the static pages.
     */
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
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
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe(
        (message: string) => {
          this.loadingMessage = message;
          this.changeDetectorRef.detectChanges();
        }
      ));
    this.keyboardShortcutService.bindNavigationShortcuts();

    // TODO(sll): Use 'touchstart' for mobile.
    this.windowRef.nativeWindow.document.addEventListener('click', () => {
      this.sidebarStatusService.onDocumentClick();
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  getHeaderText(): string {
    return this.pageTitleService.getNavbarTitleForMobileView();
  }

  getSubheaderText(): string {
    return this.pageTitleService.getNavbarSubtitleForMobileView();
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
    // 'getElementById' can return null if the element provided as
    // an argument is invalid.
    let mainContentElement: HTMLElement | null = document.getElementById(
      'oppia-main-content');

    if (!mainContentElement) {
      throw new Error('Variable mainContentElement is null.');
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
    // This cookie should support cross-site context so secure=true and
    // sameSite='none' is set explicitly. Not setting this can cause
    // inconsistent behaviour in different browsers in third-party contexts
    // e.g. In Firefox, the cookie is accepted with a warning when
    // sameSite='none' but secure=true is not set. For the same scenario in
    // Chrome, the cookie gets rejected.
    // See https://caniuse.com/same-site-cookie-attribute
    // See https://www.chromium.org/updates/same-site/faq
    let cookieOptions = {
      expires: new Date(currentDateInUnixTimeMsecs + this.ONE_YEAR_IN_MSECS),
      secure: true,
      sameSite: 'none' as const
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
export class BaseContentNavBarBreadCrumbDirective { }

/**
 * This directive is used as selector for nav options transclusion.
 */
@Directive({
  selector: 'nav-options'
})
export class BaseContentNavOptionsDirective { }

/**
 * This directive is used as selector for navbar pre logo action transclusion.
 */
@Directive({
  selector: 'navbar-pre-logo-action'
})
export class BaseContentNavBarPreLogoActionDirective { }


/**
 * This directive is used as selector for page footer transclusion.
 */
@Directive({
  selector: 'page-footer'
})
export class BaseContentPageFooterDirective { }

angular.module('oppia').directive('oppiaBaseContent',
  downgradeComponent({
    component: BaseContentComponent
  }) as angular.IDirectiveFactory);
