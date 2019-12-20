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
 * @fileoverview Controller for the navbar breadcrumb of the collection editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/stateful/focus-manager.service.ts');

// TODO(bhenning): After the navbar is moved to a directive, this directive
// should be updated to say 'Loading...' if the collection editor's controller
// is not yet finished loading the collection. Also, this directive should
// support both displaying the current title of the collection (or untitled if
// it does not yet have one) or setting a new title in the case of an untitled
// collection.
angular.module('oppia').directive('collectionEditorNavbarBreadcrumb', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-editor-page/navbar/' +
        'collection-editor-navbar-breadcrumb.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'RouterService', 'CollectionEditorStateService',
        'FocusManagerService', 'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
        function(
            RouterService, CollectionEditorStateService,
            FocusManagerService, COLLECTION_TITLE_INPUT_FOCUS_LABEL) {
          var ctrl = this;
          var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
            main: 'Edit',
            preview: 'Preview',
            settings: 'Settings',
            stats: 'Statistics',
            improvements: 'Improvements',
            history: 'History',
          };

          ctrl.collection = CollectionEditorStateService.getCollection();

          ctrl.getCurrentTabName = function() {
            return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[
              RouterService.getActiveTabName()];
          };

          ctrl.editCollectionTitle = function() {
            RouterService.navigateToSettingsTab();
            FocusManagerService.setFocus(COLLECTION_TITLE_INPUT_FOCUS_LABEL);
          };
        }
      ]
    };
  }]);
