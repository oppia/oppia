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

require(
  'pages/collection-editor-page/editor-tab/collection-editor-tab.directive.ts');
require(
  'pages/collection-editor-page/history-tab/' +
  'collection-history-tab.directive.ts');
require(
  'pages/collection-editor-page/settings-tab/' +
  'collection-settings-tab.directive.ts');
require(
  'pages/collection-editor-page/statistics-tab/' +
  'collection-statistics-tab.directive.ts');

require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require('services/PageTitleService.ts');

require('pages/collection-editor-page/collection-editor-page.constants.ts');
require('pages/interaction-specs.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('collectionEditorPage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-editor-page/collection-editor-page.directive.html'),
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
