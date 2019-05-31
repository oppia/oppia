// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Primary directive for the collection editor page.
 */

require('pages/collection_editor/editor_tab/CollectionEditorTabDirective.ts');
require('pages/collection_editor/history_tab/CollectionHistoryTabDirective.ts');
require(
  'pages/collection_editor/settings_tab/CollectionSettingsTabDirective.ts');
require(
  'pages/collection_editor/statistics_tab/CollectionStatisticsTabDirective.ts');

require('pages/collection_editor/CollectionEditorStateService.ts');
require('services/PageTitleService.ts');

// TODO(bhenning): These constants should be provided by the backend.
oppia.constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
oppia.constant(
  'EDITABLE_COLLECTION_DATA_URL_TEMPLATE',
  '/collection_editor_handler/data/<collection_id>');
oppia.constant(
  'COLLECTION_RIGHTS_URL_TEMPLATE',
  '/collection_editor_handler/rights/<collection_id>');

oppia.constant(
  'COLLECTION_TITLE_INPUT_FOCUS_LABEL', 'collectionTitleInputFocusLabel');

oppia.constant(
  'SEARCH_EXPLORATION_URL_TEMPLATE',
  '/exploration/metadata_search?q=<query>');

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

oppia.directive('collectionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection_editor/collection_editor_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'CollectionEditorStateService', 'PageTitleService',
        'RouterService', 'EVENT_COLLECTION_INITIALIZED',
        'EVENT_COLLECTION_REINITIALIZED',
        function(
            $scope, CollectionEditorStateService, PageTitleService,
            RouterService, EVENT_COLLECTION_INITIALIZED,
            EVENT_COLLECTION_REINITIALIZED) {
          var ctrl = this;
          ctrl.getActiveTabName = RouterService.getActiveTabName;
          // Load the collection to be edited.
          CollectionEditorStateService.loadCollection(
            GLOBALS.collectionId);
          var setTitle = function() {
            var title = (
              CollectionEditorStateService.getCollection().getTitle());
            if (title) {
              PageTitleService.setPageTitle(title + ' - Oppia Editor');
            } else {
              PageTitleService.setPageTitle(
                'Untitled Collection - Oppia Editor');
            }
          };

          $scope.$on(EVENT_COLLECTION_INITIALIZED, setTitle);
          $scope.$on(EVENT_COLLECTION_REINITIALIZED, setTitle);
        }]
    };
  }
]);
