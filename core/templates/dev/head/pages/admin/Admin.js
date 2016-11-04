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
 */

oppia.constant('ADMIN_TAB_URLS', {
  ACTIVITIES: '#activities',
  JOBS: '#jobs',
  CONFIG: '#config',
  MISC: '#misc'
});

oppia.controller('Admin', [
  '$scope', '$http', 'UrlInterpolationService', 'ADMIN_TAB_URLS',
  function($scope, $http, UrlInterpolationService, ADMIN_TAB_URLS) {
    var ADMIN_JOB_OUTPUT_URL_PREFIX = '/adminjoboutput';
    var ADMIN_HANDLER_URL = '/adminhandler';
    var ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL = (
      '/admintopicscsvdownloadhandler');

    $scope.message = '';
    $scope.configProperties = {};

    $scope.ADMIN_TAB_URLS = ADMIN_TAB_URLS;
    $scope.currentTab = $scope.ADMIN_TAB_URLS.ACTIVITIES;
    $scope.logoWhiteImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/logo/288x128_logo_white.png');

    $scope.$watch(function() {
      return window.location.hash;
    }, function(newHash) {
      for (var url in $scope.ADMIN_TAB_URLS) {
        if ($scope.ADMIN_TAB_URLS[url] === newHash) {
          $scope.currentTab = newHash;
          break;
        }
      }
    });

    $scope.showTab = function(hash) {
      if (hash !== window.location.hash) {
        $scope.currentTab = hash;
      }
    };

    $scope.showJobOutput = false;
    $scope.getJobOutput = function(jobId) {
      var adminJobOutputUrl = ADMIN_JOB_OUTPUT_URL_PREFIX + '?job_id=' + jobId;
      $http.get(adminJobOutputUrl).then(function(response) {
        $scope.showJobOutput = true;
        $scope.jobOutput = response.data.output;
        window.scrollTo(0, document.body.scrollHeight);
      });
    };

    $scope.profileDropdownIsActive = false;
    $scope.onMouseoverProfilePictureOrDropdown = function(evt) {
      angular.element(evt.currentTarget).parent().addClass('open');
      $scope.profileDropdownIsActive = true;
    };

    $scope.onMouseoutProfilePictureOrDropdown = function(evt) {
      angular.element(evt.currentTarget).parent().removeClass('open');
      $scope.profileDropdownIsActive = false;
    };

    $scope.isNonemptyObject = function(object) {
      var hasAtLeastOneElement = false;
      for (var property in object) {
        hasAtLeastOneElement = true;
      }
      return hasAtLeastOneElement;
    };

    $scope.reloadConfigProperties = function() {
      $http.get(ADMIN_HANDLER_URL).then(function(response) {
        $scope.configProperties = response.data.config_properties;
      });
    };

    $scope.reloadConfigProperties();

    $scope.revertToDefaultConfigPropertyValue = function(configPropertyId) {
      if (!confirm('This action is irreversible. Are you sure?')) {
        return;
      }

      $http.post(ADMIN_HANDLER_URL, {
        action: 'revert_config_property',
        config_property_id: configPropertyId
      }).then(function() {
        $scope.message = 'Config property reverted successfully.';
        $scope.reloadConfigProperties();
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.migrationInProcess = false;
    $scope.migrateFeedback = function() {
      $scope.migrationInProcess = true;

      $http.post(ADMIN_HANDLER_URL, {
        action: 'migrate_feedback'
      }).then(function() {
        $scope.message = 'Feedback migrated successfully.';
        $scope.migrationInProcess = false;
        window.reload();
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
        $scope.migrationInProcess = false;
      });
    };

    $scope.saveConfigProperties = function() {
      if ($scope.message === 'Saving...') {
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

      $http.post(ADMIN_HANDLER_URL, {
        action: 'save_config_properties',
        new_config_property_values: newConfigPropertyValues
      }).then(function() {
        $scope.message = 'Data saved successfully.';
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.clearSearchIndex = function() {
      if ($scope.message.indexOf('Processing...') === 0) {
        return;
      }

      if (!confirm('This action is irreversible. Are you sure?')) {
        return;
      }

      $scope.message = 'Processing...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'clear_search_index'
      }).then(function() {
        $scope.message = 'Index successfully cleared.';
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.reloadExploration = function(explorationId) {
      if ($scope.message.indexOf('Processing...') === 0) {
        return;
      }

      if (!confirm('This action is irreversible. Are you sure?')) {
        return;
      }

      $scope.message = 'Processing...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'reload_exploration',
        exploration_id: String(explorationId)
      }).then(function() {
        $scope.message = 'Data reloaded successfully.';
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.reloadAllExplorations = function() {
      if ($scope.message.indexOf('Processing...') === 0) {
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
          'Reloaded ' + GLOBALS.DEMO_EXPLORATION_IDS.length +
          ' explorations: ' + numSucceeded + ' succeeded, ' + numFailed +
          ' failed.');
      };

      for (var i = 0; i < GLOBALS.DEMO_EXPLORATION_IDS.length; ++i) {
        var explorationId = GLOBALS.DEMO_EXPLORATION_IDS[i];

        $http.post(ADMIN_HANDLER_URL, {
          action: 'reload_exploration',
          exploration_id: explorationId
        }).then(function() {
          ++numSucceeded;
          ++numTried;
          printResult();
        }, function() {
          ++numFailed;
          ++numTried;
          printResult();
        });
      }
    };

    $scope.reloadCollection = function(collectionId) {
      if ($scope.message.indexOf('Processing...') === 0) {
        return;
      }

      if (!confirm('This action is irreversible. Are you sure?')) {
        return;
      }

      $scope.message = 'Processing...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'reload_collection',
        collection_id: String(collectionId)
      }).then(function() {
        $scope.message = 'Data reloaded successfully.';
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.reloadAllCollections = function() {
      if ($scope.message.indexOf('Processing...') === 0) {
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
        if (numTried < GLOBALS.DEMO_COLLECTION_IDS.length) {
          $scope.message = (
            'Processing...' + numTried + '/' +
            GLOBALS.DEMO_COLLECTION_IDS.length);
          return;
        }
        $scope.message = (
          'Reloaded ' + GLOBALS.DEMO_COLLECTION_IDS.length +
          ' collection' + (GLOBALS.DEMO_COLLECTION_IDS.length == 1 ? '' : 's') +
          ': ' + numSucceeded + ' succeeded, ' + numFailed +
          ' failed.');
      };

      for (var i = 0; i < GLOBALS.DEMO_COLLECTION_IDS.length; ++i) {
        var collectionId = GLOBALS.DEMO_COLLECTION_IDS[i];

        $http.post(ADMIN_HANDLER_URL, {
          action: 'reload_collection',
          collection_id: collectionId
        }).then(function() {
          ++numSucceeded;
          ++numTried;
          printResult();
        }, function() {
          ++numFailed;
          ++numTried;
          printResult();
        });
      }
    };

    $scope.startNewJob = function(jobType) {
      $scope.message = 'Starting new job...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'start_new_job',
        job_type: jobType
      }).then(function() {
        $scope.message = 'Job started successfully.';
        window.location.reload();
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.cancelJob = function(jobId, jobType) {
      $scope.message = 'Cancelling job...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'cancel_job',
        job_id: jobId,
        job_type: jobType
      }).then(function() {
        $scope.message = 'Abort signal sent to job.';
        window.location.reload();
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.startComputation = function(computationType) {
      $scope.message = 'Starting computation...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'start_computation',
        computation_type: computationType
      }).then(function() {
        $scope.message = 'Computation started successfully.';
        window.location.reload();
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.stopComputation = function(computationType) {
      $scope.message = 'Stopping computation...';

      $http.post(ADMIN_HANDLER_URL, {
        action: 'stop_computation',
        computation_type: computationType
      }).then(function() {
        $scope.message = 'Abort signal sent to computation.';
        window.location.reload();
      }, function(errorResponse) {
        $scope.message = 'Server error: ' + errorResponse.data.error;
      });
    };

    $scope.uploadTopicSimilaritiesFile = function() {
      var file = document.getElementById('topicSimilaritiesFile').files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        var data = e.target.result;
        $http.post(ADMIN_HANDLER_URL, {
          action: 'upload_topic_similarities',
          data: data
        }).then(function() {
          $scope.message = 'Topic similarities uploaded successfully.';
        }, function(errorResponse) {
          $scope.message = 'Server error: ' + errorResponse.data.error;
        });
      };
      reader.readAsText(file);
    };

    $scope.downloadTopicSimilaritiesFile = function() {
      window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
    };
  }
]);
