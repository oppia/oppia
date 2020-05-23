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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import {
  IRecordedVoiceoversBackendDict,
  RecordedVoiceovers, RecordedVoiceoversObjectFactory
} from 'domain/exploration/RecordedVoiceoversObjectFactory';
import {
  ISubtitledHtmlBackendDict, SubtitledHtml, SubtitledHtmlObjectFactory
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import {
  IWorkedExampleBackendDict, WorkedExample, WorkedExampleObjectFactory
} from 'domain/skill/WorkedExampleObjectFactory';

export interface IConceptCardBackendDict {
  /* eslint-disable camelcase */
  explanation: ISubtitledHtmlBackendDict,
  worked_examples: IWorkedExampleBackendDict[],
  recorded_voiceovers: IRecordedVoiceoversBackendDict
  /* eslint-enable camelcase */
}

export class ConceptCard {
  constructor(
      private explanation: SubtitledHtml,
      private workedExamples: WorkedExample[],
      private recordedVoiceovers: RecordedVoiceovers) {}

  toBackendDict(): IConceptCardBackendDict {
    return {
      explanation: this.explanation.toBackendDict(),
      worked_examples: this.workedExamples.map(e => e.toBackendDict()),
      recorded_voiceovers: this.recordedVoiceovers.toBackendDict()
    };
  }

  private getSetDifference(setA: Set<string>, setB: Set<string>): string[] {
    return Array.from(setA).filter(e => !setB.has(e));
  }

  private getAvailableContentIdsFromWorkedExamples(
      workedExamples: WorkedExample[]): Set<string> {
    const contentIds: Set<string> = new Set();
    workedExamples.forEach((workedExample: WorkedExample) => {
      contentIds.add(workedExample.getQuestion().getContentId());
      contentIds.add(workedExample.getExplanation().getContentId());
    });
    return contentIds;
  }

  getExplanation(): SubtitledHtml {
    return this.explanation;
  }

  setExplanation(explanation: SubtitledHtml): void {
    this.explanation = explanation;
  }

  getWorkedExamples(): WorkedExample[] {
    return this.workedExamples.slice();
  }

  setWorkedExamples(newWorkedExamples: WorkedExample[]): void {
    const oldContentIds = this.getAvailableContentIdsFromWorkedExamples(
      this.workedExamples);

    this.workedExamples = newWorkedExamples.slice();
    const newContentIds = this.getAvailableContentIdsFromWorkedExamples(
      this.workedExamples);

    const contentIdsToDelete = (
      this.getSetDifference(oldContentIds, newContentIds));
    for (const contentIdToDelete of contentIdsToDelete) {
      this.recordedVoiceovers.deleteContentId(contentIdToDelete);
    }

    const contentIdsToAdd = this.getSetDifference(newContentIds, oldContentIds);
    for (const contentIdToAdd of contentIdsToAdd) {
      this.recordedVoiceovers.addContentId(contentIdToAdd);
    }
  }

  getRecordedVoiceovers(): RecordedVoiceovers {
    return this.recordedVoiceovers;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ConceptCardObjectFactory {
  constructor(
      private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
      private recordedVoiceoversObjectFactory:
          RecordedVoiceoversObjectFactory,
      private workedExampleObjectFactory: WorkedExampleObjectFactory) {}

  private generateWorkedExamplesFromBackendDict(
      workedExampleBackendDicts: IWorkedExampleBackendDict[]): WorkedExample[] {
    return workedExampleBackendDicts.map(
      dict => this.workedExampleObjectFactory.createFromBackendDict(dict));
  }

  // Create an interstitial concept card that would be displayed in the
  // editor until the actual skill is fetched from the backend.
  createInterstitialConceptCard(): ConceptCard {
    const recordedVoiceoversDict = {
      voiceovers_mapping: {
        COMPONENT_NAME_EXPLANATION: {}
      }
    };
    return new ConceptCard(
      this.subtitledHtmlObjectFactory.createDefault(
        'Loading review material',
        AppConstants.COMPONENT_NAME_EXPLANATION), [],
      this.recordedVoiceoversObjectFactory.createFromBackendDict(
        recordedVoiceoversDict)
    );
  }

  createFromBackendDict(
      conceptCardBackendDict: IConceptCardBackendDict): ConceptCard {
    return new ConceptCard(
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        conceptCardBackendDict.explanation),
      this.generateWorkedExamplesFromBackendDict(
        conceptCardBackendDict.worked_examples),
      this.recordedVoiceoversObjectFactory.createFromBackendDict(
        conceptCardBackendDict.recorded_voiceovers));
  }
}

angular.module('oppia').factory(
  'ConceptCardObjectFactory',
  downgradeInjectable(ConceptCardObjectFactory));
