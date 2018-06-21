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
 * @fileoverview Functionality for the create question button and upload
 * modal.
 */

oppia.factory('QuestionCreationService', [
  '$http', '$uibModal', '$timeout', '$rootScope', '$window',
  'AlertsService', 'siteAnalyticsService', 'UrlInterpolationService',
  function(
      $http, $uibModal, $timeout, $rootScope, $window,
      AlertsService, siteAnalyticsService, UrlInterpolationService) {
    var CREATE_NEW_QUESTION_URL_TEMPLATE = '/question_editor/<question_id>';

    var questionCreationInProgress = false;

    return {
      createNewQuestion: function() {
        if (questionCreationInProgress) {
          return;
        }

        questionCreationInProgress = true;
        AlertsService.clearWarnings();
        $rootScope.loadingMessage = 'Creating question';

        $http.post('/questioncreationhandler', {
        }).then(function(response) {
          siteAnalyticsService.registerCreateNewQuestionEvent(
            response.data.questionId);
          $timeout(function() {
            $window.location = UrlInterpolationService.interpolateUrl(
              CREATE_NEW_QUESTION_URL_TEMPLATE, {
                question_id: response.data.questionId
              }
            );
          }, 150);
          return false;
        }, function() {
          $rootScope.loadingMessage = '';
          questionCreationInProgress = false;
        });
      },
      showUploadQuestionModal: function() {
        AlertsService.clearWarnings();

        $uibModal.open({
          backdrop: true,
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/creator_dashboard/' +
            'upload_activity_modal_directive.html'),
          controller: [
            '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.save = function() {
                var returnObj = {};
                var file = document.getElementById('newFileInput').files[0];
                if (!file || !file.size) {
                  AlertsService.addWarning('Empty file detected.');
                  return;
                }
                returnObj.yamlFile = file;

                $uibModalInstance.close(returnObj);
              };

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(result) {
          var yamlFile = result.yamlFile;

          $rootScope.loadingMessage = 'Creating question';

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
              CREATE_NEW_QUESTION_URL_TEMPLATE, {
                question_id: data.questionId
              }
            );
          }).fail(function(data) {
            var transformedData = data.responseText.substring(5);
            var parsedResponse = JSON.parse(transformedData);
            AlertsService.addWarning(
              parsedResponse.error || 'Error communicating with server.');
            $rootScope.loadingMessage = '';
            $scope.$apply();
          });
        });
      }
    };
  }
]);
