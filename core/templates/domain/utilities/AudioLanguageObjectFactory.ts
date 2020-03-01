// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Object factory for creating audio languages.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class AudioLanguage {
  id: string;
  description: string;
  relatedLanguages: string;

  constructor(id: string, description: string, relatedLanguages: string) {
    this.id = id;
    this.description = description;
    this.relatedLanguages = relatedLanguages;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AudioLanguageObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'audioLanguageDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromDict(audioLanguageDict: any): AudioLanguage {
    return new AudioLanguage(
      audioLanguageDict.id,
      audioLanguageDict.description,
      audioLanguageDict.relatedLanguages);
  }
}
angular.module('oppia').factory(
  'AudioLanguageObjectFactory',
  downgradeInjectable(AudioLanguageObjectFactory));
