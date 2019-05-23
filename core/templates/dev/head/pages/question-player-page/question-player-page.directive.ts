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
 * @fileoverview Directive for the questions player directive.
 */
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

require('domain/question/QuestionPlayerBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');

require('components/CkEditorRteDirective.ts');
require('components/CkEditorWidgetsInitializer.ts');
require('directives/AngularHtmlBindDirective.ts');
require('directives/MathjaxBindDirective.ts');
require('components/forms/ConvertUnicodeWithParamsToHtmlFilter.ts');
require('components/forms/ConvertHtmlToUnicodeFilter.ts');
require('components/forms/ConvertUnicodeToHtmlFilter.ts');
require('components/forms/validators/IsAtLeastFilter.ts');
require('components/forms/validators/IsAtMostFilter.ts');
require('components/forms/validators/IsFloatFilter.ts');
require('components/forms/validators/IsIntegerFilter.ts');
require('components/forms/validators/IsNonemptyFilter.ts');
require('components/forms/ApplyValidationDirective.ts');
require('components/forms/RequireIsFloatDirective.ts');
require('components/forms/schema_editors/SchemaBasedBoolEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedChoicesEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedCustomEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedDictEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedEditorDirective.ts');
require(
  'components/forms/schema_editors/SchemaBasedExpressionEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedFloatEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedHtmlEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedIntEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedListEditorDirective.ts');
require('components/forms/schema_editors/SchemaBasedUnicodeEditorDirective.ts');
require('components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedListViewerDirective.ts');
require(
  'components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts');
require('components/forms/schema_viewers/SchemaBasedViewerDirective.ts');
require('filters/NormalizeWhitespaceFilter.ts');
require('services/AutoplayedVideosService.ts');
// ^^^ this block of requires should be removed ^^^

require('components/attribution_guide/AttributionGuideDirective.ts');
require('components/background/BackgroundBannerDirective.ts');
require('pages/exploration_player/ConversationSkinDirective.ts');
require('pages/exploration_player/ExplorationFooterDirective.ts');
require('pages/exploration_player/LearnerLocalNav.ts');
require('pages/exploration_player/LearnerViewInfo.ts');

oppia.directive('questionPlayer', [
  '$http', 'UrlInterpolationService',
  function(
      $http, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getQuestionPlayerConfig: '&playerConfig',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/question-player-page/question-player-page.directive.html'),
      controller: [
        '$scope', '$rootScope', 'QuestionPlayerBackendApiService',
        function(
            $scope, $rootScope, QuestionPlayerBackendApiService) {
          $scope.questionPlayerConfig = $scope.getQuestionPlayerConfig();
          $scope.currentQuestion = 0;
          $scope.totalQuestions = 0;
          $scope.currentProgress = 0;

          var updateCurrentQuestion = function(currentQuestion) {
            $scope.currentQuestion = currentQuestion;
            updateQuestionProgression();
          };

          var updateTotalQuestions = function(totalQuestions) {
            $scope.totalQuestions = totalQuestions;
            updateQuestionProgression();
          };

          var updateQuestionProgression = function() {
            if (getTotalQuestions() > 0) {
              $scope.currentProgress = (
                getCurrentQuestion() * 100 / getTotalQuestions());
            } else {
              $scope.currentProgress = 0;
            }
          };

          var getCurrentQuestion = function() {
            return $scope.currentQuestion;
          };

          var getTotalQuestions = function() {
            return $scope.totalQuestions;
          };

          $rootScope.$on('currentQuestionChanged', function(event, result) {
            updateCurrentQuestion(result + 1);
          });
          $rootScope.$on('totalQuestionsReceived', function(event, result) {
            updateTotalQuestions(result);
          });
        }
      ]
    };
  }]);
