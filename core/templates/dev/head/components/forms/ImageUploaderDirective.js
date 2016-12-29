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
 * @fileoverview Directive for uploading images.
 */

oppia.directive('imageUploader', [
  'IdGenerationService', function(IdGenerationService) {
    return {
      restrict: 'E',
      scope: {
        height: '@',
        onFileChanged: '=',
        width: '@'
      },
      templateUrl: 'components/imageUploader',
      link: function(scope, elt) {
        var onDragEnd = function(e) {
          e.preventDefault();
          $(elt).removeClass('image-uploader-is-active');
        };

        $(elt).bind('drop', function(e) {
          onDragEnd(e);
          scope.onFileChanged(
            e.originalEvent.dataTransfer.files[0],
            e.originalEvent.dataTransfer.files[0].name);
        });

        $(elt).bind('dragover', function(e) {
          e.preventDefault();
          $(elt).addClass('image-uploader-is-active');
        });

        $(elt).bind('dragleave', onDragEnd);

        // We generate a random class name to distinguish this input from
        // others in the DOM.
        scope.fileInputClassName = (
          'image-uploader-file-input' + IdGenerationService.generateNewId());
        angular.element(document).on(
            'change', '.' + scope.fileInputClassName, function(evt) {
          scope.onFileChanged(
            evt.currentTarget.files[0],
            evt.target.value.split(/(\\|\/)/g).pop());
        });
      }
    };
  }
]);
