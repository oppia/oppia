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
 * @fileoverview Root component for Privacy Page.
 */

import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';

@Component({
  selector: 'oppia-privacy-page-root',
  templateUrl: './privacy-page-root.component.html'
})
export class PrivacyPageRootComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  constructor(
    private pageHeadService: PageHeadService,
    private translateService: TranslateService
  ) {}

  setPageTitleAndMetaTags(): void {
    let translatedTitle = this.translateService.instant(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PRIVACY.TITLE);
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PRIVACY.META);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitleAndMetaTags();
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
