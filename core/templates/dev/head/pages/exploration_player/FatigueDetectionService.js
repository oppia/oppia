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

oppia.factory('fatigueDetectionService', 
  ['$modal', function($modal) {
    var submissionTimes = [];

    return {
      addSubmission: function() {
        submissionTimes.push(+new Date());
        // 4 submissions in under 10 seconds
        if (submissionTimes.length > 3) {
          var timeThreeSubmissionsAgo = submissionTimes.shift();
          var timeLastSubmission = submissionTimes[submissionTimes.length - 1];
          if (timeLastSubmission - timeThreeSubmissionsAgo < 10000) {
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
        submissionTimes = [];
      }
    }
  }]);