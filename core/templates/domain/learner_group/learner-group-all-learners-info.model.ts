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

import { LearnerGroupUserInfo, LearnerGroupUserInfoBackendDict } from
  './learner-group-user-info.model';

/**
 * @fileoverview Model for displaying instances of frontend domain objects of
 * all learners info of the learner group.
 */

export interface LearnerGroupAllLearnersInfoBackendDict {
  learners_info: LearnerGroupUserInfoBackendDict[];
  invited_learners_info: LearnerGroupUserInfoBackendDict[];
}

export class LearnerGroupAllLearnersInfo {
  _learnersInfo: LearnerGroupUserInfo[];
  _invitedLearnersInfo: LearnerGroupUserInfo[];

  constructor(
      learnersInfo: LearnerGroupUserInfo[],
      invitedLearnersInfo: LearnerGroupUserInfo[]
  ) {
    this._learnersInfo = learnersInfo;
    this._invitedLearnersInfo = invitedLearnersInfo;
  }

  get learnersInfo(): LearnerGroupUserInfo[] {
    return this._learnersInfo;
  }

  get invitedLearnersInfo(): LearnerGroupUserInfo[] {
    return this._invitedLearnersInfo;
  }

  static createFromBackendDict(
      infoBackendDict: LearnerGroupAllLearnersInfoBackendDict
  ): LearnerGroupAllLearnersInfo {
    return new LearnerGroupAllLearnersInfo(
      infoBackendDict.learners_info.map((info) => {
        return LearnerGroupUserInfo.createFromBackendDict(info);
      }),
      infoBackendDict.invited_learners_info.map((info) => {
        return LearnerGroupUserInfo.createFromBackendDict(info);
      }));
  }
}
