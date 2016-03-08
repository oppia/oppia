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
 * @fileoverview Factory for handling warnings.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('warningsData', ['$log', function($log) {
  var warningsData = {
    warnings: [],
    infoMessages: [],
  };
  // This is to prevent infinite loops.
  var MAX_TOTAL_WARNINGS = 100;
  var MAX_TOTAL_INFO_MESSAGES = 100;
  var warningsSoFar = 0;
  var infoMessagesSoFar = 0;

  /**
   * Adds a warning message to the butterbar.
   * @param {string} warning - The warning message to display.
   */
  warningsData.addWarning = function(warning) {
    $log.error(warning);
    warningsSoFar++;
    if (warningsSoFar > MAX_TOTAL_WARNINGS) {
      return;
    }

    warningsData.warnings = [warning];
  };

  /**
   * Adds a warning in the same way as addWarning(), except it also throws an
   * exception to cause a hard failure in the frontend.
   */
  warningsData.fatalWarning = function(warning) {
    warningsData.addWarning(warning);
    throw new Error(warning);
  };

  /**
   * Deletes the warning at a given index.
   * @param {int} index - The index of the warning to delete.
   */
  warningsData.deleteWarning = function(index) {
    console.log("Deleting message!");
    warningsData.warnings.splice(index, 1);
  };

  /**
   * Clears all warnings.
   */
  warningsData.clear = function() {
    warningsData.warnings = [];
  };

  return warningsData;
}]);

oppia.factory('alertsService', ['$log', function($log) {
  var alertsService = {
    warnings: [],
    infoMessages: [],
  };
  // This is to prevent infinite loops.
  var MAX_TOTAL_WARNINGS = 100;
  var MAX_TOTAL_INFO_MESSAGES = 100;
  var warningsSoFar = 0;
  var infoMessagesSoFar = 0;

  /**
   * Adds a warning message to the butterbar.
   * @param {string} warning - The warning message to display.
   */
  alertsService.addWarning = function(warning) {
    $log.error(warning);
    warningsSoFar++;
    if (warningsSoFar > MAX_TOTAL_WARNINGS) {
      return;
    }

    alertsService.warnings = [warning];
  };

  alertsService.addInfoMessage = function(message) {
    $log.error(message);
    infoMessagesSoFar++;
    if (infoMessagesSoFar > MAX_TOTAL_INFO_MESSAGES) {
      return;
    }
    alertsService.infoMessages.push(message);
  };
 
  alertsService.deleteInfoMessage = function(message, index) {
    console.log("Deleting info message!");
    var info = alertsService.infoMessages;
    var new_info = [];
    for(var i = 0; i < info.length; i++) {
      if (info[i] != message) {
        new_info.push(info[i]);
      }
    }
    alertsService.infoMessages = new_info;
    //alertsService.infoMessages.splice(index, 1);
  };

  return alertsService;

}]);

oppia.directive('infoMessage', ['$timeout', function($timeout){
  return {
    restrict: 'E',
    scope: {
      message: '=messageContent',
      messageIndex: '=',
    },
    template: '<div class="oppia-info-message"></div>',
    controller: ['$scope', 'alertsService', 'toastr', function($scope, alertsService, toastr) {
      $scope.alertsService = alertsService;
      $scope.toastr = toastr;
    }],
    link: function(scope, element, attrs) {
      scope.toastr.success(scope.message, {
        onHidden: function() {
          scope.alertsService.deleteInfoMessage(
            scope.message, scope.messageIndex);
        }
      });
    }
  }
}]);
