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


require('domain/topic/editable-topic-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'delete-topic-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');
require('services/alerts.service.ts');

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
        '$scope', '$uibModal', '$rootScope', 'EditableTopicBackendApiService',
        'AlertsService', 'UrlInterpolationService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        function(
            $scope, $uibModal, $rootScope, EditableTopicBackendApiService,
            AlertsService, UrlInterpolationService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED) {
          var ctrl = this;
          /**
           * @param {String} topicId - ID of the topic.
           * @returns {String} Url of the topic editor with the
           * topic ID provided in the args.
           */
          ctrl.getTopicEditorUrl = function(topicId) {
            var TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topic_id>';
            return UrlInterpolationService.interpolateUrl(
              TOPIC_EDITOR_URL_TEMPLATE, {
                topic_id: topicId
              });
          };

          /**
           * @param {String} topicId - ID of the topic.
           * @returns {Boolean} Returns true for the topic whose
           * edit options should be shown.
           */
          ctrl.showEditOptions = function(topicId) {
            return ctrl.selectedIndex === topicId;
          };

          /**
           * @param {String} topicId - ID of the topic.
           */
          ctrl.enableEditOptions = function(topicId) {
            ctrl.selectedIndex = topicId;
          };

          /**
           ** @param {Number} topicIndex - Index of the topic in
           * the topicSummaries.
           * @returns {Number} The calculated serial number
           * of the topic taking into consideration the current page
           * number and the items being displayed per page.
           */
          ctrl.getSerialNumberForTopic = function(topicIndex) {
            var topicSerialNumber = (
              topicIndex + (ctrl.getPageNumber() * ctrl.getItemsPerPage()));
            return (topicSerialNumber + 1);
          };

          /**
           * @param {String} topicId - ID of the topic.
           * @param {String} topicName - Name of the topic.
           */
          ctrl.deleteTopic = function(topicId, topicName) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'delete-topic-modal.template.html'),
              backdrop: true,
              resolve: {
                topicName: function() {
                  return topicName;
                }
              },
              controller: 'DeleteTopicModalController'
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
            ctrl.getPageNumber = $scope.getPageNumber;
            ctrl.getItemsPerPage = $scope.getItemsPerPage;
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
