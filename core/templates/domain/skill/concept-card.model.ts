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
import {
  WorkedExample,
  WorkedExampleBackendDict,
} from 'domain/skill/worked-example.model';

export interface ConceptCardBackendDict {
  explanation: SubtitledHtmlBackendDict;
  worked_examples: WorkedExampleBackendDict[];
  recorded_voiceovers: RecordedVoiceOverBackendDict;
}

export class ConceptCard {
  _explanation: SubtitledHtml;
  _workedExamples: WorkedExample[];
  _recordedVoiceovers: RecordedVoiceovers;

  constructor(
    explanation: SubtitledHtml,
    workedExamples: WorkedExample[],
    recordedVoiceovers: RecordedVoiceovers
  ) {
    this._explanation = explanation;
    this._workedExamples = workedExamples;
    this._recordedVoiceovers = recordedVoiceovers;
  }

  toBackendDict(): ConceptCardBackendDict {
    return {
      explanation: this._explanation.toBackendDict(),
      worked_examples: this._workedExamples.map(
        (workedExample: WorkedExample) => {
          return workedExample.toBackendDict();
        }
      ),
      recorded_voiceovers: this._recordedVoiceovers.toBackendDict(),
    };
  }

  _getElementsInFirstSetButNotInSecond(
    setA: Set<string>,
    setB: Set<string>
  ): string[] {
    let diffList = Array.from(setA).filter(element => {
      return !setB.has(element);
    });
    return diffList;
  }

  _extractAvailableContentIdsFromWorkedExamples(
    workedExamples: WorkedExample[]
  ): Set<string> {
    let contentIds: Set<string> = new Set();
    workedExamples.forEach((workedExample: WorkedExample) => {
      let question = workedExample.getQuestion();
      if (question.contentId !== null) {
        contentIds.add(question.contentId);
      }
      let explanation = workedExample.getExplanation();
      if (explanation.contentId !== null) {
        contentIds.add(explanation.contentId);
      }
    });
    return contentIds;
  }

  getExplanation(): SubtitledHtml {
    return this._explanation;
  }

  setExplanation(explanation: SubtitledHtml): void {
    this._explanation = explanation;
  }

  getWorkedExamples(): WorkedExample[] {
    return this._workedExamples.slice();
  }

  setWorkedExamples(workedExamples: WorkedExample[]): void {
    let oldContentIds = this._extractAvailableContentIdsFromWorkedExamples(
      this._workedExamples
    );

    this._workedExamples = workedExamples.slice();

    let newContentIds = this._extractAvailableContentIdsFromWorkedExamples(
      this._workedExamples
    );

    let contentIdsToDelete = this._getElementsInFirstSetButNotInSecond(
      oldContentIds,
      newContentIds
    );
    let contentIdsToAdd = this._getElementsInFirstSetButNotInSecond(
      newContentIds,
      oldContentIds
    );

    for (let i = 0; i < contentIdsToDelete.length; i++) {
      this._recordedVoiceovers.deleteContentId(contentIdsToDelete[i]);
    }
    for (let i = 0; i < contentIdsToAdd.length; i++) {
      this._recordedVoiceovers.addContentId(contentIdsToAdd[i]);
    }
  }

  getRecordedVoiceovers(): RecordedVoiceovers {
    return this._recordedVoiceovers;
  }

  static _generateWorkedExamplesFromBackendDict(
    workedExampleDicts: WorkedExampleBackendDict[]
  ): WorkedExample[] {
    return workedExampleDicts.map(workedExampleDict => {
      return WorkedExample.createFromBackendDict(workedExampleDict);
    });
  }

  static createFromBackendDict(
    conceptCardBackendDict: ConceptCardBackendDict
  ): ConceptCard {
    return new ConceptCard(
      SubtitledHtml.createFromBackendDict(conceptCardBackendDict.explanation),
      this._generateWorkedExamplesFromBackendDict(
        conceptCardBackendDict.worked_examples
      ),
      RecordedVoiceovers.createFromBackendDict(
        conceptCardBackendDict.recorded_voiceovers
      )
    );
  }
}
