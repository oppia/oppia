// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model class for creating and mutating instances of frontend
 * story contents domain objects.
 */

import {StoryEditorPageConstants} from 'pages/story-editor-page/story-editor-page.constants';
import {StoryNodeBackendDict, StoryNode} from 'domain/story/story-node.model';

export interface ArcBackendDict {
  id: string;
  title: string;
  description: string;
  node_ids: string[];
}

export interface StoryContentsBackendDict {
  initial_node_id: string;
  next_node_id: string;
  nodes: StoryNodeBackendDict[];
  arcs?: ArcBackendDict[];
}

interface NodeTitles {
  [title: string]: string;
}

export class ArcModel {
  _id: string;
  _title: string;
  _description: string;
  _nodeIds: string[];

  constructor(
    id: string,
    title: string,
    description: string,
    nodeIds: string[]
  ) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._nodeIds = nodeIds;
  }

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this._title;
  }

  setTitle(title: string): void {
    this._title = title;
  }

  getDescription(): string {
    return this._description;
  }

  setDescription(description: string): void {
    this._description = description;
  }

  getNodeIds(): string[] {
    return this._nodeIds;
  }

  setNodeIds(nodeIds: string[]): void {
    this._nodeIds = nodeIds;
  }

  static createNew(
    id: string,
    title: string,
    description: string,
    nodeIds: string[]
  ): ArcModel {
    return new ArcModel(id, title, description, nodeIds);
  }

  static createFromBackendDict(backendDict: ArcBackendDict): ArcModel {
    return new ArcModel(
      backendDict.id,
      backendDict.title,
      backendDict.description,
      backendDict.node_ids
    );
  }

  toBackendDict(): ArcBackendDict {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      node_ids: this._nodeIds,
    };
  }
}

export class StoryContents {
  // When the Story contains a single node and it needs to be deleted
  // then the value '_initialNodeId' needs to be changed to null.
  // See 'deleteNode' function below in this file for more details.
  _initialNodeId: string | null;
  _nodes: StoryNode[];
  _nextNodeId: string;
  _arcs: ArcModel[];
  constructor(
    initialNodeId: string,
    nodes: StoryNode[],
    nextNodeId: string,
    arcs: ArcModel[] = []
  ) {
    this._initialNodeId = initialNodeId;
    this._nodes = nodes;
    this._nextNodeId = nextNodeId;
    this._arcs = arcs;
  }

  getIncrementedNodeId(nodeId: string): string {
    var index = parseInt(
      nodeId.replace(StoryEditorPageConstants.NODE_ID_PREFIX, '')
    );
    ++index;
    return StoryEditorPageConstants.NODE_ID_PREFIX + index;
  }

  getInitialNodeId(): string | null {
    return this._initialNodeId;
  }

  getLinearNodesList(): StoryNode[] {
    return this._nodes.slice();
  }

  getNextNodeId(): string {
    return this._nextNodeId;
  }

  getNodes(): StoryNode[] {
    return this._nodes;
  }

  getArcs(): ArcModel[] {
    return this._arcs;
  }

  getArcIndex(arcId: string): number {
    for (let i = 0; i < this._arcs.length; i++) {
      if (this._arcs[i].getId() === arcId) {
        return i;
      }
    }
    return -1;
  }

  addArc(arc: ArcModel): void {
    this._arcs.push(arc);
  }

  insertArcAt(index: number, arc: ArcModel): void {
    this._arcs.splice(index, 0, arc);
  }

  deleteArc(arcId: string): void {
    const index = this.getArcIndex(arcId);
    if (index === -1) {
      throw new Error('The arc with id ' + arcId + ' does not exist');
    }
    this._arcs.splice(index, 1);
  }

  rearrangeArcs(arcIdsOrder: string[]): void {
    if (arcIdsOrder.length !== this._arcs.length) {
      throw new Error('Arc order must include each arc exactly once');
    }
    const oldArcs: {[id: string]: ArcModel} = {};
    for (const arc of this._arcs) {
      oldArcs[arc.getId()] = arc;
    }
    const seenArcIds = new Set<string>();
    const newArcs: ArcModel[] = [];
    for (const arcId of arcIdsOrder) {
      if (seenArcIds.has(arcId)) {
        throw new Error('Duplicate arc id in arc order: ' + arcId);
      }
      if (!Object.prototype.hasOwnProperty.call(oldArcs, arcId)) {
        throw new Error('Arc with id ' + arcId + ' is not part of this story');
      }
      seenArcIds.add(arcId);
      newArcs.push(oldArcs[arcId]);
    }
    this._arcs = newArcs;
  }

  moveNodeToArc(nodeId: string, toArcId: string, positionIndex?: number): void {
    const targetArcIndex = this.getArcIndex(toArcId);
    if (targetArcIndex === -1) {
      throw new Error('Arc with id ' + toArcId + ' does not exist');
    }
    // Remove the node from any arc that contains it, using setNodeIds to
    // avoid mutating copies returned by getters and ensure a single source
    // of truth for arc node lists.
    for (const arc of this._arcs) {
      const nodeIds = arc.getNodeIds();
      if (nodeIds.indexOf(nodeId) !== -1) {
        arc.setNodeIds(nodeIds.filter(id => id !== nodeId));
      }
    }

    const currentNodeIds = this._arcs[targetArcIndex].getNodeIds();
    if (positionIndex !== undefined && positionIndex <= currentNodeIds.length) {
      currentNodeIds.splice(positionIndex, 0, nodeId);
      this._arcs[targetArcIndex].setNodeIds(currentNodeIds);
    } else {
      this._arcs[targetArcIndex].setNodeIds([...currentNodeIds, nodeId]);
    }
  }

  rearrangeNodeInStory(fromIndex: number, toIndex: number): void {
    const nodeToMove: StoryNode = this._nodes[fromIndex];
    this._nodes.splice(fromIndex, 1);
    this._nodes.splice(toIndex, 0, nodeToMove);
  }

  getNodeIdsToTitleMap(nodeIds: string[]): {} {
    var nodes = this._nodes;
    var nodeTitles: NodeTitles = {};
    for (var i = 0; i < nodes.length; i++) {
      if (nodeIds.indexOf(nodes[i].getId()) !== -1) {
        nodeTitles[nodes[i].getId()] = nodes[i].getTitle();
      }
    }
    if (Object.keys(nodeTitles).length !== nodeIds.length) {
      for (var i = 0; i < nodeIds.length; i++) {
        if (!nodeTitles.hasOwnProperty(nodeIds[i])) {
          throw new Error('The node with id ' + nodeIds[i] + ' is invalid');
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

  // A nodeId will be null if the initial node does not exist.
  // A nodeId will be undefined if the pending nodes to visit are not present.
  // If the nodeId is null, empty or undefined then the function returns -1.
  getNodeIndex(nodeId: string | null | undefined): number {
    for (var i = 0; i < this._nodes.length; i++) {
      if (this._nodes[i].getId() === nodeId) {
        return i;
      }
    }
    return -1;
  }

  validate(): string[] {
    var issues: string[] = [];
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
    for (var i = 0; i < nodeIds.length; i++) {
      var nodeId = nodeIds[i];
      if (nodeIds.indexOf(nodeId) < nodeIds.lastIndexOf(nodeId)) {
        throw new Error(
          'The node with id ' + nodeId + ' is duplicated in the story'
        );
      }
    }
    var nextNodeIdNumber = parseInt(
      this._nextNodeId.replace(StoryEditorPageConstants.NODE_ID_PREFIX, '')
    );
    var initialNodeIsPresent = false;
    for (var i = 0; i < nodes.length; i++) {
      var nodeIdNumber = parseInt(
        nodes[i].getId().replace(StoryEditorPageConstants.NODE_ID_PREFIX, '')
      );
      if (nodes[i].getId() === this._initialNodeId) {
        initialNodeIsPresent = true;
      }
      if (nodeIdNumber > nextNodeIdNumber) {
        throw new Error(
          'Node id out of bounds for node with id ' + nodes[i].getId()
        );
      }
      for (var j = 0; j < nodes[i].getDestinationNodeIds().length; j++) {
        if (nodeIds.indexOf(nodes[i].getDestinationNodeIds()[j]) === -1) {
          issues.push(
            'The node with id ' +
              nodes[i].getDestinationNodeIds()[j] +
              " doesn't exist"
          );
        }
      }
    }
    if (nodes.length > 0) {
      if (!initialNodeIsPresent) {
        throw new Error(
          'Initial node - ' +
            this._initialNodeId +
            ' - is not present in the story'
        );
      }
    }
    return issues;
  }

  setInitialNodeId(nodeId: string | null): void {
    if (this.getNodeIndex(nodeId) === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._initialNodeId = nodeId;
  }

  addNode(title: string): void {
    this._nodes.push(StoryNode.createFromIdAndTitle(this._nextNodeId, title));
    if (this._initialNodeId === null) {
      this._initialNodeId = this._nextNodeId;
    }
    this._nextNodeId = this.getIncrementedNodeId(this._nextNodeId);
  }

  deleteNode(nodeId: string): void {
    if (this.getNodeIndex(nodeId) === -1) {
      throw new Error('The node does not exist');
    }
    if (nodeId === this._initialNodeId) {
      if (this._nodes.length === 1) {
        this._initialNodeId = null;
      } else {
        throw new Error('Cannot delete initial story node');
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
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setOutline(outline);
  }

  setNodeTitle(nodeId: string, title: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setTitle(title);
  }

  setNodeDescription(nodeId: string, description: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setDescription(description);
  }

  setNodeExplorationId(nodeId: string, explorationId: string | null): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    } else {
      if (explorationId !== null) {
        for (var i = 0; i < this._nodes.length; i++) {
          if (
            this._nodes[i].getExplorationId() === explorationId &&
            i !== index
          ) {
            throw new Error(
              'The given exploration already exists in the story.'
            );
          }
        }
      }
      this._nodes[index].setExplorationId(explorationId);
    }
  }

  setNodeStatus(nodeId: string, status: string): void {
    let index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setStatus(status);
  }

  setNodePlannedPublicationDateMsecs(
    nodeId: string,
    plannedPublicationDateMsecs: number | null
  ): void {
    let index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setPlannedPublicationDateMsecs(
      plannedPublicationDateMsecs
    );
  }

  setNodeLastModifiedMsecs(
    nodeId: string,
    lastModifiedMsecs: number | null
  ): void {
    let index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setLastModifiedMsecs(lastModifiedMsecs);
  }

  setNodeFirstPublicationDateMsecs(
    nodeId: string,
    firstPublicationDateMsecs: number | null
  ): void {
    let index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setFirstPublicationDateMsecs(firstPublicationDateMsecs);
  }

  setNodeUnpublishingReason(
    nodeId: string,
    unpublishingReason: string | null
  ): void {
    let index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].setUnpublishingReason(unpublishingReason);
  }

  markNodeOutlineAsFinalized(nodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].markOutlineAsFinalized();
  }

  markNodeOutlineAsNotFinalized(nodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].markOutlineAsNotFinalized();
  }

  addPrerequisiteSkillIdToNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].addPrerequisiteSkillId(skillId);
  }

  removePrerequisiteSkillIdFromNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].removePrerequisiteSkillId(skillId);
  }

  addAcquiredSkillIdToNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].addAcquiredSkillId(skillId);
  }

  removeAcquiredSkillIdFromNode(nodeId: string, skillId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].removeAcquiredSkillId(skillId);
  }

  addDestinationNodeIdToNode(nodeId: string, destinationNodeId: string): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    if (this.getNodeIndex(destinationNodeId) === -1) {
      throw new Error("The destination node with given id doesn't exist");
    }
    this._nodes[index].addDestinationNodeId(destinationNodeId);
  }

  removeDestinationNodeIdFromNode(
    nodeId: string,
    destinationNodeId: string
  ): void {
    var index = this.getNodeIndex(nodeId);
    if (index === -1) {
      throw new Error("The node with given id doesn't exist");
    }
    this._nodes[index].removeDestinationNodeId(destinationNodeId);
  }

  static createFromBackendDict(
    storyContentsBackendObject: StoryContentsBackendDict
  ): StoryContents {
    var nodes = [];
    for (var i = 0; i < storyContentsBackendObject.nodes.length; i++) {
      nodes.push(
        StoryNode.createFromBackendDict(storyContentsBackendObject.nodes[i])
      );
    }
    var arcs = [];
    const arcsData = storyContentsBackendObject.arcs;
    if (arcsData) {
      for (var i = 0; i < arcsData.length; i++) {
        arcs.push(ArcModel.createFromBackendDict(arcsData[i]));
      }
    }
    return new StoryContents(
      storyContentsBackendObject.initial_node_id,
      nodes,
      storyContentsBackendObject.next_node_id,
      arcs
    );
  }
}
