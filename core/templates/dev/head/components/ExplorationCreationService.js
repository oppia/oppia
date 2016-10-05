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
 * @fileoverview Functionality for the create exploration button and upload
 * modal.
 */

oppia.factory('ExplorationCreationService', [
  '$http', '$modal', '$timeout', '$rootScope', '$window',
  'alertsService', 'siteAnalyticsService', 'UrlInterpolationService',
  function(
      $http, $modal, $timeout, $rootScope, $window,
      alertsService, siteAnalyticsService, UrlInterpolationService) {
    var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';

    var explorationCreationInProgress = false;

    return {
      createNewExploration: function() {
        if (explorationCreationInProgress) {
          return;
        }

        explorationCreationInProgress = true;
        alertsService.clearWarnings();
        $rootScope.loadingMessage = 'Creating exploration';

        $http.post('/contributehandler/create_new', {
        }).then(function(response) {
          siteAnalyticsService.registerCreateNewExplorationEvent(
            response.data.explorationId);
          $timeout(function() {
            $window.location = UrlInterpolationService.interpolateUrl(
              CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                exploration_id: response.data.explorationId
              }
            );
          }, 150);
          return false;
        }, function() {
          $rootScope.loadingMessage = '';
          explorationCreationInProgress = false;
        });
      },
      showUploadExplorationModal: function() {
        alertsService.clearWarnings();

        $modal.open({
          backdrop: true,
          templateUrl: 'modals/uploadActivity',
          controller: [
            '$scope', '$modalInstance', function($scope, $modalInstance) {
              $scope.save = function() {
                var returnObj = {};
                var file = document.getElementById('newFileInput').files[0];
                if (!file || !file.size) {
                  alertsService.addWarning('Empty file detected.');
                  return;
                }
                returnObj.yamlFile = file;

                $modalInstance.close(returnObj);
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                alertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(result) {
          var yamlFile = result.yamlFile;

          $rootScope.loadingMessage = 'Creating exploration';

          var form = new FormData();
          form.append('yaml_file', yamlFile);
          form.append('payload', JSON.stringify({}));
          form.append('csrf_token', GLOBALS.csrf_token);

          $.ajax({
            contentType: false,
            data: form,
            dataFilter: function(data) {
              // Remove the XSSI prefix.
              return JSON.parse(data.substring(5));
            },
            dataType: 'text',
            processData: false,
            type: 'POST',
            url: 'contributehandler/upload'
          }).done(function(data) {
            $window.location = UrlInterpolationService.interpolateUrl(
              CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                exploration_id: data.explorationId
              }
            );
          }).fail(function(data) {
            var transformedData = data.responseText.substring(5);
            var parsedResponse = JSON.parse(transformedData);
            alertsService.addWarning(
              parsedResponse.error || 'Error communicating with server.');
            $rootScope.loadingMessage = '';
            $scope.$apply();
          });
        });
      }
    };
  }
]);
