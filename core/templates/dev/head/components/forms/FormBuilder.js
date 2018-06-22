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

oppia.filter('convertHtmlToUnicode', [function() {
  return function(html) {
    return angular.element('<div>' + html + '</div>').text();
  };
}]);

oppia.filter('convertUnicodeToHtml', [
  '$sanitize', 'HtmlEscaperService',
  function($sanitize, HtmlEscaperService) {
    return function(text) {
      return $sanitize(HtmlEscaperService.unescapedStrToEscapedStr(text));
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
        assert(!currentFragmentIsParam && text.length > i + 1 && {
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
          '<oppia-parameter>' + fragment.data +
        '</oppia-parameter>');
    });
    return result;
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

oppia.directive('textAngularRte', [
  '$filter', '$timeout', 'HtmlEscaperService', 'RteHelperService',
  'textAngularManager',
  function(
      $filter, $timeout, HtmlEscaperService, RteHelperService,
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

        RteHelperService.getRichTextComponents().forEach(
          function(componentDefn) {
            if (!($scope.uiConfig() &&
                $scope.uiConfig().hide_complex_extensions &&
                componentDefn.isComplex)) {
              toolbarOptions[2].push(componentDefn.id);
            }
            var imgClassName = 'oppia-noninteractive-' +
              componentDefn.id;
            whitelistedImgClasses.push(imgClassName);
          }
        );
        $scope.toolbarOptionsJson = JSON.stringify(toolbarOptions);

        var _convertHtmlToRte = function(html) {
          return RteHelperService.convertHtmlToRte(html);
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
            var editorScope = textAngularManager.retrieveEditor(
              label).scope;
            $timeout(function() {
              editorScope.displayElements.text[0].focus();
            });
          }
        });

        $scope.$watch('tempContent', function(newVal) {
          // Sanitizing while a modal is open would delete the markers that
          // save and restore the cursor's position in the RTE.
          var displayedContent = $scope.isCustomizationModalOpen ?
            newVal :
            $filter('sanitizeHtmlForRte')(newVal);
          $scope.htmlContent = RteHelperService.convertRteToHtml(
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

oppia.filter('isInteger', [function() {
  return function(input) {
    return Number.isInteger(Number(input));
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

/* eslint-disable angular/directive-restrict */
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
              filterArgs[$filter('underscoresToCamelCase')(key)] =
                angular.copy(validatorSpec[key]);
            }
          }

          var customValidator = function(viewValue) {
            ctrl.$setValidity(
              frontendName, $filter(frontendName)(viewValue,
                filterArgs));
            return viewValue;
          };

          ctrl.$parsers.unshift(customValidator);
          ctrl.$formatters.unshift(customValidator);
        });
      }
    }
  };
}]);
/* eslint-enable angular/directive-restrict */

// This should come before 'apply-validation', if that is defined as
// an attribute on the HTML tag.

/* eslint-disable angular/directive-restrict */
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
/* eslint-enable angular/directive-restrict */

// Dynamically generate CKEditor widgets for the rich text components.
oppia.run([
  '$timeout', '$compile', '$rootScope', '$uibModal', 'RteHelperService',
  'HtmlEscaperService', 'taOptions',
  function($timeout, $compile, $rootScope, $uibModal, RteHelperService,
      HtmlEscaperService, taOptions) {
    taOptions.disableSanitizer = true;
    taOptions.forceTextAngularSanitize = false;
    taOptions.classes.textEditor = 'form-control oppia-rte-content';
    taOptions.setup.textEditorSetup = function($element) {
      $timeout(function() {
        $element.trigger('focus');
      });
    };
    var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
    _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
      // The name of the CKEditor widget corresponding to this component.
      var ckName = 'oppia' + componentDefn.id;

      // For some reason, frontend tests will error without this check.
      if (CKEDITOR.plugins.registered[ckName] !== undefined) {
        return;
      }
      var tagName = 'oppia-noninteractive-' + componentDefn.id;
      var customizationArgSpecs = componentDefn.customizationArgSpecs;
      var isInline = RteHelperService.isInlineComponent(componentDefn.id);

      // Inline components will be wrapped in a span, while block components
      // will be wrapped in a div.
      if (isInline) {
        var componentTemplate = '<span type="' + tagName + '">' +
                                '<' + tagName + '></' + tagName + '>' +
                                '</span>';
      } else {
        var componentTemplate = '<div class="oppia-rte-component-container" ' +
                                'type="' + tagName + '">' +
                                '<' + tagName + '></' + tagName + '>' +
                                '<div class="component-overlay"></div>' +
                                '</div>';
      }
      CKEDITOR.plugins.add(ckName, {
        init: function(editor) {
          // Create the widget itself.
          editor.widgets.add(ckName, {
            button: componentDefn.tooltip,
            inline: isInline,
            template: componentTemplate,
            edit: function(event) {
              editor.fire('lockSnapshot', {
                dontUpdate: true
              });
              // Prevent default action since we are using our own edit modal.
              event.cancel();
              // Save this for creating the widget later.
              var container = this.wrapper.getParent(true);
              var that = this;
              var customizationArgs = {};
              customizationArgSpecs.forEach(function(spec) {
                customizationArgs[spec.name] = that.data[spec.name] ||
                                               spec.default_value;
              });

              RteHelperService._openCustomizationModal(
                customizationArgSpecs,
                customizationArgs,
                function(customizationArgsDict) {
                  for (var arg in customizationArgsDict) {
                    if (customizationArgsDict.hasOwnProperty(arg)) {
                      that.setData(arg, customizationArgsDict[arg]);
                    }
                  }
                  if (!that.isReady()) {
                    // Actually create the widget, if we have not already.
                    editor.widgets.finalizeCreation(container);
                  }
                  // Need to manually $compile so the directive renders.
                  $compile($(that.element.$).contents())($rootScope);
                  $timeout(function() {
                    if (isInline) {
                      // Move caret after the newly created widget.
                      var range = editor.createRange();
                      var widgetContainer = that.element.getParent();
                      range.moveToPosition(
                        widgetContainer, CKEDITOR.POSITION_AFTER_END);
                      editor.getSelection().selectRanges([range]);
                      $timeout(function() {
                        editor.fire('unlockSnapshot');
                        editor.fire('saveSnapshot');
                      });
                    } else {
                      editor.fire('unlockSnapshot');
                      editor.fire('saveSnapshot');
                    }
                  });
                },
                function() {},
                function() {});
            },
            downcast: function(element) {
              element.children[0].setHtml('');
              return element.children[0];
            },
            upcast: function(element) {
              // This is how the widget is recognized by CKEditor.
              return (element.name !== 'p' &&
                      element.children.length > 0 &&
                      element.children[0].name === tagName);
            },
            data: function() {
              var that = this;
              // Set attributes of component according to data values.
              customizationArgSpecs.forEach(function(spec) {
                that.element.getChild(0).setAttribute(
                  spec.name + '-with-value',
                  HtmlEscaperService.objToEscapedJson(
                    that.data[spec.name] || ''));
              });
            },
            init: function() {
              editor.fire('lockSnapshot', {
                dontUpdate: true
              });
              var that = this;
              var isMissingAttributes = false;
              // On init, read values from component attributes and save them.
              customizationArgSpecs.forEach(function(spec) {
                var value = that.element.getChild(0).getAttribute(
                  spec.name + '-with-value');
                if (value) {
                  that.setData(
                    spec.name, HtmlEscaperService.escapedJsonToObj(value));
                } else {
                  isMissingAttributes = true;
                }
              });

              if (!isMissingAttributes) {
                // Need to manually $compile so the directive renders.
                $compile($(this.element.$).contents())($rootScope);
              }
              $timeout(function() {
                editor.fire('unlockSnapshot');
                editor.fire('saveSnapshot');
              });
            }
          });
        }
      });
    });
  }
]);

oppia.directive('ckEditorRte', [
  'RteHelperService',
  function(RteHelperService) {
    return {
      restrict: 'E',
      scope: {
        uiConfig: '&'
      },
      template: '<div><div></div>' +
                '<div contenteditable="true" class="oppia-rte">' +
                '</div></div>',
      require: '?ngModel',

      link: function(scope, el, attr, ngModel) {
        var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
        var names = [];
        var icons = [];
        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
          if (!(scope.uiConfig() &&
                scope.uiConfig().hide_complex_extensions &&
                componentDefn.isComplex)) {
            names.push(componentDefn.id);
            icons.push(componentDefn.iconDataUrl);
          }
        });

        // See format of filtering rules here:
        // http://docs.ckeditor.com/#!/guide/dev_allowed_content_rules
        // Whitelist the component tags with any attributes and classes.
        var componentRule = names.map(function(name) {
          return 'oppia-noninteractive-' + name;
        }).join(' ') + '(*)[*];';
        // Whitelist the inline component wrapper, which is a
        // span with a "type" attribute.
        var inlineWrapperRule = ' span[type];';
        // Whitelist the block component wrapper, which is a div
        // with a "type" attribute and a CSS class.
        var blockWrapperRule = ' div(oppia-rte-component-container)[type];';
        // Whitelist the transparent block component overlay, which is
        // a div with a CSS class.
        var blockOverlayRule = ' div(oppia-rte-component-overlay);';
        // Put all the rules together.
        var extraAllowedContentRules = componentRule +
                                       inlineWrapperRule +
                                       blockWrapperRule +
                                       blockOverlayRule;

        var pluginNames = names.map(function(name) {
          return 'oppia' + name;
        }).join(',');
        var buttonNames = [];
        names.forEach(function(name) {
          buttonNames.push('Oppia' + name);
          buttonNames.push('-');
        });
        buttonNames.pop();

        // Initialize CKEditor.
        var ck = CKEDITOR.inline(el[0].children[0].children[1], {
          extraPlugins: 'widget,lineutils,sharedspace,' + pluginNames,
          startupFocus: true,
          floatSpaceDockedOffsetY: 15,
          extraAllowedContent: extraAllowedContentRules,
          sharedSpaces: {
            top: el[0].children[0].children[0]
          },
          skin: 'bootstrapck,/third_party/static/ckeditor-bootstrapck/',
          toolbar: [
            {
              name: 'history',
              items: ['Undo', '-', 'Redo']
            },
            {
              name: 'basicstyles',
              items: ['Bold', '-', 'Italic', '-', 'RemoveFormat']
            },
            {
              name: 'paragraph',
              items: [
                'NumberedList', '-',
                'BulletedList', '-',
                'Outdent', '-',
                'Indent'
              ]
            },
            {
              name: 'rtecomponents',
              items: buttonNames
            },
            {
              name: 'document',
              items: ['Source']
            }
          ]
        });

        // A RegExp for matching rich text components.
        var componentRe = (
          /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g
        );

        // Before data is loaded into CKEditor, we need to wrap every rte
        // component in a span (inline) or div (block).
        // For block elements, we add an overlay div as well.
        var wrapComponents = function(html) {
          if (html === undefined) {
            return html;
          }
          return html.replace(componentRe, function(match, p1, p2, p3) {
            if (RteHelperService.isInlineComponent(p3)) {
              return '<span type="oppia-noninteractive-' + p3 + '">' +
                    match + '</span>';
            } else {
              return '<div type="oppia-noninteractive-' + p3 + '"' +
                     'class="oppia-rte-component-container">' + match +
                     '<div class="oppia-rte-component-overlay"></div></div>';
            }
          });
        };

        ck.on('instanceReady', function() {
          // Set the icons for each toolbar button.
          names.forEach(function(name, index) {
            var icon = icons[index];
            var upperCasedName = name.charAt(0).toUpperCase() + name.slice(1);
            $('.cke_button__oppia' + name)
              .css('background-image', 'url("/extensions' + icon + '")')
              .css('background-position', 'center')
              .css('background-repeat', 'no-repeat');
          });
          ck.setData(wrapComponents(ngModel.$viewValue));
        });

        // Angular rendering of components confuses CKEditor's undo system, so
        // we hide all of that stuff away from CKEditor.
        ck.on('getSnapshot', function(event) {
          if (event.data === undefined) {
            return;
          }
          event.data = event.data.replace(componentRe, function(match, p1, p2) {
            return p1 + '</' + p2 + '>';
          });
        }, null, null, 20);

        ck.on('change', function() {
          ngModel.$setViewValue(ck.getData());
        });

        ngModel.$render = function() {
          ck.setData(ngModel.$viewValue);
        };

        scope.$on('$destroy', function() {
          // Clean up CKEditor instance when directive is removed.
          ck.destroy();
        });
      }
    };
  }
]);
