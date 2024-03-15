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
 * @fileoverview Unit tests for PageHeadService.
 */

import {TestBed} from '@angular/core/testing';

import {PageTitleService} from 'services/page-title.service';
import {MetaTagCustomizationService} from './contextual/meta-tag-customization.service';
import {PageHeadService} from './page-head.service';

describe('Page head service', () => {
  let pageHeadService: PageHeadService;
  let pageTitleService: PageTitleService;
  let metaTagCustomizationService: MetaTagCustomizationService;

  beforeEach(() => {
    pageHeadService = TestBed.inject(PageHeadService);
    pageTitleService = TestBed.inject(PageTitleService);
    metaTagCustomizationService = TestBed.inject(MetaTagCustomizationService);
  });

  it('should updateTitleAndMetaTags', () => {
    let title = 'page_title';
    let meta = {
      PROPERTY_TYPE: '',
      PROPERTY_VALUE: '',
      CONTENT: '',
    };
    spyOn(pageTitleService, 'setDocumentTitle');
    spyOn(metaTagCustomizationService, 'addOrReplaceMetaTags');

    pageHeadService.updateTitleAndMetaTags(title, [meta]);

    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(title);
    expect(
      metaTagCustomizationService.addOrReplaceMetaTags
    ).toHaveBeenCalledWith([
      {
        propertyType: meta.PROPERTY_TYPE,
        propertyValue: meta.PROPERTY_VALUE,
        content: meta.CONTENT,
      },
    ]);
  });
});
