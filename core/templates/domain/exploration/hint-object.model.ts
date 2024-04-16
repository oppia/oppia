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
 * @fileoverview Model class for creating new frontend instances of Hint
 * domain objects.
 */

import {
  SubtitledHtml,
  SubtitledHtmlBackendDict,
} from 'domain/exploration/subtitled-html.model';
import {BaseTranslatableObject} from 'domain/objects/BaseTranslatableObject.model';

export interface HintBackendDict {
  hint_content: SubtitledHtmlBackendDict;
}

export class Hint extends BaseTranslatableObject {
  hintContent: SubtitledHtml;
  constructor(hintContent: SubtitledHtml) {
    super();
    this.hintContent = hintContent;
  }

  getTranslatableFields(): SubtitledHtml[] {
    return [this.hintContent];
  }

  toBackendDict(): HintBackendDict {
    return {
      hint_content: this.hintContent.toBackendDict(),
    };
  }

  static createFromBackendDict(hintBackendDict: HintBackendDict): Hint {
    return new Hint(
      SubtitledHtml.createFromBackendDict(hintBackendDict.hint_content)
    );
  }

  static createNew(hintContentId: string, hintContent: string): Hint {
    return new Hint(SubtitledHtml.createDefault(hintContent, hintContentId));
  }
}
