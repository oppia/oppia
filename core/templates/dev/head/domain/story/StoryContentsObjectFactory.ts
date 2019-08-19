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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { StoryEditorPageConstants } from
  'pages/story-editor-page/story-editor-page.constants';
import { StoryNode, StoryNodeObjectFactory } from
  'domain/story/StoryNodeObjectFactory';

export class StoryContents {
  _initialNodeId: string;
  _nodes: StoryNode[];
  _nextNodeId: string;
  _storyNodeObjectFactoryInstance: StoryNodeObjectFactory;
  constructor(
      initialNodeId: string, nodes: StoryNode[], nextNodeId: string,
      storyNodeObjectFactoryInstance: StoryNodeObjectFactory) {
    this._initialNodeId = initialNodeId;
    this._nodes = nodes;
    this._nextNodeId = nextNodeId;
    this._storyNodeObjectFactoryInstance = storyNodeObjectFactoryInstance;
  }

  _disconnectedNodeIds: string[] = [];

  getIncrementedNodeId(nodeId: string): string {
    var index = parseInt(
      nodeId.replace(StoryEditorPageConstants.NODE_ID_PREFIX, ''));
    ++index;
    return StoryEditorPageConstants.NODE_ID_PREFIX + index;
  }

  getInitialNodeId(): string {
    return this._initialNodeId;
  }

  getDisconnectedNodeIds(): string[] {
    return this._disconnectedNodeIds;
  }

  getNextNodeId(): string {
    return this._nextNodeId;
  }

  getNodes(): StoryNode[] {
    return this._nodes;
  }

  getNodeIdCorrespondingToTitle(title: string): string {
    var nodes = this._nodes;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getTitle() === title) {
        return nodes[i].getId();
      }
    }
    return null;
  }

  getNodeIdsToTitleMap(nodeIds: string[]): {} {
    var nodes = this._nodes;
    var nodeTitles = {};
    for (var i = 0; i < nodes.length; i++) {
      if (nodeIds.indexOf(nodes[i].getId()) !== -1) {
        nodeTitles[nodes[i].getId()] = nodes[i].getTitle();
      }
    }
    if (Object.keys(nodeTitles).length !== nodeIds.length) {
      for (var i = 0; i < nodeIds.length; i++) {
        if (!nodeTitles.hasOwnProperty(nodeIds[i])) {
          throw Error('The node with id ' + nodeIds[i] + ' is invalid');
        }
      }
    }
    return nodeTitles;
  }

  getNodeIds(): string[] {
    return this._nodes.map((node: StoryNode) => {
      return node.getId();
    });
  }

  getNodeIndex(nodeId: string) {
    for (var i = 0; i < this._nodes.length; i++) {
      if (this._nodes[i].getId() === nodeId) {
        return i;
      }
    }
    return -1;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a list with varying element types.
  validate(): any {
    this._disconnectedNodeIds = [];
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
    var nodeIds = nodes.map((node: StoryNode) => {
      return node.getId();
    });
    var nodeTitles = nodes.map((node: StoryNode) => {
      return node.getTitle();
    });
    for (var i = 0; i < nodeIds.length; i++) {
      var nodeId = nodeIds[i];
      if (nodeIds.indexOf(nodeId) < nodeIds.lastIndexOf(nodeId)) {
        throw Error(
          'The node with id ' + nodeId + ' is duplicated in the story');
      }
    }
    var nextNodeIdNumber = parseInt(
      this._nextNodeId.replace(StoryEditorPageConstants.NODE_ID_PREFIX, ''));
    var initialNodeIsPresent = false;
    for (var i = 0; i < nodes.length; i++) {
      var nodeIdNumber = parseInt(
        nodes[i].getId().replace(StoryEditorPageConstants.NODE_ID_PREFIX, ''));
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
    if (nodes.length > 0) {
      if (!initialNodeIsPresent) {
        throw Error(
          'Initial node - ' + this._initialNodeId +
          ' - is not present in the story');
      }

      // All the validations above should be successfully completed before
      // going to validating the story node graph.
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
      var simulatedSkillIds = new Set(startingNode.getPrerequisiteSkillIds());

      // The following loop employs a Breadth First Search from the given
      // starting node and makes sure that the user has acquired all the
      // prerequisite skills required by the destination nodes 'unlocked' by
      // visiting a particular node by the time that node is finished.
      while (nodesQueue.length > 0) {
        var currentNodeIndex = this.getNodeIndex(nodesQueue.shift());
        nodeIsVisited[currentNodeIndex] = true;
        var currentNode = nodes[currentNodeIndex];

        startingNode.getAcquiredSkillIds().forEach((skillId) => {
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
          destinationNode.getPrerequisiteSkillIds().forEach(
            (skillId: string) => {
              if (!simulatedSkillIds.has(skillId)) {
                issues.push(
                  'The prerequisite skill with id ' + skillId +
                  ' was not completed before node with id ' + nodeId +
                  ' was unlocked');
              }
            }
          );
          nodesQueue.push(nodeId);
        }
      }
      for (var i = 0; i < nodeIsVisited.length; i++) {
        if (!nodeIsVisited[i]) {
          this._disconnectedNodeIds.push(nodeIds[i]);
          issues.push(
            'There is no way to get to the chapter with title ' +
            nodeTitles[i] + ' from any other chapter');
        }
      }
    }
    return issues;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is an assignment statement and should be
  // typed as void and the return statement should be removed.
  setInitialNodeId(nodeId: string): any {
    if (this.getNodeIndex(nodeId) === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    return this._initialNodeId = nodeId;
  }

  addNode(title: string): void {
    this._nodes.push(
      this._storyNodeObjectFactoryInstance.createFromIdAndTitle(
        this._nextNodeId, title));
    if (this._initialNodeId === null) {
      this._initialNodeId = this._nextNodeId;
    }
    this._nextNodeId = this.getIncrementedNodeId(this._nextNodeId);
  }

  deleteNode(nodeId: string): void {
    if (this.getNodeIndex(nodeId) === -1) {
      throw Error('The node does not exist');
    }
    if (nodeId === this._initialNodeId) {
      if (this._nodes.length === 1) {
        this._initialNodeId = null;
      } else {
        throw Error('Cannot delete initial story node');
      }
    }
    for (var i = 0; i < this._nodes.length; i++) {
      if (this._nodes[i].getDestinationNodeIds().indexOf(nodeId) !== -1) {
        this._nodes[i].removeDestinationNodeId(nodeId);
      }
    }
    this._nodes.splice(this.getNodeIndex(nodeId), 1);
  }

  setNodeOutline(nodeId: string, outline: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].setOutline(outline);
  }

  setNodeTitle(nodeId: string, title: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].setTitle(title);
  }

  setNodeExplorationId(nodeId: string, explorationId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    } else if (explorationId !== null || explorationId !== '') {
      for (var i = 0; i < this._nodes.length; i++) {
        if ((this._nodes[i].getExplorationId() === explorationId) && (
          i !== index)) {
          throw Error('The given exploration already exists in the story.');
        }
      }
      this._nodes[index].setExplorationId(explorationId);
    }
  }

  markNodeOutlineAsFinalized(nodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].markOutlineAsFinalized();
  }

  markNodeOutlineAsNotFinalized(nodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].markOutlineAsNotFinalized();
  }

  addPrerequisiteSkillIdToNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].addPrerequisiteSkillId(skillId);
  }

  removePrerequisiteSkillIdFromNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].removePrerequisiteSkillId(skillId);
  }

  addAcquiredSkillIdToNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].addAcquiredSkillId(skillId);
  }

  removeAcquiredSkillIdFromNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].removeAcquiredSkillId(skillId);
  }

  addDestinationNodeIdToNode(nodeId: string, destinationNodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    if (this.getNodeIndex(destinationNodeId) === -1) {
      throw Error('The destination node with given id doesn\'t exist');
    }
    this._nodes[index].addDestinationNodeId(destinationNodeId);
  }

  removeDestinationNodeIdFromNode(
      nodeId: string, destinationNodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw Error('The node with given id doesn\'t exist');
    }
    this._nodes[index].removeDestinationNodeId(destinationNodeId);
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoryContentsObjectFactory {
  constructor(private storyNodeObjectFactory: StoryNodeObjectFactory) {}
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'storyContentsBackendObject' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(storyContentsBackendObject: any): StoryContents {
    var nodes = [];
    for (var i = 0; i < storyContentsBackendObject.nodes.length; i++) {
      nodes.push(
        this.storyNodeObjectFactory.createFromBackendDict(
          storyContentsBackendObject.nodes[i]));
    }
    return new StoryContents(
      storyContentsBackendObject.initial_node_id, nodes,
      storyContentsBackendObject.next_node_id,
      this.storyNodeObjectFactory);
  }
}

angular.module('oppia').factory(
  'StoryContentsObjectFactory',
  downgradeInjectable(StoryContentsObjectFactory));
