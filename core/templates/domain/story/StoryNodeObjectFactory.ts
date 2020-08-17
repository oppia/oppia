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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { StoryEditorPageConstants } from
  'pages/story-editor-page/story-editor-page.constants';

export interface StoryNodeBackendDict {
  'id': string;
  'title': string;
  'description': string;
  'destination_node_ids': string[];
  'prerequisite_skill_ids': string[];
  'acquired_skill_ids': string[];
  'outline': string;
  'outline_is_finalized': boolean;
  'exploration_id': string;
  'thumbnail_bg_color': string;
  'thumbnail_filename': string;
}

export class StoryNode {
  _id: string;
  _title: string;
  _description: string;
  _destinationNodeIds: string[];
  _prerequisiteSkillIds: string[];
  _acquiredSkillIds: string[];
  _outline: string;
  _outlineIsFinalized: boolean;
  _explorationId: string;
  _thumbnailBgColor: string;
  _thumbnailFilename: string;
  constructor(
      id: string, title: string, description: string,
      destinationNodeIds: string[], prerequisiteSkillIds: string[],
      acquiredSkillIds: string[], outline: string,
      outlineIsFinalized: boolean, explorationId: string,
      thumbnailBgColor: string, thumbnailFilename: string) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._destinationNodeIds = destinationNodeIds;
    this._prerequisiteSkillIds = prerequisiteSkillIds;
    this._acquiredSkillIds = acquiredSkillIds;
    this._outline = outline;
    this._outlineIsFinalized = outlineIsFinalized;
    this._explorationId = explorationId;
    this._thumbnailBgColor = thumbnailBgColor;
    this._thumbnailFilename = thumbnailFilename;
  }

  _checkValidNodeId(nodeId: string): boolean {
    if (typeof nodeId !== 'string') {
      return false;
    }
    var nodeIdPattern = new RegExp(
      StoryEditorPageConstants.NODE_ID_PREFIX + '[0-9]+', 'g');
    if (!nodeId.match(nodeIdPattern)) {
      return false;
    }
    return true;
  }

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this._title;
  }

  getDescription(): string {
    return this._description;
  }

  getExplorationId(): string {
    return this._explorationId;
  }

  setExplorationId(explorationId: string): void {
    this._explorationId = explorationId;
  }

  getOutline(): string {
    return this._outline;
  }

  setOutline(outline: string): void {
    this._outline = outline;
  }

  setTitle(title: string): void {
    this._title = title;
  }

  setDescription(description: string): void {
    this._description = description;
  }

  getOutlineStatus(): boolean {
    return this._outlineIsFinalized;
  }

  markOutlineAsFinalized(): void {
    this._outlineIsFinalized = true;
  }

  markOutlineAsNotFinalized(): void {
    this._outlineIsFinalized = false;
  }

  getThumbnailFilename(): string {
    return this._thumbnailFilename;
  }

  setThumbnailFilename(thumbnailFilename: string): void {
    this._thumbnailFilename = thumbnailFilename;
  }

  getThumbnailBgColor(): string {
    return this._thumbnailBgColor;
  }

  setThumbnailBgColor(thumbnailBgColor: string): void {
    this._thumbnailBgColor = thumbnailBgColor;
  }

  prepublishValidate(): string[] {
    let issues = [];
    if (!this._thumbnailFilename) {
      issues.push('Chapter ' + this._title + ' should have a thumbnail.');
    }
    return issues;
  }

  validate(): string[] {
    var issues = [];

    if (!this._checkValidNodeId(this._id)) {
      throw new Error('The node id ' + this._id + ' is invalid.');
    }
    var prerequisiteSkillIds = this._prerequisiteSkillIds;
    var acquiredSkillIds = this._acquiredSkillIds;
    var destinationNodeIds = this._destinationNodeIds;

    for (var i = 0; i < prerequisiteSkillIds.length; i++) {
      var skillId = prerequisiteSkillIds[i];
      if (prerequisiteSkillIds.indexOf(skillId) <
        prerequisiteSkillIds.lastIndexOf(skillId)) {
        issues.push(
          'The prerequisite skill with id ' + skillId + ' is duplicated in' +
          ' node with id ' + this._id);
      }
    }
    for (var i = 0; i < acquiredSkillIds.length; i++) {
      var skillId = acquiredSkillIds[i];
      if (acquiredSkillIds.indexOf(skillId) <
        acquiredSkillIds.lastIndexOf(skillId)) {
        issues.push(
          'The acquired skill with id ' + skillId + ' is duplicated in' +
          ' node with id ' + this._id);
      }
    }
    for (var i = 0; i < prerequisiteSkillIds.length; i++) {
      if (acquiredSkillIds.indexOf(prerequisiteSkillIds[i]) !== -1) {
        issues.push(
          'The skill with id ' + prerequisiteSkillIds[i] + ' is common ' +
          'to both the acquired and prerequisite skill id list in node with' +
          ' id ' + this._id);
      }
    }
    for (var i = 0; i < destinationNodeIds.length; i++) {
      if (!this._checkValidNodeId(destinationNodeIds[i])) {
        throw new Error(
          'The destination node id ' + destinationNodeIds[i] + ' is ' +
          'invalid in node with id ' + this._id);
      }
    }

    var currentNodeId = this._id;
    if (
      destinationNodeIds.some((nodeId) => {
        return nodeId === currentNodeId;
      })) {
      issues.push(
        'The destination node id of node with id ' + this._id +
        ' points to itself.');
    }
    for (var i = 0; i < destinationNodeIds.length; i++) {
      var nodeId = destinationNodeIds[i];
      if (destinationNodeIds.indexOf(nodeId) <
        destinationNodeIds.lastIndexOf(nodeId)) {
        issues.push(
          'The destination node with id ' + nodeId + ' is duplicated in' +
          ' node with id ' + this._id);
      }
    }
    return issues;
  }

  getDestinationNodeIds(): string[] {
    return this._destinationNodeIds.slice();
  }

  addDestinationNodeId(destinationNodeid: string): void {
    if (this._destinationNodeIds.indexOf(destinationNodeid) !== -1) {
      throw new Error('The given node is already a destination node.');
    }
    this._destinationNodeIds.push(destinationNodeid);
  }

  removeDestinationNodeId(destinationNodeid: string): void {
    var index = this._destinationNodeIds.indexOf(destinationNodeid);
    if (index === -1) {
      throw new Error('The given node is not a destination node.');
    }
    this._destinationNodeIds.splice(index, 1);
  }

  getAcquiredSkillIds(): string[] {
    return this._acquiredSkillIds.slice();
  }

  addAcquiredSkillId(acquiredSkillid): void {
    if (this._acquiredSkillIds.indexOf(acquiredSkillid) !== -1) {
      throw new Error('The given skill is already an acquired skill.');
    }
    this._acquiredSkillIds.push(acquiredSkillid);
  }

  removeAcquiredSkillId(skillId: string): void {
    var index = this._acquiredSkillIds.indexOf(skillId);
    if (index === -1) {
      throw new Error('The given skill is not an acquired skill.');
    }
    this._acquiredSkillIds.splice(index, 1);
  }

  getPrerequisiteSkillIds(): string[] {
    return this._prerequisiteSkillIds.slice();
  }

  addPrerequisiteSkillId(skillId: string): void {
    if (this._prerequisiteSkillIds.indexOf(skillId) !== -1) {
      throw new Error('The given skill id is already a prerequisite skill.');
    }
    this._prerequisiteSkillIds.push(skillId);
  }

  removePrerequisiteSkillId(skillId: string): void {
    var index = this._prerequisiteSkillIds.indexOf(skillId);
    if (index === -1) {
      throw new Error('The given skill id is not a prerequisite skill.');
    }
    this._prerequisiteSkillIds.splice(index, 1);
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoryNodeObjectFactory {
  createFromBackendDict(
      storyNodeBackendObject: StoryNodeBackendDict): StoryNode {
    return new StoryNode(
      storyNodeBackendObject.id, storyNodeBackendObject.title,
      storyNodeBackendObject.description,
      storyNodeBackendObject.destination_node_ids,
      storyNodeBackendObject.prerequisite_skill_ids,
      storyNodeBackendObject.acquired_skill_ids,
      storyNodeBackendObject.outline,
      storyNodeBackendObject.outline_is_finalized,
      storyNodeBackendObject.exploration_id,
      storyNodeBackendObject.thumbnail_bg_color,
      storyNodeBackendObject.thumbnail_filename
    );
  }

  createFromIdAndTitle(nodeId: string, title: string): StoryNode {
    return new StoryNode(
      nodeId, title, '', [], [], [], '', false, null,
      null, null);
  }
}

angular.module('oppia').factory(
  'StoryNodeObjectFactory', downgradeInjectable(StoryNodeObjectFactory));
