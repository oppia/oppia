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
 * @fileoverview Component for the footer.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { PlatformFeatureService } from 'services/platform-feature.service';

import { AppConstants } from 'app.constants';

import './oppia-footer.component.css';


@Component({
  selector: 'oppia-footer',
  templateUrl: './oppia-footer.component.html'
})
export class OppiaFooterComponent {
  siteFeedbackFormUrl: string = AppConstants.SITE_FEEDBACK_FORM_URL;
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

  constructor(
    private platformFeatureService: PlatformFeatureService
  ) {}

  getOppiaBlogUrl(): string {
    if (this.platformFeatureService.status.BlogPages.isEnabled) {
      return '/blog';
    } else {
      return 'https://medium.com/oppia-org';
    }
  }
}

angular.module('oppia').directive('oppiaFooter',
  downgradeComponent({
    component: OppiaFooterComponent
  }) as angular.IDirectiveFactory);
