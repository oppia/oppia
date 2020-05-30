
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

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { Subscription } from 'rxjs';

describe('Loader Service', () => {
  const i18nLanguageCodeService = new I18nLanguageCodeService();
  let languageCode: string = '';
  let parentSubscription: Subscription;
  beforeEach(() => {
    parentSubscription = new Subscription();
    parentSubscription.add(i18nLanguageCodeService.getI18nLanguageCodeSubject()
      .subscribe(code => languageCode = code));
  });

  afterEach(() => {
    parentSubscription.unsubscribe();
  });

  it('should set the language code', () => {
    i18nLanguageCodeService.setI18nLanguageCodeSubject('pt-br');
    expect(languageCode).toBe('pt-br');
  });

  it('should get the latest language code', () => {
    i18nLanguageCodeService.setI18nLanguageCodeSubject('es');
    const latestCode = i18nLanguageCodeService.getCurrentI18nLanguageCode();
    expect(latestCode).toBe('es');
  });
});
