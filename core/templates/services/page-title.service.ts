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
import { Title } from '@angular/platform-browser';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  pageTitleForMobile: string = null;
  pageSubtitleForMobile: string = null;
  constructor(private titleService: Title) {}

  /**
   * @param {string} title - Title of the page to be set to.
   */
  setPageTitle(title: string) {
    this.titleService.setTitle(title);
  }

  /**
   * @return {string} The page's title.
   */
  getPageTitle(): string {
    return this.titleService.getTitle();
  }

  /**
   * @param {string} title - Title of the page to be set to in mobile view.
   */
  setPageTitleForMobileView(title: string): void {
    this.pageTitleForMobile = title;
  }

  /**
   * @param {string} subtitle - Subtitle of the page to set to in mobile view.
   */
  setPageSubtitleForMobileView(subtitle: string): void {
    this.pageSubtitleForMobile = subtitle;
  }

  /**
   * @return {string} The page's title in mobile view.
   */
  getPageTitleForMobileView(): string {
    return this.pageTitleForMobile;
  }

  /**
   * @return {string} The page's subtitle in mobile view.
   */
  getPageSubtitleForMobileView(): string {
    return this.pageSubtitleForMobile;
  }
}

angular.module('oppia').factory(
  'PageTitleService', downgradeInjectable(PageTitleService));
