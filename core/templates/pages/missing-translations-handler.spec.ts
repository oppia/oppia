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

import { AppConstants } from 'app.constants';
import { MyMissingTranslationHandler } from './missing-translations-handler';

describe('Missing Translations Handler', () => {
  let mth = new MyMissingTranslationHandler();

  it ('should create handle default translations', () => {
    let value = 'Library';
    spyOn(mth, 'getAppConstants').and.returnValue(
      {DEFAULT_TRANSLATIONS: {
        key: value
      }} as unknown as typeof AppConstants);
    expect(mth.handle({
      key: 'key',
      translateService: null,
    })).toEqual(value);
  });

  it('should return key if not available in app constants', () => {
    let key = 'I18N_LIBRARY_PAGE_TITLE_FRAGMENT_FOR_WEB';
    spyOn(mth, 'getAppConstants').and.returnValue(
      {DEFAULT_TRANSLATIONS: {}} as
      unknown as typeof AppConstants);
    expect(mth.handle({
      key,
      translateService: null,
    })).toEqual(key);
  });
});

