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
 * @fileoverview Component for the translation tab.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'attribution-guide.component.ts');
require(
  'pages/exploration-editor-page/translation-tab/state-translation/' +
  'state-translation.component.ts');
require(
  'pages/exploration-editor-page/translation-tab/' +
  'state-translation-status-graph/state-translation-status-graph.component.ts');
require(
  'pages/exploration-editor-page/translation-tab/translator-overview/' +
  'translator-overview.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'state-tutorial-first-time.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-recorded-voiceovers.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('pages/admin-page/services/admin-router.service.ts');
require('services/ngb-modal.service.ts');

import { Subscription } from 'rxjs';
import { WelcomeTranslationModalComponent } from 'pages/exploration-editor-page/translation-tab/modal-templates/welcome-translation-modal.component';

angular.module('oppia').component('translationTab', {
  template: require('./translation-tab.component.html'),
  controller: [
    '$rootScope', '$scope', '$templateCache',
    'ContextService', 'EditabilityService', 'ExplorationStatesService',
    'LoaderService', 'NgbModal', 'RouterService', 'SiteAnalyticsService',
    'StateEditorService', 'StateRecordedVoiceoversService',
    'StateTutorialFirstTimeService', 'StateWrittenTranslationsService',
    'TranslationTabActiveModeService',
    'UserExplorationPermissionsService',
    function(
        $rootScope, $scope, $templateCache,
        ContextService, EditabilityService, ExplorationStatesService,
        LoaderService, NgbModal, RouterService, SiteAnalyticsService,
        StateEditorService, StateRecordedVoiceoversService,
        StateTutorialFirstTimeService, StateWrittenTranslationsService,
        TranslationTabActiveModeService,
        UserExplorationPermissionsService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      var _ID_TUTORIAL_TRANSLATION_LANGUAGE =
        '#tutorialTranslationLanguage';
      var _ID_TUTORIAL_TRANSLATION_STATE = '#tutorialTranslationState';
      var _ID_TUTORIAL_TRANSLATION_OVERVIEW = (
        '#tutorialTranslationOverview');
      // Replace the ng-joyride template with one that uses
      // <[...]> interpolators instead of/ {{...}} interpolators.
      var ngJoyrideTemplate = (
        $templateCache.get('ng-joyride-title-tplv1.html'));
      ngJoyrideTemplate = ngJoyrideTemplate.replace(
        /\{\{/g, '<[').replace(/\}\}/g, ']>');

      $scope.initTranslationTab = function() {
        StateTutorialFirstTimeService.initTranslation(
          ContextService.getExplorationId());
        var stateName = StateEditorService.getActiveStateName();
        StateRecordedVoiceoversService.init(
          stateName, ExplorationStatesService.getRecordedVoiceoversMemento(
            stateName));
        StateWrittenTranslationsService.init(
          stateName, ExplorationStatesService.getWrittenTranslationsMemento(
            stateName));
        $scope.showTranslationTabSubDirectives = true;
        TranslationTabActiveModeService.activateVoiceoverMode();
        LoaderService.hideLoadingScreen();

        if (EditabilityService.inTutorialMode()) {
          $scope.startTutorial();
        }
      };

      $scope.leaveTutorial = function() {
        EditabilityService.onEndTutorial();
        $scope.$apply();
        StateTutorialFirstTimeService.markTranslationTutorialFinished();
        $scope.tutorialInProgress = false;
      };

      $scope.onFinishTutorial = function() {
        $scope.leaveTutorial();
      };

      $scope.onSkipTutorial = function() {
        $scope.leaveTutorial();
      };

      var permissions = null;
      $scope.startTutorial = function() {
        if (permissions === null) {
          return;
        }
        if (permissions.canVoiceover) {
          $scope.tutorialInProgress = true;
        }
      };

      $scope.showWelcomeTranslationModal = function() {
        NgbModal.open(WelcomeTranslationModalComponent, {
          backdrop: true,
          windowClass: 'oppia-welcome-modal'
        }).result.then(function(explorationId) {
          SiteAnalyticsService.registerAcceptTutorialModalEvent(
            explorationId);
          $rootScope.$applyAsync();
          $scope.startTutorial();
        }, function(explorationId) {
          SiteAnalyticsService.registerDeclineTutorialModalEvent(
            explorationId);
          StateTutorialFirstTimeService.markTranslationTutorialFinished();
        });
      };

      ctrl.$onInit = function() {
        LoaderService.showLoadingScreen('Loading');
        $scope.isTranslationTabBusy = false;
        $scope.showTranslationTabSubDirectives = false;
        $scope.tutorialInProgress = false;
        ctrl.directiveSubscriptions.add(
          RouterService.onRefreshTranslationTab.subscribe(
            () => {
              $scope.initTranslationTab();
            }
          )
        );
        // Toggles the translation tab tutorial on/off.
        $scope.TRANSLATION_TUTORIAL_OPTIONS = [{
          type: 'title',
          heading: 'Translations In Oppia',
          text: (
            'Hello, welcome to the Translation Tab! ' +
            'This tour will walk you through the translation page. ' +
            'Hit the "Next" button to begin.')
        }, {
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        }, {
          type: 'element',
          selector: _ID_TUTORIAL_TRANSLATION_LANGUAGE,
          heading: 'Choose Language',
          text: (
            'Start your translation by choosing the language that ' +
            'you want to translate to.'),
          placement: 'bottom'
        }, {
          type: 'function',
          fn: function(isGoingForward) {
            var idToScrollTo = (
              isGoingForward ? _ID_TUTORIAL_TRANSLATION_OVERVIEW :
              _ID_TUTORIAL_TRANSLATION_LANGUAGE);
            $('html, body').animate({
              scrollTop: angular.element(idToScrollTo).offset().top - 200
            }, 1000);
          }
        }, {
          type: 'element',
          selector: _ID_TUTORIAL_TRANSLATION_OVERVIEW,
          heading: 'Choose a Card to Translate',
          text: (
            'Then, choose a card from the exploration overview by ' +
            'clicking on the card. The selected card will have ' +
            'a bold border. Cards with missing translations are ' +
            'coloured yellow or red. These are good places to start.'),
          placement: 'left'
        }, {
          type: 'function',
          fn: function(isGoingForward) {
            var idToScrollTo = (
              isGoingForward ? _ID_TUTORIAL_TRANSLATION_STATE :
              _ID_TUTORIAL_TRANSLATION_OVERVIEW);
            $('html, body').animate({
              scrollTop: angular.element(idToScrollTo).offset().top - 200
            }, 1000);
          }
        }, {
          type: 'element',
          selector: _ID_TUTORIAL_TRANSLATION_STATE,
          heading: 'Choose a Part of the Card to Translate',
          text: (
            '<p>Next, choose a part of the lesson card to translate. This ' +
            'menu at the top lists all the translatable parts ' +
            'of the card. Within each tab, multiple sections may be ' +
            'available for translating.</p>'),
          placement: 'bottom'
        }, {
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        }, {
          type: 'title',
          heading: 'Recording Audio',
          text: (
            '<p>To create audio translations in Oppia, ' +
            'we recommend using the ' +
            '<i class="material-icons" style="color:#009688" >' +
            '&#xE2C6;</i>' +
            'button to <b>upload</b> audio files from your computer.</p>' +
            '<p>You can also record via your browser, but that may lead to ' +
            'degraded audio quality. If you would like to do so anyway, ' +
            'simply follow these 3 steps:</p>' +
            '<ol>' +
            '  <li>' +
            '    To start <b>recording</b>, click the ' +
            '    <i class="material-icons" style="color:#009688">' +
            '    mic</i> button. ' +
            '    If the browser pops up a message asking if you’d ' +
            '    like to record audio, accept it. ' +
            '  </li>' +
            '  <li>' +
            '    When you are ready to end the recording, click ' +
            '    <i class="material-icons" style="color:#009688">' +
            '    &#xE047;</i> to <b>stop</b>. ' +
            '  </li>' +
            '  <li>' +
            '    Hit the <b>save</b> <i class="material-icons"' +
            '    style="color:#009688" > &#xE161;</i> button ' +
            '    to confirm the recording.' +
            '  </li>' +
            '</ol>')
        }, {
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        }, {
          type: 'title',
          heading: 'Re-record/Re-upload audio',
          text: (
            '<p>The audio recording also has options related ' +
            'to updating and deleting translations.</p>' +
            '<ul>' +
            '  <li>' +
            '    To revert and cancel any unsaved translation(s),' +
            '    click the ' +
            '    <i class="material-icons" style="color:#009688">' +
            '    &#xE5C9;</i> button.' +
            '  </li>' +
            '  <li>' +
            '    To play the audio, click the ' +
            '    <i class="material-icons" style="color:#009688" >' +
            '    &#xE039;</i> button. ' +
            '  </li>' +
            '  <li>' +
            '    To do retakes, click the ' +
            '    <i class="material-icons" style="color:#009688">' +
            '    &#xE028;</i> button. ' +
            '  </li>' +
            '  <li>' +
            '    To delete a recording, click the ' +
            '    <i class="material-icons" style="color:#009688">' +
            '    &#xE872;</i> button. ' +
            '  </li>' +
            '</ul>')
        }, {
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        }, {
          type: 'title',
          heading: 'Tutorial Complete',
          text: (
            '<p>' +
            'Now, you are ready to begin adding translations ' +
            'to your explorations! ' +
            'This marks the end of this tour. ' +
            'Remember to save your progress periodically using ' +
            'the save button in the navigation bar at the top: ' +
            '<button class="btn btn-success" disabled>' +
            '<i class="material-icons" >&#xE161;' +
            '</i></button>.<br> ' +
            'Thank you for making this lesson more accessible ' +
            'for non-native speakers!')
        }];
        $templateCache.put(
          'ng-joyride-title-tplv1.html', ngJoyrideTemplate);
        UserExplorationPermissionsService.getPermissionsAsync()
          .then(function(explorationPermissions) {
            permissions = explorationPermissions;
          });
        ctrl.directiveSubscriptions.add(
          // eslint-disable-next-line max-len
          StateTutorialFirstTimeService.onEnterTranslationForTheFirstTime.subscribe(
            () => $scope.showWelcomeTranslationModal()
          )
        );
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }]
});
