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
 * @fileoverview Controller for the navbar breadcrumb of the story editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');
require('pages/story-editor-page/editor-tab/story-editor.directive.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('storyEditorNavbarBreadcrumb', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/story-editor-page/navbar/' +
        'story-editor-navbar-breadcrumb.directive.html'),
      controller: [
        '$scope', '$uibModal', '$window', 'StoryEditorStateService',
        'UndoRedoService', 'UrlInterpolationService',
        function(
            $scope, $uibModal, $window, StoryEditorStateService,
            UndoRedoService, UrlInterpolationService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
          $scope.returnToTopicEditorPage = function() {
            if (UndoRedoService.getChangeCount() > 0) {
              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/story-editor-page/modal-templates/' +
                  'story-save-pending-changes-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {}, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            } else {
              $window.open(
                UrlInterpolationService.interpolateUrl(
                  TOPIC_EDITOR_URL_TEMPLATE, {
                    topicId: $scope.story.getCorrespondingTopicId()
                  }
                ), '_self');
            }
          };
          ctrl.$onInit = function() {
            ctrl.directiveSubscriptions.add(
              StoryEditorStateService.onStoryInitialized.subscribe(
                () => $scope.topicName = StoryEditorStateService.getTopicName()
              ));
            $scope.story = StoryEditorStateService.getStory();
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
