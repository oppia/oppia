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
 * @fileoverview Directive for the navbar of the collection editor.
 */

require(
  'components/review-material-editor/review-material-editor.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/templates/' +
  'create-new-skill-modal.controller.ts');

require('components/entity-creation-services/skill-creation.service.ts');
require('components/entity-creation-services/topic-creation.service.ts');
require('domain/skill/RubricObjectFactory.ts');
require('domain/skill/SkillObjectFactory.ts');
require('domain/topic/editable-topic-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');

require('services/contextual/window-dimensions.service.ts');
require('services/image-local-storage.service.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

angular.module('oppia').directive('topicsAndSkillsDashboardNavbar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topics-and-skills-dashboard-page/navbar/' +
        'topics-and-skills-dashboard-navbar.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', 'ContextService',
        'ImageLocalStorageService', 'EditableTopicBackendApiService',
        'RubricObjectFactory', 'SkillCreationService', 'SkillObjectFactory',
        'TopicCreationService', 'WindowDimensionsService',
        'EVENT_TYPE_SKILL_CREATION_ENABLED',
        'EVENT_TYPE_TOPIC_CREATION_ENABLED',
        'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
        'MAX_CHARS_IN_SKILL_DESCRIPTION', 'SKILL_DIFFICULTIES',
        'SKILL_DESCRIPTION_STATUS_VALUES',
        function(
            $scope, $rootScope, $uibModal, ContextService,
            ImageLocalStorageService, EditableTopicBackendApiService,
            RubricObjectFactory, SkillCreationService, SkillObjectFactory,
            TopicCreationService, WindowDimensionsService,
            EVENT_TYPE_SKILL_CREATION_ENABLED,
            EVENT_TYPE_TOPIC_CREATION_ENABLED,
            EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
            MAX_CHARS_IN_SKILL_DESCRIPTION, SKILL_DIFFICULTIES,
            SKILL_DESCRIPTION_STATUS_VALUES) {
          var ctrl = this;
          $scope.createTopic = function() {
            TopicCreationService.createNewTopic();
          };
          $scope.createSkill = function() {
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
              controller: 'CreateNewSkillModalController',
            }).result.then(function(result) {
              ContextService.resetImageSaveDestination();
              SkillCreationService.createNewSkill(
                result.description, result.rubrics, result.explanation, []);
            }, function() {
              ImageLocalStorageService.flushStoredImagesData();
              SkillCreationService.resetSkillDescriptionStatusMarker();
            });
          };
          ctrl.$onInit = function() {
            $scope.showButtons = (WindowDimensionsService.getWidth() >= 1200);
            ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
              subscribe(evt => {
                $scope.showButtons = (
                  WindowDimensionsService.getWidth() >= 1200);

                // TODO(#8521): Remove the use of $rootScope.$apply()
                // once the directive is migrated to angular
                $scope.$apply();
              });
            $rootScope.$on(
              EVENT_TYPE_TOPIC_CREATION_ENABLED, function(evt, canCreateTopic) {
                $scope.userCanCreateTopic = canCreateTopic;
              }
            );
            $rootScope.$on(
              EVENT_TYPE_SKILL_CREATION_ENABLED, function(evt, canCreateSkill) {
                $scope.userCanCreateSkill = canCreateSkill;
              }
            );
          };

          ctrl.$onDestroy = function() {
            if (ctrl.resizeSubscription) {
              ctrl.resizeSubscription.unsubscribe();
            }
          };
        }
      ]
    };
  }]);
