(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["creator_dashboard~exploration_editor~exploration_player~skill_editor~story_editor~topic_editor"],{

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts":
/*!**************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.directive.ts ***!
  \**************************************************************************************************************************************************/
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
 * @fileoverview Directive for a schema-based editor for expressions.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('schemaBasedExpressionEditorModule').directive('schemaBasedExpressionEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                isDisabled: '&',
                // TODO(sll): Currently only takes a string which is either 'bool',
                // 'int' or 'float'. May need to generalize.
                outputType: '&',
                labelForFocusTarget: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-schema-editors/' +
                'schema-based-expression-editor/' +
                'schema-based-expression-editor.directive.html'),
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-unicode-filters/convert-html-to-unicode.filter.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Converts HTML to unicode.
 */
angular.module('formsUnicodeFiltersModule').filter('convertHtmlToUnicode', [function () {
        return function (html) {
            return angular.element('<div>' + html + '</div>').text();
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedCustomViewerDirective.ts ***!
  \*****************************************************************************************************/
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
 * @fileoverview Directive for a schema-based viewer for custom values.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
oppia.directive('schemaBasedCustomViewer', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                // The class of the object being edited.
                objType: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_custom_viewer_directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedDictViewerDirective.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Directive for a schema-based viewer for dicts.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
oppia.directive('schemaBasedDictViewer', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                // Read-only property. An object whose keys and values are the dict
                // properties and the corresponding schemas.
                propertySchemas: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_dict_viewer_directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
            controller: ['$scope', function ($scope) {
                    $scope.getHumanReadablePropertyDescription = function (property) {
                        return property.description || '[' + property.name + ']';
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedHtmlViewerDirective.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Directive for a schema-based viewer for HTML.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('schemaBasedHtmlViewer', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_html_viewer_directive.html'),
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedListViewerDirective.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedListViewerDirective.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Directive for a schema-based viewer for lists.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/NestedDirectivesRecursionTimeoutPreventionService.ts */ "./core/templates/dev/head/services/NestedDirectivesRecursionTimeoutPreventionService.ts");
oppia.directive('schemaBasedListViewer', [
    'NestedDirectivesRecursionTimeoutPreventionService',
    'UrlInterpolationService',
    function (NestedDirectivesRecursionTimeoutPreventionService, UrlInterpolationService) {
        return {
            scope: {
                localValue: '=',
                // Read-only property. The schema definition for each item in the list.
                itemSchema: '&'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_list_viewer_directive.html'),
            restrict: 'E',
            compile: NestedDirectivesRecursionTimeoutPreventionService.compile
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedPrimitiveViewerDirective.ts ***!
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
 * @fileoverview Directive for a schema-based viewer for primitive types.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('schemaBasedPrimitiveViewer', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_primitive_viewer_directive.html'),
            restrict: 'E',
            controller: ['$scope', function ($scope) {
                    $scope.isExpression = function (value) {
                        return angular.isString(value);
                    };
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedUnicodeViewerDirective.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Directive for a schema-based viewer for unicode strings.
 */
__webpack_require__(/*! components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts */ "./core/templates/dev/head/components/forms/forms-unicode-filters/convert-unicode-with-params-to-html.filter.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('schemaBasedUnicodeViewer', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                localValue: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_unicode_viewer_directive.html'),
            restrict: 'E',
            controller: [
                '$scope', '$filter', '$sce',
                function ($scope, $filter, $sce) {
                    $scope.getDisplayedValue = function () {
                        return $sce.trustAsHtml($filter('convertUnicodeWithParamsToHtml')($scope.localValue));
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedViewerDirective.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/schema_viewers/SchemaBasedViewerDirective.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Directive for general schema-based viewers.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.directive('schemaBasedViewer', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            scope: {
                schema: '&',
                localValue: '='
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/schema_viewers/' +
                'schema_based_viewer_directive.html'),
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/directives/AngularHtmlBindDirective.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/directives/AngularHtmlBindDirective.ts ***!
  \************************************************************************/
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
 * @fileoverview AngularHtmlBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
// HTML bind directive that trusts the value it is given and also evaluates
// custom directive tags in the provided value.
oppia.directive('angularHtmlBind', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            link: function (scope, elm, attrs) {
                // Clean up old scopes if the html changes.
                // Reference: https://stackoverflow.com/a/42927814
                var newScope;
                scope.$watch(attrs.htmlData, function (newValue) {
                    if (newScope) {
                        newScope.$destroy();
                    }
                    elm.empty();
                    newScope = scope.$new();
                    elm.html(newValue);
                    $compile(elm.contents())(newScope);
                });
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/directives/MathjaxBindDirective.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/directives/MathjaxBindDirective.ts ***!
  \********************************************************************/
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
 * @fileoverview MathjaxBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
oppia.directive('mathjaxBind', [function () {
        return {
            restrict: 'E',
            controller: [
                '$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    $scope.$watch($attrs.mathjaxData, function (value) {
                        var $script = angular.element('<script type="math/tex">').html(value === undefined ? '' : value);
                        $element.html('');
                        $element.append($script);
                        MathJax.Hub.Queue(['Reprocess', MathJax.Hub, $element[0]]);
                    });
                }
            ]
        };
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1leHByZXNzaW9uLWVkaXRvci9zY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzL2NvbnZlcnQtaHRtbC10by11bmljb2RlLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzL1NjaGVtYUJhc2VkQ3VzdG9tVmlld2VyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hX3ZpZXdlcnMvU2NoZW1hQmFzZWREaWN0Vmlld2VyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hX3ZpZXdlcnMvU2NoZW1hQmFzZWRIdG1sVmlld2VyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hX3ZpZXdlcnMvU2NoZW1hQmFzZWRMaXN0Vmlld2VyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hX3ZpZXdlcnMvU2NoZW1hQmFzZWRQcmltaXRpdmVWaWV3ZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWFfdmlld2Vycy9TY2hlbWFCYXNlZFVuaWNvZGVWaWV3ZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWFfdmlld2Vycy9TY2hlbWFCYXNlZFZpZXdlckRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kaXJlY3RpdmVzL0FuZ3VsYXJIdG1sQmluZERpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kaXJlY3RpdmVzL01hdGhqYXhCaW5kRGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyw4SkFBK0Q7QUFDdkU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNE1BQzJDO0FBQ25ELG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3RDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQSxLQUFLIiwiZmlsZSI6ImNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+c2tpbGxfZWRpdG9yfnN0b3J5X2VkaXRvcn50b3BpY19lZGl0b3IuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgZXhwcmVzc2lvbnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZEV4cHJlc3Npb25FZGl0b3JNb2R1bGUnKS5kaXJlY3RpdmUoJ3NjaGVtYUJhc2VkRXhwcmVzc2lvbkVkaXRvcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIGlzRGlzYWJsZWQ6ICcmJyxcbiAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IEN1cnJlbnRseSBvbmx5IHRha2VzIGEgc3RyaW5nIHdoaWNoIGlzIGVpdGhlciAnYm9vbCcsXG4gICAgICAgICAgICAgICAgLy8gJ2ludCcgb3IgJ2Zsb2F0Jy4gTWF5IG5lZWQgdG8gZ2VuZXJhbGl6ZS5cbiAgICAgICAgICAgICAgICBvdXRwdXRUeXBlOiAnJicsXG4gICAgICAgICAgICAgICAgbGFiZWxGb3JGb2N1c1RhcmdldDogJyYnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hLWJhc2VkLWV4cHJlc3Npb24tZWRpdG9yLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRSdcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydHMgSFRNTCB0byB1bmljb2RlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNVbmljb2RlRmlsdGVyc01vZHVsZScpLmZpbHRlcignY29udmVydEh0bWxUb1VuaWNvZGUnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGh0bWwpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmVsZW1lbnQoJzxkaXY+JyArIGh0bWwgKyAnPC9kaXY+JykudGV4dCgpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIHZpZXdlciBmb3IgY3VzdG9tIHZhbHVlcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEN1c3RvbVZpZXdlcicsIFtcbiAgICAnTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoTmVzdGVkRGlyZWN0aXZlc1JlY3Vyc2lvblRpbWVvdXRQcmV2ZW50aW9uU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBjbGFzcyBvZiB0aGUgb2JqZWN0IGJlaW5nIGVkaXRlZC5cbiAgICAgICAgICAgICAgICBvYmpUeXBlOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWFfYmFzZWRfY3VzdG9tX3ZpZXdlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbXBpbGU6IE5lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UuY29tcGlsZVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIHZpZXdlciBmb3IgZGljdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMnKTtcbm9wcGlhLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWREaWN0Vmlld2VyJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gUmVhZC1vbmx5IHByb3BlcnR5LiBBbiBvYmplY3Qgd2hvc2Uga2V5cyBhbmQgdmFsdWVzIGFyZSB0aGUgZGljdFxuICAgICAgICAgICAgICAgIC8vIHByb3BlcnRpZXMgYW5kIHRoZSBjb3JyZXNwb25kaW5nIHNjaGVtYXMuXG4gICAgICAgICAgICAgICAgcHJvcGVydHlTY2hlbWFzOiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWFfYmFzZWRfZGljdF92aWV3ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb21waWxlOiBOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLmNvbXBpbGUsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldEh1bWFuUmVhZGFibGVQcm9wZXJ0eURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkuZGVzY3JpcHRpb24gfHwgJ1snICsgcHJvcGVydHkubmFtZSArICddJztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIHZpZXdlciBmb3IgSFRNTC5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZEh0bWxWaWV3ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGxvY2FsVmFsdWU6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvc2NoZW1hX3ZpZXdlcnMvJyArXG4gICAgICAgICAgICAgICAgJ3NjaGVtYV9iYXNlZF9odG1sX3ZpZXdlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJ1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgc2NoZW1hLWJhc2VkIHZpZXdlciBmb3IgbGlzdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL05lc3RlZERpcmVjdGl2ZXNSZWN1cnNpb25UaW1lb3V0UHJldmVudGlvblNlcnZpY2UudHMnKTtcbm9wcGlhLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRMaXN0Vmlld2VyJywgW1xuICAgICdOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uIChOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPScsXG4gICAgICAgICAgICAgICAgLy8gUmVhZC1vbmx5IHByb3BlcnR5LiBUaGUgc2NoZW1hIGRlZmluaXRpb24gZm9yIGVhY2ggaXRlbSBpbiB0aGUgbGlzdC5cbiAgICAgICAgICAgICAgICBpdGVtU2NoZW1hOiAnJidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWFfYmFzZWRfbGlzdF92aWV3ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb21waWxlOiBOZXN0ZWREaXJlY3RpdmVzUmVjdXJzaW9uVGltZW91dFByZXZlbnRpb25TZXJ2aWNlLmNvbXBpbGVcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBhIHNjaGVtYS1iYXNlZCB2aWV3ZXIgZm9yIHByaW1pdGl2ZSB0eXBlcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZFByaW1pdGl2ZVZpZXdlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWFfdmlld2Vycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hX2Jhc2VkX3ByaW1pdGl2ZV92aWV3ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzRXhwcmVzc2lvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuaXNTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBzY2hlbWEtYmFzZWQgdmlld2VyIGZvciB1bmljb2RlIHN0cmluZ3MuXG4gKi9cbnJlcXVpcmUoJ2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzLycgK1xuICAgICdjb252ZXJ0LXVuaWNvZGUtd2l0aC1wYXJhbXMtdG8taHRtbC5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbm9wcGlhLmRpcmVjdGl2ZSgnc2NoZW1hQmFzZWRVbmljb2RlVmlld2VyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBsb2NhbFZhbHVlOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL3NjaGVtYV92aWV3ZXJzLycgK1xuICAgICAgICAgICAgICAgICdzY2hlbWFfYmFzZWRfdW5pY29kZV92aWV3ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckZmlsdGVyJywgJyRzY2UnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRmaWx0ZXIsICRzY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmdldERpc3BsYXllZFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwoJGZpbHRlcignY29udmVydFVuaWNvZGVXaXRoUGFyYW1zVG9IdG1sJykoJHNjb3BlLmxvY2FsVmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZ2VuZXJhbCBzY2hlbWEtYmFzZWQgdmlld2Vycy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xub3BwaWEuZGlyZWN0aXZlKCdzY2hlbWFCYXNlZFZpZXdlcicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgc2NoZW1hOiAnJicsXG4gICAgICAgICAgICAgICAgbG9jYWxWYWx1ZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9mb3Jtcy9zY2hlbWFfdmlld2Vycy8nICtcbiAgICAgICAgICAgICAgICAnc2NoZW1hX2Jhc2VkX3ZpZXdlcl9kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJ1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBBbmd1bGFySHRtbEJpbmQgRGlyZWN0aXZlIChub3QgYXNzb2NpYXRlZCB3aXRoIHJldXNhYmxlXG4gKiBjb21wb25lbnRzLilcbiAqIE5COiBSZXVzYWJsZSBjb21wb25lbnQgZGlyZWN0aXZlcyBzaG91bGQgZ28gaW4gdGhlIGNvbXBvbmVudHMvIGZvbGRlci5cbiAqL1xuLy8gSFRNTCBiaW5kIGRpcmVjdGl2ZSB0aGF0IHRydXN0cyB0aGUgdmFsdWUgaXQgaXMgZ2l2ZW4gYW5kIGFsc28gZXZhbHVhdGVzXG4vLyBjdXN0b20gZGlyZWN0aXZlIHRhZ3MgaW4gdGhlIHByb3ZpZGVkIHZhbHVlLlxub3BwaWEuZGlyZWN0aXZlKCdhbmd1bGFySHRtbEJpbmQnLCBbJyRjb21waWxlJywgZnVuY3Rpb24gKCRjb21waWxlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbG0sIGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgb2xkIHNjb3BlcyBpZiB0aGUgaHRtbCBjaGFuZ2VzLlxuICAgICAgICAgICAgICAgIC8vIFJlZmVyZW5jZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQyOTI3ODE0XG4gICAgICAgICAgICAgICAgdmFyIG5ld1Njb3BlO1xuICAgICAgICAgICAgICAgIHNjb3BlLiR3YXRjaChhdHRycy5odG1sRGF0YSwgZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U2NvcGUuJGRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbG0uZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3U2NvcGUgPSBzY29wZS4kbmV3KCk7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5odG1sKG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgJGNvbXBpbGUoZWxtLmNvbnRlbnRzKCkpKG5ld1Njb3BlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1hdGhqYXhCaW5kIERpcmVjdGl2ZSAobm90IGFzc29jaWF0ZWQgd2l0aCByZXVzYWJsZVxuICogY29tcG9uZW50cy4pXG4gKiBOQjogUmV1c2FibGUgY29tcG9uZW50IGRpcmVjdGl2ZXMgc2hvdWxkIGdvIGluIHRoZSBjb21wb25lbnRzLyBmb2xkZXIuXG4gKi9cbm9wcGlhLmRpcmVjdGl2ZSgnbWF0aGpheEJpbmQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJyRlbGVtZW50JywgJyRhdHRycycsIGZ1bmN0aW9uICgkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgkYXR0cnMubWF0aGpheERhdGEsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRzY3JpcHQgPSBhbmd1bGFyLmVsZW1lbnQoJzxzY3JpcHQgdHlwZT1cIm1hdGgvdGV4XCI+JykuaHRtbCh2YWx1ZSA9PT0gdW5kZWZpbmVkID8gJycgOiB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWxlbWVudC5odG1sKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbGVtZW50LmFwcGVuZCgkc2NyaXB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGhKYXguSHViLlF1ZXVlKFsnUmVwcm9jZXNzJywgTWF0aEpheC5IdWIsICRlbGVtZW50WzBdXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9