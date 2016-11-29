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
 * @fileoverview Directives for schema-based form builders.
 */

// NOTE TO DEVELOPERS: This forms framework accepts an external event
// named 'schemaBasedFormsShown'. This should be called by clients
// when these forms first come into view.

// The conditioning on window.GLOBALS.RTE_COMPONENT_SPECS is because, in the
// Karma tests, this value is undefined.
oppia.constant(
  'RTE_COMPONENT_SPECS',
  window.GLOBALS.RTE_COMPONENT_SPECS ? window.GLOBALS.RTE_COMPONENT_SPECS : {});

// Service for retrieving parameter specifications.
oppia.factory('parameterSpecsService', ['$log', function($log) {
  var paramSpecs = {};
  var ALLOWED_PARAM_TYPES = ['bool', 'unicode', 'float', 'int'];

  return {
    addParamSpec: function(paramName, paramType) {
      if (ALLOWED_PARAM_TYPES.indexOf(paramType) === -1) {
        $log.error('Invalid parameter type: ' + paramType);
        return;
      }
      paramSpecs[paramName] = {
        type: paramType
      };
    },
    getParamType: function(paramName) {
      if (!paramSpecs.hasOwnProperty(paramName)) {
        $log.error('No parameter with name ' + paramName + ' found.');
        return null;
      }
      return paramSpecs[paramName].type;
    },
    getAllParamsOfType: function(paramType) {
      var names = [];
      for (var paramName in paramSpecs) {
        if (paramSpecs[paramName].type === paramType) {
          names.push(paramName);
        }
      }
      return names.sort();
    },
    getAllParams: function() {
      var names = [];
      for (var paramName in paramSpecs) {
        names.push(paramName);
      }
      return names.sort();
    }
  };
}]);

oppia.filter('convertHtmlToUnicode', [function() {
  return function(html) {
    return angular.element('<div>' + html + '</div>').text();
  };
}]);

// Escapes the {, } and \ characters, and then converts
// <oppia-parameter>name</oppia-parameter> tags to {{name}}.
oppia.filter('convertHtmlWithParamsToUnicode', ['$filter', function($filter) {
  var escapeSpecialChars = function(str) {
    // Note that order is important here! Backslashes must be replaced before
    // the others, since doing either of the others first may give rise to
    // extra backslashes.
    return ($filter('convertHtmlToUnicode')(str))
      .replace(/([\\\{\}])/g, '\\$1');
  };

  var PARAM_OPENING_TAG = '<oppia-parameter>';
  var PARAM_CLOSING_TAG = '</oppia-parameter>';

  return function(html) {
    return html.split(PARAM_OPENING_TAG).map(function(value) {
      return value.split(PARAM_CLOSING_TAG).map(function(value2) {
        return escapeSpecialChars(value2);
      }).join('}}');
    }).join('{{');
  };
}]);

oppia.filter('convertUnicodeToHtml', [
  '$sanitize', 'oppiaHtmlEscaper', function($sanitize, oppiaHtmlEscaper) {
    return function(text) {
      return $sanitize(oppiaHtmlEscaper.unescapedStrToEscapedStr(text));
    };
  }
]);

// Converts {{name}} substrings to <oppia-parameter>name</oppia-parameter> tags
// and unescapes the {, } and \ characters. This is done by reading the given
// string from left to right: if we see a backslash, we use the following
// character; if we see a '{{', this is the start of a parameter; if
// we see a '}}'; this is the end of a parameter.
oppia.filter('convertUnicodeWithParamsToHtml', ['$filter', function($filter) {
  var assert = function(b) {
    if (!b) {
      throw 'Invalid unicode-string-with-parameters: ' + text;
    }
  };

  return function(text) {
    // The parsing here needs to be done with more care because we are replacing
    // two-character strings. We can't naively break by {{ because in strings
    // like \{{{ the second and third characters will be taken as the opening
    // brackets, which is wrong. We can't unescape characters because then the
    // { characters that remain will be ambiguous (they may either be the
    // openings of parameters or literal '{' characters entered by the user.
    // So we build a standard left-to-right parser which examines each
    // character of the string in turn, and processes it accordingly.
    var textFragments = [];
    var currentFragment = '';
    var currentFragmentIsParam = false;
    for (var i = 0; i < text.length; i++) {
      if (text[i] === '\\') {
        assert(
          !currentFragmentIsParam && text.length > i + 1 &&
          {
            '{': true,
            '}': true,
            '\\': true
          }[text[i + 1]]);
        currentFragment += text[i + 1];
        i++;
      } else if (text[i] === '{') {
        assert(
          text.length > i + 1 && !currentFragmentIsParam &&
          text[i + 1] === '{');
        textFragments.push({
          type: 'text',
          data: currentFragment
        });
        currentFragment = '';
        currentFragmentIsParam = true;
        i++;
      } else if (text[i] === '}') {
        assert(
          text.length > i + 1 && currentFragmentIsParam &&
          text[i + 1] === '}');
        textFragments.push({
          type: 'parameter',
          data: currentFragment
        });
        currentFragment = '';
        currentFragmentIsParam = false;
        i++;
      } else {
        currentFragment += text[i];
      }
    }

    assert(!currentFragmentIsParam);
    textFragments.push({
      type: 'text',
      data: currentFragment
    });

    var result = '';
    textFragments.forEach(function(fragment) {
      result += (
        fragment.type === 'text' ?
        $filter('convertUnicodeToHtml')(fragment.data) :
        '<oppia-parameter>' + fragment.data + '</oppia-parameter>');
    });
    return result;
  };
}]);

// TODO(sll): This whole directive needs to be rewritten to not rely on
// jWysiwyg.
oppia.directive('unicodeWithParametersEditor', ['$modal', function($modal) {
  return {
    restrict: 'E',
    scope: {
      allowedParameterNames: '&',
      localValue: '='
    },
    template: (
      '<div class="input-group">' +
      '  <textarea ng-disabled="!hasFullyLoaded"></textarea>' +
      '  <span class="input-group-btn">' +
      '    <button type="button" class="btn btn-default"' +
      '            ng-click="insertNewParameter()">+P</button>' +
      '  </span>' +
      '</div>'),
    controller: [
        '$scope', '$element', '$filter', '$timeout',
        function($scope, $element, $filter, $timeout) {
      if (!$scope.allowedParameterNames().length) {
        console.error(
          'The unicode-with-parameters editor should not be used if there ' +
          'are no unicode parameters available.');
        return;
      }

      // This is a bit silly. It appears that in contenteditables (in Chrome,
      // anyway) the cursor will stubbornly remain within the oppia-parameter
      // element (even though it should be outside it). However the behavior is
      // correct for images -- so we use images to delimit it. It's still hard
      // to do selection before the element if it's the first thing in the doc,
      // after the element if it's the last thing in the doc, or between two
      // consecutive elements. See this bug for a demonstration:
      //
      //     https://code.google.com/p/chromium/issues/detail?id=242110
      var INVISIBLE_IMAGE_TAG = (
        '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAA' +
        'BAAEAAAICTAEAOw=="></img>');
      var PARAM_CONTAINER_CLASS = 'oppia-parameter-container';

      $scope._createRteParameterTag = function(paramName) {
        var el = $(
          '<span class="' + PARAM_CONTAINER_CLASS + '" ' +
                 'contenteditable="false">' +
            INVISIBLE_IMAGE_TAG +
              '<oppia-parameter>' +
                paramName +
              '</oppia-parameter>' +
            INVISIBLE_IMAGE_TAG +
          '</span>');

        var domNode = el.get(0);
        domNode.ondblclick = function() {
          $scope.openEditParameterModal(paramName, domNode);
        };
        return domNode;
      };

      // Convert a unicode string into its RTE representation.
      $scope._convertUnicodeToRte = function(str) {
        var html = $filter('convertUnicodeWithParamsToHtml')(str);

        var elt = $('<div>' + html + '</div>');
        elt.find('oppia-parameter').replaceWith(function() {
          return $scope._createRteParameterTag(this.textContent);
        });
        return elt.html();
      };

      // Convert an RTE representation into a unicode string by removing all
      // insertion points and replacing <oppia-parameter> tags with {{...}}.
      $scope._convertRteToUnicode = function(rte) {
        var elt = $('<div>' + rte + '</div>');
        // Strip out all additional attributes and class names from the
        // <oppia-parameter> tag before conversion to a unicode string.
        elt.find('.' + PARAM_CONTAINER_CLASS).replaceWith(function() {
          return $('<oppia-parameter/>').text(this.textContent).get(0);
        });
        return $filter('convertHtmlWithParamsToUnicode')(elt.html());
      };

      var rteNode = $element[0].querySelector('textarea');

      // A pointer to the editorDoc in the RTE iframe. Populated when the RTE
      // is initialized.
      $scope.editorDoc = null;
      $scope.hasFullyLoaded = false;

      // If eltToReplace is null, a new element should be inserted at the
      // current caret.
      $scope.openEditParameterModal = function(currentParamName, eltToReplace) {
        return $modal.open({
          templateUrl: 'modals/editParamName',
          backdrop: true,
          resolve: {
            allowedParameterNames: function() {
              return $scope.allowedParameterNames();
            }
          },
          controller: [
            '$scope', '$modalInstance', 'allowedParameterNames',
            function($scope, $modalInstance, allowedParameterNames) {
              $scope.currentParamName = currentParamName;
              $scope.paramOptions = allowedParameterNames.map(
                function(paramName) {
                  return {
                    name: paramName,
                    value: paramName
                  };
                }
              );

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };

              $scope.save = function(paramName) {
                $modalInstance.close(paramName);
              };
            }
          ]
        }).result.then(function(paramName) {
          var el = $scope._createRteParameterTag(paramName);
          if (eltToReplace === null) {
            var doc = $(rteNode).wysiwyg('document').get(0);
            $(rteNode).wysiwyg(
              'insertHtml', '<span class="insertionPoint"></span>');
            eltToReplace = $scope.editorDoc.querySelector('.insertionPoint');
          }

          // Note that this removes the contenteditable="false" and ondblclick
          // attributes of el (but they are eventually replaced during the
          // normalization of the RTE content step). Also, we need to save the
          // change explicitly because the wysiwyg editor does not auto-detect
          // replaceWith() events.
          $(eltToReplace).replaceWith(el);
          $(rteNode).wysiwyg('save');
        });
      };

      $scope.insertNewParameter = function() {
        $scope.openEditParameterModal($scope.allowedParameterNames()[0], null);
      };

      var rteContentMemento = $scope._convertUnicodeToRte($scope.localValue);
      $scope.currentlyEditing = false;
      $scope.$watch('localValue', function() {
        if (!$scope.currentlyEditing) {
          // This is an external change.
          rteContentMemento = $scope._convertUnicodeToRte($scope.localValue);
          $(rteNode).wysiwyg('setContent', rteContentMemento);
        }
      }, true);

      $scope._normalizeRteContent = function(content) {
        // TODO(sll): Write this method to validate rather than just normalize.

        // The only top-level tags should be oppia-parameter tags. Each of these
        // tags should have a contenteditable=false attribute, a dblclick
        // handler that opens the parameter modal, and content consisting of a
        // valid parameter name of type unicode surrounded by two invisible
        // image tags.
        var elt = $('<div>' + content + '</div>');
        elt.find('.' + PARAM_CONTAINER_CLASS).replaceWith(function() {
          return $scope._createRteParameterTag(this.textContent.trim());
        });
        return elt.html();
      };

      $scope.init = function() {
        $(rteNode).wysiwyg({
          autoGrow: true,
          autoSave: true,
          controls: {},
          css: '/css/rte_single_line.css',
          debug: true,
          events: {
            // Prevent dragging, since this causes weird things to happen when
            // a user selects text containing all or part of parameter tags and
            // then drags that text elsewhere.
            dragstart: function(e) {
              e.preventDefault();
            },
            // Prevent use of keyboard shortcuts for bold, italics, etc. Also
            // prevent pasting, newlines and tabbing.
            keydown: function(e) {
              var aKey = 65;
              var cKey = 67;
              var xKey = 88;
              var zKey = 90;
              var vKey = 86;
              if (e.ctrlKey) {
                if (e.keyCode === 86) {
                  e.preventDefault();
                  alert(
                    'Pasting in string input fields is currently not ' +
                    'supported. Sorry about that!');
                } else if (
                    e.keyCode !== aKey && e.keyCode !== cKey &&
                    e.keyCode !== xKey && e.keyCode !== zKey) {
                  e.preventDefault();
                }
              }
              // Disable the enter key. Contenteditable does not seem to support
              // deletion of newlines. Also disable the tab key.
              if (e.keyCode === 13 || e.keyCode === 9) {
                e.preventDefault();
              }
            },
            paste: function(e) {
              e.preventDefault();
            },
            save: function() {
              var currentContent = $(rteNode).wysiwyg('getContent');
              if (currentContent === null || currentContent === undefined) {
                return;
              }

              // Normalize the new content. If a validation error occurs,
              // revert to the memento, and update the external and internal
              // values. Otherwise, update the external and internal values
              // with the normalized content, and update the memento as well.
              var normalizedContent = '';
              try {
                normalizedContent = $scope._normalizeRteContent(currentContent);
              } catch (unusedException) {
                console.error('Error parsing RTE content: ' + currentContent);
                normalizedContent = rteContentMemento;
              }

              if (normalizedContent !== currentContent) {
                $(rteNode).wysiwyg('setContent', normalizedContent);
              }

              // Update the external value. The $timeout removes the '$apply in
              // progress' errors which get triggered if a parameter was edited.
              $timeout(function() {
                $scope.$apply(function() {
                  $scope.currentlyEditing = true;
                  $scope.localValue = $scope._convertRteToUnicode(
                    normalizedContent);
                  // TODO(sll): This is a somewhat hacky solution. Can it be
                  // cleaned up?
                  $timeout(function() {
                    $scope.currentlyEditing = false;
                  }, 50);
                });
              });

              // Update the memento.
              rteContentMemento = normalizedContent;
            }
          },
          iFrameClass: 'wysiwyg-content',
          initialContent: rteContentMemento,
          maxHeight: 30,
          rmUnusedControls: true
        });

        $scope.editorDoc = $(rteNode).wysiwyg('document')[0].body;

        // Add dblclick handlers to the various nodes, since they get stripped
        // in the initialization.
        var elts = Array.prototype.slice.call(
          $scope.editorDoc.querySelectorAll('.' + PARAM_CONTAINER_CLASS));
        elts.forEach(function(elt) {
          elt.ondblclick = function() {
            $scope.openEditParameterModal($(elt).text(), elt);
          };
        });

        $scope.hasFullyLoaded = true;
      };

      $scope.init();

      // TODO(sll): If two RTEs share the same data source, and one RTE saves
      // a change to the data, the other RTE should be updated. However, if we
      // just place a $scope.$watch on the data source, then typing in a single
      // RTE is going to call that method, and this will replace the content of
      // the RTE -- which is normally not an issue, but in this case it
      // moves the cursor back to the beginning of the doc and frustrates the
      // user. We should find a solution for this -- although it probably is
      // not a common use case to have multiple unicode RTEs referencing the
      // same data source, there is a problem in that although the Cancel
      // button does update the data model, it does not update the appearance
      // of the RTE.
    }]
  };
}]);

oppia.factory('schemaDefaultValueService', [function() {
  return {
    // TODO(sll): Rewrite this to take validators into account, so that
    // we always start with a valid value.
    getDefaultValue: function(schema) {
      if (schema.choices) {
        return schema.choices[0];
      } else if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [this.getDefaultValue(schema.items)];
      } else if (schema.type === 'dict') {
        var result = {};
        for (var i = 0; i < schema.properties.length; i++) {
          result[schema.properties[i].name] = this.getDefaultValue(
            schema.properties[i].schema);
        }
        return result;
      } else if (schema.type === 'int' || schema.type === 'float') {
        return 0;
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);

oppia.factory('schemaUndefinedLastElementService', [function() {
  return {
    // Returns true if the input value, taken as the last element in a list,
    // should be considered as 'undefined' and therefore deleted.
    getUndefinedValue: function(schema) {
      if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else {
        return undefined;
      }
    }
  };
}]);

oppia.filter('sanitizeHtmlForRte', ['$sanitize', function($sanitize) {
  var _EXTENSION_SELECTOR = '[class^=oppia-noninteractive-]';

  return function(html) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // Save the unsanitized extensions.
    var unsanitizedExtensions = $(wrapper).find(_EXTENSION_SELECTOR);

    wrapper.innerHTML = $sanitize(wrapper.innerHTML);
    var sanitizedExtensions = $(wrapper).find(_EXTENSION_SELECTOR);
    for (var i = 0; i < sanitizedExtensions.length; i++) {
      var el = sanitizedExtensions[i];
      var attrs = unsanitizedExtensions[i].attributes;
      for (var j = 0; j < attrs.length; j++) {
        var attr = attrs[j];
        // Reinstate the sanitized widget attributes.
        if (attr.name.indexOf('-with-value') !== -1 &&
            !el.hasAttribute(attr.name)) {
          el.setAttribute(attr.name, attr.value);
        }
      }
    }

    return wrapper.innerHTML;
  };
}]);

oppia.factory('rteHelperService', [
  '$filter', '$log', '$interpolate', 'explorationContextService',
  'RTE_COMPONENT_SPECS', 'oppiaHtmlEscaper',
  function($filter, $log, $interpolate, explorationContextService,
    RTE_COMPONENT_SPECS, oppiaHtmlEscaper) {
    var _RICH_TEXT_COMPONENTS = [];

    Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function(componentId) {
      _RICH_TEXT_COMPONENTS.push({
        backendName: RTE_COMPONENT_SPECS[componentId].backend_name,
        customizationArgSpecs: angular.copy(
          RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
        name: RTE_COMPONENT_SPECS[componentId].frontend_name,
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
        customizationArgsDict[argName] = oppiaHtmlEscaper.escapedJsonToObj(
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
        el.attr('src', componentDefn.iconDataUrl);
        el.addClass('oppia-rte-toolbar-image');
        return el.get(0);
      },
      // Returns a DOM node.
      createRteElement: function(componentDefn, customizationArgsDict) {
        var el = $('<img/>');
        if (explorationContextService.isInExplorationContext()) {
          // TODO(sll): This extra key was introduced in commit
          // 19a934ce20d592a3fc46bd97a2f05f41d33e3d66 in order to retrieve an
          // image for RTE previews. However, it has had the unfortunate side-
          // effect of adding an extra tag to the exploration RTE tags stored
          // in the datastore. We are now removing this key in
          // convertRteToHtml(), but we need to find a less invasive way to
          // handle previews.
          customizationArgsDict = angular.extend(customizationArgsDict, {
            explorationId: explorationContextService.getExplorationId()
          });
        }
        var interpolatedUrl = $interpolate(
          componentDefn.previewUrlTemplate, false, null, true)(
            customizationArgsDict);
        if (!interpolatedUrl) {
          $log.error(
            'Error interpolating url : ' + componentDefn.previewUrlTemplate);
        } else {
          el.attr('src', interpolatedUrl);
        }
        el.addClass('oppia-noninteractive-' + componentDefn.name);
        if (componentDefn.isBlockElement) {
          el.addClass('block-element');
        }
        for (var attrName in customizationArgsDict) {
          el.attr(
            $filter('camelCaseToHyphens')(attrName) + '-with-value',
            oppiaHtmlEscaper.objToEscapedJson(customizationArgsDict[attrName]));
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
          elt.find('oppia-noninteractive-' + componentDefn.name).replaceWith(
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
            'img.oppia-noninteractive-' + componentDefn.name
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

        return elt.html();
      },
      getRichTextComponents: function() {
        return angular.copy(_RICH_TEXT_COMPONENTS);
      }
    };
  }
]);

// Add RTE extensions to textAngular toolbar options.
oppia.config(['$provide', function($provide) {
  $provide.decorator('taOptions', [
    '$delegate', '$document', '$modal', '$timeout', 'focusService',
    'taRegisterTool', 'rteHelperService', 'alertsService',
    'explorationContextService', 'PAGE_CONTEXT',
    function(
        taOptions, $document, $modal, $timeout, focusService,
        taRegisterTool, rteHelperService, alertsService,
        explorationContextService, PAGE_CONTEXT) {
      taOptions.disableSanitizer = true;
      taOptions.forceTextAngularSanitize = false;
      taOptions.classes.textEditor = 'form-control oppia-rte-content';
      taOptions.setup.textEditorSetup = function($element) {
        $timeout(function() {
          $element.trigger('focus');
        });
      };

      // The refocusFn arg is a function that restores focus to the text editor
      // after exiting the modal, and moves the cursor back to where it was
      // before the modal was opened.
      var _openCustomizationModal = function(
          customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback,
          onDismissCallback, refocusFn) {
        $document[0].execCommand('enableObjectResizing', false, false);
        var modalDialog = $modal.open({
          templateUrl: 'modals/customizeRteComponent',
          backdrop: 'static',
          resolve: {},
          controller: [
            '$scope', '$modalInstance', '$timeout',
            function($scope, $modalInstance, $timeout) {
            $scope.customizationArgSpecs = customizationArgSpecs;

            // Without this code, the focus will remain in the background RTE
            // even after the modal loads. This switches the focus to a
            // temporary field in the modal which is then removed from the DOM.
            // TODO(sll): Make this switch to the first input field in the modal
            // instead.
            $scope.modalIsLoading = true;
            focusService.setFocus('tmpFocusPoint');
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
                  attrsCustomizationArgsDict[caName] :
                  customizationArgSpecs[i].default_value)
              });
            }

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };

            $scope.save = function() {
              $scope.$broadcast('externalSave');

              var customizationArgsDict = {};
              for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                var caName = $scope.tmpCustomizationArgs[i].name;
                customizationArgsDict[caName] = (
                  $scope.tmpCustomizationArgs[i].value);
              }

              $modalInstance.close(customizationArgsDict);
            };
          }]
        });

        modalDialog.result.then(onSubmitCallback, onDismissCallback);
        // 'finally' is a JS keyword. If it is just used in its ".finally" form,
        // the minification process throws an error.
        modalDialog.result['finally'](refocusFn);
      };

      rteHelperService.getRichTextComponents().forEach(function(componentDefn) {
        var buttonDisplay = rteHelperService.createToolbarIcon(componentDefn);
        var canUseFs = explorationContextService.getPageContext() ===
          PAGE_CONTEXT.EDITOR;

        taRegisterTool(componentDefn.name, {
          display: buttonDisplay.outerHTML,
          tooltiptext: componentDefn.tooltip,
          disabled: function() {
            // Disable components that affect fs for non-editors.
            return !canUseFs && componentDefn.requiresFs;
          },
          onElementSelect: {
            element: 'img',
            filter: function(elt) {
              return elt.hasClass('oppia-noninteractive-' + componentDefn.name);
            },
            action: function(event, $element) {
              event.preventDefault();
              var textAngular = this;

              if (!canUseFs && componentDefn.requiresFs) {
                var FS_UNAUTHORIZED_WARNING = 'Unfortunately, only ' +
                  'exploration authors can make changes involving files.';
                alertsService.addWarning(FS_UNAUTHORIZED_WARNING);
                // Without this, the view will not update to show the warning.
                textAngular.$editor().$parent.$apply();
                return;
              }

              // Move the cursor to be immediately after the clicked widget.
              // This prevents users from overwriting the widget.
              var elRange = rangy.createRange();
              elRange.setStartAfter($element.get(0));
              elRange.setEndAfter($element.get(0));
              var elSelection = rangy.getSelection();
              elSelection.removeAllRanges();
              elSelection.addRange(elRange);
              var savedSelection = rangy.saveSelection();

              // Temporarily pauses sanitizer so rangy markers save position
              textAngular.$editor().$parent.isCustomizationModalOpen = true;
              _openCustomizationModal(
                componentDefn.customizationArgSpecs,
                rteHelperService.createCustomizationArgDictFromAttrs(
                  $element[0].attributes),
                function(customizationArgsDict) {
                  var el = rteHelperService.createRteElement(
                    componentDefn, customizationArgsDict);
                  $element[0].parentNode.replaceChild(el, $element[0]);
                  textAngular.$editor().updateTaBindtaTextElement();
                },
                function() {},
                function() {
                  // Re-enables the sanitizer now that the modal is closed.
                  textAngular.$editor(
                    ).$parent.isCustomizationModalOpen = false;
                  textAngular.$editor().displayElements.text[0].focus();
                  rangy.restoreSelection(savedSelection);
                });
              return false;
            }
          },
          action: function() {
            var textAngular = this;
            var savedSelection = rangy.saveSelection();
            textAngular.$editor().wrapSelection(
              'insertHtml', '<span class="insertionPoint"></span>');

            // Temporarily pauses sanitizer so rangy markers save position.
            textAngular.$editor().$parent.isCustomizationModalOpen = true;
            _openCustomizationModal(
              componentDefn.customizationArgSpecs,
              {},
              function(customizationArgsDict) {
                var el = rteHelperService.createRteElement(
                  componentDefn, customizationArgsDict);
                var insertionPoint = (
                  textAngular.$editor().displayElements.text[0].querySelector(
                    '.insertionPoint'));
                var parent = insertionPoint.parentNode;
                parent.replaceChild(el, insertionPoint);
                textAngular.$editor().updateTaBindtaTextElement();
              },
              function() {
                // Clean up the insertion point if no widget was inserted.
                var insertionPoint = (
                  textAngular.$editor().displayElements.text[0].querySelector(
                    '.insertionPoint'));
                if (insertionPoint !== null) {
                  insertionPoint.remove();
                }
              },
              function() {
                // Re-enables the sanitizer now that the modal is closed.
                textAngular.$editor().$parent.isCustomizationModalOpen = false;
                textAngular.$editor().displayElements.text[0].focus();
                rangy.restoreSelection(savedSelection);
              }
            );
          }
        });
      });

      return taOptions;
    }
  ]);
}]);

oppia.directive('textAngularRte', [
    '$filter', '$timeout', 'oppiaHtmlEscaper', 'rteHelperService',
    'textAngularManager',
    function(
        $filter, $timeout, oppiaHtmlEscaper, rteHelperService,
        textAngularManager) {
      return {
        restrict: 'E',
        scope: {
          htmlContent: '=',
          uiConfig: '&',
          labelForFocusTarget: '&'
        },
        template: (
          '<div text-angular="" ta-toolbar="<[toolbarOptionsJson]>" ' +
          '     ta-paste="stripFormatting($html)" ng-model="tempContent"' +
          '     placeholder="<[placeholderText]>"' +
          '     name="<[labelForFocusTarget()]>">' +
          '</div>'),
        controller: ['$scope', function($scope) {
          // Currently, operations affecting the filesystem are allowed only in
          // the editor context.
          $scope.isCustomizationModalOpen = false;
          var toolbarOptions = [
            ['bold', 'italics'],
            ['ol', 'ul', 'pre', 'indent', 'outdent'],
            []
          ];
          var whitelistedImgClasses = [];

          if ($scope.uiConfig() && $scope.uiConfig().placeholder) {
            $scope.placeholderText = $scope.uiConfig().placeholder;
          }

          rteHelperService.getRichTextComponents().forEach(
            function(componentDefn) {
              if (!($scope.uiConfig() &&
                    $scope.uiConfig().hide_complex_extensions &&
                    componentDefn.isComplex)) {
                toolbarOptions[2].push(componentDefn.name);
              }
              var imgClassName = 'oppia-noninteractive-' + componentDefn.name;
              whitelistedImgClasses.push(imgClassName);
            }
          );
          $scope.toolbarOptionsJson = JSON.stringify(toolbarOptions);

          var _convertHtmlToRte = function(html) {
            return rteHelperService.convertHtmlToRte(html);
          };

          $scope.stripFormatting = function(html) {
            var safeHtml = $filter(
              'stripFormatting'
            )(html, whitelistedImgClasses);
            // The '.' default is needed, otherwise some tags are not stripped
            // properly. To reproduce, copy the image from this page
            // (https://en.wikipedia.org/wiki/C._Auguste_Dupin) and paste it
            // into the RTE.
            return safeHtml || '.';
          };

          $scope.init = function() {
            $scope.tempContent = _convertHtmlToRte($scope.htmlContent);
          };

          $scope.init();

          $scope.$on('focusOn', function(evt, label) {
            if (label === $scope.labelForFocusTarget()) {
              var editorScope = textAngularManager.retrieveEditor(label).scope;
              $timeout(function() {
                editorScope.displayElements.text[0].focus();
              });
            }
          });

          $scope.$watch('tempContent', function(newVal) {
            // Sanitizing while a modal is open would delete the markers that
            // save and restore the cursor's position in the RTE.
            var displayedContent = $scope.isCustomizationModalOpen ? newVal :
              $filter('sanitizeHtmlForRte')(newVal);
            $scope.htmlContent = rteHelperService.convertRteToHtml(
              displayedContent);
          });

          // It is possible for the content of the RTE to be changed externally,
          // e.g. if there are several RTEs in a list, and one is deleted.
          $scope.$on('externalHtmlContentChange', function() {
            $timeout(function() {
              $scope.tempContent = _convertHtmlToRte($scope.htmlContent);
            });
          });
        }]
      };
    }
]);

// The names of these filters must correspond to the names of the backend
// validators (with underscores converted to camelcase).
// WARNING: These filters do not validate the arguments supplied with the
// validator definitions in the schema; these are assumed to be correct.
oppia.filter('isAtLeast', [function() {
  return function(input, args) {
    return (input >= args.minValue);
  };
}]);

oppia.filter('isAtMost', [function() {
  return function(input, args) {
    return (input <= args.maxValue);
  };
}]);

oppia.filter('isNonempty', [function() {
  return function(input) {
    return Boolean(input);
  };
}]);

oppia.filter('isFloat', [function() {
  return function(input) {
    var FLOAT_REGEXP = /(?=.*\d)^\-?\d*(\.|\,)?\d*\%?$/;
    // This regex accepts floats in the following formats:
    // 0.
    // 0.55..
    // -0.55..
    // .555..
    // -.555..
    // All examples above with '.' replaced with ',' are also valid.
    // Expressions containing % are also valid (5.1% etc).

    var viewValue = '';
    try {
      var viewValue = input.toString().trim();
    } catch (e) {
      return undefined;
    }

    if (viewValue !== '' && FLOAT_REGEXP.test(viewValue)) {
      if (viewValue.slice(-1) === '%') {
        // This is a percentage, so the input needs to be divided by 100.
        return parseFloat(
          viewValue.substring(0, viewValue.length - 1).replace(',', '.')
        ) / 100.0;
      } else {
        return parseFloat(viewValue.replace(',', '.'));
      }
    } else {
      return undefined;
    }
  };
}]);

oppia.directive('applyValidation', ['$filter', function($filter) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      // Add validators in reverse order.
      if (scope.validators()) {
        scope.validators().forEach(function(validatorSpec) {
          var frontendName = $filter('underscoresToCamelCase')(
            validatorSpec.id);

          // Note that there may not be a corresponding frontend filter for
          // each backend validator.
          try {
            $filter(frontendName);
          } catch (err) {
            return;
          }

          var filterArgs = {};
          for (key in validatorSpec) {
            if (key !== 'id') {
              filterArgs[$filter('underscoresToCamelCase')(key)] = angular.copy(
                validatorSpec[key]);
            }
          }

          var customValidator = function(viewValue) {
            ctrl.$setValidity(
              frontendName, $filter(frontendName)(viewValue, filterArgs));
            return viewValue;
          };

          ctrl.$parsers.unshift(customValidator);
          ctrl.$formatters.unshift(customValidator);
        });
      }
    }
  };
}]);

// This should come before 'apply-validation', if that is defined as
// an attribute on the HTML tag.
oppia.directive('requireIsFloat', ['$filter', function($filter) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      var floatValidator = function(viewValue) {
        var filteredValue = $filter('isFloat')(viewValue);
        ctrl.$setValidity('isFloat', filteredValue !== undefined);
        return filteredValue;
      };

      ctrl.$parsers.unshift(floatValidator);
      ctrl.$formatters.unshift(floatValidator);
    }
  };
}]);

oppia.directive('requireIsValidExpression',
    ['parameterSpecsService', 'expressionEvaluatorService',
        function(parameterSpecsService, expressionEvaluatorService) {
  // Create a namescope environment from the parameter names. The values of the
  // parameters do not matter.
  var params = {};
  parameterSpecsService.getAllParams().forEach(function(name) {
    params[name] = true;
  });

  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      var validator = function(value) {
        ctrl.$setValidity('isValidExpression',
            expressionEvaluatorService.validateExpression(value, [params]));
        return value;
      };

      ctrl.$parsers.unshift(validator);
      ctrl.$formatters.unshift(validator);
    }
  };
}]);

// Prevents timeouts due to recursion in nested directives. See:
//
//   http://stackoverflow.com/q/14430655
oppia.factory('recursionHelper', ['$compile', function($compile) {
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param {DOM element} element
     * @param {function|object} link - A post-link function, or an object with
     *   function(s) registered via pre and post properties.
     * @return {object} An object containing the linking functions.
     */
    compile: function(element, link) {
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = {
          post: link
        };
      }

      // Break the recursion loop by removing the contents,
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        post: function(scope, element) {
          // Compile the contents.
          if (!compiledContents) {
            compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element.
          compiledContents(scope, function(clone) {
            element.append(clone);
          });

          // Call the post-linking function, if any.
          if (link && link.post) {
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
}]);

/*********************************************************************
 *
 * DIRECTIVES FOR SCHEMA-BASED EDITORS
 *
 *********************************************************************/
oppia.directive('schemaBasedEditor', [function() {
  return {
    scope: {
      schema: '&',
      isDisabled: '&',
      localValue: '=',
      allowExpressions: '&',
      labelForFocusTarget: '&',
      onInputBlur: '=',
      onInputFocus: '='
    },
    templateUrl: 'schemaBasedEditor/master',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedChoicesEditor', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        // The choices for the object's value.
        choices: '&',
        // The schema for this object.
        // TODO(sll): Validate each choice against the schema.
        schema: '&',
        isDisabled: '&'
      },
      templateUrl: 'schemaBasedEditor/choices',
      restrict: 'E',
      compile: recursionHelper.compile,
      controller: ['$scope', function($scope) {
        $scope.getReadonlySchema = function() {
          var readonlySchema = angular.copy($scope.schema());
          delete readonlySchema.choices;
          return readonlySchema;
        };
      }]
    };
  }
]);

oppia.directive('schemaBasedExpressionEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      // TODO(sll): Currently only takes a string which is either 'bool', 'int'
      // or 'float'. May need to generalize.
      outputType: '&',
      labelForFocusTarget: '&'
    },
    templateUrl: 'schemaBasedEditor/expression',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedBoolEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      allowExpressions: '&',
      labelForFocusTarget: '&'
    },
    templateUrl: 'schemaBasedEditor/bool',
    restrict: 'E',
    controller: [
      '$scope', 'parameterSpecsService',
      function($scope, parameterSpecsService) {
        if ($scope.allowExpressions()) {
          $scope.paramNames = parameterSpecsService.getAllParamsOfType('bool');
          $scope.expressionMode = angular.isString($scope.localValue);

          $scope.$watch('localValue', function(newValue) {
            $scope.expressionMode = angular.isString(newValue);
          });

          $scope.toggleExpressionMode = function() {
            $scope.expressionMode = !$scope.expressionMode;
            $scope.localValue = (
              $scope.expressionMode ? $scope.paramNames[0] : false);
          };
        }
      }
    ]
  };
}]);

oppia.directive('schemaBasedIntEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      allowExpressions: '&',
      validators: '&',
      labelForFocusTarget: '&',
      onInputBlur: '=',
      onInputFocus: '='
    },
    templateUrl: 'schemaBasedEditor/int',
    restrict: 'E',
    controller: [
      '$scope', 'parameterSpecsService',
      function($scope, parameterSpecsService) {
        if ($scope.localValue === undefined) {
          $scope.localValue = 0;
        }

        $scope.onKeypress = function(evt) {
          if (evt.keyCode === 13) {
            $scope.$emit('submittedSchemaBasedIntForm');
          }
        };

        if ($scope.allowExpressions()) {
          $scope.paramNames = parameterSpecsService.getAllParamsOfType('int');
          $scope.expressionMode = angular.isString($scope.localValue);

          $scope.$watch('localValue', function(newValue) {
            $scope.expressionMode = angular.isString(newValue);
          });

          $scope.toggleExpressionMode = function() {
            $scope.expressionMode = !$scope.expressionMode;
            $scope.localValue = (
              $scope.expressionMode ? $scope.paramNames[0] : 0);
          };
        }
      }
    ]
  };
}]);

oppia.directive('schemaBasedFloatEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      allowExpressions: '&',
      validators: '&',
      labelForFocusTarget: '&',
      onInputBlur: '=',
      onInputFocus: '='
    },
    templateUrl: 'schemaBasedEditor/float',
    restrict: 'E',
    controller: [
      '$scope', '$filter', '$timeout', 'parameterSpecsService',
      'focusService',
      function(
          $scope, $filter, $timeout, parameterSpecsService, focusService) {
        $scope.hasLoaded = false;
        $scope.isUserCurrentlyTyping = false;
        $scope.hasFocusedAtLeastOnce = false;

        $scope.labelForErrorFocusTarget = focusService.generateFocusLabel();

        $scope.validate = function(localValue) {
          return $filter('isFloat')(localValue) !== undefined;
        };

        $scope.onFocus = function() {
          $scope.hasFocusedAtLeastOnce = true;
          if ($scope.onInputFocus) {
            $scope.onInputFocus();
          }
        };

        $scope.onBlur = function() {
          $scope.isUserCurrentlyTyping = false;
          if ($scope.onInputBlur) {
            $scope.onInputBlur();
          }
        };

        // TODO(sll): Move these to ng-messages when we move to Angular 1.3.
        $scope.getMinValue = function() {
          for (var i = 0; i < $scope.validators().length; i++) {
            if ($scope.validators()[i].id === 'is_at_least') {
              return $scope.validators()[i].min_value;
            }
          }
        };

        $scope.getMaxValue = function() {
          for (var i = 0; i < $scope.validators().length; i++) {
            if ($scope.validators()[i].id === 'is_at_most') {
              return $scope.validators()[i].max_value;
            }
          }
        };

        $scope.onKeypress = function(evt) {
          if (evt.keyCode === 13) {
            if (Object.keys($scope.floatForm.floatValue.$error).length !== 0) {
              $scope.isUserCurrentlyTyping = false;
              focusService.setFocus($scope.labelForErrorFocusTarget);
            } else {
              $scope.$emit('submittedSchemaBasedFloatForm');
            }
          } else {
            $scope.isUserCurrentlyTyping = true;
          }
        };

        if ($scope.localValue === undefined) {
          $scope.localValue = 0.0;
        }

        if ($scope.allowExpressions()) {
          $scope.paramNames = parameterSpecsService.getAllParamsOfType('float');
          $scope.expressionMode = angular.isString($scope.localValue);

          $scope.$watch('localValue', function(newValue) {
            $scope.expressionMode = angular.isString(newValue);
          });

          $scope.toggleExpressionMode = function() {
            $scope.expressionMode = !$scope.expressionMode;
            $scope.localValue = (
              $scope.expressionMode ? $scope.paramNames[0] : 0.0);
          };
        }

        // This prevents the red 'invalid input' warning message from flashing
        // at the outset.
        $timeout(function() {
          $scope.hasLoaded = true;
        });
      }
    ]
  };
}]);

oppia.directive('schemaBasedUnicodeEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      validators: '&',
      uiConfig: '&',
      allowExpressions: '&',
      labelForFocusTarget: '&',
      onInputBlur: '=',
      onInputFocus: '='
    },
    templateUrl: 'schemaBasedEditor/unicode',
    restrict: 'E',
    controller: ['$scope', '$filter', '$sce', 'parameterSpecsService',
        function($scope, $filter, $sce, parameterSpecsService) {
      $scope.allowedParameterNames = parameterSpecsService.getAllParamsOfType(
        'unicode');
      $scope.doUnicodeParamsExist = ($scope.allowedParameterNames.length > 0);

      if ($scope.uiConfig() && $scope.uiConfig().rows &&
          $scope.doUnicodeParamsExist) {
        $scope.doUnicodeParamsExist = false;
        console.log(
          'Multi-row unicode fields with parameters are not currently ' +
          'supported.');
      }

      if ($scope.uiConfig() && $scope.uiConfig().coding_mode) {
        // Flag that is flipped each time the codemirror view is
        // shown. (The codemirror instance needs to be refreshed
        // every time it is unhidden.)
        $scope.codemirrorStatus = false;
        var CODING_MODE_NONE = 'none';

        $scope.codemirrorOptions = {
          // Convert tabs to spaces.
          extraKeys: {
            Tab: function(cm) {
              var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
              cm.replaceSelection(spaces);
              // Move the cursor to the end of the selection.
              var endSelectionPos = cm.getDoc().getCursor('head');
              cm.getDoc().setCursor(endSelectionPos);
            }
          },
          indentWithTabs: false,
          lineNumbers: true
        };

        if ($scope.isDisabled()) {
          $scope.codemirrorOptions.readOnly = 'nocursor';
        }
        // Note that only 'coffeescript', 'javascript', 'lua', 'python', 'ruby'
        // and 'scheme' have CodeMirror-supported syntax highlighting. For other
        // languages, syntax highlighting will not happen.
        if ($scope.uiConfig().coding_mode !== CODING_MODE_NONE) {
          $scope.codemirrorOptions.mode = $scope.uiConfig().coding_mode;
        }

        setTimeout(function() {
          $scope.codemirrorStatus = !$scope.codemirrorStatus;
        }, 200);

        // When the form view is opened, flip the status flag. The
        // timeout seems to be needed for the line numbers etc. to display
        // properly.
        $scope.$on('schemaBasedFormsShown', function() {
          setTimeout(function() {
            $scope.codemirrorStatus = !$scope.codemirrorStatus;
          }, 200);
        });
      }

      $scope.onKeypress = function(evt) {
        if (evt.keyCode === 13) {
          $scope.$emit('submittedSchemaBasedUnicodeForm');
        }
      };

      $scope.getPlaceholder = function() {
        if (!$scope.uiConfig()) {
          return '';
        } else {
          return $scope.uiConfig().placeholder;
        }
      };

      $scope.getRows = function() {
        if (!$scope.uiConfig()) {
          return null;
        } else {
          return $scope.uiConfig().rows;
        }
      };

      $scope.getCodingMode = function() {
        if (!$scope.uiConfig()) {
          return null;
        } else {
          return $scope.uiConfig().coding_mode;
        }
      };

      $scope.getDisplayedValue = function() {
        return $sce.trustAsHtml(
          $filter('convertUnicodeWithParamsToHtml')($scope.localValue));
      };
    }]
  };
}]);

oppia.directive('schemaBasedHtmlEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      allowExpressions: '&',
      labelForFocusTarget: '&',
      uiConfig: '&'
    },
    templateUrl: 'schemaBasedEditor/html',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedListEditor', [
  'schemaDefaultValueService', 'recursionHelper', 'focusService',
  'schemaUndefinedLastElementService', 'IdGenerationService',
  function(
    schemaDefaultValueService, recursionHelper, focusService,
    schemaUndefinedLastElementService, IdGenerationService) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        // Read-only property. The schema definition for each item in the list.
        itemSchema: '&',
        // The length of the list. If not specified, the list is of arbitrary
        // length.
        len: '=',
        // UI configuration. May be undefined.
        uiConfig: '&',
        allowExpressions: '&',
        validators: '&',
        labelForFocusTarget: '&'
      },
      templateUrl: 'schemaBasedEditor/list',
      restrict: 'E',
      compile: recursionHelper.compile,
      controller: ['$scope', function($scope) {
        var baseFocusLabel = (
          $scope.labelForFocusTarget() ||
          IdGenerationService.generateNewId() + '-');
        $scope.getFocusLabel = function(index) {
          // Treat the first item in the list as a special case -- if this list
          // is contained in another list, and the outer list is opened with a
          // desire to autofocus on the first input field, we can then focus on
          // the given $scope.labelForFocusTarget().
          // NOTE: This will cause problems for lists nested within lists, since
          // sub-element 0 > 1 will have the same label as sub-element 1 > 0.
          // But we will assume (for now) that nested lists won't be used -- if
          // they are, this will need to be changed.
          return (
            index === 0 ? baseFocusLabel : baseFocusLabel + index.toString());
        };

        $scope.isAddItemButtonPresent = true;
        $scope.addElementText = 'Add element';
        if ($scope.uiConfig() && $scope.uiConfig().add_element_text) {
          $scope.addElementText = $scope.uiConfig().add_element_text;
        }

        // Only hide the 'add item' button in the case of single-line unicode
        // input.
        $scope.isOneLineInput = true;
        if ($scope.itemSchema().type !== 'unicode' ||
            $scope.itemSchema().hasOwnProperty('choices')) {
          $scope.isOneLineInput = false;
        } else if ($scope.itemSchema().ui_config) {
          if ($scope.itemSchema().ui_config.coding_mode) {
            $scope.isOneLineInput = false;
          } else if (
              $scope.itemSchema().ui_config.hasOwnProperty('rows') &&
              $scope.itemSchema().ui_config.rows > 2) {
            $scope.isOneLineInput = false;
          }
        }

        $scope.minListLength = null;
        $scope.maxListLength = null;
        $scope.showDuplicatesWarning = false;
        if ($scope.validators()) {
          for (var i = 0; i < $scope.validators().length; i++) {
            if ($scope.validators()[i].id === 'has_length_at_most') {
              $scope.maxListLength = $scope.validators()[i].max_value;
            } else if ($scope.validators()[i].id === 'has_length_at_least') {
              $scope.minListLength = $scope.validators()[i].min_value;
            } else if ($scope.validators()[i].id === 'is_uniquified') {
              $scope.showDuplicatesWarning = true;
            }
          }
        }

        while ($scope.localValue.length < $scope.minListLength) {
          $scope.localValue.push(
            schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
        }

        $scope.hasDuplicates = function() {
          var valuesSoFar = {};
          for (var i = 0; i < $scope.localValue.length; i++) {
            var value = $scope.localValue[i];
            if (!valuesSoFar.hasOwnProperty(value)) {
              valuesSoFar[value] = true;
            } else {
              return true;
            }
          }
          return false;
        };

        if ($scope.len === undefined) {
          $scope.addElement = function() {
            if ($scope.isOneLineInput) {
              $scope.hideAddItemButton();
            }

            $scope.localValue.push(
              schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
            focusService.setFocus(
              $scope.getFocusLabel($scope.localValue.length - 1));
          };

          var _deleteLastElementIfUndefined = function() {
            var lastValueIndex = $scope.localValue.length - 1;
            var valueToConsiderUndefined = (
              schemaUndefinedLastElementService.getUndefinedValue(
                $scope.itemSchema()));
            if ($scope.localValue[lastValueIndex] ===
                valueToConsiderUndefined) {
              $scope.deleteElement(lastValueIndex);
            }
          };

          $scope.lastElementOnBlur = function() {
            _deleteLastElementIfUndefined();
            $scope.showAddItemButton();
          };

          $scope.showAddItemButton = function() {
            $scope.isAddItemButtonPresent = true;
          };

          $scope.hideAddItemButton = function() {
            $scope.isAddItemButtonPresent = false;
          };

          $scope._onChildFormSubmit = function(evt) {
            if (!$scope.isAddItemButtonPresent) {
              /**
               * If form submission happens on last element of the set (i.e the
               * add item button is absent) then automatically add the element
               * to the list.
               */
              if (($scope.maxListLength === null ||
                   $scope.localValue.length < $scope.maxListLength) &&
                  !!$scope.localValue[$scope.localValue.length - 1]) {
                $scope.addElement();
              }
            } else {
              /**
               * If form submission happens on existing element remove focus
               * from it
               */
              document.activeElement.blur();
            }
            evt.stopPropagation();
          };

          $scope.$on('submittedSchemaBasedIntForm', $scope._onChildFormSubmit);
          $scope.$on(
            'submittedSchemaBasedFloatForm', $scope._onChildFormSubmit);
          $scope.$on(
            'submittedSchemaBasedUnicodeForm', $scope._onChildFormSubmit);

          $scope.deleteElement = function(index) {
            // Need to let the RTE know that HtmlContent has been changed.
            $scope.$broadcast('externalHtmlContentChange');
            $scope.localValue.splice(index, 1);
          };
        } else {
          if ($scope.len <= 0) {
            throw 'Invalid length for list editor: ' + $scope.len;
          }
          if ($scope.len !== $scope.localValue.length) {
            throw 'List editor length does not match length of input value: ' +
              $scope.len + ' ' + $scope.localValue;
          }
        }
      }]
    };
  }
]);

oppia.directive('schemaBasedDictEditor', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        // Read-only property. An object whose keys and values are the dict
        // properties and the corresponding schemas.
        propertySchemas: '&',
        allowExpressions: '&',
        labelForFocusTarget: '&'
      },
      templateUrl: 'schemaBasedEditor/dict',
      restrict: 'E',
      compile: recursionHelper.compile,
      controller: [
        '$scope', 'IdGenerationService',
        function($scope, IdGenerationService) {
          $scope.getHumanReadablePropertyDescription = function(property) {
            return property.description || '[' + property.name + ']';
          };

          $scope.fieldIds = {};
          for (var i = 0; i < $scope.propertySchemas().length; i++) {
            // Generate random IDs for each field.
            $scope.fieldIds[$scope.propertySchemas()[i].name] = (
              IdGenerationService.generateNewId());
          }
        }
      ]
    };
  }
]);

oppia.directive('schemaBasedCustomEditor', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        // The class of the object being edited.
        objType: '='
      },
      templateUrl: 'schemaBasedEditor/custom',
      restrict: 'E',
      compile: recursionHelper.compile
    };
  }
]);

/*********************************************************************
 *
 * DIRECTIVES FOR SCHEMA-BASED VIEWERS
 *
 *********************************************************************/
oppia.directive('schemaBasedViewer', [function() {
  return {
    scope: {
      schema: '&',
      localValue: '='
    },
    templateUrl: 'schemaBasedViewer/master',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedPrimitiveViewer', [function() {
  return {
    scope: {
      localValue: '='
    },
    templateUrl: 'schemaBasedViewer/primitive',
    restrict: 'E',
    controller: ['$scope', function($scope) {
      $scope.isExpression = function(value) {
        return angular.isString(value);
      };
    }]
  };
}]);

oppia.directive('schemaBasedUnicodeViewer', [function() {
  return {
    scope: {
      localValue: '='
    },
    templateUrl: 'schemaBasedViewer/unicode',
    restrict: 'E',
    controller: ['$scope', '$filter', '$sce', function($scope, $filter, $sce) {
      $scope.getDisplayedValue = function() {
        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')(
          $scope.localValue));
      };
    }]
  };
}]);

oppia.directive('schemaBasedHtmlViewer', [function() {
  return {
    scope: {
      localValue: '='
    },
    templateUrl: 'schemaBasedViewer/html',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedListViewer', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        // Read-only property. The schema definition for each item in the list.
        itemSchema: '&'
      },
      templateUrl: 'schemaBasedViewer/list',
      restrict: 'E',
      compile: recursionHelper.compile
    };
  }
]);

oppia.directive('schemaBasedDictViewer', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        // Read-only property. An object whose keys and values are the dict
        // properties and the corresponding schemas.
        propertySchemas: '&'
      },
      templateUrl: 'schemaBasedViewer/dict',
      restrict: 'E',
      compile: recursionHelper.compile,
      controller: ['$scope', function($scope) {
        $scope.getHumanReadablePropertyDescription = function(property) {
          return property.description || '[' + property.name + ']';
        };
      }]
    };
  }
]);

oppia.directive('schemaBasedCustomViewer', [
  'recursionHelper', function(recursionHelper) {
    return {
      scope: {
        localValue: '=',
        // The class of the object being edited.
        objType: '='
      },
      templateUrl: 'schemaBasedViewer/custom',
      restrict: 'E',
      compile: recursionHelper.compile
    };
  }
]);
