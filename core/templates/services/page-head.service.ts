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

import { Injectable } from '@angular/core';
import { PageTitleService } from 'services/page-title.service';
import { MetaAttribute, MetaTagCustomizationService } from './contextual/meta-tag-customization.service';

interface MetaTagData {
  readonly PROPERTY_TYPE: string;
  readonly PROPERTY_VALUE: string;
  readonly CONTENT: string;
}

interface PageMetadata {
  readonly ROUTE: string;
  readonly TITLE: string;
  readonly META: readonly MetaTagData[];
}

@Injectable({
  providedIn: 'root'
})
export class PageHeadService {
  constructor(
    private pageTitleService: PageTitleService,
    private metaTagCustomizationService: MetaTagCustomizationService
  ) {}

  updateTitleAndMetaTags(pageMetadata: PageMetadata): void {
    // Update default title.
    this.pageTitleService.setDocumentTitle(pageMetadata.TITLE);

    let metaAttributes: MetaAttribute[] = [];
    for (let i = 0; i < pageMetadata.META.length; i++) {
      metaAttributes.push({
        propertyType: pageMetadata.META[i].PROPERTY_TYPE,
        propertyValue: pageMetadata.META[i].PROPERTY_VALUE,
        content: pageMetadata.META[i].CONTENT
      });
    }
    // Update meta tags.
    this.metaTagCustomizationService.addOrReplaceMetaTags(metaAttributes);
  }
}
