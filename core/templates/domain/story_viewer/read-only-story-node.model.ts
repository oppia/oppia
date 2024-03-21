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
 * @fileoverview Frontend Model for storing frontend story node in the
 * story viewer.
 */

import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
} from 'domain/summary/learner-exploration-summary.model';

export interface StoryNodeBackendDict {
  id: string;
  title: string;
  description: string;
  destination_node_ids: string[];
  prerequisite_skill_ids: string[];
  acquired_skill_ids: string[];
  outline: string;
  outline_is_finalized: boolean;
  exploration_id: string;
  exp_summary_dict: LearnerExplorationSummaryBackendDict;
  completed: boolean;
  thumbnail_bg_color: string;
  thumbnail_filename: string;
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
  explorationSummary: LearnerExplorationSummary;
  completed: boolean;
  thumbnailBgColor: string;
  thumbnailFilename: string;

  constructor(
    id: string,
    title: string,
    description: string,
    destinationNodeIds: string[],
    prerequisiteSkillIds: string[],
    acquiredSkillIds: string[],
    outline: string,
    outlineIsFinalized: boolean,
    explorationId: string,
    explorationSummary: LearnerExplorationSummary,
    completed: boolean,
    thumbnailBgColor: string,
    thumbnailFilename: string
  ) {
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

  static createFromBackendDict(
    storyNodeBackendDict: StoryNodeBackendDict
  ): ReadOnlyStoryNode {
    let explorationSummary = LearnerExplorationSummary.createFromBackendDict(
      storyNodeBackendDict.exp_summary_dict
    );

    return new ReadOnlyStoryNode(
      storyNodeBackendDict.id,
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
      storyNodeBackendDict.thumbnail_filename
    );
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

  getExplorationSummaryObject(): LearnerExplorationSummary {
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
