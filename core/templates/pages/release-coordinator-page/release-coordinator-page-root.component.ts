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

import { Component } from '@angular/core';
import { AppConstants } from 'app.constants';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { PageHeadService } from 'services/page-head.service';

@Component({
  selector: 'oppia-release-coordinator-page-root',
  templateUrl: './release-coordinator-page-root.component.html'
})
export class ReleaseCoordinatorPageRootComponent {
  errorPageIsShown: boolean = false;
  pageIsShown: boolean = false;

  constructor(
    private accessValidationBackendApiService:
      AccessValidationBackendApiService,
    private loaderService: LoaderService,
    private pageHeadService: PageHeadService
  ) {}

  ngOnInit(): void {
    this.pageHeadService.updateTitleAndMetaTags(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.RELEASE_COORDINATOR_PAGE);
    this.loaderService.showLoadingScreen('Loading');
    this.accessValidationBackendApiService
      .validateAccessToReleaseCoordinatorPage()
      .then((resp) => {
        if (!resp.valid) {
          this.errorPageIsShown = true;
        } else {
          this.pageIsShown = true;
        }
        this.loaderService.hideLoadingScreen();
      }, (err) => {
        this.errorPageIsShown = true;
        this.loaderService.hideLoadingScreen();
      });
  }
}
