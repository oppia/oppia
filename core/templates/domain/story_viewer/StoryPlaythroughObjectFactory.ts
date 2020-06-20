// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * story playthrough domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import {
  IStoryNodeBackendDict,
  ReadOnlyStoryNodeObjectFactory,
  ReadOnlyStoryNode
} from 'domain/story_viewer/ReadOnlyStoryNodeObjectFactory';

interface IStoryPlaythroughBackendDict {
  'story_nodes': IStoryNodeBackendDict[];
}

export class StoryPlaythrough {
  _nodes: ReadOnlyStoryNode[];

  constructor(nodes: ReadOnlyStoryNode[]) {
    this._nodes = nodes;
  }

  getInitialNode(): ReadOnlyStoryNode {
    return this._nodes[0];
  }

  getStoryNodeCount(): Number {
    return this._nodes.length;
  }

  getStoryNodes(): ReadOnlyStoryNode[] {
    return this._nodes;
  }

  hasFinishedStory(): boolean {
    return this._nodes.slice(-1)[0].isCompleted();
  }

  getNextPendingNodeId(): string {
    for (var i = 0; i < this._nodes.length; i++) {
      if (!this._nodes[i].isCompleted()) {
        return this._nodes[i].getId();
      }
    }
  }

  hasStartedStory(): boolean {
    return this._nodes[0].isCompleted();
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoryPlaythroughObjectFactory {
  constructor(private readOnlyStoryNodeObjectFactory:
      ReadOnlyStoryNodeObjectFactory) {}

  createFromBackendDict(
      storyPlaythroughBackendDict:
      IStoryPlaythroughBackendDict): StoryPlaythrough {
    var nodeObjects: ReadOnlyStoryNode[] = [];
    var readOnlyStoryNodeObjectFactory = this.readOnlyStoryNodeObjectFactory;

    nodeObjects = storyPlaythroughBackendDict.story_nodes.map(
      readOnlyStoryNodeObjectFactory.createFromBackendDict);

    return new StoryPlaythrough(nodeObjects);
  }
}

angular.module('oppia').factory(
  'StoryPlaythroughObjectFactory',
  downgradeInjectable(StoryPlaythroughObjectFactory));
