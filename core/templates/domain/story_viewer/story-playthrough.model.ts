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
 * @fileoverview Frontend Model for story playthrough.
 */

import {
  ReadOnlyStoryNode,
  StoryNodeBackendDict,
} from 'domain/story_viewer/read-only-story-node.model';

export interface StoryPlaythroughBackendDict {
  story_id: string;
  story_nodes: StoryNodeBackendDict[];
  story_title: string;
  story_description: string;
  topic_name: string;
  meta_tag_content: string;
}

export class StoryPlaythrough {
  id: string;
  nodes: ReadOnlyStoryNode[];
  title: string;
  description: string;
  topicName: string;
  metaTagContent: string;

  constructor(
    id: string,
    nodes: ReadOnlyStoryNode[],
    title: string,
    description: string,
    topicName: string,
    metaTagContent: string
  ) {
    this.id = id;
    this.nodes = nodes;
    this.title = title;
    this.description = description;
    this.topicName = topicName;
    this.metaTagContent = metaTagContent;
  }

  static createFromBackendDict(
    storyPlaythroughBackendDict: StoryPlaythroughBackendDict
  ): StoryPlaythrough {
    var nodeObjects = storyPlaythroughBackendDict.story_nodes.map(
      storyNodeDict => ReadOnlyStoryNode.createFromBackendDict(storyNodeDict)
    );

    return new StoryPlaythrough(
      storyPlaythroughBackendDict.story_id,
      nodeObjects,
      storyPlaythroughBackendDict.story_title,
      storyPlaythroughBackendDict.story_description,
      storyPlaythroughBackendDict.topic_name,
      storyPlaythroughBackendDict.meta_tag_content
    );
  }

  getInitialNode(): ReadOnlyStoryNode {
    return this.nodes[0];
  }

  getStoryNodeCount(): number {
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
    throw new Error('No story nodes found!');
  }

  hasStartedStory(): boolean {
    return this.nodes[0].isCompleted();
  }

  getStoryId(): string {
    return this.id;
  }

  getMetaTagContent(): string {
    return this.metaTagContent;
  }
}
