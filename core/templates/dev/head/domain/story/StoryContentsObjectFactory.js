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

oppia.factory('StoryContentsObjectFactory', [
  'StoryNodeObjectFactory', 'NODE_ID_PREFIX',
  function(StoryNodeObjectFactory, NODE_ID_PREFIX) {
    var StoryContents = function(initialNodeId, nodes, nextNodeId) {
      this._initialNodeId = initialNodeId;
      this._nodes = nodes;
      this._nextNodeId = nextNodeId;
    };

    var getIncrementedNodeId = function(nodeId) {
      var index = parseInt(nodeId.replace(NODE_ID_PREFIX, ''));
      ++index;
      return NODE_ID_PREFIX + index;
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

    StoryContents.prototype.validate = function() {
      var issues = [];
      var nodes = this._nodes;
      for (var i = 0; i < nodes.length; i++) {
        var nodeIssues = nodes[i].validate();
        issues = issues.concat(nodeIssues);
      }
      if (issues.length > 0) {
        return issues;
      }

      // Provided the nodes list is valid and each node in it is valid, the
      // preliminary checks are done to see if the story node graph obtained is
      // valid.
      var nodeIds = nodes.map(function(node) {
        return node.getId();
      });
      for (var i = 0; i < nodeIds.length; i++) {
        var nodeId = nodeIds[i];
        if (nodeIds.indexOf(nodeId) < nodeIds.lastIndexOf(nodeId)) {
          throw Error(
            'The node with id ' + nodeId + ' is duplicated in the story');
        }
      }
      var nextNodeIdNumber = parseInt(
        this._nextNodeId.replace(NODE_ID_PREFIX, ''));
      var initialNodeIsPresent = false;
      for (var i = 0; i < nodes.length; i++) {
        var nodeIdNumber = parseInt(
          nodes[i].getId().replace(NODE_ID_PREFIX, ''));
        if (nodes[i].getId() === this._initialNodeId) {
          initialNodeIsPresent = true;
        }
        if (nodeIdNumber > nextNodeIdNumber) {
          throw Error(
            'Node id out of bounds for node with id ' + nodes[i].getId());
        }
        for (var j = 0; j < nodes[i].getDestinationNodeIds().length; j++) {
          if (nodeIds.indexOf(nodes[i].getDestinationNodeIds()[j]) === -1) {
            issues.push(
              'The node with id ' + nodes[i].getDestinationNodeIds()[j] +
              ' doesn\'t exist');
          }
        }
      }
      if (!initialNodeIsPresent) {
        throw Error(
          'Initial node - ' + this._initialNodeId +
          ' - is not present in the story');
      }

      // All the validations above should be successfully completed before going
      // to validating the story node graph.
      if (issues.length > 0) {
        return issues;
      }

      // nodesQueue stores the pending nodes to visit in a queue form.
      var nodesQueue = [];
      var nodeIsVisited = new Array(nodeIds.length).fill(false);
      var startingNode = nodes[this.getNodeIndex(this._initialNodeId)];
      nodesQueue.push(startingNode.getId());

      // The user is assumed to have all the prerequisite skills of the
      // starting node before starting the story. Also, this list models the
      // skill IDs acquired by a learner as they progress through the story.
      simulatedSkillIds = new Set(startingNode.getPrerequisiteSkillIds());

      // The following loop employs a Breadth First Search from the given
      // starting node and makes sure that the user has acquired all the
      // prerequisite skills required by the destination nodes 'unlocked' by
      // visiting a particular node by the time that node is finished.
      while (nodesQueue.length > 0) {
        var currentNodeIndex = this.getNodeIndex(nodesQueue.shift());
        nodeIsVisited[currentNodeIndex] = true;
        var currentNode = nodes[currentNodeIndex];

        startingNode.getAcquiredSkillIds().forEach(function(skillId) {
          simulatedSkillIds.add(skillId);
        });
        for (var i = 0; i < currentNode.getDestinationNodeIds().length; i++) {
          var nodeId = currentNode.getDestinationNodeIds()[i];
          var nodeIndex = this.getNodeIndex(nodeId);
          // The following condition checks whether the destination node
          // for a particular node, has already been visited, in which case
          // the story would have loops, which are not allowed.
          if (nodeIsVisited[nodeIndex]) {
            issues.push('Loops are not allowed in the node graph');
            // If a loop is encountered, then all further checks are halted,
            // since it can lead to same error being reported again.
            return issues;
          }
          var destinationNode = nodes[nodeIndex];
          destinationNode.getPrerequisiteSkillIds().forEach(function(skillId) {
            if (!simulatedSkillIds.has(skillId)) {
              issues.push(
                'The prerequisite skill with id ' + skillId +
                ' was not completed before node with id ' + nodeId +
                ' was unlocked');
            }
          });
          nodesQueue.push(nodeId);
        }
      }
      for (var i = 0; i < nodeIsVisited.length; i++){
        if (!nodeIsVisited[i]) {
          issues.push(
            'The node with id ' + nodeIds[i] +
            ' is disconnected from the graph');
        }
      }
      return issues;
    };

    StoryContents.prototype.setInitialNodeId = function(nodeId) {
      if (this.getNodeIndex(nodeId) === -1) {
        throw Error('The node with given id doesn\'t exist');
      }
      return this._initialNodeId = nodeId;
    };

    StoryContents.prototype.addNode = function() {
      this._nodes.push(StoryNodeObjectFactory.createFromId(this._nextNodeId));
      this._nextNodeId = getIncrementedNodeId(this._nextNodeId);
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
      this._nodes[index].setExplorationId(explorationId);
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
