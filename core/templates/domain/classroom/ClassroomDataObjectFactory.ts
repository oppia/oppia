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
 * @fileoverview Object factory for creating frontend instances of
 * classroom objects.
 */

export interface IClassroomDataBackendDict {
  name: string,
  topic_summary_dicts: ITopicSummaryBackendDict[],
  course_details: string,
  topics_covered: string
}

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import {
  TopicSummary, TopicSummaryObjectFactory, ITopicSummaryBackendDict
} from 'domain/topic/TopicSummaryObjectFactory';

export class ClassroomData {
  _name: string;
  _topicSummaries: TopicSummary[];
  _courseDetails: string;
  _topicsCovered: string;

  constructor(
      name: string, topicSummaries: TopicSummary[], courseDetails: string,
      topicsCovered: string) {
    this._name = name;
    this._topicSummaries = topicSummaries;
    this._courseDetails = courseDetails;
    this._topicsCovered = topicsCovered;
  }

  getName(): string {
    return this._name;
  }

  getTopicSummaries(): TopicSummary[] {
    return this._topicSummaries.slice();
  }

  getCourseDetails(): string {
    return this._courseDetails;
  }

  getTopicsCovered(): string {
    return this._topicsCovered;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomDataObjectFactory {
  constructor(
      private topicSummaryObjectFactory: TopicSummaryObjectFactory) {}

  createFromBackendDict(
      classroomDict: IClassroomDataBackendDict): ClassroomData {
    let topicSummaries = classroomDict.topic_summary_dicts.map(
      (summaryDict) => {
        return this.topicSummaryObjectFactory.createFromBackendDict(
          summaryDict);
      }
    );
    return new ClassroomData(
      classroomDict.name, topicSummaries, classroomDict.course_details,
      classroomDict.topics_covered
    );
  }
}

angular.module('oppia').factory(
  'ClassroomDataObjectFactory',
  downgradeInjectable(ClassroomDataObjectFactory));
