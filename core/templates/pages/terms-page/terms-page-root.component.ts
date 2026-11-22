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
 * @fileoverview Root component for Terms Page.
 */

import {AfterViewInit, Component, OnInit} from '@angular/core';
import {markAngularContentReady} from 'pages/oppia-root/bootstrap-module';
import {PageHeadService} from 'services/page-head.service';

const DESCRIPTION =
  'Oppia is a non-profit open-source learning platform. ' +
  'Read our terms for creating and sharing lessons.';

export const TERMS_PAGE_TITLE = 'Terms of Use | Oppia';
export const TERMS_PAGE_META = [
  {
    PROPERTY_TYPE: 'itemprop',
    PROPERTY_VALUE: 'description',
    CONTENT: DESCRIPTION,
  },
  {
    PROPERTY_TYPE: 'property',
    PROPERTY_VALUE: 'og:description',
    CONTENT: DESCRIPTION,
  },
] as const;

@Component({
  selector: 'oppia-terms-page-root',
  templateUrl: './terms-page-root.component.html',
})
export class TermsPageRootComponent implements OnInit, AfterViewInit {
  constructor(private pageHeadService: PageHeadService) {}

  ngOnInit(): void {
    // These values are static for this page. Setting them directly keeps the
    // lightweight bootstrap independent of the translation loader.
    this.pageHeadService.updateTitleAndMetaTags(
      TERMS_PAGE_TITLE,
      TERMS_PAGE_META
    );
  }

  ngAfterViewInit(): void {
    // The child page view is laid out by this point, so revealing it cannot
    // create a layout shift against the prerendered markup.
    markAngularContentReady();
  }
}
