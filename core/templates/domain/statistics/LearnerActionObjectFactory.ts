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
 * @fileoverview Factory for creating new frontend instances of Learner
 *     Action domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { StatisticsDomainConstants } from 'statistics-domain.constants';

export interface IExplorationStartCustomizationArgs {
  'state_name': {value: string};
}

export interface IAnswerSubmitCustomizationArgs {
  'state_name': {value: string};
  'dest_state_name': {value: string};
  'interaction_id': {value: string};
  'submitted_answer': {value: string};
  'feedback': {value: string};
  'time_spent_state_in_msecs': {value: number};
}

export interface IExplorationQuitCustomizationArgs {
  'state_name': {value: string};
  'time_spent_in_state_in_msecs': {value: number};
}

export type ILearnerActionCustomizationArgs = (
  IExplorationStartCustomizationArgs |
  IAnswerSubmitCustomizationArgs |
  IExplorationQuitCustomizationArgs);

export interface ILearnerActionBackendDict {
  'action_type': string;
  'schema_version': number;
  'action_customization_args': ILearnerActionCustomizationArgs;
}

export class LearnerAction {
  constructor(
      public actionType: string,
      public schemaVersion: number,
      public actionCustomizationArgs: ILearnerActionCustomizationArgs) {
    if (this.schemaVersion < 1) {
      throw new Error('given invalid schema version');
    }
  }

  toBackendDict(): ILearnerActionBackendDict {
    return {
      action_type: this.actionType,
      schema_version: this.schemaVersion,
      action_customization_args: this.actionCustomizationArgs,
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class LearnerActionObjectFactory {
  createFromBackendDict(backendDict: ILearnerActionBackendDict): LearnerAction {
    return new LearnerAction(
      backendDict.action_type,
      backendDict.schema_version,
      backendDict.action_customization_args);
  }

  createExplorationStartAction(
      customizationArgs: IExplorationStartCustomizationArgs): LearnerAction {
    return new LearnerAction(
      AppConstants.ACTION_TYPE_EXPLORATION_START,
      StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION,
      customizationArgs);
  }

  createAnswerSubmitAction(
      customizationArgs: IAnswerSubmitCustomizationArgs): LearnerAction {
    return new LearnerAction(
      AppConstants.ACTION_TYPE_ANSWER_SUBMIT,
      StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION,
      customizationArgs);
  }

  createExplorationQuitAction(
      customizationArgs: IExplorationQuitCustomizationArgs): LearnerAction {
    return new LearnerAction(
      AppConstants.ACTION_TYPE_EXPLORATION_QUIT,
      StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION,
      customizationArgs);
  }
}

angular.module('oppia').factory(
  'LearnerActionObjectFactory',
  downgradeInjectable(LearnerActionObjectFactory));
