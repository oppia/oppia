
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
 * @fileoverview Controller for the questions tab.
 */

require(
  'components/question-directives/questions-list/' +
  'questions-list.directive.ts');

require('components/entity-creation-services/question-creation.service.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/question/editable-question-backend-api.service.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/skill-backend-api.service.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/alerts.service.ts');
require('services/questions-list.service.ts');
require('services/contextual/url.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('questionsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/skill-editor-page/questions-tab/' +
        'skill-questions-tab.directive.html'),
      controller: [
        '$scope', '$http', '$q', '$uibModal', '$window', 'AlertsService',
        'SkillEditorStateService', 'QuestionCreationService', 'UrlService',
        'EditableQuestionBackendApiService', 'SkillBackendApiService',
        'MisconceptionObjectFactory', 'QuestionObjectFactory',
        'QuestionsListService',
        'StateEditorService', 'QuestionUndoRedoService', 'UndoRedoService',
        'NUM_QUESTIONS_PER_PAGE', function(
            $scope, $http, $q, $uibModal, $window, AlertsService,
            SkillEditorStateService, QuestionCreationService, UrlService,
            EditableQuestionBackendApiService, SkillBackendApiService,
            MisconceptionObjectFactory, QuestionObjectFactory,
            QuestionsListService,
            StateEditorService, QuestionUndoRedoService, UndoRedoService,
            NUM_QUESTIONS_PER_PAGE) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var _init = function() {
            $scope.skill = SkillEditorStateService.getSkill();
            $scope.getQuestionSummariesAsync =
              QuestionsListService.getQuestionSummariesAsync;
            $scope.getGroupedSkillSummaries =
              SkillEditorStateService.getGroupedSkillSummaries;
            $scope.isLastQuestionBatch =
             QuestionsListService.isLastQuestionBatch;
            $scope.skillIdToRubricsObject = {};
            $scope.skillIdToRubricsObject[$scope.skill.getId()] =
              $scope.skill.getRubrics();
          };
          ctrl.$onInit = function() {
            _init();
            ctrl.directiveSubscriptions.add(
              SkillEditorStateService.onSkillChange.subscribe(
                () => _init())
            );
          };

          $scope.$on('$destroy', function() {
            ctrl.directiveSubscriptions.unsubscribe();
          });
        }
      ]
    };
  }]);
