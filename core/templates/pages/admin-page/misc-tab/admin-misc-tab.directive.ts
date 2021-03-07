// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
require('domain/admin/admin-backend-api.service');
require('domain/utilities/url-interpolation.service.ts');
require('pages/admin-page/services/admin-data.service.ts');
require('pages/admin-page/services/admin-task-manager.service.ts');

require('constants.ts');
require('pages/admin-page/admin-page.constants.ajs.ts');

angular.module('oppia').directive('adminMiscTab', [
  '$rootScope', '$window', 'AdminBackendApiService',
  'AdminTaskManagerService', 'UrlInterpolationService',
  'ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', 'MAX_USERNAME_LENGTH',
  function(
      $rootScope, $window, AdminBackendApiService,
      AdminTaskManagerService, UrlInterpolationService,
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
        const irreversibleActionMessage = (
          'This action is irreversible. Are you sure?');

        ctrl.MAX_USERNAME_LENGTH = MAX_USERNAME_LENGTH;

        ctrl.clearSearchIndex = function() {
          if (AdminTaskManagerService.isTaskRunning()) {
            return;
          }
          if (!$window.confirm(irreversibleActionMessage)) {
            return;
          }

          ctrl.setStatusMessage('Clearing search index...');

          AdminTaskManagerService.startTask();
          AdminBackendApiService.clearSearchIndexAsync()
            .then(() => {
              ctrl.setStatusMessage('Index successfully cleared.');
              AdminTaskManagerService.finishTask();
              $rootScope.$apply();
            }, errorResponse => {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse);
              AdminTaskManagerService.finishTask();
              $rootScope.$apply();
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
          AdminBackendApiService.regenerateOpportunitiesRelatedToTopicAsync(
            ctrl.topicIdForRegeneratingOpportunities).then(response => {
            ctrl.regenerationMessage = (
              'No. of opportunities model created: ' +
              response);
            $rootScope.$apply();
          }, errorResponse => {
            ctrl.regenerationMessage = (
              'Server error: ' + errorResponse);
            $rootScope.$apply();
          });
        };

        ctrl.uploadTopicSimilaritiesFile = function() {
          var file = (
            <HTMLInputElement>document.getElementById(
              'topicSimilaritiesFile')).files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var data = (<FileReader>e.target).result;
            AdminBackendApiService.uploadTopicSimilaritiesAsync(data)
              .then(() => {
                ctrl.setStatusMessage(
                  'Topic similarities uploaded successfully.');
                $rootScope.$apply();
              }, errorResponse => {
                ctrl.setStatusMessage(
                  'Server error: ' + errorResponse);
                $rootScope.$apply();
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
          AdminBackendApiService.sendDummyMailToAdminAsync()
            .then(() => {
              ctrl.setStatusMessage('Success! Mail sent to admin.');
              $rootScope.$apply();
            }, errorResponse => {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse);
              $rootScope.$apply();
            });
        };

        ctrl.flushMemoryCache = function() {
          AdminBackendApiService.flushMemoryCacheAsync()
            .then(() => {
              ctrl.setStatusMessage('Success! Memory Cache Flushed.');
              $rootScope.$apply();
            }, errorResponse => {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse);
              $rootScope.$apply();
            });
        };

        ctrl.getMemoryCacheProfile = function() {
          AdminBackendApiService.getMemoryCacheProfileAsync()
            .then(response => {
              ctrl.result = {
                totalAllocatedInBytes: response.total_allocation,
                peakAllocatedInBytes: response.peak_allocation,
                totalKeysStored: response.total_keys_stored
              };
              ctrl.memoryCacheDataFetched = true;
              ctrl.setStatusMessage('Success!');
              $rootScope.$apply();
            }, errorResponse => {
              ctrl.setStatusMessage(
                'Server error: ' + errorResponse);
              $rootScope.$apply();
            });
        };

        ctrl.updateUsername = function() {
          ctrl.setStatusMessage('Updating username...');
          AdminBackendApiService.updateUserNameAsync(
            ctrl.oldUsername, ctrl.newUsername)
            .then(
              () => {
                ctrl.setStatusMessage(
                  'Successfully renamed ' + ctrl.oldUsername + ' to ' +
                    ctrl.newUsername + '!');
                $rootScope.$apply();
              }, errorResponse => {
                ctrl.setStatusMessage(
                  'Server error: ' + errorResponse);
                $rootScope.$apply();
              }
            );
        };

        ctrl.getNumberOfPendingDeletionRequestModels = function() {
          ctrl.setStatusMessage(
            'Getting the number of users that are being deleted...');
          AdminBackendApiService.getNumberOfPendingDeletionRequestAsync()
            .then(pendingDeletionRequests => {
              ctrl.setStatusMessage(
                'The number of users that are being deleted is: ' +
              pendingDeletionRequests.number_of_pending_deletion_models);
              $rootScope.$apply();
              }, errorResponse => {
                ctrl.setStatusMessage(
                  'Server error: ' + errorResponse);
                $rootScope.$apply();
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
        };
      }]
    };
  }
]);
