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
 * @fileoverview Directive for displaying and editing a collection node. This
 * directive allows creators to shift nodes to left or right
 * and also delete the collection node represented by this directive.
 */

require('domain/collection/CollectionUpdateService.ts');
require('domain/utilities/UrlInterpolationService.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');
require(
  'pages/collection-editor-page/services/collection-linearizer.service.ts');
require('services/AlertsService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('collectionNodeEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getCollectionNode: '&collectionNode',
        getLinearIndex: '&linearIndex'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-editor-page/editor-tab/' +
        'collection-node-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'CollectionEditorStateService', 'CollectionLinearizerService',
        'CollectionUpdateService', 'AlertsService',
        function(
            CollectionEditorStateService, CollectionLinearizerService,
            CollectionUpdateService, AlertsService) {
          var ctrl = this;
          ctrl.collection = CollectionEditorStateService.getCollection();

          // Deletes this collection node from the frontend collection
          // object and also updates the changelist.
          ctrl.deleteNode = function() {
            var explorationId = ctrl.getCollectionNode().getExplorationId();
            if (!CollectionLinearizerService.removeCollectionNode(
              ctrl.collection, explorationId)) {
              AlertsService.fatalWarning(
                'Internal collection editor error. Could not delete ' +
                'exploration by ID: ' + explorationId);
            }
          };

          // Shifts this collection node left in the linearized list of the
          // collection, if possible.
          ctrl.shiftNodeLeft = function() {
            var explorationId = ctrl.getCollectionNode().getExplorationId();
            if (!CollectionLinearizerService.shiftNodeLeft(
              ctrl.collection, explorationId)) {
              AlertsService.fatalWarning(
                'Internal collection editor error. Could not shift node left ' +
                'with ID: ' + explorationId);
            }
          };

          // Shifts this collection node right in the linearized list of the
          // collection, if possible.
          ctrl.shiftNodeRight = function() {
            var explorationId = ctrl.getCollectionNode().getExplorationId();
            if (!CollectionLinearizerService.shiftNodeRight(
              ctrl.collection, explorationId)) {
              AlertsService.fatalWarning(
                'Internal collection editor error. Could not shift node ' +
                'right with ID: ' + explorationId);
            }
          };
        }
      ]
    };
  }]);
