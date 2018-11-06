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

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

oppia.directive('audioUrlEditor', [
  'UrlInterpolationService', 'AssetsBackendApiService', 'AlertsService',
  'ContextService', '$timeout',
  function(UrlInterpolationService, AssetsBackendApiService, AlertsService,
      ContextService, $timeout) {
    return {
      restrict: 'E',
      scope: {
        getAlwaysEditable: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/audio_file_editor_directive.html'),
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = $scope.getAlwaysEditable();
        var OUTPUT_AUDIO_FORMAT = '.mp3';
        var FILE_ELEMENT = 'audio_file';
        var URL_ELEMENT = 'audio_url';

        var generateAudioFilename = function() {
          var date = new Date();
          return 'audio_' +
            date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            '_' +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2) +
            '_' +
            Math.random().toString(36).substr(2, 10) +
            OUTPUT_AUDIO_FORMAT;
        };
        var validateData = function() {
          audioFile = fileElement.files[0];
          audioUrl = urlElement.value;
          return (audioFile || audioUrl);
        };

        var downloadAndSaveAudio = function() {
          $scope.warningText = '';
          if (validateData()) {
            $scope.data.showProgress = true;
            var filename = generateAudioFilename();
            var data = {};
            if (audioFile) {
              data.audioFile = audioFile;
            } else {
              data.audioUrl = audioUrl;
            }
            AssetsBackendApiService.downloadAndSaveAudio(
              ContextService.getExplorationId(),
              filename, data
            ).then(function() {
              var downloadUrl = AssetsBackendApiService.getAudioDownloadUrl(
                ContextService.getExplorationId(), filename);
              $scope.data.showProgress = false;
              $scope.data.downloadUrl = downloadUrl;
              $scope.value = downloadUrl;
              $timeout(function() {
                $scope.$apply();
              }, 0, false);
            }, function(errorResponse) {
              $scope.warningText = errorResponse.error;
              $scope.data.downloadUrl = null;
              $scope.data.showProgress = false;
              $timeout(function() {
                $scope.$apply();
              }, 0, false);
            });
          }
        };

        $scope.uploadAudioFromUrl = function() {
          audioFile = null;
          downloadAndSaveAudio();
        };
        $scope.validate = function(data) {
          // return !data.showProgress && data.downloadUrl;
          return true;
        };
        $scope.openExplorer = function() {
          $timeout(function() {
            fileElement.click();
          }, 0, false);
        };

        var showProgress = false;
        var fileElement = document.getElementById(FILE_ELEMENT);
        var urlElement = document.getElementById(URL_ELEMENT);
        var audioFile = null;
        var audioUrl = null;
        $scope.data = { showProgress: false, downloadUrl: null };


        angular.element(fileElement).on('change', function(evt) {
          downloadAndSaveAudio();
        });
      }]
    };
  }
]);
