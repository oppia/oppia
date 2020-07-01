// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for FeaturedTranslationLanguageObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import {
  FeaturedTranslationLanguageObjectFactory,
  FeaturedTranslationLanguage,
  IFeaturedTranslationLanguageBackendDict
} from
  'domain/opportunity/FeaturedTranslationLanguageObjectFactory';

describe('Featured Translation Language object factory', () => {
  let featuredTranslationLanguageObjectFactory:
    FeaturedTranslationLanguageObjectFactory = null;
  let sampleFTL: FeaturedTranslationLanguage = null;

  beforeEach(() => {
    featuredTranslationLanguageObjectFactory = TestBed.get(
      FeaturedTranslationLanguageObjectFactory);

    let sampleFTLDict: IFeaturedTranslationLanguageBackendDict = {
      language_code: 'en',
      explanation: 'English'
    };
    sampleFTL = featuredTranslationLanguageObjectFactory
      .createFromBackendDict(sampleFTLDict);
  });

  it('should correctly evaluate all the values based on backend' +
     ' dict', function() {
    expect(sampleFTL.languageCode).toBe('en');
    expect(sampleFTL.explanation).toBe('English');
  });
});
