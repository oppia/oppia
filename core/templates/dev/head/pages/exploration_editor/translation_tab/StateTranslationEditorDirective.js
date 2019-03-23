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
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'state_translation_editor_directive.html'),
      controller: [
        '$scope', '$uibModal', 'EditabilityService', 'ExplorationStatesService',
        'StateEditorService', 'StateWrittenTranslationsService',
        'TranslationLanguageService', 'TranslationTabActiveContentIdService',
        'WrittenTranslationObjectFactory', function(
            $scope, $uibModal, EditabilityService, ExplorationStatesService,
            StateEditorService, StateWrittenTranslationsService,
            TranslationLanguageService, TranslationTabActiveContentIdService,
            WrittenTranslationObjectFactory) {
          $scope.HTML_SCHEMA = {
            type: 'html',
            ui_config: {
              hide_complex_extensions: 'true'
            }
          };
          var showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
              contentId) {
            var stateName = StateEditorService.getActiveStateName();
            var state = ExplorationStatesService.getState(stateName);
            var contentIdsToAudioTranslations = (
              state.contentIdsToAudioTranslations);
            if (contentIdsToAudioTranslations.hasUnflaggedAudioTranslations(
              contentId)) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/components/forms/' +
                  'mark_all_audio_as_needing_update_modal_directive.html'),
                backdrop: true,
                resolve: {
                  considerTranslation: function() {
                    return false;
                  }
                },
                controller: 'MarkAllAudioAsNeedingUpdateController'
              }).result.then(function() {
                contentIdsToAudioTranslations.markAllAudioAsNeedingUpdate(
                  contentId);
                ExplorationStatesService.saveContentIdsToAudioTranslations(
                  stateName, contentIdsToAudioTranslations);
              });
            }
          };
          var contentId = null;
          var langaugeCode = null;
          $scope.activeWrittenTranslation = null;
          $scope.translationEditorIsOpen = false;
          $scope.isTranslatable = EditabilityService.isTranslatable;
          $scope.$on('activeContentIdChanged', function() {
            initEditor();
          });
          $scope.$on('activeLanguageChanged', function() {
            initEditor();
          });

          var initEditor = function() {
            $scope.activeWrittenTranslation = null;
            $scope.translationEditorIsOpen = false;
            contentId = (
              TranslationTabActiveContentIdService.getActiveContentId());
            langaugeCode = TranslationLanguageService.getActiveLanguageCode();
            if (StateWrittenTranslationsService.displayed.hasWrittenTranslation(
              contentId, langaugeCode)) {
              $scope.activeWrittenTranslation = (
                StateWrittenTranslationsService.displayed
                  .getWrittenTranslation(contentId, langaugeCode));
            }
          };
          initEditor();
          var saveTranslation = function() {
            var oldTranslation = '';
            var newTranslation = '';
            contentId = (
              TranslationTabActiveContentIdService.getActiveContentId());
            langaugeCode = TranslationLanguageService.getActiveLanguageCode();
            if (StateWrittenTranslationsService
              .savedMemento.hasWrittenTranslation(contentId, langaugeCode)) {
              oldTranslation = (StateWrittenTranslationsService
                .savedMemento.getWrittenTranslation(contentId, langaugeCode));
            }
            newTranslation = (StateWrittenTranslationsService
              .displayed.getWrittenTranslation(contentId, langaugeCode));
            if (oldTranslation !== newTranslation) {
              var stateName = StateEditorService.getActiveStateName();
              showMarkAllAudioAsNeedingUpdateModalIfRequired(contentId);
              StateWrittenTranslationsService.saveDisplayedValue();
              ExplorationStatesService.saveWrittenTranslations(
                stateName, StateWrittenTranslationsService.savedMemento);
            }
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
              if (!$scope.activeWrittenTranslation) {
                $scope.activeWrittenTranslation = (
                  WrittenTranslationObjectFactory.createNew(''));
              }
            }
          };

          $scope.onSaveTranslationButtonClicked = function() {
            StateWrittenTranslationsService.displayed.addWrittenTranslation(
              contentId, langaugeCode,
              $scope.activeWrittenTranslation.getHtml());
            saveTranslation();
          };

          $scope.cancelEdit = function() {
            StateWrittenTranslationsService.restoreFromMemento();
            initEditor();
          };
        }
      ]
    };
  }
]);
