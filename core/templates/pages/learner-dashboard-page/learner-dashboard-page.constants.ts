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
    SUBSCRIPTIONS: 'I18N_LEARNER_DASHBOARD_SUBSCRIPTIONS_SECTION',
    FEEDBACK: 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION',
    PLAYLIST: 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION'
  },

  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS: {
    EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
    COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS'
  },

  EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS: {
    LAST_PLAYED: {
      key: 'last_played',
      i18nId: 'I18N_LEARNER_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_PLAYED'
    },
    TITLE: {
      key: 'title',
      i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE'
    },
    CATEGORY: {
      key: 'category',
      i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_CATEGORY'
    }
  },

  SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS: {
    USERNAME: {
      key: 'username',
      i18nId: 'I18N_PREFERENCES_USERNAME'
    },
    IMPACT: {
      key: 'impact',
      i18nId: 'I18N_CREATOR_IMPACT'
    }
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
