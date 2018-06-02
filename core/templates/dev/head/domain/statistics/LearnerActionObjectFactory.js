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
  var LearnerAction = function(actionType, actionCustomizationArgs,
      schemaVersion) {
    this.actionType = actionType;
    this.actionCustomizationArgs = actionCustomizationArgs;
    this.schemaVersion = schemaVersion;
  };

  LearnerAction.create = function(
      actionType, actionCustomizationArgs, schemaVersion) {
    return new LearnerAction(
      actionType, actionCustomizationArgs, schemaVersion);
  };

  LearnerAction.createFromBackendDict = function(learnerActionBackendDict) {
    return new LearnerAction(
      learnerActionBackendDict.actionType,
      learnerActionBackendDict.actionCustomizationArgs,
      learnerActionBackendDict.schemaVersion);
  };

  return LearnerAction;
}]);
