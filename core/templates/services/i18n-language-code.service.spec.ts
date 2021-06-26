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
 * @fileoverview Unit tests for I18nLanguageCodeService.
 */

import { EventEmitter } from '@angular/core';

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { Subscription } from 'rxjs';

describe('I18nLanguageCodeService', () => {
  const i18nLanguageCodeService = new I18nLanguageCodeService();
  let languageCode: string = '';
  let testSubscriptions: Subscription;
  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      i18nLanguageCodeService.onI18nLanguageCodeChange
        .subscribe((code: string) => languageCode = code));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should set the language code', () => {
    i18nLanguageCodeService.setI18nLanguageCode('pt-br');
    expect(languageCode).toBe('pt-br');
  });

  it('should get the latest language code', () => {
    i18nLanguageCodeService.setI18nLanguageCode('es');
    const latestCode = i18nLanguageCodeService.getCurrentI18nLanguageCode();
    expect(latestCode).toBe('es');
  });

  it('should get event emitter for loading of preferred language codes', () => {
    let mockPreferredLanguageCodesLoadedEventEmitter = new EventEmitter();
    expect(i18nLanguageCodeService.onPreferredLanguageCodesLoaded).toEqual(
      mockPreferredLanguageCodesLoadedEventEmitter);
  });
});
