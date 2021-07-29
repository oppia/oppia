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
 * @fileoverview Root component for pending account deletion Page.
 */

import { Component } from '@angular/core';
import { AppConstants } from 'app.constants';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';

@Component({
  selector: 'oppia-pending-account-deletion-page-root',
  templateUrl: './pending-account-deletion-page-root.component.html'
})
export class PendingAccountDeletionPageRootComponent {
  showPage: boolean = false;
  showError: boolean = false;

  constructor(
    private accessValidationBackendApiService:
    AccessValidationBackendApiService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService
  ) {}

  ngOnInit(): void {
    let pageData = (
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PENDING_ACCOUNT_DELETION);
    // Update default title.
    this.pageTitleService.setPageTitle(pageData.TITLE);

    this.loaderService.showLoadingScreen('Loading');
    this.accessValidationBackendApiService.accountDeletionIsEnabled()
      .then((resp) => {
        if (resp.valid) {
          this.showPage = true;
        } else {
          this.showError = true;
        }
        this.loaderService.hideLoadingScreen();
      }, (err) => {
        this.showError = true;
        this.loaderService.hideLoadingScreen();
      });
  }
}
