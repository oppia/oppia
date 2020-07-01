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
 * @fileoverview Functionality for creating a new skill.
 */

require('domain/utilities/url-interpolation.service.ts');
require('domain/skill/skill-creation-backend-api.service.ts');
require('services/alerts.service.ts');
require('services/image-local-storage.service.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ajs.ts');

require(
  'pages/topics-and-skills-dashboard-page/' +
  'create-new-skill-modal.controller.ts');
angular.module('oppia').factory('SkillCreationService', [
  '$rootScope', '$timeout', '$uibModal', '$window', 'AlertsService',
  'ImageLocalStorageService', 'SkillCreationBackendApiService',
  'UrlInterpolationService', 'EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED',
  'SKILL_DESCRIPTION_STATUS_VALUES',
  function(
      $rootScope, $timeout, $uibModal, $window, AlertsService,
      ImageLocalStorageService, SkillCreationBackendApiService,
      UrlInterpolationService, EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED,
      SKILL_DESCRIPTION_STATUS_VALUES) {
    var CREATE_NEW_SKILL_URL_TEMPLATE = (
      '/skill_editor/<skill_id>');
    var skillCreationInProgress = false;
    var skillDescriptionStatusMarker = (
      SKILL_DESCRIPTION_STATUS_VALUES.STATUS_UNCHANGED);

    return {
      markChangeInSkillDescription: function() {
        skillDescriptionStatusMarker = (
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_CHANGED);
      },

      getSkillDescriptionStatus: function() {
        return skillDescriptionStatusMarker;
      },

      disableSkillDescriptionStatusMarker: function() {
        skillDescriptionStatusMarker = (
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_DISABLED);
      },

      resetSkillDescriptionStatusMarker: function() {
        skillDescriptionStatusMarker = (
          SKILL_DESCRIPTION_STATUS_VALUES.STATUS_UNCHANGED);
      },
      createNewSkill: function(topicIds) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/topics-and-skills-dashboard-page/templates/' +
            'create-new-skill-modal.template.html'),
          backdrop: 'static',
          windowClass: 'create-new-skill-modal',
          controller: 'CreateNewSkillModalController'
        }).result.then(function(result) {
          if (skillCreationInProgress) {
            return;
          }
          var rubrics = result.rubrics;
          for (var idx in rubrics) {
            rubrics[idx] = rubrics[idx].toBackendDict();
          }
          skillCreationInProgress = true;
          AlertsService.clearWarnings();
          // $window.open has to be initialized separately since if the 'open
          // new tab' action does not directly result from a user input
          // (which is not the case, if we wait for result from the backend
          // before opening a new tab), some browsers block it as a popup.
          // Here, the new tab is created as soon as the user clicks the
          // 'Create' button and filled with URL once the details are
          // fetched from the backend.
          var newTab = $window.open();
          var imagesData = ImageLocalStorageService.getStoredImagesData();
          SkillCreationBackendApiService.createSkill(
            result.description, rubrics, result.explanation,
            topicIds || [], imagesData).then(function(response) {
            $timeout(function() {
              $rootScope.$broadcast(
                EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED, true);
              skillCreationInProgress = false;
              ImageLocalStorageService.flushStoredImagesData();
              newTab.location.href = UrlInterpolationService.interpolateUrl(
                CREATE_NEW_SKILL_URL_TEMPLATE, {
                  skill_id: response.skillId
                });
            }, 150);
          }, function(errorMessage) {
            AlertsService.addWarning(errorMessage);
          });
        });
      }
    };
  }
]);
