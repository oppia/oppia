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
 * @fileoverview Constants for the Learner Group Pages.
 */

export const LearnerGroupPagesConstants = {
  LEARNER_GROUP_CREATION_SECTION_I18N_IDS: {
    GROUP_DETAILS: 'I18N_LEARNER_GROUP_GROUP_DETAILS_SECTION',
    ADD_SYLLABUS_ITEMS: 'I18N_LEARNER_GROUP_ADD_SYLLABUS_ITEMS_SECTION',
    INVITE_LEARNERS: 'I18N_LEARNER_GROUP_INVITE_LEARNERS_SECTION',
  },

  CREATE_LEARNER_GROUP_PAGE_URL: '/create-learner-group',

  EDIT_LEARNER_GROUP_PAGE_URL: '/edit-learner-group',

  EDIT_LEARNER_GROUP_TABS: {
    OVERVIEW: 'I18N_LEARNER_GROUP_OVERVIEW_TAB',
    LEARNERS_PROGRESS: 'I18N_LEARNER_GROUP_LEARNERS_PROGRESS_TAB',
    SYLLABUS: 'I18N_LEARNER_GROUP_SYLLABUS_TAB',
    PREFERENCES: 'I18N_LEARNER_GROUP_PREFERENCES_TAB'
  },

  EDIT_LEARNER_GROUP_PREFERENCES_SECTIONS: {
    GROUP_DETAILS: 'I18N_LEARNER_GROUP_GROUP_DETAILS_SECTION',
    GROUP_LEARNERS: 'I18N_LEARNER_GROUP_LEARNERS_SECTION',
  },

  EDIT_LEARNER_GROUP_OVERVIEW_SECTIONS: {
    SKILLS_ANALYSIS: 'I18N_LEARNER_GROUP_SKILLS_ANALYSIS_SECTION',
    PROGRESS_IN_STORIES: 'I18N_LEARNER_GROUP_PROGRESS_IN_STORIES_SECTION',
  },

  VIEW_LEARNER_GROUP_TABS: {
    OVERVIEW: 'I18N_LEARNER_GROUP_OVERVIEW_TAB',
    ASSIGNED_SYLLABUS: 'I18N_LEARNER_GROUP_ASSIGNED_SYLLABUS_TAB'
  }
} as const;
