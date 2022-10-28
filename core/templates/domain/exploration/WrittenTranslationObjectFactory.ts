// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * WrittenTranslation domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';

export const TRANSLATION_DATA_FORMAT_HTML = 'html';
export const TRANSLATION_DATA_FORMAT_UNICODE = 'unicode';
export const TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING = (
  'set_of_normalized_string');
export const TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING = (
  'set_of_unicode_string');
export const DATA_FORMAT_TO_DEFAULT_VALUES = {
  [TRANSLATION_DATA_FORMAT_HTML]: '',
  [TRANSLATION_DATA_FORMAT_UNICODE]: '',
  [TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING]: [],
  [TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING]: []
};

export type DataFormatToDefaultValuesKey = (
  keyof typeof DATA_FORMAT_TO_DEFAULT_VALUES);

export interface TranslationBackendDict {
  'data_format': string;
  'translation': string|string[];
  'needs_update': boolean;
}

export class WrittenTranslation {
  constructor(
      public dataFormat: DataFormatToDefaultValuesKey,
      public translation: string|string[],
      public needsUpdate: boolean
  ) {}

  markAsNeedingUpdate(): void {
    this.needsUpdate = true;
  }

  toggleNeedsUpdateAttribute(): void {
    this.needsUpdate = !this.needsUpdate;
  }

  isHtml(): boolean {
    return this.dataFormat === TRANSLATION_DATA_FORMAT_HTML;
  }

  isUnicode(): boolean {
    return this.dataFormat === TRANSLATION_DATA_FORMAT_UNICODE;
  }

  isSetOfStrings(): boolean {
    return [
      TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
      TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING
    ].indexOf(this.dataFormat) !== -1;
  }

  getTranslation(): string|string[] {
    return this.translation;
  }

  setTranslation(translation: string|string[]): void {
    if (typeof translation !==
        typeof DATA_FORMAT_TO_DEFAULT_VALUES[
          this.dataFormat as DataFormatToDefaultValuesKey]) {
      throw new Error(
        'This translation is not of the correct type for data format ' +
        this.dataFormat);
    }
    this.translation = translation;
  }

  toBackendDict(): TranslationBackendDict {
    return {
      data_format: this.dataFormat,
      translation: this.translation,
      needs_update: this.needsUpdate
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class WrittenTranslationObjectFactory {
  createNew(dataFormat: string): WrittenTranslation {
    if (!DATA_FORMAT_TO_DEFAULT_VALUES.hasOwnProperty(dataFormat)) {
      throw new Error('Invalid translation data format: ' + dataFormat);
    }

    return new WrittenTranslation(
      dataFormat as DataFormatToDefaultValuesKey,
      cloneDeep(
        DATA_FORMAT_TO_DEFAULT_VALUES[
          dataFormat as DataFormatToDefaultValuesKey
        ]
      ),
      false
    );
  }

  createFromBackendDict(
      translationBackendDict: TranslationBackendDict): WrittenTranslation {
    return new WrittenTranslation(
      translationBackendDict.data_format as DataFormatToDefaultValuesKey,
      translationBackendDict.translation,
      translationBackendDict.needs_update);
  }
}

angular.module('oppia').factory(
  'WrittenTranslationObjectFactory',
  downgradeInjectable(WrittenTranslationObjectFactory));
