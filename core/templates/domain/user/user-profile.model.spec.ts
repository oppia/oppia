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
 * @fileoverview Tests for UserProfileModel.
 */

import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {UserProfile} from 'domain/user/user-profile.model';

describe('User profile model', () => {
  it('should create a user profile object from a backend dict', () => {
    var backendDict = {
      username: 'user1',
      profile_is_of_current_user: false,
      is_user_visiting_own_profile: false,
      created_exp_summary_dicts: [
        {
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title',
        },
      ],
      is_already_subscribed: false,
      first_contribution_msec: null,
      user_impact_score: 0,
      edited_exp_summary_dicts: [
        {
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title',
        },
      ],
      subject_interests: [],
      username_of_viewed_profile: 'user2',
      user_bio: 'hi',
      user_email: 'test@email.com',
    };

    var userProfile = UserProfile.createFromBackendDict(backendDict);

    var exploration = LearnerExplorationSummary.createFromBackendDict(
      backendDict.created_exp_summary_dicts[0]
    );

    expect(userProfile.createdExpSummaries).toEqual([exploration]);
    expect(userProfile.username).toEqual('user1');
    expect(userProfile.editedExpSummaries).toEqual([exploration]);
    expect(userProfile.firstContributionMsec).toEqual(null),
      expect(userProfile.isAlreadySubscribed).toEqual(false);
    expect(userProfile.isUserVisitingOwnProfile).toEqual(false);
    expect(userProfile.profileIsOfCurrentUser).toEqual(false);
    expect(userProfile.usernameOfViewedProfile).toEqual('user2');
    expect(userProfile.subjectInterests).toEqual([]);
    expect(userProfile.userBio).toEqual('hi');
    expect(userProfile.userImpactScore).toEqual(0);
  });
});
