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

export interface StoryPlaythroughBackendDict {
  'story_nodes': IStoryNodeBackendDict[];
  'story_title': string;
  'story_description': string;
  'topic_name': string;
}

export class StoryPlaythrough {
  nodes: ReadOnlyStoryNode[];
  title: string;
  description: string;
  topicName: string;

  constructor(
      nodes: ReadOnlyStoryNode[],
      title: string,
      description: string,
      topicName: string) {
    this.nodes = nodes;
    this.title = title;
    this.description = description;
    this.topicName = topicName;
  }

  getInitialNode(): ReadOnlyStoryNode {
    return this.nodes[0];
  }

  getStoryNodeCount(): Number {
    return this.nodes.length;
  }

  getStoryNodes(): ReadOnlyStoryNode[] {
    return this.nodes;
  }

  hasFinishedStory(): boolean {
    return this.nodes.slice(-1)[0].isCompleted();
  }

  getNextPendingNodeId(): string {
    for (var i = 0; i < this.nodes.length; i++) {
      if (!this.nodes[i].isCompleted()) {
        return this.nodes[i].getId();
      }
    }
  }

  hasStartedStory(): boolean {
    return this.nodes[0].isCompleted();
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
      StoryPlaythroughBackendDict): StoryPlaythrough {
    var nodeObjects = storyPlaythroughBackendDict.story_nodes.map(
      storyNodeDict => this.readOnlyStoryNodeObjectFactory
        .createFromBackendDict(storyNodeDict));

    return new StoryPlaythrough(
      nodeObjects,
      storyPlaythroughBackendDict.story_title,
      storyPlaythroughBackendDict.story_description,
      storyPlaythroughBackendDict.topic_name);
  }
}

angular.module('oppia').factory(
  'StoryPlaythroughObjectFactory',
  downgradeInjectable(StoryPlaythroughObjectFactory));
