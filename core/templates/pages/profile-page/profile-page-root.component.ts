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
 * @fileoverview Root component for Profile Page.
 */

import {Component, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {LoaderService} from 'services/loader.service';
import {PageHeadService} from 'services/page-head.service';

@Component({
  selector: 'oppia-profile-page-root',
  templateUrl: './profile-page-root.component.html',
})
export class ProfilePageRootComponent implements OnDestroy {
  directiveSubscriptions = new Subscription();
  pageIsShown: boolean = false;
  errorPageIsShown: boolean = false;

  constructor(
    private accessValidationBackendApiService: AccessValidationBackendApiService,
    private loaderService: LoaderService,
    private pageHeadService: PageHeadService,
    private urlService: UrlService,
    private translateService: TranslateService
  ) {}

  setPageTitleAndMetaTags(): void {
    let translatedTitle = this.translateService.instant(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PROFILE.TITLE
    );
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PROFILE.META
    );
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitleAndMetaTags();
      })
    );

    let username = this.urlService.getPathname().split('/')[2];
    this.loaderService.showLoadingScreen('Loading');
    this.accessValidationBackendApiService
      .doesProfileExist(username)
      .then(
        () => {
          this.pageIsShown = true;
        },
        err => {
          this.errorPageIsShown = true;
        }
      )
      .then(() => {
        this.loaderService.hideLoadingScreen();
      });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
