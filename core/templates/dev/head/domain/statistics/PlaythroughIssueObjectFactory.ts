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
 * @fileoverview Factory for creating new frontend instances of Exploration
 *     Issue domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class ExplorationIssue {
  issueType: string;
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'issueCustomizationArgs' is a dict with possible
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing.
  issueCustomizationArgs: any;
  playthroughIds: string[];
  schemaVersion: number;
  isValid: boolean;

  /**
   * @constructor
   * @param {string} issueType - type of an issue.
   * @param {Object.<string, *>} issueCustomizationArgs - customization dict for
   *   an issue.
   * @param {string[]} playthroughIds - list of playthrough IDs.
   * @param {number} schemaVersion - schema version of the class instance.
   * @param {boolean} isValid - whether the issue is valid.
   */
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'issueCustomizationArgs' is a dict with possible
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing.
  constructor(
      issueType: string, issueCustomizationArgs: any, playthroughIds: string[],
      schemaVersion: number, isValid: boolean) {
    /** @type {string} */
    this.issueType = issueType;
    /** @type {Object.<string, *>} */
    this.issueCustomizationArgs = issueCustomizationArgs;
    /** @type {string[]} */
    this.playthroughIds = playthroughIds;
    /** @type {number} */
    this.schemaVersion = schemaVersion;
    /** @type {boolean} */
    this.isValid = isValid;
  }

  /**
   * @returns {ExplorationIssueBackendDict}
   */
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased keys which
  // give tslint errors against underscore_casing in favor of camelCasing.
  toBackendDict(): any {
    return {
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      playthrough_ids: this.playthroughIds,
      schema_version: this.schemaVersion,
      is_valid: this.isValid
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughIssueObjectFactory {
  /**
   * @typedef ExplorationIssueBackendDict
   * @property {string} issueType - type of an issue.
   * @property {Object.<string, *>} issueCustomizationArgs - customization dict
   *   for an issue.
   * @property {string[]} playthroughIds - list of playthrough IDs.
   * @property {number} schemaVersion - schema version of the class instance.
   * @property {boolean} isValid - whether the issue is valid.
   */
  /**
   * @param {ExplorationIssueBackendDict} explorationIssueBackendDict
   * @returns {ExplorationIssue}
   */
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'explorationIssueBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(explorationIssueBackendDict: any): ExplorationIssue {
    return new ExplorationIssue(
      explorationIssueBackendDict.issue_type,
      explorationIssueBackendDict.issue_customization_args,
      explorationIssueBackendDict.playthrough_ids,
      explorationIssueBackendDict.schema_version,
      explorationIssueBackendDict.is_valid);
  }
}

angular.module('oppia').factory(
  'PlaythroughIssueObjectFactory',
  downgradeInjectable(PlaythroughIssueObjectFactory));
