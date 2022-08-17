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

import { LearnerGroupAllStudentsInfo } from './learner-group-all-students-info.model';

/**
 * @fileoverview Tests for learner group all students info model.
 */

describe('Learner Group All Students Info', () => {
  it('should correctly convert backend dict to object', () => {
    const sampleLearnerGroupAllStudentsInfoDict = {
      students_info: [{
        username: 'user1',
        profile_picture_data_url: 'profile_picture',
        error: 'some error message'
      }],
      invited_students_info: [{
        username: 'user2',
        profile_picture_data_url: 'profile_picture2',
        error: 'some error message'
      }]
    };

    const sampleAllStudentsInfo = (
      LearnerGroupAllStudentsInfo.createFromBackendDict(
        sampleLearnerGroupAllStudentsInfoDict)
    );

    expect(sampleAllStudentsInfo.studentsInfo[0].username).toEqual('user1');
    expect(
      sampleAllStudentsInfo.studentsInfo[0].userProfilePictureUrl
    ).toEqual('profile_picture');
    expect(sampleAllStudentsInfo.studentsInfo[0].error).toEqual(
      'some error message');
    expect(sampleAllStudentsInfo.invitedStudentsInfo[0].username).toEqual(
      'user2');
    expect(
      sampleAllStudentsInfo.invitedStudentsInfo[0].userProfilePictureUrl
    ).toEqual('profile_picture2');
    expect(sampleAllStudentsInfo.invitedStudentsInfo[0].error).toEqual(
      'some error message');
  });
});
