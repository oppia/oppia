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
import { RecordedVoiceovers, RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { SubtitledHtml, SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';

export class ConceptCard {
  _explanation: SubtitledHtml;
  _workedExamples: Array<SubtitledHtml>;
  _recordedVoiceovers: RecordedVoiceovers;

  constructor(
      explanation: SubtitledHtml, workedExamples: Array<SubtitledHtml>,
      recordedVoiceovers: RecordedVoiceovers) {
    this._explanation = explanation;
    this._workedExamples = workedExamples;
    this._recordedVoiceovers = recordedVoiceovers;
  }
  // TODO(#7165): Replace 'any' with the exact type.
  toBackendDict(): any {
    return {
      explanation: this._explanation.toBackendDict(),
      worked_examples: this._workedExamples.map(
        (workedExample: SubtitledHtml) => {
          return workedExample.toBackendDict();
        }),
      recorded_voiceovers: this._recordedVoiceovers.toBackendDict()
    };
  }

  _getElementsInFirstSetButNotInSecond(setA: Set<string>,
      setB: Set<string>): Array<string> {
    let diffList = Array.from(setA).filter((element) => {
      return !setB.has(element);
    });
    return diffList;
  }

  _extractAvailableContentIdsFromWorkedExamples(
      workedExamples: Array<SubtitledHtml>): Set<string> {
    let contentIds: Set<string> = new Set();
    workedExamples.forEach((workedExample: SubtitledHtml) => {
      contentIds.add(workedExample.getContentId());
    });
    return contentIds;
  }

  getExplanation(): SubtitledHtml {
    return this._explanation;
  }

  setExplanation(explanation: SubtitledHtml): void {
    this._explanation = explanation;
  }

  getWorkedExamples(): Array<SubtitledHtml> {
    return this._workedExamples.slice();
  }

  setWorkedExamples(workedExamples: Array<SubtitledHtml>): void {
    let oldContentIds = this._extractAvailableContentIdsFromWorkedExamples(
      this._workedExamples);

    this._workedExamples = workedExamples.slice();

    let newContentIds = this._extractAvailableContentIdsFromWorkedExamples(
      this._workedExamples);

    let contentIdsToDelete = this._getElementsInFirstSetButNotInSecond(
      oldContentIds, newContentIds);
    let contentIdsToAdd = this._getElementsInFirstSetButNotInSecond(
      newContentIds, oldContentIds);

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
}

@Injectable({
  providedIn: 'root'
})
export class ConceptCardObjectFactory {
  constructor(
      private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
      private recordedVoiceoversObjectFactory:
          RecordedVoiceoversObjectFactory) {}

  // TODO(#7165): Replace 'any' with the exact type. This has been typed
  // as 'any' since 'workedExampleDicts' is a dict having underscore keys.
  _generateWorkedExamplesFromBackendDict(
      workedExampleDicts: any): Array<SubtitledHtml> {
    return workedExampleDicts.map((workedExampleDict: any) => {
      return this.subtitledHtmlObjectFactory.createFromBackendDict(
        workedExampleDict);
    });
  }

  // Create an interstitial concept card that would be displayed in the
  // editor until the actual skill is fetched from the backend.
  createInterstitialConceptCard(): ConceptCard {
    let recordedVoiceoversDict = {
      voiceovers_mapping: {
        COMPONENT_NAME_EXPLANATION: {}
      }
    };
    return new ConceptCard(
      this.subtitledHtmlObjectFactory.createDefault(
        'Loading review material', AppConstants.COMPONENT_NAME_EXPLANATION), [],
      this.recordedVoiceoversObjectFactory.createFromBackendDict(
        recordedVoiceoversDict)
    );
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been typed
  // as 'any' since 'conceptCardBackendDict' is a dict having underscore keys.
  createFromBackendDict(conceptCardBackendDict: any): ConceptCard {
    return new ConceptCard(
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        conceptCardBackendDict.explanation),
      this._generateWorkedExamplesFromBackendDict(
        conceptCardBackendDict.worked_examples),
      this.recordedVoiceoversObjectFactory.createFromBackendDict(
        conceptCardBackendDict.recorded_voiceovers));
  }
}

angular.module('oppia').factory(
  'ConceptCardObjectFactory',
  downgradeInjectable(ConceptCardObjectFactory));
