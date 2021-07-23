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
 * @fileoverview Component for the stewards landing page.
 */

import { Component } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';

interface ButtonDefinition {
  text: string;
  href: string;
}

@Component({
  selector: 'oppia-stewards-landing-page',
  templateUrl: './stewards-landing-page.component.html'
})
export class StewardsLandingPageComponent {
  buttonDefinitions: ButtonDefinition[];
  TAB_NAME_PARENTS = 'Parents';
  TAB_NAME_TEACHERS = 'Teachers';
  TAB_NAME_NONPROFITS = 'NGOs';
  TAB_NAME_VOLUNTEERS = 'Volunteers';
  activeTabName = this.TAB_NAME_PARENTS;
  URL_PATTERNS_TO_TAB_NAMES = {
    '/parents': this.TAB_NAME_PARENTS,
    '/teachers': this.TAB_NAME_TEACHERS,
    '/partners': this.TAB_NAME_NONPROFITS,
    '/nonprofits': this.TAB_NAME_NONPROFITS,
    '/volunteers': this.TAB_NAME_VOLUNTEERS
  };
  windowIsNarrow: boolean;
  resizeSubscription = new Subscription();
  dropdownToggle: boolean = false;

  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    // Set the initial tab name based on the URL; default to
    // TAB_NAME_PARENTS.
    let initialPathname = this.urlService.getPathname();
    for (let urlPattern in this.URL_PATTERNS_TO_TAB_NAMES) {
      if (initialPathname.indexOf(urlPattern) === 0) {
        this.activeTabName = this.URL_PATTERNS_TO_TAB_NAMES[urlPattern];
        break;
      }
    }
    this.buttonDefinitions = this.getButtonDefinitions(this.activeTabName);
    this.windowIsNarrow = this.isWindowNarrow(
      this.windowDimensionsService.getWidth());
    this.resizeSubscription = this.windowDimensionsService.getResizeEvent().
      subscribe(evt => {
        this.windowIsNarrow = this.isWindowNarrow(
          this.windowDimensionsService.getWidth());
      });
  }

  setActiveTabName(newActiveTabName: string): void {
    this.activeTabName = newActiveTabName;
    this.buttonDefinitions = this.getButtonDefinitions(newActiveTabName);
  }

  isActiveTab(tabName: string): boolean {
    return this.activeTabName === tabName;
  }

  getActiveTabNameInSingularForm(): string {
    if (this.activeTabName === this.TAB_NAME_PARENTS) {
      return 'Parent';
    } else if (this.activeTabName === this.TAB_NAME_TEACHERS) {
      return 'Teacher';
    } else if (this.activeTabName === this.TAB_NAME_NONPROFITS) {
      return 'Nonprofit';
    } else if (this.activeTabName === this.TAB_NAME_VOLUNTEERS) {
      return 'Volunteer';
    } else {
      throw new Error('Invalid active tab name: ' + this.activeTabName);
    }
  }

  getButtonDefinitions(tabName: string): ButtonDefinition[] {
    if (tabName === this.TAB_NAME_PARENTS ||
        tabName === this.TAB_NAME_TEACHERS) {
      return [{
        text: 'Browse Lessons',
        href: '/community-library'
      }, {
        text: 'Subscribe to our Newsletter',
        href: 'https://eepurl.com/g5v9Df'
      }];
    } else if (tabName === this.TAB_NAME_NONPROFITS) {
      return [{
        text: 'Get Involved',
        href: (
          'https://www.oppiafoundation.org/partnerships#get-in-touch')
      }, {
        text: 'Browse Lessons',
        href: '/community-library'
      }];
    } else if (tabName === this.TAB_NAME_VOLUNTEERS) {
      return [{
        text: 'Browse Volunteer Opportunities',
        href: 'https://www.oppiafoundation.org/volunteer'
      }];
    } else {
      throw new Error('Invalid tab name: ' + tabName);
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getStaticSubjectImageUrl(subjectName: string): string {
    return this.urlInterpolationService.getStaticImageUrl(
      '/subjects/' + subjectName + '.svg');
  }

  onClickButton(buttonDefinition: ButtonDefinition): void {
    this.siteAnalyticsService.registerStewardsLandingPageEvent(
      this.activeTabName, buttonDefinition.text);
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = buttonDefinition.href;
    }, 150);
  }

  isWindowNarrow(windowWidthPx: number): boolean {
    return windowWidthPx <= 890;
  }

  ngOnDestory(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}
