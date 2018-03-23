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
 * directive allows creators to add and remove prerequisite and acquired skills,
 * and also delete the collection node represented by this directive.
 */

oppia.directive('collectionNodeEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getCollectionNode: '&collectionNode',
        getLinearIndex: '&linearIndex'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection_editor/editor_tab/' +
        'collection_node_editor_directive.html'),
      controller: [
        '$scope', 'CollectionEditorStateService', 'CollectionLinearizerService',
        'CollectionUpdateService', 'AlertsService',
        function(
            $scope, CollectionEditorStateService, CollectionLinearizerService,
            CollectionUpdateService, AlertsService) {
          $scope.collection = CollectionEditorStateService.getCollection();

          // Deletes this collection node from the frontend collection
          // object and also updates the changelist.
          $scope.deleteNode = function() {
            var explorationId = $scope.getCollectionNode().getExplorationId();
            if (!CollectionLinearizerService.removeCollectionNode(
              $scope.collection, explorationId)) {
              AlertsService.fatalWarning(
                'Internal collection editor error. Could not delete ' +
                'exploration by ID: ' + explorationId);
            }
          };

          // Shifts this collection node left in the linearized list of the
          // collection, if possible.
          $scope.shiftNodeLeft = function() {
            var explorationId = $scope.getCollectionNode().getExplorationId();
            if (!CollectionLinearizerService.shiftNodeLeft(
              $scope.collection, explorationId)) {
              AlertsService.fatalWarning(
                'Internal collection editor error. Could not shift node left ' +
                'with ID: ' + explorationId);
            }
          };

          // Shifts this collection node right in the linearized list of the
          // collection, if possible.
          $scope.shiftNodeRight = function() {
            var explorationId = $scope.getCollectionNode().getExplorationId();
            if (!CollectionLinearizerService.shiftNodeRight(
              $scope.collection, explorationId)) {
              AlertsService.fatalWarning(
                'Internal collection editor error. Could not shift node ' +
                'right with ID: ' + explorationId);
            }
          };
        }
      ]
    };
  }]);
