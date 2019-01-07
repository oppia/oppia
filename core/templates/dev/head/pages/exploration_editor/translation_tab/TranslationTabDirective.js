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
  'UrlInterpolationService', '$timeout',
  'ContextService', 'ExplorationDataService',
  'StateTranslationTutorialFirstTimeService',
  function(UrlInterpolationService, $timeout,
      ContextService, ExplorationDataService,
      StateTranslationTutorialFirstTimeService) {
    return {
      restrict: 'E',
      scope: {},
      link: function(scope) {
        scope.$broadcast('refreshTranslationTab');
        ExplorationDataService.getData().then(function(data) {
          StateTranslationTutorialFirstTimeService.init(
            data.show_state_translation_tutorial_on_load,
            ContextService.getExplorationId()
          );
        });
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'translation_tab_directive.html'),
      controller: ['$scope', '$rootScope', '$templateCache',
        '$uibModal', 'EditabilityService',
        'StateTranslationTutorialFirstTimeService', 'UrlInterpolationService',
        function($scope, $rootScope, $templateCache,
            $uibModal, EditabilityService,
            StateTranslationTutorialFirstTimeService, UrlInterpolationService) {
          var _ID_TUTORIAL_TRANSLATION_LANGUAGE =
            '#tutorialTranslationLanguage';
          var _ID_TUTORIAL_TRANSLATION_STATE =
            '#tutorialTranslationState';
          var _ID_TUTORIAL_TRANSLATION_AUDIOBAR =
            '#tutorialTranslationAudioBar';
          $scope.TRANSLATION_TUTORIAL_OPTIONS = [{
            type: 'title',
            heading: 'Translations In Oppia',
            text: (
              'Hello, welcome to translation tab ' +
              'this tour will walk you through the translation page. ' +
              'Hit the next button to begin.')
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
              'you desire to translate to.'),
            placement: 'bottom'
          }, {
            type: 'function',
            fn: function(isGoingForward) {
              var idToScrollTo = (
                isGoingForward ? _ID_TUTORIAL_TRANSLATION_STATE :
                _ID_TUTORIAL_TRANSLATION_LANGUAGE);
              $('html, body').animate({
                scrollTop: angular.element(idToScrollTo).offset().top - 200
              }, 1000);
            }
          }, {
            type: 'element',
            selector: _ID_TUTORIAL_TRANSLATION_STATE,
            heading: 'Choose State You Want to Translate',
            text: (
              '<p>Next choose one of the tabs in the menu here. This is ' +
              'where each tab can have different audio translations. ' +
              '</p>'),
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
            heading: 'Choose Section You Want to Translate',
            text: ('<p>Within the tab, multiple sections maybe available for ' +
              'translating so choose the section that you want to translate ' +
              '</p>')
          }, {
            type: 'function',
            fn: function(isGoingForward) {
              $('html, body').animate({
                scrollTop: (isGoingForward ? 0 : 20)
              }, 1000);
            }
          }, {
            type: 'title',
            heading: 'Uploading Audio',
            text: ('<p>You can upload your own translations with the ' +
              '<i class="material-icons" style="color:#009688" >&#xE2C6;</i> ' +
              'or <b>"reupload files"</b> button, a window ' +
              'will show asking to <b>upload</b> the audio.' +
              '</p>')
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
            text: ('<p>To create audio translations in Oppia ' +
              'simply follow these 3 steps.</p>' +
              '<ol>' +
              '  <li>' +
              '    Start your <b>recording</b> with the ' +
              '    <i class="material-icons" style="color:#009688">' +
              '    mic</i> button. ' +
              '    Allow the browser to record in order to begin. ' +
              '  </li>' +
              '  <li>' +
              '    Once you are ready to end the recording, use the ' +
              '    <i class="material-icons" style="color:#009688">' +
              '    &#xE047;</i> to <b>stop</b>. ' +
              '  </li>' +
              '  <li>' +
              '    Hit the <b>save</b> <i class="material-icons"' +
              '    style="color:#009688" > &#xE161;</i> button ' +
              '    once you are done.' +
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
            text: ('<p>The audio recording also has options related ' +
              'to updating and deleting translations.</p>' +
              '<ul>' +
              '  <li>' +
              '    To do retakes use the ' +
              '    <i class="material-icons" style="color:#009688">' +
              '    &#xE028;</i> button. ' +
              '  </li>' +
              '  <li>' +
              '    To delete a recording, use the ' +
              '    <i class="material-icons" style="color:#009688">' +
              '    &#xE872;</i> button. ' +
              '  </li>' +
              '  <li>' +
              '    <i class="material-icons" style="color:#009688">' +
              '    &#xE5C9;</i> ' +
              '    to cancel a change.' +
              '  </li>' +
              '  <li>' +
              '    Play the audio with the ' +
              '    <i class="material-icons" style="color:#009688" >' +
              '    &#xE039;</i> and ' +
              '    pause with the <i class="material-icons" ' +
              '    style="color:#009688" >&#xE035;</i>.' +
              '  </li>' +
              '  <li>' +
              '    Mark the interaction needing updates or changes ' +
              '    with the <b>"mark need updates"</b> button' +
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
              'Now you ready to begin translating for your explorations. ' +
              'This marks the end of this tour, ' +
              'remember to save your progress using the save button like an ' +
              'exploration with <button class="btn btn-success" disabled>' +
              '<i class="material-icons" >&#xE161;' +
              '</i></button>.')
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
            StateTranslationTutorialFirstTimeService.markTutorialFinished();
            $scope.translationTutorial = false;
          };

          $scope.onFinishTutorial = function() {
            $scope.leaveTutorial();
          };

          $scope.onSkipTutorial = function() {
            $scope.leaveTutorial();
          };

          $scope.translationTutorial = false;
          $scope.onStartTutorial = function() {
            if (GLOBALS.can_translate) {
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
                '$scope', '$uibModalInstance', 'SiteAnalyticsService',
                'ContextService',
                function($scope, $uibModalInstance, SiteAnalyticsService,
                    ContextService) {
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

                  $scope.editorWelcomeImgUrl = (
                    UrlInterpolationService.getStaticImageUrl(
                      '/general/editor_welcome.svg'));
                }
              ],
              windowClass: 'oppia-welcome-modal'
            });

            modalInstance.result.then(function() {
              $scope.onStartTutorial();
            }, function() {
              StateTranslationTutorialFirstTimeService.markTutorialFinished();
            });
          };

          $rootScope.loadingMessage = 'Loading';
          $scope.isTranslationTabBusy = false;
          $scope.$on('refreshTranslationTab', function() {
            $scope.$broadcast('refreshStateTranslation');
          });
          $scope.$on(
            'enterTranslationForTheFirstTime',
            $scope.showWelcomeTranslationModal
          );
          $scope.$on('openTranslationTutorial', $scope.onStartTutorial);
        }]
    };
  }]);
