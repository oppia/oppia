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
 * @fileoverview Model for displaying instances of frontend learner group
 * user info domain objects.
 */

export interface LearnerGroupAllStudentsInfoBackendDict {
  students_info: LearnerGroupUserInfoBackendDict[];
  invited_students_info: LearnerGroupUserInfoBackendDict[];
}

export class LearnerGroupAllStudentsInfo {
  _studentsInfo: LearnerGroupUserInfo[];
  _invitedStudentsInfo: LearnerGroupUserInfo[];

  constructor(
      studentsInfo: LearnerGroupUserInfo[],
      invitedStudentsInfo: LearnerGroupUserInfo[]
  ) {
    this._studentsInfo = studentsInfo;
    this._invitedStudentsInfo = invitedStudentsInfo;
  }

  get studentsInfo(): LearnerGroupUserInfo[] {
    return this._studentsInfo;
  }

  get invitedStudentsInfo(): LearnerGroupUserInfo[] {
    return this._invitedStudentsInfo;
  }

  static createFromBackendDict(
      infoBackendDict: LearnerGroupAllStudentsInfoBackendDict
  ): LearnerGroupAllStudentsInfo {
    return new LearnerGroupAllStudentsInfo(
      infoBackendDict.students_info.map((info) => {
        return LearnerGroupUserInfo.createFromBackendDict(info);
      }),
      infoBackendDict.invited_students_info.map((info) => {
        return LearnerGroupUserInfo.createFromBackendDict(info);
      }));
  }
}

export interface LearnerGroupUserInfoBackendDict {
  username: string;
  profile_picture_data_url: string;
  error: string;
}

export class LearnerGroupUserInfo {
  _username: string;
  _userProfilePictureUrl: string;
  _error: string;

  constructor(
      username: string,
      userProfilePictureUrl: string,
      error: string
  ) {
    this._username = username;
    this._userProfilePictureUrl = userProfilePictureUrl;
    this._error = error;
  }

  get username(): string {
    return this._username;
  }

  get userProfilePictureUrl(): string {
    return this._userProfilePictureUrl;
  }

  get error(): string {
    return this._error;
  }

  static createFromBackendDict(
      infoBackendDict: LearnerGroupUserInfoBackendDict
  ): LearnerGroupUserInfo {
    return new LearnerGroupUserInfo(
      infoBackendDict.username,
      infoBackendDict.profile_picture_data_url,
      infoBackendDict.error
    );
  }
}
