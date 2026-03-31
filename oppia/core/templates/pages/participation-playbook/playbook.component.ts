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
 * @fileoverview Component for the playbook page.
 */

import {Component, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';

import './playbook.component.css';

@Component({
  selector: 'participation-playbook',
  templateUrl: './playbook.component.html',
  styleUrls: ['./playbook.component.css'],
})
export class PlaybookPageComponent implements OnInit {
  TAB_ID_PARTICIPATION: string = 'participation';
  TEACH_FORM_URL: string = 'https://goo.gl/forms/0p3Axuw5tLjTfiri1';
  communityLibraryUrl =
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_INDEX.ROUTE;

  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  onApplyToTeachWithOppia(): boolean {
    this.siteAnalyticsService.registerApplyToTeachWithOppiaEvent();
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = this.TEACH_FORM_URL;
    }, 150);
    return false;
  }
}
