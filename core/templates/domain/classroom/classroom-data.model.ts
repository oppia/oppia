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
 * @fileoverview Frontend Model for classroom data.
 */

import {
  TopicSummary,
  TopicSummaryBackendDict
} from 'domain/topic/topic-summary.model';

export class ClassroomData {
  _name: string;
  _publicTopicSummaries: TopicSummary[];
  _privateTopicSummaries: TopicSummary[];
  _courseDetails: string;
  _topicListIntro: string;

  constructor(
      name: string, publicTopicSummaries: TopicSummary[],
      privateTopicSummaries: TopicSummary[], courseDetails: string,
      topicListIntro: string) {
    this._name = name;
    this._publicTopicSummaries = publicTopicSummaries;
    this._privateTopicSummaries = privateTopicSummaries;
    this._courseDetails = courseDetails;
    this._topicListIntro = topicListIntro;
  }

  static createFromBackendData(
      name: string, publicTopicSummaryDicts: TopicSummaryBackendDict[],
      privateTopicSummaryDicts: TopicSummaryBackendDict[],
      courseDetails: string, topicListIntro: string): ClassroomData {
    let publicTopicSummaries = publicTopicSummaryDicts.map(
      (summaryDict) => {
        return TopicSummary.createFromBackendDict(
          summaryDict);
      }
    );
    let privateTopicSummaries = privateTopicSummaryDicts.map(
      (summaryDict) => {
        return TopicSummary.createFromBackendDict(
          summaryDict);
      }
    );
    return new ClassroomData(
      name, publicTopicSummaries, privateTopicSummaries, courseDetails,
      topicListIntro
    );
  }

  getName(): string {
    return this._name;
  }

  getPublicTopicSummaries(): TopicSummary[] {
    return this._publicTopicSummaries.slice();
  }

  getPrivateTopicSummaries(): TopicSummary[] {
    return this._privateTopicSummaries.slice();
  }

  getCourseDetails(): string {
    return this._courseDetails;
  }

  getTopicListIntro(): string {
    return this._topicListIntro;
  }
}
