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

export const WRITTEN_TRANSLATION_TYPE_HTML = 'html';
export const WRITTEN_TRANSLATION_TYPE_UNICODE = 'unicode';

type WrittenTranslationType = typeof WRITTEN_TRANSLATION_TYPE_UNICODE |
  typeof WRITTEN_TRANSLATION_TYPE_HTML;

export interface ITranslationBackendDict {
  'data_format': WrittenTranslationType;
  'translation': string;
  'needs_update': boolean;
}

export class WrittenTranslation {
  constructor(
      public translationType: WrittenTranslationType,
      public translation: string,
      public needsUpdate: boolean
  ) {}

  markAsNeedingUpdate(): void {
    this.needsUpdate = true;
  }

  toggleNeedsUpdateAttribute(): void {
    this.needsUpdate = !this.needsUpdate;
  }

  getHtml(): string {
    if (this.translationType !== WRITTEN_TRANSLATION_TYPE_HTML) {
      throw new Error('This translation is not of type html');
    }
    return this.translation;
  }

  setHtml(html: string): void {
    if (this.translationType !== WRITTEN_TRANSLATION_TYPE_HTML) {
      throw new Error('This translation is not of type html');
    }
    this.translation = html;
  }

  toBackendDict(): ITranslationBackendDict {
    return {
      data_format: this.translationType,
      translation: this.translation,
      needs_update: this.needsUpdate
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class WrittenTranslationObjectFactory {
  createNew(type: WrittenTranslationType, html: string): WrittenTranslation {
    return new WrittenTranslation(type, html, false);
  }

  createFromBackendDict(translationBackendDict: ITranslationBackendDict) {
    return new WrittenTranslation(
      translationBackendDict.data_format,
      translationBackendDict.translation,
      translationBackendDict.needs_update);
  }
}

angular.module('oppia').factory(
  'WrittenTranslationObjectFactory',
  downgradeInjectable(WrittenTranslationObjectFactory));
