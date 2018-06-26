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

oppia.factory('LearnerActionObjectFactory', [function() {
  /**
   * @constructor
   * @param {string} actionType - type of an action.
   * @param {Object.<string, *>} actionCustomizationArgs - customization dict
   *   for an action.
   * @param {number} schemaVersion - schema version of the class instance.
   */
  var LearnerAction = function(
      actionType, actionCustomizationArgs, schemaVersion) {
    /** @type {string} */
    this.actionType = actionType;
    /** @type {Object.<string, *>} */
    this.actionCustomizationArgs = actionCustomizationArgs;
    /** @type {number} */
    this.schemaVersion = schemaVersion;
  };

  /**
   * @property {string} actionType - type of an action
   * @property {Object.<string, *>} actionCustomizationArgs - customization dict
   *   for an action
   * @property {number} schemaVersion - schema version of the class instance
   * @returns {LearnerAction}
   */
  LearnerAction.createNew = function(
      actionType, actionCustomizationArgs, schemaVersion) {
    return new LearnerAction(
      actionType, actionCustomizationArgs, schemaVersion);
  };

  /**
   * @typedef LearnerActionBackendDict
   * @property {string} actionType - type of an action.
   * @property {Object.<string, *>} actionCustomizationArgs - customization dict
   *   for an action.
   * @property {number} schemaVersion - schema version of the class instance.
   */
  /**
   * @param {LearnerActionBackendDict} learnerActionBackendDict
   * @returns {LearnerAction}
   */
  LearnerAction.createFromBackendDict = function(learnerActionBackendDict) {
    return new LearnerAction(
      learnerActionBackendDict.action_type,
      learnerActionBackendDict.action_customization_args,
      learnerActionBackendDict.schema_version);
  };

  /** @returns {LearnerActionBackendDict} */
  LearnerAction.prototype.toBackendDict = function() {
    return {
      action_type: this.actionType,
      action_customization_args: this.actionCustomizationArgs,
      schema_version: this.schemaVersion
    };
  };

  return LearnerAction;
}]);
