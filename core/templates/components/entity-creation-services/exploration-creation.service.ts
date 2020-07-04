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

require(
  'pages/creator-dashboard-page/modal-templates/' +
  'upload-activity-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/alerts.service.ts');
require('services/csrf-token.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').factory('ExplorationCreationService', [
  '$http', '$rootScope', '$timeout', '$uibModal', '$window',
  'AlertsService', 'CsrfTokenService', 'LoaderService',
  'SiteAnalyticsService', 'UrlInterpolationService',
  function(
      $http, $rootScope, $timeout, $uibModal, $window,
      AlertsService, CsrfTokenService, LoaderService,
      SiteAnalyticsService, UrlInterpolationService) {
    var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';

    var explorationCreationInProgress = false;

    return {
      createNewExploration: function() {
        if (explorationCreationInProgress) {
          return;
        }

        explorationCreationInProgress = true;
        AlertsService.clearWarnings();
        LoaderService.showLoadingScreen('Creating exploration');

        $http.post('/contributehandler/create_new', {
        }).then(function(response) {
          SiteAnalyticsService.registerCreateNewExplorationEvent(
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
          LoaderService.hideLoadingScreen();
          explorationCreationInProgress = false;
        });
      },
      showUploadExplorationModal: function() {
        AlertsService.clearWarnings();

        $uibModal.open({
          backdrop: true,
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/creator-dashboard-page/modal-templates/' +
            'upload-activity-modal.directive.html'),
          controller: 'UploadActivityModalController'
        }).result.then(function(result) {
          var yamlFile = result.yamlFile;

          LoaderService.showLoadingScreen('Creating exploration');

          var form = new FormData();
          form.append('yaml_file', yamlFile);
          form.append('payload', JSON.stringify({}));
          CsrfTokenService.getTokenAsync().then(function(token) {
            form.append('csrf_token', token);
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
              AlertsService.addWarning(
                parsedResponse.error || 'Error communicating with server.');
              LoaderService.hideLoadingScreen();
              $rootScope.$apply();
            });
          });
        }, function() {
          AlertsService.clearWarnings();
          // Note to developers:
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      }
    };
  }
]);
