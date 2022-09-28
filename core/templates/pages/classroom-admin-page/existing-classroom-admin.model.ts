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

import { AppConstants } from 'app.constants';
import { ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';
import { NewClassroom } from './new-classroom-admin.model';


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
  IsClassroomNameValid: () => ValidateClassroomFieldResponse;
  IsClassroomUrlFragmentIsValid: () => ValidateClassroomFieldResponse;
}

export type ClassroomData = ExistingClassroom | NewClassroom;


export class ExistingClassroomData implements ExistingClassroom {
  _classroomId: string;
  _name: string;
  _urlFragment: string;
  _courseDetails: string;
  _topicListIntro: string;
  _topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  _existingClassroomNames!: string[];
  _classroomNameIsValid!: boolean;
  _classroomUrlFragmentIsValid!: boolean;

  constructor(
      classroomId: string,
      name: string,
      urlFragment: string,
      courseDetails: string,
      topicListIntro: string,
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ) {
    this._classroomId = classroomId;
    this._name = name;
    this._urlFragment = urlFragment;
    this._courseDetails = courseDetails;
    this._topicListIntro = topicListIntro;
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
  }

  getClassroomId(): string {
    return this._classroomId;
  }

  getClassroomName(): string {
    return this._name;
  }

  getClassroomUrlFragment(): string {
    return this._urlFragment;
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

  setClassroomName(name: string): void {
    this._name = name;
  }

  setClassroomUrlFragment(urlFragment: string): void {
    this._urlFragment = urlFragment;
  }

  setCourseDetails(courseDetails: string): void {
    this._courseDetails = courseDetails;
  }

  setTopicListIntro(topicListIntro: string): void {
    this._topicListIntro = topicListIntro;
  }

  IsClassroomNameValid(): ValidateClassroomFieldResponse {
    this._classroomNameIsValid = true;

    if (this._name === '') {
      return {
        type: 'The classroom name should not be empty.',
        result: false
      };
    }

    if (this._name.length > AppConstants.MAX_CHARS_IN_CLASSROOM_NAME) {
      return {
        type: 'The classroom name should contain at most 39 characters.',
        result: false
      };
    }

    return {
      type: '',
      result: true
    };
  }

  IsClassroomUrlFragmentIsValid(): ValidateClassroomFieldResponse {
    if (this._urlFragment === '') {
      return {
        type: 'The classroom URL fragment should not be empty.',
        result: false
      };
    }

    if (
        this._urlFragment.length >
        AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      return {
        type: (
          'The classroom URL fragment should contain at most 20 characters.'),
        result: false
      };
    }

    const validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (!validUrlFragmentRegex.test(this._urlFragment)) {
      return {
        type: (
          'The classroom URL fragment should only contain lowercase ' +
          'letters separated by hyphens.'),
        result: false
      };
    }

    return {
      type: '',
      result: true
    };
  }

  setExistingClassroomNames(existingClassroomNames): void {
    this._existingClassroomNames = existingClassroomNames;
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
