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
      link: function(scope, elm, attrs) {
        elm.draggable({
          handle: '.oppia-state-translation-editor-drag-bar',
        });
      },
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'state_translation_editor_directive.html'),
      controller: [
        '$scope', 'StateWrittenTranslationsService', 'EditabilityService',
        'TranslationTabActiveContentIdService',
          function(
            $scope, StateWrittenTranslationsService, EditabilityService,
            TranslationTabActiveContentIdService) {
          $scope.HTML_SCHEMA = {
            type: 'html',
            'ui_config': {
              'hide_complex_extensions': 'true'
            }
          };
          $scope.contentId = null;
          $scope.translationHtml = null;
          $scope.contentId = (
            TranslationTabActiveContentIdService.getActiveContentId());

          $scope.translationEditorIsOpen = false;
          $scope.isTranslatable = EditabilityService.isTranslatable;

          $scope.getTranslationHtml = function() {
            var langaugeCode = TranslationLanguageService
              .getActiveLanguageCode();
            if (StateWrittenTranslationsService.displayed.hasWrittenTranslation(
              $scope.contentId, langaugeCode)) {
              $scope.translationHtml = StateWrittenTranslationsService.displayed
                .getWrittenTranslation(
                  $scope.contentId, langaugeCode).getHtml();
              return $scope.translationHtml;
            }
          }
          var saveTranslation = function() {
            StateContentService.saveDisplayedValue();
            $scope.translationEditorIsOpen = false;
          };

          $scope.$on('externalSave', function() {
            if ($scope.translationEditorIsOpen) {
              saveTranslation();
            }
          });

          $scope.openTranslationEditor = function() {
            if ($scope.isTranslatable()) {
              $scope.translationEditorIsOpen = true;
            }
          };

          $scope.onSaveTranslationButtonClicked = function() {
            if (!StateWrittenTranslationsService.savedMemento
              .hasWrittenTranslation($scope.contentId, langaugeCode)) {

            }
            var contentHasChanged = (
              savedContent.getHtml() !==
              StateContentService.displayed.getHtml());
            if (contentHasChanged) {
              var contentId = StateContentService.displayed.getContentId();
            }
            saveTranslation();
          };

          $scope.cancelEdit = function() {
            StateContentService.restoreFromMemento();
            $scope.translationEditorIsOpen = false;
          };
        }
      ]
    };
  }
]);
