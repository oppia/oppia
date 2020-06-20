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

export interface IMultipleIncorrectSubmissionsCustomizationArgs {
  'state_name': {value: string};
  'num_times_answered_incorrectly': {value: number};
}

export interface ICyclicStateTransitionsCustomizationArgs {
  'state_names': {value: string[]};
}

export interface IEarlyQuitCustomizationArgs {
  'state_name': {value: string};
  'time_spent_in_exp_in_msecs': {value: number};
}

export type IIssueCustomizationArgs = (
  IMultipleIncorrectSubmissionsCustomizationArgs |
  ICyclicStateTransitionsCustomizationArgs |
  IEarlyQuitCustomizationArgs);

export interface IExplorationIssueBackendDict {
  'issue_type': string;
  'issue_customization_args': IIssueCustomizationArgs;
  'playthrough_ids': string[];
  'schema_version': number;
  'is_valid': boolean;
}

export class PlaythroughIssue {
  issueType: string;
  issueCustomizationArgs: IIssueCustomizationArgs;
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
  constructor(
      issueType: string, issueCustomizationArgs: IIssueCustomizationArgs,
      playthroughIds: string[], schemaVersion: number, isValid: boolean) {
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
  toBackendDict(): IExplorationIssueBackendDict {
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
   * @returns {PlaythroughIssue}
   */
  createFromBackendDict(
      explorationIssueBackendDict:
      IExplorationIssueBackendDict): PlaythroughIssue {
    return new PlaythroughIssue(
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
