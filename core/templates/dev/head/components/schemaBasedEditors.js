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
 * @fileoverview Directives for schema-based object editors.
 *
 * @author sll@google.com (Sean Lip)
 */

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
    }
  };
}]);


oppia.factory('schemaDefaultValueService', [function() {
  return {
    // TODO(sll): Rewrite this to take into account post_normalizers, so that
    // we always start with a valid value.
    getDefaultValue: function(schema) {
      if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [];
      } else if (schema.type === 'dict') {
        return {};
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);


oppia.filter('requireIsFloat', [function() {
  return function(input) {
    var FLOAT_REGEXP = /^\-?\d*((\.|\,)\d+)?$/;
    if (!FLOAT_REGEXP.test(input)) {
      return undefined;
    }

    return (typeof input === 'number') ? input : parseFloat(
      input.replace(',', '.'));
  };
}]);


// The names of these filters must correspond to the names of the backend post-
// normalizers (with underscores converted to camelcase).
// WARNING: These filters do not validate the arguments supplied with the
// post-normalizer definitions in the schema; these are assumed to be correct.
oppia.filter('requireAtLeast', [function() {
  return function(input, args) {
    return (input >= args.minValue) ? input : undefined;
  };
}]);


oppia.filter('requireAtMost', [function() {
  return function(input, args) {
    return (input <= args.maxValue) ? input : undefined;
  };
}]);


oppia.filter('requireIsOneOf', [function() {
  return function(input, args) {
    return args.choices.indexOf(input) !== -1 ? input : undefined;
  };
}]);


oppia.filter('requireNonempty', [function() {
  return function(input) {
    return input ? input : undefined;
  };
}]);


oppia.directive('validateWithPostNormalizers', ['$filter', function($filter) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      // Add normalizers in reverse order.
      if (scope.postNormalizers()) {
        scope.postNormalizers().forEach(function(normalizerSpec) {
          var frontendName = $filter('underscoresToCamelCase')(normalizerSpec.id);

          // Note that there may not be a corresponding frontend filter for
          // each backend normalizer.
          try {
            $filter(frontendName);
          } catch(err) {
            return;
          }

          var filterArgs = {};
          for (key in normalizerSpec) {
            if (key !== 'id') {
              filterArgs[$filter('underscoresToCamelCase')(key)] = angular.copy(
                normalizerSpec[key]);
            }
          }

          var customValidator = function(viewValue) {
            var filteredValue = $filter(frontendName)(viewValue, filterArgs);
            ctrl.$setValidity(frontendName, filteredValue !== undefined);
            return filteredValue;
          };

          ctrl.$parsers.unshift(customValidator);
          ctrl.$formatters.unshift(customValidator);
        });
      }
    }
  };
}]);

// This should come after validate-with-post-normalizers, if that is defined as
// an attribute on the HTML tag.
oppia.directive('addFloatValidation', ['$filter', function($filter) {
  var FLOAT_REGEXP = /^\-?\d*((\.|\,)\d+)?$/;
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      var floatValidator = function(viewValue) {
        var filteredValue = $filter('requireIsFloat')(viewValue);
        ctrl.$setValidity('requireIsFloat', filteredValue !== undefined);
        return filteredValue;
      };

      ctrl.$parsers.unshift(floatValidator);
      ctrl.$formatters.unshift(floatValidator);
    }
  };
}]);

// Prevents timeouts due to recursion in nested directives. See:
//
//   http://stackoverflow.com/questions/14430655/recursion-in-angular-directives
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

oppia.directive('schemaBasedEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      definition: '=',
      isEditable: '&',
      savedValue: '='
    },
    templateUrl: 'schemaBasedEditor/entryPoint',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: ['$scope', function($scope) {
      $scope.$watch('savedValue', function(newValue, oldValue) {
        $scope.localValue = angular.copy($scope.savedValue);
      });

      $scope.submitValue = function(value) {
        $scope.savedValue = angular.copy($scope.localValue);
        alert($scope.savedValue);
      };
      $scope.cancelEdit = function() {
        $scope.localValue = angular.copy($scope.savedValue);
      };
    }]
  };
}]);

oppia.directive('schemaBuilder', [function() {
  return {
    scope: {
      schema: '&',
      isEditable: '&',
      localValue: '='
    },
    templateUrl: 'schemaBasedEditor/master',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedBoolEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      allowParameters: '&'
    },
    templateUrl: 'schemaBasedEditor/bool',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.boolEditorOptions = [{
        name: 'True',
        value: {
          type: 'raw',
          data: true
        }
      }, {
        name: 'False',
        value: {
          type: 'raw',
          data: false
        }
      }];

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('bool');
        paramNames.forEach(function(paramName) {
          $scope.boolEditorOptions.push({
            name: '[Parameter] ' + paramName,
            value: {
              type: 'parameter',
              data: paramName
            }
          });
        });
      }

      $scope.$watch('localValue', function(newValue, oldValue) {
        // Because JS objects are passed by reference, the current value needs
        // to be set manually to an object in the list of options.
        $scope.boolEditorOptions.forEach(function(option) {
          if (angular.equals(option.value, newValue)) {
            $scope.localValue = option.value;
          }
        });
      });
    }]
  };
}]);

oppia.directive('schemaBasedFloatEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      allowParameters: '&',
      postNormalizers: '&'
    },
    templateUrl: 'schemaBasedEditor/float',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.editAsParameter = false;

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('float');
        if (paramNames.length) {
          $scope.paramNameOptions = paramNames.map(function(paramName) {
            return {
              name: paramName,
              value: {
                type: 'parameter',
                data: paramName
              }
            };
          });

          $scope.$watch('localValue', function(newValue, oldValue) {
            $scope.editAsParameter = (newValue.type === 'parameter');
            // Because JS objects are passed by reference, the current value needs
            // to be set manually to an object in the list of options.
            if ($scope.localValue.type === 'parameter') {
              $scope.paramNameOptions.forEach(function(option) {
                if (angular.equals(option.value, newValue)) {
                  $scope.localValue = option.value;
                }
              });
            }
          });

          $scope.toggleEditMode = function() {
            $scope.editAsParameter = !$scope.editAsParameter;
            $scope.localValue = $scope.editAsParameter ? {
              type: 'parameter',
              data: paramNames[0]
            } : {
              type: 'raw',
              data: 0.0
            };
          };
        }
      }
    }]
  };
}]);

oppia.directive('schemaBasedIntEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      allowParameters: '&'
    },
    templateUrl: 'schemaBasedEditor/int',
    restrict: 'E',
    controller: ['$scope', 'parameterSpecsService', function($scope, parameterSpecsService) {
      $scope.editAsParameter = false;

      if ($scope.allowParameters()) {
        var paramNames = parameterSpecsService.getAllParamsOfType('int');
        if (paramNames.length) {
          $scope.paramNameOptions = paramNames.map(function(paramName) {
            return {
              name: paramName,
              value: {
                type: 'parameter',
                data: paramName
              }
            };
          });

          $scope.$watch('localValue', function(newValue, oldValue) {
            $scope.editAsParameter = (newValue.type === 'parameter');
            // Because JS objects are passed by reference, the current value needs
            // to be set manually to an object in the list of options.
            if ($scope.localValue.type === 'parameter') {
              $scope.paramNameOptions.forEach(function(option) {
                if (angular.equals(option.value, newValue)) {
                  $scope.localValue = option.value;
                }
              });
            }
          });

          $scope.toggleEditMode = function() {
            $scope.editAsParameter = !$scope.editAsParameter;
            $scope.localValue = $scope.editAsParameter ? {
              type: 'parameter',
              data: paramNames[0]
            } : {
              type: 'raw',
              data: 0
            };
          };
        }
      }
    }]
  };
}]);

oppia.directive('schemaBasedUnicodeEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      postNormalizers: '&'
    },
    templateUrl: 'schemaBasedEditor/unicode',
    restrict: 'E'
  };
}]);

// TODO(sll): The 'Cancel' button should revert the text in the HTML box to its
// original state.
// TODO(sll): The noninteractive widgets in the RTE do not work.
oppia.directive('schemaBasedHtmlEditor', [function() {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    templateUrl: 'schemaBasedEditor/html',
    restrict: 'E'
  };
}]);

oppia.directive('schemaBasedListEditor', [
    'schemaDefaultValueService', 'recursionHelper',
    function(schemaDefaultValueService, recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. The schema definition for each item in the list.
      itemSchema: '&'
    },
    templateUrl: 'schemaBasedEditor/list',
    restrict: 'E',
    compile: recursionHelper.compile,
    controller: ['$scope', function($scope) {
      $scope.addElement = function() {
        $scope.localValue.push(
          schemaDefaultValueService.getDefaultValue($scope.itemSchema()));
      };

      $scope.deleteElement = function(index) {
        $scope.localValue.splice(index, 1);
      };
    }]
  };
}]);

oppia.directive('schemaBasedDictEditor', ['recursionHelper', function(recursionHelper) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. An object whose keys and values are the dict
      // properties and the corresponding schemas.
      propertySchemas: '&'
    },
    templateUrl: 'schemaBasedEditor/dict',
    restrict: 'E',
    compile: recursionHelper.compile
  };
}]);
