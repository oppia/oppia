// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Editor tab in the exploration editor page.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/graph-directives/' +
  'exploration-graph.component.ts');
require(
  'pages/exploration-editor-page/editor-tab/state-name-editor/' +
  'state-name-editor.component.ts');
require(
  'pages/exploration-editor-page/editor-tab/state-param-changes-editor/' +
  'state-param-changes-editor.component.ts');
require(
  'pages/exploration-editor-page/editor-tab/unresolved-answers-overview/' +
  'unresolved-answers-overview.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-correctness-feedback.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'state-tutorial-first-time.service.ts');
require(
  'pages/exploration-editor-page/services/state-editor-refresh.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('components/state-editor/state-editor.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/exploration-features.service.ts');
require('services/site-analytics.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('explorationEditorTab', {
  template: require('./exploration-editor-tab.component.html'),
  controller: [
    '$scope', '$templateCache', '$timeout', '$uibModal', 'EditabilityService',
    'ExplorationCorrectnessFeedbackService', 'ExplorationFeaturesService',
    'ExplorationInitStateNameService', 'ExplorationStatesService',
    'ExplorationWarningsService', 'FocusManagerService', 'GraphDataService',
    'LoaderService',
    'RouterService', 'SiteAnalyticsService', 'StateEditorRefreshService',
    'StateEditorService', 'StateTutorialFirstTimeService',
    'UrlInterpolationService', 'UserExplorationPermissionsService',
    function(
        $scope, $templateCache, $timeout, $uibModal, EditabilityService,
        ExplorationCorrectnessFeedbackService, ExplorationFeaturesService,
        ExplorationInitStateNameService, ExplorationStatesService,
        ExplorationWarningsService, FocusManagerService, GraphDataService,
        LoaderService,
        RouterService, SiteAnalyticsService, StateEditorRefreshService,
        StateEditorService, StateTutorialFirstTimeService,
        UrlInterpolationService, UserExplorationPermissionsService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      // Replace the ng-joyride template with one that uses <[...]>
      // interpolators instead of/ {{...}} interpolators.
      var ngJoyrideTemplate = $templateCache.get(
        'ng-joyride-title-tplv1.html');
      ngJoyrideTemplate = ngJoyrideTemplate.replace(
        /\{\{/g, '<[').replace(/\}\}/g, ']>');
      $templateCache.put(
        'ng-joyride-title-tplv1.html', ngJoyrideTemplate);

      ctrl.getStateContentPlaceholder = function() {
        if (
          StateEditorService.getActiveStateName() ===
          ExplorationInitStateNameService.savedMemento) {
          return (
            'This is the first card of your exploration. Use this space ' +
            'to introduce your topic and engage the learner, then ask ' +
            'them a question.');
        } else {
          return (
            'You can speak to the learner here, then ask them a question.');
        }
      };
      ctrl.getStateContentSaveButtonPlaceholder = function() {
        return 'Save Content';
      };

      ctrl.addState = function(newStateName) {
        ExplorationStatesService.addState(newStateName, null);
      };

      ctrl.refreshWarnings = function() {
        ExplorationWarningsService.updateWarnings();
      };

      ctrl.initStateEditor = function() {
        ctrl.stateName = StateEditorService.getActiveStateName();
        StateEditorService.setStateNames(
          ExplorationStatesService.getStateNames());
        StateEditorService.setCorrectnessFeedbackEnabled(
          ExplorationCorrectnessFeedbackService.isEnabled());
        StateEditorService.setInQuestionMode(false);
        var stateData = ExplorationStatesService.getState(ctrl.stateName);
        if (ctrl.stateName && stateData) {
          // StateEditorService.checkEventListenerRegistrationStatus()
          // returns true if the event listeners of the state editor child
          // components have been registered.
          // In this case 'stateEditorInitialized' is broadcasted so that:
          // 1. state-editor directive can initialise the child
          //    components of the state editor.
          // 2. state-interaction-editor directive can initialise the
          //    child components of the interaction editor.
          $scope.$watch(function() {
            return (
              StateEditorService.checkEventListenerRegistrationStatus());
          }, function() {
            if (
              StateEditorService.checkEventListenerRegistrationStatus() &&
            ExplorationStatesService.isInitialized()) {
              var stateData = (
                ExplorationStatesService.getState(ctrl.stateName));
              StateEditorService.onStateEditorInitialized.emit(stateData);
            }
          });

          var content = ExplorationStatesService.getStateContentMemento(
            ctrl.stateName);
          if (content.html || stateData.interaction.id) {
            ctrl.interactionIsShown = true;
          }

          LoaderService.hideLoadingScreen();
          // $timeout is used to ensure that focus acts only after
          // element is visible in DOM.
          $timeout(() => ctrl.windowOnload(), 100);
        }
        if (EditabilityService.inTutorialMode()) {
          ctrl.startTutorial();
        }
      };

      ctrl.windowOnload = function() {
        ctrl.TabName = RouterService.getActiveTabName();
        if (ctrl.TabName === 'main') {
          FocusManagerService.setFocus('oppiaEditableSection');
        }
        if (ctrl.TabName === 'feedback') {
          FocusManagerService.setFocus('newThreadButton');
        }
        if (ctrl.TabName === 'history') {
          FocusManagerService.setFocus('usernameInputField');
        }
      };

      ctrl.recomputeGraph = function() {
        GraphDataService.recompute();
      };

      ctrl.saveStateContent = function(displayedValue) {
        ExplorationStatesService.saveStateContent(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));
        // Show the interaction when the text content is saved, even if no
        // content is entered.
        ctrl.interactionIsShown = true;
      };

      ctrl.saveInteractionId = function(displayedValue) {
        ExplorationStatesService.saveInteractionId(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));
        StateEditorService.setInteractionId(angular.copy(displayedValue));
      };

      ctrl.saveInteractionAnswerGroups = function(newAnswerGroups) {
        ExplorationStatesService.saveInteractionAnswerGroups(
          StateEditorService.getActiveStateName(),
          angular.copy(newAnswerGroups));

        StateEditorService.setInteractionAnswerGroups(
          angular.copy(newAnswerGroups));
        ctrl.recomputeGraph();
      };

      ctrl.saveInteractionDefaultOutcome = function(newOutcome) {
        ExplorationStatesService.saveInteractionDefaultOutcome(
          StateEditorService.getActiveStateName(),
          angular.copy(newOutcome));

        StateEditorService.setInteractionDefaultOutcome(
          angular.copy(newOutcome));
        ctrl.recomputeGraph();
      };

      ctrl.saveInteractionCustomizationArgs = function(displayedValue) {
        ExplorationStatesService.saveInteractionCustomizationArgs(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));

        StateEditorService.setInteractionCustomizationArgs(
          angular.copy(displayedValue));
      };

      ctrl.saveNextContentIdIndex = function(displayedValue) {
        ExplorationStatesService.saveNextContentIdIndex(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));
      };

      ctrl.saveSolution = function(displayedValue) {
        ExplorationStatesService.saveSolution(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));

        StateEditorService.setInteractionSolution(
          angular.copy(displayedValue));
      };

      ctrl.saveHints = function(displayedValue) {
        ExplorationStatesService.saveHints(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));

        StateEditorService.setInteractionHints(
          angular.copy(displayedValue));
      };

      ctrl.saveSolicitAnswerDetails = function(displayedValue) {
        ExplorationStatesService.saveSolicitAnswerDetails(
          StateEditorService.getActiveStateName(),
          angular.copy(displayedValue));

        StateEditorService.setSolicitAnswerDetails(
          angular.copy(displayedValue));
      };

      ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired = function(
          contentIds) {
        var stateName = StateEditorService.getActiveStateName();
        var state = ExplorationStatesService.getState(stateName);
        var recordedVoiceovers = state.recordedVoiceovers;
        var writtenTranslations = state.writtenTranslations;
        const shouldPrompt = contentIds.some(contentId => {
          return (
            recordedVoiceovers.hasUnflaggedVoiceovers(contentId) ||
            writtenTranslations.hasUnflaggedWrittenTranslations(contentId));
        });
        if (shouldPrompt) {
          $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/components/forms/forms-templates/mark-all-audio-and-' +
              'translations-as-needing-update-modal.directive.html'),
            backdrop: 'static',
            controller: 'ConfirmOrCancelModalController'
          }).result.then(function() {
            contentIds.forEach(contentId => {
              if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId)) {
                recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                  contentId);
                ExplorationStatesService.saveRecordedVoiceovers(
                  stateName, recordedVoiceovers);
              }
              if (writtenTranslations.hasUnflaggedWrittenTranslations(
                contentId)) {
                writtenTranslations.markAllTranslationsAsNeedingUpdate(
                  contentId);
                ExplorationStatesService.saveWrittenTranslations(
                  stateName, writtenTranslations);
              }
            });
          }, function() {
            // This callback is triggered when the Cancel button is
            // clicked. No further action is needed.
          });
        }
      };

      ctrl.navigateToState = function(stateName) {
        RouterService.navigateToMainTab(stateName);
      };
      ctrl.areParametersEnabled = function() {
        return ExplorationFeaturesService.areParametersEnabled();
      };
      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          StateEditorRefreshService.onRefreshStateEditor.subscribe(() => {
            ctrl.initStateEditor();
          })
        );

        $scope.$watch(ExplorationStatesService.getStates, function() {
          if (ExplorationStatesService.getStates()) {
            StateEditorService.setStateNames(
              ExplorationStatesService.getStateNames());
          }
        }, true);
        ctrl.interactionIsShown = false;
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };

      var _ID_TUTORIAL_STATE_CONTENT = '#tutorialStateContent';
      var _ID_TUTORIAL_STATE_INTERACTION = '#tutorialStateInteraction';
      var _ID_TUTORIAL_PREVIEW_TAB = '#tutorialPreviewTab';
      var _ID_TUTORIAL_SAVE_BUTTON = '#tutorialSaveButton';

      var saveButtonTutorialElement = {
        type: 'element',
        selector: _ID_TUTORIAL_SAVE_BUTTON,
        heading: 'Save',
        text: (
          'When you\'re done making changes, ' +
          'be sure to save your work.<br><br>'),
        placement: 'bottom'
      };

      ctrl.EDITOR_TUTORIAL_OPTIONS = [{
        type: 'title',
        heading: 'Creating in Oppia',
        text: (
          'Explorations are learning experiences that you create using ' +
          'Oppia. Think of explorations as a conversation between a ' +
          'student and a tutor.')
      }, {
        type: 'function',
        fn: function(isGoingForward) {
          $('html, body').animate({
            scrollTop: (isGoingForward ? 0 : 20)
          }, 1000);
        }
      }, {
        type: 'element',
        selector: _ID_TUTORIAL_STATE_CONTENT,
        heading: 'Content',
        text: (
          '<p>An Oppia exploration is divided into several \'cards\'. ' +
          'The first part of a card is the <b>content</b>.</p>' +
          '<p>Use the content section to set the scene. ' +
          'Tell the learner a story, give them some information, ' +
          'and then ask a relevant question.</p>'),
        placement: 'bottom'
      }, {
        type: 'function',
        fn: function(isGoingForward) {
          var idToScrollTo = (
            isGoingForward ? _ID_TUTORIAL_STATE_INTERACTION :
            _ID_TUTORIAL_STATE_CONTENT);
          $('html, body').animate({
            scrollTop: angular.element(idToScrollTo).offset().top - 200
          }, 1000);
        }
      }, {
        type: 'title',
        selector: _ID_TUTORIAL_STATE_INTERACTION,
        heading: 'Interaction',
        text: (
          '<p>After you\'ve written the content of your conversation, ' +
          'choose an <b>interaction type</b>. ' +
          'An interaction is how you want your learner to respond ' +
          'to your question.</p> ' +
          '<p>Oppia has several built-in interactions, including:</p>' +
          '<ul>' +
          '  <li>' +
          '    Multiple Choice' +
          '  </li>' +
          '  <li>' +
          '    Text/Number input' +
          '  </li>' +
          '  <li>' +
          '    Code snippets' +
          '  </li>' +
          '</ul>' +
          'and more.')
      }, {
        type: 'function',
        fn: function(isGoingForward) {
          var idToScrollTo = (
            isGoingForward ? _ID_TUTORIAL_PREVIEW_TAB :
            _ID_TUTORIAL_STATE_INTERACTION);
          $('html, body').animate({
            scrollTop: angular.element(idToScrollTo).offset().top - 200
          }, 1000);
        }
      }, {
        type: 'title',
        heading: 'Responses',
        text: (
          'After the learner uses the interaction you created, it\'s ' +
          'your turn again to choose how your exploration will respond ' +
          'to their input. You can send a learner to a new card or ' +
          'have them repeat the same card, depending on how they answer.')
      }, {
        type: 'function',
        fn: function(isGoingForward) {
          var idToScrollTo = (
            isGoingForward ? _ID_TUTORIAL_PREVIEW_TAB :
            _ID_TUTORIAL_STATE_INTERACTION);
          $('html, body').animate({
            scrollTop: angular.element(idToScrollTo).offset().top - 200
          }, 1000);
        }
      }, {
        type: 'element',
        selector: _ID_TUTORIAL_PREVIEW_TAB,
        heading: 'Preview',
        text: (
          'At any time, you can click the <b>preview</b> button to ' +
          'play through your exploration.'),
        placement: 'bottom'
      }, saveButtonTutorialElement, {
        type: 'title',
        heading: 'Tutorial Complete',
        text: (
          '<h2>Now for the fun part...</h2>' +
          'That\'s the end of the tour! ' +
          'To finish up, here are some things we suggest: ' +
          '<ul>' +
          '  <li>' +
          '    Create your first card!' +
          '  </li>' +
          '  <li>' +
          '    Preview your exploration.' +
          '  </li>' +
          '  <li>' +
          '    Check out more resources in the ' +
          '    <a href="https://oppia.github.io/#/" target="_blank">' +
          '      Help Center.' +
          '    </a>' +
          '  </li>' +
          '</ul>')
      }];

      ctrl.leaveTutorial = function() {
        EditabilityService.onEndTutorial();
        $scope.$apply();
        StateTutorialFirstTimeService.markEditorTutorialFinished();
        ctrl.tutorialInProgress = false;
      };

      ctrl.onSkipTutorial = function() {
        SiteAnalyticsService.registerSkipTutorialEvent(
          ctrl.explorationId);
        ctrl.leaveTutorial();
      };

      ctrl.onFinishTutorial = function() {
        SiteAnalyticsService.registerFinishTutorialEvent(
          ctrl.explorationId);
        ctrl.leaveTutorial();
      };

      ctrl.startTutorial = function() {
        ctrl.tutorialInProgress = true;
      };

      // Remove save from tutorial if user does not has edit rights for
      // exploration since in that case Save Draft button will not be
      // visible on the create page.
      ctrl.removeTutorialSaveButtonIfNoPermissions = function() {
        UserExplorationPermissionsService.getPermissionsAsync()
          .then(function(permissions) {
            if (!permissions.canEdit) {
              var index = ctrl.EDITOR_TUTORIAL_OPTIONS.indexOf(
                saveButtonTutorialElement);
              ctrl.EDITOR_TUTORIAL_OPTIONS.splice(index, 1);
            }
          });
      };
      ctrl.removeTutorialSaveButtonIfNoPermissions();
    }
  ]
});
