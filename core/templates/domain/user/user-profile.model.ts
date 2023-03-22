// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend Model for users.
 */

import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict
} from 'domain/summary/learner-exploration-summary.model';

export interface UserProfileBackendDict {
  'username': string;
  'profile_is_of_current_user': boolean;
  'username_of_viewed_profile': string;
  'user_bio': string;
  'subject_interests': string[];
  // The time in milliseconds when the user first contributed to Oppia.
  // This property is initially set as null for a new user .
  'first_contribution_msec': number | null;
  'user_impact_score': number;
  'is_already_subscribed': boolean;
  'is_user_visiting_own_profile': boolean;
  'created_exp_summary_dicts': LearnerExplorationSummaryBackendDict[];
  'edited_exp_summary_dicts': LearnerExplorationSummaryBackendDict[];
}

export class UserProfile {
  constructor(
    public username: string,
    public profileIsOfCurrentUser: boolean,
    public usernameOfViewedProfile: string,
    public userBio: string,
    public subjectInterests: string[],
    public firstContributionMsec: number | null,
    public userImpactScore: number,
    public isAlreadySubscribed: boolean,
    public isUserVisitingOwnProfile: boolean,
    public createdExpSummaries: LearnerExplorationSummary[],
    public editedExpSummaries: LearnerExplorationSummary[]
  ) {}

  static createFromBackendDict(
      backendDict: UserProfileBackendDict): UserProfile {
    return new UserProfile(
      backendDict.username,
      backendDict.profile_is_of_current_user,
      backendDict.username_of_viewed_profile,
      backendDict.user_bio,
      backendDict.subject_interests,
      backendDict.first_contribution_msec,
      backendDict.user_impact_score,
      backendDict.is_already_subscribed,
      backendDict.is_user_visiting_own_profile,
      backendDict.created_exp_summary_dicts.map(
        dict => LearnerExplorationSummary.createFromBackendDict(dict)),
      backendDict.edited_exp_summary_dicts.map(
        dict => LearnerExplorationSummary.createFromBackendDict(dict))
    );
  }
}
