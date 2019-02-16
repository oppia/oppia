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
 * @fileoverview Directive for the state translation editor.
 */

oppia.directive('stateTranslationEditor', [
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
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'state_translation_editor_directive.html'),
      controller: [
        '$scope', 'StateContentService', 'EditabilityService', function(
            $scope, StateContentService, EditabilityService) {
          $scope.HTML_SCHEMA = {
            type: 'unicode'
          };
          $scope.contentId = null;
          $scope.StateContentService = StateContentService;
          if (StateContentService.displayed) {
            $scope.contentId = StateContentService.displayed.getContentId();
          }

          $scope.contentEditorIsOpen = false;
          $scope.isEditable = EditabilityService.isEditable;

          var saveContent = function() {
            StateContentService.saveDisplayedValue();
            $scope.onSaveStateContent(StateContentService.displayed);
            $scope.contentEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.contentEditorIsOpen) {
              saveContent();
            }
          });

          $scope.openStateContentEditor = function() {
            if ($scope.isEditable()) {
              $scope.contentEditorIsOpen = true;
            }
          };

          $scope.onSaveContentButtonClicked = function() {
            EditorFirstTimeEventsService.registerFirstSaveContentEvent();
            var savedContent = StateContentService.savedMemento;
            var contentHasChanged = (
              savedContent.getHtml() !==
              StateContentService.displayed.getHtml());
            if (contentHasChanged) {
              var contentId = StateContentService.displayed.getContentId();
              $scope.showMarkAllAudioAsNeedingUpdateModalIfRequired(contentId);
            }
            saveContent();
          };

          $scope.cancelEdit = function() {
            StateContentService.restoreFromMemento();
            $scope.contentEditorIsOpen = false;
          };
        }
      ]
    };
  }
]);
