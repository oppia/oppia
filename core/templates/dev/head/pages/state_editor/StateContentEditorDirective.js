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
        getStateContentPlaceholder: '&stateContentPlaceholder',
        onSaveStateContent: '=',
        onSaveContentIdsToAudioTranslations: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/state_editor/state_content_editor_directive.html'),
      controller: [
        '$scope', '$uibModal', 'StateContentService', 'EditabilityService',
        'EditorFirstTimeEventsService', 'COMPONENT_NAME_CONTENT',
        'StateContentIdsToAudioTranslationsService',
        function(
            $scope, $uibModal, StateContentService, EditabilityService,
            EditorFirstTimeEventsService, COMPONENT_NAME_CONTENT,
            StateContentIdsToAudioTranslationsService) {
          $scope.HTML_SCHEMA = {
            type: 'html'
          };
          $scope.contentId = null;
          $scope.StateContentService = StateContentService;
          if (StateContentService.displayed) {
            $scope.contentId = StateContentService.displayed.getContentId();
          }

          $scope.StateContentIdsToAudioTranslationsService =
            StateContentIdsToAudioTranslationsService;
          $scope.contentEditorIsOpen = false;
          $scope.isEditable = EditabilityService.isEditable;
          $scope.COMPONENT_NAME_CONTENT = COMPONENT_NAME_CONTENT;

          var saveContent = function() {
            StateContentService.saveDisplayedValue();
            $scope.onSaveStateContent(StateContentService.displayed);
            $scope.contentEditorIsOpen = false;
          };

          var openMarkAllAudioAsNeedingUpdateModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'mark_all_audio_as_needing_update_modal_directive.html'),
              backdrop: true,
              resolve: {},
              controller: 'MarkAllAudioAsNeedingUpdateController'
            }).result.then(function() {
              var contentId = StateContentService.displayed.getContentId();
              StateContentIdsToAudioTranslationsService.displayed
                .markAllAudioAsNeedingUpdate(contentId);
              StateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                StateContentIdsToAudioTranslationsService.displayed
              );
            });
          };

          $scope.$on('externalSave', function() {
            if ($scope.contentEditorIsOpen) {
              saveContent();
            }
          });

          $scope.openStateContentEditor = function() {
            if ($scope.isEditable()) {
              EditorFirstTimeEventsService.registerFirstOpenContentBoxEvent();
              $scope.contentEditorIsOpen = true;
            }
          };

          $scope.onSaveContentButtonClicked = function() {
            EditorFirstTimeEventsService.registerFirstSaveContentEvent();
            var savedContent = StateContentService.savedMemento;
            var contentHasChanged = (
              savedContent.getHtml() !==
              StateContentService.displayed.getHtml());
            if (StateContentIdsToAudioTranslationsService.displayed
              .hasUnflaggedAudioTranslations(savedContent.getContentId()) &&
              contentHasChanged) {
              openMarkAllAudioAsNeedingUpdateModal();
            }
            saveContent();
          };

          $scope.cancelEdit = function() {
            StateContentService.restoreFromMemento();
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
            StateContentIdsToAudioTranslationsService.saveDisplayedValue();
            $scope.onSaveContentIdsToAudioTranslations(
              StateContentIdsToAudioTranslationsService.displayed
            );
          };
        }
      ]
    };
  }
]);
