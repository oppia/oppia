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

import { ReadOnlyStoryNodeObjectFactory } from
  'domain/story_viewer/ReadOnlyStoryNodeObjectFactory';
import { StoryNode } from 'domain/story_viewer/ReadOnlyStoryNodeObjectFactory';

export class StoryPlaythrough {
  nodes: Array<StoryNode>;

  constructor(nodes: Array<StoryNode>) {
    this.nodes = nodes;
  }

  getInitialNode(): StoryNode {
    return this.nodes[0];
  }

  getStoryNodeCount(): Number {
    return this.nodes.length;
  }

  getStoryNodes(): Array<StoryNode> {
    return this.nodes;
  }

  hasFinishedStory(): Boolean {
    return this.nodes.slice(-1)[0].isCompleted();
  }

  getNextPendingNodeId(): String {
    for (var i = 0; i < this.nodes.length; i++) {
      if (!this.nodes[i].isCompleted()) {
        return this.nodes[i].getId();
      }
    }
  }

  hasStartedStory(): Boolean {
    return this.nodes[0].isCompleted();
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoryPlaythroughObjectFactory {
  constructor(private readOnlyStoryNodeObjectFactory:
      ReadOnlyStoryNodeObjectFactory) {}

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'subtopicDataBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(storyPlaythroughBackendDict: any): StoryPlaythrough {
    var nodeObjects = [];
    var readOnlyStoryNodeObjectFactory = this.readOnlyStoryNodeObjectFactory;

    nodeObjects = storyPlaythroughBackendDict.story_nodes.map(
      function(node) {
        return readOnlyStoryNodeObjectFactory.createFromBackendDict(node);
      }
    );

    return new StoryPlaythrough(nodeObjects);
  }
}

angular.module('oppia').factory(
  'StoryPlaythroughObjectFactory',
  downgradeInjectable(StoryPlaythroughObjectFactory));
