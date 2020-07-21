// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the creator dashboard page.
 */

export class ContributorDashboardConstants {
  public static CONTRIBUTOR_DASHBOARD_TABS_DETAILS = {
    myContributionTab: {
      ariaLabel: 'Check your contributions.',
      tabName: 'My Contributions',
      description: '',
      customizationOptions: []
    },
    submitQuestionTab: {
      ariaLabel: 'See opportunities for adding new questions.',
      tabName: 'Submit Question',
      description: 'Submit a question for students to answer while ' +
        'practicing that skill.',
      customizationOptions: ['sort']
    },
    translateTextTab: {
      ariaLabel: 'See opportunities for translation.',
      tabName: 'Translate Text',
      description: 'Translate the lesson text to help non-English speakers ' +
        'follow the lessons.',
      customizationOptions: ['language', 'sort']
    }
  };

  public static DEFAULT_OPPORTUNITY_LANGUAGE_CODE= 'hi';
}
