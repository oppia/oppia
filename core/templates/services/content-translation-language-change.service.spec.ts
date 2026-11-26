// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ContentTranslationLanguageChangeService.
 */

import {TestBed} from '@angular/core/testing';
import {ContentTranslationLanguageChangeService} from './content-translation-language-change.service';

describe('Content Translation Language Change Service', () => {
  let contentTranslationLanguageChangeService: ContentTranslationLanguageChangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    contentTranslationLanguageChangeService = TestBed.inject(
      ContentTranslationLanguageChangeService
    );
  });

  it('should get the onLanguageChange emitter', () => {
    expect(
      contentTranslationLanguageChangeService.onLanguageChange
    ).toBeDefined();
  });

  it('should emit the new language code', () => {
    const emitSpy = spyOn(
      contentTranslationLanguageChangeService.onLanguageChange,
      'emit'
    );

    contentTranslationLanguageChangeService.emit('fr');

    expect(emitSpy).toHaveBeenCalledWith('fr');
  });
});
