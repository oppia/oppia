// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for RteHelperService.
 */

angular.module('oppia').controller('RteHelperModalController', [
  '$scope', '$timeout', '$uibModalInstance', 'AlertsService',
  'AssetsBackendApiService', 'ContextService', 'FocusManagerService',
  'ImageLocalStorageService', 'ImageUploadHelperService',
  'attrsCustomizationArgsDict', 'customizationArgSpecs',
  'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
  function(
      $scope, $timeout, $uibModalInstance, AlertsService,
      AssetsBackendApiService, ContextService, FocusManagerService,
      ImageLocalStorageService, ImageUploadHelperService,
      attrsCustomizationArgsDict, customizationArgSpecs,
      IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
    var extractVideoIdFromVideoUrl = function(videoUrl) {
      videoUrl = videoUrl.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      return ((videoUrl[2] !== undefined) ?
                videoUrl[2].split(/[^0-9a-z_\-]/i)[0] : videoUrl[0]);
    };

    $scope.customizationArgSpecs = customizationArgSpecs;

    // Without this code, the focus will remain in the background RTE
    // even after the modal loads. This switches the focus to a
    // temporary field in the modal which is then removed from the
    // DOM.
    // TODO(sll): Make this switch to the first input field in the
    // modal instead.
    $scope.modalIsLoading = true;
    FocusManagerService.setFocus('tmpFocusPoint');
    $timeout(function() {
      $scope.modalIsLoading = false;
    });
    $scope.isRteMathExpressionEditor = false;
    $scope.tmpCustomizationArgs = [];
    for (var i = 0; i < customizationArgSpecs.length; i++) {
      var caName = customizationArgSpecs[i].name;
      if (caName === 'math_content') {
        $scope.isRteMathExpressionEditor = true;
        var mathValueDict = {
          name: caName,
          value: (
            attrsCustomizationArgsDict.hasOwnProperty(caName) ?
              angular.copy(attrsCustomizationArgsDict[caName]) :
              customizationArgSpecs[i].default_value)
        };
        mathValueDict.value.svgFileDict = {
          svgData: null,
          fileName: ''
        };
        $scope.tmpCustomizationArgs.push(mathValueDict);
      } else {
        $scope.tmpCustomizationArgs.push({
          name: caName,
          value: (
            attrsCustomizationArgsDict.hasOwnProperty(caName) ?
              angular.copy(attrsCustomizationArgsDict[caName]) :
              customizationArgSpecs[i].default_value)
        });
      }
    }

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.save = function() {
      $scope.$broadcast('externalSave');
      var customizationArgsDict = {};

      if ($scope.isRteMathExpressionEditor) {
        var svgFileDict = $scope.tmpCustomizationArgs[0].value.svgFileDict;
        if (
          ContextService.getImageSaveDestination() ===
          IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
          ImageLocalStorageService.saveImage(
            svgFileDict.fileName, svgFileDict.svgData);
          var mathContentDict = {
            raw_latex: $scope.tmpCustomizationArgs[0].value.raw_latex,
            svg_filename: svgFileDict.fileName
          };
          var caName = 'math_content';
          customizationArgsDict[caName] = mathContentDict;
          $uibModalInstance.close(customizationArgsDict);
          $scope.isRteMathExpressionEditor = false;
          return;
        }
        var resampledFile = (
          ImageUploadHelperService.convertImageDataToImageFile(
            svgFileDict.svgData));
        AssetsBackendApiService.saveMathImage(
          resampledFile, svgFileDict.fileName, ContextService.getEntityType(),
          ContextService.getEntityId()).then(function(response) {
          var mathContentDict = {
            raw_latex: $scope.tmpCustomizationArgs[0].value.raw_latex,
            svg_filename: response.filename
          };
          var caName = 'math_content';
          customizationArgsDict[caName] = mathContentDict;
          $uibModalInstance.close(customizationArgsDict);
          $scope.isRteMathExpressionEditor = false;
        }, function(errorResponse) {
          AlertsService.addWarning(
            errorResponse.error || 'Error communicating with server.');
          $uibModalInstance.dismiss('cancel');
          $scope.isRteMathExpressionEditor = false;
        });
      } else {
        for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
          var caName = $scope.tmpCustomizationArgs[i].name;
          if (caName === 'video_id') {
            var temp = $scope.tmpCustomizationArgs[i].value;
            customizationArgsDict[caName] = (
              extractVideoIdFromVideoUrl(temp.toString()));
          } else {
            customizationArgsDict[caName] = (
              $scope.tmpCustomizationArgs[i].value);
          }
        }
        $uibModalInstance.close(customizationArgsDict);
      }
    };
  }
]);
