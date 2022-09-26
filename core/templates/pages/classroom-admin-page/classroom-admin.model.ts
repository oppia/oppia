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
 * @fileoverview Create new classroom modal.
 */

import { AppConstants } from 'app.constants';
import { ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';

interface TopicIdToPrerequisiteTopicIds {
  [topicId: string]: string[];
}

interface NewClassroom {

}

interface ExistingClassroom {

}

export class NewClassroomData implements NewClassroom {

}

export class ExistingClassroomData implements ExistingClassroomData {

}


export class ClassroomData {
  classroomId: string;
  name: string;
  urlFragment: string;
  courseDetails: string;
  topicListIntro: string;
  topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;

  existingClassroomNames!: string[];

  classroomNameIsTooLong!: boolean;
  emptyClassroomName!: boolean;
  duplicateClassroomName!: boolean;
  classroomNameIsValid!: boolean;

  classroomUrlFragmentIsTooLong!: boolean;
  classroomUrlFragmentIsEmpty!: boolean;
  urlFragmentRegexMatched!: boolean;
  classroomUrlFragmentIsValid!: boolean;
  duplicateClassroomUrlFragment!: boolean;

  constructor(
      classroomId: string,
      name: string,
      urlFragment: string,
      courseDetails: string,
      topicListIntro: string,
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ) {
    this.classroomId = classroomId;
    this.name = name;
    this.urlFragment = urlFragment;
    this.courseDetails = courseDetails;
    this.topicListIntro = topicListIntro;
    this.topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
  }

  supressClassroomNameErrorMessages(): void {
    this.classroomNameIsTooLong = false;
    this.emptyClassroomName = false;
    this.duplicateClassroomName = false;
  }

  supressClassroomUrlFragmentErrorMessages(): void {
    this.classroomUrlFragmentIsTooLong = false;
    this.classroomUrlFragmentIsEmpty = false;
    this.urlFragmentRegexMatched = true;
  }

  setExistingClassroomData(existingClassroomNames: string[]): void {
    this.existingClassroomNames = existingClassroomNames;
  }

  onClassroomNameChange(): void {
    this.name = this.name.replace(/\s+/g, ' ').trim();
    this.supressClassroomNameErrorMessages();
    this.classroomNameIsValid = true;

    if (this.name === '') {
      this.emptyClassroomName = true;
      this.classroomNameIsValid = false;
      return;
    }

    if (this.name.length > AppConstants.MAX_CHARS_IN_CLASSROOM_NAME) {
      this.classroomNameIsTooLong = true;
      this.classroomNameIsValid = false;
      return;
    }

    if (this.existingClassroomNames.indexOf(this.name) !== -1) {
      this.duplicateClassroomName = true;
      this.classroomNameIsValid = false;
    }
  }

  onClassroomUrlFragmentChange(): void {
    this.supressClassroomUrlFragmentErrorMessages();
    this.classroomUrlFragmentIsValid = true;

    if (this.urlFragment === '') {
      this.classroomUrlFragmentIsEmpty = true;
      this.classroomUrlFragmentIsValid = false;
      return;
    }

    if (
      this.urlFragment.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      this.classroomUrlFragmentIsTooLong = true;
      this.classroomUrlFragmentIsValid = false;
      return;
    }

    const validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (!validUrlFragmentRegex.test(this.urlFragment)) {
      this.urlFragmentRegexMatched = false;
      this.classroomUrlFragmentIsValid = false;
      return;
    }
  }

  static createNewClassroomFromDict(
      classroomDict: ClassroomDict
  ): ClassroomData {
    return new ClassroomData(
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
      classroomId: this.classroomId,
      name: this.name,
      urlFragment: this.urlFragment,
      courseDetails: this.courseDetails,
      topicListIntro: this.topicListIntro,
      topicIdToPrerequisiteTopicIds: this.topicIdToPrerequisiteTopicIds
    };
    return classroomDict;
  }
}
