(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~exploration_player~moderator~practice_session~review_test~skill_editor~story_editor~topic_edit~b6730cc2"],{

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


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL2FwcGx5LXZhbGlkYXRpb24uZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvcmVxdWlyZS1pcy1mbG9hdC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1pbnQtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvdmFsaWRhdG9ycy9pcy1mbG9hdC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9jb252ZXJ0LXVuaWNvZGUtdG8taHRtbC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9jb252ZXJ0LXVuaWNvZGUtd2l0aC1wYXJhbXMtdG8taHRtbC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL3VuZGVyc2NvcmVzLXRvLWNhbWVsLWNhc2UuZmlsdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9TY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdLQUFvRTtBQUM1RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLHNDQUFzQyxFQUFFO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDL0NMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnR0FBZ0M7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsTUFBTTtBQUNsQztBQUNBLElBQUksR0FBRztBQUNQO0FBQ0Esa0JBQWtCLG9DQUFvQyxnQkFBZ0I7QUFDdEU7QUFDQTtBQUNBLG1CQUFPLENBQUMsc0hBQTJDO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRFQUE0RTtBQUM1RSxtQ0FBbUM7QUFDbkM7QUFDQSxpQ0FBaUM7QUFDakMsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIsaUJBQWlCO0FBQzVDO0FBQ0E7QUFDQSwwQkFBMEI7QUFDMUIsMEJBQTBCO0FBQzFCO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QztBQUN2QztBQUNBLDBDQUEwQztBQUMxQztBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQSwwQ0FBMEM7QUFDMUM7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDdEJMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLFlBQVk7QUFDbkMsdUJBQXVCLGdCQUFnQjtBQUN2QztBQUNBLHdCQUF3QixPQUFPO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYSxtQkFBTyxDQUFDLGlFQUFlO0FBQ3BDLGVBQWUsbUJBQU8sQ0FBQyw4RkFBeUI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiw4QkFBOEI7QUFDekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQSw4Q0FBOEMsY0FBYztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsbUJBQU8sQ0FBQyxpRUFBZTtBQUNwQyxlQUFlLG1CQUFPLENBQUMsOEZBQXlCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSIsImZpbGUiOiJhZG1pbn5leHBsb3JhdGlvbl9wbGF5ZXJ+bW9kZXJhdG9yfnByYWN0aWNlX3Nlc3Npb25+cmV2aWV3X3Rlc3R+c2tpbGxfZWRpdG9yfnN0b3J5X2VkaXRvcn50b3BpY19lZGl0fmI2NzMwY2MyLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhcHBseWluZyB2YWxpZGF0aW9uLlxuICovXG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvdW5kZXJzY29yZXMtdG8tY2FtZWwtY2FzZS5maWx0ZXIudHMnKTtcbi8qIGVzbGludC1kaXNhYmxlIGFuZ3VsYXIvZGlyZWN0aXZlLXJlc3RyaWN0ICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2FwcGx5VmFsaWRhdGlvbicsIFtcbiAgICAnJGZpbHRlcicsIGZ1bmN0aW9uICgkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnM6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7IH1dLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbG0sIGF0dHJzLCBjdHJsKSB7XG4gICAgICAgICAgICAgICAgLy8gQWRkIHZhbGlkYXRvcnMgaW4gcmV2ZXJzZSBvcmRlci5cbiAgICAgICAgICAgICAgICBpZiAoc2NvcGUuJGN0cmwudmFsaWRhdG9ycygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRjdHJsLnZhbGlkYXRvcnMoKS5mb3JFYWNoKGZ1bmN0aW9uICh2YWxpZGF0b3JTcGVjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnJvbnRlbmROYW1lID0gJGZpbHRlcigndW5kZXJzY29yZXNUb0NhbWVsQ2FzZScpKHZhbGlkYXRvclNwZWMuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IHRoZXJlIG1heSBub3QgYmUgYSBjb3JyZXNwb25kaW5nIGZyb250ZW5kIGZpbHRlciBmb3JcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVhY2ggYmFja2VuZCB2YWxpZGF0b3IuXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRmaWx0ZXIoZnJvbnRlbmROYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmlsdGVyQXJncyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbGlkYXRvclNwZWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSAnaWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlckFyZ3NbJGZpbHRlcigndW5kZXJzY29yZXNUb0NhbWVsQ2FzZScpKGtleSldID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weSh2YWxpZGF0b3JTcGVjW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXN0b21WYWxpZGF0b3IgPSBmdW5jdGlvbiAodmlld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC4kc2V0VmFsaWRpdHkoZnJvbnRlbmROYW1lLCAkZmlsdGVyKGZyb250ZW5kTmFtZSkodmlld1ZhbHVlLCBmaWx0ZXJBcmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLiRwYXJzZXJzLnVuc2hpZnQoY3VzdG9tVmFsaWRhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuJGZvcm1hdHRlcnMudW5zaGlmdChjdXN0b21WYWxpZGF0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4vKiBlc2xpbnQtZW5hYmxlIGFuZ3VsYXIvZGlyZWN0aXZlLXJlc3RyaWN0ICovXG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgcmVxdWlyaW5nIFwiaXNGbG9hdFwiIGZpbHRlci5cbiAqL1xuLy8gVGhpcyBzaG91bGQgY29tZSBiZWZvcmUgJ2FwcGx5LXZhbGlkYXRpb24nLCBpZiB0aGF0IGlzIGRlZmluZWQgYXNcbi8vIGFuIGF0dHJpYnV0ZSBvbiB0aGUgSFRNTCB0YWcuXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3ZhbGlkYXRvcnMvaXMtZmxvYXQuZmlsdGVyLnRzJyk7XG4vKiBlc2xpbnQtZGlzYWJsZSBhbmd1bGFyL2RpcmVjdGl2ZS1yZXN0cmljdCAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdyZXF1aXJlSXNGbG9hdCcsIFtcbiAgICAnJGZpbHRlcicsIGZ1bmN0aW9uICgkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbG0sIGF0dHJzLCBjdHJsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZsb2F0VmFsaWRhdG9yID0gZnVuY3Rpb24gKHZpZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWRWYWx1ZSA9ICRmaWx0ZXIoJ2lzRmxvYXQnKSh2aWV3VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLiRzZXRWYWxpZGl0eSgnaXNGbG9hdCcsIGZpbHRlcmVkVmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJlZFZhbHVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY3RybC4kcGFyc2Vycy51bnNoaWZ0KGZsb2F0VmFsaWRhdG9yKTtcbiAgICAgICAgICAgICAgICBjdHJsLiRmb3JtYXR0ZXJzLnVuc2hpZnQoZmxvYXRWYWxpZGF0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuLyogZXNsaW50LWVuYWJsZSBhbmd1bGFyL2RpcmVjdGl2ZS1yZXN0cmljdCAqL1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgYm9vbGVhbnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRCb29sRWRpdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWJvb2wtZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgbXVsdGlwbGUgY2hvaWNlLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9OZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkQ2hvaWNlc0VkaXRvcicsIFtcbiAgICAnTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBjaG9pY2VzIGZvciB0aGUgb2JqZWN0J3MgdmFsdWUuXG4gICAgICAgICAgICAgICAgY2hvaWNlczogJyYnLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBzY2hlbWEgZm9yIHRoaXMgb2JqZWN0LlxuICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogVmFsaWRhdGUgZWFjaCBjaG9pY2UgYWdhaW5zdCB0aGUgc2NoZW1hLlxuICAgICAgICAgICAgICAgIHNjaGVtYTogJyYnLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1jaG9pY2VzLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29tcGlsZTogTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS5jb21waWxlLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRSZWFkb25seVNjaGVtYSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWFkb25seVNjaGVtYSA9IGFuZ3VsYXIuY29weShjdHJsLnNjaGVtYSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZWFkb25seVNjaGVtYS5jaG9pY2VzO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlYWRvbmx5U2NoZW1hO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBjdXN0b20gdmFsdWVzLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL29iamVjdC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9OZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkQ3VzdG9tRWRpdG9yJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNsYXNzIG9mIHRoZSBvYmplY3QgYmVpbmcgZWRpdGVkLlxuICAgICAgICAgICAgICAgIG9ialR5cGU6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1jdXN0b20tZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb21waWxlOiBOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLmNvbXBpbGUsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgZGljdHMuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0lkR2VuZXJhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWREaWN0RWRpdG9yJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgaXNEaXNhYmxlZDogJyYnLFxuICAgICAgICAgICAgICAgIC8vIFJlYWQtb25seSBwcm9wZXJ0eS4gQW4gb2JqZWN0IHdob3NlIGtleXMgYW5kIHZhbHVlcyBhcmUgdGhlIGRpY3RcbiAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0aWVzIGFuZCB0aGUgY29ycmVzcG9uZGluZyBzY2hlbWFzLlxuICAgICAgICAgICAgICAgIHByb3BlcnR5U2NoZW1hczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC1kaWN0LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbXBpbGU6IE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UuY29tcGlsZSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsIElkR2VuZXJhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEh1bWFuUmVhZGFibGVQcm9wZXJ0eURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkuZGVzY3JpcHRpb24gfHwgJ1snICsgcHJvcGVydHkubmFtZSArICddJztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZpZWxkSWRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLnByb3BlcnR5U2NoZW1hcygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSByYW5kb20gSURzIGZvciBlYWNoIGZpZWxkLlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZpZWxkSWRzWyRzY29wZS5wcm9wZXJ0eVNjaGVtYXMoKVtpXS5uYW1lXSA9IChJZEdlbmVyYXRpb25TZXJ2aWNlLmdlbmVyYXRlTmV3SWQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZ2VuZXJhbCBzY2hlbWEtYmFzZWQgZWRpdG9ycy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWJvb2wtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWN1c3RvbS1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZGljdC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICdzY2hlbWEtYmFzZWQtZmxvYXQtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAnc2NoZW1hLWJhc2VkLWh0bWwtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy9zY2hlbWEtYmFzZWQtaW50LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgJ3NjaGVtYS1iYXNlZC11bmljb2RlLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIHNjaGVtYTogJyYnLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRCbHVyOiAnPScsXG4gICAgICAgICAgICAgICAgb25JbnB1dEZvY3VzOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtZWRpdG9yLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgZmxvYXRzLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL2FwcGx5LXZhbGlkYXRpb24uZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL3JlcXVpcmUtaXMtZmxvYXQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3ZhbGlkYXRvcnMvaXMtZmxvYXQuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkRmxvYXRFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yczogJyYnLFxuICAgICAgICAgICAgICAgIGxhYmVsRm9yRm9jdXNUYXJnZXQ6ICcmJyxcbiAgICAgICAgICAgICAgICBvbklucHV0Qmx1cjogJz0nLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRGb2N1czogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWEtYmFzZWQtZWRpdG9ycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWZsb2F0LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJGZpbHRlcicsICckdGltZW91dCcsICdGb2N1c01hbmFnZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkZmlsdGVyLCAkdGltZW91dCwgRm9jdXNNYW5hZ2VyU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaGFzTG9hZGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNVc2VyQ3VycmVudGx5VHlwaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaGFzRm9jdXNlZEF0TGVhc3RPbmNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubGFiZWxGb3JFcnJvckZvY3VzVGFyZ2V0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgIEZvY3VzTWFuYWdlclNlcnZpY2UuZ2VuZXJhdGVGb2N1c0xhYmVsKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudmFsaWRhdGUgPSBmdW5jdGlvbiAobG9jYWxWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ2lzRmxvYXQnKShsb2NhbFZhbHVlKSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uRm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmhhc0ZvY3VzZWRBdExlYXN0T25jZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5vbklucHV0Rm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm9uSW5wdXRGb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uQmx1ciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNVc2VyQ3VycmVudGx5VHlwaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5vbklucHV0Qmx1cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwub25JbnB1dEJsdXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBNb3ZlIHRoZXNlIHRvIG5nLW1lc3NhZ2VzIHdoZW4gd2UgbW92ZSB0byBBbmd1bGFyIDEuMy5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRNaW5WYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3RybC52YWxpZGF0b3JzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC52YWxpZGF0b3JzKClbaV0uaWQgPT09ICdpc19hdF9sZWFzdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0cmwudmFsaWRhdG9ycygpW2ldLm1pbl92YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0TWF4VmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN0cmwudmFsaWRhdG9ycygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudmFsaWRhdG9ycygpW2ldLmlkID09PSAnaXNfYXRfbW9zdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN0cmwudmFsaWRhdG9ycygpW2ldLm1heF92YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25LZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoY3RybC5mbG9hdEZvcm0uZmxvYXRWYWx1ZS4kZXJyb3IpLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb2N1c01hbmFnZXJTZXJ2aWNlLnNldEZvY3VzKGN0cmwubGFiZWxGb3JFcnJvckZvY3VzVGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc3VibWl0dGVkU2NoZW1hQmFzZWRGbG9hdEZvcm0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzVXNlckN1cnJlbnRseVR5cGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLmxvY2FsVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5sb2NhbFZhbHVlID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgcHJldmVudHMgdGhlIHJlZCAnaW52YWxpZCBpbnB1dCcgd2FybmluZyBtZXNzYWdlIGZyb20gZmxhc2hpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gYXQgdGhlIG91dHNldC5cbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5oYXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBIVE1MLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2NrLWVkaXRvci1oZWxwZXJzL2NrLWVkaXRvci00LXJ0ZS5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvY2stZWRpdG9yLWhlbHBlcnMvY2stZWRpdG9yLTQtd2lkZ2V0cy5pbml0aWFsaXplci50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEh0bWxFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9JyxcbiAgICAgICAgICAgICAgICBpc0Rpc2FibGVkOiAnJicsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnLFxuICAgICAgICAgICAgICAgIHVpQ29uZmlnOiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtaHRtbC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7IH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBpbnRlZ2Vycy5cbiAqL1xucmVxdWlyZSgnY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9hcHBseS12YWxpZGF0aW9uLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEludEVkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzOiAnJicsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnLFxuICAgICAgICAgICAgICAgIG9uSW5wdXRCbHVyOiAnPScsXG4gICAgICAgICAgICAgICAgb25JbnB1dEZvY3VzOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtaW50LWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwubG9jYWxWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmxvY2FsVmFsdWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN0cmwub25LZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGVtaXQoJ3N1Ym1pdHRlZFNjaGVtYUJhc2VkSW50Rm9ybScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGxpc3RzLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3IuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9JZEdlbmVyYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9OZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3N0YXRlZnVsL0ZvY3VzTWFuYWdlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRMaXN0RWRpdG9yJywgW1xuICAgICdGb2N1c01hbmFnZXJTZXJ2aWNlJywgJ0lkR2VuZXJhdGlvblNlcnZpY2UnLFxuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZScsICdTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKEZvY3VzTWFuYWdlclNlcnZpY2UsIElkR2VuZXJhdGlvblNlcnZpY2UsIE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UsIFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UsIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICAvLyBSZWFkLW9ubHkgcHJvcGVydHkuIFRoZSBzY2hlbWEgZGVmaW5pdGlvbiBmb3IgZWFjaCBpdGVtIGluIHRoZSBsaXN0LlxuICAgICAgICAgICAgICAgIGl0ZW1TY2hlbWE6ICcmJyxcbiAgICAgICAgICAgICAgICAvLyBUaGUgbGVuZ3RoIG9mIHRoZSBsaXN0LiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbGlzdCBpcyBvZiBhcmJpdHJhcnlcbiAgICAgICAgICAgICAgICAvLyBsZW5ndGguXG4gICAgICAgICAgICAgICAgbGVuOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gVUkgY29uZmlndXJhdGlvbi4gTWF5IGJlIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICB1aUNvbmZpZzogJyYnLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnM6ICcmJyxcbiAgICAgICAgICAgICAgICBsYWJlbEZvckZvY3VzVGFyZ2V0OiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYS1iYXNlZC1lZGl0b3JzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtbGlzdC1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb21waWxlOiBOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLmNvbXBpbGUsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VGb2N1c0xhYmVsID0gKCRzY29wZS5sYWJlbEZvckZvY3VzVGFyZ2V0KCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIElkR2VuZXJhdGlvblNlcnZpY2UuZ2VuZXJhdGVOZXdJZCgpICsgJy0nKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEZvY3VzTGFiZWwgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyZWF0IHRoZSBmaXJzdCBpdGVtIGluIHRoZSBsaXN0IGFzIGEgc3BlY2lhbCBjYXNlIC0tIGlmIHRoaXMgbGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgY29udGFpbmVkIGluIGFub3RoZXIgbGlzdCwgYW5kIHRoZSBvdXRlciBsaXN0IGlzIG9wZW5lZCB3aXRoIGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlc2lyZSB0byBhdXRvZm9jdXMgb24gdGhlIGZpcnN0IGlucHV0IGZpZWxkLCB3ZSBjYW4gdGhlbiBmb2N1cyBvblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGdpdmVuICRzY29wZS5sYWJlbEZvckZvY3VzVGFyZ2V0KCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOT1RFOiBUaGlzIHdpbGwgY2F1c2UgcHJvYmxlbXMgZm9yIGxpc3RzIG5lc3RlZCB3aXRoaW4gbGlzdHMsIHNpbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdWItZWxlbWVudCAwID4gMSB3aWxsIGhhdmUgdGhlIHNhbWUgbGFiZWwgYXMgc3ViLWVsZW1lbnQgMSA+IDAuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCdXQgd2Ugd2lsbCBhc3N1bWUgKGZvciBub3cpIHRoYXQgbmVzdGVkIGxpc3RzIHdvbid0IGJlIHVzZWQgLS0gaWZcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZXkgYXJlLCB0aGlzIHdpbGwgbmVlZCB0byBiZSBjaGFuZ2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChpbmRleCA9PT0gMCA/IGJhc2VGb2N1c0xhYmVsIDogYmFzZUZvY3VzTGFiZWwgKyBpbmRleC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzQWRkSXRlbUJ1dHRvblByZXNlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkRWxlbWVudFRleHQgPSAnQWRkIGVsZW1lbnQnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnVpQ29uZmlnKCkgJiYgJHNjb3BlLnVpQ29uZmlnKCkuYWRkX2VsZW1lbnRfdGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFkZEVsZW1lbnRUZXh0ID0gJHNjb3BlLnVpQ29uZmlnKCkuYWRkX2VsZW1lbnRfdGV4dDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGhpZGUgdGhlICdhZGQgaXRlbScgYnV0dG9uIGluIHRoZSBjYXNlIG9mIHNpbmdsZS1saW5lIHVuaWNvZGVcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5wdXQuXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09uZUxpbmVJbnB1dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaXRlbVNjaGVtYSgpLnR5cGUgIT09ICd1bmljb2RlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLml0ZW1TY2hlbWEoKS5oYXNPd25Qcm9wZXJ0eSgnY2hvaWNlcycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPbmVMaW5lSW5wdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUuaXRlbVNjaGVtYSgpLnVpX2NvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pdGVtU2NoZW1hKCkudWlfY29uZmlnLmNvZGluZ19tb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT25lTGluZUlucHV0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUuaXRlbVNjaGVtYSgpLnVpX2NvbmZpZy5oYXNPd25Qcm9wZXJ0eSgncm93cycpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLml0ZW1TY2hlbWEoKS51aV9jb25maWcucm93cyA+IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPbmVMaW5lSW5wdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWluTGlzdExlbmd0aCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tYXhMaXN0TGVuZ3RoID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNob3dEdXBsaWNhdGVzV2FybmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnZhbGlkYXRvcnMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2NvcGUudmFsaWRhdG9ycygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS52YWxpZGF0b3JzKClbaV0uaWQgPT09ICdoYXNfbGVuZ3RoX2F0X21vc3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5tYXhMaXN0TGVuZ3RoID0gJHNjb3BlLnZhbGlkYXRvcnMoKVtpXS5tYXhfdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCRzY29wZS52YWxpZGF0b3JzKClbaV0uaWQgPT09ICdoYXNfbGVuZ3RoX2F0X2xlYXN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWluTGlzdExlbmd0aCA9ICRzY29wZS52YWxpZGF0b3JzKClbaV0ubWluX3ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgkc2NvcGUudmFsaWRhdG9ycygpW2ldLmlkID09PSAnaXNfdW5pcXVpZmllZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNob3dEdXBsaWNhdGVzV2FybmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggPCAkc2NvcGUubWluTGlzdExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUucHVzaChTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlLmdldERlZmF1bHRWYWx1ZSgkc2NvcGUuaXRlbVNjaGVtYSgpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhhc0R1cGxpY2F0ZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVzU29GYXIgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkc2NvcGUubG9jYWxWYWx1ZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlc1NvRmFyLmhhc093blByb3BlcnR5KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXNTb0Zhclt2YWx1ZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLnNob3dEdXBsaWNhdGVzV2FybmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5saXN0RWRpdG9yRm9ybS4kc2V0VmFsaWRpdHkoJ2lzVW5pcXVpZmllZCcsICEkc2NvcGUuaGFzRHVwbGljYXRlcygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgnbG9jYWxWYWx1ZScsIHZhbGlkYXRlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5sZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFkZEVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5pc09uZUxpbmVJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaGlkZUFkZEl0ZW1CdXR0b24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUucHVzaChTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlLmdldERlZmF1bHRWYWx1ZSgkc2NvcGUuaXRlbVNjaGVtYSgpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9jdXNNYW5hZ2VyU2VydmljZS5zZXRGb2N1cygkc2NvcGUuZ2V0Rm9jdXNMYWJlbCgkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggLSAxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9kZWxldGVMYXN0RWxlbWVudElmVW5kZWZpbmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VmFsdWVJbmRleCA9ICRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlVG9Db25zaWRlclVuZGVmaW5lZCA9IChTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UuZ2V0VW5kZWZpbmVkVmFsdWUoJHNjb3BlLml0ZW1TY2hlbWEoKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubG9jYWxWYWx1ZVtsYXN0VmFsdWVJbmRleF0gPT09XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlVG9Db25zaWRlclVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGVsZXRlRWxlbWVudChsYXN0VmFsdWVJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWxldGVFbXB0eUVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubG9jYWxWYWx1ZVtpXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5kZWxldGVFbGVtZW50KGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmxvY2FsVmFsdWVbMF0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0FkZEl0ZW1CdXR0b25QcmVzZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxhc3RFbGVtZW50T25CbHVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9kZWxldGVMYXN0RWxlbWVudElmVW5kZWZpbmVkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNob3dBZGRJdGVtQnV0dG9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNob3dBZGRJdGVtQnV0dG9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZUVtcHR5RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNBZGRJdGVtQnV0dG9uUHJlc2VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmhpZGVBZGRJdGVtQnV0dG9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5pc0FkZEl0ZW1CdXR0b25QcmVzZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLl9vbkNoaWxkRm9ybVN1Ym1pdCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRzY29wZS5pc0FkZEl0ZW1CdXR0b25QcmVzZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBJZiBmb3JtIHN1Ym1pc3Npb24gaGFwcGVucyBvbiBsYXN0IGVsZW1lbnQgb2YgdGhlIHNldCAoaS5lIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBhZGQgaXRlbSBidXR0b24gaXMgYWJzZW50KSB0aGVuIGF1dG9tYXRpY2FsbHkgYWRkIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHRvIHRoZSBsaXN0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCgkc2NvcGUubWF4TGlzdExlbmd0aCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvY2FsVmFsdWUubGVuZ3RoIDwgJHNjb3BlLm1heExpc3RMZW5ndGgpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhISRzY29wZS5sb2NhbFZhbHVlWyRzY29wZS5sb2NhbFZhbHVlLmxlbmd0aCAtIDFdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWRkRWxlbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogSWYgZm9ybSBzdWJtaXNzaW9uIGhhcHBlbnMgb24gZXhpc3RpbmcgZWxlbWVudCByZW1vdmUgZm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZnJvbSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzdWJtaXR0ZWRTY2hlbWFCYXNlZEludEZvcm0nLCAkc2NvcGUuX29uQ2hpbGRGb3JtU3VibWl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3N1Ym1pdHRlZFNjaGVtYUJhc2VkRmxvYXRGb3JtJywgJHNjb3BlLl9vbkNoaWxkRm9ybVN1Ym1pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzdWJtaXR0ZWRTY2hlbWFCYXNlZFVuaWNvZGVGb3JtJywgJHNjb3BlLl9vbkNoaWxkRm9ybVN1Ym1pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZGVsZXRlRWxlbWVudCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gbGV0IHRoZSBSVEUga25vdyB0aGF0IEh0bWxDb250ZW50IGhhcyBiZWVuIGNoYW5nZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ2V4dGVybmFsSHRtbENvbnRlbnRDaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubG9jYWxWYWx1ZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubGVuIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBsZW5ndGggZm9yIGxpc3QgZWRpdG9yOiAnICsgJHNjb3BlLmxlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubGVuICE9PSAkc2NvcGUubG9jYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyAnTGlzdCBlZGl0b3IgbGVuZ3RoIGRvZXMgbm90IG1hdGNoIGxlbmd0aCBvZiBpbnB1dCB2YWx1ZTogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sZW4gKyAnICcgKyAkc2NvcGUubG9jYWxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciB1bmljb2RlIHN0cmluZ3MuXG4gKi9cbnJlcXVpcmUoJ2ludGVyYWN0aW9ucy9jb2RlbWlycm9yUmVxdWlyZXMudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvYXBwbHktdmFsaWRhdGlvbi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvY29udmVydC11bmljb2RlLXdpdGgtcGFyYW1zLXRvLWh0bWwuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL0RldmljZUluZm9TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkVW5pY29kZUVkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzOiAnJicsXG4gICAgICAgICAgICAgICAgdWlDb25maWc6ICcmJyxcbiAgICAgICAgICAgICAgICBsYWJlbEZvckZvY3VzVGFyZ2V0OiAnJicsXG4gICAgICAgICAgICAgICAgb25JbnB1dEJsdXI6ICc9JyxcbiAgICAgICAgICAgICAgICBvbklucHV0Rm9jdXM6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hLWJhc2VkLWVkaXRvcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYS1iYXNlZC11bmljb2RlLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJGZpbHRlcicsICckc2NlJywgJyR0cmFuc2xhdGUnLCAnRGV2aWNlSW5mb1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRmaWx0ZXIsICRzY2UsICR0cmFuc2xhdGUsIERldmljZUluZm9TZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudWlDb25maWcoKSAmJiBjdHJsLnVpQ29uZmlnKCkuY29kaW5nX21vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZsYWcgdGhhdCBpcyBmbGlwcGVkIGVhY2ggdGltZSB0aGUgY29kZW1pcnJvciB2aWV3IGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaG93bi4gKFRoZSBjb2RlbWlycm9yIGluc3RhbmNlIG5lZWRzIHRvIGJlIHJlZnJlc2hlZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXZlcnkgdGltZSBpdCBpcyB1bmhpZGRlbi4pXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvZGVtaXJyb3JTdGF0dXMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBDT0RJTkdfTU9ERV9OT05FID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2RlbWlycm9yT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRhYnMgdG8gc3BhY2VzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhS2V5czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWI6IGZ1bmN0aW9uIChjbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwYWNlcyA9IEFycmF5KGNtLmdldE9wdGlvbignaW5kZW50VW5pdCcpICsgMSkuam9pbignICcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY20ucmVwbGFjZVNlbGVjdGlvbihzcGFjZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmRTZWxlY3Rpb25Qb3MgPSBjbS5nZXREb2MoKS5nZXRDdXJzb3IoJ2hlYWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtLmdldERvYygpLnNldEN1cnNvcihlbmRTZWxlY3Rpb25Qb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnRXaXRoVGFiczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcnM6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5pc0Rpc2FibGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvZGVtaXJyb3JPcHRpb25zLnJlYWRPbmx5ID0gJ25vY3Vyc29yJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBvbmx5ICdjb2ZmZWVzY3JpcHQnLCAnamF2YXNjcmlwdCcsICdsdWEnLCAncHl0aG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICdydWJ5JyBhbmQgJ3NjaGVtZScgaGF2ZSBDb2RlTWlycm9yLXN1cHBvcnRlZCBzeW50YXhcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhpZ2hsaWdodGluZy4gRm9yIG90aGVyIGxhbmd1YWdlcywgc3ludGF4IGhpZ2hsaWdodGluZyB3aWxsIG5vdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGFwcGVuLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudWlDb25maWcoKS5jb2RpbmdfbW9kZSAhPT0gQ09ESU5HX01PREVfTk9ORSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29kZW1pcnJvck9wdGlvbnMubW9kZSA9IGN0cmwudWlDb25maWcoKS5jb2RpbmdfbW9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY29kZW1pcnJvclN0YXR1cyA9ICFjdHJsLmNvZGVtaXJyb3JTdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgZm9ybSB2aWV3IGlzIG9wZW5lZCwgZmxpcCB0aGUgc3RhdHVzIGZsYWcuIFRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGltZW91dCBzZWVtcyB0byBiZSBuZWVkZWQgZm9yIHRoZSBsaW5lIG51bWJlcnMgZXRjLiB0byBkaXNwbGF5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwcm9wZXJseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3NjaGVtYUJhc2VkRm9ybXNTaG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2RlbWlycm9yU3RhdHVzID0gIWN0cmwuY29kZW1pcnJvclN0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbktleXByZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kZW1pdCgnc3VibWl0dGVkU2NoZW1hQmFzZWRVbmljb2RlRm9ybScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsLnVpQ29uZmlnKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwudWlDb25maWcoKS5wbGFjZWhvbGRlciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZXZpY2VJbmZvU2VydmljZS5oYXNUb3VjaEV2ZW50cygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkdHJhbnNsYXRlLmluc3RhbnQoJ0kxOE5fUExBWUVSX0RFRkFVTFRfTU9CSUxFX1BMQUNFSE9MREVSJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLnVpQ29uZmlnKCkucGxhY2Vob2xkZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Um93cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC51aUNvbmZpZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3RybC51aUNvbmZpZygpLnJvd3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0Q29kaW5nTW9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC51aUNvbmZpZygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3RybC51aUNvbmZpZygpLmNvZGluZ19tb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldERpc3BsYXllZFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwoJGZpbHRlcignY29udmVydFVuaWNvZGVXaXRoUGFyYW1zVG9IdG1sJykoY3RybC5sb2NhbFZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBWYWxpZGF0b3IgdG8gY2hlY2sgaWYgaW5wdXQgaXMgZmxvYXQuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignaXNGbG9hdCcsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciBGTE9BVF9SRUdFWFAgPSAvKD89LipcXGQpXlxcLT9cXGQqKFxcLnxcXCwpP1xcZCpcXCU/JC87XG4gICAgICAgICAgICAvLyBUaGlzIHJlZ2V4IGFjY2VwdHMgZmxvYXRzIGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0czpcbiAgICAgICAgICAgIC8vIDAuXG4gICAgICAgICAgICAvLyAwLjU1Li5cbiAgICAgICAgICAgIC8vIC0wLjU1Li5cbiAgICAgICAgICAgIC8vIC41NTUuLlxuICAgICAgICAgICAgLy8gLS41NTUuLlxuICAgICAgICAgICAgLy8gQWxsIGV4YW1wbGVzIGFib3ZlIHdpdGggJy4nIHJlcGxhY2VkIHdpdGggJywnIGFyZSBhbHNvIHZhbGlkLlxuICAgICAgICAgICAgLy8gRXhwcmVzc2lvbnMgY29udGFpbmluZyAlIGFyZSBhbHNvIHZhbGlkICg1LjElIGV0YykuXG4gICAgICAgICAgICB2YXIgdmlld1ZhbHVlID0gJyc7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZpZXdWYWx1ZSA9IGlucHV0LnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZpZXdWYWx1ZSAhPT0gJycgJiYgRkxPQVRfUkVHRVhQLnRlc3Qodmlld1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICh2aWV3VmFsdWUuc2xpY2UoLTEpID09PSAnJScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHBlcmNlbnRhZ2UsIHNvIHRoZSBpbnB1dCBuZWVkcyB0byBiZSBkaXZpZGVkIGJ5IDEwMC5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmlld1ZhbHVlLnN1YnN0cmluZygwLCB2aWV3VmFsdWUubGVuZ3RoIC0gMSkucmVwbGFjZSgnLCcsICcuJykpIC8gMTAwLjA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2aWV3VmFsdWUucmVwbGFjZSgnLCcsICcuJykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0cyB1bmljb2RlIHRvIEhUTUwuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCdjb252ZXJ0VW5pY29kZVRvSHRtbCcsIFtcbiAgICAnJHNhbml0aXplJywgJ0h0bWxFc2NhcGVyU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRzYW5pdGl6ZSwgSHRtbEVzY2FwZXJTZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuICRzYW5pdGl6ZShIdG1sRXNjYXBlclNlcnZpY2UudW5lc2NhcGVkU3RyVG9Fc2NhcGVkU3RyKHRleHQpKTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydHMge3tuYW1lfX0gc3Vic3RyaW5ncyB0b1xuICogPG9wcGlhLXBhcmFtZXRlcj5uYW1lPC9vcHBpYS1wYXJhbWV0ZXI+IHRhZ3MgYW5kIHVuZXNjYXBlcyB0aGVcbiAqIHssIH0gYW5kIFxcIGNoYXJhY3RlcnMuIFRoaXMgaXMgZG9uZSBieSByZWFkaW5nIHRoZSBnaXZlbiBzdHJpbmcgZnJvbVxuICogbGVmdCB0byByaWdodDogaWYgd2Ugc2VlIGEgYmFja3NsYXNoLCB3ZSB1c2UgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXI7XG4gKiBpZiB3ZSBzZWUgYSAne3snLCB0aGlzIGlzIHRoZSBzdGFydCBvZiBhIHBhcmFtZXRlcjsgaWYgd2Ugc2VlIGEgJ319JztcbiAqIHRoaXMgaXMgdGhlIGVuZCBvZiBhIHBhcmFtZXRlci5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9jb252ZXJ0LXVuaWNvZGUtdG8taHRtbC5maWx0ZXIudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignY29udmVydFVuaWNvZGVXaXRoUGFyYW1zVG9IdG1sJywgW1xuICAgICckZmlsdGVyJywgZnVuY3Rpb24gKCRmaWx0ZXIpIHtcbiAgICAgICAgdmFyIGFzc2VydCA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgICAgICBpZiAoIXRleHQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSW52YWxpZCB1bmljb2RlLXN0cmluZy13aXRoLXBhcmFtZXRlcnM6ICcgKyB0ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIC8vIFRoZSBwYXJzaW5nIGhlcmUgbmVlZHMgdG8gYmUgZG9uZSB3aXRoIG1vcmUgY2FyZSBiZWNhdXNlIHdlIGFyZVxuICAgICAgICAgICAgLy8gcmVwbGFjaW5nIHR3by1jaGFyYWN0ZXIgc3RyaW5ncy4gV2UgY2FuJ3QgbmFpdmVseSBicmVhayBieSB7eyBiZWNhdXNlXG4gICAgICAgICAgICAvLyBpbiBzdHJpbmdzIGxpa2UgXFx7e3sgdGhlIHNlY29uZCBhbmQgdGhpcmQgY2hhcmFjdGVycyB3aWxsIGJlIHRha2VuIGFzXG4gICAgICAgICAgICAvLyB0aGUgb3BlbmluZyBicmFja2V0cywgd2hpY2ggaXMgd3JvbmcuIFdlIGNhbid0IHVuZXNjYXBlIGNoYXJhY3RlcnNcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgdGhlbiB0aGUgeyBjaGFyYWN0ZXJzIHRoYXQgcmVtYWluIHdpbGwgYmUgYW1iaWd1b3VzICh0aGV5IG1heVxuICAgICAgICAgICAgLy8gZWl0aGVyIGJlIHRoZSBvcGVuaW5ncyBvZiBwYXJhbWV0ZXJzIG9yIGxpdGVyYWwgJ3snIGNoYXJhY3RlcnMgZW50ZXJlZFxuICAgICAgICAgICAgLy8gYnkgdGhlIHVzZXIuIFNvIHdlIGJ1aWxkIGEgc3RhbmRhcmQgbGVmdC10by1yaWdodCBwYXJzZXIgd2hpY2ggZXhhbWluZXNcbiAgICAgICAgICAgIC8vIGVhY2ggY2hhcmFjdGVyIG9mIHRoZSBzdHJpbmcgaW4gdHVybiwgYW5kIHByb2Nlc3NlcyBpdCBhY2NvcmRpbmdseS5cbiAgICAgICAgICAgIHZhciB0ZXh0RnJhZ21lbnRzID0gW107XG4gICAgICAgICAgICB2YXIgY3VycmVudEZyYWdtZW50ID0gJyc7XG4gICAgICAgICAgICB2YXIgY3VycmVudEZyYWdtZW50SXNQYXJhbSA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRleHRbaV0gPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQoIWN1cnJlbnRGcmFnbWVudElzUGFyYW0gJiYgdGV4dC5sZW5ndGggPiBpICsgMSAmJiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAneyc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnfSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAnXFxcXCc6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVt0ZXh0W2kgKyAxXV0pO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RnJhZ21lbnQgKz0gdGV4dFtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGV4dFtpXSA9PT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzc2VydCh0ZXh0Lmxlbmd0aCA+IGkgKyAxICYmICFjdXJyZW50RnJhZ21lbnRJc1BhcmFtICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0W2kgKyAxXSA9PT0gJ3snKTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dEZyYWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGN1cnJlbnRGcmFnbWVudFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGcmFnbWVudElzUGFyYW0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRleHRbaV0gPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQodGV4dC5sZW5ndGggPiBpICsgMSAmJiBjdXJyZW50RnJhZ21lbnRJc1BhcmFtICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0W2kgKyAxXSA9PT0gJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dEZyYWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwYXJhbWV0ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogY3VycmVudEZyYWdtZW50XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RnJhZ21lbnQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50SXNQYXJhbSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50RnJhZ21lbnQgKz0gdGV4dFtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhc3NlcnQoIWN1cnJlbnRGcmFnbWVudElzUGFyYW0pO1xuICAgICAgICAgICAgdGV4dEZyYWdtZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgZGF0YTogY3VycmVudEZyYWdtZW50XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgICAgIHRleHRGcmFnbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoZnJhZ21lbnQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gKGZyYWdtZW50LnR5cGUgPT09ICd0ZXh0JyA/XG4gICAgICAgICAgICAgICAgICAgICRmaWx0ZXIoJ2NvbnZlcnRVbmljb2RlVG9IdG1sJykoZnJhZ21lbnQuZGF0YSkgOlxuICAgICAgICAgICAgICAgICAgICAnPG9wcGlhLXBhcmFtZXRlcj4nICsgZnJhZ21lbnQuZGF0YSArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9vcHBpYS1wYXJhbWV0ZXI+Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFVuZGVyc2NvcmVzVG9DYW1lbENhc2UgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCd1bmRlcnNjb3Jlc1RvQ2FtZWxDYXNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL18rKC4pL2csIGZ1bmN0aW9uIChtYXRjaCwgZ3JvdXAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwMS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHByZXZlbnRzIHRpbWVvdXRzIGR1ZSB0byByZWN1cnNpb25cbiAqIGluIG5lc3RlZCBkaXJlY3RpdmVzLiBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xLzE0NDMwNjU1XG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UnLCBbXG4gICAgJyRjb21waWxlJywgZnVuY3Rpb24gKCRjb21waWxlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIE1hbnVhbGx5IGNvbXBpbGVzIHRoZSBlbGVtZW50LCBmaXhpbmcgdGhlIHJlY3Vyc2lvbiBsb29wLlxuICAgICAgICAgICAgICogQHBhcmFtIHtET00gZWxlbWVudH0gZWxlbWVudFxuICAgICAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbnxvYmplY3R9IGxpbmsgLSBBIHBvc3QtbGluayBmdW5jdGlvbiwgb3IgYW4gb2JqZWN0XG4gICAgICAgICAgICAgKiAgIHdpdGggZnVuY3Rpb24ocykgcmVnaXN0ZXJlZCB2aWEgcHJlIGFuZCBwb3N0IHByb3BlcnRpZXMuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtvYmplY3R9IEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBsaW5raW5nIGZ1bmN0aW9ucy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29tcGlsZTogZnVuY3Rpb24gKGVsZW1lbnQsIGxpbmspIHtcbiAgICAgICAgICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGxpbmsgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbihsaW5rKSkge1xuICAgICAgICAgICAgICAgICAgICBsaW5rID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdDogbGlua1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBCcmVhayB0aGUgcmVjdXJzaW9uIGxvb3AgYnkgcmVtb3ZpbmcgdGhlIGNvbnRlbnRzLFxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50cyA9IGVsZW1lbnQuY29udGVudHMoKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB2YXIgY29tcGlsZWRDb250ZW50cztcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBwcmU6IChsaW5rICYmIGxpbmsucHJlKSA/IGxpbmsucHJlIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdDogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21waWxlIHRoZSBjb250ZW50cy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY29tcGlsZWRDb250ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVkQ29udGVudHMgPSAkY29tcGlsZShjb250ZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZS1hZGQgdGhlIGNvbXBpbGVkIGNvbnRlbnRzIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRDb250ZW50cyhzY29wZSwgZnVuY3Rpb24gKGNsb25lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoY2xvbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxsIHRoZSBwb3N0LWxpbmtpbmcgZnVuY3Rpb24sIGlmIGFueS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW5rICYmIGxpbmsucG9zdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmsucG9zdC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBwcm92aWRlcyBjb3JyZWN0IGRlZmF1bHQgdmFsdWUgZm9yXG4gKiBTY2hlbWFCYXNlZExpc3QgaXRlbS5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZSgpIHtcbiAgICB9XG4gICAgLy8gVE9ETyhzbGwpOiBSZXdyaXRlIHRoaXMgdG8gdGFrZSB2YWxpZGF0b3JzIGludG8gYWNjb3VudCwgc28gdGhhdFxuICAgIC8vIHdlIGFsd2F5cyBzdGFydCB3aXRoIGEgdmFsaWQgdmFsdWUuXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnc2NoZW1hJyBpcyBhIGNvbXBsZXggZGljdCByZXF1aXJpbmcgdmVyeSBjYXJlZnVsXG4gICAgLy8gYmFja3RyYWNraW5nLlxuICAgIFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UucHJvdG90eXBlLmdldERlZmF1bHRWYWx1ZSA9IGZ1bmN0aW9uIChzY2hlbWEpIHtcbiAgICAgICAgaWYgKHNjaGVtYS5jaG9pY2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hLmNob2ljZXNbMF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NoZW1hLnR5cGUgPT09ICdib29sJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlID09PSAndW5pY29kZScgfHwgc2NoZW1hLnR5cGUgPT09ICdodG1sJykge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlID09PSAnbGlzdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBbdGhpcy5nZXREZWZhdWx0VmFsdWUoc2NoZW1hLml0ZW1zKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2NoZW1hLnR5cGUgPT09ICdkaWN0Jykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2hlbWEucHJvcGVydGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtzY2hlbWEucHJvcGVydGllc1tpXS5uYW1lXSA9IHRoaXMuZ2V0RGVmYXVsdFZhbHVlKHNjaGVtYS5wcm9wZXJ0aWVzW2ldLnNjaGVtYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNjaGVtYS50eXBlID09PSAnaW50JyB8fCBzY2hlbWEudHlwZSA9PT0gJ2Zsb2F0Jykge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIHNjaGVtYSB0eXBlOiAnICsgc2NoZW1hLnR5cGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2UpO1xuICAgIHJldHVybiBTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuU2NoZW1hRGVmYXVsdFZhbHVlU2VydmljZSA9IFNjaGVtYURlZmF1bHRWYWx1ZVNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShTY2hlbWFEZWZhdWx0VmFsdWVTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gY2hlY2sgaWYgdGhlIGxhc3QgZWxlbWVudCBvZiBTY2hlbWFCYXNlZExpc3RcbiAqIGlzIHVuZGVmaW5lZC5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTY2hlbWFVbmRlZmluZWRMYXN0RWxlbWVudFNlcnZpY2UoKSB7XG4gICAgfVxuICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgaW5wdXQgdmFsdWUsIHRha2VuIGFzIHRoZSBsYXN0IGVsZW1lbnQgaW4gYSBsaXN0LFxuICAgIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkIGFzICd1bmRlZmluZWQnIGFuZCB0aGVyZWZvcmUgZGVsZXRlZC5cbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdzY2hlbWEnIGlzIGEgY29tcGxleCBkaWN0IHJlcXVpcmluZyB2ZXJ5IGNhcmVmdWxcbiAgICAvLyBiYWNrdHJhY2tpbmcuXG4gICAgU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlLnByb3RvdHlwZS5nZXRVbmRlZmluZWRWYWx1ZSA9IGZ1bmN0aW9uIChzY2hlbWEpIHtcbiAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSAndW5pY29kZScgfHwgc2NoZW1hLnR5cGUgPT09ICdodG1sJykge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSk7XG4gICAgcmV0dXJuIFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZTtcbn0oKSk7XG5leHBvcnRzLlNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZSA9IFNjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1NjaGVtYVVuZGVmaW5lZExhc3RFbGVtZW50U2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoU2NoZW1hVW5kZWZpbmVkTGFzdEVsZW1lbnRTZXJ2aWNlKSk7XG4iXSwic291cmNlUm9vdCI6IiJ9