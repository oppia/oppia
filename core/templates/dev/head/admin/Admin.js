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
  var ADMIN_JOB_OUTPUT_URL_PREFIX = '/adminjoboutput';
  $scope.adminTopicsCsvDownloadHandlerUrl = '/admintopicscsvdownloadhandler';
  $scope.configProperties = {};

  $scope.showJobOutput = false;
  $scope.getJobOutput = function(jobId) {
    var adminJobOutputUrl = ADMIN_JOB_OUTPUT_URL_PREFIX + '?job_id=' + jobId;
    $http.get(adminJobOutputUrl).success(function(data) {
      $scope.showJobOutput = true;
      $scope.jobOutput = data.output;
    });
  };

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

    $http.post($scope.adminHandlerUrl, {
      action: 'revert_config_property',
      config_property_id: configPropertyId
    }).success(function() {
      $scope.message = 'Config property reverted successfully.';
      $scope.reloadConfigProperties();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.migrationInProcess = false;
  $scope.migrateFeedback = function() {
    $scope.migrationInProcess = true;

    $http.post($scope.adminHandlerUrl, {
      action: 'migrate_feedback'
    }).success(function() {
      $scope.message = 'Feedback migrated successfully.';
      $scope.migrationInProcess = false;
      window.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
      $scope.migrationInProcess = false;
    });
  };

  $scope.refreshComputedProperty = function(computedPropertyId) {
    $http.post($scope.adminHandlerUrl, {
      action: 'refresh_computed_property',
      computed_property_name: computedPropertyId
    }).success(function() {
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
      newConfigPropertyValues[property] = (
        $scope.configProperties[property].value);
    }

    $http.post($scope.adminHandlerUrl, {
      action: 'save_config_properties',
      new_config_property_values: newConfigPropertyValues
    }).success(function() {
      $scope.message = 'Data saved successfully.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.clearSearchIndex = function() {
    if ($scope.message.startsWith('Processing...')) {
      return;
    }

    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    $scope.message = 'Processing...';

    $http.post($scope.adminHandlerUrl, {
      action: 'clear_search_index'
    }).success(function() {
      $scope.message = 'Index successfully cleared.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.reloadExploration = function(explorationId) {
    if ($scope.message.startsWith('Processing...')) {
      return;
    }

    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    $scope.message = 'Processing...';

    $http.post($scope.adminHandlerUrl, {
      action: 'reload_exploration',
      exploration_id: String(explorationId)
    }).success(function() {
      $scope.message = 'Data reloaded successfully.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.reloadAllExplorations = function() {
    if ($scope.message.startsWith('Processing...')) {
      return;
    }

    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    var numSucceeded = 0;
    var numFailed = 0;
    var numTried = 0;
    $scope.message = 'Processing...';
    var printResult = function() {
      if (numTried < GLOBALS.DEMO_EXPLORATION_IDS.length) {
        $scope.message = (
          'Processing...' + numTried + '/' +
          GLOBALS.DEMO_EXPLORATION_IDS.length);
        return;
      }
      $scope.message = (
        'Reloaded ' + GLOBALS.DEMO_EXPLORATION_IDS.length + ' explorations: ' +
        numSucceeded + ' succeeded, ' + numFailed + ' failed.');
    };

    for (var i = 0; i < GLOBALS.DEMO_EXPLORATION_IDS.length; ++i) {
      var explorationId = GLOBALS.DEMO_EXPLORATION_IDS[i];

      $http.post($scope.adminHandlerUrl, {
        action: 'reload_exploration',
        exploration_id: explorationId
      }).success(function() {
        ++numSucceeded;
        ++numTried;
        printResult();
      }).error(function() {
        ++numFailed;
        ++numTried;
        printResult();
      });
    }
  };

  $scope.reloadCollection = function(collectionId) {
    if ($scope.message.startsWith('Processing...')) {
      return;
    }

    if (!confirm('This action is irreversible. Are you sure?')) {
      return;
    }

    $scope.message = 'Processing...';

    $http.post($scope.adminHandlerUrl, {
      action: 'reload_collection',
      collection_id: String(collectionId)
    }).success(function() {
      $scope.message = 'Data reloaded successfully.';
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.startNewJob = function(jobType) {
    $scope.message = 'Starting new job...';

    $http.post($scope.adminHandlerUrl, {
      action: 'start_new_job',
      job_type: jobType
    }).success(function() {
      $scope.message = 'Job started successfully.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.cancelJob = function(jobId, jobType) {
    $scope.message = 'Cancelling job...';

    $http.post($scope.adminHandlerUrl, {
      action: 'cancel_job',
      job_id: jobId,
      job_type: jobType
    }).success(function() {
      $scope.message = 'Abort signal sent to job.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.startComputation = function(computationType) {
    $scope.message = 'Starting computation...';

    $http.post($scope.adminHandlerUrl, {
      action: 'start_computation',
      computation_type: computationType
    }).success(function() {
      $scope.message = 'Computation started successfully.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.stopComputation = function(computationType) {
    $scope.message = 'Stopping computation...';

    $http.post($scope.adminHandlerUrl, {
      action: 'stop_computation',
      computation_type: computationType
    }).success(function() {
      $scope.message = 'Abort signal sent to computation.';
      window.location.reload();
    }).error(function(errorResponse) {
      $scope.message = 'Server error: ' + errorResponse.error;
    });
  };

  $scope.uploadTopicSimilaritiesFile = function() {
    var file = document.getElementById('topicSimilaritiesFile').files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var data = e.target.result;
      $http.post($scope.adminHandlerUrl, {
        action: 'upload_topic_similarities',
        data: data
      }).success(function() {
        $scope.message = 'Topic similarities uploaded successfully.';
      }).error(function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.error;
      });
    };
    reader.readAsText(file);
  };

  $scope.downloadTopicSimilaritiesFile = function() {
    window.location.href = $scope.adminTopicsCsvDownloadHandlerUrl;
  };
}]);
