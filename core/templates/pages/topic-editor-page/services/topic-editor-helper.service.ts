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
 * @fileoverview Service to maintain the state of a single topic shared
 * throughout the topic editor. This service provides functionality for
 * retrieving the topic, saving it, and listening for changes.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
    'background-banner.component.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require('components/entity-creation-services/skill-creation.service.ts');
require('domain/skill/RubricObjectFactory.ts');
require('components/rubrics-editor/rubrics-editor.directive.ts');
require(
  'pages/topics-and-skills-dashboard-page/templates/' +
    'create-new-skill-modal.controller.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/modal-templates/' +
  'create-new-subtopic-modal.controller.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').factory('TopicEditorHelperService', [
  '$location', '$uibModal', '$window', 'ContextService',
  'ImageLocalStorageService', 'RubricObjectFactory', 'SkillCreationService',
  'TopicEditorRoutingService', 'TopicEditorStateService',
  'UrlInterpolationService', 'SKILL_DIFFICULTIES',
  function(
      $location, $uibModal, $window, ContextService,
      ImageLocalStorageService, RubricObjectFactory, SkillCreationService,
      TopicEditorRoutingService, TopicEditorStateService,
      UrlInterpolationService, SKILL_DIFFICULTIES) {
    var createSubtopic = function(topic) {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/topic-editor-page/modal-templates/' +
                    'create-new-subtopic-modal.template.html'),
        backdrop: true,
        resolve: {
          topic: () => topic
        },
        controllerAs: '$ctrl',
        controller: 'CreateNewSubtopicModalController'
      }).result.then(function(subtopicId) {
        TopicEditorRoutingService.navigateToSubtopicEditorWithId(subtopicId);
      });
    };

    var getSubtopicIdFromUrl = function() {
      return $location.path().split('/')[2];
    };

    var navigateToSkillEditorWithId = function(skillId) {
      var SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skill_id>';

      var skillEditorUrl = UrlInterpolationService.interpolateUrl(
        SKILL_EDITOR_URL_TEMPLATE, {
          skill_id: skillId
        });
      $window.open(skillEditorUrl);
    };
    var createSkill = function() {
      var topicId = TopicEditorStateService.getTopic().getId();
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
          result.description, result.rubrics, result.explanation, [topicId]);
      }, function() {
        ImageLocalStorageService.flushStoredImagesData();
        SkillCreationService.resetSkillDescriptionStatusMarker();
      });
    };

    var checkValidSubtopicName = function(title) {
      var subtopicTitles = [];
      var topic = TopicEditorStateService.getTopic();
      topic.getSubtopics().forEach(
        function(subtopic) {
          return subtopicTitles.push(subtopic.getTitle());
        });
      return (subtopicTitles.indexOf(title) === -1);
    };

    return {
      createSubtopic: createSubtopic,
      createSkill: createSkill,
      checkValidSubtopicName: checkValidSubtopicName,
      getSubtopicIdFromUrl: getSubtopicIdFromUrl,
      navigateToSkillEditorWithId: navigateToSkillEditorWithId
    };
  }
]);
