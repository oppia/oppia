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

import { ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';
import { NewClassroom, NewClassroomData } from './new-classroom.model';
import cloneDeep from 'lodash/cloneDeep';


export interface TopicIdToPrerequisiteTopicIds {
  [topicId: string]: string[];
}

export interface TopicIdToTopicName {
  [topicId: string]: string;
}


interface ExistingClassroom extends NewClassroom {
  _courseDetails: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  _topicIdToTopicName: TopicIdToTopicName;
  getClassroomDict: () => ClassroomDict;
  getCourseDetails: () => string;
  getTopicListIntro: () => string;
  getTopicIdToPrerequisiteTopicId: () => TopicIdToPrerequisiteTopicIds;
  validateDependencyGraph: () => string;
  getPrerequisiteTopicIds: (topicId: string) => string[];
}

export type ClassroomData = ExistingClassroom | NewClassroom;


export class ExistingClassroomData extends
    NewClassroomData implements ExistingClassroom {
  _courseDetails: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  _topicsCountInClassroom: number;
  _topicIdToTopicName!: TopicIdToTopicName;

  constructor(
      classroomId: string,
      name: string,
      urlFragment: string,
      courseDetails: string,
      topicListIntro: string,
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ) {
    super(classroomId, name, urlFragment);
    this._courseDetails = courseDetails;
    this._topicListIntro = topicListIntro;
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
    this._topicsCountInClassroom = 0;
    this._topicsCountInClassroom = Object.keys(
      this._topicIdToPrerequisiteTopicIds).length;
  }

  getCourseDetails(): string {
    return this._courseDetails;
  }

  getTopicListIntro(): string {
    return this._topicListIntro;
  }

  getTopicIdToPrerequisiteTopicId(): TopicIdToPrerequisiteTopicIds {
    return this._topicIdToPrerequisiteTopicIds;
  }

  setCourseDetails(courseDetails: string): void {
    this._courseDetails = courseDetails;
  }

  setTopicListIntro(topicListIntro: string): void {
    this._topicListIntro = topicListIntro;
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
      classroomDict.topicListIntro,
      classroomDict.topicIdToPrerequisiteTopicIds
    );
  }

  getClassroomDict(): ClassroomDict {
    let classroomDict: ClassroomDict = {
      classroomId: this._classroomId,
      name: this._name,
      urlFragment: this._urlFragment,
      courseDetails: this._courseDetails,
      topicListIntro: this._topicListIntro,
      topicIdToPrerequisiteTopicIds: this._topicIdToPrerequisiteTopicIds
    };
    return classroomDict;
  }

  generateGraphErrorMsg(circularlyDependentTopics: string[]): string {
    let errorMsg = 'There is a cycle in the prerequisite dependencies. \n';
    for (let topicName of circularlyDependentTopics) {
      errorMsg += (topicName + ' \u2192 ');
    }
    errorMsg += (circularlyDependentTopics[0] + '.');
    errorMsg += (
      ' Please remove the circular dependency. You can click ' +
      'on "View Graph" below to see a visualization of the dependencies.'
    );
    return errorMsg;
  }

  validateDependencyGraph(): string {
    let topicIdToChildTopicId: {[topicId: string]: string};
    for (let currentTopicId in this._topicIdToPrerequisiteTopicIds) {
      topicIdToChildTopicId = {};
      let ancestors = cloneDeep(
        this._topicIdToPrerequisiteTopicIds[currentTopicId]);

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
          visitedTopicIdsForCurrentTopic.indexOf(
            lastTopicIdInAncestor) !== -1
        ) {
          continue;
        }

        ancestors = ancestors.concat(
          this._topicIdToPrerequisiteTopicIds[lastTopicIdInAncestor]);
        visitedTopicIdsForCurrentTopic.push(lastTopicIdInAncestor);

        for (
          let topicId of
          this._topicIdToPrerequisiteTopicIds[lastTopicIdInAncestor]
        ) {
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
      prerequisiteTopicId);
  }

  removeDependency(
      currentTopicId: string,
      prerequisiteTopicId: string
  ): void {
    const index = (
      this._topicIdToPrerequisiteTopicIds[currentTopicId].indexOf(
        prerequisiteTopicId)
    );
    this._topicIdToPrerequisiteTopicIds[currentTopicId].splice(
      index, 1);
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
}
