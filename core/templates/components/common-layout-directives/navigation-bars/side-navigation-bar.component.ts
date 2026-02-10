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
 * @fileoverview Component for the side navigation bar.
 */

import {Component, Input} from '@angular/core';
import {AppConstants} from 'app.constants';
import {NavbarAndFooterGATrackingPages} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {SidebarStatusService} from 'services/sidebar-status.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-side-navigation-bar',
  templateUrl: './side-navigation-bar.component.html',
})
export class SideNavigationBarComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() display!: boolean;

  impactReports = [
    {
      link: AppConstants.IMPACT_REPORT_LINK_2023,
      year: '2023',
    },
    {
      link: AppConstants.IMPACT_REPORT_LINK_2022,
      year: '2022',
    },
  ];
  currentUrl!: string;
  classroomData: CreatorTopicSummary[] = [];
  topicTitlesTranslationKeys: string[] = [];
  getinvolvedSubmenuIsShown: boolean = false;
  learnSubmenuIsShown: boolean = true;
  aboutSubmenuIsShown: boolean = false;
  impactReportSubmenuIsShown: boolean = false;
  userIsLoggedIn!: boolean;

  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private siteAnalyticsService: SiteAnalyticsService,
    private userService: UserService,
    private sidebarStatusService: SidebarStatusService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    this.currentUrl = this.windowRef.nativeWindow.location.pathname;

    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
  }

  navigateToDefaultDashboard(): void {
    this.userService
      .getUserPreferredDashboardAsync()
      .then(preferredDashboard => {
        if (this.currentUrl === '/' + preferredDashboard + '-dashboard') {
          this.sidebarStatusService.closeSidebar();
          return;
        }
        this.windowRef.nativeWindow.location.href = '/';
      });
  }

  stopclickfurther(event: Event): void {
    event.stopPropagation();
  }

  closeSidebarOnSwipeleft(): void {
    this.sidebarStatusService.closeSidebar();
  }

  togglelearnSubmenu(): void {
    this.learnSubmenuIsShown = !this.learnSubmenuIsShown;
  }

  togglegetinvolvedSubmenu(): void {
    this.getinvolvedSubmenuIsShown = !this.getinvolvedSubmenuIsShown;
  }

  toggleAboutSubmenu(): void {
    this.aboutSubmenuIsShown = !this.aboutSubmenuIsShown;
  }

  toggleImpactReportSubmenu(): void {
    this.impactReportSubmenuIsShown = !this.impactReportSubmenuIsShown;
  }

  isHackyTopicTitleTranslationDisplayed(index: number): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.topicTitlesTranslationKeys[index]
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  navigateToAboutPage(): void {
    this.siteAnalyticsService.registerClickNavbarButtonEvent(
      NavbarAndFooterGATrackingPages.ABOUT
    );
    this.windowRef.nativeWindow.location.href = '/about';
  }

  navigateToVolunteerPage(): void {
    this.siteAnalyticsService.registerClickNavbarButtonEvent(
      NavbarAndFooterGATrackingPages.VOLUNTEER
    );
    this.windowRef.nativeWindow.location.href = '/volunteer';
  }

  navigateToTeachPage(): void {
    this.siteAnalyticsService.registerClickNavbarButtonEvent(
      NavbarAndFooterGATrackingPages.TEACH
    );
    this.windowRef.nativeWindow.location.href = '/teach';
  }
}
