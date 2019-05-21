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
 * @fileoverview Module for the topics and skills dashboard.
 */

var load = require.context('./', true, /\.module\.ts$/);
load.keys().forEach(load);

var moduleInit = angular.module('topicsAndSkillsDashboardModule', [
  'selectTopicsModule', 'skillsListModule',
  'topicsAndSkillsDashboardNavbarBreadcrumbModule',
  'topicsAndSkillsDashboardNavbarModule', 'topicsListModule']);

angular.module('topicsAndSkillsDashboardModule').constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE',
  '/topic_editor_handler/data/<topic_id>');

angular.module('topicsAndSkillsDashboardModule').constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');

angular.module('topicsAndSkillsDashboardModule').constant(
  'EVENT_TYPE_TOPIC_CREATION_ENABLED', 'topicCreationEnabled');

angular.module('topicsAndSkillsDashboardModule').constant(
  'EVENT_TYPE_SKILL_CREATION_ENABLED', 'skillCreationEnabled');

angular.module('topicsAndSkillsDashboardModule').constant(
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'topicsAndSkillsDashboardReinitialized');

module.exports = moduleInit.name;
