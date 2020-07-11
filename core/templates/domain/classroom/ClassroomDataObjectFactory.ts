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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import {
  TopicSummary, TopicSummaryObjectFactory, ITopicSummaryBackendDict
} from 'domain/topic/TopicSummaryObjectFactory';

export class ClassroomData {
  _name: string;
  _topicSummaries: TopicSummary[];
  _courseDetails: string;
  _topicListIntro: string;

  constructor(
      name: string, topicSummaries: TopicSummary[], courseDetails: string,
      topicListIntro: string) {
    this._name = name;
    this._topicSummaries = topicSummaries;
    this._courseDetails = courseDetails;
    this._topicListIntro = topicListIntro;
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

  getTopicListIntro(): string {
    return this._topicListIntro;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClassroomDataObjectFactory {
  constructor(
      private topicSummaryObjectFactory: TopicSummaryObjectFactory) {}

  createFromBackendData(
      name: string, topicSummaryDicts: ITopicSummaryBackendDict[],
      courseDetails: string, topicListIntro: string): ClassroomData {
    let topicSummaries = topicSummaryDicts.map(
      (summaryDict) => {
        return this.topicSummaryObjectFactory.createFromBackendDict(
          summaryDict);
      }
    );
    return new ClassroomData(
      name, topicSummaries, courseDetails, topicListIntro
    );
  }
}

angular.module('oppia').factory(
  'ClassroomDataObjectFactory',
  downgradeInjectable(ClassroomDataObjectFactory));
