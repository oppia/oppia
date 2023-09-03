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
 * @fileoverview Unit tests for TranslatedContent object factory.
 */

import { TranslatedContent, TranslatedContentBackendDict } from './TranslatedContentObjectFactory';

describe('TranslatedContent', () => {
  let translatedContentBackendDict: TranslatedContentBackendDict;

  beforeEach(() => {
    translatedContentBackendDict = {
      content_value: '<p>Translated html</p>',
      content_format: 'html',
      needs_update: false,
    };
  });

  it('should create a translated content object from backend dict', () => {
    const translatedContent = TranslatedContent.createFromBackendDict(
      translatedContentBackendDict
    );

    expect(translatedContent.dataFormat).toEqual('html');
  });

  it('should mark translated content needs update', () => {
    const translatedContent = TranslatedContent.createFromBackendDict(
      translatedContentBackendDict);
    expect(translatedContent.needsUpdate).toBeFalse();

    translatedContent.markAsNeedingUpdate();

    expect(translatedContent.needsUpdate).toBeTrue();
  });

  it('should return correct value for isHtml function', () => {
    let translatedContent = TranslatedContent.createFromBackendDict(
      translatedContentBackendDict);
    expect(translatedContent.isHtml()).toBeTrue();

    const newTranslatedContentBackendDict = {
      content_value: ['<p>Translated html</p>'],
      content_format: 'set_of_normalized_string',
      needs_update: false,
    };
    translatedContent = TranslatedContent.createFromBackendDict(
      newTranslatedContentBackendDict);
    expect(translatedContent.isHtml()).toBeFalse();
  });

  it('should return correct value for isUnicode function', () => {
    let translatedContent = TranslatedContent.createFromBackendDict(
      translatedContentBackendDict);
    expect(translatedContent.isUnicode()).toBeFalse();

    const newTranslatedContentBackendDict = {
      content_value: 'Translated unicode',
      content_format: 'unicode',
      needs_update: false,
    };
    translatedContent = TranslatedContent.createFromBackendDict(
      newTranslatedContentBackendDict);
    expect(translatedContent.isUnicode()).toBeTrue();
  });

  it('should return correct value for isSetOfStrings function', () => {
    let translatedContent = TranslatedContent.createFromBackendDict(
      translatedContentBackendDict);
    expect(translatedContent.isSetOfStrings()).toBeFalse();

    const newTranslatedContentBackendDict = {
      content_value: ['<p>Translated html</p>'],
      content_format: 'set_of_normalized_string',
      needs_update: false,
    };
    translatedContent = TranslatedContent.createFromBackendDict(
      newTranslatedContentBackendDict);
    expect(translatedContent.isSetOfStrings()).toBeTrue();
  });

  it('should throw an error if dataFormat is not present' +
  ' in DATA_FORMAT_TO_DEFAULT_VALUES', () => {
    expect(() => TranslatedContent.createNew(
      'unicodex')).toThrowError('Invalid translation data format: unicodex');
  });
});
