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
 * @fileoverview Factory for creating new frontend instances of Hint
 * domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory.ts';

export class Hint {
  hintContent: any;
  constructor(hintContent) {
    this.hintContent = hintContent;
  }

  toBackendDict() {
    return {
      hint_content: this.hintContent.toBackendDict()
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class HintObjectFactory {
  constructor(private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory) {}

  createFromBackendDict(hintBackendDict) {
    return new Hint(
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        hintBackendDict.hint_content));
  }

  createNew(hintContentId, hintContent) {
    return new Hint(
      this.subtitledHtmlObjectFactory.createDefault(
        hintContent, hintContentId));
  }
}

angular.module('oppia').factory(
  'HintObjectFactory', downgradeInjectable(HintObjectFactory));
