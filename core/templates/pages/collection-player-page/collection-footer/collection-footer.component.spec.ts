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
 * @fileoverview Unit tests for collection footer component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync, ComponentFixture } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { CollectionFooterComponent } from './collection-footer.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('Collection footer component', () => {
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let component: CollectionFooterComponent;
  let fixture: ComponentFixture<CollectionFooterComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        CollectionFooterComponent,
        MockTranslatePipe
      ],
      providers: [
        UrlInterpolationService,
        UrlService
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionFooterComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  beforeEach(() => {
    spyOn(urlService, 'getCollectionIdFromUrl').and.returnValue('abcdef');
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      '/assets/images/general/apple.svg');
    component.ngOnInit();
  });

  it('should load the component properly on playing a collection', () => {
    expect(urlService.getCollectionIdFromUrl).toHaveBeenCalled();
    expect(component.collectionId).toBe('abcdef');
  });

  it('should get the static image url from the image path', () => {
    expect(component.getStaticImageUrl('/general/apple.svg'))
      .toBe('/assets/images/general/apple.svg');
    expect(urlInterpolationService.getStaticImageUrl)
      .toHaveBeenCalledWith('/general/apple.svg');
  });
});
