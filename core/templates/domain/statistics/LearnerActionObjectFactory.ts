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

export interface ILearnerActionExplorationStart {
  // NOTE TO DEVELOPERS: The following two definitions are NOT typos! These are
  // discriminated unions, a feature of TypeScript. Code will fail to compile if
  // the compiler can not deduce that action_type and schema_version are set to
  // the following values. For details see:
  // https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions eslint-disable max-len
  'action_type': 'ExplorationStart';
  'schema_version': 1;
  'action_customization_args': IExplorationStartCustomizationArgs;
}

export interface ILearnerActionAnswerSubmit {
  // NOTE TO DEVELOPERS: The following two definitions are NOT typos! These are
  // discriminated unions, a feature of TypeScript. Code will fail to compile if
  // the compiler can not deduce that action_type and schema_version are set to
  // the following values. For details see:
  // https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions eslint-disable max-len
  'action_type': 'AnswerSubmit';
  'schema_version': 1;
  'action_customization_args': IAnswerSubmitCustomizationArgs;
}

export interface ILearnerActionExplorationQuit {
  // NOTE TO DEVELOPERS: The following two definitions are NOT typos! These are
  // discriminated unions, a feature of TypeScript. Code will fail to compile if
  // the compiler can not deduce that action_type and schema_version are set to
  // the following values. For details see:
  // https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions eslint-disable max-len
  'action_type': 'ExplorationQuit';
  'schema_version': 1;
  'action_customization_args': IExplorationQuitCustomizationArgs;
}

export type ILearnerAction = (
  ILearnerActionExplorationStart |
  ILearnerActionAnswerSubmit |
  ILearnerActionExplorationQuit);

@Injectable({
  providedIn: 'root'
})
export class LearnerActionObjectFactory {
  createExplorationStartAction(
      actionCustomizationArgs:
        IExplorationStartCustomizationArgs): ILearnerActionExplorationStart {
    return {
      action_type: 'ExplorationStart',
      action_customization_args: actionCustomizationArgs,
      schema_version: 1,
    };
  }

  createAnswerSubmitAction(
      actionCustomizationArgs:
        IAnswerSubmitCustomizationArgs): ILearnerActionAnswerSubmit {
    return {
      action_type: 'AnswerSubmit',
      action_customization_args: actionCustomizationArgs,
      schema_version: 1,
    };
  }

  createExplorationQuitAction(
      actionCustomizationArgs:
        IExplorationQuitCustomizationArgs): ILearnerActionExplorationQuit {
    return {
      action_type: 'ExplorationQuit',
      action_customization_args: actionCustomizationArgs,
      schema_version: 1,
    };
  }
}

angular.module('oppia').factory(
  'LearnerActionObjectFactory',
  downgradeInjectable(LearnerActionObjectFactory));
