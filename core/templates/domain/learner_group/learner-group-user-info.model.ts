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

export interface LearnerGroupUserInfoBackendDict {
  username: string;
  error: string;
}

export class LearnerGroupUserInfo {
  _username: string;
  _error: string;

  constructor(
      username: string,
      error: string
  ) {
    this._username = username;
    this._error = error;
  }

  get username(): string {
    return this._username;
  }

  get error(): string {
    return this._error;
  }

  static createFromBackendDict(
      infoBackendDict: LearnerGroupUserInfoBackendDict
  ): LearnerGroupUserInfo {
    return new LearnerGroupUserInfo(
      infoBackendDict.username,
      infoBackendDict.error
    );
  }
}
