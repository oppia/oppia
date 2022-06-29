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

import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';

@Component({
  selector: 'oppia-pending-account-deletion-page-root',
  templateUrl: './pending-account-deletion-page-root.component.html'
})
export class PendingAccountDeletionPageRootComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  pageIsShown: boolean = false;
  errorPageIsShown: boolean = false;

  constructor(
    private pageHeadService: PageHeadService,
    private translateService: TranslateService
  ) {}

  setPageTitleAndMetaTags(): void {
    let pendingAccountDeletionPage =
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PENDING_ACCOUNT_DELETION;
    let translatedTitle = this.translateService.instant(
      pendingAccountDeletionPage.TITLE);
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle, pendingAccountDeletionPage.META);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitleAndMetaTags();
      })
    );
    this.pageIsShown = true;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
