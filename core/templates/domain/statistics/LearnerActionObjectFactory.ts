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
 * @fileoverview Factory for creating new frontend instances of Learner
 *     Action domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { StatisticsDomainConstants } from
  'domain/statistics/statistics-domain.constants';

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
  actionType: string;
  actionCustomizationArgs: ILearnerActionCustomizationArgs;
  schemaVersion: number;
  /**
   * @constructor
   * @param {string} actionType - type of an action.
   * @param {Object.<string, *>} actionCustomizationArgs - customization dict
   *   for an action.
   * @param {number} schemaVersion - schema version of the class instance.
   */
  constructor(
      actionType: string,
      actionCustomizationArgs: ILearnerActionCustomizationArgs,
      schemaVersion: number) {
    if (schemaVersion < 1) {
      throw new Error('given invalid schema version');
    }

    /** @type {string} */
    this.actionType = actionType;
    /** @type {Object.<string, *>} */
    this.actionCustomizationArgs = actionCustomizationArgs;
    /** @type {number} */
    this.schemaVersion = schemaVersion;
  }

  toBackendDict(): ILearnerActionBackendDict {
    return {
      action_type: this.actionType,
      action_customization_args: this.actionCustomizationArgs,
      schema_version: this.schemaVersion,
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class LearnerActionObjectFactory {
  /**
   * @property {string} actionType - type of an action
   * @property {Object.<string, *>} actionCustomizationArgs - customization
   *   dict for an action
   * @property {number} [schemaVersion=LEARNER_ACTION_SCHEMA_LATEST_VERSION]
   *   - schema version of the class instance.
   * @returns {LearnerAction}
   */
  createNew(
      actionType: string,
      actionCustomizationArgs: ILearnerActionCustomizationArgs,
      schemaVersion: number): LearnerAction {
    schemaVersion = schemaVersion ||
      StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION;
    return new LearnerAction(
      actionType, actionCustomizationArgs, schemaVersion);
  }

  /**
   * @typedef LearnerActionBackendDict
   * @property {string} actionType - type of an action.
   * @property {Object.<string, *>} actionCustomizationArgs - customization
   *   dict for an action.
   * @property {number} schemaVersion - schema version of the class instance.
   *   Defaults to the latest schema version.
   */

  /**
   * @param {LearnerActionBackendDict} learnerActionBackendDict
   * @returns {LearnerAction}
   */
  createFromBackendDict(
      learnerActionBackendDict: ILearnerActionBackendDict): LearnerAction {
    return new LearnerAction(
      learnerActionBackendDict.action_type,
      learnerActionBackendDict.action_customization_args,
      learnerActionBackendDict.schema_version);
  }
}

angular.module('oppia').factory(
  'LearnerActionObjectFactory',
  downgradeInjectable(LearnerActionObjectFactory));
