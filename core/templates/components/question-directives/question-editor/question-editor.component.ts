// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the questions editor directive.
 */

require('components/state-editor/state-editor.component.ts');

require('domain/question/question-update.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-validity.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/editability.service.ts');

require('pages/interaction-specs.constants.ajs.ts');
require('services/ngb-modal.service.ts');

import { Subscription } from 'rxjs';
import { MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-all-audio-and-translations-as-needing-update-modal.component';

angular.module('oppia').component('questionEditor', {
  bindings: {
    getQuestionId: '&questionId',
    getMisconceptionsBySkill: '&misconceptionsBySkill',
    canEditQuestion: '&',
    question: '=',
    questionStateData: '=',
    questionChanged: '='
  },
  template: require('./question-editor.component.html'),
  controllerAs: '$ctrl',
  controller: [
    '$rootScope', 'EditabilityService', 'LoaderService', 'NgbModal',
    'QuestionUpdateService', 'SolutionValidityService',
    'StateEditorService', 'StateInteractionIdService',
    'UrlInterpolationService',
    function(
        $rootScope, EditabilityService, LoaderService, NgbModal,
        QuestionUpdateService, SolutionValidityService,
        StateEditorService, StateInteractionIdService,
        UrlInterpolationService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      ctrl.getStateContentPlaceholder = function() {
        return 'Type your question here.';
      };

      ctrl.getStateContentSaveButtonPlaceholder = function() {
        return 'Save Question';
      };

      ctrl.navigateToState = function() {
        return;
      };

      ctrl.addState = function() {
        return;
      };

      ctrl.recomputeGraph = function() {
        return;
      };

      ctrl.refreshWarnings = function() {
        return;
      };

      var _init = function() {
        StateEditorService.setStateNames([]);
        StateEditorService.setCorrectnessFeedbackEnabled(true);
        StateEditorService.setInQuestionMode(true);
        StateEditorService.setInapplicableSkillMisconceptionIds(
          ctrl.question.getInapplicableSkillMisconceptionIds());
        SolutionValidityService.init(['question']);
        var stateData = ctrl.questionStateData;
        stateData.interaction.defaultOutcome.setDestination(null);
        if (stateData) {
          StateEditorService.onStateEditorInitialized.emit(stateData);

          if (stateData.content.html || stateData.interaction.id) {
            ctrl.interactionIsShown = true;
          }

          LoaderService.hideLoadingScreen();
        }
        ctrl.stateEditorInitialized = true;
      };

      var _updateQuestion = function(updateFunction) {
        if (ctrl.questionChanged) {
          ctrl.questionChanged();
        }
        QuestionUpdateService.setQuestionStateData(
          ctrl.question, updateFunction);

        $rootScope.$applyAsync();
      };

      ctrl.saveStateContent = function(displayedValue) {
        // Show the interaction when the text content is saved, even if no
        // content is entered.
        _updateQuestion(function() {
          var stateData = ctrl.question.getStateData();
          stateData.content = angular.copy(displayedValue);
          ctrl.interactionIsShown = true;
        });

        $rootScope.$applyAsync();
      };

      ctrl.saveInteractionId = function(displayedValue) {
        _updateQuestion(function() {
          StateEditorService.setInteractionId(angular.copy(displayedValue));
        });
      };

      ctrl.saveInteractionAnswerGroups = function(newAnswerGroups) {
        _updateQuestion(function() {
          StateEditorService.setInteractionAnswerGroups(
            angular.copy(newAnswerGroups));
        });
      };

      ctrl.saveInteractionDefaultOutcome = function(newOutcome) {
        _updateQuestion(function() {
          StateEditorService.setInteractionDefaultOutcome(
            angular.copy(newOutcome));
        });
      };

      ctrl.saveInteractionCustomizationArgs = function(displayedValue) {
        _updateQuestion(function() {
          StateEditorService.setInteractionCustomizationArgs(
            angular.copy(displayedValue));
        });
      };

      ctrl.saveNextContentIdIndex = function(displayedValue) {
        _updateQuestion(function() {
          var stateData = ctrl.question.getStateData();
          stateData.nextContentIdIndex = angular.copy(displayedValue);
        });
      };

      ctrl.saveSolution = function(displayedValue) {
        _updateQuestion(function() {
          StateEditorService.setInteractionSolution(
            angular.copy(displayedValue));
        });
      };

      ctrl.saveHints = function(displayedValue) {
        _updateQuestion(function() {
          StateEditorService.setInteractionHints(
            angular.copy(displayedValue));
          $rootScope.$applyAsync();
        });
      };

      ctrl.saveInapplicableSkillMisconceptionIds = function(
          displayedValue) {
        StateEditorService.setInapplicableSkillMisconceptionIds(
          angular.copy(displayedValue));
        QuestionUpdateService.setQuestionInapplicableSkillMisconceptionIds(
          ctrl.question, displayedValue);
      };

      ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
          contentIds) {
        var state = ctrl.question.getStateData();
        var recordedVoiceovers = state.recordedVoiceovers;
        var writtenTranslations = state.writtenTranslations;
        var updateQuestion = _updateQuestion;

        const shouldPrompt = contentIds.some(
          contentId =>
            recordedVoiceovers.hasUnflaggedVoiceovers(contentId));
        if (shouldPrompt) {
          NgbModal.open(
            MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent, {
              backdrop: 'static'
            }).result.then(function() {
            updateQuestion(function() {
              contentIds.forEach(contentId => {
                if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId)) {
                  recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                    contentId);
                }
                if (
                  writtenTranslations.hasUnflaggedWrittenTranslations(
                    contentId)
                ) {
                  writtenTranslations.markAllTranslationsAsNeedingUpdate(
                    contentId);
                }
              });
            });
          }, function() {
            // This callback is triggered when the Cancel button is
            // clicked. No further action is needed.
          });
        }
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          StateEditorService.onStateEditorDirectiveInitialized.subscribe(
            () => _init()
          )
        );
        ctrl.directiveSubscriptions.add(
          StateEditorService.onInteractionEditorInitialized.subscribe(
            () => _init()
          )
        );
        ctrl.directiveSubscriptions.add(
          StateInteractionIdService.onInteractionIdChanged.subscribe(
            () => _init()
          )
        );

        if (ctrl.canEditQuestion()) {
          EditabilityService.markEditable();
        } else {
          EditabilityService.markNotEditable();
        }
        StateEditorService.setActiveStateName('question');
        StateEditorService.setMisconceptionsBySkill(
          ctrl.getMisconceptionsBySkill());
        ctrl.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
          '/avatar/oppia_avatar_100px.svg');

        ctrl.interactionIsShown = false;

        ctrl.stateEditorInitialized = false;
        // The _init function is written separately since it is also called
        // in $scope.$on when some external events are triggered.
        _init();
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
