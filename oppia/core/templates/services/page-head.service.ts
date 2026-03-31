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
 * @fileoverview Service to update page's title and meta tags.
 */

import {Injectable} from '@angular/core';

import {PageTitleService} from 'services/page-title.service';
import {
  MetaAttribute,
  MetaTagCustomizationService,
} from './contextual/meta-tag-customization.service';

interface MetaTagData {
  readonly PROPERTY_TYPE: string;
  readonly PROPERTY_VALUE: string;
  readonly CONTENT: string;
}

@Injectable({
  providedIn: 'root',
})
export class PageHeadService {
  constructor(
    private pageTitleService: PageTitleService,
    private metaTagCustomizationService: MetaTagCustomizationService
  ) {}

  updateTitleAndMetaTags(
    pageTitle: string,
    pageMetaAttributes: readonly MetaTagData[]
  ): void {
    // Update default title.
    this.pageTitleService.setDocumentTitle(pageTitle);

    let metaAttributes: MetaAttribute[] = [];
    for (let i = 0; i < pageMetaAttributes.length; i++) {
      metaAttributes.push({
        propertyType: pageMetaAttributes[i].PROPERTY_TYPE,
        propertyValue: pageMetaAttributes[i].PROPERTY_VALUE,
        content: pageMetaAttributes[i].CONTENT,
      });
    }
    // Update meta tags.
    this.metaTagCustomizationService.addOrReplaceMetaTags(metaAttributes);
  }
}
