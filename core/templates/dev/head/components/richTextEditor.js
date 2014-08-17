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
 * @fileoverview Directive for the rich text editor component.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('richTextEditor', [
  '$modal', '$filter', '$log', '$timeout', 'oppiaHtmlEscaper', 'widgetDefinitionsService',
  function($modal, $filter, $log, $timeout, oppiaHtmlEscaper, widgetDefinitionsService) {
    return {
      restrict: 'E',
      scope: {
        htmlContent: '=',
        disallowOppiaWidgets: '@'
      },
      template: '<textarea rows="7" ng-disabled="!hasFullyLoaded"></textarea>',
      controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
        $scope.disallowOppiaWidgets = ($scope.disallowOppiaWidgets || false);

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

        $scope._createRteElement = function(widgetDefinition, customizationArgsDict) {
          var el = $('<img/>');
          el.attr('src', widgetDefinition.iconDataUrl);
          el.addClass('oppia-noninteractive-' + widgetDefinition.name);

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
            $scope.openRteCustomizationModal(widgetDefinition, customizationArgsDict);
          };

          return domNode;
        };

        // Replace <oppia-noninteractive> tags with <img> tags.
        $scope._convertHtmlToRte = function(html) {
          var elt = $('<div>' + html + '</div>');

          $scope._NONINTERACTIVE_WIDGETS.forEach(function(widgetDefn) {
            elt.find('oppia-noninteractive-' + widgetDefn.name).replaceWith(function() {
              return $scope._createRteElement(
                widgetDefn, $scope._createCustomizationArgDictFromAttrs(this.attributes));
            });
          });

          return elt.html();
        };

        // Replace <img> tags with <oppia-noninteractive> tags.
        $scope._convertRteToHtml = function(rte) {
          var elt = $('<div>' + rte + '</div>');

          $scope._NONINTERACTIVE_WIDGETS.forEach(function(widgetDefn) {
            elt.find('img.oppia-noninteractive-' + widgetDefn.name).replaceWith(function() {
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

        $scope.openRteCustomizationModal = function(widgetDefinition, attrsCustomizationArgsDict) {
          $modal.open({
            templateUrl: 'modals/customizeWidget',
            backdrop: 'static',
            resolve: {
              widgetDefinition: function() {
                return widgetDefinition;
              },
              attrsCustomizationArgsDict: function() {
                return attrsCustomizationArgsDict;
              }
            },
            controller: [
              '$scope', '$modalInstance', 'widgetDefinition', 'attrsCustomizationArgsDict',
              function($scope, $modalInstance, widgetDefinition, attrsCustomizationArgsDict) {
                $scope.widgetDefinition = widgetDefinition;

                $scope.customizationArgsList = angular.copy(widgetDefinition.customization_args);
                for (var i = 0; i < $scope.customizationArgsList.length; i++) {
                  var caName = $scope.customizationArgsList[i].name;
                  if (attrsCustomizationArgsDict.hasOwnProperty(caName)) {
                    $scope.customizationArgsList[i].value = attrsCustomizationArgsDict[caName];
                  } else {
                    $scope.customizationArgsList[i].value = $scope.customizationArgsList[i].default_value;
                  }
                }

                $scope.cancel = function() {
                  $modalInstance.dismiss('cancel');
                };

                $scope.save = function(customizationArgs) {
                  var customizationArgsDict = {};
                  for (var i = 0; i < $scope.customizationArgsList.length; i++) {
                    var caName = $scope.customizationArgsList[i].name;
                    customizationArgsDict[caName] = $scope.customizationArgsList[i].value;
                  }

                  $modalInstance.close({
                    customizationArgsDict: customizationArgsDict,
                    widgetDefinition: $scope.widgetDefinition
                  });
                };
              }
            ]
          }).result.then(function(result) {
            var el = $scope._createRteElement(result.widgetDefinition, result.customizationArgsDict);
            var insertionPoint = $scope.editorDoc.querySelector('.insertionPoint');
            insertionPoint.parentNode.replaceChild(el, insertionPoint);
            $(rteNode).wysiwyg('save');
          }, function () {
            var insertionPoint = $scope.editorDoc.querySelector('.insertionPoint');
            insertionPoint.className = insertionPoint.className.replace(/\binsertionPoint\b/, '');
          });
        };

        $scope._saveContent = function() {
          var content = $(rteNode).wysiwyg('getContent');
          if (content !== null && content !== undefined) {
            $scope.htmlContent = $scope._convertRteToHtml(content);
            // The following $timeout removes the '$apply in progress' errors.
            $timeout(function() {
              $scope.$apply();
            });
          }
        };

        $scope.$on('externalSave', function() {
          $scope._saveContent();
        });

        $scope.hasFullyLoaded = false;

        $scope.init = function() {
          widgetDefinitionsService.getNoninteractiveDefinitions().then(function(widgetDefns) {
            $scope._NONINTERACTIVE_WIDGETS = [];
            if (!$scope.disallowOppiaWidgets) {
              for (var widgetId in widgetDefns) {
                widgetDefns[widgetId].backendName = widgetDefns[widgetId].name;
                widgetDefns[widgetId].name = widgetDefns[widgetId].frontend_name;
                widgetDefns[widgetId].iconDataUrl = widgetDefns[widgetId].icon_data_url;
                $scope._NONINTERACTIVE_WIDGETS.push(widgetDefns[widgetId]);
              }
            }

            $scope.rteContent = $scope._convertHtmlToRte($scope.htmlContent);

            $(rteNode).wysiwyg({
              autoGrow: true,
              autoSave: true,
              controls: {
                createLink: {visible: false},
                h1: {visible: false},
                h2: {visible: false},
                h3: {visible: false},
                insertImage: {visible: false},
                justifyCenter: {visible: false},
                justifyFull: {visible: false},
                justifyLeft: {visible: false},
                justifyRight: {visible: false},
                strikeThrough: {visible: false},
                subscript: {visible: false},
                superscript: {visible: false},
                unLink: {visible: false}
              },
              css: '/css/rte.css',
              debug: true,
              events: {
                save: function(event) {
                  $scope._saveContent();
                }
              },
              iFrameClass: 'wysiwyg-content',
              initialContent: $scope.rteContent,
              initialMinHeight: '150px',
              resizeOptions: true
            });

            // Add the non-interactive widget controls to the RTE.
            $scope._NONINTERACTIVE_WIDGETS.forEach(function(widgetDefinition) {
              $(rteNode).wysiwyg('addControl', widgetDefinition.name, {
                groupIndex: 7,
                icon: widgetDefinition.iconDataUrl,
                tooltip: widgetDefinition.tooltip,
                tags: [],
                visible: true,
                exec: function() {
                  $(rteNode).wysiwyg(
                      'insertHtml', '<span class="insertionPoint"></span>');
                  $scope.openRteCustomizationModal(widgetDefinition, {});
                }
              });
            });

            $scope.editorDoc = $(rteNode).wysiwyg('document')[0].body;

            // Add dblclick handlers to the various nodes.
            $scope._NONINTERACTIVE_WIDGETS.forEach(function(widgetDefinition) {
              var elts = Array.prototype.slice.call(
                $scope.editorDoc.querySelectorAll(
                  '.oppia-noninteractive-' + widgetDefinition.name));
              elts.forEach(function(elt) {
                elt.ondblclick = function() {
                  this.className += ' insertionPoint';
                  $scope.openRteCustomizationModal(
                    widgetDefinition,
                    $scope._createCustomizationArgDictFromAttrs(this.attributes)
                  );
                };
              });
            });

            // Disable jquery.ui.dialog so that the link control works correctly.
            $.fn.dialog = null;

            $scope.hasFullyLoaded = true;
          });
        };

        $scope.init();
      }]
    };
  }
]);
