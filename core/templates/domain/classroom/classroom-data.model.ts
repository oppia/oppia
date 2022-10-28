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
  CreatorTopicSummary,
  CreatorTopicSummaryBackendDict
} from 'domain/topic/creator-topic-summary.model';

export class ClassroomData {
  _name: string;
  _topicSummaries: CreatorTopicSummary[];
  _courseDetails: string;
  _topicListIntro: string;

  constructor(
      name: string, topicSummaries: CreatorTopicSummary[],
      courseDetails: string, topicListIntro: string) {
    this._name = name;
    this._topicSummaries = topicSummaries;
    this._courseDetails = courseDetails;
    this._topicListIntro = topicListIntro;
  }

  static createFromBackendData(
      name: string, topicSummaryDicts: CreatorTopicSummaryBackendDict[],
      courseDetails: string, topicListIntro: string): ClassroomData {
    let topicSummaries = topicSummaryDicts.map(
      (summaryDict) => {
        return CreatorTopicSummary.createFromBackendDict(
          summaryDict);
      }
    );
    return new ClassroomData(
      name, topicSummaries, courseDetails, topicListIntro);
  }

  getName(): string {
    return this._name;
  }

  getTopicSummaries(): CreatorTopicSummary[] {
    return this._topicSummaries.slice();
  }

  getCourseDetails(): string {
    return this._courseDetails;
  }

  getTopicListIntro(): string {
    return this._topicListIntro;
  }
}
