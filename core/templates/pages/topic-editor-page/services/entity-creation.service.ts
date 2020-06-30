// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to help with creating various entities. This is needed
 * so that we don't have to write redundant code every time we want to create
 * an entity.
 */

require('base-components/base-content.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
    'background-banner.component.ts');
require(
  'components/review-material-editor/review-material-editor.directive.ts');
require(
  'components/forms/custom-forms-directives/select2-dropdown.directive.ts');
require('components/entity-creation-services/skill-creation.service.ts');
require('domain/skill/RubricObjectFactory.ts');
require('components/rubrics-editor/rubrics-editor.directive.ts');
require('pages/topics-and-skills-dashboard-page/' +
    'create-new-skill-modal.controller.ts');
require('pages/topic-editor-page/services/topic-editor-routing.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('pages/topic-editor-page/modal-templates/' +
  'create-new-subtopic-modal.controller.ts');
require('services/context.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').factory('EntityCreationService', [
  '$uibModal', 'SkillCreationService',
  'TopicEditorRoutingService', 'TopicEditorStateService',
  'UrlInterpolationService',
  function(
      $uibModal, SkillCreationService,
      TopicEditorRoutingService, TopicEditorStateService,
      UrlInterpolationService) {
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

    var createSkill = function() {
      var topicId = TopicEditorStateService.getTopic().getId();
      SkillCreationService.createNewSkill([topicId]);
    };

    return {
      createSubtopic: createSubtopic,
      createSkill: createSkill
    };
  }
]);
