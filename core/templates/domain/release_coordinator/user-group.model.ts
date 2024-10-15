// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend Model for User Group.
 */

export interface UserGroupBackendDict {
  user_group_id: string;
  name: string;
  member_usernames: string[];
}

/**
 * Frontend domain object representation of user groups.
 */
export class UserGroup {
  userGroupId: string;
  name: string;
  memberUsernames: string[];

  constructor(userGroupId: string, name: string, users: string[]) {
    this.userGroupId = userGroupId;
    this.name = name;
    this.memberUsernames = users;
  }

  static createFromBackendDict(backendDict: UserGroupBackendDict): UserGroup {
    return new UserGroup(
      backendDict.user_group_id,
      backendDict.name,
      backendDict.member_usernames
    );
  }
}
