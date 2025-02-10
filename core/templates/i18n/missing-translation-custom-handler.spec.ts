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
 * @fileoverview Unit tests for the Missing Translations Handler.
 */

import {TranslateService} from '@ngx-translate/core';
import {AppConstants} from 'app.constants';
import {MissingTranslationCustomHandler} from './missing-translation-custom-handler';

describe('Missing Translations Custom Handler', () => {
  let mth = new MissingTranslationCustomHandler();

  it('should return correct translation for existing default translations', () => {
    expect(
      mth.handle({
        key: 'I18N_SIGNUP_PAGE_SUBTITLE',
        translateService: {} as TranslateService,
      })
    ).toEqual(AppConstants.DEFAULT_TRANSLATIONS.I18N_SIGNUP_PAGE_SUBTITLE);
  });

  it('should return key if correct value is not available in app constants', () => {
    let key = 'KEY_NOT_AVAILABLE_IN_APP_CONSTANTS';
    expect(
      mth.handle({
        key,
        translateService: {} as TranslateService,
      })
    ).toEqual(key);
  });
});
