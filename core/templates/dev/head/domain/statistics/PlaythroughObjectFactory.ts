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
 * @fileoverview Factory for creating new frontend instances of Playthrough
 *     domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { LearnerAction, LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';

export class Playthrough {
  playthroughId: string;
  expId: string;
  expVersion: number;
  issueType: string;
  issueCustomizationArgs: any;
  actions: any[];
  /**
   * @constructor
   * @param {string} playthroughId - ID of a playthrough.
   * @param {string} expId - ID of an exploration.
   * @param {number} expVersion - Version of an exploration.
   * @param {string} issueType - type of an issue.
   * @param {Object.<string, *>} issueCustomizationArgs - customization dict
   *   for an issue.
   * @param {LearnerAction[]} actions - list of learner actions.
   */
  constructor(
      playthroughId: string, expId: string, expVersion: number,
      issueType: string, issueCustomizationArgs: any,
      actions: LearnerAction[]) {
    /** @type {string} */
    this.playthroughId = playthroughId;
    /** @type {string} */
    this.expId = expId;
    /** @type {number} */
    this.expVersion = expVersion;
    /** @type {string} */
    this.issueType = issueType;
    /** @type {Object.<string, *>} */
    this.issueCustomizationArgs = issueCustomizationArgs;
    /** @type {LearnerAction[]} */
    this.actions = actions;
  }

  /** @returns {PlaythroughBackendDict} */
  toBackendDict(): any {
    var actionDicts = this.actions.map(function(action) {
      return action.toBackendDict();
    });
    return {
      id: this.playthroughId,
      exp_id: this.expId,
      exp_version: this.expVersion,
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      actions: actionDicts
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughObjectFactory {
  constructor(private learnerActionObjectFactory: LearnerActionObjectFactory) {}
  /**
   * @param {string} playthroughId - ID of a playthrough.
   * @param {string} expId - ID of an exploration.
   * @param {number} expVersion - Version of an exploration.
   * @param {string} issueType - type of an issue.
   * @param {Object.<string, *>} issueCustomizationArgs - customization dict
   *   for an issue.
   * @param {LearnerAction[]} actions - list of learner actions.
   * @returns {Playthrough}
   */
  createNew(
      playthroughId: string, expId: string, expVersion: number,
      issueType: string, issueCustomizationArgs: any,
      actions: LearnerAction[]): Playthrough {
    return new Playthrough(
      playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
      actions);
  }

  /**
   * @typedef
   * @param {PlaythroughBackendDict} playthroughBackendDict
   * @returns {Playthrough}
   */
  createFromBackendDict(playthroughBackendDict: any): Playthrough {
    var actions = playthroughBackendDict.actions.map(
      this.learnerActionObjectFactory.createFromBackendDict);

    return new Playthrough(
      playthroughBackendDict.playthrough_id, playthroughBackendDict.exp_id,
      playthroughBackendDict.exp_version, playthroughBackendDict.issue_type,
      playthroughBackendDict.issue_customization_args, actions);
  }
}

angular.module('oppia').factory(
  'PlaythroughObjectFactory', downgradeInjectable(PlaythroughObjectFactory));
