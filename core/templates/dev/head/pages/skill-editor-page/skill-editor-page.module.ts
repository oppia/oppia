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
 * @fileoverview Module for the skill editor page.
 */
var load = require.context('./', true, /\.module\.ts$/);
load.keys().forEach(load);

var moduleInit = angular.module('skillEditorModule', [
  'skillEditorMainTabModule', 'skillEditorNavbarModule',
  'skillEditorNavbarBreadcrumbModule', 'skillEditorQuestionsTabModule']);

angular.module('skillEditorModule').constant(
  'INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
angular.module('skillEditorModule').constant(
  'SKILL_RIGHTS_URL_TEMPLATE',
  '/skill_editor_handler/rights/<skill_id>');
angular.module('skillEditorModule').constant(
  'SKILL_PUBLISH_URL_TEMPLATE',
  '/skill_editor_handler/publish_skill/<skill_id>');
angular.module('skillEditorModule').constant(
  'EVENT_SKILL_INITIALIZED', 'skillInitialized');
angular.module('skillEditorModule').constant(
  'EVENT_SKILL_REINITIALIZED', 'skillReinitialized');
angular.module('skillEditorModule').constant(
  'EVENT_QUESTION_SUMMARIES_INITIALIZED', 'questionSummariesInitialized');
  
module.exports = moduleInit.name;
