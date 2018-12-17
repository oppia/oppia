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

oppia.factory('PlaythroughIssueObjectFactory', [function() {
  /**
   * @constructor
   * @param {string} issueType - type of an issue.
   * @param {Object.<string, *>} issueCustomizationArgs - customization dict for
   *   an issue.
   * @param {string[]} playthroughIds - list of playthrough IDs.
   * @param {number} schemaVersion - schema version of the class instance.
   * @param {boolean} isValid - whether the issue is valid.
   */
  var ExplorationIssue = function(
      issueType, issueCustomizationArgs, playthroughIds, schemaVersion,
      isValid) {
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
  };

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
  ExplorationIssue.createFromBackendDict = function(
      explorationIssueBackendDict) {
    return new ExplorationIssue(
      explorationIssueBackendDict.issue_type,
      explorationIssueBackendDict.issue_customization_args,
      explorationIssueBackendDict.playthrough_ids,
      explorationIssueBackendDict.schema_version,
      explorationIssueBackendDict.is_valid);
  };

  /**
   * @returns {ExplorationIssueBackendDict}
   */
  ExplorationIssue.prototype.toBackendDict = function() {
    return {
      issue_type: this.issueType,
      issue_customization_args: this.issueCustomizationArgs,
      playthrough_ids: this.playthroughIds,
      schema_version: this.schemaVersion,
      is_valid: this.isValid
    };
  };

  return ExplorationIssue;
}]);
