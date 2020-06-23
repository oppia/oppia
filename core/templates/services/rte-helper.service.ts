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

require('domain/utilities/url-interpolation.service.ts');
require('services/html-escaper.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/rte-helper-modal.controller.ts');

require('app.constants.ajs.ts');
require('services/services.constants.ajs.ts');

angular.module('oppia').factory('RteHelperService', [
  '$document', '$log', '$uibModal', 'HtmlEscaperService',
  'UrlInterpolationService', 'ENABLE_SVG_EDITOR_RTE',
  'INLINE_RTE_COMPONENTS', 'RTE_COMPONENT_SPECS', function(
      $document, $log, $uibModal, HtmlEscaperService,
      UrlInterpolationService, ENABLE_SVG_EDITOR_RTE,
      INLINE_RTE_COMPONENTS, RTE_COMPONENT_SPECS) {
    var _RICH_TEXT_COMPONENTS = [];

    Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function(componentId) {
      if (componentId === 'Svgdiagram') {
        if (!ENABLE_SVG_EDITOR_RTE) {
          return;
        }
      }
      _RICH_TEXT_COMPONENTS.push({
        backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
        customizationArgSpecs: angular.copy(
          RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
        id: RTE_COMPONENT_SPECS[componentId].frontend_id,
        iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
        isComplex: RTE_COMPONENT_SPECS[componentId].is_complex,
        isLessonRelated: RTE_COMPONENT_SPECS[componentId].is_lesson_related,
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
        return INLINE_RTE_COMPONENTS.indexOf(richTextComponent) !== -1;
      },
      // The refocusFn arg is a function that restores focus to the text editor
      // after exiting the modal, and moves the cursor back to where it was
      // before the modal was opened.
      openCustomizationModal: function(
          customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback,
          onDismissCallback, refocusFn) {
        $document[0].execCommand('enableObjectResizing', false, false);
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/ck-editor-helpers/' +
            'customize-rte-component-modal.template.html'),
          backdrop: 'static',
          resolve: {
            customizationArgSpecs: function() {
              return customizationArgSpecs;
            },
            attrsCustomizationArgsDict: function() {
              return attrsCustomizationArgsDict;
            }
          },
          controller: 'RteHelperModalController'
        }).result.then(onSubmitCallback)['catch'](onDismissCallback);
      }

    };
  }
]);
