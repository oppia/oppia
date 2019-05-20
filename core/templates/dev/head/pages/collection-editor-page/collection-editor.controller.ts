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
 * @fileoverview Primary controller for the collection editor page.
 */

// TODO(bhenning): These constants should be provided by the backend.

require('pages/collection-editor-page/collection-editor-navbar-breadcrumb/' +
  'collection-editor-navbar-breadcrumb.directive.ts');
require('pages/collection-editor-page/collection-editor-navbar/' +
  'collection-editor-navbar.directive.ts');
require('pages/collection-editor-page/editor-tab/' +
  'collection-editor-tab.directive.ts');
require('pages/collection-editor-page/history-tab/' +
  'collection-history-tab.directive.ts');
require(
  'pages/collection-editor-page/settings-tab/collection-settings-tabDirective.ts');
require('pages/collection-editor-page/statistics-tab/' +
  'collection-statistics-tab.directive.ts');

angular.module('collectionEditorPageModule').controller('CollectionEditor', [
  'CollectionEditorStateService',
  function(CollectionEditorStateService) {
    // Load the collection to be edited.
    CollectionEditorStateService.loadCollection(GLOBALS.collectionId);
  }
]);
