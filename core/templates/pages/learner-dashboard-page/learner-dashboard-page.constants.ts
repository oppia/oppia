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
 * @fileoverview Constants for the Learner dashboard.
 */

export const LearnerDashboardPageConstants = {
  LEARNER_DASHBOARD_SECTION_I18N_IDS: {
    INCOMPLETE: 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION',
    COMPLETED: 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION',
    PLAYLIST: 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION',
    HOME: 'I18N_LEARNER_DASHBOARD_HOME_SECTION',
    PROGRESS: 'I18N_LEARNER_DASHBOARD_PROGRESS_SECTION',
    GOALS: 'I18N_LEARNER_DASHBOARD_GOALS_SECTION',
    CURRENT_GOALS: 'I18N_LEARNER_DASHBOARD_CURRENT_GOALS_SECTION',
    COMPLETED_GOALS: 'I18N_LEARNER_DASHBOARD_COMPLETED_GOALS_SECTION',
    LEARNER_GROUPS: 'I18N_LEARNER_DASHBOARD_LEARNER_GROUPS_SECTION',
    COMMUNITY_LESSONS: 'I18N_LEARNER_DASHBOARD_COMMUNITY_LESSONS_SECTION'
  },

  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS: {
    EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
    COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS',
    LEARN_TOPIC: 'I18N_DASHBOARD_LEARN_TOPIC',
    STORIES: 'I18N_DASHBOARD_STORIES',
    SKILL_PROFICIENCY: 'I18N_DASHBOARD_SKILL_PROFICIENCY',
    LESSONS: 'I18N_DASHBOARD_LESSONS'
  },

  FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS: {
    LAST_UPDATED: {
      key: 'lastUpdatedMsecs',
      i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED'
    },
    EXPLORATION: {
      key: 'explorationTitle',
      i18nId: 'I18N_DASHBOARD_TABLE_HEADING_EXPLORATION'
    }
  }
} as const;
