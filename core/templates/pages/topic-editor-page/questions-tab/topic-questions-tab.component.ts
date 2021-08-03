// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the questions tab.
 */

require(
  'components/question-directives/questions-list/' +
  'questions-list.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/questions-list.service.ts');
require('services/stateful/focus-manager.service.ts');
import { Subscription } from 'rxjs';

angular.module('oppia').component('questionsTab', {
  template: require('./topic-questions-tab.component.html'),
  controller: [
    '$scope', '$window', 'FocusManagerService', 'QuestionsListService',
    'TopicEditorStateService', 'TopicsAndSkillsDashboardBackendApiService',
    function(
        $scope, $window, FocusManagerService, QuestionsListService,
        TopicEditorStateService, TopicsAndSkillsDashboardBackendApiService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      $scope.getGroupedSkillSummaries =
        TopicEditorStateService.getGroupedSkillSummaries;
      $scope.getSkillsCategorizedByTopics = null;

      var _initTab = function() {
        $scope.question = null;
        $scope.skillId = null;
        $scope.topic = TopicEditorStateService.getTopic();
        $scope.topicRights = TopicEditorStateService.getTopicRights();
        $scope.skillIdToRubricsObject =
          TopicEditorStateService.getSkillIdToRubricsObject();
        $scope.allSkillSummaries = [];
        $scope.allSkillSummaries = $scope.allSkillSummaries.concat(
          $scope.topic.getUncategorizedSkillSummaries());
        for (var i = 0; i < $scope.topic.getSubtopics().length; i++) {
          var subtopic = $scope.topic.getSubtopics()[i];
          $scope.allSkillSummaries = $scope.allSkillSummaries.concat(
            subtopic.getSkillSummaries());
        }
        TopicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
          .then(function(response) {
            $scope.getSkillsCategorizedByTopics = (
              response.categorizedSkillsDict);
            $scope.getUntriagedSkillSummaries = (
              response.untriagedSkillSummaries);
          });
        $scope.canEditQuestion = $scope.topicRights.canEditTopic();
        $scope.misconceptions = [];
        $scope.questionIsBeingUpdated = false;
        $scope.questionIsBeingSaved = false;
        $scope.emptyMisconceptionsList = [];
      };

      $scope.reinitializeQuestionsList = function(skillId) {
        $scope.selectedSkillId = skillId;
        QuestionsListService.resetPageNumber();
        QuestionsListService.getQuestionSummariesAsync(
          skillId, true, true
        );
      };

      ctrl.$onInit = function() {
      // To set autofocus when screen loads.
        $window.onload = function() {
          FocusManagerService.setFocus('selectSkillField');
        };
        // To-set autofocus when user navigates to editor using
        // question-editor-tab.
        FocusManagerService.setFocus('selectSkillField');
        $scope.selectedSkillId = null;
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onTopicInitialized.subscribe(
            () => _initTab()
          ));
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onTopicReinitialized.subscribe(
            () => _initTab()
          ));
        _initTab();
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
