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
 * @fileoverview Model class for creating instances of frontend
 * story summary domain objects.
 */

import {
  StoryNode, StoryNodeBackendDict
} from './story-node.model';

export interface StorySummaryBackendDict {
  'id': string;
  'title': string;
  'node_titles': string[];
  'thumbnail_filename': string;
  'thumbnail_bg_color': string;
  'description': string;
  'story_is_published': boolean;
  'completed_node_titles': string[];
  'url_fragment': string;
  'all_node_dicts': StoryNodeBackendDict[];
  // This property is optional because it is only present in the
  // story summary dict of learner dashboard page.
  'topic_name'?: string;
  'topic_url_fragment'?: string;
  'classroom_url_fragment'?: string;
}

export class StorySummary {
  constructor(
    private _id: string,
    private _title: string,
    private _nodeTitles: string[],
    private _thumbnailFilename: string,
    private _thumbnailBgColor: string,
    private _description: string,
    private _storyIsPublished: boolean,
    private _completedNodeTitles: string[],
    private _urlFragment: string,
    private _allNodes: StoryNode[],
    private _topicName: string | undefined,
    private _topicUrlFragment: string | undefined,
    private _classroomUrlFragment: string | undefined
  ) {}

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this._title;
  }

  getNodeTitles(): string[] {
    return this._nodeTitles.slice();
  }

  getThumbnailFilename(): string {
    return this._thumbnailFilename;
  }

  isNodeCompleted(nodeTitle: string): boolean {
    return (this._completedNodeTitles.indexOf(nodeTitle) !== -1);
  }

  getThumbnailBgColor(): string {
    return this._thumbnailBgColor;
  }

  getDescription(): string | undefined {
    return this._description;
  }

  getCompletedNodeTitles(): string[] {
    return this._completedNodeTitles;
  }

  getTopicName(): string | undefined {
    return this._topicName;
  }

  isStoryPublished(): boolean {
    return this._storyIsPublished;
  }

  getUrlFragment(): string {
    return this._urlFragment;
  }

  getAllNodes(): StoryNode[] {
    return this._allNodes;
  }

  getTopicUrlFragment(): string | undefined {
    return this._topicUrlFragment;
  }

  getClassroomUrlFragment(): string | undefined {
    return this._classroomUrlFragment;
  }

  static createFromBackendDict(
      storySummaryBackendDict: StorySummaryBackendDict): StorySummary {
    let allNodes = (
      storySummaryBackendDict.all_node_dicts.map(storyNodeDict => {
        return StoryNode.createFromBackendDict(
          storyNodeDict);
      }));
    return new StorySummary(
      storySummaryBackendDict.id,
      storySummaryBackendDict.title,
      storySummaryBackendDict.node_titles,
      storySummaryBackendDict.thumbnail_filename,
      storySummaryBackendDict.thumbnail_bg_color,
      storySummaryBackendDict.description,
      storySummaryBackendDict.story_is_published,
      storySummaryBackendDict.completed_node_titles,
      storySummaryBackendDict.url_fragment,
      allNodes,
      storySummaryBackendDict.topic_name,
      storySummaryBackendDict.topic_url_fragment,
      storySummaryBackendDict.classroom_url_fragment
    );
  }
}
