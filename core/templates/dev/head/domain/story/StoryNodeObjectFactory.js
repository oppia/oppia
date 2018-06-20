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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story node domain objects.
 */

oppia.factory('StoryNodeObjectFactory', [
  function() {
    var StoryNode = function(
        id, destinationNodeIds, prerequisiteSkillIds, acquiredSkillIds, outline,
        outlineIsFinalized, explorationId) {
      this._id = id;
      this._destinationNodeIds = destinationNodeIds;
      this._prerequisiteSkillIds = prerequisiteSkillIds;
      this._acquiredSkillIds = acquiredSkillIds;
      this._outline = outline;
      this._outlineIsFinalized = outlineIsFinalized;
      this._explorationId = explorationId;
    };

    // Instance methods

    StoryNode.prototype.getId = function() {
      return this._id;
    };

    StoryNode.prototype.getExplorationId = function() {
      return this._explorationId;
    };

    StoryNode.prototype.setExplorationId = function(explorationId) {
      this._explorationId = explorationId;
    };

    StoryNode.prototype.getOutline = function() {
      return this._outline;
    };

    StoryNode.prototype.setOutline = function(outline) {
      this._outline = outline;
    };

    StoryNode.prototype.isOutlineFinalized = function() {
      return this._outlineIsFinalized;
    };

    StoryNode.prototype.markNodeAsFinalized = function() {
      this._outlineIsFinalized = true;
    };

    StoryNode.prototype.markNodeAsNotFinalized = function() {
      this._outlineIsFinalized = false;
    };

    StoryNode.prototype.getDestinationNodeIds = function() {
      return this._destinationNodeIds.slice();
    };

    StoryNode.prototype.addDestinationNodeId = function(destinationNodeid) {
      if (this._destinationNodeIds.indexOf(destinationNodeid) !== -1) {
        throw Error('The given node is already a destination node.');
      }
      this._destinationNodeIds.push(destinationNodeid);
    };

    StoryNode.prototype.removeDestinationNodeId = function(destinationNodeid) {
      var index = this._destinationNodeIds.indexOf(destinationNodeid);
      if (index === -1) {
        throw Error('The given node is not a destination node.');
      }
      this._destinationNodeIds.splice(index, 1);
    };

    StoryNode.prototype.getAcquiredSkillIds = function() {
      return this._acquiredSkillIds.slice();
    };

    StoryNode.prototype.addAcquiredSkillId = function(acquiredSkillid) {
      if (this._acquiredSkillIds.indexOf(acquiredSkillid) !== -1) {
        throw Error('The given skill is already an acquired skill.');
      }
      this._acquiredSkillIds.push(acquiredSkillid);
    };

    StoryNode.prototype.removeAcquiredSkillId = function(skillId) {
      var index = this._acquiredSkillIds.indexOf(skillId);
      if (index === -1) {
        throw Error('The given skill is not an acquired skill.');
      }
      this._acquiredSkillIds.splice(index, 1);
    };

    StoryNode.prototype.getPrerequisiteSkillIds = function() {
      return this._prerequisiteSkillIds.slice();
    };

    StoryNode.prototype.addPrerequisiteSkillId = function(skillId) {
      if (this._prerequisiteSkillIds.indexOf(skillId) !== -1) {
        throw Error('The given skill id is already a prerequisite skill.');
      }
      this._prerequisiteSkillIds.push(skillId);
    };

    StoryNode.prototype.removePrerequisiteSkillId = function(skillId) {
      var index = this._prerequisiteSkillIds.indexOf(skillId);
      if (index === -1) {
        throw Error('The given skill id is not a prerequisite skill.');
      }
      this._prerequisiteSkillIds.splice(index, 1);
    };
    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // story python dict.
    StoryNode.createFromBackendDict = function(storyNodeBackendObject) {
      return new StoryNode(
        storyNodeBackendObject.id, storyNodeBackendObject.destination_node_ids,
        storyNodeBackendObject.prerequisite_skill_ids,
        storyNodeBackendObject.acquired_skill_ids,
        storyNodeBackendObject.outline,
        storyNodeBackendObject.outline_is_finalized,
        storyNodeBackendObject.exploration_id
      );
    };

    StoryNode.createFromId = function(nodeId) {
      return new StoryNode(nodeId, [], [], [], '', false, null);
    };
    return StoryNode;
  }
]);
