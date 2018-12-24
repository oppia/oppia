// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive that enables the user to upload audio files.
 */

oppia.directive('audioFileUploader', [
  'UrlInterpolationService', 'IdGenerationService',
  function(UrlInterpolationService, IdGenerationService) {
    return {
      restrict: 'E',
      scope: {
        droppedFile: '=',
        onFileChanged: '=',
        onFileCleared: '=',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/audio_file_uploader_directive.html'),
      link: function(scope, elt) {
        var ALLOWED_AUDIO_FILE_TYPES = ['audio/mp3', 'audio/mpeg'];


        var validateUploadedFile = function(file) {
          if (!file) {
            return 'No audio file was uploaded.';
          }

          if (!file.size || !file.type.match('audio.*')) {
            return 'This file is not recognized as an audio file.';
          }

          if (ALLOWED_AUDIO_FILE_TYPES.indexOf(file.type) === -1) {
            return 'Only the MP3 audio format is currently supported.';
          }

          if (!file.name) {
            return 'Filename must not be empty.';
          }

          if (!file.name.match(/\.mp3$/)) {
            return 'This audio format does not match the filename extension.';
          }

          return null;
        };

        // We generate a random class name to distinguish this input from
        // others in the DOM.
        scope.inputFieldClassName = (
          'audio-file-uploader-input' + IdGenerationService.generateNewId());
        scope.inputFieldFormId = (
          'audio-file-uploader-form' + IdGenerationService.generateNewId());
        angular.element(document).on(
          'change', '.' + scope.inputFieldClassName, function(evt) {
            var file = evt.currentTarget.files[0];
            if (!file) {
              scope.onFileCleared();
              return;
            }

            scope.errorMessage = validateUploadedFile(file);
            if (!scope.errorMessage) {
              // Only fire this event if validations pass.
              scope.onFileChanged(file);
            } else {
              document.getElementById(scope.inputFieldFormId).reset();
              scope.onFileCleared();
            }
            scope.$apply();
          }
        );
        if (scope.droppedFile) {
          if (scope.droppedFile.length === 1) {
            angular.element(document).ready(function() {
              $('.' + scope.inputFieldClassName)[0].files = scope.droppedFile;
            });
          } else {
            scope.errorMessage = 'Please drop one file at a time.';
          }
        }
      }
    };
  }
]);
