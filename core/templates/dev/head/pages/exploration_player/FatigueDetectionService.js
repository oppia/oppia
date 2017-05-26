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

oppia.factory('FatigueDetectionService', 
  ['$modal', function($modal) {
    // 4 submissions in under 10 seconds triggers modal
    var NUM_SUBMISSIONS = 4;
    var SPAM_WINDOW = 10000;
    var submissionTimesMsec = [];

    return {
      addSubmission: function() {
        submissionTimesMsec.push(+new Date());
        if (submissionTimesMsec.length >= NUM_SUBMISSIONS) {
          var timeThreeSubmissionsAgo = submissionTimesMsec.shift();
          var timeLastSubmission = submissionTimesMsec[submissionTimesMsec.length - 1];
          if (timeLastSubmission - timeThreeSubmissionsAgo < SPAM_WINDOW) {
            $modal.open({
              templateUrl: 'modals/takeBreak',
              backdrop: 'static',
              resolve: {},
              controller: [
                '$scope', '$modalInstance',
                function($scope, $modalInstance) {
                  $scope.okay = function() {
                    $modalInstance.close('okay');
                  };
                }]
            });
            return true;
          }
        }
        return false;
      },
      reset: function() {
        submissionTimesMsec = [];
      }
    }
  }]);
