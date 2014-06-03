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

function Admin($scope, $http) {
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

    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'revert_config_property',
        config_property_id: configPropertyId
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
      $scope.message = 'Config property reverted successfully.';
      $scope.reloadConfigProperties();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.migrateFeedback = function() {
    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'migrate_feedback'
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
      $scope.message = 'Feedback migrated successfully.';
      window.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.refreshComputedProperty = function(computedPropertyId) {
    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'refresh_computed_property',
        computed_property_name: computedPropertyId
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
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

    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'save_config_properties',
        new_config_property_values: newConfigPropertyValues
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
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
    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'reload_exploration',
        exploration_id: String(explorationId)
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
        $scope.message = 'Data reloaded successfully.';
      }).error(function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.error;
      });
  };

  $scope.startNewJob = function(jobType) {
    $scope.message = 'Starting new job...';
    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'start_new_job',
        job_type: jobType
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
        $scope.message = 'Data reloaded successfully.';
        window.location.reload();
      }).error(function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.error;
      });
  };

  $scope.cancelJob = function(jobId, jobType) {
    $scope.message = 'Cancelling job...';
    var request = $.param({
      csrf_token: GLOBALS.csrf_token,
      payload: JSON.stringify({
        action: 'cancel_job',
        job_id: jobId,
        job_type: jobType
      })
    }, true);

    $http.post(
      $scope.adminHandlerUrl,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
    success(function(data) {
        $scope.message = 'Data reloaded successfully.';
        window.location.reload();
      }).error(function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.error;
      });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Admin.$inject = ['$scope', '$http'];
