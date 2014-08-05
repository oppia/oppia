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
 * @fileoverview Data and controllers for the Oppia admin page.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('Admin', ['$scope', '$http', function($scope, $http) {
  $scope.message = '';
  $scope.adminHandlerUrl = '/adminhandler';
  $scope.configProperties = {};

  $scope.isNonemptyObject = function(object) {
    var hasAtLeastOneElement = false;
    for (var property in object) {
      hasAtLeastOneElement = true;
    }
    return hasAtLeastOneElement;
  };

  $scope.reloadConfigProperties = function() {
    $http.get($scope.adminHandlerUrl).success(function(data) {
      $scope.configProperties = data.config_properties;
      $scope.computedProperties = data.computed_properties;
    });
  };

  $scope.reloadConfigProperties();

  $scope.revertToDefaultConfigPropertyValue = function(configPropertyId) {
    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'revert_config_property',
        config_property_id: configPropertyId
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Config property reverted successfully.';
      $scope.reloadConfigProperties();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.migrationInProcess = false;
  $scope.migrateFeedback = function() {
    $scope.migrationInProcess = true;

    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'migrate_feedback'
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Feedback migrated successfully.';
      $scope.migrationInProcess = false;
      window.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
      $scope.migrationInProcess = false;
    });
  };

  $scope.refreshComputedProperty = function(computedPropertyId) {
    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'refresh_computed_property',
        computed_property_name: computedPropertyId
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Computed property reloaded successfully.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.saveConfigProperties = function() {
    if ($scope.message == 'Saving...') {
      return;
    }

    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    $scope.message = 'Saving...';

    var newConfigPropertyValues = {};
    for (var property in $scope.configProperties) {
      newConfigPropertyValues[property] = $scope.configProperties[property].value;
    }

    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'save_config_properties',
        new_config_property_values: newConfigPropertyValues
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Data saved successfully.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.reloadExploration = function(explorationId) {
    if ($scope.message == 'Processing...') {
      return;
    }

    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    $scope.message = 'Processing...';
    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'reload_exploration',
        exploration_id: String(explorationId)
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Data reloaded successfully.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.startNewJob = function(jobType) {
    $scope.message = 'Starting new job...';
    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'start_new_job',
        job_type: jobType
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Job started successfully.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.cancelJob = function(jobId, jobType) {
    $scope.message = 'Cancelling job...';
    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'cancel_job',
        job_id: jobId,
        job_type: jobType
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Abort signal sent to job.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.startComputation = function(computationType) {
    $scope.message = 'Starting computation...';
    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'start_computation',
        computation_type: computationType
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Computation started successfully.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.stopComputation = function(computationType) {
    $scope.message = 'Stopping computation...';
    var requestParams = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'stop_computation',
        computation_type: computationType
      })
    }, true);

    $http.post($scope.adminHandlerUrl, requestParams).success(function(data) {
      $scope.message = 'Abort signal sent to computation.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };
}]);
