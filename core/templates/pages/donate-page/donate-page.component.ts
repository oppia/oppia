// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the donate page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { SiteAnalyticsService } from 'services/site-analytics.service.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service.ts';
import { WindowRef } from 'services/contextual/window-ref.service';

require('base-components/base-content.directive.ts');

@Component({
  selector: 'donate-page',
  templateUrl: './donate-page.component.html',
  styleUrls: []
})
export class DonatePageComponent implements OnInit {
  windowIsNarrow: boolean = false;
  donateImgUrl: string = '';
  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionService: WindowDimensionsService,
    private windowRef: WindowRef
  ) {}
  ngOnInit() {
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.donateImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/opp_donate_text.svg');
  }

  onDonateThroughAmazon() {
    this.siteAnalyticsService.registerGoToDonationSiteEvent('Amazon');
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = (
        'https://smile.amazon.com/ch/81-1740068');
    }, 150);
    return false;
  }

  onDonateThroughPayPal() {
    // Redirection to PayPal will be initiated at the same time as this
    // function is run, but should be slow enough to allow this function
    // time to complete. It is not possible to do $http.post() in
    // javascript after a delay because cross-site POSTing is not
    // permitted in scripts; see
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control
    // _CORS
    // for more information.
    this.siteAnalyticsService.registerGoToDonationSiteEvent('PayPal');
  }
}

angular.module('oppia').directive(
  'donatePage', downgradeComponent({component: DonatePageComponent}));
