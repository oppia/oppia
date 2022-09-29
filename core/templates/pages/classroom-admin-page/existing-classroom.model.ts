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


export interface ValidateClassroomFieldResponse {
  result: boolean;
  type: string;
}

interface TopicIdToPrerequisiteTopicIds {
  [topicId: string]: string[];
}

interface ExistingClassroom extends NewClassroom {
  _courseDetails: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  getClassroomDict: () => ClassroomDict;
  getCourseDetails: () => string;
  getTopicListIntro: () => string;
  getTopicIdToPrerequisiteTopicId: () => TopicIdToPrerequisiteTopicIds;
}

export type ClassroomData = ExistingClassroom | NewClassroom;


export class ExistingClassroomData extends
    NewClassroomData implements ExistingClassroom {
  _courseDetails: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;

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
}
