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
