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
 * @fileoverview Frontend domain object for visualization info.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerStats } from
  'domain/exploration/AnswerStatsObjectFactory';
import { IInteractionAnswer } from
  'interactions/answer-defs';

export interface IAnswerStatsBackendDict {
  'answer': IInteractionAnswer;
  'frequency': number;

  // N/A when the visualization can not present addressed answers.
  //
  // For example, for SetInput interactions the individual answer elements are
  // not generally intended to be used as a single response to SetInput
  // interactions, so we omit addressed information entirely.
  'is_addressed'?: boolean;
}

export type Option = string | string[];

export interface IVisualizationInfoBackendDict {
    'addressed_info_is_supported': boolean;
    'data': IAnswerStatsBackendDict[];
    'id': string;
    'options': {
      [name: string]: Option
  };
}

export class VisualizationInfo {
  addressedInfoIsSupported: boolean;
  data: AnswerStats[];
  id: string;
  options: {
    [name: string]: Object;
  };

  constructor(
      addressedInfoIsSupported: boolean, data: AnswerStats[], id: string,
      options: { [name: string]: Object; }) {
    this.addressedInfoIsSupported = addressedInfoIsSupported;
    this.data = data;
    this.id = id;
    this.options = options;
  }
}

@Injectable({
  providedIn: 'root'
})
export class VisualizationInfoObjectFactory {
  createFromBackendDict(
      backendDict: IVisualizationInfoBackendDict): VisualizationInfo {
    let answerStatsDicts = backendDict.data;
    let answerStatsObjects = answerStatsDicts.map((
        answerStatsDict: IAnswerStatsBackendDict) => {
      let answerHtml = (typeof answerStatsDict.answer === 'string') ?
      answerStatsDict.answer : JSON.stringify(answerStatsDict.answer);
      return new AnswerStats(
        answerStatsDict.answer, answerHtml, answerStatsDict.frequency,
        answerStatsDict.is_addressed);
    });

    return new VisualizationInfo(
      backendDict.addressed_info_is_supported, answerStatsObjects,
      backendDict.id, backendDict.options);
  }
}

angular.module('oppia').factory(
  'VisualizationInfoObjectFactory',
  downgradeInjectable(VisualizationInfoObjectFactory));
