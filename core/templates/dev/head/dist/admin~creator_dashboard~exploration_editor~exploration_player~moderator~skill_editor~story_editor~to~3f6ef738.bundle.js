(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~creator_dashboard~exploration_editor~exploration_player~moderator~skill_editor~story_editor~to~3f6ef738"],{

/***/ "./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.directive.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.directive.ts ***!
  \******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for applying validation.
 */
__webpack_require__(/*! filters/string-utility-filters/underscores-to-camel-case.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/underscores-to-camel-case.filter.ts");
/* eslint-disable angular/directive-restrict */
angular.module('applyValidationModule').directive('applyValidation', ['$filter', function ($filter) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elm, attrs, ctrl) {
                // Add validators in reverse order.
                if (scope.validators()) {
                    scope.validators().forEach(function (validatorSpec) {
                        var frontendName = $filter('underscoresToCamelCase')(validatorSpec.id);
                        // Note that there may not be a corresponding frontend filter for
                        // each backend validator.
                        try {
                            $filter(frontendName);
                        }
                        catch (err) {
                            return;
                        }
                        var filterArgs = {};
                        for (var key in validatorSpec) {
                            if (key !== 'id') {
                                filterArgs[$filter('underscoresToCamelCase')(key)] =
                                    angular.copy(validatorSpec[key]);
                            }
                        }
                        var customValidator = function (viewValue) {
                            ctrl.$setValidity(frontendName, $filter(frontendName)(viewValue, filterArgs));
                            return viewValue;
                        };
                        ctrl.$parsers.unshift(customValidator);
                        ctrl.$formatters.unshift(customValidator);
                    });
                }
            }
        };
    }
]);
/* eslint-enable angular/directive-restrict */


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.directive.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.directive.ts ***!
  \******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for requiring "isFloat" filter.
 */
// This should come before 'apply-validation', if that is defined as
// an attribute on the HTML tag.
__webpack_require__(/*! components/forms/forms-validators/is-float.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-float.filter.ts");
/* eslint-disable angular/directive-restrict */
angular.module('requireIsFloatModule').directive('requireIsFloat', ['$filter', function ($filter) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elm, attrs, ctrl) {
                var floatValidator = function (viewValue) {
                    var filteredValue = $filter('isFloat')(viewValue);
                    ctrl.$setValidity('isFloat', filteredValue !== undefined);
                    return filteredValue;
                };
                ctrl.$parsers.unshift(floatValidator);
                ctrl.$formatters.unshift(floatValidator);
            }
        };
    }
]);
/* eslint-enable angular/directive-restrict */


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.directive.ts":
/*!**********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.directive.ts ***!
  \**********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for booleans.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('schemaBasedBoolEditorModule').directive('schemaBasedBoolEditor', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-bool-editor/schema-based-bool-editor.directive.html'),
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts":
/*!****************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts ***!
  \****************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for multiple choice.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
angular.module('schemaBasedChoicesEditorModule').directive('schemaBasedChoicesEditor', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
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
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-choices-editor/' +
                'schema-based-choices-editor.directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: ['$scope', function ($scope) {
                    $scope.getReadonlySchema = function () {
                        var readonlySchema = angular.copy($scope.schema());
                        delete readonlySchema.choices;
                        return readonlySchema;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts":
/*!**************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts ***!
  \**************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for custom values.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
angular.module('schemaBasedCustomEditorModule').directive('schemaBasedCustomEditor', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                // The class of the object being edited.
                objType: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-custom-editor/' +
                'schema-based-custom-editor.directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts":
/*!**********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts ***!
  \**********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for dicts.
 */
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
angular.module('schemaBasedDictEditorModule').directive('schemaBasedDictEditor', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                // Read-only property. An object whose keys and values are the dict
                // properties and the corresponding schemas.
                propertySchemas: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-dict-editor/schema-based-dict-editor.directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: [
                '$scope', 'IdGenerationService',
                function ($scope, IdGenerationService) {
                    $scope.getHumanReadablePropertyDescription = function (property) {
                        return property.description || '[' + property.name + ']';
                    };
                    $scope.fieldIds = {};
                    for (var i = 0; i < $scope.propertySchemas().length; i++) {
                        // Generate random IDs for each field.
                        $scope.fieldIds[$scope.propertySchemas()[i].name] = (IdGenerationService.generateNewId());
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts":
/*!****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts ***!
  \****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for general schema-based editors.
 */
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts");
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('schemaBasedEditorModule').directive('schemaBasedEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                schema: '&',
                isDisabled: '&',
                localValue: '=',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-editor.directive.html'),
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts":
/*!************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.directive.ts ***!
  \************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for floats.
 */
__webpack_require__(/*! components/forms/forms-validators/is-float.filter.ts */ "./core/templates/dev/head/components/forms/forms-validators/is-float.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
angular.module('schemaBasedFloatEditorModule').directive('schemaBasedFloatEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                validators: '&',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-float-editor/schema-based-float-editor.directive.html'),
            restrict: 'E',
            controller: [
                '$scope', '$filter', '$timeout', 'FocusManagerService',
                function ($scope, $filter, $timeout, FocusManagerService) {
                    $scope.hasLoaded = false;
                    $scope.isUserCurrentlyTyping = false;
                    $scope.hasFocusedAtLeastOnce = false;
                    $scope.labelForErrorFocusTarget =
                        FocusManagerService.generateFocusLabel();
                    $scope.validate = function (localValue) {
                        return $filter('isFloat')(localValue) !== undefined;
                    };
                    $scope.onFocus = function () {
                        $scope.hasFocusedAtLeastOnce = true;
                        if ($scope.onInputFocus) {
                            $scope.onInputFocus();
                        }
                    };
                    $scope.onBlur = function () {
                        $scope.isUserCurrentlyTyping = false;
                        if ($scope.onInputBlur) {
                            $scope.onInputBlur();
                        }
                    };
                    // TODO(sll): Move these to ng-messages when we move to Angular 1.3.
                    $scope.getMinValue = function () {
                        for (var i = 0; i < $scope.validators().length; i++) {
                            if ($scope.validators()[i].id === 'is_at_least') {
                                return $scope.validators()[i].min_value;
                            }
                        }
                    };
                    $scope.getMaxValue = function () {
                        for (var i = 0; i < $scope.validators().length; i++) {
                            if ($scope.validators()[i].id === 'is_at_most') {
                                return $scope.validators()[i].max_value;
                            }
                        }
                    };
                    $scope.onKeypress = function (evt) {
                        if (evt.keyCode === 13) {
                            if (Object.keys($scope.floatForm.floatValue.$error).length !== 0) {
                                $scope.isUserCurrentlyTyping = false;
                                FocusManagerService.setFocus($scope.labelForErrorFocusTarget);
                            }
                            else {
                                $scope.$emit('submittedSchemaBasedFloatForm');
                            }
                        }
                        else {
                            $scope.isUserCurrentlyTyping = true;
                        }
                    };
                    if ($scope.localValue === undefined) {
                        $scope.localValue = 0.0;
                    }
                    // This prevents the red 'invalid input' warning message from
                    // flashing at the outset.
                    $timeout(function () {
                        $scope.hasLoaded = true;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts":
/*!**********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.directive.ts ***!
  \**********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for HTML.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('schemaBasedHtmlEditorModule').directive('schemaBasedHtmlEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                labelForFocusTarget: '&',
                uiConfig: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-html-editor/schema-based-html-editor.directive.html'),
            restrict: 'E',
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts":
/*!********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.directive.ts ***!
  \********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for integers.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('schemaBasedIntEditorModule').directive('schemaBasedIntEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                validators: '&',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-int-editor/schema-based-int-editor.directive.html'),
            restrict: 'E',
            controller: [
                '$scope', function ($scope) {
                    if ($scope.localValue === undefined) {
                        $scope.localValue = 0;
                    }
                    $scope.onKeypress = function (evt) {
                        if (evt.keyCode === 13) {
                            $scope.$emit('submittedSchemaBasedIntForm');
                        }
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts":
/*!**********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.directive.ts ***!
  \**********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for lists.
 */
__webpack_require__(/*! components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
__webpack_require__(/*! services/SchemaDefaultValueService.ts */ "./core/templates/dev/head/services/SchemaDefaultValueService.ts");
__webpack_require__(/*! services/SchemaUndefinedLastElementService.ts */ "./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
angular.module('schemaBasedListEditorModule').directive('schemaBasedListEditor', [
    'FocusManagerService', 'IdGenerationService',
    'NestedDirectivesRecursionTimeoutPreventionService',
    'SchemaDefaultValueService', 'SchemaUndefinedLastElementService',
    'UrlInterpolationService',
    function (FocusManagerService, IdGenerationService, NestedDirectivesRecursionTimeoutPreventionService, SchemaDefaultValueService, SchemaUndefinedLastElementService, UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                // Read-only property. The schema definition for each item in the
                // list.
                itemSchema: '&',
                // The length of the list. If not specified, the list is of arbitrary
                // length.
                len: '=',
                // UI configuration. May be undefined.
                uiConfig: '&',
                validators: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-list-editor/schema-based-list-editor.directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: ['$scope', function ($scope) {
                    var baseFocusLabel = ($scope.labelForFocusTarget() ||
                        IdGenerationService.generateNewId() + '-');
                    $scope.getFocusLabel = function (index) {
                        // Treat the first item in the list as a special case -- if this
                        // list is contained in another list, and the outer list is opened
                        // with a desire to autofocus on the first input field, we can then
                        // focus on the given $scope.labelForFocusTarget().
                        // NOTE: This will cause problems for lists nested within lists,
                        // since sub-element 0 > 1 will have the same label as sub-element
                        // 1 > 0. But we will assume (for now) that nested lists won't be
                        // used -- if they are, this will need to be changed.
                        return (index === 0 ? baseFocusLabel : baseFocusLabel + index.toString());
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
                    }
                    else if ($scope.itemSchema().ui_config) {
                        if ($scope.itemSchema().ui_config.coding_mode) {
                            $scope.isOneLineInput = false;
                        }
                        else if ($scope.itemSchema().ui_config.hasOwnProperty('rows') &&
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
                            }
                            else if ($scope.validators()[i].id === 'has_length_at_least') {
                                $scope.minListLength = $scope.validators()[i].min_value;
                            }
                            else if ($scope.validators()[i].id === 'is_uniquified') {
                                $scope.showDuplicatesWarning = true;
                            }
                        }
                    }
                    while ($scope.localValue.length < $scope.minListLength) {
                        $scope.localValue.push(SchemaDefaultValueService.getDefaultValue($scope.itemSchema()));
                    }
                    $scope.hasDuplicates = function () {
                        var valuesSoFar = {};
                        for (var i = 0; i < $scope.localValue.length; i++) {
                            var value = $scope.localValue[i];
                            if (!valuesSoFar.hasOwnProperty(value)) {
                                valuesSoFar[value] = true;
                            }
                            else {
                                return true;
                            }
                        }
                        return false;
                    };
                    if ($scope.len === undefined) {
                        $scope.addElement = function () {
                            if ($scope.isOneLineInput) {
                                $scope.hideAddItemButton();
                            }
                            $scope.localValue.push(SchemaDefaultValueService.getDefaultValue($scope.itemSchema()));
                            FocusManagerService.setFocus($scope.getFocusLabel($scope.localValue.length - 1));
                        };
                        var _deleteLastElementIfUndefined = function () {
                            var lastValueIndex = $scope.localValue.length - 1;
                            var valueToConsiderUndefined = (SchemaUndefinedLastElementService.getUndefinedValue($scope.itemSchema()));
                            if ($scope.localValue[lastValueIndex] ===
                                valueToConsiderUndefined) {
                                $scope.deleteElement(lastValueIndex);
                            }
                        };
                        var deleteEmptyElements = function () {
                            for (var i = 0; i < $scope.localValue.length - 1; i++) {
                                if ($scope.localValue[i].length === 0) {
                                    $scope.deleteElement(i);
                                    i--;
                                }
                            }
                        };
                        if ($scope.localValue.length === 1) {
                            if ($scope.localValue[0].length === 0) {
                                $scope.isAddItemButtonPresent = false;
                            }
                        }
                        $scope.lastElementOnBlur = function () {
                            _deleteLastElementIfUndefined();
                            $scope.showAddItemButton();
                        };
                        $scope.showAddItemButton = function () {
                            deleteEmptyElements();
                            $scope.isAddItemButtonPresent = true;
                        };
                        $scope.hideAddItemButton = function () {
                            $scope.isAddItemButtonPresent = false;
                        };
                        $scope._onChildFormSubmit = function (evt) {
                            if (!$scope.isAddItemButtonPresent) {
                                /**
                                 * If form submission happens on last element of the set (i.e
                                 * the add item button is absent) then automatically add the
                                 * element to the list.
                                 */
                                if (($scope.maxListLength === null ||
                                    $scope.localValue.length < $scope.maxListLength) &&
                                    !!$scope.localValue[$scope.localValue.length - 1]) {
                                    $scope.addElement();
                                }
                            }
                            else {
                                /**
                                 * If form submission happens on existing element remove focus
                                 * from it
                                 */
                                document.activeElement.blur();
                            }
                            evt.stopPropagation();
                        };
                        $scope.$on('submittedSchemaBasedIntForm', $scope._onChildFormSubmit);
                        $scope.$on('submittedSchemaBasedFloatForm', $scope._onChildFormSubmit);
                        $scope.$on('submittedSchemaBasedUnicodeForm', $scope._onChildFormSubmit);
                        $scope.deleteElement = function (index) {
                            // Need to let the RTE know that HtmlContent has been changed.
                            $scope.$broadcast('externalHtmlContentChange');
                            $scope.localValue.splice(index, 1);
                        };
                    }
                    else {
                        if ($scope.len <= 0) {
                            throw 'Invalid length for list editor: ' + $scope.len;
                        }
                        if ($scope.len !== $scope.localValue.length) {
                            throw 'List editor length does not match length of input' +
                                ' value: ' + $scope.len + ' ' + $scope.localValue;
                        }
                    }
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts":
/*!****************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.directive.ts ***!
  \****************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for unicode strings.
 */
__webpack_require__(/*! components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
angular.module('schemaBasedUnicodeEditorModule').directive('schemaBasedUnicodeEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                validators: '&',
                uiConfig: '&',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/schema-based-editor/' +
                'schema-based-unicode-editor/' +
                'schema-based-unicode-editor.directive.html'),
            restrict: 'E',
            controller: [
                '$scope', '$filter', '$sce', '$translate', 'DeviceInfoService',
                function ($scope, $filter, $sce, $translate, DeviceInfoService) {
                    if ($scope.uiConfig() && $scope.uiConfig().coding_mode) {
                        // Flag that is flipped each time the codemirror view is
                        // shown. (The codemirror instance needs to be refreshed
                        // every time it is unhidden.)
                        $scope.codemirrorStatus = false;
                        var CODING_MODE_NONE = 'none';
                        $scope.codemirrorOptions = {
                            // Convert tabs to spaces.
                            extraKeys: {
                                Tab: function (cm) {
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
                        // Note that only 'coffeescript', 'javascript', 'lua', 'python',
                        // 'ruby' and 'scheme' have CodeMirror-supported syntax
                        // highlighting. For other languages, syntax highlighting will not
                        // happen.
                        if ($scope.uiConfig().coding_mode !== CODING_MODE_NONE) {
                            $scope.codemirrorOptions.mode = $scope.uiConfig().coding_mode;
                        }
                        setTimeout(function () {
                            $scope.codemirrorStatus = !$scope.codemirrorStatus;
                        }, 200);
                        // When the form view is opened, flip the status flag. The
                        // timeout seems to be needed for the line numbers etc. to display
                        // properly.
                        $scope.$on('schemaBasedFormsShown', function () {
                            setTimeout(function () {
                                $scope.codemirrorStatus = !$scope.codemirrorStatus;
                            }, 200);
                        });
                    }
                    $scope.onKeypress = function (evt) {
                        if (evt.keyCode === 13) {
                            $scope.$emit('submittedSchemaBasedUnicodeForm');
                        }
                    };
                    $scope.getPlaceholder = function () {
                        if (!$scope.uiConfig()) {
                            return '';
                        }
                        else {
                            if (!$scope.uiConfig().placeholder &&
                                DeviceInfoService.hasTouchEvents()) {
                                return $translate.instant('I18N_PLAYER_DEFAULT_MOBILE_PLACEHOLDER');
                            }
                            return $scope.uiConfig().placeholder;
                        }
                    };
                    $scope.getRows = function () {
                        if (!$scope.uiConfig()) {
                            return null;
                        }
                        else {
                            return $scope.uiConfig().rows;
                        }
                    };
                    $scope.getCodingMode = function () {
                        if (!$scope.uiConfig()) {
                            return null;
                        }
                        else {
                            return $scope.uiConfig().coding_mode;
                        }
                    };
                    $scope.getDisplayedValue = function () {
                        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')($scope.localValue));
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Converts unicode to HTML.
 */
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('formsUnicodeFiltersModule').filter('convertUnicodeToHtml', [
    '$sanitize', 'HtmlEscaperService',
    function ($sanitize, HtmlEscaperService) {
        return function (text) {
            return $sanitize(HtmlEscaperService.unescapedStrToEscapedStr(text));
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts ***!
  \**********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Converts {{name}} substrings to
 * <oppia-parameter>name</oppia-parameter> tags and unescapes the
 * {, } and \ characters. This is done by reading the given string from
 * left to right: if we see a backslash, we use the following character;
 * if we see a '{{', this is the start of a parameter; if we see a '}}';
 * this is the end of a parameter.
 */
__webpack_require__(/*! components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-to-html.filter.ts");
angular.module('formsUnicodeFiltersModule').filter('convertUnicodeWithParamsToHtml', ['$filter', function ($filter) {
        var assert = function (text) {
            if (!text) {
                throw 'Invalid unicode-string-with-parameters: ' + text;
            }
        };
        return function (text) {
            // The parsing here needs to be done with more care because we are
            // replacing two-character strings. We can't naively break by {{ because
            // in strings like \{{{ the second and third characters will be taken as
            // the opening brackets, which is wrong. We can't unescape characters
            // because then the { characters that remain will be ambiguous (they
            // may either be the openings of parameters or literal '{' characters
            // entered by the user. So we build a standard left-to-right parser which
            // examines each character of the string in turn, and processes it
            // accordingly.
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
                }
                else if (text[i] === '{') {
                    assert(text.length > i + 1 && !currentFragmentIsParam &&
                        text[i + 1] === '{');
                    textFragments.push({
                        type: 'text',
                        data: currentFragment
                    });
                    currentFragment = '';
                    currentFragmentIsParam = true;
                    i++;
                }
                else if (text[i] === '}') {
                    assert(text.length > i + 1 && currentFragmentIsParam &&
                        text[i + 1] === '}');
                    textFragments.push({
                        type: 'parameter',
                        data: currentFragment
                    });
                    currentFragment = '';
                    currentFragmentIsParam = false;
                    i++;
                }
                else {
                    currentFragment += text[i];
                }
            }
            assert(!currentFragmentIsParam);
            textFragments.push({
                type: 'text',
                data: currentFragment
            });
            var result = '';
            textFragments.forEach(function (fragment) {
                result += (fragment.type === 'text' ?
                    $filter('convertUnicodeToHtml')(fragment.data) :
                    '<oppia-parameter>' + fragment.data +
                        '</oppia-parameter>');
            });
            return result;
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-validators/is-at-least.filter.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-validators/is-at-least.filter.ts ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator to check if input is greater than
   args.
 */
angular.module('formsValidatorsModule').filter('isAtLeast', [function () {
        return function (input, args) {
            return (input >= args.minValue);
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-validators/is-at-most.filter.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-validators/is-at-most.filter.ts ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator to check if input is less than
   args.
 */
angular.module('formsValidatorsModule').filter('isAtMost', [function () {
        return function (input, args) {
            return (input <= args.maxValue);
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-validators/is-float.filter.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-validators/is-float.filter.ts ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator to check if input is float.
 */
angular.module('formsValidatorsModule').filter('isFloat', [function () {
        return function (input) {
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
                viewValue = input.toString().trim();
            }
            catch (e) {
                return undefined;
            }
            if (viewValue !== '' && FLOAT_REGEXP.test(viewValue)) {
                if (viewValue.slice(-1) === '%') {
                    // This is a percentage, so the input needs to be divided by 100.
                    return parseFloat(viewValue.substring(0, viewValue.length - 1).replace(',', '.')) / 100.0;
                }
                else {
                    return parseFloat(viewValue.replace(',', '.'));
                }
            }
            else {
                return undefined;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-validators/is-integer.filter.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-validators/is-integer.filter.ts ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator to check if input is integer.
 */
angular.module('formsValidatorsModule').filter('isInteger', [function () {
        return function (input) {
            return Number.isInteger(Number(input));
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-validators/is-nonempty.filter.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-validators/is-nonempty.filter.ts ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Validator to check if input is nonempty.
 */
angular.module('formsValidatorsModule').filter('isNonempty', [function () {
        return function (input) {
            return Boolean(input);
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/underscores-to-camel-case.filter.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/underscores-to-camel-case.filter.ts ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview UnderscoresToCamelCase filter for Oppia.
 */
angular.module('stringUtilityFiltersModule').filter('underscoresToCamelCase', [function () {
        return function (input) {
            return input.replace(/_+(.)/g, function (match, group1) {
                return group1.toUpperCase();
            });
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/IdGenerationService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/IdGenerationService.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for generating random IDs.
 */
oppia.factory('IdGenerationService', [function () {
        return {
            generateNewId: function () {
                // Generates random string using the last 10 digits of
                // the string for better entropy.
                var randomString = Math.random().toString(36).slice(2);
                while (randomString.length < 10) {
                    randomString = randomString + '0';
                }
                return randomString.slice(-10);
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service prevents timeouts due to recursion
 * in nested directives. See: http://stackoverflow.com/q/14430655
 */
oppia.factory('NestedDirectivesRecursionTimeoutPreventionService', [
    '$compile',
    function ($compile) {
        return {
            /**
             * Manually compiles the element, fixing the recursion loop.
             * @param {DOM element} element
             * @param {function|object} link - A post-link function, or an object with
             *   function(s) registered via pre and post properties.
             * @return {object} An object containing the linking functions.
             */
            compile: function (element, link) {
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
                    post: function (scope, element) {
                        // Compile the contents.
                        if (!compiledContents) {
                            compiledContents = $compile(contents);
                        }
                        // Re-add the compiled contents to the element.
                        compiledContents(scope, function (clone) {
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
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/SchemaDefaultValueService.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/services/SchemaDefaultValueService.ts ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service provides correct default value for
 * SchemaBasedList item.
 */
oppia.factory('SchemaDefaultValueService', [function () {
        return {
            // TODO(sll): Rewrite this to take validators into account, so that
            // we always start with a valid value.
            getDefaultValue: function (schema) {
                if (schema.choices) {
                    return schema.choices[0];
                }
                else if (schema.type === 'bool') {
                    return false;
                }
                else if (schema.type === 'unicode' || schema.type === 'html') {
                    return '';
                }
                else if (schema.type === 'list') {
                    return [this.getDefaultValue(schema.items)];
                }
                else if (schema.type === 'dict') {
                    var result = {};
                    for (var i = 0; i < schema.properties.length; i++) {
                        result[schema.properties[i].name] = this.getDefaultValue(schema.properties[i].schema);
                    }
                    return result;
                }
                else if (schema.type === 'int' || schema.type === 'float') {
                    return 0;
                }
                else {
                    console.error('Invalid schema type: ' + schema.type);
                }
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts":
/*!*******************************************************************************!*\
  !*** ./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service to check if the last element of SchemaBasedList
 * is undefined.
 */
oppia.factory('SchemaUndefinedLastElementService', [function () {
        return {
            // Returns true if the input value, taken as the last element in a list,
            // should be considered as 'undefined' and therefore deleted.
            getUndefinedValue: function (schema) {
                if (schema.type === 'unicode' || schema.type === 'html') {
                    return '';
                }
                else {
                    return undefined;
                }
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/DeviceInfoService.ts ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service to check if user is on a mobile device.
 */
// See: https://stackoverflow.com/a/11381730
oppia.factory('DeviceInfoService', ['$window', function ($window) {
        return {
            isMobileDevice: function () {
                return Boolean(navigator.userAgent.match(/Android/i) ||
                    navigator.userAgent.match(/webOS/i) ||
                    navigator.userAgent.match(/iPhone/i) ||
                    navigator.userAgent.match(/iPad/i) ||
                    navigator.userAgent.match(/iPod/i) ||
                    navigator.userAgent.match(/BlackBerry/i) ||
                    navigator.userAgent.match(/Windows Phone/i));
            },
            isMobileUserAgent: function () {
                return /Mobi/.test(navigator.userAgent);
            },
            hasTouchEvents: function () {
                return 'ontouchstart' in $window;
            }
        };
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvYXBwbHktdmFsaWRhdGlvbi9hcHBseS12YWxpZGF0aW9uLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvcmVxdWlyZS1pcy1mbG9hdC9yZXF1aXJlLWlzLWZsb2F0LmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWJvb2wtZWRpdG9yL3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci9zY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci9zY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci9zY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci9zY2hlbWEtYmFzZWQtZGljdC1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci9zY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWZsb2F0LWVkaXRvci9zY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yL3NjaGVtYS1iYXNlZC1odG1sLWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yL3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC11bmljb2RlLWVkaXRvci9zY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzL2NvbnZlcnQtdW5pY29kZS10by1odG1sLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy9jb252ZXJ0LXVuaWNvZGUtd2l0aC1wYXJhbXMtdG8taHRtbC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWF0LWxlYXN0LmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtYXQtbW9zdC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWZsb2F0LmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXZhbGlkYXRvcnMvaXMtaW50ZWdlci5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLW5vbmVtcHR5LmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdW5kZXJzY29yZXMtdG8tY2FtZWwtY2FzZS5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9OZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1NjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL2NvbnRleHR1YWwvRGV2aWNlSW5mb1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdLQUFvRTtBQUM1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRJQUFzRDtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyw4SkFBK0Q7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsd05BQzhCO0FBQ3RDLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsa0dBQWlDO0FBQ3pDLG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLHFDQUFxQztBQUN4RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLGdTQUNrRTtBQUMxRSxtQkFBTyxDQUFDLDRSQUNnRTtBQUN4RSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLHdSQUM4RDtBQUN0RSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLGdSQUMwRDtBQUNsRSxtQkFBTyxDQUFDLG9SQUM0RDtBQUNwRSxtQkFBTyxDQUFDLGdTQUNrRTtBQUMxRSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNElBQXNEO0FBQzlELG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsb0hBQTBDO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLGdDQUFnQztBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsZ0NBQWdDO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3TkFDOEI7QUFDdEMsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxrR0FBaUM7QUFDekMsbUJBQU8sQ0FBQyw4SkFBK0Q7QUFDdkUsbUJBQU8sQ0FBQyw4R0FBdUM7QUFDL0MsbUJBQU8sQ0FBQyw4SEFBK0M7QUFDdkQsbUJBQU8sQ0FBQyxvSEFBMEM7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxnQ0FBZ0M7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsOEJBQThCO0FBQ3JFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxrQ0FBa0M7QUFDN0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNE1BQzJDO0FBQ25ELG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsb0hBQTBDO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsZ0dBQWdDO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLE1BQU07QUFDbEM7QUFDQSxJQUFJLEdBQUc7QUFDUDtBQUNBLGtCQUFrQixvQ0FBb0MsZ0JBQWdCO0FBQ3RFO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLG9MQUEwRTtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEVBQTRFO0FBQzVFLG1DQUFtQztBQUNuQztBQUNBLGlDQUFpQztBQUNqQyxxRUFBcUU7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGlCQUFpQjtBQUM1QztBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCLDBCQUEwQjtBQUMxQjtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQSwwQ0FBMEM7QUFDMUM7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0EsMENBQTBDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDckJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3JCTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDL0NMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNwQkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3BCTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDNUJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsWUFBWTtBQUNuQyx1QkFBdUIsZ0JBQWdCO0FBQ3ZDO0FBQ0Esd0JBQXdCLE9BQU87QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLDhCQUE4QjtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNqREw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDOUJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJhZG1pbn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfm1vZGVyYXRvcn5za2lsbF9lZGl0b3J+c3RvcnlfZWRpdG9yfnRvfjNmNmVmNzM4LmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhcHBseWluZyB2YWxpZGF0aW9uLlxuICovXG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdW5kZXJzY29yZXMtdG8tY2FtZWwtY2FzZS5maWx0ZXIudHMnKTtcbi8qIGVzbGludC1kaXNhYmxlIGFuZ3VsYXIvZGlyZWN0aXZlLXJlc3RyaWN0ICovXG5hbmd1bGFyLm1vZHVsZSgnYXBwbHlWYWxpZGF0aW9uTW9kdWxlJykuZGlyZWN0aXZlKCdhcHBseVZhbGlkYXRpb24nLCBbJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxtLCBhdHRycywgY3RybCkge1xuICAgICAgICAgICAgICAgIC8vIEFkZCB2YWxpZGF0b3JzIGluIHJldmVyc2Ugb3JkZXIuXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLnZhbGlkYXRvcnMoKSkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS52YWxpZGF0b3JzKCkuZm9yRWFjaChmdW5jdGlvbiAodmFsaWRhdG9yU3BlYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZyb250ZW5kTmFtZSA9ICRmaWx0ZXIoJ3VuZGVyc2NvcmVzVG9DYW1lbENhc2UnKSh2YWxpZGF0b3JTcGVjLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGVyZSBtYXkgbm90IGJlIGEgY29ycmVzcG9uZGluZyBmcm9udGVuZCBmaWx0ZXIgZm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlYWNoIGJhY2tlbmQgdmFsaWRhdG9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZmlsdGVyKGZyb250ZW5kTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlckFyZ3MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWxpZGF0b3JTcGVjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gJ2lkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJBcmdzWyRmaWx0ZXIoJ3VuZGVyc2NvcmVzVG9DYW1lbENhc2UnKShrZXkpXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmNvcHkodmFsaWRhdG9yU3BlY1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VzdG9tVmFsaWRhdG9yID0gZnVuY3Rpb24gKHZpZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuJHNldFZhbGlkaXR5KGZyb250ZW5kTmFtZSwgJGZpbHRlcihmcm9udGVuZE5hbWUpKHZpZXdWYWx1ZSwgZmlsdGVyQXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2aWV3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC4kcGFyc2Vycy51bnNoaWZ0KGN1c3RvbVZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLiRmb3JtYXR0ZXJzLnVuc2hpZnQoY3VzdG9tVmFsaWRhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuLyogZXNsaW50LWVuYWJsZSBhbmd1bGFyL2RpcmVjdGl2ZS1yZXN0cmljdCAqL1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHJlcXVpcmluZyBcImlzRmxvYXRcIiBmaWx0ZXIuXG4gKi9cbi8vIFRoaXMgc2hvdWxkIGNvbWUgYmVmb3JlICdhcHBseS12YWxpZGF0aW9uJywgaWYgdGhhdCBpcyBkZWZpbmVkIGFzXG4vLyBhbiBhdHRyaWJ1dGUgb24gdGhlIEhUTUwgdGFnLlxucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWZsb2F0LmZpbHRlci50cycpO1xuLyogZXNsaW50LWRpc2FibGUgYW5ndWxhci9kaXJlY3RpdmUtcmVzdHJpY3QgKi9cbmFuZ3VsYXIubW9kdWxlKCdyZXF1aXJlSXNGbG9hdE1vZHVsZScpLmRpcmVjdGl2ZSgncmVxdWlyZUlzRmxvYXQnLCBbJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxtLCBhdHRycywgY3RybCkge1xuICAgICAgICAgICAgICAgIHZhciBmbG9hdFZhbGlkYXRvciA9IGZ1bmN0aW9uICh2aWV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkVmFsdWUgPSAkZmlsdGVyKCdpc0Zsb2F0Jykodmlld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC4kc2V0VmFsaWRpdHkoJ2lzRmxvYXQnLCBmaWx0ZXJlZFZhbHVlICE9PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGN0cmwuJHBhcnNlcnMudW5zaGlmdChmbG9hdFZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICAgY3RybC4kZm9ybWF0dGVycy51bnNoaWZ0KGZsb2F0VmFsaWRhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbi8qIGVzbGludC1lbmFibGUgYW5ndWxhci9kaXJlY3RpdmUtcmVzdHJpY3QgKi9cbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGJvb2xlYW5zLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRCb29sRWRpdG9yTW9kdWxlJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEJvb2xFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICBsYWJlbEZvckZvY3VzVGFyZ2V0OiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRSdcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIG11bHRpcGxlIGNob2ljZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkQ2hvaWNlc0VkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRDaG9pY2VzRWRpdG9yJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNob2ljZXMgZm9yIHRoZSBvYmplY3QncyB2YWx1ZS5cbiAgICAgICAgICAgICAgICBjaG9pY2VzOiAnJicsXG4gICAgICAgICAgICAgICAgLy8gVGhlIHNjaGVtYSBmb3IgdGhpcyBvYmplY3QuXG4gICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBWYWxpZGF0ZSBlYWNoIGNob2ljZSBhZ2FpbnN0IHRoZSBzY2hlbWEuXG4gICAgICAgICAgICAgICAgc2NoZW1hOiAnJicsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3IvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbXBpbGU6IE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UuY29tcGlsZSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0UmVhZG9ubHlTY2hlbWEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZG9ubHlTY2hlbWEgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNjaGVtYSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZWFkb25seVNjaGVtYS5jaG9pY2VzO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlYWRvbmx5U2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBjdXN0b20gdmFsdWVzLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9OZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRDdXN0b21FZGl0b3JNb2R1bGUnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkQ3VzdG9tRWRpdG9yJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNsYXNzIG9mIHRoZSBvYmplY3QgYmVpbmcgZWRpdGVkLlxuICAgICAgICAgICAgICAgIG9ialR5cGU6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWN1c3RvbS1lZGl0b3IvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgY29tcGlsZTogTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS5jb21waWxlXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBkaWN0cy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkRGljdEVkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWREaWN0RWRpdG9yJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnLFxuICAgICAgICAgICAgICAgIC8vIFJlYWQtb25seSBwcm9wZXJ0eS4gQW4gb2JqZWN0IHdob3NlIGtleXMgYW5kIHZhbHVlcyBhcmUgdGhlIGRpY3RcbiAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0aWVzIGFuZCB0aGUgY29ycmVzcG9uZGluZyBzY2hlbWFzLlxuICAgICAgICAgICAgICAgIHByb3BlcnR5U2NoZW1hczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbXBpbGU6IE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UuY29tcGlsZSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsIElkR2VuZXJhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEh1bWFuUmVhZGFibGVQcm9wZXJ0eURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkuZGVzY3JpcHRpb24gfHwgJ1snICsgcHJvcGVydHkubmFtZSArICddJztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZpZWxkSWRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLnByb3BlcnR5U2NoZW1hcygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSByYW5kb20gSURzIGZvciBlYWNoIGZpZWxkLlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZpZWxkSWRzWyRzY29wZS5wcm9wZXJ0eVNjaGVtYXMoKVtpXS5uYW1lXSA9IChJZEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlTmV3SWQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZ2VuZXJhbCBzY2hlbWEtYmFzZWQgZWRpdG9ycy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWJvb2wtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3Ivc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci9zY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWZsb2F0LWVkaXRvci9zY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtaHRtbC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICdzY2hlbWEtYmFzZWQtaW50LWVkaXRvci9zY2hlbWEtYmFzZWQtaW50LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLXVuaWNvZGUtZWRpdG9yL3NjaGVtYS1iYXNlZC11bmljb2RlLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZEVkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIHNjaGVtYTogJyYnLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRCbHVyOiAnPScsXG4gICAgICAgICAgICAgICAgb25JbnB1dEZvY3VzOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRSdcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGZsb2F0cy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2lzLWZsb2F0LmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvRm9jdXNNYW5hZ2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkRmxvYXRFZGl0b3JNb2R1bGUnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkRmxvYXRFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICBvbklucHV0Qmx1cjogJz0nLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRGb2N1czogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckZmlsdGVyJywgJyR0aW1lb3V0JywgJ0ZvY3VzTWFuYWdlclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRmaWx0ZXIsICR0aW1lb3V0LCBGb2N1c01hbmFnZXJTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5oYXNMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGFzRm9jdXNlZEF0TGVhc3RPbmNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sYWJlbEZvckVycm9yRm9jdXNUYXJnZXQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgRm9jdXNNYW5hZ2VyU2VydmljZS5nZW5lcmF0ZUZvY3VzTGFiZWwoKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZhbGlkYXRlID0gZnVuY3Rpb24gKGxvY2FsVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdpc0Zsb2F0JykobG9jYWxWYWx1ZSkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uRm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGFzRm9jdXNlZEF0TGVhc3RPbmNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUub25JbnB1dEZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm9uSW5wdXRGb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub25CbHVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5vbklucHV0Qmx1cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vbklucHV0Qmx1cigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IE1vdmUgdGhlc2UgdG8gbmctbWVzc2FnZXMgd2hlbiB3ZSBtb3ZlIHRvIEFuZ3VsYXIgMS4zLlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0TWluVmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS52YWxpZGF0b3JzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5pZCA9PT0gJ2lzX2F0X2xlYXN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5taW5fdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0TWF4VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS52YWxpZGF0b3JzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5pZCA9PT0gJ2lzX2F0X21vc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NvcGUudmFsaWRhdG9ycygpW2ldLm1heF92YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5vbktleXByZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cygkc2NvcGUuZmxvYXRGb3JtLmZsb2F0VmFsdWUuJGVycm9yKS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb2N1c01hbmFnZXJTZXJ2aWNlLnNldEZvY3VzKCRzY29wZS5sYWJlbEZvckVycm9yRm9jdXNUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzdWJtaXR0ZWRTY2hlbWFCYXNlZEZsb2F0Rm9ybScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc1VzZXJDdXJyZW50bHlUeXBpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUgPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBwcmV2ZW50cyB0aGUgcmVkICdpbnZhbGlkIGlucHV0JyB3YXJuaW5nIG1lc3NhZ2UgZnJvbVxuICAgICAgICAgICAgICAgICAgICAvLyBmbGFzaGluZyBhdCB0aGUgb3V0c2V0LlxuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgSFRNTC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkSHRtbEVkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRIdG1sRWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICB1aUNvbmZpZzogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtaHRtbC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgaW50ZWdlcnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZEludEVkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRJbnRFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICBvbklucHV0Qmx1cjogJz0nLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRGb2N1czogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtaW50LWVkaXRvci9zY2hlbWEtYmFzZWQtaW50LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5vbktleXByZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc3VibWl0dGVkU2NoZW1hQmFzZWRJbnRGb3JtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgbGlzdHMuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0lkR2VuZXJhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvRm9jdXNNYW5hZ2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkTGlzdEVkaXRvck1vZHVsZScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRMaXN0RWRpdG9yJywgW1xuICAgICdGb2N1c01hbmFnZXJTZXJ2aWNlJywgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLFxuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZScsICdTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKEZvY3VzTWFuYWdlclNlcnZpY2UsIElkR2VuZXJhdGlvblNlcnZpY2UsIE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UsIFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UsIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICAvLyBSZWFkLW9ubHkgcHJvcGVydHkuIFRoZSBzY2hlbWEgZGVmaW5pdGlvbiBmb3IgZWFjaCBpdGVtIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIGxpc3QuXG4gICAgICAgICAgICAgICAgaXRlbVNjaGVtYTogJyYnLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBsZW5ndGggb2YgdGhlIGxpc3QuIElmIG5vdCBzcGVjaWZpZWQsIHRoZSBsaXN0IGlzIG9mIGFyYml0cmFyeVxuICAgICAgICAgICAgICAgIC8vIGxlbmd0aC5cbiAgICAgICAgICAgICAgICBsZW46ICc9JyxcbiAgICAgICAgICAgICAgICAvLyBVSSBjb25maWd1cmF0aW9uLiBNYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgIHVpQ29uZmlnOiAnJicsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbXBpbGU6IE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UuY29tcGlsZSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFzZUZvY3VzTGFiZWwgPSAoJHNjb3BlLmxhYmVsRm9yRm9jdXNUYXJnZXQoKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgSWRHZW5lcmF0aW9uU2VydmljZS5nZW5lcmF0ZU5ld0lkKCkgKyAnLScpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0Rm9jdXNMYWJlbCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJlYXQgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIGxpc3QgYXMgYSBzcGVjaWFsIGNhc2UgLS0gaWYgdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGlzdCBpcyBjb250YWluZWQgaW4gYW5vdGhlciBsaXN0LCBhbmQgdGhlIG91dGVyIGxpc3QgaXMgb3BlbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aXRoIGEgZGVzaXJlIHRvIGF1dG9mb2N1cyBvbiB0aGUgZmlyc3QgaW5wdXQgZmllbGQsIHdlIGNhbiB0aGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb2N1cyBvbiB0aGUgZ2l2ZW4gJHNjb3BlLmxhYmVsRm9yRm9jdXNUYXJnZXQoKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IFRoaXMgd2lsbCBjYXVzZSBwcm9ibGVtcyBmb3IgbGlzdHMgbmVzdGVkIHdpdGhpbiBsaXN0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIHN1Yi1lbGVtZW50IDAgPiAxIHdpbGwgaGF2ZSB0aGUgc2FtZSBsYWJlbCBhcyBzdWItZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gMSA+IDAuIEJ1dCB3ZSB3aWxsIGFzc3VtZSAoZm9yIG5vdykgdGhhdCBuZXN0ZWQgbGlzdHMgd29uJ3QgYmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZWQgLS0gaWYgdGhleSBhcmUsIHRoaXMgd2lsbCBuZWVkIHRvIGJlIGNoYW5nZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGluZGV4ID09PSAwID8gYmFzZUZvY3VzTGFiZWwgOiBiYXNlRm9jdXNMYWJlbCArIGluZGV4LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRFbGVtZW50VGV4dCA9ICdBZGQgZWxlbWVudCc7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUudWlDb25maWcoKSAmJiAkc2NvcGUudWlDb25maWcoKS5hZGRfZWxlbWVudF90ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkRWxlbWVudFRleHQgPSAkc2NvcGUudWlDb25maWcoKS5hZGRfZWxlbWVudF90ZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgaGlkZSB0aGUgJ2FkZCBpdGVtJyBidXR0b24gaW4gdGhlIGNhc2Ugb2Ygc2luZ2xlLWxpbmUgdW5pY29kZVxuICAgICAgICAgICAgICAgICAgICAvLyBpbnB1dC5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT25lTGluZUlucHV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtU2NoZW1hKCkudHlwZSAhPT0gJ3VuaWNvZGUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXRlbVNjaGVtYSgpLmhhc093blByb3BlcnR5KCdjaG9pY2VzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09uZUxpbmVJbnB1dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCRzY29wZS5pdGVtU2NoZW1hKCkudWlfY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW1TY2hlbWEoKS51aV9jb25maWcuY29kaW5nX21vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPbmVMaW5lSW5wdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCRzY29wZS5pdGVtU2NoZW1hKCkudWlfY29uZmlnLmhhc093blByb3BlcnR5KCdyb3dzJykgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXRlbVNjaGVtYSgpLnVpX2NvbmZpZy5yb3dzID4gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09uZUxpbmVJbnB1dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5taW5MaXN0TGVuZ3RoID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1heExpc3RMZW5ndGggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd0R1cGxpY2F0ZXNXYXJuaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUudmFsaWRhdG9ycygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS52YWxpZGF0b3JzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5pZCA9PT0gJ2hhc19sZW5ndGhfYXRfbW9zdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1heExpc3RMZW5ndGggPSAkc2NvcGUudmFsaWRhdG9ycygpW2ldLm1heF92YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5pZCA9PT0gJ2hhc19sZW5ndGhfYXRfbGVhc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5taW5MaXN0TGVuZ3RoID0gJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5taW5fdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCRzY29wZS52YWxpZGF0b3JzKClbaV0uaWQgPT09ICdpc191bmlxdWlmaWVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc2hvd0R1cGxpY2F0ZXNXYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCA8ICRzY29wZS5taW5MaXN0TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubG9jYWxWYWx1ZS5wdXNoKFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UuZ2V0RGVmYXVsdFZhbHVlKCRzY29wZS5pdGVtU2NoZW1hKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGFzRHVwbGljYXRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZXNTb0ZhciA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICRzY29wZS5sb2NhbFZhbHVlW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWVzU29GYXIuaGFzT3duUHJvcGVydHkodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlc1NvRmFyW3ZhbHVlXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXNPbmVMaW5lSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhpZGVBZGRJdGVtQnV0dG9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2NhbFZhbHVlLnB1c2goU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZS5nZXREZWZhdWx0VmFsdWUoJHNjb3BlLml0ZW1TY2hlbWEoKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvY3VzTWFuYWdlclNlcnZpY2Uuc2V0Rm9jdXMoJHNjb3BlLmdldEZvY3VzTGFiZWwoJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoIC0gMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfZGVsZXRlTGFzdEVsZW1lbnRJZlVuZGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFZhbHVlSW5kZXggPSAkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZVRvQ29uc2lkZXJVbmRlZmluZWQgPSAoU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlLmdldFVuZGVmaW5lZFZhbHVlKCRzY29wZS5pdGVtU2NoZW1hKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWVbbGFzdFZhbHVlSW5kZXhdID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVRvQ29uc2lkZXJVbmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZUVsZW1lbnQobGFzdFZhbHVlSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVsZXRlRW1wdHlFbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWVbaV0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGVsZXRlRWxlbWVudChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sb2NhbFZhbHVlWzBdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sYXN0RWxlbWVudE9uQmx1ciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZGVsZXRlTGFzdEVsZW1lbnRJZlVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWRkSXRlbUJ1dHRvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWRkSXRlbUJ1dHRvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVFbXB0eUVsZW1lbnRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzQWRkSXRlbUJ1dHRvblByZXNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5oaWRlQWRkSXRlbUJ1dHRvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5fb25DaGlsZEZvcm1TdWJtaXQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogSWYgZm9ybSBzdWJtaXNzaW9uIGhhcHBlbnMgb24gbGFzdCBlbGVtZW50IG9mIHRoZSBzZXQgKGkuZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0aGUgYWRkIGl0ZW0gYnV0dG9uIGlzIGFic2VudCkgdGhlbiBhdXRvbWF0aWNhbGx5IGFkZCB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZWxlbWVudCB0byB0aGUgbGlzdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoJHNjb3BlLm1heExpc3RMZW5ndGggPT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCA8ICRzY29wZS5tYXhMaXN0TGVuZ3RoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgISEkc2NvcGUubG9jYWxWYWx1ZVskc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFkZEVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIElmIGZvcm0gc3VibWlzc2lvbiBoYXBwZW5zIG9uIGV4aXN0aW5nIGVsZW1lbnQgcmVtb3ZlIGZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGZyb20gaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc3VibWl0dGVkU2NoZW1hQmFzZWRJbnRGb3JtJywgJHNjb3BlLl9vbkNoaWxkRm9ybVN1Ym1pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzdWJtaXR0ZWRTY2hlbWFCYXNlZEZsb2F0Rm9ybScsICRzY29wZS5fb25DaGlsZEZvcm1TdWJtaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc3VibWl0dGVkU2NoZW1hQmFzZWRVbmljb2RlRm9ybScsICRzY29wZS5fb25DaGlsZEZvcm1TdWJtaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGxldCB0aGUgUlRFIGtub3cgdGhhdCBIdG1sQ29udGVudCBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbEh0bWxDb250ZW50Q2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlbiA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgbGVuZ3RoIGZvciBsaXN0IGVkaXRvcjogJyArICRzY29wZS5sZW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlbiAhPT0gJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0xpc3QgZWRpdG9yIGxlbmd0aCBkb2VzIG5vdCBtYXRjaCBsZW5ndGggb2YgaW5wdXQnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyB2YWx1ZTogJyArICRzY29wZS5sZW4gKyAnICcgKyAkc2NvcGUubG9jYWxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciB1bmljb2RlIHN0cmluZ3MuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzLycgK1xuICAgICdjb252ZXJ0LXVuaWNvZGUtd2l0aC1wYXJhbXMtdG8taHRtbC5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvRGV2aWNlSW5mb1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZFVuaWNvZGVFZGl0b3JNb2R1bGUnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkVW5pY29kZUVkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzOiAnJicsXG4gICAgICAgICAgICAgICAgdWlDb25maWc6ICcmJyxcbiAgICAgICAgICAgICAgICBsYWJlbEZvckZvY3VzVGFyZ2V0OiAnJicsXG4gICAgICAgICAgICAgICAgb25JbnB1dEJsdXI6ICc9JyxcbiAgICAgICAgICAgICAgICBvbklucHV0Rm9jdXM6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLXVuaWNvZGUtZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckZmlsdGVyJywgJyRzY2UnLCAnJHRyYW5zbGF0ZScsICdEZXZpY2VJbmZvU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJGZpbHRlciwgJHNjZSwgJHRyYW5zbGF0ZSwgRGV2aWNlSW5mb1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS51aUNvbmZpZygpICYmICRzY29wZS51aUNvbmZpZygpLmNvZGluZ19tb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGbGFnIHRoYXQgaXMgZmxpcHBlZCBlYWNoIHRpbWUgdGhlIGNvZGVtaXJyb3IgdmlldyBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2hvd24uIChUaGUgY29kZW1pcnJvciBpbnN0YW5jZSBuZWVkcyB0byBiZSByZWZyZXNoZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZXJ5IHRpbWUgaXQgaXMgdW5oaWRkZW4uKVxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvZGVtaXJyb3JTdGF0dXMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBDT0RJTkdfTU9ERV9OT05FID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvZGVtaXJyb3JPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgdGFicyB0byBzcGFjZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFLZXlzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRhYjogZnVuY3Rpb24gKGNtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3BhY2VzID0gQXJyYXkoY20uZ2V0T3B0aW9uKCdpbmRlbnRVbml0JykgKyAxKS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbS5yZXBsYWNlU2VsZWN0aW9uKHNwYWNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIHRoZSBjdXJzb3IgdG8gdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVuZFNlbGVjdGlvblBvcyA9IGNtLmdldERvYygpLmdldEN1cnNvcignaGVhZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY20uZ2V0RG9jKCkuc2V0Q3Vyc29yKGVuZFNlbGVjdGlvblBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGVudFdpdGhUYWJzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyczogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXNEaXNhYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvZGVtaXJyb3JPcHRpb25zLnJlYWRPbmx5ID0gJ25vY3Vyc29yJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBvbmx5ICdjb2ZmZWVzY3JpcHQnLCAnamF2YXNjcmlwdCcsICdsdWEnLCAncHl0aG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICdydWJ5JyBhbmQgJ3NjaGVtZScgaGF2ZSBDb2RlTWlycm9yLXN1cHBvcnRlZCBzeW50YXhcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhpZ2hsaWdodGluZy4gRm9yIG90aGVyIGxhbmd1YWdlcywgc3ludGF4IGhpZ2hsaWdodGluZyB3aWxsIG5vdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGFwcGVuLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS51aUNvbmZpZygpLmNvZGluZ19tb2RlICE9PSBDT0RJTkdfTU9ERV9OT05FKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvZGVtaXJyb3JPcHRpb25zLm1vZGUgPSAkc2NvcGUudWlDb25maWcoKS5jb2RpbmdfbW9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2RlbWlycm9yU3RhdHVzID0gISRzY29wZS5jb2RlbWlycm9yU3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIGZvcm0gdmlldyBpcyBvcGVuZWQsIGZsaXAgdGhlIHN0YXR1cyBmbGFnLiBUaGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpbWVvdXQgc2VlbXMgdG8gYmUgbmVlZGVkIGZvciB0aGUgbGluZSBudW1iZXJzIGV0Yy4gdG8gZGlzcGxheVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvcGVybHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzY2hlbWFCYXNlZEZvcm1zU2hvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jb2RlbWlycm9yU3RhdHVzID0gISRzY29wZS5jb2RlbWlycm9yU3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub25LZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pdHRlZFNjaGVtYUJhc2VkVW5pY29kZUZvcm0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldFBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUudWlDb25maWcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNjb3BlLnVpQ29uZmlnKCkucGxhY2Vob2xkZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGV2aWNlSW5mb1NlcnZpY2UuaGFzVG91Y2hFdmVudHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHRyYW5zbGF0ZS5pbnN0YW50KCdJMThOX1BMQVlFUl9ERUZBVUxUX01PQklMRV9QTEFDRUhPTERFUicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLnVpQ29uZmlnKCkucGxhY2Vob2xkZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRSb3dzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUudWlDb25maWcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS51aUNvbmZpZygpLnJvd3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRDb2RpbmdNb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUudWlDb25maWcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS51aUNvbmZpZygpLmNvZGluZ19tb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZ2V0RGlzcGxheWVkVmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbCgkZmlsdGVyKCdjb252ZXJ0VW5pY29kZVdpdGhQYXJhbXNUb0h0bWwnKSgkc2NvcGUubG9jYWxWYWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydHMgdW5pY29kZSB0byBIVE1MLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdmb3Jtc1VuaWNvZGVGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0VW5pY29kZVRvSHRtbCcsIFtcbiAgICAnJHNhbml0aXplJywgJ0h0bWxFc2NhcGVyU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRzYW5pdGl6ZSwgSHRtbEVzY2FwZXJTZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuICRzYW5pdGl6ZShIdG1sRXNjYXBlclNlcnZpY2UudW5lc2NhcGVkU3RyVG9Fc2NhcGVkU3RyKHRleHQpKTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydHMge3tuYW1lfX0gc3Vic3RyaW5ncyB0b1xuICogPG9wcGlhLXBhcmFtZXRlcj5uYW1lPC9vcHBpYS1wYXJhbWV0ZXI+IHRhZ3MgYW5kIHVuZXNjYXBlcyB0aGVcbiAqIHssIH0gYW5kIFxcIGNoYXJhY3RlcnMuIFRoaXMgaXMgZG9uZSBieSByZWFkaW5nIHRoZSBnaXZlbiBzdHJpbmcgZnJvbVxuICogbGVmdCB0byByaWdodDogaWYgd2Ugc2VlIGEgYmFja3NsYXNoLCB3ZSB1c2UgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXI7XG4gKiBpZiB3ZSBzZWUgYSAne3snLCB0aGlzIGlzIHRoZSBzdGFydCBvZiBhIHBhcmFtZXRlcjsgaWYgd2Ugc2VlIGEgJ319JztcbiAqIHRoaXMgaXMgdGhlIGVuZCBvZiBhIHBhcmFtZXRlci5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy11bmljb2RlLWZpbHRlcnMvY29udmVydC11bmljb2RlLXRvLWh0bWwuZmlsdGVyLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNVbmljb2RlRmlsdGVyc01vZHVsZScpLmZpbHRlcignY29udmVydFVuaWNvZGVXaXRoUGFyYW1zVG9IdG1sJywgWyckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgdmFyIGFzc2VydCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSW52YWxpZCB1bmljb2RlLXN0cmluZy13aXRoLXBhcmFtZXRlcnM6ICcgKyB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIC8vIFRoZSBwYXJzaW5nIGhlcmUgbmVlZHMgdG8gYmUgZG9uZSB3aXRoIG1vcmUgY2FyZSBiZWNhdXNlIHdlIGFyZVxuICAgICAgICAgICAgLy8gcmVwbGFjaW5nIHR3by1jaGFyYWN0ZXIgc3RyaW5ncy4gV2UgY2FuJ3QgbmFpdmVseSBicmVhayBieSB7eyBiZWNhdXNlXG4gICAgICAgICAgICAvLyBpbiBzdHJpbmdzIGxpa2UgXFx7e3sgdGhlIHNlY29uZCBhbmQgdGhpcmQgY2hhcmFjdGVycyB3aWxsIGJlIHRha2VuIGFzXG4gICAgICAgICAgICAvLyB0aGUgb3BlbmluZyBicmFja2V0cywgd2hpY2ggaXMgd3JvbmcuIFdlIGNhbid0IHVuZXNjYXBlIGNoYXJhY3RlcnNcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgdGhlbiB0aGUgeyBjaGFyYWN0ZXJzIHRoYXQgcmVtYWluIHdpbGwgYmUgYW1iaWd1b3VzICh0aGV5XG4gICAgICAgICAgICAvLyBtYXkgZWl0aGVyIGJlIHRoZSBvcGVuaW5ncyBvZiBwYXJhbWV0ZXJzIG9yIGxpdGVyYWwgJ3snIGNoYXJhY3RlcnNcbiAgICAgICAgICAgIC8vIGVudGVyZWQgYnkgdGhlIHVzZXIuIFNvIHdlIGJ1aWxkIGEgc3RhbmRhcmQgbGVmdC10by1yaWdodCBwYXJzZXIgd2hpY2hcbiAgICAgICAgICAgIC8vIGV4YW1pbmVzIGVhY2ggY2hhcmFjdGVyIG9mIHRoZSBzdHJpbmcgaW4gdHVybiwgYW5kIHByb2Nlc3NlcyBpdFxuICAgICAgICAgICAgLy8gYWNjb3JkaW5nbHkuXG4gICAgICAgICAgICB2YXIgdGV4dEZyYWdtZW50cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRGcmFnbWVudCA9ICcnO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRGcmFnbWVudElzUGFyYW0gPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0ZXh0W2ldID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KCFjdXJyZW50RnJhZ21lbnRJc1BhcmFtICYmIHRleHQubGVuZ3RoID4gaSArIDEgJiYge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3snOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ30nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1xcXFwnOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1bdGV4dFtpICsgMV1dKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ICs9IHRleHRbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRleHRbaV0gPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQodGV4dC5sZW5ndGggPiBpICsgMSAmJiAhY3VycmVudEZyYWdtZW50SXNQYXJhbSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFtpICsgMV0gPT09ICd7Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRleHRGcmFnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBjdXJyZW50RnJhZ21lbnRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGcmFnbWVudCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RnJhZ21lbnRJc1BhcmFtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0ZXh0W2ldID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KHRleHQubGVuZ3RoID4gaSArIDEgJiYgY3VycmVudEZyYWdtZW50SXNQYXJhbSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFtpICsgMV0gPT09ICd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRleHRGcmFnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncGFyYW1ldGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGN1cnJlbnRGcmFnbWVudFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGcmFnbWVudElzUGFyYW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ICs9IHRleHRbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzZXJ0KCFjdXJyZW50RnJhZ21lbnRJc1BhcmFtKTtcbiAgICAgICAgICAgIHRleHRGcmFnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgIGRhdGE6IGN1cnJlbnRGcmFnbWVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICAgICAgICB0ZXh0RnJhZ21lbnRzLmZvckVhY2goZnVuY3Rpb24gKGZyYWdtZW50KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IChmcmFnbWVudC50eXBlID09PSAndGV4dCcgP1xuICAgICAgICAgICAgICAgICAgICAkZmlsdGVyKCdjb252ZXJ0VW5pY29kZVRvSHRtbCcpKGZyYWdtZW50LmRhdGEpIDpcbiAgICAgICAgICAgICAgICAgICAgJzxvcHBpYS1wYXJhbWV0ZXI+JyArIGZyYWdtZW50LmRhdGEgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvb3BwaWEtcGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBWYWxpZGF0b3IgdG8gY2hlY2sgaWYgaW5wdXQgaXMgZ3JlYXRlciB0aGFuXG4gICBhcmdzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNWYWxpZGF0b3JzTW9kdWxlJykuZmlsdGVyKCdpc0F0TGVhc3QnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0LCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0ID49IGFyZ3MubWluVmFsdWUpO1xuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVmFsaWRhdG9yIHRvIGNoZWNrIGlmIGlucHV0IGlzIGxlc3MgdGhhblxuICAgYXJncy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2Zvcm1zVmFsaWRhdG9yc01vZHVsZScpLmZpbHRlcignaXNBdE1vc3QnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0LCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0IDw9IGFyZ3MubWF4VmFsdWUpO1xuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVmFsaWRhdG9yIHRvIGNoZWNrIGlmIGlucHV0IGlzIGZsb2F0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNWYWxpZGF0b3JzTW9kdWxlJykuZmlsdGVyKCdpc0Zsb2F0JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIEZMT0FUX1JFR0VYUCA9IC8oPz0uKlxcZCleXFwtP1xcZCooXFwufFxcLCk/XFxkKlxcJT8kLztcbiAgICAgICAgICAgIC8vIFRoaXMgcmVnZXggYWNjZXB0cyBmbG9hdHMgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXRzOlxuICAgICAgICAgICAgLy8gMC5cbiAgICAgICAgICAgIC8vIDAuNTUuLlxuICAgICAgICAgICAgLy8gLTAuNTUuLlxuICAgICAgICAgICAgLy8gLjU1NS4uXG4gICAgICAgICAgICAvLyAtLjU1NS4uXG4gICAgICAgICAgICAvLyBBbGwgZXhhbXBsZXMgYWJvdmUgd2l0aCAnLicgcmVwbGFjZWQgd2l0aCAnLCcgYXJlIGFsc28gdmFsaWQuXG4gICAgICAgICAgICAvLyBFeHByZXNzaW9ucyBjb250YWluaW5nICUgYXJlIGFsc28gdmFsaWQgKDUuMSUgZXRjKS5cbiAgICAgICAgICAgIHZhciB2aWV3VmFsdWUgPSAnJztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdmlld1ZhbHVlID0gaW5wdXQudG9TdHJpbmcoKS50cmltKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmlld1ZhbHVlICE9PSAnJyAmJiBGTE9BVF9SRUdFWFAudGVzdCh2aWV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZpZXdWYWx1ZS5zbGljZSgtMSkgPT09ICclJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgcGVyY2VudGFnZSwgc28gdGhlIGlucHV0IG5lZWRzIHRvIGJlIGRpdmlkZWQgYnkgMTAwLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2aWV3VmFsdWUuc3Vic3RyaW5nKDAsIHZpZXdWYWx1ZS5sZW5ndGggLSAxKS5yZXBsYWNlKCcsJywgJy4nKSkgLyAxMDAuMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHZpZXdWYWx1ZS5yZXBsYWNlKCcsJywgJy4nKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFZhbGlkYXRvciB0byBjaGVjayBpZiBpbnB1dCBpcyBpbnRlZ2VyLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNWYWxpZGF0b3JzTW9kdWxlJykuZmlsdGVyKCdpc0ludGVnZXInLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcihOdW1iZXIoaW5wdXQpKTtcbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFZhbGlkYXRvciB0byBjaGVjayBpZiBpbnB1dCBpcyBub25lbXB0eS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2Zvcm1zVmFsaWRhdG9yc01vZHVsZScpLmZpbHRlcignaXNOb25lbXB0eScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBCb29sZWFuKGlucHV0KTtcbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFVuZGVyc2NvcmVzVG9DYW1lbENhc2UgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCd1bmRlcnNjb3Jlc1RvQ2FtZWxDYXNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL18rKC4pL2csIGZ1bmN0aW9uIChtYXRjaCwgZ3JvdXAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwMS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGdlbmVyYXRpbmcgcmFuZG9tIElEcy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnSWRHZW5lcmF0aW9uU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZW5lcmF0ZU5ld0lkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGVzIHJhbmRvbSBzdHJpbmcgdXNpbmcgdGhlIGxhc3QgMTAgZGlnaXRzIG9mXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN0cmluZyBmb3IgYmV0dGVyIGVudHJvcHkuXG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVN0cmluZyA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuICAgICAgICAgICAgICAgIHdoaWxlIChyYW5kb21TdHJpbmcubGVuZ3RoIDwgMTApIHtcbiAgICAgICAgICAgICAgICAgICAgcmFuZG9tU3RyaW5nID0gcmFuZG9tU3RyaW5nICsgJzAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZG9tU3RyaW5nLnNsaWNlKC0xMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHByZXZlbnRzIHRpbWVvdXRzIGR1ZSB0byByZWN1cnNpb25cbiAqIGluIG5lc3RlZCBkaXJlY3RpdmVzLiBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzE0NDMwNjU1XG4gKi9cbm9wcGlhLmZhY3RvcnkoJ05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UnLCBbXG4gICAgJyRjb21waWxlJyxcbiAgICBmdW5jdGlvbiAoJGNvbXBpbGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTWFudWFsbHkgY29tcGlsZXMgdGhlIGVsZW1lbnQsIGZpeGluZyB0aGUgcmVjdXJzaW9uIGxvb3AuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge0RPTSBlbGVtZW50fSBlbGVtZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufG9iamVjdH0gbGluayAtIEEgcG9zdC1saW5rIGZ1bmN0aW9uLCBvciBhbiBvYmplY3Qgd2l0aFxuICAgICAgICAgICAgICogICBmdW5jdGlvbihzKSByZWdpc3RlcmVkIHZpYSBwcmUgYW5kIHBvc3QgcHJvcGVydGllcy5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge29iamVjdH0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGxpbmtpbmcgZnVuY3Rpb25zLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb21waWxlOiBmdW5jdGlvbiAoZWxlbWVudCwgbGluaykge1xuICAgICAgICAgICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgbGluayBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKGxpbmspKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmsgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0OiBsaW5rXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEJyZWFrIHRoZSByZWN1cnNpb24gbG9vcCBieSByZW1vdmluZyB0aGUgY29udGVudHMsXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRzID0gZWxlbWVudC5jb250ZW50cygpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHZhciBjb21waWxlZENvbnRlbnRzO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHByZTogKGxpbmsgJiYgbGluay5wcmUpID8gbGluay5wcmUgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBwb3N0OiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXBpbGUgdGhlIGNvbnRlbnRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjb21waWxlZENvbnRlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRDb250ZW50cyA9ICRjb21waWxlKGNvbnRlbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlLWFkZCB0aGUgY29tcGlsZWQgY29udGVudHMgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlZENvbnRlbnRzKHNjb3BlLCBmdW5jdGlvbiAoY2xvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZChjbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGwgdGhlIHBvc3QtbGlua2luZyBmdW5jdGlvbiwgaWYgYW55LlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmsgJiYgbGluay5wb3N0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluay5wb3N0LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHByb3ZpZGVzIGNvcnJlY3QgZGVmYXVsdCB2YWx1ZSBmb3JcbiAqIFNjaGVtYUJhc2VkTGlzdCBpdGVtLlxuICovXG5vcHBpYS5mYWN0b3J5KCdTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogUmV3cml0ZSB0aGlzIHRvIHRha2UgdmFsaWRhdG9ycyBpbnRvIGFjY291bnQsIHNvIHRoYXRcbiAgICAgICAgICAgIC8vIHdlIGFsd2F5cyBzdGFydCB3aXRoIGEgdmFsaWQgdmFsdWUuXG4gICAgICAgICAgICBnZXREZWZhdWx0VmFsdWU6IGZ1bmN0aW9uIChzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLmNob2ljZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjaGVtYS5jaG9pY2VzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSA9PT0gJ2Jvb2wnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NoZW1hLnR5cGUgPT09ICd1bmljb2RlJyB8fCBzY2hlbWEudHlwZSA9PT0gJ2h0bWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2NoZW1hLnR5cGUgPT09ICdsaXN0Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuZ2V0RGVmYXVsdFZhbHVlKHNjaGVtYS5pdGVtcyldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSA9PT0gJ2RpY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2hlbWEucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3NjaGVtYS5wcm9wZXJ0aWVzW2ldLm5hbWVdID0gdGhpcy5nZXREZWZhdWx0VmFsdWUoc2NoZW1hLnByb3BlcnRpZXNbaV0uc2NoZW1hKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSA9PT0gJ2ludCcgfHwgc2NoZW1hLnR5cGUgPT09ICdmbG9hdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIHNjaGVtYSB0eXBlOiAnICsgc2NoZW1hLnR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gY2hlY2sgaWYgdGhlIGxhc3QgZWxlbWVudCBvZiBTY2hlbWFCYXNlZExpc3RcbiAqIGlzIHVuZGVmaW5lZC5cbiAqL1xub3BwaWEuZmFjdG9yeSgnU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgaW5wdXQgdmFsdWUsIHRha2VuIGFzIHRoZSBsYXN0IGVsZW1lbnQgaW4gYSBsaXN0LFxuICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQgYXMgJ3VuZGVmaW5lZCcgYW5kIHRoZXJlZm9yZSBkZWxldGVkLlxuICAgICAgICAgICAgZ2V0VW5kZWZpbmVkVmFsdWU6IGZ1bmN0aW9uIChzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NoZW1hLnR5cGUgPT09ICd1bmljb2RlJyB8fCBzY2hlbWEudHlwZSA9PT0gJ2h0bWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBjaGVjayBpZiB1c2VyIGlzIG9uIGEgbW9iaWxlIGRldmljZS5cbiAqL1xuLy8gU2VlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTEzODE3MzBcbm9wcGlhLmZhY3RvcnkoJ0RldmljZUluZm9TZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4obmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKSB8fFxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKSB8fFxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHxcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKSB8fFxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpIHx8XG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSkgfHxcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNNb2JpbGVVc2VyQWdlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gL01vYmkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzVG91Y2hFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ29udG91Y2hzdGFydCcgaW4gJHdpbmRvdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9