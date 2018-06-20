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

oppia.factory('PlaythroughObjectFactory', [
  'LearnerActionObjectFactory', function(LearnerActionObjectFactory) {
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
    var Playthrough = function(
        playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
        actions) {
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
    };

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
    Playthrough.createNew = function(
        playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
        actions) {
      return new Playthrough(
        playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
        actions);
    };

    /**
     * @typedef PlaythroughBackendDict
     * @property {string} playthroughId - ID of a playthrough.
     * @property {string} expId - ID of an exploration.
     * @property {number} expVersion - Version of an exploration.
     * @property {string} issueType - type of an issue.
     * @property {Object.<string, *>} issueCustomizationArgs - customization
     *   dict for an issue.
     * @property {LearnerAction[]} actions - list of learner actions.
     */
    /**
     * @typedef
     * @param {PlaythroughBackendDict} playthroughBackendDict
     * @returns {Playthrough}
     */
    Playthrough.createFromBackendDict = function(playthroughBackendDict) {
      var actions = playthroughBackendDict.actions.map(
        LearnerActionObjectFactory.createFromBackendDict);

      return new Playthrough(
        playthroughBackendDict.playthrough_id, playthroughBackendDict.exp_id,
        playthroughBackendDict.exp_version, playthroughBackendDict.issue_type,
        playthroughBackendDict.issue_customization_args, actions);
    };

    /** @returns {PlaythroughBackendDict} */
    Playthrough.prototype.toBackendDict = function() {
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
    };

    return Playthrough;
  }]);
