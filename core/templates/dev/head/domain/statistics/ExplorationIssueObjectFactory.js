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

oppia.factory('ExplorationIssueObjectFactory', [function() {
  var ExplorationIssue = function(issueType, issueCustomizationArgs,
      playthroughIds, schemaVersion, isValid) {
    this.issueType = issueType;
    this.issueCustomizationArgs = issueCustomizationArgs;
    this.playthroughIds = playthroughIds;
    this.schemaVersion = schemaVersion;
    this.isValid = isValid;
  };

  ExplorationIssue.create = function(
      issueType, issueCustomizationArgs, playthroughIds, schemaVersion,
      isValid) {
    return new ExplorationIssue(
      issueType, issueCustomizationArgs, playthroughIds, schemaVersion,
      isValid);
  };

  return ExplorationIssue;
}]);
