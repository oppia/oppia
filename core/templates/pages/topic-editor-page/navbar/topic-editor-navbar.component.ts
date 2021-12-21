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
 * @fileoverview Directive for the navbar of the topic editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');

require('domain/classroom/classroom-domain.constants.ajs.ts');
require('domain/editor/undo_redo/undo-redo.service.ts');
require('domain/topic/topic-rights-backend-api.service.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');
require('services/contextual/url.service.ts');
require('services/ngb-modal.service.ts');

import { Subscription } from 'rxjs';
import { TopicEditorSaveModalComponent } from '../modal-templates/topic-editor-save-modal.component';

angular.module('oppia').component('topicEditorNavbar', {
  template: require('./topic-editor-navbar.component.html'),
  controller: [
    '$rootScope', '$scope', '$uibModal', '$window', 'AlertsService',
    'NgbModal', 'TopicEditorRoutingService',
    'TopicEditorStateService', 'TopicRightsBackendApiService',
    'UndoRedoService', 'UrlInterpolationService',
    'UrlService', 'TOPIC_VIEWER_URL_TEMPLATE',
    function(
        $rootScope, $scope, $uibModal, $window, AlertsService,
        NgbModal, TopicEditorRoutingService, TopicEditorStateService,
        TopicRightsBackendApiService, UndoRedoService,
        UrlInterpolationService, UrlService,
        TOPIC_VIEWER_URL_TEMPLATE) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      $scope.isSaveInProgress = function() {
        return TopicEditorStateService.isSavingTopic();
      };

      var _validateTopic = function() {
        $scope.validationIssues = $scope.topic.validate();
        if (TopicEditorStateService.getTopicWithNameExists()) {
          $scope.validationIssues.push(
            'A topic with this name already exists.');
        }
        if (TopicEditorStateService.getTopicWithUrlFragmentExists()) {
          $scope.validationIssues.push(
            'Topic URL fragment already exists.');
        }
        var prepublishTopicValidationIssues = (
          $scope.topic.prepublishValidate());
        var subtopicPrepublishValidationIssues = (
          [].concat.apply([], $scope.topic.getSubtopics().map(
            (subtopic) => subtopic.prepublishValidate())));
        $scope.prepublishValidationIssues = (
          prepublishTopicValidationIssues.concat(
            subtopicPrepublishValidationIssues));
      };

      $scope.publishTopic = function() {
        if (!$scope.topicRights.canPublishTopic()) {
          $uibModal.open({
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
              '/pages/topic-editor-page/modal-templates/' +
                  'topic-editor-send-mail-modal.template.html'),
            backdrop: true,
            controller: 'ConfirmOrCancelModalController'
          }).result.then(function() {
            TopicRightsBackendApiService.sendMailAsync(
              $scope.topicId, $scope.topicName).then(function() {
              var successToast = 'Mail Sent.';
              AlertsService.addSuccessMessage(
                successToast, 1000);
              $rootScope.$applyAsync();
            });
          }, function() {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          });
          return;
        }
        var redirectToDashboard = false;
        TopicRightsBackendApiService.publishTopicAsync($scope.topicId).then(
          function() {
            if (!$scope.topicRights.isPublished()) {
              redirectToDashboard = true;
            }
            $scope.topicRights.markTopicAsPublished();
            TopicEditorStateService.setTopicRights($scope.topicRights);
            $rootScope.$applyAsync();
          }
        ).then(function() {
          var successToast = 'Topic published.';
          if (redirectToDashboard) {
            $window.location = '/topics-and-skills-dashboard';
          }
          AlertsService.addSuccessMessage(
            successToast, 1000);
        });
      };

      $scope.discardChanges = function() {
        UndoRedoService.clearChanges();
        $scope.discardChangesButtonIsShown = false;
        TopicEditorStateService.loadTopic($scope.topicId);
      };

      $scope.getChangeListLength = function() {
        return UndoRedoService.getChangeCount();
      };

      $scope.isTopicSaveable = function() {
        return (
          $scope.getChangeListLength() > 0 &&
              $scope.getWarningsCount() === 0 && (
            !$scope.topicRights.isPublished() ||
                $scope.prepublishValidationIssues.length === 0
          )
        );
      };

      $scope.toggleDiscardChangeButton = function() {
        $scope.showTopicEditOptions = false;
        $scope.discardChangesButtonIsShown = (
          !$scope.discardChangesButtonIsShown);
      };

      $scope.saveChanges = function() {
        var topicIsPublished = $scope.topicRights.isPublished();
        let modelRef = NgbModal.open(TopicEditorSaveModalComponent, {
          backdrop: 'static',
        });
        modelRef.componentInstance.topicIsPublished = topicIsPublished;
        modelRef.result.then(function(commitMessage) {
          TopicEditorStateService.saveTopic(commitMessage, () => {
            AlertsService.addSuccessMessage('Changes Saved.');
            $rootScope.$applyAsync();
          });
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.unpublishTopic = function() {
        $scope.showTopicEditOptions = false;
        if (!$scope.topicRights.canPublishTopic()) {
          return false;
        }
        TopicRightsBackendApiService.unpublishTopicAsync(
          $scope.topicId).then(function() {
          $scope.topicRights.markTopicAsUnpublished();
          TopicEditorStateService.setTopicRights($scope.topicRights);
          $rootScope.$applyAsync();
        });
      };

      $scope.toggleNavigationOptions = function() {
        $scope.showNavigationOptions = !$scope.showNavigationOptions;
      };

      $scope.toggleTopicEditOptions = function() {
        $scope.showTopicEditOptions = !$scope.showTopicEditOptions;
      };

      $scope.toggleWarningText = function() {
        $scope.warningsAreShown = !$scope.warningsAreShown;
      };

      $scope._validateTopic = function() {
        $scope.validationIssues = $scope.topic.validate();
        var prepublishTopicValidationIssues = (
          $scope.topic.prepublishValidate());
        var subtopicPrepublishValidationIssues = (
          [].concat.apply([], $scope.topic.getSubtopics().map(
            (subtopic) => subtopic.prepublishValidate())));
        $scope.prepublishValidationIssues = (
          prepublishTopicValidationIssues.concat(
            subtopicPrepublishValidationIssues));
      };

      $scope.getWarningsCount = function() {
        return $scope.validationIssues.length;
      };

      $scope.getTotalWarningsCount = function() {
        var validationIssuesCount = $scope.validationIssues.length;
        var prepublishValidationIssuesCount = (
          $scope.prepublishValidationIssues.length);
        return validationIssuesCount + prepublishValidationIssuesCount;
      };

      $scope.openTopicViewer = function() {
        $scope.showNavigationOptions = false;
        var activeTab = TopicEditorRoutingService.getActiveTabName();
        if (activeTab !== 'subtopic_editor') {
          if ($scope.getChangeListLength() > 0) {
            AlertsService.addInfoMessage(
              'Please save all pending changes to preview the topic ' +
                    'with the changes', 2000);
            return;
          }
          var topicUrlFragment = $scope.topic.getUrlFragment();
          var classroomUrlFragment = (
            TopicEditorStateService.getClassroomUrlFragment());
          $window.open(
            UrlInterpolationService.interpolateUrl(
              TOPIC_VIEWER_URL_TEMPLATE, {
                topic_url_fragment: topicUrlFragment,
                classroom_url_fragment: classroomUrlFragment
              }
            ), 'blank');
        } else {
          $scope.activeTab = 'Preview';
          var subtopicId = TopicEditorRoutingService.getSubtopicIdFromUrl();
          TopicEditorRoutingService.navigateToSubtopicPreviewTab(
            subtopicId);
        }
      };

      $scope.selectMainTab = function() {
        $scope.activeTab = 'Editor';
        $scope.showNavigationOptions = false;
        TopicEditorRoutingService.navigateToMainTab();
      };

      $scope.selectQuestionsTab = function() {
        $scope.activeTab = 'Question';
        $scope.showNavigationOptions = false;
        TopicEditorRoutingService.navigateToQuestionsTab();
      };

      $scope.getActiveTabName = function() {
        return TopicEditorRoutingService.getActiveTabName();
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onTopicInitialized.subscribe(
            () => _validateTopic()
          ));
        ctrl.directiveSubscriptions.add(
          TopicEditorStateService.onTopicReinitialized.subscribe(
            () => _validateTopic()
          ));
        $scope.topicId = UrlService.getTopicIdFromUrl();
        $scope.navigationChoices = ['Topic', 'Questions', 'Preview'];
        $scope.activeTab = 'Editor';
        $scope.showNavigationOptions = false;
        $scope.warningsAreShown = false;
        $scope.showTopicEditOptions = false;
        $scope.topic = TopicEditorStateService.getTopic();
        $scope.topicSkillIds = $scope.topic.getSkillIds();
        $scope.discardChangesButtonIsShown = false;
        $scope.validationIssues = [];
        $scope.prepublishValidationIssues = [];
        $scope.topicRights = TopicEditorStateService.getTopicRights();
        ctrl.directiveSubscriptions.add(
          UndoRedoService.getUndoRedoChangeEventEmitter().subscribe(
            () => _validateTopic()
          )
        );
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }]
});
