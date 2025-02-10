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
 * @fileoverview Factory for creating new frontend instances of
 * TranslatedContent domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

export const TRANSLATION_DATA_FORMAT_HTML = 'html';
export const TRANSLATION_DATA_FORMAT_UNICODE = 'unicode';
export const TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING =
  'set_of_normalized_string';
export const TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING =
  'set_of_unicode_string';
export const DATA_FORMAT_TO_DEFAULT_VALUES = {
  [TRANSLATION_DATA_FORMAT_HTML]: '',
  [TRANSLATION_DATA_FORMAT_UNICODE]: '',
  [TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING]: [],
  [TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING]: [],
};

export type DataFormatToDefaultValuesKey =
  keyof typeof DATA_FORMAT_TO_DEFAULT_VALUES;

export interface TranslatedContentBackendDict {
  content_value: string | string[];
  content_format: string;
  needs_update: boolean;
}

export class TranslatedContent {
  constructor(
    public translation: string | string[],
    public dataFormat: DataFormatToDefaultValuesKey,
    public needsUpdate: boolean
  ) {}

  isHtml(): boolean {
    return this.dataFormat === TRANSLATION_DATA_FORMAT_HTML;
  }

  isUnicode(): boolean {
    return this.dataFormat === TRANSLATION_DATA_FORMAT_UNICODE;
  }

  isSetOfStrings(): boolean {
    return (
      [
        TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
        TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
      ].indexOf(this.dataFormat) !== -1
    );
  }

  markAsNeedingUpdate(): void {
    this.needsUpdate = true;
  }

  getTranslation(): string | string[] {
    return this.translation;
  }

  toBackendDict(): TranslatedContentBackendDict {
    return {
      content_value: this.translation,
      content_format: this.dataFormat,
      needs_update: this.needsUpdate,
    };
  }

  static createFromBackendDict(
    translationBackendDict: TranslatedContentBackendDict
  ): TranslatedContent {
    return new TranslatedContent(
      translationBackendDict.content_value,
      translationBackendDict.content_format as DataFormatToDefaultValuesKey,
      translationBackendDict.needs_update
    );
  }

  static createNew(dataFormat: string): TranslatedContent {
    if (!DATA_FORMAT_TO_DEFAULT_VALUES.hasOwnProperty(dataFormat)) {
      throw new Error('Invalid translation data format: ' + dataFormat);
    }

    return new TranslatedContent(
      cloneDeep(
        DATA_FORMAT_TO_DEFAULT_VALUES[
          dataFormat as DataFormatToDefaultValuesKey
        ]
      ),
      dataFormat as DataFormatToDefaultValuesKey,
      false
    );
  }
}
