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
 * story contents domain objects.
 */

oppia.factory('StoryContentsObjectFactory', ['StoryNodeObjectFactory',
  function(StoryNodeObjectFactory) {
    var StoryContents = function(initialNodeId, nodes, nextNodeId) {
      this._initialNodeId = initialNodeId;
      this._nodes = nodes;
      this._nextNodeId = nextNodeId;
    };

    // Instance methods

    StoryContents.prototype.getInitialNodeId = function() {
      return this._initialNodeId;
    };

    StoryContents.prototype.getNextNodeId = function() {
      return this._nextNodeId;
    };

    StoryContents.prototype.getNodes = function() {
      return this._nodes;
    };

    StoryContents.prototype.setInitialNodeId = function(nodeId) {
      if (this.getNodeIndex(nodeId) === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      return this._initialNodeId = nodeId;
    };

    StoryContents.prototype.addNode = function() {
      this._nodes.push(StoryNodeObjectFactory.createFromId(this._nextNodeId));
      this._nextNodeId = this.incrementNodeId(this._nextNodeId);
    };

    StoryContents.prototype.getNodeIndex = function(nodeId) {
      for (var i = 0; i < this._nodes.length; i++) {
        if (this._nodes[i].getId() === nodeId) {
          return i;
        }
      }
      return -1;
    };

    StoryContents.prototype.deleteNode = function(nodeId) {
      if (this.getNodeIndex(nodeId) === -1) {
        throw Error('The node does not exist');
      }
      if (nodeId === this._initialNodeId) {
        throw Error('Cannot delete initial story node');
      }
      for (var i = 0; i < this._nodes.length; i++) {
        if (this._nodes[i].getDestinationNodeIds().indexOf(nodeId) !== -1) {
          this._nodes[i].removeDestinationNodeId(nodeId);
        }
      }
      this._nodes.splice(this.getNodeIndex(nodeId), 1);
    };

    StoryContents.prototype.setNodeOutline = function(nodeId, outline) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].setOutline(outline);
    };

    StoryContents.prototype.setNodeExplorationId = function(
        nodeId, explorationId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      for (var i = 0; i < this._nodes.length; i++) {
        if (this._nodes[i].getExplorationId() === explorationId) {
          throw Error('The given exploration already exists in the story.');
        }
      }
      this._nodes[index].setExplorationId(outline);
    };

    StoryContents.prototype.markNodeOutlineAsFinalized = function(nodeId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].markOutlineAsFinalized();
    };

    StoryContents.prototype.markNodeOutlineAsNotFinalized = function(nodeId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].markOutlineAsNotFinalized();
    };

    StoryContents.prototype.addPrerequisiteSkillIdToNode = function(
        nodeId, skillId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].addPrerequisiteSkillId(skillId);
    };

    StoryContents.prototype.removePrerequisiteSkillIdFromNode = function(
        nodeId, skillId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].removePrerequisiteSkillId(skillId);
    };

    StoryContents.prototype.addAcquiredSkillIdToNode = function(
        nodeId, skillId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].addAcquiredSkillId(skillId);
    };

    StoryContents.prototype.removeAcquiredSkillIdFromNode = function(
        nodeId, skillId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].removeAcquiredSkillId(skillId);
    };

    StoryContents.prototype.addDestinationNodeIdToNode = function(
        nodeId, destinationNodeId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      if (this.getNodeIndex(destinationNodeId) === -1) {
        throw Error('The destination node with given id doesn\'t exist');
      }
      this._nodes[index].addDestinationNodeId(destinationNodeId);
    };

    StoryContents.prototype.removeDestinationNodeIdFromNode = function(
        nodeId, destinationNodeId) {
      var index = this.getNodeIndex(nodeId);
      if (index === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      this._nodes[index].removeDestinationNodeId(destinationNodeId);
    };

    StoryContents.incrementNodeId = function(nodeId) {
      var index = parseInt(nodeId.replace('node_', ''));
      ++index;
      return 'node_' + index;
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // story python dict.
    StoryContents.createFromBackendDict = function(storyContentsBackendObject) {
      var nodes = [];
      for (var i = 0; i < storyContentsBackendObject.nodes.length; i++) {
        nodes.push(
          StoryNodeObjectFactory.createFromBackendDict(
            storyContentsBackendObject.nodes[i]));
      }
      return new StoryContents(
        storyContentsBackendObject.initial_node_id, nodes,
        storyContentsBackendObject.next_node_id
      );
    };
    return StoryContents;
  }
]);
