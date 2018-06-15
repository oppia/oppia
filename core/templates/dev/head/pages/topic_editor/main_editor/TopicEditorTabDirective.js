// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the main topic editor.
 */

oppia.directive('topicMainEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/main_editor/topic_editor_tab_directive.html'),
      controller: [
        '$scope', 'TopicEditorStateService', 'TopicUpdateService',
        'EVENT_TOPIC_INITIALIZED', 'EVENT_TOPIC_REINITIALIZED',
        function(
            $scope, TopicEditorStateService, TopicUpdateService,
            EVENT_TOPIC_INITIALIZED, EVENT_TOPIC_REINITIALIZED) {
          $scope.topic = TopicEditorStateService.getTopic();
          $scope.canEditName = GLOBALS.isAdmin;

          var _initEditor = function() {
            $scope.topicNameEditorIsShown = false;
            $scope.editableName = $scope.topic.getName();
            $scope.editableDescription = $scope.topic.getDescription();
            $scope.displayedTopicDescription = (
              $scope.editableDescription !== '');
          };

          $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);

          $scope.switchTopicNameEditor = function() {
            if (!$scope.canEditName) {
              return;
            }
            $scope.topicNameEditorIsShown = !$scope.topicNameEditorIsShown;
            $scope.editableName = $scope.topic.getName();
          };

          $scope.updateTopicName = function(newName) {
            TopicUpdateService.setTopicName($scope.topic, newName);
            $scope.topicNameEditorIsShown = false;
          };

          $scope.updateTopicDescription = function(newDescription) {
            TopicUpdateService.setTopicDescription(
              $scope.topic, newDescription);
          };
        }
      ]
    };
  }]);
