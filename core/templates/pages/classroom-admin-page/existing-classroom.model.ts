// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Existing classroom model.
 */

import {AppConstants} from 'app.constants';
import {ClassroomDict} from '../../domain/classroom/classroom-backend-api.service';
import {NewClassroom, NewClassroomData} from './new-classroom.model';
import cloneDeep from 'lodash/cloneDeep';

export interface TopicIdToPrerequisiteTopicIds {
  [topicId: string]: string[];
}

export interface TopicIdToTopicName {
  [topicId: string]: string;
}

export interface ImageData {
  filename: string;
  bg_color: string;
  size_in_bytes: number;
  image_data?: Blob;
}

interface ExistingClassroom extends NewClassroom {
  _courseDetails: string;
  _teaserText: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  _topicIdToTopicName: TopicIdToTopicName;
  _isPublished: boolean;
  _thumbnail_data: ImageData;
  _banner_data: ImageData;
  getClassroomDict: () => ClassroomDict;
  getCourseDetails: () => string;
  getTopicListIntro: () => string;
  getTopicIdToPrerequisiteTopicId: () => TopicIdToPrerequisiteTopicIds;
  validateDependencyGraph: () => string;
  getPrerequisiteTopicIds: (topicId: string) => string[];
  getAllValidationErrors: () => string[];
}

export type ClassroomData = ExistingClassroom | NewClassroom;

export class ExistingClassroomData
  extends NewClassroomData
  implements ExistingClassroom
{
  _courseDetails: string;
  _teaserText: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  _topicsCountInClassroom: number;
  _topicIdToTopicName!: TopicIdToTopicName;
  _isPublished: boolean;
  _isDiagnosticTestEnabled: boolean;
  _thumbnail_data: ImageData;
  _banner_data: ImageData;

  constructor(
    classroomId: string,
    name: string,
    urlFragment: string,
    courseDetails: string,
    teaserText: string,
    topicListIntro: string,
    topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds,
    isPublished: boolean,
    isDiagnosticTestEnabled: boolean,
    thumbnailData: ImageData,
    bannerData: ImageData
  ) {
    super(classroomId, name, urlFragment);
    this._courseDetails = courseDetails;
    this._teaserText = teaserText;
    this._topicListIntro = topicListIntro;
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
    this._topicsCountInClassroom = 0;
    this._topicsCountInClassroom = Object.keys(
      this._topicIdToPrerequisiteTopicIds
    ).length;
    this._isPublished = isPublished;
    this._isDiagnosticTestEnabled = isDiagnosticTestEnabled;
    this._thumbnail_data = thumbnailData;
    this._banner_data = bannerData;
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
    return this._thumbnail_data;
  }

  getBannerData(): ImageData {
    return this._banner_data;
  }

  getIsDiagnosticTestEnabled(): boolean {
    return this._isDiagnosticTestEnabled;
  }

  getTopicIdToPrerequisiteTopicId(): TopicIdToPrerequisiteTopicIds {
    return this._topicIdToPrerequisiteTopicIds;
  }

  getIsPublished(): boolean {
    return this._isPublished;
  }

  setCourseDetails(courseDetails: string): void {
    this._courseDetails = courseDetails;
  }

  setIsPublished(isPublished: boolean): void {
    this._isPublished = isPublished;
  }

  setIsDiagnosticTestEnabled(isDiagnosticTestEnabled: boolean): void {
    this._isDiagnosticTestEnabled = isDiagnosticTestEnabled;
  }

  setTeaserText(teaserText: string): void {
    this._teaserText = teaserText;
  }

  setTopicListIntro(topicListIntro: string): void {
    this._topicListIntro = topicListIntro;
  }

  setBannerData(bannerData: ImageData): void {
    this._banner_data = bannerData;
  }

  setThumbnailData(thumbnailData: ImageData): void {
    this._thumbnail_data = thumbnailData;
  }

  setTopicIdToPrerequisiteTopicId(
    topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): void {
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
  }

  static createClassroomFromDict(
    classroomDict: ClassroomDict
  ): ExistingClassroomData {
    return new ExistingClassroomData(
      classroomDict.classroomId,
      classroomDict.name,
      classroomDict.urlFragment,
      classroomDict.courseDetails,
      classroomDict.teaserText,
      classroomDict.topicListIntro,
      classroomDict.topicIdToPrerequisiteTopicIds,
      classroomDict.isPublished,
      classroomDict.isDiagnosticTestEnabled,
      classroomDict.thumbnailData,
      classroomDict.bannerData
    );
  }

  getClassroomDict(): ClassroomDict {
    let classroomDict: ClassroomDict = {
      classroomId: this._classroomId,
      name: this._name,
      urlFragment: this._urlFragment,
      courseDetails: this._courseDetails,
      teaserText: this._teaserText,
      topicListIntro: this._topicListIntro,
      topicIdToPrerequisiteTopicIds: this._topicIdToPrerequisiteTopicIds,
      isPublished: this._isPublished,
      isDiagnosticTestEnabled: this._isDiagnosticTestEnabled,
      thumbnailData: this._thumbnail_data,
      bannerData: this._banner_data,
    };
    return classroomDict;
  }

  generateGraphErrorMsg(circularlyDependentTopics: string[]): string {
    let errorMsg = 'There is a cycle in the prerequisite dependencies. \n';
    for (let topicName of circularlyDependentTopics) {
      errorMsg += topicName + ' \u2192 ';
    }
    errorMsg += circularlyDependentTopics[0] + '.';
    errorMsg +=
      ' Please remove the circular dependency. You can click ' +
      'on "View Graph" below to see a visualization of the dependencies.';
    return errorMsg;
  }

  validateDependencyGraph(): string {
    let topicIdToChildTopicId: {[topicId: string]: string};
    for (let currentTopicId in this._topicIdToPrerequisiteTopicIds) {
      topicIdToChildTopicId = {};
      let ancestors = cloneDeep(
        this._topicIdToPrerequisiteTopicIds[currentTopicId]
      );

      for (let topicId of ancestors) {
        topicIdToChildTopicId[topicId] = currentTopicId;
      }

      let visitedTopicIdsForCurrentTopic = [];
      while (ancestors.length > 0) {
        if (ancestors.indexOf(currentTopicId) !== -1) {
          let nextTopic = currentTopicId;
          let circularlyDependentTopics = [];

          circularlyDependentTopics.push(
            this._topicIdToTopicName[topicIdToChildTopicId[nextTopic]]
          );
          while (true) {
            if (topicIdToChildTopicId[nextTopic] === currentTopicId) {
              break;
            }
            nextTopic = topicIdToChildTopicId[nextTopic];
            circularlyDependentTopics.push(
              this._topicIdToTopicName[topicIdToChildTopicId[nextTopic]]
            );
          }

          return this.generateGraphErrorMsg(circularlyDependentTopics);
        }

        let lengthOfAncestor = ancestors.length;
        let lastTopicIdInAncestor = ancestors[lengthOfAncestor - 1];
        ancestors.splice(lengthOfAncestor - 1, 1);

        if (
          visitedTopicIdsForCurrentTopic.indexOf(lastTopicIdInAncestor) !== -1
        ) {
          continue;
        }

        ancestors = ancestors.concat(
          this._topicIdToPrerequisiteTopicIds[lastTopicIdInAncestor]
        );
        visitedTopicIdsForCurrentTopic.push(lastTopicIdInAncestor);

        for (let topicId of this._topicIdToPrerequisiteTopicIds[
          lastTopicIdInAncestor
        ]) {
          topicIdToChildTopicId[topicId] = lastTopicIdInAncestor;
        }
      }
    }
    return '';
  }

  addNewTopicId(topicId: string): void {
    this._topicIdToPrerequisiteTopicIds[topicId] = [];
    this._topicsCountInClassroom += 1;
  }

  removeTopic(topicId: string): void {
    delete this._topicIdToPrerequisiteTopicIds[topicId];
    this._topicsCountInClassroom -= 1;
  }

  addPrerequisiteTopicId(
    currentTopicId: string,
    prerequisiteTopicId: string
  ): void {
    this._topicIdToPrerequisiteTopicIds[currentTopicId].push(
      prerequisiteTopicId
    );
  }

  removeDependency(currentTopicId: string, prerequisiteTopicId: string): void {
    const index =
      this._topicIdToPrerequisiteTopicIds[currentTopicId].indexOf(
        prerequisiteTopicId
      );
    this._topicIdToPrerequisiteTopicIds[currentTopicId].splice(index, 1);
  }

  getPrerequisiteTopicIds(topicId: string): string[] {
    return this._topicIdToPrerequisiteTopicIds[topicId];
  }

  getTopicsCount(): number {
    return this._topicsCountInClassroom;
  }

  setTopicIdToTopicName(topicIdToTopicName: TopicIdToTopicName): void {
    this._topicIdToTopicName = topicIdToTopicName;
  }

  private getClassroomTeaserTextValidationErrors(): string {
    let errorMsg = '';
    if (this._teaserText === '') {
      errorMsg = 'The classroom teaser text should not be empty.';
    } else if (
      this._teaserText.length > AppConstants.MAX_CHARS_IN_CLASSROOM_TEASER_TEXT
    ) {
      errorMsg =
        'The classroom teaser text should contain at most 68 characters.';
    }
    return errorMsg;
  }

  private getClassroomCourseDetailsValidationErrors(): string {
    let errorMsg = '';
    if (this._courseDetails === '') {
      errorMsg = 'The classroom course details should not be empty.';
    } else if (
      this._courseDetails.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_COURSE_DETAILS
    ) {
      errorMsg =
        'The classroom course details should contain at most 720 characters.';
    }
    return errorMsg;
  }

  private getClassroomTopicListIntroValidationErrors(): string {
    let errorMsg = '';
    if (this._topicListIntro === '') {
      errorMsg = 'The classroom topic list intro should not be empty.';
    } else if (
      this._topicListIntro.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_TOPIC_LIST_INTRO
    ) {
      errorMsg =
        'The classroom topic list intro should contain at most 240 characters.';
    }
    return errorMsg;
  }

  private getClassroomThumbnailValidationErrors(): string {
    let errorMsg = '';
    if (this._thumbnail_data.filename === '') {
      errorMsg = 'The classroom thumbnail should not be empty.';
    }
    return errorMsg;
  }

  private getClassroomBannerValidationErrors(): string {
    let errorMsg = '';
    if (this._banner_data.filename === '') {
      errorMsg = 'The classroom banner should not be empty.';
    }
    return errorMsg;
  }

  private getClassroomTopicCountValidationError(): string {
    let errorMsg = '';
    if (this.getTopicsCount() === 0) {
      errorMsg = 'A classroom should have at least one topic.';
    }
    return errorMsg;
  }

  getAllValidationErrors(): string[] {
    return [
      this.getClassroomBannerValidationErrors(),
      this.getClassroomNameValidationErrors(),
      this.getClassroomCourseDetailsValidationErrors(),
      this.getClassroomTopicListIntroValidationErrors(),
      this.getClassroomTopicCountValidationError(),
      this.getClassroomThumbnailValidationErrors(),
      this.getClassroomTeaserTextValidationErrors(),
      this.getClassroomNameValidationErrors(),
      this.getClassroomUrlValidationErrors(),
      this.validateDependencyGraph(),
    ].filter(error => error !== '');
  }
}
