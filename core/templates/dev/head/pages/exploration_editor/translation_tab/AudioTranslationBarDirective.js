// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state translation.
 */

oppia.directive('audioTranslationBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        contentId: '='
      },
      link: function(scope, elm) {
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'audio_translation_bar_directive.html'),
      controller: [
        '$scope', '$filter', '$timeout', 'stateContentIdsToAudioTranslationsService', 
        'AssetsBackendApiService', 'recorderService', 'AudioTranslationService',
        function(
            $scope, $filter, $timeout, stateContentIdsToAudioTranslationsService, 
            AssetsBackendApiService, recorderService, AudioTranslationService) {
          $scope.RECORDER_ID = 'recorderId';
          $scope.recordingTimeLimit = 1000;
          $scope.audioBlob = null;
          $scope.recorderController = recorderService.controller($scope.RECORDER_ID);
          
          $scope.isAudioAvailable = false;
          $scope.canDeleteAudio = false;
          $scope.canMarkAudioNeedsUpdate = false;
          $scope.isLoadingAudio = false;
        
          $scope.filename = 'abc';
          
          $scope.$watch('contentId', function(newV) {console.log(newV, "ewewe")});
          $scope.loadAudio = function(filename) {
            AudioTranslationService.load(filename)
              .then( function(audioBlob) {
                $scope.isLoadingAudio = false;
                console.log(audioBlob, "backfromherte");

                console.log($scope.audioBlob)
                $scope.recorderController = recorderService.controller($scope.RECORDER_ID);
                $scope.recorderController.status.isRecording = true;
                $scope.recorderController.stopRecord();
              } 
            );
          };
          
          $scope.showRecordingAnalizer = function() { 
            return $scope.recorderController.isHtml5 && 
              $scope.recorderController.isRecording;
          };
          
          $scope.showAudioWave = function() {
          
          };
          
          $scope.play = function() {
            console.log("asdsadsajsadjsasasadsadsadsadsadsadjasd");
          };
      }
    ]
  };
}]);
