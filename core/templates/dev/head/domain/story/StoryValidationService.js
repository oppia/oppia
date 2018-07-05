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
 * @fileoverview Service to validate the consistency of a story. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * story to the backend, which performs similar validation checks to these
 * in story_domain.Story and subsequent domain objects.
 */

oppia.factory('StoryValidationService', [
  'NODE_ID_PREFIX', 'StoryContentsObjectFactory', 'StoryNodeObjectFactory',
  'StoryObjectFactory',
  function(
      NODE_ID_PREFIX, StoryContentsObjectFactory, StoryNodeObjectFactory,
      StoryObjectFactory) {
    var _checkValidNodeId = function(nodeId) {
      if (typeof nodeId !== 'string') {
        return false;
      }
      var nodeIdPattern = new RegExp(NODE_ID_PREFIX + '[0-9]+', 'g');
      if (!nodeId.match(nodeIdPattern)) {
        return false;
      }
      return true;
    };

    var _validateNode = function(node) {
      var issues = [];

      if (!_checkValidNodeId(node.getId())) {
        throw Error('The node id ' + node.getId() + ' is invalid.');
      }
      var prerequisiteSkillIds = node.getPrerequisiteSkillIds();
      var acquiredSkillIds = node.getAcquiredSkillIds();
      var destinationNodeIds = node.getDestinationNodeIds();

      for (var i = 0; i < prerequisiteSkillIds.length; i++) {
        var skillId = prerequisiteSkillIds[i];
        if (prerequisiteSkillIds.indexOf(skillId) <
          prerequisiteSkillIds.lastIndexOf(skillId)) {
          issues.push(
            'The prerequisite skill with id ' + skillId + ' is duplicated in' +
            ' node with id ' + node.getId());
        }
      }
      for (var i = 0; i < acquiredSkillIds.length; i++) {
        var skillId = acquiredSkillIds[i];
        if (acquiredSkillIds.indexOf(skillId) <
          acquiredSkillIds.lastIndexOf(skillId)) {
          issues.push(
            'The acquired skill with id ' + skillId + ' is duplicated in' +
            ' node with id ' + node.getId());
        }
      }
      for (var i = 0; i < prerequisiteSkillIds.length; i++) {
        if (acquiredSkillIds.indexOf(prerequisiteSkillIds[i]) !== -1) {
          issues.push(
            'The skill with id ' + prerequisiteSkillIds[i] + ' is common ' +
            'to both the acquired and prerequisite skill id list in node with' +
            ' id ' + node.getId());
        }
      }
      for (var i = 0; i < destinationNodeIds.length; i++) {
        if (!_checkValidNodeId(destinationNodeIds[i])) {
          throw Error(
            'The destination node id ' + destinationNodeIds[i] + ' is ' +
            'invalid in node with id ' + node.getId());
        }
      }
      if (
        destinationNodeIds.some(function(nodeId) {
          return nodeId === node.getId();
        })) {
        issues.push(
          'The destination node id of node with id ' + node.getId() +
          ' points to itself.');
      }
      for (var i = 0; i < destinationNodeIds.length; i++) {
        var nodeId = destinationNodeIds[i];
        if (destinationNodeIds.indexOf(nodeId) <
          destinationNodeIds.lastIndexOf(nodeId)) {
          issues.push(
            'The destination node with id ' + nodeId + ' is duplicated in' +
            ' node with id ' + node.getId());
        }
      }
      return issues;
    };

    var _validateStoryContents = function(storyContents) {
      var issues = [];
      var nodes = storyContents.getNodes();
      for (var i = 0; i < nodes.length; i++) {
        var nodeIssues = _validateNode(nodes[i]);
        issues = issues.concat(nodeIssues);
      }
      if (issues.length > 0) {
        return issues;
      }

      // Provided the nodes list is valid and each node in it is valid, the
      // preliminary checks are done to see if the story node graph obtained is
      // valid.
      var nodeIds = storyContents.getNodes().map(function(node) {
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
        storyContents.getNextNodeId().replace(NODE_ID_PREFIX, ''));
      var initialNodeIsPresent = false;
      for (var i = 0; i < nodes.length; i++) {
        var nodeIdNumber = parseInt(
          nodes[i].getId().replace(NODE_ID_PREFIX, ''));
        if (nodes[i].getId() === storyContents.getInitialNodeId()) {
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
          'Initial node - ' + storyContents.getInitialNodeId() +
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
      var startingNode = nodes[
        storyContents.getNodeIndex(storyContents.getInitialNodeId())
      ];
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
        var currentNodeIndex = storyContents.getNodeIndex(nodesQueue.shift());
        nodeIsVisited[currentNodeIndex] = true;
        var currentNode = nodes[currentNodeIndex];

        startingNode.getAcquiredSkillIds().forEach(function(skillId) {
          simulatedSkillIds.add(skillId);
        });
        for (var i = 0; i < currentNode.getDestinationNodeIds().length; i++) {
          var nodeId = currentNode.getDestinationNodeIds()[i];
          var nodeIndex = storyContents.getNodeIndex(nodeId);
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

    var _validateStory = function(story) {
      var issues = [];
      if (story.getTitle() === '') {
        issues.push('Story title should not be empty');
      }
      issues = issues.concat(_validateStoryContents(story.getStoryContents()));

      return issues;
    };

    return {
      /**
       * Returns a list of error strings found when validating the provided
       * story. The validation methods used in this function are written to
       * match the validations performed in the backend.
       */
      findValidationIssuesForStory: function(story) {
        return _validateStory(story);
      }
    };
  }]);
