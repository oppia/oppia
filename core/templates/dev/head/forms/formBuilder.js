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
 *
 * @author sll@google.com (Sean Lip)
 */

// NOTE TO DEVELOPERS: This forms framework accepts an external event
// named 'schemaBasedFormsShown'. This should be called by clients
// when these forms first come into view.


// The conditioning on window.GLOBALS.RTE_COMPONENT_SPECS is because, in the Karma
// tests, this value is undefined.
oppia.constant(
  'RTE_COMPONENT_SPECS',
  window.GLOBALS.RTE_COMPONENT_SPECS ? window.GLOBALS.RTE_COMPONENT_SPECS : {});

// Service for retrieving parameter specifications.
oppia.factory('parameterSpecsService', ['$log', function($log) {
  var paramSpecs = {};

  return {
    addParamSpec: function(paramName, paramType) {
      if (['bool', 'unicode', 'float', 'int', 'unicode'].indexOf(paramType) === -1) {
        $log.error('Invalid parameter type: ' + paramType);
        return;
      }
      paramSpecs[paramName] = {type: paramType};
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
      .replace(/([\\\{\}])/g, '\\$1')
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

oppia.filter('convertUnicodeToHtml', ['$sanitize', 'oppiaHtmlEscaper', function($sanitize, oppiaHtmlEscaper) {
  return function(text) {
    return $sanitize(oppiaHtmlEscaper.unescapedStrToEscapedStr(text));
  };
}]);

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
      if (text[i] == '\\') {
        assert(
          !currentFragmentIsParam && text.length > i + 1 &&
          {'{': true, '}': true, '\\': true}[text[i + 1]]);
        currentFragment += text[i + 1];
        i++;
      } else if (text[i] === '{') {
        assert(text.length > i + 1 && !currentFragmentIsParam && text[i + 1] === '{');
        textFragments.push({
          type: 'text',
          data: currentFragment
        });
        currentFragment = '';
        currentFragmentIsParam = true;
        i++;
      } else if (text[i] === '}') {
        assert(text.length > i + 1 && currentFragmentIsParam && text[i + 1] === '}');
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
        fragment.type === 'text' ? $filter('convertUnicodeToHtml')(fragment.data) :
        '<oppia-parameter>' + fragment.data + '</oppia-parameter>');
    });
    return result;
  };
}]);


oppia.directive('unicodeWithParametersEditor', ['$modal', '$log', 'warningsData', function($modal, $log, warningsData) {
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
      '    <button type="button" class="btn btn-default" ng-click="insertNewParameter()">+P</button>' +
      '  </span>' +
      '</div>'),
    controller: [
        '$scope', '$element', '$attrs', '$filter', '$timeout',
        function($scope, $element, $attrs, $filter, $timeout) {
      if (!$scope.allowedParameterNames().length) {
        console.error(
          'The unicode-with-parameters editor should not be used if there ' +
          'are no unicode parameters available.');
        return;
      }

      // This is a bit silly. It appears that in contenteditables (in Chrome, anyway)
      // the cursor will stubbornly remain within the oppia-parameter element (even
      // though it should be outside it). However the behavior is correct
      // for images -- so we use images to delimit it. It's still hard to do
      // selection before the element if it's the first thing in the doc,
      // after the element if it's the last thing in the doc, or between two
      // consecutive elements. See this bug for a demonstration:
      //
      //     https://code.google.com/p/chromium/issues/detail?id=242110
      var INVISIBLE_IMAGE_TAG = (
        '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></img>');
      var PARAM_CONTAINER_CLASS = 'oppia-parameter-container';

      $scope._createRteParameterTag = function(paramName) {
        var el = $(
          '<span class="' + PARAM_CONTAINER_CLASS + '" contenteditable="false">' +
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
          return $scope._createRteParameterTag(this.textContent)
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
          controller: ['$scope', '$modalInstance', 'allowedParameterNames', function(
              $scope, $modalInstance, allowedParameterNames) {
            $scope.currentParamName = currentParamName;
            $scope.paramOptions = allowedParameterNames.map(function(paramName) {
              return {
                name: paramName,
                value: paramName
              };
            });

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };

            $scope.save = function(paramName) {
              $modalInstance.close(paramName);
            };
          }]
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
      $scope.$watch('localValue', function(newValue, oldValue) {
        if (!$scope.currentlyEditing) {
          // This is an external change.
          rteContentMemento = $scope._convertUnicodeToRte($scope.localValue);
          $(rteNode).wysiwyg('setContent', rteContentMemento);
        }
      }, true);

      $scope._normalizeRteContent = function(content) {
        // TODO(sll): Write this method to validate rather than just normalize.

        // The only top-level tags should be oppia-parameter tags. Each of these
        // tags should have a contenteditable=false attribute, a dblclick handler
        // that opens the parameter modal, and content consisting of a valid
        // parameter name of type unicode surrounded by two invisible image
        // tags.
        var elt = $('<div>' + content + '</div>');
        elt.find('.' + PARAM_CONTAINER_CLASS).replaceWith(function() {
          return $scope._createRteParameterTag(this.textContent.trim())
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
              var aKey = 65, cKey = 67, xKey = 88, zKey = 90;
              var vKey = 86;
              if (e.ctrlKey) {
                if (e.keyCode === 86) {
                  e.preventDefault();
                  alert('Pasting in string input fields is currently not supported. Sorry about that!');
                } else if (e.keyCode !== aKey && e.keyCode !== cKey && e.keyCode !== xKey && e.keyCode !== zKey) {
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
            save: function(e) {
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
              } catch(unusedException) {
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
                  $scope.localValue = $scope._convertRteToUnicode(normalizedContent);
                  // TODO(sll): This is a somewhat hacky solution. Can it be cleaned up?
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
          result[schema.properties[i].name] = this.getDefaultValue(schema.properties[i].schema);
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



// Directive for the rich text editor component.
oppia.directive('richTextEditor', [
  '$modal', '$filter', '$log', '$timeout', 'oppiaHtmlEscaper', 'RTE_COMPONENT_SPECS',
  function($modal, $filter, $log, $timeout, oppiaHtmlEscaper, RTE_COMPONENT_SPECS) {
    return {
      restrict: 'E',
      scope: {
        htmlContent: '=',
        disallowOppiaRteComponents: '@',
        // Optional string; allowed values are 'small' or 'large'.
        size: '@'
      },
      template: '<textarea rows="7" ng-disabled="!hasFullyLoaded"></textarea>',
      controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
        $scope.disallowOppiaRteComponents = (
          $scope.disallowOppiaRteComponents || false);

        var rteNode = $element[0].firstChild;
        // A pointer to the editorDoc in the RTE iframe. Populated when the RTE is
        // initialized.
        $scope.editorDoc = null;

        // Creates a dict.
        $scope._createCustomizationArgDictFromAttrs = function(attrs) {
          var customizationArgsDict = {};
          for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            if (attr.name == 'class' || attr.name == 'src') {
              continue;
            }
            var separatorLocation = attr.name.indexOf('-with-value');
            if (separatorLocation === -1) {
              $log.error('RTE Error: invalid customization attribute ' + attr.name);
              continue;
            }
            var argName = attr.name.substring(0, separatorLocation);
            customizationArgsDict[argName] = oppiaHtmlEscaper.escapedJsonToObj(attr.value);
          }
          return customizationArgsDict;
        };

        $scope._createRteElement = function(componentDefn, customizationArgsDict) {
          var el = $('<img/>');
          el.attr('src', componentDefn.iconDataUrl);
          el.addClass('oppia-noninteractive-' + componentDefn.name);

          for (var attrName in customizationArgsDict) {
            el.attr(
              $filter('camelCaseToHyphens')(attrName) + '-with-value',
              oppiaHtmlEscaper.objToEscapedJson(customizationArgsDict[attrName]));
          }

          var domNode = el.get(0);
          // This dblclick handler is stripped in the initial HTML --> RTE conversion,
          // so it needs to be reinstituted after the jwysiwyg iframe is loaded.
          domNode.ondblclick = function() {
            el.addClass('insertionPoint');
            $scope.openRteCustomizationModal(componentDefn, customizationArgsDict);
          };

          return domNode;
        };

        // Replace <oppia-noninteractive> tags with <img> tags.
        $scope._convertHtmlToRte = function(html) {
          var elt = $('<div>' + html + '</div>');

          $scope._RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
            elt.find('oppia-noninteractive-' + componentDefn.name).replaceWith(function() {
              return $scope._createRteElement(
                componentDefn, $scope._createCustomizationArgDictFromAttrs(this.attributes));
            });
          });

          return elt.html();
        };

        // Replace <img> tags with <oppia-noninteractive> tags.
        $scope._convertRteToHtml = function(rte) {
          var elt = $('<div>' + rte + '</div>');

          $scope._RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
            elt.find('img.oppia-noninteractive-' + componentDefn.name).replaceWith(function() {
              var jQueryElt = $('<' + this.className + '/>');
              for (var i = 0; i < this.attributes.length; i++) {
                var attr = this.attributes[i];
                if (attr.name !== 'class' && attr.name !== 'src') {
                  jQueryElt.attr(attr.name, attr.value);
                }
              }
              return jQueryElt.get(0);
            });
          });

          return elt.html();
        };

        $scope.openRteCustomizationModal = function(componentDefn, attrsCustomizationArgsDict) {
          $modal.open({
            templateUrl: 'modals/customizeRteComponent',
            backdrop: true,
            resolve: {
              customizationArgSpecs: function() {
                return componentDefn.customization_arg_specs;
              },
              attrsCustomizationArgsDict: function() {
                return attrsCustomizationArgsDict;
              }
            },
            controller: [
              '$scope', '$modalInstance', 'customizationArgSpecs', 'attrsCustomizationArgsDict',
              function($scope, $modalInstance, customizationArgSpecs, attrsCustomizationArgsDict) {
                $scope.customizationArgSpecs = customizationArgSpecs;

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

                $scope.save = function(customizationArgs) {
                  $scope.$broadcast('externalSave');

                  var customizationArgsDict = {};
                  for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                    var caName = $scope.tmpCustomizationArgs[i].name;
                    customizationArgsDict[caName] = $scope.tmpCustomizationArgs[i].value;
                  }

                  $modalInstance.close(customizationArgsDict);
                };
              }
            ]
          }).result.then(function(customizationArgsDict) {
            var el = $scope._createRteElement(componentDefn, customizationArgsDict);
            var insertionPoint = $scope.editorDoc.querySelector('.insertionPoint');
            insertionPoint.parentNode.replaceChild(el, insertionPoint);
            $(rteNode).wysiwyg('save');
          }, function () {
            var insertionPoint = $scope.editorDoc.querySelector('.insertionPoint');
            insertionPoint.className = insertionPoint.className.replace(/\binsertionPoint\b/, '');
          });
        };

        $scope.currentlyEditing = false;
        $scope.$watch('htmlContent', function(newValue, oldValue) {
          if ($scope.hasFullyLoaded && !$scope.currentlyEditing) {
            // This is an external change.
            console.log($scope.htmlContent);
            $scope.rteContent = $scope._convertHtmlToRte(newValue);
            $(rteNode).wysiwyg('setContent', $scope.rteContent);
          }
        });

        $scope._saveContent = function() {
          var content = $(rteNode).wysiwyg('getContent');
          if (content !== null && content !== undefined) {
            // The following $timeout removes the '$apply in progress' errors.
            $timeout(function() {
              $scope.$apply(function() {
                $scope.currentlyEditing = true;
                $scope.htmlContent = $scope._convertRteToHtml(content);
                // TODO(sll): This is a somewhat hacky solution. Can it be cleaned up?
                $timeout(function() {
                  $scope.currentlyEditing = false;
                }, 50);
              });
            });
          }
        };

        $scope.$on('externalSave', function() {
          $scope._saveContent();
        });

        $scope.hasFullyLoaded = false;

        $scope.init = function() {
          $scope._RICH_TEXT_COMPONENTS = [];
          if (!$scope.disallowOppiaRteComponents) {
            var componentIds = Object.keys(RTE_COMPONENT_SPECS);
            componentIds.sort().forEach(function(componentId) {
              RTE_COMPONENT_SPECS[componentId].backendName = RTE_COMPONENT_SPECS[componentId].backend_name;
              RTE_COMPONENT_SPECS[componentId].name = RTE_COMPONENT_SPECS[componentId].frontend_name;
              RTE_COMPONENT_SPECS[componentId].iconDataUrl = RTE_COMPONENT_SPECS[componentId].icon_data_url;
              $scope._RICH_TEXT_COMPONENTS.push(RTE_COMPONENT_SPECS[componentId]);
            });
          }

          $scope.rteContent = $scope._convertHtmlToRte($scope.htmlContent);

          var sizeClass = (
            $scope.size == 'small' ? ' wysiwyg-content-small' :
            $scope.size == 'large' ? ' wysiwyg-content-large' :
            '');

          // This is needed for tests, otherwise $(rteNode).wysiwyg is undefined.
          $timeout(function() {
            $(rteNode).wysiwyg({
              autoGrow: true,
              autoSave: true,
              controls: {
                bold: {groupIndex: 2, visible: true},
                italic: {groupIndex: 2, visible: true},
                underline: {groupIndex: 2, visible: true},
                undo: {groupIndex: 2, visible: true},
                redo: {groupIndex: 2, visible: true},
                indent: {groupIndex: 2, visible: true},
                outdent: {groupIndex: 2, visible: true},
                insertOrderedList: {groupIndex: 2, visible: true},
                insertUnorderedList: {groupIndex: 2, visible: true},
                insertHorizontalRule: {groupIndex: 2, visible: true},
                insertTable: {groupIndex: 2, visible: true},
                code: {groupIndex: 2, visible: true},
                removeFormat: {groupIndex: 2, visible: true}
              },
              css: '/css/rte_multiline.css',
              debug: true,
              events: {
                save: function(event) {
                  $scope._saveContent();
                }
              },
              iFrameClass: 'wysiwyg-content' + sizeClass,
              initialContent: $scope.rteContent,
              resizeOptions: true,
              rmUnusedControls: true
            });

            // Add controls for the additional components to the RTE.
            $scope._RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
              $(rteNode).wysiwyg('addControl', componentDefn.name, {
                groupIndex: 1,
                icon: componentDefn.iconDataUrl,
                tooltip: componentDefn.tooltip,
                tags: [],
                visible: true,
                exec: function() {
                  $(rteNode).wysiwyg(
                      'insertHtml', '<span class="insertionPoint"></span>');
                  $scope.openRteCustomizationModal(componentDefn, {});
                }
              });
            });

            $scope.editorDoc = $(rteNode).wysiwyg('document')[0].body;

            // Add dblclick handlers to the various nodes.
            $scope._RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
              var elts = Array.prototype.slice.call(
                $scope.editorDoc.querySelectorAll(
                  '.oppia-noninteractive-' + componentDefn.name));
              elts.forEach(function(elt) {
                elt.ondblclick = function() {
                  this.className += ' insertionPoint';
                  $scope.openRteCustomizationModal(
                    componentDefn,
                    $scope._createCustomizationArgDictFromAttrs(this.attributes)
                  );
                };
              });
            });

            // Disable jquery.ui.dialog so that the link control works correctly.
            $.fn.dialog = null;

            $(rteNode).wysiwyg('focus');
            $scope.hasFullyLoaded = true;
          });
        };

        $scope.init();
      }]
    };
  }
]);


// Add RTE extensions to textAngular toolbar options.
oppia.config(['$provide', function($provide) {
  $provide.decorator('taOptions', [
      'taRegisterTool', '$delegate', '$modal', '$filter', 'oppiaHtmlEscaper', 'RTE_COMPONENT_SPECS',
      function(taRegisterTool, taOptions, $modal, $filter, oppiaHtmlEscaper, RTE_COMPONENT_SPECS) {

		taOptions.disableSanitizer = true;
    taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo']
    ];

    var _RICH_TEXT_COMPONENTS = [];

    var createRteElement = function(componentDefn, customizationArgsDict) {
      var el = $('<img/>');
      el.attr('src', componentDefn.iconDataUrl);
      el.addClass('oppia-noninteractive-' + componentDefn.name);

      for (var attrName in customizationArgsDict) {
        el.attr(
          $filter('camelCaseToHyphens')(attrName) + '-with-value',
          oppiaHtmlEscaper.objToEscapedJson(customizationArgsDict[attrName]));
      }

      var domNode = el.get(0);
      return domNode;
    };

    var componentIds = Object.keys(RTE_COMPONENT_SPECS);
    componentIds.sort().forEach(function(componentId) {
      RTE_COMPONENT_SPECS[componentId].backendName = RTE_COMPONENT_SPECS[componentId].backend_name;
      RTE_COMPONENT_SPECS[componentId].name = RTE_COMPONENT_SPECS[componentId].frontend_name;
      RTE_COMPONENT_SPECS[componentId].iconDataUrl = RTE_COMPONENT_SPECS[componentId].icon_data_url;
      _RICH_TEXT_COMPONENTS.push(RTE_COMPONENT_SPECS[componentId]);
    });

    _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
      taRegisterTool(componentDefn.name, {
        buttontext: componentDefn.name,
        action: function() {
          var textAngular = this;
          textAngular.$editor().wrapSelection('insertHtml', '<span class="insertionPoint"></span>')
          $modal.open({
            templateUrl: 'modals/customizeRteComponent',  
            backdrop: 'static',
            resolve: {
              customizationArgSpecs: function() {
                return componentDefn.customization_arg_specs;
              }
            },
            controller: ['$scope', '$modalInstance', 'customizationArgSpecs',
                         function($scope, $modalInstance, customizationArgSpecs) {
              var attrsCustomizationArgsDict = {};

              $scope.customizationArgSpecs = customizationArgSpecs;
              console.log($scope.customizationArgSpecs);

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

              $scope.save = function(customizationArgs) {
                $scope.$broadcast('externalSave');

                var customizationArgsDict = {};
                for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                  var caName = $scope.tmpCustomizationArgs[i].name;
                  customizationArgsDict[caName] = $scope.tmpCustomizationArgs[i].value;
                }

                $modalInstance.close(customizationArgsDict);
              };
            }]
          }).result.then(function(customizationArgsDict) {
            var el = createRteElement(componentDefn, customizationArgsDict);
            var insertionPoint = textAngular.$editor().displayElements.text[0].querySelector('.insertionPoint');
            var parent = insertionPoint.parentNode;
            parent.replaceChild(el, insertionPoint);
            textAngular.$editor().updateTaBindtaTextElement();
          });
        }
      });

      taOptions.toolbar[3].push(componentDefn.name);
    });

    return taOptions;
  }]);
}]);

oppia.directive('textAngularRte', ['taApplyCustomRenderers', '$filter', 'oppiaHtmlEscaper', 'RTE_COMPONENT_SPECS',
  function(taApplyCustomRenderers, $filter, oppiaHtmlEscaper, RTE_COMPONENT_SPECS) {
  return {
    restrict: 'E',
    scope: {
      htmlContent: '=',
    },
    template: '<div text-angular="" ng-model="tempContent">',
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs){
      var _RICH_TEXT_COMPONENTS = [];
      var componentIds = Object.keys(RTE_COMPONENT_SPECS);
      componentIds.sort().forEach(function(componentId) {
        RTE_COMPONENT_SPECS[componentId].backendName = RTE_COMPONENT_SPECS[componentId].backend_name;
        RTE_COMPONENT_SPECS[componentId].name = RTE_COMPONENT_SPECS[componentId].frontend_name;
        RTE_COMPONENT_SPECS[componentId].iconDataUrl = RTE_COMPONENT_SPECS[componentId].icon_data_url;
        _RICH_TEXT_COMPONENTS.push(RTE_COMPONENT_SPECS[componentId]);
      });

      // Creates a dict.
      var createCustomizationArgDictFromAttrs = function(attrs) {
        var customizationArgsDict = {};
        for (var i = 0; i < attrs.length; i++) {
          var attr = attrs[i];
          if (attr.name == 'class' || attr.name == 'src') {
            continue;
          }
          var separatorLocation = attr.name.indexOf('-with-value');
          if (separatorLocation === -1) {
            $log.error('RTE Error: invalid customization attribute ' + attr.name);
            continue;
          }
          var argName = attr.name.substring(0, separatorLocation);
          customizationArgsDict[argName] = oppiaHtmlEscaper.escapedJsonToObj(attr.value);
        }
        return customizationArgsDict;
      };

      // Replace <oppia-noninteractive> tags with <img> tags.
      var convertHtmlToRte = function(html) {
        var elt = $('<div>' + html + '</div>');

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          elt.find('oppia-noninteractive-' + componentDefn.name).replaceWith(function() {
            return createRteElement(
            componentDefn, createCustomizationArgDictFromAttrs(this.attributes));
          });
        });

        return elt.html();
      };

      var createRteElement = function(componentDefn, customizationArgsDict) {
        var el = $('<img/>');
        el.attr('src', componentDefn.iconDataUrl);
        el.addClass('oppia-noninteractive-' + componentDefn.name);

        for (var attrName in customizationArgsDict) {
          el.attr(
          $filter('camelCaseToHyphens')(attrName) + '-with-value',
          oppiaHtmlEscaper.objToEscapedJson(customizationArgsDict[attrName]));
        }

        var domNode = el.get(0);
        return domNode;
      };

      // Replace <img> tags with <oppia-noninteractive> tags.
      var convertRteToHtml = function(rte) {
        var elt = $('<div>' + rte + '</div>');

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          elt.find('img.oppia-noninteractive-' + componentDefn.name).replaceWith(function() {
            var jQueryElt = $('<' + this.className + '/>');
            for (var i = 0; i < this.attributes.length; i++) {
              var attr = this.attributes[i];
              if (attr.name !== 'class' && attr.name !== 'src') {
                jQueryElt.attr(attr.name, attr.value);
              }
            }
            return jQueryElt.get(0);
          });
        });

        return elt.html();
      };

      var replaceWithPlaceholder = function(raw){
        var converted;
        var openingTag = /<iframe/g;
        var closingTag = /><\/iframe>/g;
        var srcAttr = /src="[^\s]*"/g;
        converted = raw.replace(openingTag, '<img');
        converted = converted.replace(closingTag, '/>');
        converted = converted.replace(srcAttr, 'src=""');
        return converted;
      };

      $scope.init = function(){
        $scope.tempContent = convertHtmlToRte(replaceWithPlaceholder($scope.htmlContent));
      };

      $scope.init();

      $scope.$watch(function(){return $scope.tempContent}, function(newVal, oldVal){
        $scope.htmlContent = convertRteToHtml(taApplyCustomRenderers(newVal));
      });
    }],
  };
}]);



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
    // TODO(sll): Accept expressions (like '2.') with nothing after the decimal
    // point.
    var FLOAT_REGEXP = /^\-?\d*((\.|\,)\d+)?$/;

    var viewValue = '';
    try {
      var viewValue = input.toString();
    } catch(e) {
      return undefined;
    }

    if (viewValue !== '' && viewValue !== '-' && FLOAT_REGEXP.test(viewValue)) {
      return parseFloat(viewValue.replace(',', '.'));
    }
    return undefined;
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
          var frontendName = $filter('underscoresToCamelCase')(validatorSpec.id);

          // Note that there may not be a corresponding frontend filter for
          // each backend validator.
          try {
            $filter(frontendName);
          } catch(err) {
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
//   https://stackoverflow.com/questions/14430655/recursion-in-angular-directives
oppia.factory('recursionHelper', ['$compile', function($compile){
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s)
     *     registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function(element, link){
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = {post: link};
      }

      // Break the recursion loop by removing the contents,
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        post: function(scope, element){
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

oppia.directive('schemaBasedChoicesEditor', ['recursionHelper', function(recursionHelper) {
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
        delete readonlySchema['choices'];
        return readonlySchema;
      };
    }]
  };
}]);

oppia.directive('schemaBasedExpressionEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      // TODO(sll): Currently only takes a string which is either 'bool', 'int' or 'float'.
      // May need to generalize.
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
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      if ($scope.allowExpressions()) {
        $scope.paramNames = parameterSpecsService.getAllParamsOfType('bool');
        $scope.expressionMode = angular.isString($scope.localValue);

        $scope.$watch('localValue', function(newValue, oldValue) {
          $scope.expressionMode = angular.isString(newValue);
        });

        $scope.toggleExpressionMode = function() {
          $scope.expressionMode = !$scope.expressionMode;
          $scope.localValue = $scope.expressionMode ? $scope.paramNames[0] : false;
        };
      }
    }]
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
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
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

        $scope.$watch('localValue', function(newValue, oldValue) {
          $scope.expressionMode = angular.isString(newValue);
        });

        $scope.toggleExpressionMode = function() {
          $scope.expressionMode = !$scope.expressionMode;
          $scope.localValue = $scope.expressionMode ? $scope.paramNames[0] : 0;
        };
      }
    }]
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
        function($scope, $filter, $timeout, parameterSpecsService) {
      $scope.hasLoaded = false;
      $scope.isInputInFocus = false;
      $scope.hasFocusedAtLeastOnce = false;

      $scope.validate = function(localValue) {
        return $filter('isFloat')(localValue) !== undefined;
      };

      $scope.onFocus = function() {
        $scope.isInputInFocus = true;
        $scope.hasFocusedAtLeastOnce = true;
        if ($scope.onInputFocus) {
          $scope.onInputFocus();
        }
      };

      $scope.onBlur = function() {
        $scope.isInputInFocus = false;
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
          $scope.$emit('submittedSchemaBasedFloatForm');
        }
      };

      if ($scope.localValue === undefined) {
        $scope.localValue = 0.0;
      }

      if ($scope.allowExpressions()) {
        $scope.paramNames = parameterSpecsService.getAllParamsOfType('float');
        $scope.expressionMode = angular.isString($scope.localValue);

        $scope.$watch('localValue', function(newValue, oldValue) {
          $scope.expressionMode = angular.isString(newValue);
        });

        $scope.toggleExpressionMode = function() {
          $scope.expressionMode = !$scope.expressionMode;
          $scope.localValue = $scope.expressionMode ? $scope.paramNames[0] : 0.0;
        };
      }

      // This prevents the red 'invalid input' warning message from flashing
      // at the outset.
      $timeout(function() {
        $scope.hasLoaded = true;
      });
    }]
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
      $scope.allowedParameterNames = parameterSpecsService.getAllParamsOfType('unicode');
      $scope.doUnicodeParamsExist = ($scope.allowedParameterNames.length > 0);

      if ($scope.uiConfig() && $scope.uiConfig().rows && $scope.doUnicodeParamsExist) {
        $scope.doUnicodeParamsExist = false;
        console.log('Multi-row unicode fields with parameters are not currently supported.');
      }

      if ($scope.uiConfig() && $scope.uiConfig().coding_mode) {
        // Flag that is flipped each time the codemirror view is
        // shown. (The codemirror instance needs to be refreshed
        // every time it is unhidden.)
        $scope.codemirrorStatus = false;
        var CODING_MODE_NONE = 'none';

        $scope.codemirrorOptions = {
          lineNumbers: true,
          indentWithTabs: true,
        }
        if ($scope.isDisabled()) {
          $scope.codemirrorOptions.readOnly = 'nocursor';
        }
        // Note that only 'coffeescript', 'javascript', 'lua', 'python', 'ruby' and
        // 'scheme' have CodeMirror-supported syntax highlighting. For other
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
        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')($scope.localValue));
      };
    }]
  };
}]);

// TODO(sll): The 'Cancel' button should revert the text in the HTML box to its
// original state.
// TODO(sll): The RTE extensions in the RTE do not work.
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
    restrict: 'E',
    controller: ['$scope', function($scope) {
      $scope.getSize = function() {
        if (!$scope.uiConfig()) {
          return null;
        } else {
          return $scope.uiConfig().size;
        }
      };
    }]
  };
}]);

oppia.directive('schemaBasedListEditor', [
    'schemaDefaultValueService', 'recursionHelper', 'focusService',
    'schemaUndefinedLastElementService',
    function(
      schemaDefaultValueService, recursionHelper, focusService,
      schemaUndefinedLastElementService) {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      // Read-only property. The schema definition for each item in the list.
      itemSchema: '&',
      // The length of the list. If not specified, the list is of arbitrary length.
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
      var baseFocusLabel = $scope.labelForFocusTarget() || Math.random().toString(36).slice(2) + '-';
      $scope.getFocusLabel = function(index) {
        // Treat the first item in the list as a special case -- if this list is
        // contained in another list, and the outer list is opened with a desire
        // to autofocus on the first input field, we can then focus on the given
        // $scope.labelForFocusTarget().
        // NOTE: This will cause problems for lists nested within lists, since
        // sub-element 0 > 1 will have the same label as sub-element 1 > 0. But we
        // will assume (for now) that nested lists won't be used -- if they are,
        // this will need to be changed.
        return index === 0 ? baseFocusLabel : baseFocusLabel + index.toString();
      };

      $scope.isAddItemButtonPresent = true;
      $scope.addElementText = 'Add element';
      if ($scope.uiConfig() && $scope.uiConfig().add_element_text) {
        $scope.addElementText = $scope.uiConfig().add_element_text;
      }

      // Only hide the 'add item' button in the case of single-line unicode input.
      $scope.isOneLineInput = true;
      if ($scope.itemSchema().type !== 'unicode' || $scope.itemSchema().hasOwnProperty('choices')) {
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
      if ($scope.validators()) {
        for (var i = 0; i < $scope.validators().length; i++) {
          if ($scope.validators()[i].id === 'has_length_at_most') {
            $scope.maxListLength = $scope.validators()[i].max_value;
          } else if ($scope.validators()[i].id === 'has_length_at_least') {
            $scope.minListLength = $scope.validators()[i].min_value;
          }
        }
      }

      while ($scope.localValue.length < $scope.minListLength) {
        $scope.localValue.push(
          schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
      }

      if ($scope.len === undefined) {
        $scope.addElement = function() {
          if ($scope.isOneLineInput) {
            $scope.hideAddItemButton();
          }

          $scope.localValue.push(
            schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
          focusService.setFocus($scope.getFocusLabel($scope.localValue.length - 1));
        };

        var _deleteLastElementIfUndefined = function() {
          var lastValueIndex = $scope.localValue.length - 1;
          var valueToConsiderUndefined = (
            schemaUndefinedLastElementService.getUndefinedValue($scope.itemSchema()));
          if ($scope.localValue[lastValueIndex] === valueToConsiderUndefined) {
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
             * If form submission happens on last element of the set (i.e the add item button is absent)
             * then automatically add the element to the list.
             */
            if (($scope.maxListLength === null || $scope.localValue.length < $scope.maxListLength) &&
                !!$scope.localValue[$scope.localValue.length - 1]) {
              $scope.addElement();
            }
          } else {
            /** 
             * If form submission happens on existing element remove focus from it
             */
             document.activeElement.blur();
          }
          evt.stopPropagation();
        };

        $scope.$on('submittedSchemaBasedIntForm', $scope._onChildFormSubmit);
        $scope.$on('submittedSchemaBasedFloatForm', $scope._onChildFormSubmit);
        $scope.$on('submittedSchemaBasedUnicodeForm', $scope._onChildFormSubmit);

        $scope.deleteElement = function(index) {
          $scope.localValue.splice(index, 1);
        };
      } else {
        if ($scope.len <= 0) {
          throw 'Invalid length for list editor: ' + $scope.len;
        }
        if ($scope.len != $scope.localValue.length) {
          throw 'List editor length does not match length of input value: ' +
            $scope.len + ' ' + $scope.localValue;
        }
      }
    }]
  };
}]);

oppia.directive('schemaBasedDictEditor', ['recursionHelper', function(recursionHelper) {
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
    controller: ['$scope', function($scope) {
      $scope.getHumanReadablePropertyDescription = function(property) {
        return property.description || '[' + property.name + ']';
      };

      $scope.fieldIds = {};
      for (var i = 0; i < $scope.propertySchemas().length; i++) {
        // Generate random IDs for each field.
        $scope.fieldIds[$scope.propertySchemas()[i].name] = Math.random().toString(36).slice(2);
      }
    }]
  };
}]);

oppia.directive('schemaBasedCustomEditor', ['recursionHelper', function(recursionHelper) {
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
}]);


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
        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')($scope.localValue));
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

oppia.directive('schemaBasedListViewer', ['recursionHelper', function(recursionHelper) {
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
}]);

oppia.directive('schemaBasedDictViewer', ['recursionHelper', function(recursionHelper) {
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
}]);

oppia.directive('schemaBasedCustomViewer', ['recursionHelper', function(recursionHelper) {
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
}]);
