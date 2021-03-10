// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the miscellaneous tab in the admin panel.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('constants.ts');
require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminMiscTab', [
  '$http', '$sce', '$window',
  'AdminTaskManagerService', 'UrlInterpolationService', 'ADMIN_HANDLER_URL',
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', 'MAX_USERNAME_LENGTH',
  function(
      $http, $sce, $window,
      AdminTaskManagerService, UrlInterpolationService, ADMIN_HANDLER_URL,
      ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL, MAX_USERNAME_LENGTH) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        setStatusMessage: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/admin-page/misc-tab/admin-misc-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        const ctrl = this;
        const DATA_EXTRACTION_QUERY_HANDLER_URL = (
          '/explorationdataextractionhandler');
        const SEND_DUMMY_MAIL_HANDLER_URL = (
          '/senddummymailtoadminhandler');
        const MEMORY_CACHE_HANDLER_URL = '/memorycacheadminhandler';
        const UPDATE_USERNAME_HANDLER_URL = '/updateusernamehandler';
        const NUMBER_OF_DELETION_REQUEST_HANDLER_URL = (
          '/numberofdeletionrequestshandler');
        const VERIFY_USER_MODELS_DELETED_HANDLER_URL = (
          '/verifyusermodelsdeletedhandler');
        const DELETE_USER_HANDLER_URL = '/deleteuserhandler';
        const irreversibleActionMessage = (
          'This action is irreversible. Are you sure?');
        const explorationStatsRegenerationUtilityCsvRows = [
          [
            'Exploration ID',
            'No. of valid Exploration Stats',
            'No. of valid State Stats',
            'Missing Exploration Stats',
            'Missing State Stats',
            'Errors'
          ]
        ];

        ctrl.MAX_USERNAME_LENGTH = MAX_USERNAME_LENGTH;

        ctrl.resetExplorationStatsRegenerationUtilityCsvRows = function() {
          explorationStatsRegenerationUtilityCsvRows.length = 1;
        };

        ctrl.clearSearchIndex = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }

          ctrl.setStatusMessage('Clearing search index...');

          AdminTaskManagerService.startTask();
          $http.post(ADMIN_HANDLER_URL, {
            action: 'clear_search_index'
          }).then(function() {
            ctrl.setStatusMessage('Index successfully cleared.');
            AdminTaskManagerService.finishTask();
          }, function(errorResponse) {
            ctrl.setStatusMessage(
              'Server error: ' + errorResponse.data.error);
            AdminTaskManagerService.finishTask();
          });
        };

        ctrl.regenerateOpportunitiesRelatedToTopic = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }
          ctrl.regenerationMessage = 'Regenerating opportunities...';
          $http.post(ADMIN_HANDLER_URL, {
            action: 'regenerate_topic_related_opportunities',
            topic_id: ctrl.topicIdForRegeneratingOpportunities
          }).then(function(response) {
            ctrl.regenerationMessage = (
              'No. of opportunities model created: ' +
              response.data.opportunities_count);
          }, function(errorResponse) {
            ctrl.regenerationMessage = (
              'Server error: ' + errorResponse.data.error);
          });
        };

        const populateExplorationStatsRegenerationCsvResult = function(expIds) {
          if (expIds.length === 0) {
            let csvContent = explorationStatsRegenerationUtilityCsvRows.map(
              row => row.join(',')).join('\n');
            ctrl.csvUri = $sce.trustAsResourceUrl(
              window.URL.createObjectURL(
                new Blob([csvContent], { type: 'text/csv' })));
            ctrl.csvFilename = (
              `missing-exp-stats-output-${(new Date()).getTime()}.csv`);
            ctrl.missingExplorationStatsRegenerationMessage = (
              'Process complete. Please download the CSV output.');
            return;
          }
          let expIdToRegenerate = expIds.pop();
          ctrl.missingExplorationStatsRegenerationMessage = (
            `Regenerating stats for Exploration id ${expIdToRegenerate}` +
            '. Please wait.');
          $http.post(ADMIN_HANDLER_URL, {
            action: 'regenerate_missing_exploration_stats',
            exp_id: expIdToRegenerate
          }).then(function(response) {
            explorationStatsRegenerationUtilityCsvRows.push([
              expIdToRegenerate,
              response.data.num_valid_exp_stats,
              response.data.num_valid_state_stats,
              `"${response.data.missing_exp_stats.join(', ') || 'NA'}"`,
              `"${response.data.missing_state_stats.join(', ') || 'NA'}"`,
              'NA'
            ]);
            populateExplorationStatsRegenerationCsvResult(expIds);
          }, function(errorResponse) {
            explorationStatsRegenerationUtilityCsvRows.push([
              expIdToRegenerate,
              'NA',
              'NA',
              'NA',
              'NA',
              errorResponse.data.error]);
            populateExplorationStatsRegenerationCsvResult(expIds);
          });
        };

        ctrl.regenerateMissingExplorationStats = function() {
          ctrl.csvUri = null;
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }
          let expIds = (
            ctrl.explorationIdsForRegeneratingMissingStats.replaceAll(
              ' ', '').split(','));
          populateExplorationStatsRegenerationCsvResult(expIds);
        };

        ctrl.uploadTopicSimilaritiesFile = function() {
          var file = (
            <HTMLInputElement>document.getElementById(
              'topicSimilaritiesFile')).files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var data = (<FileReader>e.target).result;
            $http.post(ADMIN_HANDLER_URL, {
              action: 'upload_topic_similarities',
              data: data
            }).then(function() {
              ctrl.setStatusMessage(
                'Topic similarities uploaded successfully.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
          };
          reader.readAsText(file);
        };

        ctrl.downloadTopicSimilaritiesFile = function() {
          $window.location.href = ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL;
        };

        var setDataExtractionQueryStatusMessage = function(message) {
          ctrl.showDataExtractionQueryStatus = true;
          ctrl.dataExtractionQueryStatusMessage = message;
        };

        ctrl.sendDummyMailToAdmin = function() {
          $http.post(SEND_DUMMY_MAIL_HANDLER_URL)
            .then(function(response) {
              ctrl.setStatusMessage('Success! Mail sent to admin.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.flushMemoryCache = function() {
          $http.post(MEMORY_CACHE_HANDLER_URL)
            .then(function(response) {
              ctrl.setStatusMessage('Success! Memory Cache Flushed.');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.getMemoryCacheProfile = function() {
          $http.get(MEMORY_CACHE_HANDLER_URL)
            .then(function(response) {
              ctrl.result = {
                totalAllocatedInBytes: response.data.total_allocation,
                peakAllocatedInBytes: response.data.peak_allocation,
                totalKeysStored: response.data.total_keys_stored
              };
              ctrl.memoryCacheDataFetched = true;
              ctrl.setStatusMessage('Success!');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            });
        };

        ctrl.updateUsername = function() {
          ctrl.setStatusMessage('Updating username...');
          $http.put(
            UPDATE_USERNAME_HANDLER_URL, {
              old_username: ctrl.oldUsername,
              new_username: ctrl.newUsername
            }).then(
            function(response) {
              ctrl.setStatusMessage(
                'Successfully renamed ' + ctrl.oldUsername + ' to ' +
                  ctrl.newUsername + '!');
            }, function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            }
          );
        };

        ctrl.getNumberOfPendingDeletionRequestModels = function() {
          ctrl.setStatusMessage(
            'Getting the number of users that are being deleted...');
          $http.get(NUMBER_OF_DELETION_REQUEST_HANDLER_URL).then(
            function(response) {
              ctrl.setStatusMessage(
                'The number of users that are being deleted is: ' +
                response.data.number_of_pending_deletion_models);
            },
            function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            }
          );
        };

        ctrl.getModelsRelatedToUser = function() {
          ctrl.setStatusMessage('Getting the models related to user...');
          $http.get(VERIFY_USER_MODELS_DELETED_HANDLER_URL, {
            params: { user_id: ctrl.userIdToGet }
          }).then(
            function(response) {
              if (response.data.related_models_exist) {
                ctrl.setStatusMessage(
                  'Some related models exist, see logs ' +
                  'to find out the exact models'
                );
              } else {
                ctrl.setStatusMessage('No related models exist');
              }
            },
            function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            }
          );
        };

        ctrl.deleteUser = function() {
          ctrl.setStatusMessage('Starting the deletion of the user...');
          $http['delete'](DELETE_USER_HANDLER_URL, {
            params: {
              user_id: ctrl.userIdToDelete,
              username: ctrl.usernameToDelete
            }
          }).then(
            function() {
              ctrl.setStatusMessage('The deletion process was started.');
            },
            function(errorResponse) {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse.data.error);
            }
          );
        };

        ctrl.submitQuery = function() {
          var STATUS_PENDING = (
            'Data extraction query has been submitted. Please wait.');

          setDataExtractionQueryStatusMessage(STATUS_PENDING);

          var downloadUrl = DATA_EXTRACTION_QUERY_HANDLER_URL + '?';

          downloadUrl += 'exp_id=' + encodeURIComponent(ctrl.expId);
          downloadUrl += '&exp_version=' + encodeURIComponent(
            ctrl.expVersion);
          downloadUrl += '&state_name=' + encodeURIComponent(
            ctrl.stateName);
          downloadUrl += '&num_answers=' + encodeURIComponent(
            ctrl.numAnswers);

          $window.open(downloadUrl);
        };

        ctrl.resetForm = function() {
          ctrl.expId = '';
          ctrl.expVersion = 0;
          ctrl.stateName = '';
          ctrl.numAnswers = 0;
          ctrl.showDataExtractionQueryStatus = false;
        };
        ctrl.$onInit = function() {
          ctrl.topicIdForRegeneratingOpportunities = null;
          ctrl.regenerationMessage = null;
          ctrl.oldUsername = null;
          ctrl.newUsername = null;
          ctrl.explorationIdForRegeneratingMissingStats = null;
          ctrl.missingExplorationStatsRegenerationMessage = null;
        };
      }]
    };
  }
]);
