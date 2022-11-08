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

require('services/external-rte-save.service.ts');

angular.module('oppia').controller('RteHelperModalController', [
  '$q', '$scope', '$timeout', '$uibModalInstance', 'AlertsService',
  'AssetsBackendApiService', 'ContextService',
  'ExternalRteSaveService', 'FocusManagerService',
  'ImageLocalStorageService', 'ImageUploadHelperService',
  'attrsCustomizationArgsDict', 'customizationArgSpecs',
  'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE', 'ENTITY_TYPE',
  function(
      $q, $scope, $timeout, $uibModalInstance, AlertsService,
      AssetsBackendApiService, ContextService,
      ExternalRteSaveService, FocusManagerService,
      ImageLocalStorageService, ImageUploadHelperService,
      attrsCustomizationArgsDict, customizationArgSpecs,
      IMAGE_SAVE_DESTINATION_LOCAL_STORAGE, ENTITY_TYPE) {
    var extractVideoIdFromVideoUrl = function(videoUrl) {
      videoUrl = videoUrl.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      return (
        (videoUrl[2] !== undefined) ?
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

    $scope.currentRteIsMathExpressionEditor = false;
    $scope.currentRteIsLinkEditor = false;
    $scope.tmpCustomizationArgs = [];
    for (var i = 0; i < customizationArgSpecs.length; i++) {
      var caName = customizationArgSpecs[i].name;
      if (caName === 'math_content') {
        $scope.currentRteIsMathExpressionEditor = true;
        var mathValueDict = {
          name: caName,
          value: (
            attrsCustomizationArgsDict.hasOwnProperty(caName) ?
              angular.copy(attrsCustomizationArgsDict[caName]) :
              customizationArgSpecs[i].default_value)
        };
        // If the component being created or edited is math rich text component,
        // we need to pass this extra attribute svgFile to the math RTE editor.
        // The math RTE editor will auto-generate the svgFile based on the
        // rawLatex value and then this file can be saved to the backend when
        // the user clicks on the save button.
        mathValueDict.value.svgFile = null;
        mathValueDict.value.mathExpressionSvgIsBeingProcessed = false;
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
    // Infer that the RTE component is a Link if it contains the `url` and
    // `text` customization arg names.
    const customizationArgNames = customizationArgSpecs.map(x => x.name);
    if (customizationArgNames.includes('url') &&
        customizationArgNames.includes('text')) {
      $scope.currentRteIsLinkEditor = true;
    }

    // The 'defaultRTEComponent' variable controls whether the delete button
    // needs to be shown. If the RTE component has default values, there is no
    // need for a delete button as the 'Cancel' button would have
    // the same functionality.
    $scope.defaultRTEComponent = true;
    for (let i = 0; i < customizationArgSpecs.length; i++) {
      let caName = customizationArgSpecs[i].name;
      let attrsCaDict = attrsCustomizationArgsDict;
      if (
        attrsCaDict.hasOwnProperty(caName) &&
        attrsCaDict[caName] !== customizationArgSpecs[i].default_value
      ) {
        $scope.defaultRTEComponent = false;
      }
    }

    $scope.cancel = function() {
      for (let i = 0; i < customizationArgSpecs.length; i++) {
        let caName = customizationArgSpecs[i].name;
        let attrsCaDict = attrsCustomizationArgsDict;
        // If the RTE component contains only default ca values, we remove it
        // from the editor on clicking cancel. When the
        // uibModalInstance.dismiss method is called with true, the tag from
        // the editor is removed and when called with false, the tag remains
        // as-is.
        if (
          attrsCaDict.hasOwnProperty(caName) &&
          attrsCaDict[caName] !== customizationArgSpecs[i].default_value
        ) {
          $uibModalInstance.dismiss(false);
          return;
        }
      }
      $uibModalInstance.dismiss(true);
    };

    $scope.delete = function() {
      $uibModalInstance.dismiss(true);
    };

    $scope.disableSaveButtonForMathRte = function() {
      // This method disables the save button when the Math SVG has not yet
      // been generated but being processed.
      if (!$scope.currentRteIsMathExpressionEditor) {
        return false;
      } else {
        const { value } = $scope.tmpCustomizationArgs[0];
        return (
          value.mathExpressionSvgIsBeingProcessed || value.raw_latex === ''
        );
      }
    };

    $scope.disableSaveButtonForLinkRte = function() {
      // This method disables the save button when the `text` field for the
      // Link RTE looks like a URL but it does not match the `url`. Otherwise,
      // creators can make the `url` a malicious website and make the `text`
      // a safe website.
      if (!$scope.currentRteIsLinkEditor) {
        return false;
      }

      let url = $scope.tmpCustomizationArgs[0].value;
      let text = $scope.tmpCustomizationArgs[1].value;

      // First check if the `text` looks like a URL.
      const suffixes = ['.com', '.org', '.edu', '.gov'];
      let textLooksLikeUrl = false;
      for (const suffix of suffixes) {
        if (text.endsWith(suffix)) {
          textLooksLikeUrl = true;
        }
      }
      if (!textLooksLikeUrl) {
        return false;
      }
      // If the text looks like a URL, strip the leading 'http://' or
      // 'https://' or 'www.'.
      const prefixes = ['https://', 'http://', 'www.'];
      for (const prefix of prefixes) {
        if (url.startsWith(prefix)) {
          url = url.substring(prefix.length);
        }
        if (text.startsWith(prefix)) {
          text = text.substring(prefix.length);
        }
      }
      // After the cleanup, if the strings are not equal, then we do not
      // allow the lesson creator to save it.
      return url !== text;
    };

    $scope.save = function() {
      ExternalRteSaveService.onExternalRteSave.emit();

      var customizationArgsDict = {};
      // For the case of the math rich text components, we need to handle the
      // saving of the generated SVG file here because the process of saving
      // the SVG is asynchronous and the saving of SVG to the backend is to
      // be done only after the user clicks on the save button.
      // The saving of SVGs to the backend cannot be done in the math RTE editor
      // because the control is passed to this function as soon as the user
      // clicks on the save button.
      if ($scope.currentRteIsMathExpressionEditor) {
        // The tmpCustomizationArgs is guranteed to have only one element for
        // the case of math rich text component.
        var svgFile = $scope.tmpCustomizationArgs[0].value.svgFile;
        var svgFileName = $scope.tmpCustomizationArgs[0].value.svg_filename;
        var rawLatex = $scope.tmpCustomizationArgs[0].value.raw_latex;
        if (rawLatex === '' || svgFileName === '') {
          AlertsService.addWarning(
            'The rawLatex or svgFileName for a Math expression should not ' +
            'be empty.');
          $uibModalInstance.dismiss('cancel');
          return;
        }
        var resampledFile = (
          ImageUploadHelperService.convertImageDataToImageFile(svgFile));

        let maxAllowedFileSize;
        if (
          ContextService.getEntityType() === ENTITY_TYPE.BLOG_POST
        ) {
          const ONE_MB_IN_BYTES = 1 * 1024 * 1024;
          maxAllowedFileSize = ONE_MB_IN_BYTES;
        } else {
          const HUNDRED_KB_IN_BYTES = 100 * 1024;
          maxAllowedFileSize = HUNDRED_KB_IN_BYTES;
        }
        if (resampledFile.size > maxAllowedFileSize) {
          AlertsService.addInfoMessage(
            `The SVG file generated exceeds ${maxAllowedFileSize / 1024}` +
            ' KB. Please split the expression into smaller ones.' +
            '   Example: x^2 + y^2 + z^2 can be split as \'x^2 + y^2\' ' +
            'and \'+ z^2\'', 5000);
          $uibModalInstance.dismiss('cancel');
          return;
        }
        if (
          ContextService.getImageSaveDestination() ===
          IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
          ImageLocalStorageService.saveImage(svgFileName, svgFile);
          var mathContentDict = {
            raw_latex: $scope.tmpCustomizationArgs[0].value.raw_latex,
            svg_filename: svgFileName
          };
          var caName = $scope.tmpCustomizationArgs[0].name;
          customizationArgsDict[caName] = mathContentDict;
          $uibModalInstance.close(customizationArgsDict);
          return;
        }
        $q.when(
          AssetsBackendApiService.saveMathExpresionImage(
            resampledFile, svgFileName, ContextService.getEntityType(),
            ContextService.getEntityId())
        ).then(function(response) {
          var mathContentDict = {
            raw_latex: $scope.tmpCustomizationArgs[0].value.raw_latex,
            svg_filename: response.filename
          };
          var caName = $scope.tmpCustomizationArgs[0].name;
          customizationArgsDict[caName] = mathContentDict;
          $uibModalInstance.close(customizationArgsDict);
        }, function(errorResponse) {
          AlertsService.addWarning(
            errorResponse.error || 'Error communicating with server.');
          $uibModalInstance.dismiss('cancel');
        });
      } else {
        for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
          var caName = $scope.tmpCustomizationArgs[i].name;
          if (caName === 'video_id') {
            var temp = $scope.tmpCustomizationArgs[i].value;
            customizationArgsDict[caName] = (
              extractVideoIdFromVideoUrl(temp.toString()));
          } else if (caName === 'text' && $scope.currentRteIsLinkEditor) {
            // Set the link `text` to the link `url` if the `text` is empty.
            customizationArgsDict[caName] = (
              $scope.tmpCustomizationArgs[i].value ||
              $scope.tmpCustomizationArgs[i - 1].value);
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
