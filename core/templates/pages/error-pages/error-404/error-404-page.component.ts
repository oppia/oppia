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
 * @fileoverview Component for the error 404 page.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PageTitleService} from 'services/page-title.service';

@Component({
  selector: 'oppia-error-404-page',
  templateUrl: './error-404-page.component.html',
  styleUrls: [],
})
export class Error404PageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_ERROR_PAGE_TITLE_404'
    );
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
