// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Root component for error page.
 */

// This error page is used for status codes 400, 401 and 500.

import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { WindowRef } from 'services/contextual/window-ref.service';
import { PageTitleService } from 'services/page-title.service';

@Component({
  selector: 'oppia-error-page-root',
  templateUrl: './error-page-root.component.html'
})
export class ErrorPageRootComponent implements OnDestroy {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  statusCode!: string;
  directiveSubscriptions = new Subscription();

  constructor(
    private pageTitleService: PageTitleService,
    private windowRef: WindowRef,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    let bodyTag = (
      this.windowRef.nativeWindow.document.getElementsByTagName('body'));
    // Read status code from errorCode attribute on body tag.
    let errorCode = bodyTag[0].getAttribute('errorCode');
    this.statusCode = errorCode ? errorCode : '404';
    // Update the default page title.
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_ERROR_PAGE_ROOT_BROWSER_TAB_TITLE', {
        statusCode: this.statusCode,
      });
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
