// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for detecting spamming behavior from the learner.
 */

require('domain/utilities/UrlInterpolationService.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('FatigueDetectionService', [
  '$uibModal', 'UrlInterpolationService',
  function($uibModal, UrlInterpolationService) {
    // 4 submissions in under 10 seconds triggers modal.
    var SPAM_COUNT_THRESHOLD = 4;
    var SPAM_WINDOW_MSEC = 10000;
    var submissionTimesMsec = [];

    return {
      recordSubmissionTimestamp: function() {
        submissionTimesMsec.push((new Date()).getTime());
      },
      isSubmittingTooFast: function() {
        if (submissionTimesMsec.length >= SPAM_COUNT_THRESHOLD) {
          var windowStartTime = submissionTimesMsec.shift();
          var windowEndTime =
            submissionTimesMsec[submissionTimesMsec.length - 1];
          if (windowEndTime - windowStartTime < SPAM_WINDOW_MSEC) {
            return true;
          }
        }
        return false;
      },
      displayTakeBreakMessage: function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-player-page/templates/' +
            'take-break-modal.template.html'),
          backdrop: 'static',
          resolve: {},
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.okay = function() {
                $uibModalInstance.close('okay');
              };
            }]
        });
      },
      reset: function() {
        submissionTimesMsec = [];
      }
    };
  }]);
