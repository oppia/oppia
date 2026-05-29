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
 * @fileoverview Root component for get started page.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {Meta} from '@angular/platform-browser';

import {AppConstants} from 'app.constants';
import {PageHeadService} from 'services/page-head.service';

@Component({
  selector: 'oppia-get-started-page-root',
  templateUrl: './get-started-page-root.component.html',
})
export class GetStartedPageRootComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  constructor(
    private pageHeadService: PageHeadService,
    private translateService: TranslateService,
    private meta: Meta
  ) {}

  setPageTitleAndMetaTags(): void {
    this.translateService
      .get(AppConstants.PAGES_REGISTERED_WITH_FRONTEND.GET_STARTED.TITLE)
      .subscribe((translatedTitle: string) => {
        this.pageHeadService.updateTitleAndMetaTags(
          translatedTitle,
          AppConstants.PAGES_REGISTERED_WITH_FRONTEND.GET_STARTED.META
        );

        this.meta.updateTag({
          itemprop: 'name',
          content: 'Personalized Online Learning from Oppia',
        });
        this.meta.updateTag({
          itemprop: 'description',
          content: 'Learn how to get started using Oppia.',
        });

        this.meta.updateTag({
          property: 'og:title',
          content: 'Personalized Online Learning from Oppia',
        });
        this.meta.updateTag({
          property: 'og:description',
          content: 'Learn how to get started using Oppia.',
        });
        this.meta.updateTag({
          property: 'og:url',
          content: 'https://www.oppia.org/get-started',
        });
      });
  }

  ngOnInit(): void {
    this.setPageTitleAndMetaTags();
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
