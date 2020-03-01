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

export interface ExplorationSummary {
  title: string,
  status: string
}

export class ReadOnlyStoryNode {
  _id: string;
  _title: string;
  _destinationNodeIds: Array<string>;
  _prerequisiteSkillIds: Array<string>;
  _acquiredSkillIds: Array<string>;
  _outline: string;
  _outlineIsFinalized: boolean;
  _explorationId: string;
  _explorationSummary: ExplorationSummary;
  _completed: boolean;

  constructor(id: string, title: string, destinationNodeIds: Array<string>,
      prerequisiteSkillIds: Array<string>, acquiredSkillIds: Array<string>,
      outline: string, outlineIsFinalized: boolean, explorationId: string,
      explorationSummary: ExplorationSummary, completed: boolean) {
    this._id = id;
    this._title = title;
    this._destinationNodeIds = destinationNodeIds;
    this._prerequisiteSkillIds = prerequisiteSkillIds;
    this._acquiredSkillIds = acquiredSkillIds;
    this._outline = outline;
    this._outlineIsFinalized = outlineIsFinalized;
    this._explorationId = explorationId;
    this._explorationSummary = explorationSummary;
    this._completed = completed;
  }

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this._title;
  }

  getExplorationId(): string {
    return this._explorationId;
  }

  isCompleted(): boolean {
    return this._completed;
  }

  getExplorationSummaryObject(): ExplorationSummary {
    return this._explorationSummary;
  }

  getOutline(): string {
    return this._outline;
  }

  getOutlineStatus(): boolean {
    return this._outlineIsFinalized;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlyStoryNodeObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'subtopicDataBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(storyNodeBackendDict: any): ReadOnlyStoryNode {
    return new ReadOnlyStoryNode(storyNodeBackendDict.id,
      storyNodeBackendDict.title,
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
