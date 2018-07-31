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

/**
 * @fileoverview A helper service for the Rich text editor(RTE).
 */

oppia.constant('RTE_COMPONENT_SPECS', richTextComponents);

oppia.factory('RteHelperService', [
  '$filter', '$log', '$uibModal', '$interpolate', '$document',
  'ContextService', 'RTE_COMPONENT_SPECS', 'HtmlEscaperService',
  'UrlInterpolationService', 'FocusManagerService',
  function(
      $filter, $log, $uibModal, $interpolate, $document,
      ContextService, RTE_COMPONENT_SPECS, HtmlEscaperService,
      UrlInterpolationService, FocusManagerService) {
    var _RICH_TEXT_COMPONENTS = [];

    Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function(componentId) {
      _RICH_TEXT_COMPONENTS.push({
        backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
        customizationArgSpecs: angular.copy(
          RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
        id: RTE_COMPONENT_SPECS[componentId].frontend_id,
        iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
        isComplex: RTE_COMPONENT_SPECS[componentId].is_complex,
        isBlockElement: RTE_COMPONENT_SPECS[componentId].is_block_element,
        requiresFs: RTE_COMPONENT_SPECS[componentId].requires_fs,
        tooltip: RTE_COMPONENT_SPECS[componentId].tooltip
      });
    });

    var _createCustomizationArgDictFromAttrs = function(attrs) {
      var customizationArgsDict = {};
      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (attr.name === 'class' || attr.name === 'src' ||
          attr.name === '_moz_resizing') {
          continue;
        }
        var separatorLocation = attr.name.indexOf('-with-value');
        if (separatorLocation === -1) {
          $log.error('RTE Error: invalid customization attribute ' + attr.name);
          continue;
        }
        var argName = attr.name.substring(0, separatorLocation);
        customizationArgsDict[argName] = HtmlEscaperService.escapedJsonToObj(
          attr.value);
      }
      return customizationArgsDict;
    };

    return {
      createCustomizationArgDictFromAttrs: function(attrs) {
        return _createCustomizationArgDictFromAttrs(attrs);
      },
      getRichTextComponents: function() {
        return angular.copy(_RICH_TEXT_COMPONENTS);
      },
      isInlineComponent: function(richTextComponent) {
        var inlineComponents = ['link', 'math'];
        return inlineComponents.indexOf(richTextComponent) !== -1;
      },
      // The refocusFn arg is a function that restores focus to the text editor
      // after exiting the modal, and moves the cursor back to where it was
      // before the modal was opened.
      _openCustomizationModal: function(
          customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback,
          onDismissCallback, refocusFn) {
        $document[0].execCommand('enableObjectResizing', false, false);
        var modalDialog = $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/forms/customize_rte_component_modal_directive.html'),
          backdrop: 'static',
          resolve: {},
          controller: [
            '$scope', '$uibModalInstance', '$timeout',
            function($scope, $uibModalInstance, $timeout) {
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

              $scope.tmpCustomizationArgs = [];
              for (var i = 0; i < customizationArgSpecs.length; i++) {
                var caName = customizationArgSpecs[i].name;
                $scope.tmpCustomizationArgs.push({
                  name: caName,
                  value: (
                    attrsCustomizationArgsDict.hasOwnProperty(caName) ?
                      angular.copy(attrsCustomizationArgsDict[caName]) :
                      customizationArgSpecs[i].default_value)
                });
              }

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
              };

              $scope.save = function() {
                $scope.$broadcast('externalSave');

                var customizationArgsDict = {};
                for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                  var caName = $scope.tmpCustomizationArgs[i].name;
                  customizationArgsDict[caName] = (
                    $scope.tmpCustomizationArgs[i].value);
                }

                $uibModalInstance.close(customizationArgsDict);
              };
            }
          ]
        });

        modalDialog.result.then(onSubmitCallback, onDismissCallback);
        // 'finally' is a JS keyword. If it is just used in its ".finally" form,
        // the minification process throws an error.
        modalDialog.result['finally'](refocusFn);
      }

    };
  }
]);
