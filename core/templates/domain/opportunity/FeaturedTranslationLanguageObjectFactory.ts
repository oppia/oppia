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
 * @fileoverview Factory for creating and mutating instances of frontend
 * featured translation language domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface FeaturedTranslationLanguageBackendDict {
  'language_code': string;
  explanation: string;
}

export class FeaturedTranslationLanguage {
  constructor(
      readonly languageCode: string,
      readonly explanation: string
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class FeaturedTranslationLanguageObjectFactory {
  createFromBackendDict(
      featuredTranslationBackendDict: FeaturedTranslationLanguageBackendDict
  ): FeaturedTranslationLanguage {
    return new FeaturedTranslationLanguage(
      featuredTranslationBackendDict.language_code,
      featuredTranslationBackendDict.explanation
    );
  }
}

angular.module('oppia').factory(
  'FeaturedTranslationLanguageObjectFactory',
  downgradeInjectable(FeaturedTranslationLanguageObjectFactory));
