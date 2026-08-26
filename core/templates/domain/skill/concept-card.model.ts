// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Object factory for creating a front-end instance of a
 * concept card. In the backend, this is referred to as SkillContents.
 */

import {
  RecordedVoiceovers,
  RecordedVoiceOverBackendDict,
} from 'domain/exploration/recorded-voiceovers.model';
import {
  SubtitledHtml,
  SubtitledHtmlBackendDict,
} from 'domain/exploration/subtitled-html.model';

export interface ConceptCardBackendDict {
  explanation: SubtitledHtmlBackendDict;
  recorded_voiceovers: RecordedVoiceOverBackendDict;
}

export class ConceptCard {
  _explanation: SubtitledHtml;
  _recordedVoiceovers: RecordedVoiceovers;

  constructor(
    explanation: SubtitledHtml,
    recordedVoiceovers: RecordedVoiceovers
  ) {
    this._explanation = explanation;
    this._recordedVoiceovers = recordedVoiceovers;
  }

  toBackendDict(): ConceptCardBackendDict {
    return {
      explanation: this._explanation.toBackendDict(),
      recorded_voiceovers: this._recordedVoiceovers.toBackendDict(),
    };
  }

  getExplanation(): SubtitledHtml {
    return this._explanation;
  }

  setExplanation(explanation: SubtitledHtml): void {
    this._explanation = explanation;
  }

  getRecordedVoiceovers(): RecordedVoiceovers {
    return this._recordedVoiceovers;
  }

  static createFromBackendDict(
    conceptCardBackendDict: ConceptCardBackendDict
  ): ConceptCard {
    return new ConceptCard(
      SubtitledHtml.createFromBackendDict(conceptCardBackendDict.explanation),
      RecordedVoiceovers.createFromBackendDict(
        conceptCardBackendDict.recorded_voiceovers
      )
    );
  }
}
