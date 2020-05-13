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

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').directive('stateTranslationEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/translation-tab/' +
        'state-translation-editor/state-translation-editor.directive.html'),
      controller: [
        '$scope', '$uibModal', 'EditabilityService', 'ExplorationStatesService',
        'StateEditorService', 'StateWrittenTranslationsService',
        'TranslationLanguageService', 'TranslationStatusService',
        'TranslationTabActiveContentIdService',
        'WrittenTranslationObjectFactory', function(
            $scope, $uibModal, EditabilityService, ExplorationStatesService,
            StateEditorService, StateWrittenTranslationsService,
            TranslationLanguageService, TranslationStatusService,
            TranslationTabActiveContentIdService,
            WrittenTranslationObjectFactory) {
          var ctrl = this;
          var showMarkAudioAsNeedingUpdateModalIfRequired = function(
              contentId, languageCode) {
            var stateName = StateEditorService.getActiveStateName();
            var state = ExplorationStatesService.getState(stateName);
            var recordedVoiceovers = state.recordedVoiceovers;
            var availableAudioLanguages = (
              recordedVoiceovers.getVoiceoverLanguageCodes(contentId));
            if (availableAudioLanguages.indexOf(languageCode) !== -1) {
              var voiceover = recordedVoiceovers.getVoiceover(
                contentId, languageCode);
              if (voiceover.needsUpdate) {
                return;
              }
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/components/forms/forms-templates/' +
                  'mark-audio-as-needing-update-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {
                recordedVoiceovers.toggleNeedsUpdateAttribute(
                  contentId, languageCode);
                ExplorationStatesService.saveRecordedVoiceovers(
                  stateName, recordedVoiceovers);
              }, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            }
          };
          var contentId = null;
          var languageCode = null;
          $scope.activeWrittenTranslation = null;
          $scope.translationEditorIsOpen = false;
          $scope.isEditable = function() {
            return EditabilityService.isEditable();
          };

          var initEditor = function() {
            $scope.activeWrittenTranslation = null;
            $scope.translationEditorIsOpen = false;
            contentId = (
              TranslationTabActiveContentIdService.getActiveContentId());
            languageCode = TranslationLanguageService.getActiveLanguageCode();
            if (StateWrittenTranslationsService.displayed.hasWrittenTranslation(
              contentId, languageCode)) {
              $scope.activeWrittenTranslation = (
                StateWrittenTranslationsService.displayed
                  .getWrittenTranslation(contentId, languageCode));
            }
          };
          var saveTranslation = function() {
            var oldWrittenTranslation = null;
            var newWrittenTranslation = null;
            contentId = (
              TranslationTabActiveContentIdService.getActiveContentId());
            languageCode = TranslationLanguageService.getActiveLanguageCode();
            var oldTranslation = null;
            if (StateWrittenTranslationsService
              .savedMemento.hasWrittenTranslation(contentId, languageCode)) {
              var writtenTranslation = (StateWrittenTranslationsService
                .savedMemento.getWrittenTranslation(contentId, languageCode));
              oldWrittenTranslation = writtenTranslation;
            }
            var writtenTranslation = (StateWrittenTranslationsService
              .displayed.getWrittenTranslation(contentId, languageCode));
            var newWrittenTranslation = writtenTranslation;
            if (oldWrittenTranslation === null || (
              oldWrittenTranslation.html !== newWrittenTranslation.html || (
                oldWrittenTranslation.needsUpdate !== (
                  newWrittenTranslation.needsUpdate)))) {
              var stateName = StateEditorService.getActiveStateName();
              showMarkAudioAsNeedingUpdateModalIfRequired(
                contentId, languageCode);
              ExplorationStatesService.saveWrittenTranslations(
                stateName, StateWrittenTranslationsService.displayed);
              StateWrittenTranslationsService.saveDisplayedValue();
              TranslationStatusService.refresh();
            }
            $scope.translationEditorIsOpen = false;
          };

          $scope.openTranslationEditor = function() {
            if ($scope.isEditable()) {
              $scope.translationEditorIsOpen = true;
              if (!$scope.activeWrittenTranslation) {
                $scope.activeWrittenTranslation = (
                  WrittenTranslationObjectFactory.createNew(''));
              }
            }
          };

          $scope.onSaveTranslationButtonClicked = function() {
            var displayedWrittenTranslations = (
              StateWrittenTranslationsService.displayed);
            if (displayedWrittenTranslations.hasWrittenTranslation(
              contentId, languageCode)) {
              displayedWrittenTranslations.updateWrittenTranslationHtml(
                contentId, languageCode,
                $scope.activeWrittenTranslation.getHtml());
            } else {
              displayedWrittenTranslations.addWrittenTranslation(
                contentId, languageCode,
                $scope.activeWrittenTranslation.getHtml());
            }

            saveTranslation();
          };

          $scope.cancelEdit = function() {
            StateWrittenTranslationsService.restoreFromMemento();
            initEditor();
          };
          ctrl.$onInit = function() {
            $scope.HTML_SCHEMA = {
              type: 'html',
              ui_config: {
                hide_complex_extensions: 'true'
              }
            };
            $scope.$on('activeContentIdChanged', function() {
              initEditor();
            });
            $scope.$on('activeLanguageChanged', function() {
              initEditor();
            });
            initEditor();
            $scope.$on('externalSave', function() {
              if ($scope.translationEditorIsOpen) {
                saveTranslation();
              }
            });
          };
        }
      ]
    };
  }
]);
