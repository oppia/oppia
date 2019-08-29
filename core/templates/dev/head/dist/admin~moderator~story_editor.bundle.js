(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~moderator~story_editor"],{

/***/ "./core/templates/dev/head/components/forms/custom-forms-directives/apply-validation.directive.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/custom-forms-directives/apply-validation.directive.ts ***!
  \********************************************************************************************************/
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
angular.module('oppia').directive('applyValidation', [
    '$filter', function ($filter) {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {},
            bindToController: {
                validators: '&'
            },
            controllerAs: '$ctrl',
            controller: [function () { }],
            link: function (scope, elm, attrs, ctrl) {
                // Add validators in reverse order.
                if (scope.$ctrl.validators()) {
                    scope.$ctrl.validators().forEach(function (validatorSpec) {
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

/***/ "./core/templates/dev/head/components/forms/custom-forms-directives/require-is-float.directive.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/custom-forms-directives/require-is-float.directive.ts ***!
  \********************************************************************************************************/
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
__webpack_require__(/*! components/forms/validators/is-float.filter.ts */ "./core/templates/dev/head/components/forms/validators/is-float.filter.ts");
/* eslint-disable angular/directive-restrict */
angular.module('oppia').directive('requireIsFloat', [
    '$filter', function ($filter) {
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

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-bool-editor.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-bool-editor.directive.ts ***!
  \*************************************************************************************************************/
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
angular.module('oppia').directive('schemaBasedBoolEditor', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                isDisabled: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/' +
                'schema-based-editors/schema-based-bool-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-choices-editor.directive.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-choices-editor.directive.ts ***!
  \****************************************************************************************************************/
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
angular.module('oppia').directive('schemaBasedChoicesEditor', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                // The choices for the object's value.
                choices: '&',
                // The schema for this object.
                // TODO(sll): Validate each choice against the schema.
                schema: '&',
                isDisabled: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-choices-editor.directive.html'),
            controllerAs: '$ctrl',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: ['$scope', function ($scope) {
                    var ctrl = this;
                    ctrl.getReadonlySchema = function () {
                        var readonlySchema = angular.copy(ctrl.schema());
                        delete readonlySchema.choices;
                        return readonlySchema;
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-custom-editor.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-custom-editor.directive.ts ***!
  \***************************************************************************************************************/
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
__webpack_require__(/*! components/forms/custom-forms-directives/object-editor.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/object-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
angular.module('oppia').directive('schemaBasedCustomEditor', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                // The class of the object being edited.
                objType: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-custom-editor.directive.html'),
            controllerAs: '$ctrl',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-dict-editor.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-dict-editor.directive.ts ***!
  \*************************************************************************************************************/
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
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
angular.module('oppia').directive('schemaBasedDictEditor', [
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
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-dict-editor.directive.html'),
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

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts ***!
  \********************************************************************************************************/
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
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-bool-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-bool-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-choices-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-choices-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-custom-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-custom-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-dict-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-dict-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-float-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-float-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-html-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-html-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-int-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-int-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-list-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-list-editor.directive.ts");
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-unicode-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-unicode-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('schemaBasedEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                schema: '&',
                isDisabled: '&',
                localValue: '=',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-float-editor.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-float-editor.directive.ts ***!
  \**************************************************************************************************************/
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
__webpack_require__(/*! components/forms/custom-forms-directives/apply-validation.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/apply-validation.directive.ts");
__webpack_require__(/*! components/forms/custom-forms-directives/require-is-float.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/require-is-float.directive.ts");
__webpack_require__(/*! components/forms/validators/is-float.filter.ts */ "./core/templates/dev/head/components/forms/validators/is-float.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
angular.module('oppia').directive('schemaBasedFloatEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                isDisabled: '&',
                validators: '&',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-float-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$filter', '$timeout', 'FocusManagerService',
                function ($scope, $filter, $timeout, FocusManagerService) {
                    var ctrl = this;
                    ctrl.hasLoaded = false;
                    ctrl.isUserCurrentlyTyping = false;
                    ctrl.hasFocusedAtLeastOnce = false;
                    ctrl.labelForErrorFocusTarget =
                        FocusManagerService.generateFocusLabel();
                    ctrl.validate = function (localValue) {
                        return $filter('isFloat')(localValue) !== undefined;
                    };
                    ctrl.onFocus = function () {
                        ctrl.hasFocusedAtLeastOnce = true;
                        if (ctrl.onInputFocus) {
                            ctrl.onInputFocus();
                        }
                    };
                    ctrl.onBlur = function () {
                        ctrl.isUserCurrentlyTyping = false;
                        if (ctrl.onInputBlur) {
                            ctrl.onInputBlur();
                        }
                    };
                    // TODO(sll): Move these to ng-messages when we move to Angular 1.3.
                    ctrl.getMinValue = function () {
                        for (var i = 0; i < ctrl.validators().length; i++) {
                            if (ctrl.validators()[i].id === 'is_at_least') {
                                return ctrl.validators()[i].min_value;
                            }
                        }
                    };
                    ctrl.getMaxValue = function () {
                        for (var i = 0; i < ctrl.validators().length; i++) {
                            if (ctrl.validators()[i].id === 'is_at_most') {
                                return ctrl.validators()[i].max_value;
                            }
                        }
                    };
                    ctrl.onKeypress = function (evt) {
                        if (evt.keyCode === 13) {
                            if (Object.keys(ctrl.floatForm.floatValue.$error).length !== 0) {
                                ctrl.isUserCurrentlyTyping = false;
                                FocusManagerService.setFocus(ctrl.labelForErrorFocusTarget);
                            }
                            else {
                                $scope.$emit('submittedSchemaBasedFloatForm');
                            }
                        }
                        else {
                            ctrl.isUserCurrentlyTyping = true;
                        }
                    };
                    if (ctrl.localValue === undefined) {
                        ctrl.localValue = 0.0;
                    }
                    // This prevents the red 'invalid input' warning message from flashing
                    // at the outset.
                    $timeout(function () {
                        ctrl.hasLoaded = true;
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-html-editor.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-html-editor.directive.ts ***!
  \*************************************************************************************************************/
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
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-4-rte.directive.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-rte.directive.ts");
__webpack_require__(/*! components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts */ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('schemaBasedHtmlEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                isDisabled: '&',
                labelForFocusTarget: '&',
                uiConfig: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-html-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-int-editor.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-int-editor.directive.ts ***!
  \************************************************************************************************************/
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
__webpack_require__(/*! components/forms/custom-forms-directives/apply-validation.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/apply-validation.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('schemaBasedIntEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                isDisabled: '&',
                validators: '&',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-int-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', function ($scope) {
                    var ctrl = this;
                    if (ctrl.localValue === undefined) {
                        ctrl.localValue = 0;
                    }
                    ctrl.onKeypress = function (evt) {
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

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-list-editor.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-list-editor.directive.ts ***!
  \*************************************************************************************************************/
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
__webpack_require__(/*! components/forms/schema-based-editors/schema-based-editor.directive.ts */ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/IdGenerationService.ts */ "./core/templates/dev/head/services/IdGenerationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
__webpack_require__(/*! services/SchemaDefaultValueService.ts */ "./core/templates/dev/head/services/SchemaDefaultValueService.ts");
__webpack_require__(/*! services/SchemaUndefinedLastElementService.ts */ "./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
angular.module('oppia').directive('schemaBasedListEditor', [
    'FocusManagerService', 'IdGenerationService',
    'NestedDirectivesRecursionTimeoutPreventionService',
    'SchemaDefaultValueService', 'SchemaUndefinedLastElementService',
    'UrlInterpolationService',
    function (FocusManagerService, IdGenerationService, NestedDirectivesRecursionTimeoutPreventionService, SchemaDefaultValueService, SchemaUndefinedLastElementService, UrlInterpolationService) {
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
                validators: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-list-editor.directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: ['$scope', function ($scope) {
                    var baseFocusLabel = ($scope.labelForFocusTarget() ||
                        IdGenerationService.generateNewId() + '-');
                    $scope.getFocusLabel = function (index) {
                        // Treat the first item in the list as a special case -- if this list
                        // is contained in another list, and the outer list is opened with a
                        // desire to autofocus on the first input field, we can then focus on
                        // the given $scope.labelForFocusTarget().
                        // NOTE: This will cause problems for lists nested within lists, since
                        // sub-element 0 > 1 will have the same label as sub-element 1 > 0.
                        // But we will assume (for now) that nested lists won't be used -- if
                        // they are, this will need to be changed.
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
                    var validate = function () {
                        if ($scope.showDuplicatesWarning) {
                            $scope.listEditorForm.$setValidity('isUniquified', !$scope.hasDuplicates());
                        }
                    };
                    $scope.$watch('localValue', validate, true);
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
                                 * If form submission happens on last element of the set (i.e the
                                 * add item button is absent) then automatically add the element
                                 * to the list.
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
                            throw 'List editor length does not match length of input value: ' +
                                $scope.len + ' ' + $scope.localValue;
                        }
                    }
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema-based-editors/schema-based-unicode-editor.directive.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema-based-editors/schema-based-unicode-editor.directive.ts ***!
  \****************************************************************************************************************/
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
__webpack_require__(/*! interactions/codemirrorRequires.ts */ "./extensions/interactions/codemirrorRequires.ts");
__webpack_require__(/*! components/forms/custom-forms-directives/apply-validation.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/apply-validation.directive.ts");
__webpack_require__(/*! filters/convert-unicode-with-params-to-html.filter.ts */ "./core/templates/dev/head/filters/convert-unicode-with-params-to-html.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
angular.module('oppia').directive('schemaBasedUnicodeEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                localValue: '=',
                isDisabled: '&',
                validators: '&',
                uiConfig: '&',
                labelForFocusTarget: '&',
                onInputBlur: '=',
                onInputFocus: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema-based-editors/' +
                'schema-based-unicode-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$filter', '$sce', '$translate', 'DeviceInfoService',
                function ($scope, $filter, $sce, $translate, DeviceInfoService) {
                    var ctrl = this;
                    if (ctrl.uiConfig() && ctrl.uiConfig().coding_mode) {
                        // Flag that is flipped each time the codemirror view is
                        // shown. (The codemirror instance needs to be refreshed
                        // every time it is unhidden.)
                        ctrl.codemirrorStatus = false;
                        var CODING_MODE_NONE = 'none';
                        ctrl.codemirrorOptions = {
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
                        if (ctrl.isDisabled()) {
                            ctrl.codemirrorOptions.readOnly = 'nocursor';
                        }
                        // Note that only 'coffeescript', 'javascript', 'lua', 'python',
                        // 'ruby' and 'scheme' have CodeMirror-supported syntax
                        // highlighting. For other languages, syntax highlighting will not
                        // happen.
                        if (ctrl.uiConfig().coding_mode !== CODING_MODE_NONE) {
                            ctrl.codemirrorOptions.mode = ctrl.uiConfig().coding_mode;
                        }
                        setTimeout(function () {
                            ctrl.codemirrorStatus = !ctrl.codemirrorStatus;
                        }, 200);
                        // When the form view is opened, flip the status flag. The
                        // timeout seems to be needed for the line numbers etc. to display
                        // properly.
                        $scope.$on('schemaBasedFormsShown', function () {
                            setTimeout(function () {
                                ctrl.codemirrorStatus = !ctrl.codemirrorStatus;
                            }, 200);
                        });
                    }
                    ctrl.onKeypress = function (evt) {
                        if (evt.keyCode === 13) {
                            $scope.$emit('submittedSchemaBasedUnicodeForm');
                        }
                    };
                    ctrl.getPlaceholder = function () {
                        if (!ctrl.uiConfig()) {
                            return '';
                        }
                        else {
                            if (!ctrl.uiConfig().placeholder &&
                                DeviceInfoService.hasTouchEvents()) {
                                return $translate.instant('I18N_PLAYER_DEFAULT_MOBILE_PLACEHOLDER');
                            }
                            return ctrl.uiConfig().placeholder;
                        }
                    };
                    ctrl.getRows = function () {
                        if (!ctrl.uiConfig()) {
                            return null;
                        }
                        else {
                            return ctrl.uiConfig().rows;
                        }
                    };
                    ctrl.getCodingMode = function () {
                        if (!ctrl.uiConfig()) {
                            return null;
                        }
                        else {
                            return ctrl.uiConfig().coding_mode;
                        }
                    };
                    ctrl.getDisplayedValue = function () {
                        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')(ctrl.localValue));
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/validators/is-float.filter.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/validators/is-float.filter.ts ***!
  \********************************************************************************/
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
angular.module('oppia').filter('isFloat', [function () {
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

/***/ "./core/templates/dev/head/filters/convert-unicode-to-html.filter.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/filters/convert-unicode-to-html.filter.ts ***!
  \***************************************************************************/
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
angular.module('oppia').filter('convertUnicodeToHtml', [
    '$sanitize', 'HtmlEscaperService',
    function ($sanitize, HtmlEscaperService) {
        return function (text) {
            return $sanitize(HtmlEscaperService.unescapedStrToEscapedStr(text));
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/filters/convert-unicode-with-params-to-html.filter.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/convert-unicode-with-params-to-html.filter.ts ***!
  \***************************************************************************************/
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
__webpack_require__(/*! filters/convert-unicode-to-html.filter.ts */ "./core/templates/dev/head/filters/convert-unicode-to-html.filter.ts");
angular.module('oppia').filter('convertUnicodeWithParamsToHtml', [
    '$filter', function ($filter) {
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
            // because then the { characters that remain will be ambiguous (they may
            // either be the openings of parameters or literal '{' characters entered
            // by the user. So we build a standard left-to-right parser which examines
            // each character of the string in turn, and processes it accordingly.
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
angular.module('oppia').filter('underscoresToCamelCase', [function () {
        return function (input) {
            return input.replace(/_+(.)/g, function (match, group1) {
                return group1.toUpperCase();
            });
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
angular.module('oppia').factory('NestedDirectivesRecursionTimeoutPreventionService', [
    '$compile', function ($compile) {
        return {
            /**
             * Manually compiles the element, fixing the recursion loop.
             * @param {DOM element} element
             * @param {function|object} link - A post-link function, or an object
             *   with function(s) registered via pre and post properties.
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
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service provides correct default value for
 * SchemaBasedList item.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var SchemaDefaultValueService = /** @class */ (function () {
    function SchemaDefaultValueService() {
    }
    // TODO(sll): Rewrite this to take validators into account, so that
    // we always start with a valid value.
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'schema' is a complex dict requiring very careful
    // backtracking.
    SchemaDefaultValueService.prototype.getDefaultValue = function (schema) {
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
    };
    SchemaDefaultValueService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], SchemaDefaultValueService);
    return SchemaDefaultValueService;
}());
exports.SchemaDefaultValueService = SchemaDefaultValueService;
angular.module('oppia').factory('SchemaDefaultValueService', static_1.downgradeInjectable(SchemaDefaultValueService));


/***/ }),

/***/ "./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts":
/*!*******************************************************************************!*\
  !*** ./core/templates/dev/head/services/SchemaUndefinedLastElementService.ts ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to check if the last element of SchemaBasedList
 * is undefined.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var SchemaUndefinedLastElementService = /** @class */ (function () {
    function SchemaUndefinedLastElementService() {
    }
    // Returns true if the input value, taken as the last element in a list,
    // should be considered as 'undefined' and therefore deleted.
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'schema' is a complex dict requiring very careful
    // backtracking.
    SchemaUndefinedLastElementService.prototype.getUndefinedValue = function (schema) {
        if (schema.type === 'unicode' || schema.type === 'html') {
            return '';
        }
        else {
            return undefined;
        }
    };
    SchemaUndefinedLastElementService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], SchemaUndefinedLastElementService);
    return SchemaUndefinedLastElementService;
}());
exports.SchemaUndefinedLastElementService = SchemaUndefinedLastElementService;
angular.module('oppia').factory('SchemaUndefinedLastElementService', static_1.downgradeInjectable(SchemaUndefinedLastElementService));


/***/ }),

/***/ "./extensions/interactions/codemirrorRequires.ts":
/*!*******************************************************!*\
  !*** ./extensions/interactions/codemirrorRequires.ts ***!
  \*******************************************************/
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
 * @fileoverview Loads scripts needed for ui-codemirror.
 */
var CodeMirror = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/lib/codemirror.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
Object.defineProperty(window, 'CodeMirror', {
    value: CodeMirror,
    writable: false
});
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/mode/javascript/javascript.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/mode/python/python.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/code-mirror-5.17.0/mode/yaml/yaml.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/ui-codemirror-5d04fa/src/ui-codemirror.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
__webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'static/diff-match-patch-1.0.0/diff_match_patch.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL2FwcGx5LXZhbGlkYXRpb24uZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvcmVxdWlyZS1pcy1mbG9hdC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvdmFsaWRhdG9ycy9pcy1mbG9hdC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9jb252ZXJ0LXVuaWNvZGUtdG8taHRtbC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9jb252ZXJ0LXVuaWNvZGUtd2l0aC1wYXJhbXMtdG8taHRtbC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3VuZGVyc2NvcmVzLXRvLWNhbWVsLWNhc2UuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9TY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vZXh0ZW5zaW9ucy9pbnRlcmFjdGlvbnMvY29kZW1pcnJvclJlcXVpcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3S0FBb0U7QUFDNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxzQ0FBc0MsRUFBRTtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsZ0lBQWdEO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixtQkFBTyxDQUFDLHFLQUE2QztBQUN0RTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsbUJBQU8sQ0FBQyxpTEFBeUQ7QUFDakUsbUJBQU8sQ0FBQyx5S0FBaUQ7QUFDekQsbUJBQU8sQ0FBQyxxS0FBNkM7QUFDckQsbUJBQU8sQ0FBQywwS0FBa0Q7QUFDMUQsbUJBQU8sQ0FBQywyS0FBbUQiLCJmaWxlIjoiYWRtaW5+bW9kZXJhdG9yfnN0b3J5X2VkaXRvci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYXBwbHlpbmcgdmFsaWRhdGlvbi5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3VuZGVyc2NvcmVzLXRvLWNhbWVsLWNhc2UuZmlsdGVyLnRzJyk7XG4vKiBlc2xpbnQtZGlzYWJsZSBhbmd1bGFyL2RpcmVjdGl2ZS1yZXN0cmljdCAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdhcHBseVZhbGlkYXRpb24nLCBbXG4gICAgJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzOiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxtLCBhdHRycywgY3RybCkge1xuICAgICAgICAgICAgICAgIC8vIEFkZCB2YWxpZGF0b3JzIGluIHJldmVyc2Ugb3JkZXIuXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlLiRjdHJsLnZhbGlkYXRvcnMoKSkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS4kY3RybC52YWxpZGF0b3JzKCkuZm9yRWFjaChmdW5jdGlvbiAodmFsaWRhdG9yU3BlYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZyb250ZW5kTmFtZSA9ICRmaWx0ZXIoJ3VuZGVyc2NvcmVzVG9DYW1lbENhc2UnKSh2YWxpZGF0b3JTcGVjLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGVyZSBtYXkgbm90IGJlIGEgY29ycmVzcG9uZGluZyBmcm9udGVuZCBmaWx0ZXIgZm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlYWNoIGJhY2tlbmQgdmFsaWRhdG9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZmlsdGVyKGZyb250ZW5kTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlckFyZ3MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWxpZGF0b3JTcGVjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gJ2lkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJBcmdzWyRmaWx0ZXIoJ3VuZGVyc2NvcmVzVG9DYW1lbENhc2UnKShrZXkpXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmNvcHkodmFsaWRhdG9yU3BlY1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VzdG9tVmFsaWRhdG9yID0gZnVuY3Rpb24gKHZpZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuJHNldFZhbGlkaXR5KGZyb250ZW5kTmFtZSwgJGZpbHRlcihmcm9udGVuZE5hbWUpKHZpZXdWYWx1ZSwgZmlsdGVyQXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2aWV3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC4kcGFyc2Vycy51bnNoaWZ0KGN1c3RvbVZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLiRmb3JtYXR0ZXJzLnVuc2hpZnQoY3VzdG9tVmFsaWRhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuLyogZXNsaW50LWVuYWJsZSBhbmd1bGFyL2RpcmVjdGl2ZS1yZXN0cmljdCAqL1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHJlcXVpcmluZyBcImlzRmxvYXRcIiBmaWx0ZXIuXG4gKi9cbi8vIFRoaXMgc2hvdWxkIGNvbWUgYmVmb3JlICdhcHBseS12YWxpZGF0aW9uJywgaWYgdGhhdCBpcyBkZWZpbmVkIGFzXG4vLyBhbiBhdHRyaWJ1dGUgb24gdGhlIEhUTUwgdGFnLlxucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy92YWxpZGF0b3JzL2lzLWZsb2F0LmZpbHRlci50cycpO1xuLyogZXNsaW50LWRpc2FibGUgYW5ndWxhci9kaXJlY3RpdmUtcmVzdHJpY3QgKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgncmVxdWlyZUlzRmxvYXQnLCBbXG4gICAgJyRmaWx0ZXInLCBmdW5jdGlvbiAoJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxtLCBhdHRycywgY3RybCkge1xuICAgICAgICAgICAgICAgIHZhciBmbG9hdFZhbGlkYXRvciA9IGZ1bmN0aW9uICh2aWV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbHRlcmVkVmFsdWUgPSAkZmlsdGVyKCdpc0Zsb2F0Jykodmlld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC4kc2V0VmFsaWRpdHkoJ2lzRmxvYXQnLCBmaWx0ZXJlZFZhbHVlICE9PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyZWRWYWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGN0cmwuJHBhcnNlcnMudW5zaGlmdChmbG9hdFZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICAgY3RybC4kZm9ybWF0dGVycy51bnNoaWZ0KGZsb2F0VmFsaWRhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbi8qIGVzbGludC1lbmFibGUgYW5ndWxhci9kaXJlY3RpdmUtcmVzdHJpY3QgKi9cbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGJvb2xlYW5zLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkQm9vbEVkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIG11bHRpcGxlIGNob2ljZS5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZENob2ljZXNFZGl0b3InLCBbXG4gICAgJ05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICAvLyBUaGUgY2hvaWNlcyBmb3IgdGhlIG9iamVjdCdzIHZhbHVlLlxuICAgICAgICAgICAgICAgIGNob2ljZXM6ICcmJyxcbiAgICAgICAgICAgICAgICAvLyBUaGUgc2NoZW1hIGZvciB0aGlzIG9iamVjdC5cbiAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IFZhbGlkYXRlIGVhY2ggY2hvaWNlIGFnYWluc3QgdGhlIHNjaGVtYS5cbiAgICAgICAgICAgICAgICBzY2hlbWE6ICcmJyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbXBpbGU6IE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UuY29tcGlsZSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0UmVhZG9ubHlTY2hlbWEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVhZG9ubHlTY2hlbWEgPSBhbmd1bGFyLmNvcHkoY3RybC5zY2hlbWEoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcmVhZG9ubHlTY2hlbWEuY2hvaWNlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWFkb25seVNjaGVtYTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgY3VzdG9tIHZhbHVlcy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9vYmplY3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEN1c3RvbUVkaXRvcicsIFtcbiAgICAnTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBjbGFzcyBvZiB0aGUgb2JqZWN0IGJlaW5nIGVkaXRlZC5cbiAgICAgICAgICAgICAgICBvYmpUeXBlOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtY3VzdG9tLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29tcGlsZTogTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS5jb21waWxlLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGRpY3RzLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9OZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkRGljdEVkaXRvcicsIFtcbiAgICAnTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICAvLyBSZWFkLW9ubHkgcHJvcGVydHkuIEFuIG9iamVjdCB3aG9zZSBrZXlzIGFuZCB2YWx1ZXMgYXJlIHRoZSBkaWN0XG4gICAgICAgICAgICAgICAgLy8gcHJvcGVydGllcyBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgc2NoZW1hcy5cbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVNjaGVtYXM6ICcmJyxcbiAgICAgICAgICAgICAgICBsYWJlbEZvckZvY3VzVGFyZ2V0OiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtZGljdC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb21waWxlOiBOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLmNvbXBpbGUsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICdJZEdlbmVyYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBJZEdlbmVyYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRIdW1hblJlYWRhYmxlUHJvcGVydHlEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5LmRlc2NyaXB0aW9uIHx8ICdbJyArIHByb3BlcnR5Lm5hbWUgKyAnXSc7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5maWVsZElkcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS5wcm9wZXJ0eVNjaGVtYXMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIElEcyBmb3IgZWFjaCBmaWVsZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5maWVsZElkc1skc2NvcGUucHJvcGVydHlTY2hlbWFzKClbaV0ubmFtZV0gPSAoSWRHZW5lcmF0aW9uU2VydmljZS5nZW5lcmF0ZU5ld0lkKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGdlbmVyYWwgc2NoZW1hLWJhc2VkIGVkaXRvcnMuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWZsb2F0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1odG1sLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWludC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICdzY2hlbWEtYmFzZWQtbGlzdC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICdzY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkRWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBzY2hlbWE6ICcmJyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICBvbklucHV0Qmx1cjogJz0nLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRGb2N1czogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGZsb2F0cy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9hcHBseS12YWxpZGF0aW9uLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9yZXF1aXJlLWlzLWZsb2F0LmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy92YWxpZGF0b3JzL2lzLWZsb2F0LmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvc3RhdGVmdWwvRm9jdXNNYW5hZ2VyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEZsb2F0RWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnM6ICcmJyxcbiAgICAgICAgICAgICAgICBsYWJlbEZvckZvY3VzVGFyZ2V0OiAnJicsXG4gICAgICAgICAgICAgICAgb25JbnB1dEJsdXI6ICc9JyxcbiAgICAgICAgICAgICAgICBvbklucHV0Rm9jdXM6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRmaWx0ZXInLCAnJHRpbWVvdXQnLCAnRm9jdXNNYW5hZ2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJGZpbHRlciwgJHRpbWVvdXQsIEZvY3VzTWFuYWdlclNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmhhc0xvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmhhc0ZvY3VzZWRBdExlYXN0T25jZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmxhYmVsRm9yRXJyb3JGb2N1c1RhcmdldCA9XG4gICAgICAgICAgICAgICAgICAgICAgICBGb2N1c01hbmFnZXJTZXJ2aWNlLmdlbmVyYXRlRm9jdXNMYWJlbCgpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnZhbGlkYXRlID0gZnVuY3Rpb24gKGxvY2FsVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdpc0Zsb2F0JykobG9jYWxWYWx1ZSkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkZvY3VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5oYXNGb2N1c2VkQXRMZWFzdE9uY2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwub25JbnB1dEZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5vbklucHV0Rm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkJsdXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwub25JbnB1dEJsdXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9uSW5wdXRCbHVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogTW92ZSB0aGVzZSB0byBuZy1tZXNzYWdlcyB3aGVuIHdlIG1vdmUgdG8gQW5ndWxhciAxLjMuXG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0TWluVmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN0cmwudmFsaWRhdG9ycygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudmFsaWRhdG9ycygpW2ldLmlkID09PSAnaXNfYXRfbGVhc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLnZhbGlkYXRvcnMoKVtpXS5taW5fdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldE1heFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdHJsLnZhbGlkYXRvcnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnZhbGlkYXRvcnMoKVtpXS5pZCA9PT0gJ2lzX2F0X21vc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLnZhbGlkYXRvcnMoKVtpXS5tYXhfdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uS2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGN0cmwuZmxvYXRGb3JtLmZsb2F0VmFsdWUuJGVycm9yKS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc1VzZXJDdXJyZW50bHlUeXBpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9jdXNNYW5hZ2VyU2VydmljZS5zZXRGb2N1cyhjdHJsLmxhYmVsRm9yRXJyb3JGb2N1c1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pdHRlZFNjaGVtYUJhc2VkRmxvYXRGb3JtJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc1VzZXJDdXJyZW50bHlUeXBpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5sb2NhbFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubG9jYWxWYWx1ZSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIHRoZSByZWQgJ2ludmFsaWQgaW5wdXQnIHdhcm5pbmcgbWVzc2FnZSBmcm9tIGZsYXNoaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGF0IHRoZSBvdXRzZXQuXG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaGFzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgSFRNTC5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItNC1ydGUuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci00LXdpZGdldHMuaW5pdGlhbGl6ZXIudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRIdG1sRWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICB1aUNvbmZpZzogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgaW50ZWdlcnMuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvYXBwbHktdmFsaWRhdGlvbi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRJbnRFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICBvbklucHV0Qmx1cjogJz0nLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRGb2N1czogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWludC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgZnVuY3Rpb24gKCRzY29wZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLmxvY2FsVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sb2NhbFZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uS2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdzdWJtaXR0ZWRTY2hlbWFCYXNlZEludEZvcm0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBsaXN0cy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSWRHZW5lcmF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkTGlzdEVkaXRvcicsIFtcbiAgICAnRm9jdXNNYW5hZ2VyU2VydmljZScsICdJZEdlbmVyYXRpb25TZXJ2aWNlJyxcbiAgICAnTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZScsXG4gICAgJ1NjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UnLCAnU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChGb2N1c01hbmFnZXJTZXJ2aWNlLCBJZEdlbmVyYXRpb25TZXJ2aWNlLCBOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlLCBTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgLy8gUmVhZC1vbmx5IHByb3BlcnR5LiBUaGUgc2NoZW1hIGRlZmluaXRpb24gZm9yIGVhY2ggaXRlbSBpbiB0aGUgbGlzdC5cbiAgICAgICAgICAgICAgICBpdGVtU2NoZW1hOiAnJicsXG4gICAgICAgICAgICAgICAgLy8gVGhlIGxlbmd0aCBvZiB0aGUgbGlzdC4gSWYgbm90IHNwZWNpZmllZCwgdGhlIGxpc3QgaXMgb2YgYXJiaXRyYXJ5XG4gICAgICAgICAgICAgICAgLy8gbGVuZ3RoLlxuICAgICAgICAgICAgICAgIGxlbjogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFVJIGNvbmZpZ3VyYXRpb24uIE1heSBiZSB1bmRlZmluZWQuXG4gICAgICAgICAgICAgICAgdWlDb25maWc6ICcmJyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzOiAnJicsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWxpc3QtZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgY29tcGlsZTogTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS5jb21waWxlLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXNlRm9jdXNMYWJlbCA9ICgkc2NvcGUubGFiZWxGb3JGb2N1c1RhcmdldCgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBJZEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlTmV3SWQoKSArICctJyk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5nZXRGb2N1c0xhYmVsID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUcmVhdCB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgbGlzdCBhcyBhIHNwZWNpYWwgY2FzZSAtLSBpZiB0aGlzIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIGNvbnRhaW5lZCBpbiBhbm90aGVyIGxpc3QsIGFuZCB0aGUgb3V0ZXIgbGlzdCBpcyBvcGVuZWQgd2l0aCBhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkZXNpcmUgdG8gYXV0b2ZvY3VzIG9uIHRoZSBmaXJzdCBpbnB1dCBmaWVsZCwgd2UgY2FuIHRoZW4gZm9jdXMgb25cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBnaXZlbiAkc2NvcGUubGFiZWxGb3JGb2N1c1RhcmdldCgpLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogVGhpcyB3aWxsIGNhdXNlIHByb2JsZW1zIGZvciBsaXN0cyBuZXN0ZWQgd2l0aGluIGxpc3RzLCBzaW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3ViLWVsZW1lbnQgMCA+IDEgd2lsbCBoYXZlIHRoZSBzYW1lIGxhYmVsIGFzIHN1Yi1lbGVtZW50IDEgPiAwLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnV0IHdlIHdpbGwgYXNzdW1lIChmb3Igbm93KSB0aGF0IG5lc3RlZCBsaXN0cyB3b24ndCBiZSB1c2VkIC0tIGlmXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGV5IGFyZSwgdGhpcyB3aWxsIG5lZWQgdG8gYmUgY2hhbmdlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPT09IDAgPyBiYXNlRm9jdXNMYWJlbCA6IGJhc2VGb2N1c0xhYmVsICsgaW5kZXgudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0FkZEl0ZW1CdXR0b25QcmVzZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFkZEVsZW1lbnRUZXh0ID0gJ0FkZCBlbGVtZW50JztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS51aUNvbmZpZygpICYmICRzY29wZS51aUNvbmZpZygpLmFkZF9lbGVtZW50X3RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRFbGVtZW50VGV4dCA9ICRzY29wZS51aUNvbmZpZygpLmFkZF9lbGVtZW50X3RleHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSBoaWRlIHRoZSAnYWRkIGl0ZW0nIGJ1dHRvbiBpbiB0aGUgY2FzZSBvZiBzaW5nbGUtbGluZSB1bmljb2RlXG4gICAgICAgICAgICAgICAgICAgIC8vIGlucHV0LlxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPbmVMaW5lSW5wdXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLml0ZW1TY2hlbWEoKS50eXBlICE9PSAndW5pY29kZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pdGVtU2NoZW1hKCkuaGFzT3duUHJvcGVydHkoJ2Nob2ljZXMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT25lTGluZUlucHV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLml0ZW1TY2hlbWEoKS51aV9jb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbVNjaGVtYSgpLnVpX2NvbmZpZy5jb2RpbmdfbW9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09uZUxpbmVJbnB1dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLml0ZW1TY2hlbWEoKS51aV9jb25maWcuaGFzT3duUHJvcGVydHkoJ3Jvd3MnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pdGVtU2NoZW1hKCkudWlfY29uZmlnLnJvd3MgPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT25lTGluZUlucHV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1pbkxpc3RMZW5ndGggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWF4TGlzdExlbmd0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93RHVwbGljYXRlc1dhcm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS52YWxpZGF0b3JzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLnZhbGlkYXRvcnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUudmFsaWRhdG9ycygpW2ldLmlkID09PSAnaGFzX2xlbmd0aF9hdF9tb3N0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWF4TGlzdExlbmd0aCA9ICRzY29wZS52YWxpZGF0b3JzKClbaV0ubWF4X3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUudmFsaWRhdG9ycygpW2ldLmlkID09PSAnaGFzX2xlbmd0aF9hdF9sZWFzdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1pbkxpc3RMZW5ndGggPSAkc2NvcGUudmFsaWRhdG9ycygpW2ldLm1pbl92YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5pZCA9PT0gJ2lzX3VuaXF1aWZpZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93RHVwbGljYXRlc1dhcm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoIDwgJHNjb3BlLm1pbkxpc3RMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2NhbFZhbHVlLnB1c2goU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZS5nZXREZWZhdWx0VmFsdWUoJHNjb3BlLml0ZW1TY2hlbWEoKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5oYXNEdXBsaWNhdGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlc1NvRmFyID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJHNjb3BlLmxvY2FsVmFsdWVbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZXNTb0Zhci5oYXNPd25Qcm9wZXJ0eSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzU29GYXJbdmFsdWVdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5zaG93RHVwbGljYXRlc1dhcm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGlzdEVkaXRvckZvcm0uJHNldFZhbGlkaXR5KCdpc1VuaXF1aWZpZWQnLCAhJHNjb3BlLmhhc0R1cGxpY2F0ZXMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2xvY2FsVmFsdWUnLCB2YWxpZGF0ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hZGRFbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXNPbmVMaW5lSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhpZGVBZGRJdGVtQnV0dG9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2NhbFZhbHVlLnB1c2goU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZS5nZXREZWZhdWx0VmFsdWUoJHNjb3BlLml0ZW1TY2hlbWEoKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvY3VzTWFuYWdlclNlcnZpY2Uuc2V0Rm9jdXMoJHNjb3BlLmdldEZvY3VzTGFiZWwoJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoIC0gMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfZGVsZXRlTGFzdEVsZW1lbnRJZlVuZGVmaW5lZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFZhbHVlSW5kZXggPSAkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZVRvQ29uc2lkZXJVbmRlZmluZWQgPSAoU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlLmdldFVuZGVmaW5lZFZhbHVlKCRzY29wZS5pdGVtU2NoZW1hKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWVbbGFzdFZhbHVlSW5kZXhdID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVRvQ29uc2lkZXJVbmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZUVsZW1lbnQobGFzdFZhbHVlSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVsZXRlRW1wdHlFbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWVbaV0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGVsZXRlRWxlbWVudChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sb2NhbFZhbHVlWzBdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sYXN0RWxlbWVudE9uQmx1ciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZGVsZXRlTGFzdEVsZW1lbnRJZlVuZGVmaW5lZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWRkSXRlbUJ1dHRvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zaG93QWRkSXRlbUJ1dHRvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVFbXB0eUVsZW1lbnRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzQWRkSXRlbUJ1dHRvblByZXNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5oaWRlQWRkSXRlbUJ1dHRvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5fb25DaGlsZEZvcm1TdWJtaXQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogSWYgZm9ybSBzdWJtaXNzaW9uIGhhcHBlbnMgb24gbGFzdCBlbGVtZW50IG9mIHRoZSBzZXQgKGkuZSB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogYWRkIGl0ZW0gYnV0dG9uIGlzIGFic2VudCkgdGhlbiBhdXRvbWF0aWNhbGx5IGFkZCB0aGUgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0byB0aGUgbGlzdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoJHNjb3BlLm1heExpc3RMZW5ndGggPT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCA8ICRzY29wZS5tYXhMaXN0TGVuZ3RoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgISEkc2NvcGUubG9jYWxWYWx1ZVskc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFkZEVsZW1lbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIElmIGZvcm0gc3VibWlzc2lvbiBoYXBwZW5zIG9uIGV4aXN0aW5nIGVsZW1lbnQgcmVtb3ZlIGZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIGZyb20gaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc3VibWl0dGVkU2NoZW1hQmFzZWRJbnRGb3JtJywgJHNjb3BlLl9vbkNoaWxkRm9ybVN1Ym1pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzdWJtaXR0ZWRTY2hlbWFCYXNlZEZsb2F0Rm9ybScsICRzY29wZS5fb25DaGlsZEZvcm1TdWJtaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc3VibWl0dGVkU2NoZW1hQmFzZWRVbmljb2RlRm9ybScsICRzY29wZS5fb25DaGlsZEZvcm1TdWJtaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZUVsZW1lbnQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGxldCB0aGUgUlRFIGtub3cgdGhhdCBIdG1sQ29udGVudCBoYXMgYmVlbiBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbEh0bWxDb250ZW50Q2hhbmdlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlbiA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgbGVuZ3RoIGZvciBsaXN0IGVkaXRvcjogJyArICRzY29wZS5sZW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxlbiAhPT0gJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0xpc3QgZWRpdG9yIGxlbmd0aCBkb2VzIG5vdCBtYXRjaCBsZW5ndGggb2YgaW5wdXQgdmFsdWU6ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubGVuICsgJyAnICsgJHNjb3BlLmxvY2FsVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgdW5pY29kZSBzdHJpbmdzLlxuICovXG5yZXF1aXJlKCdpbnRlcmFjdGlvbnMvY29kZW1pcnJvclJlcXVpcmVzLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL2FwcGx5LXZhbGlkYXRpb24uZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL2NvbnZlcnQtdW5pY29kZS13aXRoLXBhcmFtcy10by1odG1sLmZpbHRlci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9EZXZpY2VJbmZvU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZFVuaWNvZGVFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yczogJyYnLFxuICAgICAgICAgICAgICAgIHVpQ29uZmlnOiAnJicsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRCbHVyOiAnPScsXG4gICAgICAgICAgICAgICAgb25JbnB1dEZvY3VzOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRmaWx0ZXInLCAnJHNjZScsICckdHJhbnNsYXRlJywgJ0RldmljZUluZm9TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkZmlsdGVyLCAkc2NlLCAkdHJhbnNsYXRlLCBEZXZpY2VJbmZvU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnVpQ29uZmlnKCkgJiYgY3RybC51aUNvbmZpZygpLmNvZGluZ19tb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGbGFnIHRoYXQgaXMgZmxpcHBlZCBlYWNoIHRpbWUgdGhlIGNvZGVtaXJyb3IgdmlldyBpc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2hvd24uIChUaGUgY29kZW1pcnJvciBpbnN0YW5jZSBuZWVkcyB0byBiZSByZWZyZXNoZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZXJ5IHRpbWUgaXQgaXMgdW5oaWRkZW4uKVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2RlbWlycm9yU3RhdHVzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgQ09ESU5HX01PREVfTk9ORSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29kZW1pcnJvck9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29udmVydCB0YWJzIHRvIHNwYWNlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUtleXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFiOiBmdW5jdGlvbiAoY20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcGFjZXMgPSBBcnJheShjbS5nZXRPcHRpb24oJ2luZGVudFVuaXQnKSArIDEpLmpvaW4oJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtLnJlcGxhY2VTZWxlY3Rpb24oc3BhY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vdmUgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZW5kU2VsZWN0aW9uUG9zID0gY20uZ2V0RG9jKCkuZ2V0Q3Vyc29yKCdoZWFkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbS5nZXREb2MoKS5zZXRDdXJzb3IoZW5kU2VsZWN0aW9uUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50V2l0aFRhYnM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXJzOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuaXNEaXNhYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2RlbWlycm9yT3B0aW9ucy5yZWFkT25seSA9ICdub2N1cnNvcic7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3RlIHRoYXQgb25seSAnY29mZmVlc2NyaXB0JywgJ2phdmFzY3JpcHQnLCAnbHVhJywgJ3B5dGhvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAncnVieScgYW5kICdzY2hlbWUnIGhhdmUgQ29kZU1pcnJvci1zdXBwb3J0ZWQgc3ludGF4XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoaWdobGlnaHRpbmcuIEZvciBvdGhlciBsYW5ndWFnZXMsIHN5bnRheCBoaWdobGlnaHRpbmcgd2lsbCBub3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhcHBlbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnVpQ29uZmlnKCkuY29kaW5nX21vZGUgIT09IENPRElOR19NT0RFX05PTkUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvZGVtaXJyb3JPcHRpb25zLm1vZGUgPSBjdHJsLnVpQ29uZmlnKCkuY29kaW5nX21vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvZGVtaXJyb3JTdGF0dXMgPSAhY3RybC5jb2RlbWlycm9yU3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIGZvcm0gdmlldyBpcyBvcGVuZWQsIGZsaXAgdGhlIHN0YXR1cyBmbGFnLiBUaGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpbWVvdXQgc2VlbXMgdG8gYmUgbmVlZGVkIGZvciB0aGUgbGluZSBudW1iZXJzIGV0Yy4gdG8gZGlzcGxheVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvcGVybHkuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzY2hlbWFCYXNlZEZvcm1zU2hvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29kZW1pcnJvclN0YXR1cyA9ICFjdHJsLmNvZGVtaXJyb3JTdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25LZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pdHRlZFNjaGVtYUJhc2VkVW5pY29kZUZvcm0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC51aUNvbmZpZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsLnVpQ29uZmlnKCkucGxhY2Vob2xkZXIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGV2aWNlSW5mb1NlcnZpY2UuaGFzVG91Y2hFdmVudHMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHRyYW5zbGF0ZS5pbnN0YW50KCdJMThOX1BMQVlFUl9ERUZBVUxUX01PQklMRV9QTEFDRUhPTERFUicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3RybC51aUNvbmZpZygpLnBsYWNlaG9sZGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFJvd3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwudWlDb25maWcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0cmwudWlDb25maWcoKS5yb3dzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldENvZGluZ01vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwudWlDb25maWcoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0cmwudWlDb25maWcoKS5jb2RpbmdfbW9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXREaXNwbGF5ZWRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2NlLnRydXN0QXNIdG1sKCRmaWx0ZXIoJ2NvbnZlcnRVbmljb2RlV2l0aFBhcmFtc1RvSHRtbCcpKGN0cmwubG9jYWxWYWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVmFsaWRhdG9yIHRvIGNoZWNrIGlmIGlucHV0IGlzIGZsb2F0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5maWx0ZXIoJ2lzRmxvYXQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgRkxPQVRfUkVHRVhQID0gLyg/PS4qXFxkKV5cXC0/XFxkKihcXC58XFwsKT9cXGQqXFwlPyQvO1xuICAgICAgICAgICAgLy8gVGhpcyByZWdleCBhY2NlcHRzIGZsb2F0cyBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdHM6XG4gICAgICAgICAgICAvLyAwLlxuICAgICAgICAgICAgLy8gMC41NS4uXG4gICAgICAgICAgICAvLyAtMC41NS4uXG4gICAgICAgICAgICAvLyAuNTU1Li5cbiAgICAgICAgICAgIC8vIC0uNTU1Li5cbiAgICAgICAgICAgIC8vIEFsbCBleGFtcGxlcyBhYm92ZSB3aXRoICcuJyByZXBsYWNlZCB3aXRoICcsJyBhcmUgYWxzbyB2YWxpZC5cbiAgICAgICAgICAgIC8vIEV4cHJlc3Npb25zIGNvbnRhaW5pbmcgJSBhcmUgYWxzbyB2YWxpZCAoNS4xJSBldGMpLlxuICAgICAgICAgICAgdmFyIHZpZXdWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2aWV3VmFsdWUgPSBpbnB1dC50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2aWV3VmFsdWUgIT09ICcnICYmIEZMT0FUX1JFR0VYUC50ZXN0KHZpZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodmlld1ZhbHVlLnNsaWNlKC0xKSA9PT0gJyUnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBwZXJjZW50YWdlLCBzbyB0aGUgaW5wdXQgbmVlZHMgdG8gYmUgZGl2aWRlZCBieSAxMDAuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHZpZXdWYWx1ZS5zdWJzdHJpbmcoMCwgdmlld1ZhbHVlLmxlbmd0aCAtIDEpLnJlcGxhY2UoJywnLCAnLicpKSAvIDEwMC4wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmlld1ZhbHVlLnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydHMgdW5pY29kZSB0byBIVE1MLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignY29udmVydFVuaWNvZGVUb0h0bWwnLCBbXG4gICAgJyRzYW5pdGl6ZScsICdIdG1sRXNjYXBlclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkc2FuaXRpemUsIEh0bWxFc2NhcGVyU2VydmljZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiAkc2FuaXRpemUoSHRtbEVzY2FwZXJTZXJ2aWNlLnVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cih0ZXh0KSk7XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnZlcnRzIHt7bmFtZX19IHN1YnN0cmluZ3MgdG9cbiAqIDxvcHBpYS1wYXJhbWV0ZXI+bmFtZTwvb3BwaWEtcGFyYW1ldGVyPiB0YWdzIGFuZCB1bmVzY2FwZXMgdGhlXG4gKiB7LCB9IGFuZCBcXCBjaGFyYWN0ZXJzLiBUaGlzIGlzIGRvbmUgYnkgcmVhZGluZyB0aGUgZ2l2ZW4gc3RyaW5nIGZyb21cbiAqIGxlZnQgdG8gcmlnaHQ6IGlmIHdlIHNlZSBhIGJhY2tzbGFzaCwgd2UgdXNlIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVyO1xuICogaWYgd2Ugc2VlIGEgJ3t7JywgdGhpcyBpcyB0aGUgc3RhcnQgb2YgYSBwYXJhbWV0ZXI7IGlmIHdlIHNlZSBhICd9fSc7XG4gKiB0aGlzIGlzIHRoZSBlbmQgb2YgYSBwYXJhbWV0ZXIuXG4gKi9cbnJlcXVpcmUoJ2ZpbHRlcnMvY29udmVydC11bmljb2RlLXRvLWh0bWwuZmlsdGVyLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5maWx0ZXIoJ2NvbnZlcnRVbmljb2RlV2l0aFBhcmFtc1RvSHRtbCcsIFtcbiAgICAnJGZpbHRlcicsIGZ1bmN0aW9uICgkZmlsdGVyKSB7XG4gICAgICAgIHZhciBhc3NlcnQgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgaWYgKCF0ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgdW5pY29kZS1zdHJpbmctd2l0aC1wYXJhbWV0ZXJzOiAnICsgdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICAvLyBUaGUgcGFyc2luZyBoZXJlIG5lZWRzIHRvIGJlIGRvbmUgd2l0aCBtb3JlIGNhcmUgYmVjYXVzZSB3ZSBhcmVcbiAgICAgICAgICAgIC8vIHJlcGxhY2luZyB0d28tY2hhcmFjdGVyIHN0cmluZ3MuIFdlIGNhbid0IG5haXZlbHkgYnJlYWsgYnkge3sgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaW4gc3RyaW5ncyBsaWtlIFxce3t7IHRoZSBzZWNvbmQgYW5kIHRoaXJkIGNoYXJhY3RlcnMgd2lsbCBiZSB0YWtlbiBhc1xuICAgICAgICAgICAgLy8gdGhlIG9wZW5pbmcgYnJhY2tldHMsIHdoaWNoIGlzIHdyb25nLiBXZSBjYW4ndCB1bmVzY2FwZSBjaGFyYWN0ZXJzXG4gICAgICAgICAgICAvLyBiZWNhdXNlIHRoZW4gdGhlIHsgY2hhcmFjdGVycyB0aGF0IHJlbWFpbiB3aWxsIGJlIGFtYmlndW91cyAodGhleSBtYXlcbiAgICAgICAgICAgIC8vIGVpdGhlciBiZSB0aGUgb3BlbmluZ3Mgb2YgcGFyYW1ldGVycyBvciBsaXRlcmFsICd7JyBjaGFyYWN0ZXJzIGVudGVyZWRcbiAgICAgICAgICAgIC8vIGJ5IHRoZSB1c2VyLiBTbyB3ZSBidWlsZCBhIHN0YW5kYXJkIGxlZnQtdG8tcmlnaHQgcGFyc2VyIHdoaWNoIGV4YW1pbmVzXG4gICAgICAgICAgICAvLyBlYWNoIGNoYXJhY3RlciBvZiB0aGUgc3RyaW5nIGluIHR1cm4sIGFuZCBwcm9jZXNzZXMgaXQgYWNjb3JkaW5nbHkuXG4gICAgICAgICAgICB2YXIgdGV4dEZyYWdtZW50cyA9IFtdO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRGcmFnbWVudCA9ICcnO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRGcmFnbWVudElzUGFyYW0gPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0ZXh0W2ldID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KCFjdXJyZW50RnJhZ21lbnRJc1BhcmFtICYmIHRleHQubGVuZ3RoID4gaSArIDEgJiYge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3snOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ30nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ1xcXFwnOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1bdGV4dFtpICsgMV1dKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ICs9IHRleHRbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRleHRbaV0gPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQodGV4dC5sZW5ndGggPiBpICsgMSAmJiAhY3VycmVudEZyYWdtZW50SXNQYXJhbSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFtpICsgMV0gPT09ICd7Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRleHRGcmFnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBjdXJyZW50RnJhZ21lbnRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGcmFnbWVudCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RnJhZ21lbnRJc1BhcmFtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0ZXh0W2ldID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0KHRleHQubGVuZ3RoID4gaSArIDEgJiYgY3VycmVudEZyYWdtZW50SXNQYXJhbSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFtpICsgMV0gPT09ICd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHRleHRGcmFnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncGFyYW1ldGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGN1cnJlbnRGcmFnbWVudFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGcmFnbWVudElzUGFyYW0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ICs9IHRleHRbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXNzZXJ0KCFjdXJyZW50RnJhZ21lbnRJc1BhcmFtKTtcbiAgICAgICAgICAgIHRleHRGcmFnbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgIGRhdGE6IGN1cnJlbnRGcmFnbWVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgICAgICAgICB0ZXh0RnJhZ21lbnRzLmZvckVhY2goZnVuY3Rpb24gKGZyYWdtZW50KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IChmcmFnbWVudC50eXBlID09PSAndGV4dCcgP1xuICAgICAgICAgICAgICAgICAgICAkZmlsdGVyKCdjb252ZXJ0VW5pY29kZVRvSHRtbCcpKGZyYWdtZW50LmRhdGEpIDpcbiAgICAgICAgICAgICAgICAgICAgJzxvcHBpYS1wYXJhbWV0ZXI+JyArIGZyYWdtZW50LmRhdGEgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvb3BwaWEtcGFyYW1ldGVyPicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVbmRlcnNjb3Jlc1RvQ2FtZWxDYXNlIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcigndW5kZXJzY29yZXNUb0NhbWVsQ2FzZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9fKyguKS9nLCBmdW5jdGlvbiAobWF0Y2gsIGdyb3VwMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cDEudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBwcmV2ZW50cyB0aW1lb3V0cyBkdWUgdG8gcmVjdXJzaW9uXG4gKiBpbiBuZXN0ZWQgZGlyZWN0aXZlcy4gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcS8xNDQzMDY1NVxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJywgW1xuICAgICckY29tcGlsZScsIGZ1bmN0aW9uICgkY29tcGlsZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBNYW51YWxseSBjb21waWxlcyB0aGUgZWxlbWVudCwgZml4aW5nIHRoZSByZWN1cnNpb24gbG9vcC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7RE9NIGVsZW1lbnR9IGVsZW1lbnRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb258b2JqZWN0fSBsaW5rIC0gQSBwb3N0LWxpbmsgZnVuY3Rpb24sIG9yIGFuIG9iamVjdFxuICAgICAgICAgICAgICogICB3aXRoIGZ1bmN0aW9uKHMpIHJlZ2lzdGVyZWQgdmlhIHByZSBhbmQgcG9zdCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgICogQHJldHVybiB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgbGlua2luZyBmdW5jdGlvbnMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbXBpbGU6IGZ1bmN0aW9uIChlbGVtZW50LCBsaW5rKSB7XG4gICAgICAgICAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBsaW5rIHBhcmFtZXRlclxuICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzRnVuY3Rpb24obGluaykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluayA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3Q6IGxpbmtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQnJlYWsgdGhlIHJlY3Vyc2lvbiBsb29wIGJ5IHJlbW92aW5nIHRoZSBjb250ZW50cyxcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudHMgPSBlbGVtZW50LmNvbnRlbnRzKCkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXBpbGVkQ29udGVudHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlOiAobGluayAmJiBsaW5rLnByZSkgPyBsaW5rLnByZSA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHBvc3Q6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcGlsZSB0aGUgY29udGVudHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbXBpbGVkQ29udGVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlZENvbnRlbnRzID0gJGNvbXBpbGUoY29udGVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmUtYWRkIHRoZSBjb21waWxlZCBjb250ZW50cyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkQ29udGVudHMoc2NvcGUsIGZ1bmN0aW9uIChjbG9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKGNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgcG9zdC1saW5raW5nIGZ1bmN0aW9uLCBpZiBhbnkuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGluayAmJiBsaW5rLnBvc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rLnBvc3QuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgcHJvdmlkZXMgY29ycmVjdCBkZWZhdWx0IHZhbHVlIGZvclxuICogU2NoZW1hQmFzZWRMaXN0IGl0ZW0uXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UoKSB7XG4gICAgfVxuICAgIC8vIFRPRE8oc2xsKTogUmV3cml0ZSB0aGlzIHRvIHRha2UgdmFsaWRhdG9ycyBpbnRvIGFjY291bnQsIHNvIHRoYXRcbiAgICAvLyB3ZSBhbHdheXMgc3RhcnQgd2l0aCBhIHZhbGlkIHZhbHVlLlxuICAgIC8vIFRPRE8oIzcxNjUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ3NjaGVtYScgaXMgYSBjb21wbGV4IGRpY3QgcmVxdWlyaW5nIHZlcnkgY2FyZWZ1bFxuICAgIC8vIGJhY2t0cmFja2luZy5cbiAgICBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlLnByb3RvdHlwZS5nZXREZWZhdWx0VmFsdWUgPSBmdW5jdGlvbiAoc2NoZW1hKSB7XG4gICAgICAgIGlmIChzY2hlbWEuY2hvaWNlcykge1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYS5jaG9pY2VzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlID09PSAnYm9vbCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSA9PT0gJ3VuaWNvZGUnIHx8IHNjaGVtYS50eXBlID09PSAnaHRtbCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSA9PT0gJ2xpc3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMuZ2V0RGVmYXVsdFZhbHVlKHNjaGVtYS5pdGVtcyldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlID09PSAnZGljdCcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLnByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbc2NoZW1hLnByb3BlcnRpZXNbaV0ubmFtZV0gPSB0aGlzLmdldERlZmF1bHRWYWx1ZShzY2hlbWEucHJvcGVydGllc1tpXS5zY2hlbWEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzY2hlbWEudHlwZSA9PT0gJ2ludCcgfHwgc2NoZW1hLnR5cGUgPT09ICdmbG9hdCcpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBzY2hlbWEgdHlwZTogJyArIHNjaGVtYS50eXBlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlKTtcbiAgICByZXR1cm4gU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZTtcbn0oKSk7XG5leHBvcnRzLlNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UgPSBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGNoZWNrIGlmIHRoZSBsYXN0IGVsZW1lbnQgb2YgU2NoZW1hQmFzZWRMaXN0XG4gKiBpcyB1bmRlZmluZWQuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlKCkge1xuICAgIH1cbiAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGlucHV0IHZhbHVlLCB0YWtlbiBhcyB0aGUgbGFzdCBlbGVtZW50IGluIGEgbGlzdCxcbiAgICAvLyBzaG91bGQgYmUgY29uc2lkZXJlZCBhcyAndW5kZWZpbmVkJyBhbmQgdGhlcmVmb3JlIGRlbGV0ZWQuXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnc2NoZW1hJyBpcyBhIGNvbXBsZXggZGljdCByZXF1aXJpbmcgdmVyeSBjYXJlZnVsXG4gICAgLy8gYmFja3RyYWNraW5nLlxuICAgIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZS5wcm90b3R5cGUuZ2V0VW5kZWZpbmVkVmFsdWUgPSBmdW5jdGlvbiAoc2NoZW1hKSB7XG4gICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gJ3VuaWNvZGUnIHx8IHNjaGVtYS50eXBlID09PSAnaHRtbCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UpO1xuICAgIHJldHVybiBTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5TY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UgPSBTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBMb2FkcyBzY3JpcHRzIG5lZWRlZCBmb3IgdWktY29kZW1pcnJvci5cbiAqL1xudmFyIENvZGVNaXJyb3IgPSByZXF1aXJlKCdzdGF0aWMvY29kZS1taXJyb3ItNS4xNy4wL2xpYi9jb2RlbWlycm9yLmpzJyk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LCAnQ29kZU1pcnJvcicsIHtcbiAgICB2YWx1ZTogQ29kZU1pcnJvcixcbiAgICB3cml0YWJsZTogZmFsc2Vcbn0pO1xucmVxdWlyZSgnc3RhdGljL2NvZGUtbWlycm9yLTUuMTcuMC9tb2RlL2phdmFzY3JpcHQvamF2YXNjcmlwdC5qcycpO1xucmVxdWlyZSgnc3RhdGljL2NvZGUtbWlycm9yLTUuMTcuMC9tb2RlL3B5dGhvbi9weXRob24uanMnKTtcbnJlcXVpcmUoJ3N0YXRpYy9jb2RlLW1pcnJvci01LjE3LjAvbW9kZS95YW1sL3lhbWwuanMnKTtcbnJlcXVpcmUoJ3N0YXRpYy91aS1jb2RlbWlycm9yLTVkMDRmYS9zcmMvdWktY29kZW1pcnJvci5qcycpO1xucmVxdWlyZSgnc3RhdGljL2RpZmYtbWF0Y2gtcGF0Y2gtMS4wLjAvZGlmZl9tYXRjaF9wYXRjaC5qcycpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==