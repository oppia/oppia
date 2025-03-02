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
  CreatorTopicSummaryBackendDict,
} from 'domain/topic/creator-topic-summary.model';
import {ImageData} from 'pages/classroom-admin-page/existing-classroom.model';

export class ClassroomData {
  _classroom_id: string;
  _name: string;
  _urlFragment: string;
  _topicSummaries: CreatorTopicSummary[];
  _courseDetails: string;
  _topicListIntro: string;
  _teaserText: string;
  _isPublished: boolean;
  _isDiagnosticTestEnabled: boolean;
  _thumbnailData: ImageData;
  _bannerData: ImageData;
  _publicClassroomsCount: number;

  constructor(
    classroomId: string,
    name: string,
    urlFragment: string,
    topicSummaries: CreatorTopicSummary[],
    courseDetails: string,
    topicListIntro: string,
    teaserText: string,
    isPublished: boolean,
    isDiagnosticTestEnabled: boolean,
    thumbnailData: ImageData,
    bannerData: ImageData,
    publicClassroomsCount: number
  ) {
    this._classroom_id = classroomId;
    this._name = name;
    this._urlFragment = urlFragment;
    this._topicSummaries = topicSummaries;
    this._courseDetails = courseDetails;
    this._topicListIntro = topicListIntro;
    this._teaserText = teaserText;
    this._isPublished = isPublished;
    this._isDiagnosticTestEnabled = isDiagnosticTestEnabled;
    this._thumbnailData = thumbnailData;
    this._bannerData = bannerData;
    this._publicClassroomsCount = publicClassroomsCount;
  }

  static createFromBackendData(
    classroomId: string,
    name: string,
    urlFragment: string,
    topicSummaryDicts: CreatorTopicSummaryBackendDict[],
    courseDetails: string,
    topicListIntro: string,
    teaserText: string,
    isPublished: boolean,
    isDiagnosticTestEnabled: boolean,
    thumbnailData: ImageData,
    bannerData: ImageData,
    publicClassroomsCount: number
  ): ClassroomData {
    let topicSummaries = topicSummaryDicts.map(summaryDict => {
      return CreatorTopicSummary.createFromBackendDict(summaryDict);
    });
    return new ClassroomData(
      classroomId,
      name,
      urlFragment,
      topicSummaries,
      courseDetails,
      topicListIntro,
      teaserText,
      isPublished,
      isDiagnosticTestEnabled,
      thumbnailData,
      bannerData,
      publicClassroomsCount
    );
  }

  getName(): string {
    return this._name;
  }

  getUrlFragment(): string {
    return this._urlFragment;
  }

  getTopicSummaries(): CreatorTopicSummary[] {
    return this._topicSummaries.slice();
  }

  getCourseDetails(): string {
    return this._courseDetails;
  }

  getTeaserText(): string {
    return this._teaserText;
  }

  getTopicListIntro(): string {
    return this._topicListIntro;
  }

  getThumbnailData(): ImageData {
    return this._thumbnailData;
  }

  getBannerData(): ImageData {
    return this._bannerData;
  }

  getIsPublished(): boolean {
    return this._isPublished;
  }

  getIsDiagnosticTestEnabled(): boolean {
    return this._isDiagnosticTestEnabled;
  }

  getPublicClassroomsCount(): number {
    return this._publicClassroomsCount;
  }

  getClassroomId(): string {
    return this._classroom_id;
  }
}
