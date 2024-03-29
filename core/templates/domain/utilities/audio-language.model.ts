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
 * @fileoverview Model class for creating audio languages.
 */

export interface AudioLanguageBackendDict {
  id: string;
  description: string;
  relatedLanguages: readonly string[];
}

export class AudioLanguage {
  id: string;
  description: string;
  relatedLanguages: readonly string[];

  constructor(
    id: string,
    description: string,
    relatedLanguages: readonly string[]
  ) {
    this.id = id;
    this.description = description;
    this.relatedLanguages = relatedLanguages;
  }

  static createFromDict(
    audioLanguageDict: AudioLanguageBackendDict
  ): AudioLanguage {
    return new AudioLanguage(
      audioLanguageDict.id,
      audioLanguageDict.description,
      audioLanguageDict.relatedLanguages
    );
  }
}
