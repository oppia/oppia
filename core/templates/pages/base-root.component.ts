// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Base root component for all pages.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { PageHeadService } from 'services/page-head.service';

export interface MetaTagData {
  readonly PROPERTY_TYPE: string;
  readonly PROPERTY_VALUE: string;
  readonly CONTENT: string;
}

@Component({
  template: ''
})
export abstract class BaseRootComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  abstract title: string;
  abstract meta: MetaTagData[];

  constructor(
    protected pageHeadService: PageHeadService,
    protected translateService: TranslateService,
  ) { }

  get titleInterpolationParams(): Object {
    return {};
  }

  setPageTitleAndMetaTags(): void {
    const translatedTitle = this.translateService.instant(
      this.title,
      this.titleInterpolationParams);
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle,
      this.meta);
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
