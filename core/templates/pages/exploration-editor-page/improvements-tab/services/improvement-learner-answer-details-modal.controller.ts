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
 * @fileoverview Controller for ImprovementLearnerAnswerDetailsModal.
 */

angular.module('oppia').controller(
  'ImprovementLearnerAnswerDetailsModalController', [
    '$scope', '$uibModalInstance', 'DateTimeFormatService',
    'ExplorationHtmlFormatterService', 'LearnerAnswerDetailsDataService',
    'isEditable', 'learnerAnswerDetails',
    function(
        $scope, $uibModalInstance, DateTimeFormatService,
        ExplorationHtmlFormatterService, LearnerAnswerDetailsDataService,
        isEditable, learnerAnswerDetails) {
      $scope.selectedLearnerAnswerInfo = [];
      $scope.isEditable = isEditable;
      $scope.learnerAnswerDetails = learnerAnswerDetails;
      $scope.currentLearnerAnswerInfo = null;
      $scope.viewAnswerDetails = false;
      $scope.getLocaleAbbreviatedDatetimeString = (
        DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

      $scope.changeView = function(learnerAnswerInfo) {
        $scope.currentLearnerAnswerInfo = learnerAnswerInfo;
        $scope.viewAnswerDetails = !($scope.viewAnswerDetails);
      };

      $scope.getLearnerAnswerInfos = function() {
        return $scope.learnerAnswerDetails.learnerAnswerInfoData;
      };

      $scope.getAnswerDetails = function(learnerAnswerInfo) {
        return learnerAnswerInfo.getAnswerDetails();
      };

      $scope.selectLearnerAnswerInfo = function(learnerAnswerInfo) {
        var index = $scope.selectedLearnerAnswerInfo.indexOf(
          learnerAnswerInfo);
        if (index === -1) {
          $scope.selectedLearnerAnswerInfo.push(learnerAnswerInfo);
        } else {
          $scope.selectedLearnerAnswerInfo.splice(index, 1);
        }
      };

      $scope.deleteSelectedLearnerAnswerInfo = function() {
        for (
          var i = 0; i < $scope.selectedLearnerAnswerInfo.length; i++) {
          var index = (
            $scope.learnerAnswerDetails.learnerAnswerInfoData.indexOf(
              $scope.selectedLearnerAnswerInfo[i]));
          $scope.learnerAnswerDetails.learnerAnswerInfoData.splice(
            index, 1);
          LearnerAnswerDetailsDataService.deleteLearnerAnswerInfo(
            $scope.learnerAnswerDetails.expId,
            $scope.learnerAnswerDetails.stateName,
            $scope.selectedLearnerAnswerInfo[i].getId());
        }
        $scope.selectedLearnerAnswerInfo = [];
        $scope.currentLearnerAnswerInfo = null;
        if ($scope.getLearnerAnswerInfos().length === 0) {
          $scope.close();
        }
      };

      $scope.getLearnerAnswerHtml = function(learnerAnswerInfo) {
        return ExplorationHtmlFormatterService.getShortAnswerHtml(
          learnerAnswerInfo.getAnswer(),
          $scope.learnerAnswerDetails.interactionId,
          $scope.learnerAnswerDetails.customizationArgs);
      };

      $scope.close = function() {
        $uibModalInstance.close();
      };
    }
  ]);
