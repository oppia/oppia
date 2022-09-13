// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to set and get the title of the page.
 */

import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  pageTitleForMobile!: string;
  pageSubtitleForMobile!: string;

  constructor(
    private metaTagService: Meta,
    private titleService: Title
  ) {}

  setDocumentTitle(title: string): void {
    this.titleService.setTitle(title);
  }

  getDocumentTitle(): string {
    return this.titleService.getTitle();
  }

  /**
   * Updates the description meta tag in the current HTML page
   * with the provided content.
   */
  updateMetaTag(content: string): void {
    this.metaTagService.updateTag({
      name: 'description',
      content: content
    });
    this.metaTagService.updateTag({
      itemprop: 'description',
      content: content
    });
    this.metaTagService.updateTag({
      property: 'og:description',
      content: content
    });
  }

  setNavbarTitleForMobileView(title: string): void {
    this.pageTitleForMobile = title;
  }

  setNavbarSubtitleForMobileView(subtitle: string): void {
    this.pageSubtitleForMobile = subtitle;
  }

  getNavbarTitleForMobileView(): string {
    return this.pageTitleForMobile;
  }

  getNavbarSubtitleForMobileView(): string {
    return this.pageSubtitleForMobile;
  }
}

angular.module('oppia').factory(
  'PageTitleService', downgradeInjectable(PageTitleService));
