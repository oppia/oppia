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

export class StoryNode {
  id;
  title;
  destinationNodeIds;
  prerequisiteSkillIds;
  acquiredSkillIds;
  outline;
  outlineIsFinalized;
  explorationId;
  explorationSummary;
  completed;

  constructor(id, title, destinationNodeIds, prerequisiteSkillIds,
      acquiredSkillIds, outline, outlineIsFinalized, explorationId,
      explorationSummary, completed) {
    this.id = id;
    this.title = title;
    this.destinationNodeIds = destinationNodeIds;
    this.prerequisiteSkillIds = prerequisiteSkillIds;
    this.acquiredSkillIds = acquiredSkillIds;
    this.outline = outline;
    this.outlineIsFinalized = outlineIsFinalized;
    this.explorationId = explorationId;
    this.explorationSummary = explorationSummary;
    this.completed = completed;
  }

  getId() {
    return this.id;
  }

  getTitle() {
    return this.title;
  }

  getExplorationId() {
    return this.explorationId;
  }

  isCompleted() {
    return this.completed;
  }

  getExplorationSummaryObject() {
    return this.explorationSummary;
  }

  getOutline() {
    return this.outline;
  }

  getOutlineStatus() {
    return this.outlineIsFinalized;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlyStoryNodeObjectFactory {
  constructor() {}

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'subtopicDataBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(storyNodeBackendDict: any): StoryNode {
    return new StoryNode(storyNodeBackendDict.id, storyNodeBackendDict.title,
      storyNodeBackendDict.destination_node_ids,
      storyNodeBackendDict.prerequisite_skill_ids,
      storyNodeBackendDict.acquired_skill_ids,
      storyNodeBackendDict.outline,
      storyNodeBackendDict.outline_is_finalized,
      storyNodeBackendDict.exploration_id,
      storyNodeBackendDict.exp_summary_dict,
      storyNodeBackendDict.completed);
  }
}

angular.module('oppia').factory(
  'ReadOnlyStoryNodeObjectFactory',
  downgradeInjectable(ReadOnlyStoryNodeObjectFactory));
