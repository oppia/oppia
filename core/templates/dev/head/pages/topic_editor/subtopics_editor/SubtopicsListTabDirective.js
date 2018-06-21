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
 * @fileoverview Controller for the subtopics list editor.
 */

oppia.directive('subtopicsListTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic_editor/subtopics_editor/' +
        'subtopics_list_tab_directive.html'),
      controller: [
        '$scope', '$uibModal', 'TopicEditorStateService', 'TopicUpdateService',
        'UndoRedoService', 'EVENT_TOPIC_REINITIALIZED',
        'EVENT_TOPIC_INITIALIZED',
        function(
            $scope, $uibModal, TopicEditorStateService, TopicUpdateService,
            UndoRedoService, EVENT_TOPIC_REINITIALIZED,
            EVENT_TOPIC_INITIALIZED) {
          var _initEditor = function() {
            $scope.topic = TopicEditorStateService.getTopic();
            $scope.subtopics = $scope.topic.getSubtopics();
            $scope.subtopic = null;
          };

          $scope.SUBTOPIC_HEADINGS = ['title', 'skills'];

          $scope.setSubtopic = function(subtopic) {
            $scope.subtopic = subtopic;
            $scope.editableTitle = $scope.subtopic.getTitle();
          };

          $scope.openSubtopicTitleEditor = function() {
            $scope.subtopicTitleEditorIsShown = true;
          };

          $scope.closeSubtopicTitleEditor = function() {
            $scope.subtopicTitleEditorIsShown = false;
          };

          $scope.deleteSubtopic = function(subtopicId) {
            TopicUpdateService.deleteSubtopic($scope.topic, subtopicId);
            _initEditor();
          };

          $scope.updateSubtopicTitle = function(newTitle) {
            TopicUpdateService.setSubtopicTitle(
              $scope.topic, $scope.subtopic.getId(), newTitle);
            $scope.closeSubtopicTitleEditor();
            _initEditor();
          };

          $scope.createSubtopic = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic_editor/subtopics_editor/' +
                'new_subtopic_title_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.subtopicTitle = '';
                  $scope.isSubtopicTitleEmpty = function(subtopicTitle) {
                    return (subtopicTitle === '');
                  };
                  $scope.save = function(title) {
                    $uibModalInstance.close(title);
                  };
                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(title) {
              TopicUpdateService.addSubtopic($scope.topic, title);
              _initEditor();
            });
          };

          $scope.$on(EVENT_TOPIC_INITIALIZED, _initEditor);
          $scope.$on(EVENT_TOPIC_REINITIALIZED, _initEditor);

          _initEditor();
        }
      ]
    };
  }]);
