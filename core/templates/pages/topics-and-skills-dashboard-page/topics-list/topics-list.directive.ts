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
 * @fileoverview Controller for the topics list viewer.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller');

require('domain/topic/editable-topic-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

angular.module('oppia').directive('topicsList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getTopicSummaries: '&topicSummaries',
        getPageNumber: '&pageNumber',
        getItemsPerPage: '&itemsPerPage',
        canDeleteTopic: '&userCanDeleteTopic',
        selectedTopicIds: '='
      },
      controllerAs: '$ctrl',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/topics-list/' +
        'topics-list.directive.html'),
      controller: [
        '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
        'AlertsService', 'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $uibModal, $rootScope, EditableTopicBackendApiService,
            AlertsService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          var ctrl = this;
          ctrl.getTopicEditorUrl = function(topicId) {
            return '/topic_editor/' + topicId;
          };
          ctrl.showEditOptions = function(topicId) {
            return ctrl.selectedIndex === topicId;
          };

          ctrl.enableEditOptions = function(topicId) {
            ctrl.selectedIndex = topicId;
          };

          ctrl.deleteTopic = function(topicId) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'delete-topic-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              EditableTopicBackendApiService.deleteTopic(topicId).then(
                function(status) {
                  $rootScope.$broadcast(
                    EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED);
                },
                function(error) {
                  AlertsService.addWarning(
                    error || 'There was an error when deleting the topic.');
                }
              );
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.$onInit = function() {
            ctrl.selectedIndex = null;
            // As additional stories are not supported initially, it's not
            // being shown, for now.
            ctrl.TOPIC_HEADINGS = [
              'index', 'name', 'canonical_story_count', 'subtopic_count',
              'skill_count', 'topic_status'
            ];
          };
        }
      ]
    };
  }]);
