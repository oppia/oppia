// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the Feedback updates.
 */

export const FeedbackUpdatesPageConstants = {
  FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS: {
    LAST_UPDATED: {
      key: 'lastUpdatedMsecs',
      i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED',
    },
    EXPLORATION: {
      key: 'explorationTitle',
      i18nId: 'I18N_DASHBOARD_TABLE_HEADING_EXPLORATION',
    },
  },
} as const;
