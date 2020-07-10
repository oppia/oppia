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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  ExplorationSummaryBackendDict,
  ExplorationSummaryObjectFactory,
  ExplorationSummary
} from 'domain/summary/exploration-summary-object.factory';

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
  'exp_summary_dict': ExplorationSummaryBackendDict;
  'completed': boolean;
  'thumbnail_bg_color': string;
  'thumbnail_filename': string;
}

export class ReadOnlyStoryNode {
  id: string;
  title: string;
  description: string;
  destinationNodeIds: string[];
  prerequisiteSkillIds: string[];
  acquiredSkillIds: string[];
  outline: string;
  outlineIsFinalized: boolean;
  explorationId: string;
  explorationSummary: ExplorationSummary;
  completed: boolean;
  thumbnailBgColor: string;
  thumbnailFilename: string;

  constructor(id: string, title: string, description: string,
      destinationNodeIds: string[], prerequisiteSkillIds: string[],
      acquiredSkillIds: string[], outline: string,
      outlineIsFinalized: boolean, explorationId: string,
      explorationSummary: ExplorationSummary, completed: boolean,
      thumbnailBgColor: string, thumbnailFilename: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.destinationNodeIds = destinationNodeIds;
    this.prerequisiteSkillIds = prerequisiteSkillIds;
    this.acquiredSkillIds = acquiredSkillIds;
    this.outline = outline;
    this.outlineIsFinalized = outlineIsFinalized;
    this.explorationId = explorationId;
    this.explorationSummary = explorationSummary;
    this.completed = completed;
    this.thumbnailBgColor = thumbnailBgColor;
    this.thumbnailFilename = thumbnailFilename;
  }

  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getExplorationId(): string {
    return this.explorationId;
  }

  isCompleted(): boolean {
    return this.completed;
  }

  getExplorationSummaryObject(): ExplorationSummary {
    return this.explorationSummary;
  }

  getOutline(): string {
    return this.outline;
  }

  getOutlineStatus(): boolean {
    return this.outlineIsFinalized;
  }

  getThumbnailFilename(): string {
    return this.thumbnailFilename;
  }

  getThumbnailBgColor(): string {
    return this.thumbnailBgColor;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlyStoryNodeObjectFactory {
  constructor(
    private explorationSummaryObjectFactory: ExplorationSummaryObjectFactory) {}

  createFromBackendDict(
      storyNodeBackendDict: StoryNodeBackendDict): ReadOnlyStoryNode {
    let explorationSummary = this.explorationSummaryObjectFactory
      .createFromBackendDict(storyNodeBackendDict.exp_summary_dict);

    return new ReadOnlyStoryNode(storyNodeBackendDict.id,
      storyNodeBackendDict.title,
      storyNodeBackendDict.description,
      storyNodeBackendDict.destination_node_ids,
      storyNodeBackendDict.prerequisite_skill_ids,
      storyNodeBackendDict.acquired_skill_ids,
      storyNodeBackendDict.outline,
      storyNodeBackendDict.outline_is_finalized,
      storyNodeBackendDict.exploration_id,
      explorationSummary,
      storyNodeBackendDict.completed,
      storyNodeBackendDict.thumbnail_bg_color,
      storyNodeBackendDict.thumbnail_filename);
  }
}

angular.module('oppia').factory(
  'ReadOnlyStoryNodeObjectFactory',
  downgradeInjectable(ReadOnlyStoryNodeObjectFactory));
