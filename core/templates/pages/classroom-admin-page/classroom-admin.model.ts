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

import { ClassroomDict } from '../../domain/classroom/classroom-backend-api.service';

interface TopicIdToPrerequisiteTopicIds {
  [topicId: string]: string[];
}

interface NewClassroom {
  classroomId: string;
  name: string;
  urlFragment: string;

  classroomNameIsTooLong: boolean;
  emptyClassroomName: boolean;
  duplicateClassroomName: boolean;
  classroomNameIsValid: boolean;

  classroomUrlFragmentIsTooLong: boolean;
  classroomUrlFragmentIsEmpty: boolean;
  urlFragmentRegexMatched: boolean;
  classroomUrlFragmentIsValid: boolean;
  duplicateClassroomUrlFragment: boolean;
  existingClassroomNames: string[];
}

interface ExistingClassroom extends NewClassroom {
  courseDetails: string;
  topicListIntro: string;
  topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds;
  getClassroomDict: () => ClassroomDict;
}

export type ClassroomData = NewClassroom | ExistingClassroom;


export class NewClassroomData implements NewClassroom {
  classroomId: string;
  name: string;
  urlFragment: string;

  existingClassroomNames!: string[];

  classroomNameIsTooLong: boolean;
  emptyClassroomName: boolean;
  duplicateClassroomName: boolean;
  classroomNameIsValid: boolean;

  classroomUrlFragmentIsTooLong: boolean;
  classroomUrlFragmentIsEmpty: boolean;
  urlFragmentRegexMatched: boolean;
  classroomUrlFragmentIsValid: boolean;
  duplicateClassroomUrlFragment: boolean;

  constructor(
      classroomId: string,
      name: string,
      urlFragment: string
  ) {
    this.classroomId = classroomId;
    this.name = name;
    this.urlFragment = urlFragment;
  }
}


export class ExistingClassroomData implements ExistingClassroom {
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
