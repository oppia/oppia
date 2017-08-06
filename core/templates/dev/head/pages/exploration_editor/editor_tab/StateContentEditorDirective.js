// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state content editor.
 */

oppia.directive('stateContentEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      link: function(scope, element) {
        // This allows the scope to be retrievable during Karma unit testing.
        // See http://stackoverflow.com/a/29833832 for more details.
        element[0].getControllerScope = function() {
          return scope;
        };
      },
      scope: {
        getOnSaveContentFn: '&onSaveContentFn'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'state_content_editor_directive.html'),
      controller: [
        '$scope', '$modal', 'stateContentService', 'editabilityService',
        'editorFirstTimeEventsService', 'explorationInitStateNameService',
        'editorContextService',
        function(
            $scope, $modal, stateContentService, editabilityService,
            editorFirstTimeEventsService, explorationInitStateNameService,
            editorContextService) {
          $scope.HTML_SCHEMA = {
            type: 'html'
          };

          $scope.stateContentService = stateContentService;
          $scope.contentEditorIsOpen = false;
          $scope.isEditable = editabilityService.isEditable;

          var saveContent = function() {
            stateContentService.saveDisplayedValue();
            $scope.contentEditorIsOpen = false;
          };

          var openMarkAllAudioAsNeedingUpdateModal = function() {
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'mark_all_audio_as_needing_update_modal_directive.html'),
              backdrop: true,
              resolve: {},
              controller: [
                '$scope', '$modalInstance',
                function($scope, $modalInstance) {
                  $scope.flagAll = function() {
                    $modalInstance.close();
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function() {
              var currentStateContent = stateContentService.displayed;
              currentStateContent.markAllAudioAsNeedingUpdate();
              stateContentService.saveDisplayedValue();
            });
          };

          $scope.$on('externalSave', function() {
            if ($scope.contentEditorIsOpen) {
              saveContent();
            }
          });

          $scope.isCurrentStateInitialState = function() {
            return (
              editorContextService.getActiveStateName() ===
              explorationInitStateNameService.savedMemento);
          };

          $scope.openStateContentEditor = function() {
            if ($scope.isEditable()) {
              editorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
              $scope.contentEditorIsOpen = true;
            }
          };

          $scope.onSaveContentButtonClicked = function() {
            editorFirstTimeEventsService.registerFirstSaveContentEvent();
            saveContent();

            var savedContent = stateContentService.savedMemento;
            if (savedContent.hasUnflaggedAudioTranslations()) {
              openMarkAllAudioAsNeedingUpdateModal();
            }
            $scope.getOnSaveContentFn()();
          };

          $scope.cancelEdit = function() {
            stateContentService.restoreFromMemento();
            $scope.contentEditorIsOpen = false;
          };

          $scope.onAudioTranslationsStartEditAction = function() {
            // Close the content editor and save all existing changes to the
            // HTML.
            if ($scope.contentEditorIsOpen) {
              saveContent();
            }
          };

          $scope.onAudioTranslationsEdited = function() {
            stateContentService.saveDisplayedValue();
          };
        }
      ]
    };
  }
]);
