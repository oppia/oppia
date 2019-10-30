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

export class LearnerAction {
  actionType: string;
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'outcome' is an outcome domain object and this can be
  // directly typed to 'Outcome' type once 'OutcomeObjectFactory' is upgraded.
  actionCustomizationArgs: any;
  schemaVersion: number;
  /**
   * @constructor
   * @param {string} actionType - type of an action.
   * @param {Object.<string, *>} actionCustomizationArgs - customization dict
   *   for an action.
   * @param {number} schemaVersion - schema version of the class instance.
   */
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'outcome' is an outcome domain object and this can be
  // directly typed to 'Outcome' type once 'OutcomeObjectFactory' is upgraded.
  constructor(
      actionType: string, actionCustomizationArgs: any, schemaVersion: number) {
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

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  toBackendDict(): any {
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
      actionType: string, actionCustomizationArgs: any,
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
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'learnerActionBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(learnerActionBackendDict: any): LearnerAction {
    return new LearnerAction(
      learnerActionBackendDict.action_type,
      learnerActionBackendDict.action_customization_args,
      learnerActionBackendDict.schema_version);
  }
}

angular.module('oppia').factory(
  'LearnerActionObjectFactory',
  downgradeInjectable(LearnerActionObjectFactory));
