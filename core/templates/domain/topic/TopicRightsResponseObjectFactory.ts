// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of frontend
 * topic rights objects
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';


export interface ITopicRightsBackendDict {
  'topic_id': number,
  'topic_is_published': boolean,
  'manager_ids': Array<string>
}

export class TopicRightsResponseData {
  topicId: number;
  topicIsPublished: boolean;
  managerIds: string[];
  constructor(
      topicId: number,
      topicIsPublished: boolean,
      managerIds: string[]
  ) {
    this.topicId = topicId;
    this.topicIsPublished = topicIsPublished;
    this.managerIds = managerIds;
  }

  getTopicId(): number {
    return this.topicId;
  }

  getTopicIsPublished(): boolean {
    return this.topicIsPublished;
  }

  getManagerIds(): string[] {
    return this.managerIds;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TopicRightsResponseObjectFactory {
  createFromBackendDict(
      topicRightsBackendDataDict: ITopicRightsBackendDict):
    TopicRightsResponseData {
    return new TopicRightsResponseData (
      topicRightsBackendDataDict.topic_id,
      topicRightsBackendDataDict.topic_is_published,
      topicRightsBackendDataDict.manager_ids
    );
  }
}

angular.module('oppia').factory(
  'TopicRightsResponseObjectFactory',
  downgradeInjectable(TopicRightsResponseObjectFactory));
