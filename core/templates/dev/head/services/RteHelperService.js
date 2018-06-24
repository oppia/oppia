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
  '$filter', '$log', '$interpolate', 'ContextService',
  'RTE_COMPONENT_SPECS', 'HtmlEscaperService', 'UrlInterpolationService',
  function(
      $filter, $log, $interpolate, ContextService,
      RTE_COMPONENT_SPECS, HtmlEscaperService, UrlInterpolationService) {
    var _RICH_TEXT_COMPONENTS = [];

    Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function(componentId) {
      _RICH_TEXT_COMPONENTS.push({
        backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
        customizationArgSpecs: angular.copy(
          RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
        id: RTE_COMPONENT_SPECS[componentId].frontend_id,
        iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
        previewUrlTemplate:
        RTE_COMPONENT_SPECS[componentId].preview_url_template,
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
      createToolbarIcon: function(componentDefn) {
        var el = $('<img/>');
        el.attr(
          'src', UrlInterpolationService.getExtensionResourceUrl(
            componentDefn.iconDataUrl));
        el.addClass('oppia-rte-toolbar-image');
        return el.get(0);
      },
      // Returns a DOM node.
      createRteElement: function(componentDefn, customizationArgsDict) {
        var el = $('<img/>');
        if (ContextService.isInExplorationContext()) {
          // TODO(sll): This extra key was introduced in commit
          // 19a934ce20d592a3fc46bd97a2f05f41d33e3d66 in order to retrieve an
          // image for RTE previews. However, it has had the unfortunate side-
          // effect of adding an extra tag to the exploration RTE tags stored
          // in the datastore. We are now removing this key in
          // convertRteToHtml(), but we need to find a less invasive way to
          // handle previews.
          customizationArgsDict = angular.extend(customizationArgsDict, {
            explorationId: ContextService.getExplorationId()
          });
        }
        var componentPreviewUrlTemplate = componentDefn.previewUrlTemplate;
        if (componentDefn.previewUrlTemplate.indexOf(
          '/rich_text_components') === 0) {
          var interpolatedUrl = UrlInterpolationService.getExtensionResourceUrl(
            componentPreviewUrlTemplate);
        } else {
          var interpolatedUrl = ($interpolate(
            componentPreviewUrlTemplate, false, null, true)(
            customizationArgsDict));
        }

        if (!interpolatedUrl) {
          $log.error(
            'Error interpolating url : ' + componentDefn.previewUrlTemplate);
        } else {
          el.attr('src', interpolatedUrl);
        }
        el.addClass('oppia-noninteractive-' + componentDefn.id);
        if (componentDefn.isBlockElement) {
          el.addClass('block-element');
        }
        for (var attrName in customizationArgsDict) {
          el.attr(
            $filter('camelCaseToHyphens')(attrName) + '-with-value',
            HtmlEscaperService.objToEscapedJson(
              customizationArgsDict[attrName]));
        }

        return el.get(0);
      },
      // Replace <oppia-noninteractive> tags with <img> tags.
      convertHtmlToRte: function(html) {
        // If an undefined or empty html value is passed in, then the same type
        // of value should be returned. Without this check,
        // convertHtmlToRte(undefined) would return 'undefined', which is not
        // ideal.
        if (!html) {
          return html;
        }

        var elt = $('<div>' + html + '</div>');
        var that = this;

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          elt.find('oppia-noninteractive-' + componentDefn.id).replaceWith(
            function() {
              return that.createRteElement(
                componentDefn,
                _createCustomizationArgDictFromAttrs(this.attributes));
            }
          );
        });

        return elt.html();
      },
      // Replace <img> tags with <oppia-noninteractive> tags.
      convertRteToHtml: function(rte) {
        // If an undefined or empty rte value is passed in, then the same type
        // of value should be returned. Without this check,
        // convertRteToHtml(undefined) would return 'undefined', which is not
        // ideal.
        if (!rte) {
          return rte;
        }

        var elt = $('<div>' + rte + '</div>');

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          elt.find(
            'img.oppia-noninteractive-' + componentDefn.id
          ).replaceWith(function() {
            // Look for a class name starting with oppia-noninteractive-*.
            var tagNameMatch = /(^|\s)(oppia-noninteractive-[a-z0-9\-]+)/.exec(
              this.className);
            if (!tagNameMatch) {
              $log.error('RTE Error: invalid class name ' + this.className);
            }
            var jQueryElt = $('<' + tagNameMatch[2] + '/>');
            for (var i = 0; i < this.attributes.length; i++) {
              var attr = this.attributes[i];
              // The exploration-id-with-value attribute was added in
              // createRteElement(), and should be stripped. See commit
              // 19a934ce20d592a3fc46bd97a2f05f41d33e3d66.
              if (attr.name !== 'class' && attr.name !== 'src' &&
                attr.name !== 'exploration-id-with-value') {
                jQueryElt.attr(attr.name, attr.value);
              }
            }
            return jQueryElt.get(0);
          });
        });

        var textElt = elt[0].childNodes;
        for (var i = textElt.length; i > 0; i--) {
          for (var j = textElt[i - 1].childNodes.length; j > 0; j--) {
            if (textElt[i - 1].childNodes[j - 1].nodeName === 'BR' ||
              (textElt[i - 1].childNodes[j - 1].nodeName === '#text' &&
                textElt[i - 1].childNodes[j - 1].nodeValue.trim() === '')) {
              textElt[i - 1].childNodes[j - 1].remove();
            } else {
              break;
            }
          }
          if (textElt[i - 1].childNodes.length === 0) {
            if (textElt[i - 1].nodeName === 'BR' ||
              (textElt[i - 1].nodeName === '#text' &&
                textElt[i - 1].nodeValue.trim() === '') ||
                textElt[i - 1].nodeName === 'P') {
              textElt[i - 1].remove();
              continue;
            }
          } else {
            break;
          }
        }

        return elt.html();
      },
      getRichTextComponents: function() {
        return angular.copy(_RICH_TEXT_COMPONENTS);
      }
    };
  }
]);
