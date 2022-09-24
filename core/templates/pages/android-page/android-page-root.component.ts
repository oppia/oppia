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
 * @fileoverview Root Component for Android page.
 */

import { Component } from '@angular/core';
import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

@Component({
  selector: 'oppia-android-page-root',
  templateUrl: './android-page-root.component.html'
})
export class AndroidPageRootComponent {
  androidPageIsEnabled = (
    this.platformFeatureService.status.AndroidBetaLandingPage.isEnabled
  );

  constructor(
    private pageHeadService: PageHeadService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    if (this.androidPageIsEnabled) {
      this.pageHeadService.updateTitleAndMetaTags(
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ANDROID.TITLE,
        AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ANDROID.META);
    }
  }
}
