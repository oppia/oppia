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
 * @fileoverview Directive for the translation tab.
 */

oppia.directive('translationTab', [
  'ContextService', 'ExplorationDataService', 'ExplorationStatesService',
  'StateContentIdsToAudioTranslationsService', 'StateEditorService',
  'StateTutorialFirstTimeService', 'UrlInterpolationService',
  function(
      ContextService, ExplorationDataService, ExplorationStatesService,
      StateContentIdsToAudioTranslationsService, StateEditorService,
      StateTutorialFirstTimeService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      link: function() {
        ExplorationDataService.getData().then(function(data) {
          StateTutorialFirstTimeService.initTranslation(
            data.show_state_translation_tutorial_on_load,
            ContextService.getExplorationId()
          );
        });
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'translation_tab_directive.html'),

      controller: ['$scope', '$rootScope', '$templateCache', '$uibModal',
        'EditabilityService', 'StateTutorialFirstTimeService',
        'StateWrittenTranslationsService', 'TranslationTabActiveModeService',
        'UrlInterpolationService',
        function($scope, $rootScope, $templateCache, $uibModal,
            EditabilityService, StateTutorialFirstTimeService,
            StateWrittenTranslationsService, TranslationTabActiveModeService,
            UrlInterpolationService) {
          $rootScope.loadingMessage = 'Loading';
          $scope.isTranslationTabBusy = false;
          $scope.showTranslationTabSubDirectives = false;

          var initTranslationTab = function() {
            var stateName = StateEditorService.getActiveStateName();
            StateContentIdsToAudioTranslationsService.init(
              stateName,
              ExplorationStatesService.getContentIdsToAudioTranslationsMemento(
                stateName));
            StateWrittenTranslationsService.init(stateName,
              ExplorationStatesService.getWrittenTranslationsMemento(
                stateName));
            $scope.showTranslationTabSubDirectives = true;
            TranslationTabActiveModeService.activateVoiceoverMode();
            $rootScope.loadingMessage = '';
          };

          $scope.$on('refreshTranslationTab', function() {
            initTranslationTab();
          });
          // Toggles the translation tab tutorial on/off
          $scope.translationTutorial = false;
          var _ID_TUTORIAL_TRANSLATION_LANGUAGE =
            '#tutorialTranslationLanguage';
          var _ID_TUTORIAL_TRANSLATION_STATE = '#tutorialTranslationState';
          var _ID_TUTORIAL_TRANSLATION_OVERVIEW =
            '#tutorialTranslationOverview';
          $scope.TRANSLATION_TUTORIAL_OPTIONS = [{
            type: 'title',
            heading: 'Translations In Oppia',
            text: (
              'Hello, welcome to Translation Tab! ' +
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
            text: ('Start your translation by choosing the language that ' +
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
            text: ('Then, choose a card from the exploration overview by ' +
            'clicking on the card. The selected card will have ' +
            'a bolded border. Cards that have missing translations ' +
            'are coloured yellow or red, and these are good places to start.'),
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
              '<p>Next choose one of the parts of the lesson card from ' +
              'menu at the top. This lists all the translatable parts ' +
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
            text: ('<p>To create audio translations in Oppia, ' +
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
              '</ol>' +
              '<p>Alternatively, you can use the ' +
              '<i class="material-icons" style="color:#009688" >&#xE2C6;</i>' +
              'button to <b>upload</b> audio files from your computer.</p>')
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
            text: ('<p>The audio recording also has options related ' +
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
              '    To do retakes, click ' +
              '    <i class="material-icons" style="color:#009688">' +
              '    &#xE028;</i> button. ' +
              '  </li>' +
              '  <li>' +
              '    To delete a recording, click ' +
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
          // Replace the ng-joyride template with one that uses
          // <[...]> interpolators instead of/ {{...}} interpolators.
          var ngJoyrideTemplate =
            $templateCache.get('ng-joyride-title-tplv1.html');
          ngJoyrideTemplate = ngJoyrideTemplate.replace(
            /\{\{/g, '<[').replace(/\}\}/g, ']>');
          $templateCache.put('ng-joyride-title-tplv1.html',
            ngJoyrideTemplate);

          $scope.leaveTutorial = function() {
            EditabilityService.onEndTutorial();
            $scope.$apply();
            StateTutorialFirstTimeService.markTranslationTutorialFinished();
            $scope.translationTutorial = false;
          };

          $scope.onFinishTutorial = function() {
            $scope.leaveTutorial();
          };

          $scope.onSkipTutorial = function() {
            $scope.leaveTutorial();
          };

          $scope.onStartTutorial = function() {
            if (GLOBALS.can_translate) {
              EditabilityService.onStartTutorial();
              $scope.translationTutorial = true;
            }
          };

          $scope.showWelcomeTranslationModal = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/translation_tab/' +
                'welcome_translation_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', 'ContextService',
                'SiteAnalyticsService',
                function($scope, $uibModalInstance, ContextService,
                    SiteAnalyticsService) {
                  var explorationId = ContextService.getExplorationId();

                  SiteAnalyticsService.registerTutorialModalOpenEvent(
                    explorationId);

                  $scope.beginTutorial = function() {
                    SiteAnalyticsService.registerAcceptTutorialModalEvent(
                      explorationId);
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    SiteAnalyticsService.registerDeclineTutorialModalEvent(
                      explorationId);
                    $uibModalInstance.dismiss('cancel');
                  };
                  // translation tutorial image url for modal
                  $scope.translationWelcomeImgUrl = (
                    UrlInterpolationService.getStaticImageUrl(
                      '/general/editor_welcome.svg'));
                }
              ],
              windowClass: 'oppia-welcome-modal'
            });

            modalInstance.result.then(function() {
              $scope.onStartTutorial();
            }, function() {
              StateTutorialFirstTimeService.markTranslationTutorialFinished();
            });
          };
          $scope.$on('enterTranslationForTheFirstTime',
            $scope.showWelcomeTranslationModal
          );
          $scope.$on('openTranslationTutorial', $scope.onStartTutorial);
        }]
    };
  }]);
