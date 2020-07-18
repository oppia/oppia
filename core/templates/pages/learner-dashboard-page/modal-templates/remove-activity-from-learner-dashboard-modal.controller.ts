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
 * @fileoverview Controller for remove activity from learner dashboard modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').controller(
  'RemoveActivityFromLearnerDashboardModalController', [
    '$controller', '$http', '$scope', '$uibModalInstance',
    'UrlInterpolationService', 'activity', 'sectionNameI18nId',
    'subsectionName', 'ACTIVITY_TYPE_COLLECTION',
    'ACTIVITY_TYPE_EXPLORATION', 'LEARNER_DASHBOARD_SECTION_I18N_IDS',
    'LEARNER_DASHBOARD_SUBSECTION_I18N_IDS',
    function(
        $controller, $http, $scope, $uibModalInstance,
        UrlInterpolationService, activity, sectionNameI18nId,
        subsectionName, ACTIVITY_TYPE_COLLECTION,
        ACTIVITY_TYPE_EXPLORATION, LEARNER_DASHBOARD_SECTION_I18N_IDS,
        LEARNER_DASHBOARD_SUBSECTION_I18N_IDS) {
      $controller('ConfirmOrCancelModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });

      $scope.sectionNameI18nId = sectionNameI18nId;
      $scope.subsectionName = subsectionName;
      $scope.activityTitle = activity.title;
      $scope.remove = function() {
        var activityType = '';
        if (subsectionName ===
          LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
          activityType = ACTIVITY_TYPE_EXPLORATION;
        } else if (subsectionName ===
                  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
                    .COLLECTIONS) {
          activityType = ACTIVITY_TYPE_COLLECTION;
        } else {
          throw new Error('Subsection name is not valid.');
        }

        var removeActivityUrlPrefix = '';
        if (sectionNameI18nId ===
            LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
          removeActivityUrlPrefix =
            '/learnerplaylistactivityhandler/';
        } else if (sectionNameI18nId ===
                  LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
          removeActivityUrlPrefix =
            '/learnerincompleteactivityhandler/';
        } else {
          throw new Error('Section name is not valid.');
        }

        var removeActivityUrl = (
          UrlInterpolationService.interpolateUrl(
            removeActivityUrlPrefix +
            '<activityType>/<activityId>', {
              activityType: activityType,
              activityId: activity.id
            }));

        $http['delete'](removeActivityUrl);
        $uibModalInstance.close();
      };
    }
  ]);
