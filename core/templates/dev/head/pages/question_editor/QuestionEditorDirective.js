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
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
oppia.constant('EVENT_PROGRESS_NAV_SUBMITTED', 'progress-nav-submit');

oppia.directive('questionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionId: '&questionId',
        getQuestionStateData: '&questionStateData'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question_editor/question_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', 'AlertsService', 'QuestionCreationService',
        'EditabilityService', 'EditableQuestionBackendApiService',
        'QuestionObjectFactory', 'EVENT_QUESTION_SUMMARIES_INITIALIZED',
        'stateContentService', 'stateContentIdsToAudioTranslationsService',
        'INTERACTION_SPECS',
        function(
            $scope, $rootScope, AlertsService, QuestionCreationService,
            EditabilityService, EditableQuestionBackendApiService,
            QuestionObjectFactory, EVENT_QUESTION_SUMMARIES_INITIALIZED,
            stateContentService, stateContentIdsToAudioTranslationsService,
            INTERACTION_SPECS) {
          EditabilityService.markEditable();
          $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg');

          var _init = function() {
            stateContentService.init(
              null, $scope.getQuestionStateData().content);
            stateContentIdsToAudioTranslationsService.init(
              null,
              $scope.getQuestionStateData().contentIdsToAudioTranslations);
            $scope.interactionIsShown = false;
            $rootScope.$broadcast(
              'stateEditorInitialized', $scope.getQuestionStateData());

            var interactionId = $scope.getQuestionStateData().interaction.id;
            $scope.interactionIdIsSet = Boolean(interactionId);
            $scope.currentInteractionCanHaveSolution = Boolean(
              $scope.interactionIdIsSet &&
              INTERACTION_SPECS[interactionId].can_have_solution);
            $scope.currentStateIsTerminal = Boolean(
              $scope.interactionIdIsSet &&
              INTERACTION_SPECS[interactionId].is_terminal);
          };

          $scope.showInteraction = function() {
            // Show the interaction when the text content is saved, even if no
            // content is entered.
            $rootScope.$broadcast(
              'stateEditorInitialized', $scope.getQuestionStateData());
            $scope.interactionIsShown = true;
          };

          _init();
        }
      ]
    };
  }]);
