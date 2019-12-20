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

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { StatisticsDomainConstants } from
  'domain/statistics/statistics-domain.constants';

angular.module('oppia').constant(
  'LEARNER_ACTION_SCHEMA_LATEST_VERSION',
  StatisticsDomainConstants.LEARNER_ACTION_SCHEMA_LATEST_VERSION);
angular.module('oppia').constant(
  'ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE',
  StatisticsDomainConstants.ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE);
angular.module('oppia').constant(
  'PLAYTHROUGH_IMPROVEMENT_TASK_TYPE',
  StatisticsDomainConstants.PLAYTHROUGH_IMPROVEMENT_TASK_TYPE);

angular.module('oppia').constant(
  'FEEDBACK_IMPROVEMENT_TASK_TYPE',
  StatisticsDomainConstants.FEEDBACK_IMPROVEMENT_TASK_TYPE);
angular.module('oppia').constant(
  'SUBMIT_LEARNER_ANSWER_DETAILS_URL',
  StatisticsDomainConstants.SUBMIT_LEARNER_ANSWER_DETAILS_URL);
angular.module('oppia').constant(
  'SUGGESTION_IMPROVEMENT_TASK_TYPE',
  StatisticsDomainConstants.SUGGESTION_IMPROVEMENT_TASK_TYPE);
