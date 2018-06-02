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
  var Playthrough = function(playthroughId, expId, expVersion, issueType,
      issueCustomizationArgs, actions) {
    this.playthroughId = playthroughId;
    this.expId = expId;
    this.expVersion = expVersion;
    this.issueType = issueType;
    this.issueCustomizationArgs = issueCustomizationArgs;
    this.actions = actions;
  };

  Playthrough.create = function(
      playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
      actions) {
    return new Playthrough(
      playthroughId, expId, expVersion, issueType, issueCustomizationArgs,
      actions);
  };

  Playthrough.createFromBackendDict = function(playthroughBackendDict) {
    var actions = [], i;
    for (i=0; i<playthroughBackendDict.actions.length; i++) {
      actions.push(LearnerActionObjectFactory.createFromBackendDict(
        playthroughBackendDict.actions[i]));
    }

    return new Playthrough(
      playthroughBackendDict.playthroughId, playthroughBackendDict.expId,
      playthroughBackendDict.expVersion, playthroughBackendDict.issueType,
      playthroughBackendDict.issueCustomizationArgs, actions);
  };

  return Playthrough;
}]);
