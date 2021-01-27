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
 * @fileoverview Constants for the topics and skills dashboard.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { TopicsAndSkillsDashboardPageConstants } from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';

angular.module('oppia').constant(
  'SKILL_DESCRIPTION_STATUS_VALUES',
  TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES);

angular.module('oppia').constant(
  'TOPIC_SORT_OPTIONS',
  TopicsAndSkillsDashboardPageConstants.TOPIC_SORT_OPTIONS);
angular.module('oppia').constant(
  'TOPIC_PUBLISHED_OPTIONS',
  TopicsAndSkillsDashboardPageConstants.TOPIC_PUBLISHED_OPTIONS);
angular.module('oppia').constant(
  'TOPIC_FILTER_CLASSROOM_ALL',
  TopicsAndSkillsDashboardPageConstants.TOPIC_FILTER_CLASSROOM_ALL);
angular.module('oppia').constant(
  'SKILL_STATUS_OPTIONS',
  TopicsAndSkillsDashboardPageConstants.SKILL_STATUS_OPTIONS);
