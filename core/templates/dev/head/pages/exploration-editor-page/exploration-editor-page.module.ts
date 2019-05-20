// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the exploration editor page and the editor
 *               help tab in the navbar.
 */

var load = require.context('./', true, /\.module\.ts$/)
load.keys().forEach(load);
module.exports = angular.module('explorationEditorPageModule', []).name;

angular.module('explorationEditorPageModule', ['editorNavbarBreadcrumbModule',
  'editorNavigationModule', 'explorationEditorTabModule',
  'explorationSaveAndPulishButtonsModule', 'explorationObjectiveEditorModule',
  'explorationTitleEditorModule',
  'feedbackTabModule', 'historyTabModule', 'improvementsTabModule',
  'markAllAudioAndTranslationsAsNeedingUpdateModule',
  'paramsChangesEditorModule',
  'previewTabModule', 'settingsTabModule', 'statisticsTabModule',
  'translationTabModule', 'valueGeneratorEditorModule'
]);

angular.module('explorationEditorPageModule').constant(
  'INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

angular.module('explorationEditorPageModule').constant(
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  'explorationTitleInputFocusLabel');
angular.module('explorationEditorPageModule').constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>');
angular.module('explorationEditorPageModule').constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>?v=<version>');
angular.module('explorationEditorPageModule').constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>');
angular.module('explorationEditorPageModule').constant(
  'TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/translate/<exploration_id>');
angular.module('explorationEditorPageModule').constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');

angular.module('explorationEditorPageModule').constant(
  'PARAM_ACTION_GET', 'get');

angular.module('explorationEditorPageModule').constant(
  'PARAM_ACTION_SET', 'set');

angular.module('explorationEditorPageModule').constant(
  'VOICEOVER_MODE', 'voiceoverMode');

angular.module('explorationEditorPageModule').constant(
  'TRANSLATION_MODE', 'translationMode');

// When an unresolved answer's frequency exceeds this threshold, an exploration
// will be blocked from being published until the answer is resolved.
angular.module('explorationEditorPageModule').constant(
  'UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD', 5);
  