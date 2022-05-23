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
 * @fileoverview Root component for Release Coordinator Page.
 */

import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { PageHeadService } from 'services/page-head.service';

@Component({
  selector: 'oppia-release-coordinator-page-root',
  templateUrl: './release-coordinator-page-root.component.html'
})
export class ReleaseCoordinatorPageRootComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  errorPageIsShown: boolean = false;
  pageIsShown: boolean = false;

  constructor(
    private accessValidationBackendApiService:
      AccessValidationBackendApiService,
    private loaderService: LoaderService,
    private pageHeadService: PageHeadService,
    private translateService: TranslateService
  ) {}

  setPageTitleAndMetaTags(): void {
    const releaseCoordinatorPage =
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.RELEASE_COORDINATOR_PAGE;
    const translatedTitle = this.translateService.instant(
      releaseCoordinatorPage.TITLE);
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle,
      releaseCoordinatorPage.META);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitleAndMetaTags();
      })
    );

    this.loaderService.showLoadingScreen('Loading');
    this.accessValidationBackendApiService
      .validateAccessToReleaseCoordinatorPage()
      .then((resp) => {
        this.pageIsShown = true;
      }, (err) => {
        this.errorPageIsShown = true;
      }).then(() => {
        this.loaderService.hideLoadingScreen();
      });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
