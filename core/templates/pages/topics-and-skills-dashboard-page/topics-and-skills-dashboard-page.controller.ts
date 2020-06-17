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
 * @fileoverview Controllers for the topics and skills dashboard.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.component.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/skills-list/' +
  'skills-list.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/templates/' +
  'create-new-skill-modal.controller.ts');
require(
  'pages/topics-and-skills-dashboard-page/topics-list/' +
  'topics-list.directive.ts');

require('components/entity-creation-services/skill-creation.service.ts');
require('components/entity-creation-services/topic-creation.service.ts');
require('components/rubrics-editor/rubrics-editor.directive.ts');

require('domain/skill/RubricObjectFactory.ts');
require('domain/topics_and_skills_dashboard/' +
  'TopicsAndSkillsDashboardFilterObjectFactory.ts');
require('domain/skill/SkillObjectFactory.ts');
require(
  'domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/topics-and-skills-dashboard-page/skills-list/' +
  'skills-list.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/topics-list/' +
  'topics-list.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.service');
require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');
require('services/alerts.service.ts');
require('services/image-local-storage.service.ts');


angular.module('oppia').directive('topicsAndSkillsDashboardPage', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/' +
        'topics-and-skills-dashboard-page.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$timeout', '$http', '$rootScope', '$scope', '$uibModal', '$window',
        'AlertsService', 'ContextService', 'ImageLocalStorageService',
        'TopicsAndSkillsDashboardFilterObjectFactory',
        'RubricObjectFactory', 'SkillCreationService',
        'SkillObjectFactory', 'TopicCreationService',
        'TopicsAndSkillsDashboardBackendApiService',
        'TopicsAndSkillsDashboardPageService', 'UrlInterpolationService',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        'EVENT_TYPE_SKILL_CREATION_ENABLED',
        'EVENT_TYPE_TOPIC_CREATION_ENABLED',
        'FATAL_ERROR_CODES', 'SKILL_DIFFICULTIES',
        'MAX_CHARS_IN_SKILL_DESCRIPTION', 'SKILL_DESCRIPTION_STATUS_VALUES',
        'TOPIC_FILTER_CLASSROOM_ALL', 'TOPIC_SORT_OPTIONS',
        'TOPIC_PUBLISHED_OPTIONS',
        function(
            $timeout, $http, $rootScope, $scope, $uibModal, $window,
            AlertsService, ContextService, ImageLocalStorageService,
            TopicsAndSkillsDashboardFilterObjectFactory,
            RubricObjectFactory, SkillCreationService,
            SkillObjectFactory, TopicCreationService,
            TopicsAndSkillsDashboardBackendApiService,
            TopicsAndSkillsDashboardPageService, UrlInterpolationService,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
            EVENT_TYPE_SKILL_CREATION_ENABLED,
            EVENT_TYPE_TOPIC_CREATION_ENABLED,
            FATAL_ERROR_CODES, SKILL_DIFFICULTIES,
            MAX_CHARS_IN_SKILL_DESCRIPTION, SKILL_DESCRIPTION_STATUS_VALUES,
            TOPIC_FILTER_CLASSROOM_ALL, TOPIC_SORT_OPTIONS,
            TOPIC_PUBLISHED_OPTIONS) {
          var ctrl = this;

          /**
           * Calls the TopicsAndSkillsDashboardBackendApiService and fetches
           * the topics and skills dashboard data.
           * @param {Boolean} stayInSameTab - To stay in the same tab or not.
           */
          ctrl._initDashboard = function(stayInSameTab) {
            TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
              function(response) {
                ctrl.totalTopicSummaries = response.topic_summary_dicts;
                ctrl.topicSummaries = ctrl.totalTopicSummaries;
                ctrl.totalEntityCountToDisplay = ctrl.topicSummaries.length;
                ctrl.currentCount = ctrl.totalEntityCountToDisplay;
                ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
                ctrl.goToPageNumber(0);
                ctrl.editableTopicSummaries = (ctrl.topicSummaries.filter(
                  function(summary) {
                    return summary.can_edit_topic === true;
                  }
                ));
                ctrl.skillsCategorizedByTopics = (
                  response.categorized_skills_dict);
                ctrl.untriagedSkillSummaries = (
                  response.untriaged_skill_summary_dicts);
                ctrl.totalUntriagedSkillSummaries = (
                  ctrl.untriagedSkillSummaries);
                ctrl.mergeableSkillSummaries = (
                  response.mergeable_skill_summary_dicts);
                if (!stayInSameTab || !ctrl.activeTab) {
                  ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
                }
                ctrl.userCanCreateTopic = response.can_create_topic;
                ctrl.userCanCreateSkill = response.can_create_skill;
                $rootScope.$broadcast(
                  EVENT_TYPE_TOPIC_CREATION_ENABLED, ctrl.userCanCreateTopic);
                $rootScope.$broadcast(
                  EVENT_TYPE_SKILL_CREATION_ENABLED, ctrl.userCanCreateSkill);
                ctrl.userCanDeleteTopic = response.can_delete_topic;
                ctrl.userCanDeleteSkill = response.can_delete_skill;

                if (ctrl.topicSummaries.length === 0 &&
                    ctrl.untriagedSkillSummaries.length !== 0) {
                  ctrl.activeTab = ctrl.TAB_NAME_UNTRIAGED_SKILLS;
                }
                ctrl.classrooms = response.all_classroom_names;
                // Adding this since karma tests adds
                // TOPIC_FILTER_CLASSROOM_ALL for every it block.
                if (!ctrl.classrooms.includes(TOPIC_FILTER_CLASSROOM_ALL)) {
                  ctrl.classrooms.unshift(TOPIC_FILTER_CLASSROOM_ALL);
                }
                ctrl.applyFilters();
                $rootScope.$apply();
              },
              function(errorResponse) {
                if (FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
                  AlertsService.addWarning('Failed to get dashboard data.');
                } else {
                  AlertsService.addWarning(
                    'Unexpected error code from the server.');
                }
              }
            );
          };

          /**
           * Sets the active tab to topics or skills.
           * @param {String} tabName - name of the tab to set.
           */
          ctrl.setActiveTab = function(tabName) {
            ctrl.activeTab = tabName;
            if (ctrl.activeTab === ctrl.TAB_NAME_TOPICS) {
              ctrl.goToPageNumber(ctrl.topicPageNumber);
            } else if (ctrl.activeTab === ctrl.TAB_NAME_UNTRIAGED_SKILLS) {
              ctrl.goToPageNumber(ctrl.skillPageNumber);
            }
          };

          ctrl.createTopic = function() {
            TopicCreationService.createNewTopic();
          };

          ctrl.createSkill = function() {
            var rubrics = [
              RubricObjectFactory.create(SKILL_DIFFICULTIES[0], []),
              RubricObjectFactory.create(SKILL_DIFFICULTIES[1], ['']),
              RubricObjectFactory.create(SKILL_DIFFICULTIES[2], [])];
            ContextService.setImageSaveDestinationToLocalStorage();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topics-and-skills-dashboard-page/templates/' +
                'create-new-skill-modal.template.html'),
              backdrop: 'static',
              resolve: {
                rubrics: () => rubrics
              },
              controller: 'CreateNewSkillModalController'
            }).result.then(function(result) {
              ContextService.resetImageSaveDestination();
              SkillCreationService.createNewSkill(
                result.description, result.rubrics, result.explanation, []);
            }, function() {
              ImageLocalStorageService.flushStoredImagesData();
              SkillCreationService.resetSkillDescriptionStatusMarker();
            });
          };
          /**
           * @param {Number} pageNumber - Page number to navigate to.
           */
          ctrl.goToPageNumber = function(pageNumber) {
            if (ctrl.activeTab === ctrl.TAB_NAME_TOPICS) {
              ctrl.topicPageNumber = pageNumber;
              ctrl.pageNumber = ctrl.topicPageNumber;
              ctrl.displayedTopicSummaries = (ctrl.topicSummaries.slice(
                pageNumber * ctrl.itemsPerPage,
                (pageNumber + 1) * ctrl.itemsPerPage));
            } else if (ctrl.activeTab === ctrl.TAB_NAME_UNTRIAGED_SKILLS) {
              ctrl.totalEntityCountToDisplay = (
                ctrl.totalUntriagedSkillSummaries.length);
              ctrl.skillPageNumber = pageNumber;
              ctrl.pageNumber = ctrl.skillPageNumber;
              ctrl.untriagedSkillSummaries = (
                ctrl.totalUntriagedSkillSummaries.slice(
                  pageNumber * ctrl.itemsPerPage,
                  (pageNumber + 1) * ctrl.itemsPerPage));
            }
          };
          /**
           * @param {String} direction - Direction, whether to change the
           * page to left or right by 1.
           */
          ctrl.changePageByOne = function(direction) {
            ctrl.lastPage = parseInt(
              String(ctrl.totalEntityCountToDisplay / ctrl.itemsPerPage));
            if (direction === ctrl.MOVE_TO_PREV_PAGE && ctrl.pageNumber >= 1) {
              ctrl.goToPageNumber(ctrl.pageNumber - 1);
            } else if (direction === ctrl.MOVE_TO_NEXT_PAGE &&
                ctrl.pageNumber < ctrl.lastPage) {
              ctrl.goToPageNumber(ctrl.pageNumber + 1);
            }
          };

          ctrl.applyFilters = function() {
            ctrl.topicSummaries = (
              TopicsAndSkillsDashboardPageService.getFilteredTopics(
                ctrl.totalTopicSummaries, ctrl.filterObject));

            ctrl.displayedTopicSummaries =
                ctrl.topicSummaries.slice(0, ctrl.itemsPerPage);
            ctrl.currentCount = ctrl.topicSummaries.length;
            ctrl.goToPageNumber(0);
            $scope.$applyAsync();
            _forceSelect2Refresh();
          };

          // Select2 dropdown cannot automatically refresh its display
          // after being translated.
          // Use ctrl.select2DropdownIsShown in its ng-if attribute
          // and this function to force it to reload
          var _forceSelect2Refresh = function() {
            ctrl.select2DropdownIsShown = false;
            $timeout(function() {
              ctrl.select2DropdownIsShown = true;
            }, 100);
          };

          ctrl.resetFilters = function() {
            ctrl.topicSummaries = ctrl.totalTopicSummaries;
            ctrl.currentCount = ctrl.totalEntityCountToDisplay;
            ctrl.filterObject.reset();
            ctrl.applyFilters();
          };

          ctrl.refreshPagination = function() {
            ctrl.goToPageNumber(0);
          };

          ctrl.$onInit = function() {
            ctrl.TAB_NAME_TOPICS = 'topics';
            ctrl.activeTab = ctrl.TAB_NAME_TOPICS;
            ctrl.MOVE_TO_NEXT_PAGE = 'next_page';
            ctrl.MOVE_TO_PREV_PAGE = 'prev_page';
            ctrl.TAB_NAME_UNTRIAGED_SKILLS = 'untriagedSkills';
            ctrl.TAB_NAME_UNPUBLISHED_SKILLS = 'unpublishedSkills';
            ctrl.pageNumber = 0;
            ctrl.topicPageNumber = 0;
            ctrl.itemsPerPage = 10;
            ctrl.skillPageNumber = 0;
            ctrl.selectedIndex = null;
            ctrl.itemsPerPageChoice = [10, 15, 20];
            ctrl.filterObject = (
              TopicsAndSkillsDashboardFilterObjectFactory.createDefault());
            ctrl.classrooms = [];
            ctrl.sortOptions = [];
            for (let key in TOPIC_SORT_OPTIONS) {
              ctrl.sortOptions.push(TOPIC_SORT_OPTIONS[key]);
            }
            ctrl.statusOptions = [];
            for (let key in TOPIC_PUBLISHED_OPTIONS) {
              ctrl.statusOptions.push(TOPIC_PUBLISHED_OPTIONS[key]);
            }
            ctrl.select2DropdownIsShown = true;

            ctrl.generateNumbersTillRange = function(range) {
              var arr = [];
              for (var i = 0; i < range; i++) {
                arr.push(i);
              }
              return arr;
            };
            $scope.$on(
              EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, function(
                  evt, stayInSameTab) {
                ctrl._initDashboard(stayInSameTab);
              }
            );
            // The _initDashboard function is written separately since it is
            // also called in $scope.$on when some external events are
            // triggered.
            ctrl._initDashboard(false);
          };
        }
      ]
    };
  }]);
