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

oppia.constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE',
  '/topic_editor_handler/data/<topic_id>');

oppia.constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');

oppia.constant(
  'EVENT_TYPE_TOPIC_CREATION_ENABLED', 'topicCreationEnabled');

oppia.constant(
  'EVENT_TYPE_SKILL_CREATION_ENABLED', 'skillCreationEnabled');

oppia.constant(
  'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'topicsAndSkillsDashboardReinitialized');
