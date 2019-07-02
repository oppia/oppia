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
 * @fileoverview Factory for storing frontend story node domain objects in the
 * story viewer.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('ReadOnlyStoryNodeObjectFactory', [function() {
  var StoryNode = function(
      id, title, destinationNodeIds, prerequisiteSkillIds, acquiredSkillIds,
      outline, outlineIsFinalized, explorationId, explorationSummary,
      completed) {
    this._id = id;
    this._title = title;
    this._destinationNodeIds = destinationNodeIds;
    this._prerequisiteSkillIds = prerequisiteSkillIds;
    this._acquiredSkillIds = acquiredSkillIds;
    this._outline = outline;
    this._outlineIsFinalized = outlineIsFinalized;
    this._explorationId = explorationId;
    this._explorationSummaryObject = explorationSummary;
    this._completed = completed;
  };

  // Instance methods

  StoryNode.prototype.getId = function() {
    return this._id;
  };

  StoryNode.prototype.getTitle = function() {
    return this._title;
  };

  StoryNode.prototype.getExplorationId = function() {
    return this._explorationId;
  };

  StoryNode.prototype.isCompleted = function() {
    return this._completed;
  };

  StoryNode.prototype.getExplorationSummaryObject = function() {
    return this._explorationSummaryObject;
  };

  StoryNode.prototype.getOutline = function() {
    return this._outline;
  };

  StoryNode.prototype.getOutlineStatus = function() {
    return this._outlineIsFinalized;
  };

  // Static class methods. Note that "this" is not available in static
  // contexts. This function takes a JSON object which represents a backend
  // story python dict.
  // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  StoryNode['createFromBackendDict'] = function(storyNodeBackendObject) {
  /* eslint-enable dot-notation */
    return new StoryNode(
      storyNodeBackendObject.id, storyNodeBackendObject.title,
      storyNodeBackendObject.destination_node_ids,
      storyNodeBackendObject.prerequisite_skill_ids,
      storyNodeBackendObject.acquired_skill_ids,
      storyNodeBackendObject.outline,
      storyNodeBackendObject.outline_is_finalized,
      storyNodeBackendObject.exploration_id,
      storyNodeBackendObject.exp_summary_dict,
      storyNodeBackendObject.completed
    );
  };

  return StoryNode;
}]);
