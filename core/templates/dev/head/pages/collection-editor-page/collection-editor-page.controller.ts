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
 * @fileoverview Directives required in collection editor.
 */

<<<<<<< HEAD:core/templates/dev/head/pages/collection-editor-page/collection-editor-page.controller.ts
// TODO(bhenning): These constants should be provided by the backend.

require('pages/collection-editor-page/navbar/' +
  'collection-editor-navbar-breadcrumb.directive.ts');
require('pages/collection-editor-page/navbar/' +
  'collection-editor-navbar.directive.ts');
require('pages/collection-editor-page/editor-tab/' +
  'collection-editor-tab.directive.ts');
require('pages/collection-editor-page/history-tab/' +
  'collection-history-tab.directive.ts');
require(
  'pages/collection-editor-page/settings-tab/collection-settings-tab.directive.ts');
require('pages/collection-editor-page/statistics-tab/' +
  'collection-statistics-tab.directive.ts');
require('pages/collection-editor-page/services/collection-editor-state.service.ts');
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

oppia.controller('CollectionEditor', [
  '$scope', 'CollectionEditorStateService', 'PageTitleService',
  'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
  function($scope, CollectionEditorStateService, PageTitleService,
      EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED) {
    // Load the collection to be edited.
    CollectionEditorStateService.loadCollection(GLOBALS.collectionId);
    var setTitle = function() {
      var title = CollectionEditorStateService.getCollection().getTitle();
      if (title) {
        PageTitleService.setPageTitle(title + ' - Oppia Editor');
      } else {
        PageTitleService.setPageTitle('Untitled Collection - Oppia Editor');
      }
    };

    $scope.$on(EVENT_COLLECTION_INITIALIZED, setTitle);
    $scope.$on(EVENT_COLLECTION_REINITIALIZED, setTitle);
  }
]);
=======
require('pages/collection_editor/CollectionEditorPageDirective.ts');
require('pages/collection_editor/CollectionEditorNavbarBreadcrumbDirective.ts');
require('pages/collection_editor/CollectionEditorNavbarDirective.ts');
>>>>>>> develop:core/templates/dev/head/pages/collection_editor/CollectionEditor.ts
