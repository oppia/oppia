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

export interface ILearnerActionExplorationStartBackendDict {
  // NOTE TO DEVELOPERS: The following two definitions are NOT typos! These are
  // discriminated unions, a feature of TypeScript. Code will fail to compile if
  // the compiler can not deduce that action_type and schema_version are set to
  // the following values. For details see:
  // https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
  'action_type': 'ExplorationStart';
  'schema_version': 1;
  'action_customization_args': IExplorationStartCustomizationArgs;
}

export interface ILearnerActionAnswerSubmitBackendDict {
  // NOTE TO DEVELOPERS: The following two definitions are NOT typos! These are
  // discriminated unions, a feature of TypeScript. Code will fail to compile if
  // the compiler can not deduce that action_type and schema_version are set to
  // the following values. For details see:
  // https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
  'action_type': 'AnswerSubmit';
  'schema_version': 1;
  'action_customization_args': IAnswerSubmitCustomizationArgs;
}

export interface ILearnerActionExplorationQuitBackendDict {
  // NOTE TO DEVELOPERS: The following two definitions are NOT typos! These are
  // discriminated unions, a feature of TypeScript. Code will fail to compile if
  // the compiler can not deduce that action_type and schema_version are set to
  // the following values. For details see:
  // https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions
  'action_type': 'ExplorationQuit';
  'schema_version': 1;
  'action_customization_args': IExplorationQuitCustomizationArgs;
}

export type ILearnerActionBackendDict = (
  ILearnerActionExplorationStartBackendDict |
  ILearnerActionAnswerSubmitBackendDict |
  ILearnerActionExplorationQuitBackendDict);

export class LearnerActionExplorationStart {
  actionType: 'ExplorationStart' = 'ExplorationStart';
  schemaVersion: 1 = 1;
  actionCustomizationArgs: IExplorationStartCustomizationArgs;

  constructor(actionCustomizationArgs: IExplorationStartCustomizationArgs) {
    this.actionCustomizationArgs = actionCustomizationArgs;
  }

  toBackendDict(): ILearnerActionExplorationStartBackendDict {
    return {
      action_type: this.actionType,
      schema_version: this.schemaVersion,
      action_customization_args: this.actionCustomizationArgs,
    }
  }
}

export class LearnerActionAnswerSubmit {
  actionType: 'AnswerSubmit' = 'AnswerSubmit';
  schemaVersion: 1 = 1;
  actionCustomizationArgs: IAnswerSubmitCustomizationArgs;

  constructor(actionCustomizationArgs: IAnswerSubmitCustomizationArgs) {
    this.actionCustomizationArgs = actionCustomizationArgs;
  }

  toBackendDict(): ILearnerActionAnswerSubmitBackendDict {
    return {
      action_type: this.actionType,
      schema_version: this.schemaVersion,
      action_customization_args: this.actionCustomizationArgs,
    };
  }
}

export class LearnerActionExplorationQuit {
  actionType: 'ExplorationQuit' = 'ExplorationQuit';
  schemaVersion: 1 = 1;
  actionCustomizationArgs: IExplorationQuitCustomizationArgs;

  constructor(actionCustomizationArgs: IExplorationQuitCustomizationArgs) {
    this.actionCustomizationArgs = actionCustomizationArgs;
  }

  toBackendDict(): ILearnerActionExplorationQuitBackendDict {
    return {
      action_type: this.actionType,
      schema_version: this.schemaVersion,
      action_customization_args: this.actionCustomizationArgs,
    };
  }
}

export type LearnerAction = (
  LearnerActionExplorationStart |
  LearnerActionAnswerSubmit |
  LearnerActionExplorationQuit);

@Injectable({
  providedIn: 'root'
})
export class LearnerActionObjectFactory {
  createFromBackendDict(backendDict: ILearnerActionBackendDict): LearnerAction {
    switch (backendDict.schema_version) {
      case 1:
        break;
      default:
        throw new Error(
          'Backend dict has unsupported schema version: ' + backendDict);
    }
    switch (backendDict.action_type) {
      case 'ExplorationStart':
        return new LearnerActionExplorationStart(
          backendDict.action_customization_args);
      case 'AnswerSubmit':
        return new LearnerActionAnswerSubmit(
          backendDict.action_customization_args);
      case 'ExplorationQuit':
        return new LearnerActionExplorationQuit(
          backendDict.action_customization_args);
      default:
        // NOTE TO DEVELOPERS: This branch will fail to compile if a new action
        // type is introduced without being added to this switch statement.
        const invalidBackendDict: never = backendDict;
        throw new Error(
          'Backend dict has unknown action type: ' + invalidBackendDict);
    }
  }

  createExplorationStartAction(
      actionCustomizationArgs:
        IExplorationStartCustomizationArgs): LearnerActionExplorationStart {
    return new LearnerActionExplorationStart(actionCustomizationArgs);
  }

  createAnswerSubmitAction(
      actionCustomizationArgs:
        IAnswerSubmitCustomizationArgs): LearnerActionAnswerSubmit {
    return new LearnerActionAnswerSubmit(actionCustomizationArgs);
  }

  createExplorationQuitAction(
      actionCustomizationArgs:
        IExplorationQuitCustomizationArgs): LearnerActionExplorationQuit {
    return new LearnerActionExplorationQuit(actionCustomizationArgs);
  }
}

angular.module('oppia').factory(
  'LearnerActionObjectFactory',
  downgradeInjectable(LearnerActionObjectFactory));
