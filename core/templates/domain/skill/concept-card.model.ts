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
  // Only the concept card handler supplies this. The same dict shape is reused
  // for a skill's contents in the editor, where the description lives on the
  // skill itself rather than on its contents.
  skill_description?: string;
}

export class ConceptCard {
  _explanation: SubtitledHtml;
  _recordedVoiceovers: RecordedVoiceovers;
  _skillDescription: string;

  constructor(
    explanation: SubtitledHtml,
    recordedVoiceovers: RecordedVoiceovers,
    skillDescription: string = ''
  ) {
    this._explanation = explanation;
    this._recordedVoiceovers = recordedVoiceovers;
    this._skillDescription = skillDescription;
  }

  toBackendDict(): ConceptCardBackendDict {
    const conceptCardBackendDict: ConceptCardBackendDict = {
      explanation: this._explanation.toBackendDict(),
      recorded_voiceovers: this._recordedVoiceovers.toBackendDict(),
    };
    // A skill's contents carry no description, so the key is only added back
    // when it came from the concept card handler. This keeps the dict a skill
    // sends to the backend unchanged.
    if (this._skillDescription) {
      conceptCardBackendDict.skill_description = this._skillDescription;
    }
    return conceptCardBackendDict;
  }

  // The skill description is shown as the concept card's heading, and is
  // translated alongside the explanation.
  getSkillDescription(): string {
    return this._skillDescription;
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
      ),
      conceptCardBackendDict.skill_description
    );
  }
}
