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
      var nodeIdPattern = new RegExp(NODE_ID_PREFIX + "[0-9]+", 'g');
      if (!nodeId.match(nodeIdPattern)) {
        return false;
      }
      return true;
    };

    var _validateNode = function(node) {
      var issues = [];

      if (!(node instanceof StoryNodeObjectFactory)) {
        issues.push('All nodes should be a StoryNode instance');
        return issues;
      }
      if (!_checkValidNodeId(node.getId())) {
        issues.push('Invalid node id');
      }
      if (typeof node.getOutline() !== 'string') {
        issues.push('Node outline should be a string');
      }
      if ((typeof node.getExplorationId() !== 'string') && (node.getExplorationId() !== null)) {
        issues.push('Exploration id should be a string or null');
      }
      if (typeof node.getOutlineStatus() !== 'boolean') {
        issues.push('Node outline status should be true or false.');
      }
      var prerequisiteSkillIds = node.getPrerequisiteSkillIds();
      var acquiredSkillIds = node.getAcquiredSkillIds();
      var destinationNodeIds = node.getDestinationNodeIds();
      if (prerequisiteSkillIds.constructor !== Array) {
        issues.push('Prerequisite skill ids should be an array');
      }
      if (prerequisiteSkillIds.some(function(skillId) {
          return typeof skillId !== 'string';
        })) {
        issues.push('Each prerequisite skill id should be a string');
      }
      if ((new Set(prerequisiteSkillIds)).size !==
          prerequisiteSkillIds.length) {
        issues.push('All prerequisite skill ids should be distinct');
      }

      if (acquiredSkillIds.constructor !== Array) {
        issues.push('Acquired skill ids should be an array');
      }
      if (acquiredSkillIds.some(function(skillId) {
          return typeof skillId !== 'string';
        })) {
        issues.push('Each acquired skill id should be a string');
      }
      if ((new Set(acquiredSkillIds)).size !==
          acquiredSkillIds.length) {
        issues.push('All acquired skill ids should be distinct');
      }

      for (var i = 0; i < prerequisiteSkillIds.length; i++) {
        if (acquiredSkillIds.indexOf(prerequisiteSkillIds[i]) !== -1) {
          issues.push(
            'Acquired and prerequisite skills for a node should not have any ' +
            'skill in common');
        }
      }

      if (destinationNodeIds.constructor !== Array) {
        issues.push('Destination node ids should be an array');
      }
      if (destinationNodeIds.some(function(nodeId) {
          return !_checkValidNodeId(nodeId);
        })) {
        issues.push('Each destination node id should be valid');
      }
      if (destinationNodeIds.some(function(nodeId) {
          return nodeId === node.getId();
        })) {
        issues.push(
          'A destination node id of a node should not point to the same node.');
      }
      if ((new Set(destinationNodeIds)).size !==
          destinationNodeIds.length) {
        issues.push('All destination node ids should be distinct');
      }
      return issues;
    };

    var _validateStoryContents = function(storyContents) {
      var issues = [];
      if (!(storyContents instanceof StoryContentsObjectFactory)) {
        issues.push('Story contents should be StoryContents object');
        return issues;
      }
      if (!_checkValidNodeId(storyContents.getInitialNodeId())) {
        issues.push('Invalid initial node id');
      }
      if (!_checkValidNodeId(storyContents.getNextNodeId())) {
        issues.push('Invalid next node id');
      }
      if (storyContents.getNodes().constructor !== Array) {
        issues.push('Story nodes should be an array');
        return issues;
      }
      var nodes = storyContents.getNodes();
      var allNodesValid = true;
      for (var i = 0; i < nodes.length; i++) {
        var nodeIssues = _validateNode(nodes[i]);
        if (nodeIssues.length > 0) {
          allNodesValid = false;
        }
        issues = issues.concat(nodeIssues);
      }
      if (!allNodesValid) {
        return issues;
      }
      // Provided the nodes list is valid and each node in it is valid, the
      // following check is done similar to the one in
      // story_domain.StoryContents to check if each node can be visited with
      // given parameters.


      return issues;
    };

    var _validateStory = function(story) {
      var issues = [];
      if (!(story instanceof StoryObjectFactory)) {
        issues.push('The story should be Story object');
        return issues;
      }
      if (typeof story.getTitle() !== 'string' || story.getTitle() === '') {
        issues.push('Story title should be a non-empty string');
      }
      if (typeof story.getDescription() !== 'string') {
        issues.push('Story description should be a string');
      }
      if (typeof story.getNotes() !== 'string') {
        issues.push('Story notes should be a string');
      }
      if (typeof story.getLanguageCode() !== 'string') {
        issues.push('Story language code should be a string');
      }
      issues = issues.concat(_validateStoryContents(story.getStoryContents()));

      return issues;
    };

    return {
      /**
       * Returns a list of error strings found when validating the provided
       * story. The validation methods used in this function are written to
       * match the validations performed in the backend. This function is
       * expensive, so it should be called sparingly.
       */
      findValidationIssuesInStory: function(story) {
        return _validateStory(story);
      }
    };
  }]);
