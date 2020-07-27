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
 * @fileoverview Component for the story editor page.
 */

require('objects/objectComponentsRequires.ts');
require('pages/interaction-specs.constants.ajs.ts');

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/forms/schema-based-editors/schema-based-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/story-editor-page/navbar/story-editor-navbar-breadcrumb.directive.ts');
require('pages/story-editor-page/navbar/story-editor-navbar.directive.ts');
require('pages/story-editor-page/editor-tab/story-editor.directive.ts');

require('domain/editor/undo_redo/undo-redo.service.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');

require('pages/story-editor-page/story-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('storyEditorPage', {
  template: require('./story-editor-page.component.html'),
  controller: [
    '$scope', '$uibModal', '$window', 'PageTitleService',
    'StoryEditorStateService', 'UndoRedoService',
    'UrlInterpolationService', 'UrlService',
    function(
        $scope, $uibModal, $window, PageTitleService,
        StoryEditorStateService, UndoRedoService,
        UrlInterpolationService, UrlService) {
      var ctrl = this;
      ctrl.attachedSubscriptions = new Subscription();
      var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';
      ctrl.returnToTopicEditorPage = function() {
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
                topicId:
                  StoryEditorStateService.
                    getStory().getCorrespondingTopicId()
              }
            ), '_self');
        }
      };
      var setPageTitle = function() {
        PageTitleService.setPageTitle(
          StoryEditorStateService.getStory().getTitle() + ' - Oppia');
      };

      ctrl.$onInit = function() {
        const storyInitializedSubscription =
        StoryEditorStateService.onStoryInitializedSubject.subscribe(
          () => setPageTitle()
        );
        ctrl.attachedSubscriptions.add(storyInitializedSubscription);
        const storyReinitializedSubscription =
          StoryEditorStateService.onStoryReinitializedSubject.subscribe(
            () => setPageTitle()
          );
        ctrl.attachedSubscriptions.add(storyReinitializedSubscription);
        StoryEditorStateService.loadStory(UrlService.getStoryIdFromUrl());
      };

      ctrl.$onDestroy = function() {
        ctrl.attachedSubscriptions.unsubscribe();
      };
    }
  ]
});
