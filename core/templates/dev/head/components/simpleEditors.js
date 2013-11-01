// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Directives for reusable simple editor components.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('select2Dropdown', function() {
  // Directive for incorporating select2 dropdowns.
  return {
    restrict: 'E',
    scope: {
      choices: '=',
      item: '=',
      newChoiceRegex: '@',
      placeholder: '@',
      width: '@'
    },
    template: '<input type="hidden">',
    controller: function($scope, $element, $attrs) {
      $scope.newChoiceValidator = new RegExp($scope.newChoiceRegex);

      $scope.makeUnique = function(arr) {
        var hashMap = {};
        var result = [];
        for (var i = 0; i < arr.length; i++) {
          if (!hashMap.hasOwnProperty(arr[i])) {
            result.push(arr[i]);
            hashMap[arr[i]] = 1;
          }
        }
        return result;
      };

      $scope.uniqueChoices = $scope.makeUnique($scope.choices);
      $scope.select2Choices = [];
      for (var i = 0; i < $scope.uniqueChoices.length; i++) {
        $scope.select2Choices.push({
          id: $scope.uniqueChoices[i],
          text: $scope.uniqueChoices[i]
        });
      }

      var select2Node = $element[0].firstChild;
      $(select2Node).select2({
        data: $scope.select2Choices,
        placeholder: $scope.placeholder,
        width: $scope.width || '250px',
        createSearchChoice: function(term, data) {
          if ($(data).filter(function() {
            return this.text.localeCompare(term) === 0;
          }).length === 0) {
            return (
              term.match($scope.newChoiceValidator) ?
                  {id: term, text: term} : null
            );
          }
        }
      });

      // Initialize the dropdown.
      $(select2Node).select2('val', $scope.item);

      // Update $scope.item when the selection changes.
      $(select2Node).on('change', function(e) {
        $scope.item = e.val;
        $scope.$apply();
      });
    }
  };
});

oppia.directive('richTextEditor', function($q, $sce, $modal, $http, warningsData, oppiaHtmlEscaper, requestCreator) {
  // Rich text editor directive.

  return {
    restrict: 'E',
    scope: {htmlContent: '='},
    template: '<textarea rows="7" cols="60"></textarea>',
    controller: function($scope, $element, $attrs) {
      var rteNode = $element[0].firstChild;
      var Wysiwyg = null;

      $scope._NONINTERACTIVE_WIDGETS = [{
        name: 'image',
        backendName: 'Image',
        tooltip: 'Insert image',
        iconDataUrl: '',
        iconUrl: '/rte_assets/picture.png'
      }, {
        name: 'video',
        backendName: 'Video',
        tooltip: 'Insert video',
        iconDataUrl: '',
        iconUrl: '/rte_assets/film.png'
      }, {
        name: 'hints',
        backendName: 'Hints',
        tooltip: 'Insert hints',
        iconDataUrl: '',
        iconUrl: '/rte_assets/hints.png'
      }];

      $scope.createRteElement = function(widgetDefinition, customizationArgs) {
        var el = document.createElement('img');
        el.className += 'oppia-noninteractive-' + widgetDefinition.name;
        el.src = widgetDefinition.iconDataUrl;
        for (paramName in customizationArgs) {
          var args = customizationArgs[paramName];
          el.setAttribute(paramName, oppiaHtmlEscaper.objToEscapedJson(args));
        }
        el.ondblclick = (function(_elt) {
          return function(evt) {
            _elt.className += ' insertionPoint';
            $scope.getRteCustomizationModal(widgetDefinition, customizationArgs);
          };
        })(el);
        return el;
      }

      // Replace <oppia-noninteractive> tags with <img> tags.
      $scope.convertHtmlToRte = function(html) {
        var elt = $('<div>' + html + '</div>');

        $scope._NONINTERACTIVE_WIDGETS.forEach(function(widgetDefn) {
          elt.find('oppia-noninteractive-' + widgetDefn.name).replaceWith(function() {
            var customizationArgs = {};
            for (var i = 0; i < this.attributes.length; i++) {
              var attr = this.attributes[i];
              customizationArgs[attr.name] = oppiaHtmlEscaper.escapedJsonToObj(
                attr.value);
            }
            return $scope.createRteElement(widgetDefn, customizationArgs);
          });
        });

        return elt.html();
      };

      // Replace <img> tags with <oppia-noninteractive> tags.
      $scope.convertRteToHtml = function(rte) {
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

      $scope.getRteCustomizationModal = function(widgetDefinition, customizationArgs) {
        return $http.post(
            '/widgets/noninteractive/' + widgetDefinition.backendName,
            requestCreator.createRequest({
              customization_args: customizationArgs
            }),
            {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
        ).then(function(response) {
          var modalInstance = $modal.open({
            templateUrl: 'modals/customizeWidget',
            backdrop: 'static',
            resolve: {
              widgetDefinition: function() {
                return widgetDefinition;
              },
              widgetParams: function() {
                return response.data.widget.params;
              }
            },
            controller: function($scope, $modalInstance, widgetDefinition, widgetParams) {
              $scope.widgetParams = widgetParams || {};
              $scope.widgetDefinition = widgetDefinition;

              $scope.save = function(widgetParams) {
                var customizationArgs = {};
                for (var paramName in widgetParams) {
                  customizationArgs[paramName] = widgetParams[paramName].customization_args;
                }
                $modalInstance.close({
                  customizationArgs: customizationArgs,
                  widgetDefinition: $scope.widgetDefinition
                });
              };

              $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
                warningsData.clear();
              };
            }
          });

          modalInstance.result.then(function(result) {
            var el = $scope.createRteElement(result.widgetDefinition, result.customizationArgs);
            var insertionPoint = Wysiwyg.editorDoc.querySelector('.insertionPoint');
            insertionPoint.parentNode.replaceChild(el, insertionPoint);
            $(rteNode).wysiwyg('save');
          }, function () {
            var insertionPoint = Wysiwyg.editorDoc.querySelector('.insertionPoint');
            insertionPoint.className = insertionPoint.className.replace(
                /\binsertionPoint\b/, '');
            console.log('Modal customizer dismissed.');
          });

          return modalInstance;
        });
      };

      function getExecFunction(widgetDefinition) {
        return function() {
          if (Wysiwyg === null) {
            Wysiwyg = this;
          }
          $(rteNode).wysiwyg(
            'insertHtml', '<span class="insertionPoint"></span>');
          $scope.getRteCustomizationModal(widgetDefinition, {});
        };
      }

      $scope.rteContent = $scope.convertHtmlToRte($scope.htmlContent);

      $http.get('/templates/rte').then(function(response) {
        $scope.initRte(response.data);
      });

      $scope.initRte = function(initialHtml) {
        $(rteNode).wysiwyg({
          autoGrow: true,
          autoSave: true,
          controls: {
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
            superscript: {visible: false}
          },
          debug: true,
          events: {
            save: function(event) {
              var content = $(rteNode).wysiwyg('getContent');
              if (content !== null && content !== undefined) {
                $scope.modifiedContent = content;
                $scope.htmlContent = $scope.convertRteToHtml(content);
              }
            }
          },
          html: initialHtml,
          initialContent: $scope.rteContent,
          initialMinHeight: '200px',
          resizeOptions: true
        });

        $scope._addRteControl = function(widgetDefinition) {
          $(rteNode).wysiwyg('addControl', widgetDefinition.name, {
            groupIndex: 7,
            icon: widgetDefinition.iconDataUrl,
            tooltip: widgetDefinition.tooltip,
            tags: [],
            visible: true,
            exec: getExecFunction(widgetDefinition)
          });
        };

        $scope._updateWidgetDefinition = function(widgetDefinition) {
          if (widgetDefinition.iconDataUrl) {
            var deferred = $q.defer();
            deferred.resolve(widgetDefinition);
            return deferred.promise;
          } else {
            return $http.get(widgetDefinition.iconUrl).then(function(response) {
              widgetDefinition.iconDataUrl = response.data;
              return widgetDefinition;
            });
          }
        };

        $scope.updatePromises = [];
        for (var i = 0; i < $scope._NONINTERACTIVE_WIDGETS.length; i++) {
          $scope.updatePromises.push($scope._updateWidgetDefinition(
              $scope._NONINTERACTIVE_WIDGETS[i]));
        }

        $scope.updateAllPromise = $q.all($scope.updatePromises).then(function(values) {
          console.log(values);
          values.forEach(function(widgetDefinition) {
            $scope._addRteControl(widgetDefinition);
          });
        });

        // Disable jquery.ui.dialog so that the link control works correctly.
        $.fn.dialog = null;
      };
    }
  };
});


// TODO(sll): Combine all of these into a single directive.

oppia.directive('string', function(warningsData) {
  // Editable string directive.
  return {
    restrict: 'E',
    scope: {item: '='},
    templateUrl: '/templates/string',
    controller: function ($scope, $attrs) {
      // Reset the component each time the item changes.
      $scope.$watch('item', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.item || ''};
        $scope.active = false;
      });

      $scope.openItemEditor = function() {
        $scope.active = true;
      };

      $scope.closeItemEditor = function() {
        $scope.active = false;
      };

      $scope.replaceItem = function(newItem) {
        if (!newItem) {
          warningsData.addWarning('Please enter a non-empty item.');
          return;
        }
        warningsData.clear();
        $scope.localItem = {label: newItem};
        $scope.item = newItem;
        $scope.closeItemEditor();
      };

      $scope.$on('externalSave', function() {
        if ($scope.active) {
          $scope.replaceItem($scope.localItem.label);
          // The $scope.$apply() call is needed to propagate the replaced item.
          $scope.$apply();
        }
      });
    }
  };
});

oppia.directive('real', function (warningsData) {
  // Editable real number directive.
  return {
    restrict: 'E',
    scope: {item: '='},
    templateUrl: '/templates/real',
    controller: function ($scope, $attrs) {
      // Reset the component each time the item changes.
      $scope.$watch('item', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.item || 0.0};
        $scope.active = false;
      });

      $scope.openItemEditor = function() {
        $scope.active = true;
      };

      $scope.closeItemEditor = function() {
        $scope.active = false;
      };

      $scope.replaceItem = function(newItem) {
        if (!newItem || !angular.isNumber(newItem)) {
          warningsData.addWarning('Please enter a number.');
          return;
        }
        warningsData.clear();
        $scope.localItem = {label: (newItem || 0.0)};
        $scope.item = newItem;
        $scope.closeItemEditor();
      };

      $scope.$on('externalSave', function() {
        if ($scope.active) {
          $scope.replaceItem($scope.localItem.label);
          // The $scope.$apply() call is needed to propagate the replaced item.
          $scope.$apply();
        }
      });
    }
  };
});

oppia.directive('int', function (warningsData) {
  // Editable integer directive.
  return {
    restrict: 'E',
    scope: {item: '='},
    templateUrl: '/templates/int',
    controller: function ($scope, $attrs) {
      // Reset the component each time the item changes.
      $scope.$watch('item', function(newValue, oldValue) {
        // Maintain a local copy of 'item'.
        $scope.localItem = {label: $scope.item || 0};
        $scope.active = false;
      });

      $scope.openItemEditor = function() {
        $scope.active = true;
      };

      $scope.closeItemEditor = function() {
        $scope.active = false;
      };

      $scope.isInteger = function(value) {
        return (!isNaN(parseInt(value,10)) &&
                (parseFloat(value,10) == parseInt(value,10)));
      };

      $scope.replaceItem = function(newItem) {
        if (!newItem || !$scope.isInteger(newItem)) {
          warningsData.addWarning('Please enter an integer.');
          return;
        }
        warningsData.clear();
        $scope.localItem = {label: (newItem || 0)};
        $scope.item = newItem;
        $scope.closeItemEditor();
      };

      $scope.$on('externalSave', function() {
        if ($scope.active) {
          $scope.replaceItem($scope.localItem.label);
          // The $scope.$apply() call is needed to propagate the replaced item.
          $scope.$apply();
        }
      });
    }
  };
});

oppia.directive('list', function(warningsData) {
  // Directive that implements an editable list.
  return {
    restrict: 'E',
    scope: {items: '=', largeInput: '@'},
    templateUrl: '/templates/list',
    controller: function($scope, $attrs) {
      $scope.largeInput = ($scope.largeInput || false);

      // Reset the component each time the item list changes.
      $scope.$watch('items', function(newValue, oldValue) {
        // Maintain a local copy of 'items'. This is needed because it is not
        // possible to modify 'item' directly when using "for item in items";
        // we need a 'constant key'. So we represent each item as {label: ...}
        // instead, and manipulate item.label.
        $scope.localItems = [];
        if ($scope.items) {
          for (var i = 0; i < $scope.items.length; i++) {
            $scope.localItems.push({'label': angular.copy($scope.items[i])});
          }
        }
        $scope.activeItem = null;
      });

      $scope.openItemEditor = function(index) {
        $scope.activeItem = index;
      };

      $scope.closeItemEditor = function() {
        $scope.activeItem = null;
      };

      $scope.addItem = function() {
        $scope.localItems.push({label: ''});
        $scope.activeItem = $scope.localItems.length - 1;
        if ($scope.items) {
          $scope.items.push('');
        } else {
          $scope.items = [''];
        }
      };

      $scope.replaceItem = function(index, newItem) {
        if (!newItem) {
          warningsData.addWarning('Please enter a non-empty item.');
          return;
        }
        $scope.index = '';
        $scope.replacementItem = '';
        if (index < $scope.items.length && index >= 0) {
          $scope.localItems[index] = {label: newItem};
          $scope.items[index] = newItem;
        }
        $scope.closeItemEditor();
      };

      $scope.deleteItem = function(index) {
        $scope.activeItem = null;
        $scope.localItems.splice(index, 1);
        $scope.items.splice(index, 1);
      };

      $scope.$on('externalSave', function() {
        if ($scope.activeItem !== null) {
          $scope.replaceItem(
              $scope.activeItem, $scope.localItems[$scope.activeItem].label);
          // The $scope.$apply() call is needed to propagate the replaced item.
          $scope.$apply();
        }
      });
    }
  };
});
