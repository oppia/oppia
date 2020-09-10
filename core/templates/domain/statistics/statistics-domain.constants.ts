// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for the statistics domain.
 */

export const StatisticsDomainConstants = {
  LEARNER_ACTION_SCHEMA_LATEST_VERSION: 1,
  ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE: 'answer-details',
  PLAYTHROUGH_IMPROVEMENT_TASK_TYPE: 'playthrough',
  FEEDBACK_IMPROVEMENT_TASK_TYPE: 'feedback',
  SUBMIT_LEARNER_ANSWER_DETAILS_URL:
    '/learneranswerdetailshandler/<entity_type>/<entity_id>',
  SUGGESTION_IMPROVEMENT_TASK_TYPE: 'suggestion',
} as const;
