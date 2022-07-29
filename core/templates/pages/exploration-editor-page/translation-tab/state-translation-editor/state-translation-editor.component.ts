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
 * @fileoverview Component for the state translation editor.
 */

import { Subscription } from 'rxjs';
import { MarkAudioAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-audio-as-needing-update-modal.component';

require('services/external-save.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/ngb-modal.service.ts');

angular.module('oppia').component('stateTranslationEditor', {
  template: require('./state-translation-editor.component.html'),
  controller: [
    '$scope', 'EditabilityService',
    'ExplorationStatesService', 'ExternalSaveService',
    'GraphDataService', 'NgbModal',
    'StateEditorService', 'StateWrittenTranslationsService',
    'TranslationLanguageService', 'TranslationStatusService',
    'TranslationTabActiveContentIdService',
    'WrittenTranslationObjectFactory',
    function(
        $scope, EditabilityService,
        ExplorationStatesService, ExternalSaveService,
        GraphDataService, NgbModal,
        StateEditorService, StateWrittenTranslationsService,
        TranslationLanguageService, TranslationStatusService,
        TranslationTabActiveContentIdService,
        WrittenTranslationObjectFactory) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      var showMarkAudioAsNeedingUpdateModalIfRequired = function(
          contentId, languageCode) {
        var stateName = StateEditorService.getActiveStateName();
        var state = ExplorationStatesService.getState(stateName);
        var recordedVoiceovers = state.recordedVoiceovers;
        var availableAudioLanguages = (
          recordedVoiceovers.getLanguageCodes(contentId));
        if (availableAudioLanguages.indexOf(languageCode) !== -1) {
          var voiceover = recordedVoiceovers.getVoiceover(
            contentId, languageCode);
          if (voiceover.needsUpdate) {
            return;
          }
          NgbModal.open(MarkAudioAsNeedingUpdateModalComponent, {
            backdrop: 'static'
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

        $scope.HTML_SCHEMA = {
          type: 'html',
          ui_config: {
            language: TranslationLanguageService.getActiveLanguageCode(),
            languageDirection: (
              TranslationLanguageService.getActiveLanguageDirection())
          }
        };

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
        if (StateWrittenTranslationsService
          .savedMemento.hasWrittenTranslation(contentId, languageCode)) {
          var writtenTranslation = (
            StateWrittenTranslationsService
              .savedMemento.getWrittenTranslation(contentId, languageCode));
          oldWrittenTranslation = writtenTranslation;
        }
        var writtenTranslation = (
          StateWrittenTranslationsService
            .displayed.getWrittenTranslation(contentId, languageCode));
        var newWrittenTranslation = writtenTranslation;
        if (oldWrittenTranslation === null || (
          (oldWrittenTranslation.translation !==
           newWrittenTranslation.translation) ||
          (oldWrittenTranslation.needsUpdate !== (
            newWrittenTranslation.needsUpdate)))
        ) {
          var stateName = StateEditorService.getActiveStateName();
          showMarkAudioAsNeedingUpdateModalIfRequired(
            contentId, languageCode);
          ExplorationStatesService.saveWrittenTranslation(
            contentId, newWrittenTranslation.dataFormat, languageCode,
            stateName, newWrittenTranslation.translation);
          StateWrittenTranslationsService.saveDisplayedValue();
          TranslationStatusService.refresh();
        }
        $scope.translationEditorIsOpen = false;

        setTimeout(() => {
          GraphDataService.recompute();
        });
      };

      $scope.openTranslationEditor = function() {
        if ($scope.isEditable()) {
          $scope.translationEditorIsOpen = true;
          if (!$scope.activeWrittenTranslation) {
            $scope.activeWrittenTranslation = (
              WrittenTranslationObjectFactory.createNew($scope.dataFormat));
          }
        }
      };

      $scope.onSaveTranslationButtonClicked = function() {
        var displayedWrittenTranslations = (
          StateWrittenTranslationsService.displayed);
        if (displayedWrittenTranslations.hasWrittenTranslation(
          contentId, languageCode)) {
          displayedWrittenTranslations.updateWrittenTranslation(
            contentId, languageCode,
            $scope.activeWrittenTranslation.translation);
        } else {
          displayedWrittenTranslations.addWrittenTranslation(
            contentId, languageCode,
            $scope.dataFormat,
            $scope.activeWrittenTranslation.translation);
        }

        saveTranslation();
      };

      $scope.cancelEdit = function() {
        StateWrittenTranslationsService.restoreFromMemento();
        initEditor();
      };

      ctrl.$onInit = function() {
        $scope.dataFormat = (
          TranslationTabActiveContentIdService.getActiveDataFormat());

        $scope.UNICODE_SCHEMA = {
          type: 'unicode'
        };

        $scope.SET_OF_STRINGS_SCHEMA = {
          type: 'list',
          items: {
            type: 'unicode'
          },
          validators: [{
            id: 'is_uniquified'
          }]
        };

        ctrl.directiveSubscriptions.add(
          TranslationTabActiveContentIdService.onActiveContentIdChanged.
            subscribe(
              (dataFormat) => {
                $scope.dataFormat = dataFormat;
                initEditor();
              }
            )
        );
        ctrl.directiveSubscriptions.add(
          TranslationLanguageService.onActiveLanguageChanged.subscribe(
            () => initEditor()
          )
        );
        initEditor();
        ctrl.directiveSubscriptions.add(
          ExternalSaveService.onExternalSave.subscribe(()=> {
            if ($scope.translationEditorIsOpen) {
              saveTranslation();
            }
          }));
      };

      $scope.markAsNeedingUpdate = function() {
        let contentId = (
          TranslationTabActiveContentIdService.getActiveContentId());
        let stateName = StateEditorService.getActiveStateName();
        let languageCode = TranslationLanguageService.getActiveLanguageCode();
        $scope.activeWrittenTranslation.needsUpdate = true;
        ExplorationStatesService.markWrittenTranslationAsNeedingUpdate(
          contentId, languageCode, stateName);
        TranslationStatusService.refresh();
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
