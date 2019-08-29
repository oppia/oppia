(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_editor~story_editor"],{

/***/ "./core/templates/dev/head/base_components/BaseContentDirective.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/base_components/BaseContentDirective.ts ***!
  \*************************************************************************/
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
 * @fileoverview Directive for the Base Transclusion Component.
 */
__webpack_require__(/*! base_components/WarningLoaderDirective.ts */ "./core/templates/dev/head/base_components/WarningLoaderDirective.ts");
__webpack_require__(/*! pages/OppiaFooterDirective.ts */ "./core/templates/dev/head/pages/OppiaFooterDirective.ts");
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/stateful/BackgroundMaskService.ts */ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts");
angular.module('oppia').directive('baseContent', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            transclude: {
                breadcrumb: '?navbarBreadcrumb',
                content: 'content',
                footer: '?pageFooter',
                navOptions: '?navOptions',
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/base_components/base_content_directive.html'),
            controllerAs: '$ctrl',
            controller: ['$rootScope', 'BackgroundMaskService',
                'SidebarStatusService', 'UrlService', 'SITE_FEEDBACK_FORM_URL',
                function ($rootScope, BackgroundMaskService, SidebarStatusService, UrlService, SITE_FEEDBACK_FORM_URL) {
                    var ctrl = this;
                    ctrl.iframed = UrlService.isIframed();
                    ctrl.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;
                    ctrl.isSidebarShown = SidebarStatusService.isSidebarShown;
                    ctrl.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;
                    ctrl.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;
                    ctrl.DEV_MODE = $rootScope.DEV_MODE;
                    ctrl.skipToMainContent = function () {
                        var mainContentElement = document.getElementById('oppia-main-content');
                        if (!mainContentElement) {
                            throw Error('Variable mainContentElement is undefined.');
                        }
                        mainContentElement.tabIndex = -1;
                        mainContentElement.scrollIntoView();
                        mainContentElement.focus();
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/base_components/WarningLoaderDirective.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/base_components/WarningLoaderDirective.ts ***!
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
 * @fileoverview Directive for warning_loader.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').directive('warningLoader', [
    'UrlInterpolationService',
    function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/base_components/warning_loader_directive.html'),
            controllerAs: '$ctrl',
            controller: ['AlertsService',
                function (AlertsService) {
                    var ctrl = this;
                    ctrl.AlertsService = AlertsService;
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts ***!
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
 * @fileoverview Directive for displaying animated loading dots.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('loadingDots', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/common-elements/' +
                'loading-dots.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/editor-domain.constants.ajs.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/editor-domain.constants.ajs.ts ***!
  \******************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for editor domain.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var editor_domain_constants_1 = __webpack_require__(/*! domain/editor/editor-domain.constants */ "./core/templates/dev/head/domain/editor/editor-domain.constants.ts");
angular.module('oppia').constant('EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED', editor_domain_constants_1.EditorDomainConstants.EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED);


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/editor-domain.constants.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/editor-domain.constants.ts ***!
  \**************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for editor domain.
 */
var EditorDomainConstants = /** @class */ (function () {
    function EditorDomainConstants() {
    }
    EditorDomainConstants.EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED = 'undoRedoServiceChangeApplied';
    return EditorDomainConstants;
}());
exports.EditorDomainConstants = EditorDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts ***!
  \********************************************************************************/
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
 * @fileoverview Service which maintains a stack of changes to a domain object.
 * Changes may be undone, redone, or replaced.
 */
__webpack_require__(/*! domain/editor/editor-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/editor/editor-domain.constants.ajs.ts");
/**
 * Stores a stack of changes to a domain object. Please note that only one
 * instance of this service exists at a time, so multiple undo/redo stacks are
 * not currently supported.
 */
angular.module('oppia').factory('BaseUndoRedoService', [
    '$rootScope', 'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
    function ($rootScope, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
        var BaseUndoRedoService = {};
        this._appliedChanges = [];
        this._undoneChanges = [];
        var _dispatchMutation = function () {
            $rootScope.$broadcast(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED);
        };
        var _applyChange = function (changeObject, domainObject) {
            changeObject.applyChange(domainObject);
            _dispatchMutation();
        };
        var _reverseChange = function (changeObject, domainObject) {
            changeObject.reverseChange(domainObject);
            _dispatchMutation();
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['init'] = function () {
            /* eslint-enable dot-notation */
            this._appliedChanges = [];
            this._undoneChanges = [];
        };
        /**
         * Pushes a change domain object onto the change stack and applies it to the
         * provided domain object. When a new change is applied, all undone changes
         * are lost and cannot be redone. This will fire an event as defined by the
         * constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['applyChange'] = function (changeObject, domainObject) {
            /* eslint-enable dot-notation */
            _applyChange(changeObject, domainObject);
            this._appliedChanges.push(changeObject);
            this._undoneChanges = [];
        };
        /**
         * Undoes the last change to the provided domain object. This function
         * returns false if there are no changes to undo, and true otherwise. This
         * will fire an event as defined by the constant
         * EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['undoChange'] = function (domainObject) {
            /* eslint-enable dot-notation */
            if (this._appliedChanges.length !== 0) {
                var change = this._appliedChanges.pop();
                this._undoneChanges.push(change);
                _reverseChange(change, domainObject);
                return true;
            }
            return false;
        };
        /**
         * Reverses an undo for the given domain object. This function returns false
         * if there are no changes to redo, and true if otherwise. This will fire an
         * event as defined by the constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['redoChange'] = function (domainObject) {
            /* eslint-enable dot-notation */
            if (this._undoneChanges.length !== 0) {
                var change = this._undoneChanges.pop();
                this._appliedChanges.push(change);
                _applyChange(change, domainObject);
                return true;
            }
            return false;
        };
        /**
         * Returns the current list of changes applied to the provided domain
         * object. This list will not contain undone actions. Changes to the
         * returned list will not be reflected in this service.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['getChangeList'] = function () {
            /* eslint-enable dot-notation */
            // TODO(bhenning): Consider integrating something like Immutable.js to
            // avoid the slice here and ensure the returned object is truly an
            // immutable copy.
            return this._appliedChanges.slice();
        };
        /**
         * Returns a list of commit dict updates representing all chosen changes in
         * this service. Changes to the returned list will not affect this service.
         * Furthermore, the returned list is ready to be sent to the backend.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['getCommittableChangeList'] = function () {
            /* eslint-enable dot-notation */
            var committableChangeList = [];
            for (var i = 0; i < this._appliedChanges.length; i++) {
                committableChangeList[i] =
                    this._appliedChanges[i].getBackendChangeObject();
            }
            return committableChangeList;
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['setChangeList'] = function (changeList) {
            /* eslint-enable dot-notation */
            this._appliedChanges = angular.copy(changeList);
        };
        /**
         * Returns the number of changes that have been applied to the domain
         * object.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['getChangeCount'] = function () {
            /* eslint-enable dot-notation */
            return this._appliedChanges.length;
        };
        /**
         * Returns whether this service has any applied changes.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['hasChanges'] = function () {
            /* eslint-enable dot-notation */
            return this._appliedChanges.length !== 0;
        };
        /**
         * Clears the change history. This does not reverse any of the changes
         * applied from applyChange() or redoChange(). This will fire an event as
         * defined by the constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
         */
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['clearChanges'] = function () {
            /* eslint-enable dot-notation */
            this._appliedChanges = [];
            this._undoneChanges = [];
            _dispatchMutation();
        };
        return BaseUndoRedoService;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts ***!
  \********************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend change
 * domain objects. This frontend object represents both CollectionChange and
 * ExplorationChange backend domain objects.
 */
// TODO(bhenning): Consolidate the backend ExplorationChange and
// CollectionChange domain objects.
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var Change = /** @class */ (function () {
    function Change(backendChangeObject, applyChangeToObject, reverseChangeToObject) {
        this._backendChangeObject = cloneDeep_1.default(backendChangeObject);
        this._applyChangeToObject = applyChangeToObject;
        this._reverseChangeToObject = reverseChangeToObject;
    }
    // Returns the JSON object which represents a backend python dict of this
    // change. Changes to this object are not reflected in this domain object.
    // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
    // throughout) has been kept as 'any' because 'backendChangeObject' is a
    // dict with possible underscore_cased keys which give tslint errors
    // against underscore_casing in favor of camelCasing. Also,
    // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
    // return type depends upon the arguments passed to the constructor.
    Change.prototype.getBackendChangeObject = function () {
        return cloneDeep_1.default(this._backendChangeObject);
    };
    // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
    // throughout) has been kept as 'any' because 'backendChangeObject' is a
    // dict with possible underscore_cased keys which give tslint errors
    // against underscore_casing in favor of camelCasing. Also,
    // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
    // return type depends upon the arguments passed to the constructor.
    Change.prototype.setBackendChangeObject = function (backendChangeObject) {
        return this._backendChangeObject = cloneDeep_1.default(backendChangeObject);
    };
    // Applies this change to the related object (such as a frontend collection
    // domain object).
    // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
    // throughout) has been kept as 'any' because 'backendChangeObject' is a
    // dict with possible underscore_cased keys which give tslint errors
    // against underscore_casing in favor of camelCasing. Also,
    // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
    // return type depends upon the arguments passed to the constructor.
    Change.prototype.applyChange = function (domainObject) {
        this._applyChangeToObject(this._backendChangeObject, domainObject);
    };
    // Reverse-applies this change to the related object (such as a frontend
    // collection domain object). This method should only be used to reverse a
    // change that was previously applied by calling the applyChange() method.
    // TODO(#7176): Replace 'any' with the exact type. This (and elsewhere
    // throughout) has been kept as 'any' because 'backendChangeObject' is a
    // dict with possible underscore_cased keys which give tslint errors
    // against underscore_casing in favor of camelCasing. Also,
    // 'applyChangeToObject' and 'reverseChangeToObject' are functions whose
    // return type depends upon the arguments passed to the constructor.
    Change.prototype.reverseChange = function (domainObject) {
        this._reverseChangeToObject(this._backendChangeObject, domainObject);
    };
    return Change;
}());
exports.Change = Change;
var ChangeObjectFactory = /** @class */ (function () {
    function ChangeObjectFactory() {
    }
    // Static class methods. Note that "this" is not available in static
    // contexts. The first parameter is a JSON representation of a backend
    // python dict for the given change. The second parameter is a callback
    // which will receive both the backend change object dictionary (as
    // read-only) and the domain object in which to apply the change. The third
    // parameter is a callback which behaves in the same way as the second
    // parameter and takes the same inputs, except it should reverse the change
    // for the provided domain object.
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'backendChangeObject' is a dict with possible
    // underscore_cased keys which give tslint errors against underscore_casing
    // in favor of camelCasing. Also, 'applyChangeToObject' and
    // 'reverseChangeToObject' are functions whose return type depends upon the
    // arguments passed to the constructor.
    ChangeObjectFactory.prototype.create = function (backendChangeObject, applyChangeToObject, reverseChangeToObject) {
        return new Change(backendChangeObject, applyChangeToObject, reverseChangeToObject);
    };
    ChangeObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ChangeObjectFactory);
    return ChangeObjectFactory;
}());
exports.ChangeObjectFactory = ChangeObjectFactory;
angular.module('oppia').factory('ChangeObjectFactory', static_1.downgradeInjectable(ChangeObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Undo Redo Service.
 */
__webpack_require__(/*! domain/editor/undo_redo/BaseUndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts");
angular.module('oppia').factory('UndoRedoService', [
    'BaseUndoRedoService', function (BaseUndoRedoService) {
        var child = Object.create(BaseUndoRedoService);
        child.init();
        return child;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/OppiaFooterDirective.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/pages/OppiaFooterDirective.ts ***!
  \***************************************************************/
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
 * @fileoverview Directive for the footer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('oppiaFooter', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/oppia_footer_directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () { }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/interaction-specs.constants.ajs.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/pages/interaction-specs.constants.ajs.ts ***!
  \**************************************************************************/
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
 * @fileoverview Constant file for the INTERACTION_SPECS constant.
 */
var INTERACTION_SPECS = __webpack_require__(/*! interactions/interaction_specs.json */ "./extensions/interactions/interaction_specs.json");
angular.module('oppia').constant('INTERACTION_SPECS', INTERACTION_SPECS);


/***/ }),

/***/ "./extensions/interactions/interaction_specs.json":
/*!********************************************************!*\
  !*** ./extensions/interactions/interaction_specs.json ***!
  \********************************************************/
/*! exports provided: ImageClickInput, NumberWithUnits, NumericInput, DragAndDropSortInput, ItemSelectionInput, Continue, GraphInput, EndExploration, SetInput, CodeRepl, LogicProof, MultipleChoiceInput, PencilCodeEditor, TextInput, InteractiveMap, MusicNotesInput, MathExpressionInput, FractionInput, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"ImageClickInput\":{\"can_have_solution\":false,\"show_generic_submit_button\":false,\"instructions\":\"Click on the image\",\"is_trainable\":false,\"narrow_instructions\":\"View image\",\"description\":\"Allows learners to click on regions of an image.\",\"needs_summary\":false,\"name\":\"Image Region\",\"answer_type\":\"ClickOnImage\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"ImageClickInput\",\"customization_arg_specs\":[{\"description\":\"Image\",\"name\":\"imageAndRegions\",\"schema\":{\"obj_type\":\"ImageWithRegions\",\"type\":\"custom\"},\"default_value\":{\"imagePath\":\"\",\"labeledRegions\":[]}},{\"description\":\"Highlight regions when the learner hovers over them\",\"name\":\"highlightRegionsOnHover\",\"schema\":{\"type\":\"bool\"},\"default_value\":false}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"IsInRegion\":\"is in the region {{x|UnicodeString}}\"}},\"NumberWithUnits\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to enter number with units.\",\"needs_summary\":false,\"name\":\"Number With Units\",\"answer_type\":\"NumberWithUnits\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"NumberWithUnits\",\"customization_arg_specs\":[],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"IsEqualTo\":\"is equal to {{f|NumberWithUnits}}\",\"IsEquivalentTo\":\"is equivalent to {{f|NumberWithUnits}}\"}},\"NumericInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to enter integers and floating point numbers.\",\"needs_summary\":false,\"name\":\"Number Input\",\"answer_type\":\"Real\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"NumericInput\",\"customization_arg_specs\":[],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"Equals\":\"is equal to {{x|Real}}\",\"IsGreaterThanOrEqualTo\":\"is greater than or equal to {{x|Real}}\",\"IsLessThanOrEqualTo\":\"is less than or equal to {{x|Real}}\",\"IsLessThan\":\"is less than {{x|Real}}\",\"IsWithinTolerance\":\"is within {{tol|Real}} of {{x|Real}}\",\"IsGreaterThan\":\"is greater than {{x|Real}}\",\"IsInclusivelyBetween\":\"is between {{a|Real}} and {{b|Real}}, inclusive\"}},\"DragAndDropSortInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":\"Drag and drop items\",\"is_trainable\":false,\"narrow_instructions\":\"Drag and drop items\",\"description\":\"Allows learners to drag and drop items for sorting.\",\"needs_summary\":true,\"name\":\"Drag And Drop Sort\",\"answer_type\":\"ListOfSetsOfHtmlStrings\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"DragAndDropSortInput\",\"customization_arg_specs\":[{\"description\":\"Items for drag and drop\",\"name\":\"choices\",\"schema\":{\"items\":{\"type\":\"html\",\"ui_config\":{\"hide_complex_extensions\":true,\"placeholder\":\"Enter an option for the learner to drag and drop.\"}},\"type\":\"list\",\"validators\":[{\"min_value\":1,\"id\":\"has_length_at_least\"}],\"ui_config\":{\"add_element_text\":\"Add a new item\"}},\"default_value\":[\"\"]},{\"description\":\"Allow multiple sort items in the same position\",\"name\":\"allowMultipleItemsInSamePosition\",\"schema\":{\"type\":\"bool\"},\"default_value\":false}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"HasElementXAtPositionY\":\"has element {{x|DragAndDropHtmlString}} at position {{y|DragAndDropPositiveInt}}\",\"IsEqualToOrdering\":\"is equal to ordering {{x|ListOfSetsOfHtmlStrings}}\",\"HasElementXBeforeElementY\":\"has element {{x|DragAndDropHtmlString}} before element {{y|DragAndDropHtmlString}}\",\"IsEqualToOrderingWithOneItemAtIncorrectPosition\":\"is equal to ordering with one item at incorrect position {{x|ListOfSetsOfHtmlStrings}}\"}},\"ItemSelectionInput\":{\"can_have_solution\":false,\"show_generic_submit_button\":false,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to select various options.\",\"needs_summary\":false,\"name\":\"Item Selection\",\"answer_type\":\"SetOfHtmlString\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"ItemSelectionInput\",\"customization_arg_specs\":[{\"description\":\"Minimum number of selections permitted.\",\"name\":\"minAllowableSelectionCount\",\"schema\":{\"type\":\"int\",\"validators\":[{\"min_value\":0,\"id\":\"is_at_least\"}]},\"default_value\":1},{\"description\":\"Maximum number of selections permitted\",\"name\":\"maxAllowableSelectionCount\",\"schema\":{\"type\":\"int\",\"validators\":[{\"min_value\":1,\"id\":\"is_at_least\"}]},\"default_value\":1},{\"description\":\"Items for selection\",\"name\":\"choices\",\"schema\":{\"items\":{\"type\":\"html\",\"ui_config\":{\"hide_complex_extensions\":true,\"placeholder\":\"Sample item answer\"}},\"type\":\"list\",\"ui_config\":{\"add_element_text\":\"Add item for selection\"}},\"default_value\":[\"\"]}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"DoesNotContainAtLeastOneOf\":\"omits at least one of {{x|SetOfHtmlString}}\",\"IsProperSubsetOf\":\"is a proper subset of {{x|SetOfHtmlString}}\",\"ContainsAtLeastOneOf\":\"contains at least one of {{x|SetOfHtmlString}}\",\"Equals\":\"is equal to {{x|SetOfHtmlString}}\"}},\"Continue\":{\"can_have_solution\":false,\"show_generic_submit_button\":false,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"A simple 'go to next state' button.\",\"needs_summary\":false,\"name\":\"Continue Button\",\"answer_type\":null,\"is_linear\":true,\"display_mode\":\"inline\",\"id\":\"Continue\",\"customization_arg_specs\":[{\"description\":\"Button label\",\"name\":\"buttonText\",\"schema\":{\"type\":\"unicode\"},\"default_value\":\"Continue\"}],\"is_terminal\":false,\"default_outcome_heading\":\"When the button is clicked\",\"rule_descriptions\":{}},\"GraphInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":\"Create a graph\",\"is_trainable\":false,\"narrow_instructions\":\"View graph\",\"description\":\"Allows learners to create and manipulate graphs.\",\"needs_summary\":true,\"name\":\"Graph Theory\",\"answer_type\":\"Graph\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"GraphInput\",\"customization_arg_specs\":[{\"description\":\"Initial graph\",\"name\":\"graph\",\"schema\":{\"obj_type\":\"Graph\",\"type\":\"custom\"},\"default_value\":{\"isWeighted\":false,\"edges\":[{\"src\":0,\"dst\":1,\"weight\":1},{\"src\":1,\"dst\":2,\"weight\":1}],\"isDirected\":false,\"vertices\":[{\"x\":150,\"y\":50,\"label\":\"\"},{\"x\":200,\"y\":50,\"label\":\"\"},{\"x\":150,\"y\":100,\"label\":\"\"}],\"isLabeled\":false}},{\"description\":\"Allow learner to add vertices\",\"name\":\"canAddVertex\",\"schema\":{\"type\":\"bool\"},\"default_value\":false},{\"description\":\"Allow learner to delete vertices\",\"name\":\"canDeleteVertex\",\"schema\":{\"type\":\"bool\"},\"default_value\":false},{\"description\":\"Allow learner to move vertices\",\"name\":\"canMoveVertex\",\"schema\":{\"type\":\"bool\"},\"default_value\":true},{\"description\":\"Allow learner to edit vertex labels\",\"name\":\"canEditVertexLabel\",\"schema\":{\"type\":\"bool\"},\"default_value\":false},{\"description\":\"Allow learner to add edges\",\"name\":\"canAddEdge\",\"schema\":{\"type\":\"bool\"},\"default_value\":true},{\"description\":\"Allow learner to delete edges\",\"name\":\"canDeleteEdge\",\"schema\":{\"type\":\"bool\"},\"default_value\":true},{\"description\":\"Allow learner to edit edge weights\",\"name\":\"canEditEdgeWeight\",\"schema\":{\"type\":\"bool\"},\"default_value\":false}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"IsIsomorphicTo\":\"is isomorphic to {{g|Graph}}, including matching labels\"}},\"EndExploration\":{\"can_have_solution\":false,\"show_generic_submit_button\":false,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Ends the exploration, and suggests recommendations for explorations to try next.\",\"needs_summary\":false,\"name\":\"End Exploration\",\"answer_type\":null,\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"EndExploration\",\"customization_arg_specs\":[{\"description\":\"IDs of explorations to recommend to the learner (at most 3 are shown). The ID of an exploration is the string of characters appearing after '/explore/' in the URL bar.\",\"name\":\"recommendedExplorationIds\",\"schema\":{\"items\":{\"type\":\"unicode\"},\"type\":\"list\",\"ui_config\":{\"add_element_text\":\"Add exploration ID\"}},\"default_value\":[]}],\"is_terminal\":true,\"default_outcome_heading\":null,\"rule_descriptions\":{}},\"SetInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to enter an unordered set of strings.\",\"needs_summary\":false,\"name\":\"Set Input\",\"answer_type\":\"SetOfUnicodeString\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"SetInput\",\"customization_arg_specs\":[],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"HasElementsNotIn\":\"has elements not in {{x|SetOfUnicodeString}}\",\"Equals\":\"is equal to {{x|SetOfUnicodeString}}\",\"IsSupersetOf\":\"is a proper superset of {{x|SetOfUnicodeString}}\",\"OmitsElementsIn\":\"omits some elements of {{x|SetOfUnicodeString}}\",\"HasElementsIn\":\"has elements in common with {{x|SetOfUnicodeString}}\",\"IsSubsetOf\":\"is a proper subset of {{x|SetOfUnicodeString}}\",\"IsDisjointFrom\":\"has no elements in common with {{x|SetOfUnicodeString}}\"}},\"CodeRepl\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":\"Type code in the editor\",\"is_trainable\":true,\"narrow_instructions\":\"Go to code editor\",\"description\":\"Allows learners to enter code and get it evaluated.\",\"needs_summary\":true,\"name\":\"Code Editor\",\"answer_type\":\"CodeEvaluation\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"CodeRepl\",\"customization_arg_specs\":[{\"description\":\"Programming language\",\"name\":\"language\",\"schema\":{\"type\":\"unicode\",\"choices\":[\"python\"]},\"default_value\":\"python\"},{\"description\":\"Initial code displayed\",\"name\":\"placeholder\",\"schema\":{\"type\":\"unicode\",\"ui_config\":{\"coding_mode\":\"none\"}},\"default_value\":\"# Type your code here.\"},{\"description\":\"Code to prepend to the learner's submission\",\"name\":\"preCode\",\"schema\":{\"type\":\"unicode\",\"ui_config\":{\"coding_mode\":\"none\"}},\"default_value\":\"\"},{\"description\":\"Code to append after the learner's submission\",\"name\":\"postCode\",\"schema\":{\"type\":\"unicode\",\"ui_config\":{\"coding_mode\":\"none\"}},\"default_value\":\"\"}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"OutputEquals\":\"has output equal to {{x|CodeString}}\",\"CodeContains\":\"has code that contains {{x|CodeString}}\",\"CodeEquals\":\"has code equal to {{x|CodeString}}\",\"ResultsInError\":\"results in an error when run\",\"ErrorContains\":\"has error message that contains {{x|UnicodeString}}\",\"OutputContains\":\"has output that contains {{x|CodeString}}\",\"CodeDoesNotContain\":\"has code that does not contain {{x|CodeString}}\"}},\"LogicProof\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":\"Construct a proof\",\"is_trainable\":false,\"narrow_instructions\":\"Construct a proof\",\"description\":\"Allows learners to write proofs for simple logical statements.\",\"needs_summary\":true,\"name\":\"Logic Proof\",\"answer_type\":\"CheckedProof\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"LogicProof\",\"customization_arg_specs\":[{\"description\":\"Question to ask\",\"name\":\"question\",\"schema\":{\"obj_type\":\"LogicQuestion\",\"type\":\"custom\"},\"default_value\":{\"assumptions\":[{\"arguments\":[],\"top_kind_name\":\"variable\",\"dummies\":[],\"top_operator_name\":\"p\"}],\"results\":[{\"arguments\":[],\"top_kind_name\":\"variable\",\"dummies\":[],\"top_operator_name\":\"p\"}],\"default_proof_string\":\"\"}}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"Correct\":\"is correct\",\"NotCorrect\":\"is not correct\",\"NotCorrectByCategory\":\"is not correct due to {{c|LogicErrorCategory}}\"}},\"MultipleChoiceInput\":{\"can_have_solution\":false,\"show_generic_submit_button\":false,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to select one of a list of multiple-choice options.\",\"needs_summary\":false,\"name\":\"Multiple Choice\",\"answer_type\":\"NonnegativeInt\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"MultipleChoiceInput\",\"customization_arg_specs\":[{\"description\":\"Multiple Choice options\",\"name\":\"choices\",\"schema\":{\"items\":{\"type\":\"html\",\"ui_config\":{\"hide_complex_extensions\":true,\"placeholder\":\"Enter an option for the learner to select\"}},\"type\":\"list\",\"validators\":[{\"min_value\":1,\"id\":\"has_length_at_least\"}],\"ui_config\":{\"add_element_text\":\"Add multiple choice option\"}},\"default_value\":[\"\"]}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"Equals\":\"is equal to {{x|NonnegativeInt}}\"}},\"PencilCodeEditor\":{\"can_have_solution\":true,\"show_generic_submit_button\":false,\"instructions\":\"Edit the code. Click 'Play' to check it!\",\"is_trainable\":false,\"narrow_instructions\":\"Show code editor\",\"description\":\"Allows learners to edit code in Pencil Code.\",\"needs_summary\":true,\"name\":\"Pencil Code Editor\",\"answer_type\":\"CodeEvaluation\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"PencilCodeEditor\",\"customization_arg_specs\":[{\"description\":\"The initial code\",\"name\":\"initial_code\",\"schema\":{\"type\":\"unicode\",\"ui_config\":{\"coding_mode\":\"coffeescript\"}},\"default_value\":\"# Add the initial code snippet here.\"}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"OutputEquals\":\"has output equal to {{x|CodeString}}\",\"CodeContains\":\"has code that contains {{x|CodeString}}\",\"CodeEquals\":\"has code equal to {{x|CodeString}}\",\"ResultsInError\":\"results in an error when run\",\"ErrorContains\":\"has error message that contains {{x|UnicodeString}}\",\"OutputRoughlyEquals\":\"has output equal to {{x|CodeString}}, ignoring spacing and case\",\"CodeDoesNotContain\":\"has code that does not contain {{x|CodeString}}\"}},\"TextInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":null,\"is_trainable\":true,\"narrow_instructions\":null,\"description\":\"Allows learners to enter arbitrary text strings.\",\"needs_summary\":false,\"name\":\"Text Input\",\"answer_type\":\"NormalizedString\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"TextInput\",\"customization_arg_specs\":[{\"description\":\"Placeholder text (optional)\",\"name\":\"placeholder\",\"schema\":{\"type\":\"unicode\"},\"default_value\":\"\"},{\"description\":\"Height (in rows)\",\"name\":\"rows\",\"schema\":{\"type\":\"int\",\"validators\":[{\"min_value\":1,\"id\":\"is_at_least\"},{\"max_value\":200,\"id\":\"is_at_most\"}]},\"default_value\":1}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"StartsWith\":\"starts with {{x|NormalizedString}}\",\"Contains\":\"contains {{x|NormalizedString}}\",\"Equals\":\"is equal to {{x|NormalizedString}}\",\"CaseSensitiveEquals\":\"is equal to {{x|NormalizedString}}, taking case into account\",\"FuzzyEquals\":\"is equal to {{x|NormalizedString}}, misspelled by at most one character\"}},\"InteractiveMap\":{\"can_have_solution\":false,\"show_generic_submit_button\":false,\"instructions\":\"Click on the map\",\"is_trainable\":false,\"narrow_instructions\":\"View map\",\"description\":\"Allows learners to specify a position on a world map.\",\"needs_summary\":true,\"name\":\"World Map\",\"answer_type\":\"CoordTwoDim\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"InteractiveMap\",\"customization_arg_specs\":[{\"description\":\"Starting center latitude (-90 to 90)\",\"name\":\"latitude\",\"schema\":{\"type\":\"float\",\"validators\":[{\"min_value\":-90,\"id\":\"is_at_least\"},{\"max_value\":90,\"id\":\"is_at_most\"}]},\"default_value\":0},{\"description\":\"Starting center longitude (-180 to 180)\",\"name\":\"longitude\",\"schema\":{\"type\":\"float\",\"validators\":[{\"min_value\":-180,\"id\":\"is_at_least\"},{\"max_value\":180,\"id\":\"is_at_most\"}]},\"default_value\":0},{\"description\":\"Starting zoom level (0 shows the entire earth)\",\"name\":\"zoom\",\"schema\":{\"type\":\"float\"},\"default_value\":0}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"Within\":\"is within {{d|Real}} km of {{p|CoordTwoDim}}\",\"NotWithin\":\"is not within {{d|Real}} km of {{p|CoordTwoDim}}\"}},\"MusicNotesInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":\"Drag notes to the staff to form a sequence\",\"is_trainable\":false,\"narrow_instructions\":\"Show music staff\",\"description\":\"Allows learners to drag and drop notes onto the lines of a music staff.\",\"needs_summary\":true,\"name\":\"Music Notes Input\",\"answer_type\":\"MusicPhrase\",\"is_linear\":false,\"display_mode\":\"supplemental\",\"id\":\"MusicNotesInput\",\"customization_arg_specs\":[{\"description\":\"Correct sequence of notes\",\"name\":\"sequenceToGuess\",\"schema\":{\"obj_type\":\"MusicPhrase\",\"type\":\"custom\"},\"default_value\":[]},{\"description\":\"Starting notes on the staff\",\"name\":\"initialSequence\",\"schema\":{\"obj_type\":\"MusicPhrase\",\"type\":\"custom\"},\"default_value\":[]}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"Equals\":\"is equal to {{x|MusicPhrase}}\",\"IsEqualToExceptFor\":\"is equal to {{x|MusicPhrase}} except for {{k|NonnegativeInt}} notes\",\"IsTranspositionOfExceptFor\":\"is a transposition of {{x|MusicPhrase}} by {{y|Int}} semitones except for {{k|NonnegativeInt}} notes\",\"IsLongerThan\":\"has more than {{k|NonnegativeInt}} notes\",\"IsTranspositionOf\":\"is a transposition of {{x|MusicPhrase}} by {{y|Int}} semitones\",\"HasLengthInclusivelyBetween\":\"has between {{a|NonnegativeInt}} and {{b|NonnegativeInt}} notes, inclusive\"}},\"MathExpressionInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to enter mathematical expressions.\",\"needs_summary\":false,\"name\":\"Math Expression Input\",\"answer_type\":\"MathExpression\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"MathExpressionInput\",\"customization_arg_specs\":[],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"IsMathematicallyEquivalentTo\":\"is mathematically equivalent to (LaTeX) {{x|UnicodeString}}\"}},\"FractionInput\":{\"can_have_solution\":true,\"show_generic_submit_button\":true,\"instructions\":null,\"is_trainable\":false,\"narrow_instructions\":null,\"description\":\"Allows learners to enter integers and fractions.\",\"needs_summary\":false,\"name\":\"Fraction Input\",\"answer_type\":\"Fraction\",\"is_linear\":false,\"display_mode\":\"inline\",\"id\":\"FractionInput\",\"customization_arg_specs\":[{\"description\":\"Require the learner's answer to be in simplest form\",\"name\":\"requireSimplestForm\",\"schema\":{\"type\":\"bool\"},\"default_value\":false},{\"description\":\"Allow improper fractions in the learner's answer\",\"name\":\"allowImproperFraction\",\"schema\":{\"type\":\"bool\"},\"default_value\":true},{\"description\":\"Allow the answer to contain an integer part\",\"name\":\"allowNonzeroIntegerPart\",\"schema\":{\"type\":\"bool\"},\"default_value\":true},{\"description\":\"Custom placeholder text (optional)\",\"name\":\"customPlaceholder\",\"schema\":{\"type\":\"unicode\"},\"default_value\":\"\"}],\"is_terminal\":false,\"default_outcome_heading\":null,\"rule_descriptions\":{\"HasNoFractionalPart\":\"has no fractional part\",\"HasFractionalPartExactlyEqualTo\":\"has fractional part exactly equal to {{f|Fraction}}\",\"IsEquivalentToAndInSimplestForm\":\"is equivalent to {{f|Fraction}} and in simplest form\",\"IsExactlyEqualTo\":\"exactly matches {{f|Fraction}}\",\"HasNumeratorEqualTo\":\"has numerator equal to {{x|Int}}\",\"IsLessThan\":\"is less than {{f|Fraction}}\",\"IsGreaterThan\":\"is greater than {{f|Fraction}}\",\"HasIntegerPartEqualTo\":\"has integer part equal to {{x|Int}}\",\"IsEquivalentTo\":\"is equivalent to {{f|Fraction}}\",\"HasDenominatorEqualTo\":\"has denominator equal to {{x|NonnegativeInt}}\"}}}");

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9iYXNlX2NvbXBvbmVudHMvQmFzZUNvbnRlbnREaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvYmFzZV9jb21wb25lbnRzL1dhcm5pbmdMb2FkZXJEaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvY29tbW9uLWVsZW1lbnRzL2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2VkaXRvci9lZGl0b3ItZG9tYWluLmNvbnN0YW50cy5hanMudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2VkaXRvci9lZGl0b3ItZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZWRpdG9yL3VuZG9fcmVkby9CYXNlVW5kb1JlZG9TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL0NoYW5nZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2ludGVyYWN0aW9uLXNwZWNzLmNvbnN0YW50cy5hanMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHNIQUEyQztBQUNuRCxtQkFBTyxDQUFDLDhGQUErQjtBQUN2QyxtQkFBTyxDQUFDLGdIQUF3QztBQUNoRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNHQUFtQztBQUMzQyxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsc0ZBQTJCO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsRUFBRTtBQUN4QztBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0MsbUJBQU8sQ0FBQyxpSEFBdUM7QUFDL0U7Ozs7Ozs7Ozs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7Ozs7Ozs7Ozs7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw0SEFBOEM7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGlDQUFpQztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsbUJBQU8sQ0FBQyw0REFBa0I7QUFDNUQsZUFBZSxtQkFBTyxDQUFDLDhGQUF5QjtBQUNoRCxhQUFhLG1CQUFPLENBQUMsaUVBQWU7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOzs7Ozs7Ozs7Ozs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLG1CQUFPLENBQUMsNkZBQXFDO0FBQ3JFIiwiZmlsZSI6ImNvbGxlY3Rpb25fZWRpdG9yfnN0b3J5X2VkaXRvci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIEJhc2UgVHJhbnNjbHVzaW9uIENvbXBvbmVudC5cbiAqL1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL1dhcm5pbmdMb2FkZXJEaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL09wcGlhRm9vdGVyRGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc2lkZWJhci9TaWRlYmFyU3RhdHVzU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9CYWNrZ3JvdW5kTWFza1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnYmFzZUNvbnRlbnQnLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IHtcbiAgICAgICAgICAgICAgICBicmVhZGNydW1iOiAnP25hdmJhckJyZWFkY3J1bWInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdjb250ZW50JyxcbiAgICAgICAgICAgICAgICBmb290ZXI6ICc/cGFnZUZvb3RlcicsXG4gICAgICAgICAgICAgICAgbmF2T3B0aW9uczogJz9uYXZPcHRpb25zJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9iYXNlX2NvbXBvbmVudHMvYmFzZV9jb250ZW50X2RpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRyb290U2NvcGUnLCAnQmFja2dyb3VuZE1hc2tTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2lkZWJhclN0YXR1c1NlcnZpY2UnLCAnVXJsU2VydmljZScsICdTSVRFX0ZFRURCQUNLX0ZPUk1fVVJMJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQmFja2dyb3VuZE1hc2tTZXJ2aWNlLCBTaWRlYmFyU3RhdHVzU2VydmljZSwgVXJsU2VydmljZSwgU0lURV9GRUVEQkFDS19GT1JNX1VSTCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaWZyYW1lZCA9IFVybFNlcnZpY2UuaXNJZnJhbWVkKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2l0ZUZlZWRiYWNrRm9ybVVybCA9IFNJVEVfRkVFREJBQ0tfRk9STV9VUkw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTaWRlYmFyU2hvd24gPSBTaWRlYmFyU3RhdHVzU2VydmljZS5pc1NpZGViYXJTaG93bjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZVNpZGViYXJPblN3aXBlID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuY2xvc2VTaWRlYmFyO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzQmFja2dyb3VuZE1hc2tBY3RpdmUgPSBCYWNrZ3JvdW5kTWFza1NlcnZpY2UuaXNNYXNrQWN0aXZlO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkRFVl9NT0RFID0gJHJvb3RTY29wZS5ERVZfTU9ERTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5za2lwVG9NYWluQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYWluQ29udGVudEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BwaWEtbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1haW5Db250ZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdWYXJpYWJsZSBtYWluQ29udGVudEVsZW1lbnQgaXMgdW5kZWZpbmVkLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB3YXJuaW5nX2xvYWRlci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCd3YXJuaW5nTG9hZGVyJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9iYXNlX2NvbXBvbmVudHMvd2FybmluZ19sb2FkZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnQWxlcnRzU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKEFsZXJ0c1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFsZXJ0c1NlcnZpY2UgPSBBbGVydHNTZXJ2aWNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBkaXNwbGF5aW5nIGFuaW1hdGVkIGxvYWRpbmcgZG90cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdsb2FkaW5nRG90cycsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1lbGVtZW50cy8nICtcbiAgICAgICAgICAgICAgICAnbG9hZGluZy1kb3RzLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIGVkaXRvciBkb21haW4uXG4gKi9cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBlZGl0b3JfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9lZGl0b3IvZWRpdG9yLWRvbWFpbi5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQnLCBlZGl0b3JfZG9tYWluX2NvbnN0YW50c18xLkVkaXRvckRvbWFpbkNvbnN0YW50cy5FVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgZWRpdG9yIGRvbWFpbi5cbiAqL1xudmFyIEVkaXRvckRvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFZGl0b3JEb21haW5Db25zdGFudHMoKSB7XG4gICAgfVxuICAgIEVkaXRvckRvbWFpbkNvbnN0YW50cy5FVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCA9ICd1bmRvUmVkb1NlcnZpY2VDaGFuZ2VBcHBsaWVkJztcbiAgICByZXR1cm4gRWRpdG9yRG9tYWluQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuRWRpdG9yRG9tYWluQ29uc3RhbnRzID0gRWRpdG9yRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHdoaWNoIG1haW50YWlucyBhIHN0YWNrIG9mIGNoYW5nZXMgdG8gYSBkb21haW4gb2JqZWN0LlxuICogQ2hhbmdlcyBtYXkgYmUgdW5kb25lLCByZWRvbmUsIG9yIHJlcGxhY2VkLlxuICovXG5yZXF1aXJlKCdkb21haW4vZWRpdG9yL2VkaXRvci1kb21haW4uY29uc3RhbnRzLmFqcy50cycpO1xuLyoqXG4gKiBTdG9yZXMgYSBzdGFjayBvZiBjaGFuZ2VzIHRvIGEgZG9tYWluIG9iamVjdC4gUGxlYXNlIG5vdGUgdGhhdCBvbmx5IG9uZVxuICogaW5zdGFuY2Ugb2YgdGhpcyBzZXJ2aWNlIGV4aXN0cyBhdCBhIHRpbWUsIHNvIG11bHRpcGxlIHVuZG8vcmVkbyBzdGFja3MgYXJlXG4gKiBub3QgY3VycmVudGx5IHN1cHBvcnRlZC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQmFzZVVuZG9SZWRvU2VydmljZScsIFtcbiAgICAnJHJvb3RTY29wZScsICdFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCcsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEVWRU5UX1VORE9fUkVET19TRVJWSUNFX0NIQU5HRV9BUFBMSUVEKSB7XG4gICAgICAgIHZhciBCYXNlVW5kb1JlZG9TZXJ2aWNlID0ge307XG4gICAgICAgIHRoaXMuX2FwcGxpZWRDaGFuZ2VzID0gW107XG4gICAgICAgIHRoaXMuX3VuZG9uZUNoYW5nZXMgPSBbXTtcbiAgICAgICAgdmFyIF9kaXNwYXRjaE11dGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1VORE9fUkVET19TRVJWSUNFX0NIQU5HRV9BUFBMSUVEKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9hcHBseUNoYW5nZSA9IGZ1bmN0aW9uIChjaGFuZ2VPYmplY3QsIGRvbWFpbk9iamVjdCkge1xuICAgICAgICAgICAgY2hhbmdlT2JqZWN0LmFwcGx5Q2hhbmdlKGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICBfZGlzcGF0Y2hNdXRhdGlvbigpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3JldmVyc2VDaGFuZ2UgPSBmdW5jdGlvbiAoY2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpIHtcbiAgICAgICAgICAgIGNoYW5nZU9iamVjdC5yZXZlcnNlQ2hhbmdlKGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICBfZGlzcGF0Y2hNdXRhdGlvbigpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydpbml0J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3VuZG9uZUNoYW5nZXMgPSBbXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFB1c2hlcyBhIGNoYW5nZSBkb21haW4gb2JqZWN0IG9udG8gdGhlIGNoYW5nZSBzdGFjayBhbmQgYXBwbGllcyBpdCB0byB0aGVcbiAgICAgICAgICogcHJvdmlkZWQgZG9tYWluIG9iamVjdC4gV2hlbiBhIG5ldyBjaGFuZ2UgaXMgYXBwbGllZCwgYWxsIHVuZG9uZSBjaGFuZ2VzXG4gICAgICAgICAqIGFyZSBsb3N0IGFuZCBjYW5ub3QgYmUgcmVkb25lLiBUaGlzIHdpbGwgZmlyZSBhbiBldmVudCBhcyBkZWZpbmVkIGJ5IHRoZVxuICAgICAgICAgKiBjb25zdGFudCBFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRC5cbiAgICAgICAgICovXG4gICAgICAgIC8vIFRPRE8oYW5raXRhMjQwNzk2KTogUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEJhc2VVbmRvUmVkb1NlcnZpY2VbJ2FwcGx5Q2hhbmdlJ10gPSBmdW5jdGlvbiAoY2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICBfYXBwbHlDaGFuZ2UoY2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpO1xuICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXMucHVzaChjaGFuZ2VPYmplY3QpO1xuICAgICAgICAgICAgdGhpcy5fdW5kb25lQ2hhbmdlcyA9IFtdO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVW5kb2VzIHRoZSBsYXN0IGNoYW5nZSB0byB0aGUgcHJvdmlkZWQgZG9tYWluIG9iamVjdC4gVGhpcyBmdW5jdGlvblxuICAgICAgICAgKiByZXR1cm5zIGZhbHNlIGlmIHRoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIHVuZG8sIGFuZCB0cnVlIG90aGVyd2lzZS4gVGhpc1xuICAgICAgICAgKiB3aWxsIGZpcmUgYW4gZXZlbnQgYXMgZGVmaW5lZCBieSB0aGUgY29uc3RhbnRcbiAgICAgICAgICogRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWyd1bmRvQ2hhbmdlJ10gPSBmdW5jdGlvbiAoZG9tYWluT2JqZWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FwcGxpZWRDaGFuZ2VzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjaGFuZ2UgPSB0aGlzLl9hcHBsaWVkQ2hhbmdlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl91bmRvbmVDaGFuZ2VzLnB1c2goY2hhbmdlKTtcbiAgICAgICAgICAgICAgICBfcmV2ZXJzZUNoYW5nZShjaGFuZ2UsIGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXZlcnNlcyBhbiB1bmRvIGZvciB0aGUgZ2l2ZW4gZG9tYWluIG9iamVjdC4gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGZhbHNlXG4gICAgICAgICAqIGlmIHRoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIHJlZG8sIGFuZCB0cnVlIGlmIG90aGVyd2lzZS4gVGhpcyB3aWxsIGZpcmUgYW5cbiAgICAgICAgICogZXZlbnQgYXMgZGVmaW5lZCBieSB0aGUgY29uc3RhbnQgRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydyZWRvQ2hhbmdlJ10gPSBmdW5jdGlvbiAoZG9tYWluT2JqZWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VuZG9uZUNoYW5nZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoYW5nZSA9IHRoaXMuX3VuZG9uZUNoYW5nZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXMucHVzaChjaGFuZ2UpO1xuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShjaGFuZ2UsIGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGxpc3Qgb2YgY2hhbmdlcyBhcHBsaWVkIHRvIHRoZSBwcm92aWRlZCBkb21haW5cbiAgICAgICAgICogb2JqZWN0LiBUaGlzIGxpc3Qgd2lsbCBub3QgY29udGFpbiB1bmRvbmUgYWN0aW9ucy4gQ2hhbmdlcyB0byB0aGVcbiAgICAgICAgICogcmV0dXJuZWQgbGlzdCB3aWxsIG5vdCBiZSByZWZsZWN0ZWQgaW4gdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVE9ETyhhbmtpdGEyNDA3OTYpOiBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQmFzZVVuZG9SZWRvU2VydmljZVsnZ2V0Q2hhbmdlTGlzdCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBDb25zaWRlciBpbnRlZ3JhdGluZyBzb21ldGhpbmcgbGlrZSBJbW11dGFibGUuanMgdG9cbiAgICAgICAgICAgIC8vIGF2b2lkIHRoZSBzbGljZSBoZXJlIGFuZCBlbnN1cmUgdGhlIHJldHVybmVkIG9iamVjdCBpcyB0cnVseSBhblxuICAgICAgICAgICAgLy8gaW1tdXRhYmxlIGNvcHkuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXBwbGllZENoYW5nZXMuc2xpY2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGNvbW1pdCBkaWN0IHVwZGF0ZXMgcmVwcmVzZW50aW5nIGFsbCBjaG9zZW4gY2hhbmdlcyBpblxuICAgICAgICAgKiB0aGlzIHNlcnZpY2UuIENoYW5nZXMgdG8gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBub3QgYWZmZWN0IHRoaXMgc2VydmljZS5cbiAgICAgICAgICogRnVydGhlcm1vcmUsIHRoZSByZXR1cm5lZCBsaXN0IGlzIHJlYWR5IHRvIGJlIHNlbnQgdG8gdGhlIGJhY2tlbmQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydnZXRDb21taXR0YWJsZUNoYW5nZUxpc3QnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgY29tbWl0dGFibGVDaGFuZ2VMaXN0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2FwcGxpZWRDaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29tbWl0dGFibGVDaGFuZ2VMaXN0W2ldID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXNbaV0uZ2V0QmFja2VuZENoYW5nZU9iamVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbW1pdHRhYmxlQ2hhbmdlTGlzdDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyhhbmtpdGEyNDA3OTYpOiBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQmFzZVVuZG9SZWRvU2VydmljZVsnc2V0Q2hhbmdlTGlzdCddID0gZnVuY3Rpb24gKGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB0aGlzLl9hcHBsaWVkQ2hhbmdlcyA9IGFuZ3VsYXIuY29weShjaGFuZ2VMaXN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBjaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdG8gdGhlIGRvbWFpblxuICAgICAgICAgKiBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydnZXRDaGFuZ2VDb3VudCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcHBsaWVkQ2hhbmdlcy5sZW5ndGg7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzZXJ2aWNlIGhhcyBhbnkgYXBwbGllZCBjaGFuZ2VzLlxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVE9ETyhhbmtpdGEyNDA3OTYpOiBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQmFzZVVuZG9SZWRvU2VydmljZVsnaGFzQ2hhbmdlcyddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcHBsaWVkQ2hhbmdlcy5sZW5ndGggIT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGVhcnMgdGhlIGNoYW5nZSBoaXN0b3J5LiBUaGlzIGRvZXMgbm90IHJldmVyc2UgYW55IG9mIHRoZSBjaGFuZ2VzXG4gICAgICAgICAqIGFwcGxpZWQgZnJvbSBhcHBseUNoYW5nZSgpIG9yIHJlZG9DaGFuZ2UoKS4gVGhpcyB3aWxsIGZpcmUgYW4gZXZlbnQgYXNcbiAgICAgICAgICogZGVmaW5lZCBieSB0aGUgY29uc3RhbnQgRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydjbGVhckNoYW5nZXMnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB0aGlzLl9hcHBsaWVkQ2hhbmdlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fdW5kb25lQ2hhbmdlcyA9IFtdO1xuICAgICAgICAgICAgX2Rpc3BhdGNoTXV0YXRpb24oKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEJhc2VVbmRvUmVkb1NlcnZpY2U7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmQgY2hhbmdlXG4gKiBkb21haW4gb2JqZWN0cy4gVGhpcyBmcm9udGVuZCBvYmplY3QgcmVwcmVzZW50cyBib3RoIENvbGxlY3Rpb25DaGFuZ2UgYW5kXG4gKiBFeHBsb3JhdGlvbkNoYW5nZSBiYWNrZW5kIGRvbWFpbiBvYmplY3RzLlxuICovXG4vLyBUT0RPKGJoZW5uaW5nKTogQ29uc29saWRhdGUgdGhlIGJhY2tlbmQgRXhwbG9yYXRpb25DaGFuZ2UgYW5kXG4vLyBDb2xsZWN0aW9uQ2hhbmdlIGRvbWFpbiBvYmplY3RzLlxudmFyIGNsb25lRGVlcF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJsb2Rhc2gvY2xvbmVEZWVwXCIpKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBDaGFuZ2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2hhbmdlKGJhY2tlbmRDaGFuZ2VPYmplY3QsIGFwcGx5Q2hhbmdlVG9PYmplY3QsIHJldmVyc2VDaGFuZ2VUb09iamVjdCkge1xuICAgICAgICB0aGlzLl9iYWNrZW5kQ2hhbmdlT2JqZWN0ID0gY2xvbmVEZWVwXzEuZGVmYXVsdChiYWNrZW5kQ2hhbmdlT2JqZWN0KTtcbiAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VUb09iamVjdCA9IGFwcGx5Q2hhbmdlVG9PYmplY3Q7XG4gICAgICAgIHRoaXMuX3JldmVyc2VDaGFuZ2VUb09iamVjdCA9IHJldmVyc2VDaGFuZ2VUb09iamVjdDtcbiAgICB9XG4gICAgLy8gUmV0dXJucyB0aGUgSlNPTiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGJhY2tlbmQgcHl0aG9uIGRpY3Qgb2YgdGhpc1xuICAgIC8vIGNoYW5nZS4gQ2hhbmdlcyB0byB0aGlzIG9iamVjdCBhcmUgbm90IHJlZmxlY3RlZCBpbiB0aGlzIGRvbWFpbiBvYmplY3QuXG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyAoYW5kIGVsc2V3aGVyZVxuICAgIC8vIHRocm91Z2hvdXQpIGhhcyBiZWVuIGtlcHQgYXMgJ2FueScgYmVjYXVzZSAnYmFja2VuZENoYW5nZU9iamVjdCcgaXMgYVxuICAgIC8vIGRpY3Qgd2l0aCBwb3NzaWJsZSB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzXG4gICAgLy8gYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy4gQWxzbyxcbiAgICAvLyAnYXBwbHlDaGFuZ2VUb09iamVjdCcgYW5kICdyZXZlcnNlQ2hhbmdlVG9PYmplY3QnIGFyZSBmdW5jdGlvbnMgd2hvc2VcbiAgICAvLyByZXR1cm4gdHlwZSBkZXBlbmRzIHVwb24gdGhlIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgIENoYW5nZS5wcm90b3R5cGUuZ2V0QmFja2VuZENoYW5nZU9iamVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNsb25lRGVlcF8xLmRlZmF1bHQodGhpcy5fYmFja2VuZENoYW5nZU9iamVjdCk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIChhbmQgZWxzZXdoZXJlXG4gICAgLy8gdGhyb3VnaG91dCkgaGFzIGJlZW4ga2VwdCBhcyAnYW55JyBiZWNhdXNlICdiYWNrZW5kQ2hhbmdlT2JqZWN0JyBpcyBhXG4gICAgLy8gZGljdCB3aXRoIHBvc3NpYmxlIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnNcbiAgICAvLyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLiBBbHNvLFxuICAgIC8vICdhcHBseUNoYW5nZVRvT2JqZWN0JyBhbmQgJ3JldmVyc2VDaGFuZ2VUb09iamVjdCcgYXJlIGZ1bmN0aW9ucyB3aG9zZVxuICAgIC8vIHJldHVybiB0eXBlIGRlcGVuZHMgdXBvbiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IuXG4gICAgQ2hhbmdlLnByb3RvdHlwZS5zZXRCYWNrZW5kQ2hhbmdlT2JqZWN0ID0gZnVuY3Rpb24gKGJhY2tlbmRDaGFuZ2VPYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JhY2tlbmRDaGFuZ2VPYmplY3QgPSBjbG9uZURlZXBfMS5kZWZhdWx0KGJhY2tlbmRDaGFuZ2VPYmplY3QpO1xuICAgIH07XG4gICAgLy8gQXBwbGllcyB0aGlzIGNoYW5nZSB0byB0aGUgcmVsYXRlZCBvYmplY3QgKHN1Y2ggYXMgYSBmcm9udGVuZCBjb2xsZWN0aW9uXG4gICAgLy8gZG9tYWluIG9iamVjdCkuXG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyAoYW5kIGVsc2V3aGVyZVxuICAgIC8vIHRocm91Z2hvdXQpIGhhcyBiZWVuIGtlcHQgYXMgJ2FueScgYmVjYXVzZSAnYmFja2VuZENoYW5nZU9iamVjdCcgaXMgYVxuICAgIC8vIGRpY3Qgd2l0aCBwb3NzaWJsZSB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzXG4gICAgLy8gYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy4gQWxzbyxcbiAgICAvLyAnYXBwbHlDaGFuZ2VUb09iamVjdCcgYW5kICdyZXZlcnNlQ2hhbmdlVG9PYmplY3QnIGFyZSBmdW5jdGlvbnMgd2hvc2VcbiAgICAvLyByZXR1cm4gdHlwZSBkZXBlbmRzIHVwb24gdGhlIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgIENoYW5nZS5wcm90b3R5cGUuYXBwbHlDaGFuZ2UgPSBmdW5jdGlvbiAoZG9tYWluT2JqZWN0KSB7XG4gICAgICAgIHRoaXMuX2FwcGx5Q2hhbmdlVG9PYmplY3QodGhpcy5fYmFja2VuZENoYW5nZU9iamVjdCwgZG9tYWluT2JqZWN0KTtcbiAgICB9O1xuICAgIC8vIFJldmVyc2UtYXBwbGllcyB0aGlzIGNoYW5nZSB0byB0aGUgcmVsYXRlZCBvYmplY3QgKHN1Y2ggYXMgYSBmcm9udGVuZFxuICAgIC8vIGNvbGxlY3Rpb24gZG9tYWluIG9iamVjdCkuIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIHVzZWQgdG8gcmV2ZXJzZSBhXG4gICAgLy8gY2hhbmdlIHRoYXQgd2FzIHByZXZpb3VzbHkgYXBwbGllZCBieSBjYWxsaW5nIHRoZSBhcHBseUNoYW5nZSgpIG1ldGhvZC5cbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIChhbmQgZWxzZXdoZXJlXG4gICAgLy8gdGhyb3VnaG91dCkgaGFzIGJlZW4ga2VwdCBhcyAnYW55JyBiZWNhdXNlICdiYWNrZW5kQ2hhbmdlT2JqZWN0JyBpcyBhXG4gICAgLy8gZGljdCB3aXRoIHBvc3NpYmxlIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnNcbiAgICAvLyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLiBBbHNvLFxuICAgIC8vICdhcHBseUNoYW5nZVRvT2JqZWN0JyBhbmQgJ3JldmVyc2VDaGFuZ2VUb09iamVjdCcgYXJlIGZ1bmN0aW9ucyB3aG9zZVxuICAgIC8vIHJldHVybiB0eXBlIGRlcGVuZHMgdXBvbiB0aGUgYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IuXG4gICAgQ2hhbmdlLnByb3RvdHlwZS5yZXZlcnNlQ2hhbmdlID0gZnVuY3Rpb24gKGRvbWFpbk9iamVjdCkge1xuICAgICAgICB0aGlzLl9yZXZlcnNlQ2hhbmdlVG9PYmplY3QodGhpcy5fYmFja2VuZENoYW5nZU9iamVjdCwgZG9tYWluT2JqZWN0KTtcbiAgICB9O1xuICAgIHJldHVybiBDaGFuZ2U7XG59KCkpO1xuZXhwb3J0cy5DaGFuZ2UgPSBDaGFuZ2U7XG52YXIgQ2hhbmdlT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDaGFuZ2VPYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW4gc3RhdGljXG4gICAgLy8gY29udGV4dHMuIFRoZSBmaXJzdCBwYXJhbWV0ZXIgaXMgYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIGEgYmFja2VuZFxuICAgIC8vIHB5dGhvbiBkaWN0IGZvciB0aGUgZ2l2ZW4gY2hhbmdlLiBUaGUgc2Vjb25kIHBhcmFtZXRlciBpcyBhIGNhbGxiYWNrXG4gICAgLy8gd2hpY2ggd2lsbCByZWNlaXZlIGJvdGggdGhlIGJhY2tlbmQgY2hhbmdlIG9iamVjdCBkaWN0aW9uYXJ5IChhc1xuICAgIC8vIHJlYWQtb25seSkgYW5kIHRoZSBkb21haW4gb2JqZWN0IGluIHdoaWNoIHRvIGFwcGx5IHRoZSBjaGFuZ2UuIFRoZSB0aGlyZFxuICAgIC8vIHBhcmFtZXRlciBpcyBhIGNhbGxiYWNrIHdoaWNoIGJlaGF2ZXMgaW4gdGhlIHNhbWUgd2F5IGFzIHRoZSBzZWNvbmRcbiAgICAvLyBwYXJhbWV0ZXIgYW5kIHRha2VzIHRoZSBzYW1lIGlucHV0cywgZXhjZXB0IGl0IHNob3VsZCByZXZlcnNlIHRoZSBjaGFuZ2VcbiAgICAvLyBmb3IgdGhlIHByb3ZpZGVkIGRvbWFpbiBvYmplY3QuXG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnYmFja2VuZENoYW5nZU9iamVjdCcgaXMgYSBkaWN0IHdpdGggcG9zc2libGVcbiAgICAvLyB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmdcbiAgICAvLyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy4gQWxzbywgJ2FwcGx5Q2hhbmdlVG9PYmplY3QnIGFuZFxuICAgIC8vICdyZXZlcnNlQ2hhbmdlVG9PYmplY3QnIGFyZSBmdW5jdGlvbnMgd2hvc2UgcmV0dXJuIHR5cGUgZGVwZW5kcyB1cG9uIHRoZVxuICAgIC8vIGFyZ3VtZW50cyBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yLlxuICAgIENoYW5nZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChiYWNrZW5kQ2hhbmdlT2JqZWN0LCBhcHBseUNoYW5nZVRvT2JqZWN0LCByZXZlcnNlQ2hhbmdlVG9PYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaGFuZ2UoYmFja2VuZENoYW5nZU9iamVjdCwgYXBwbHlDaGFuZ2VUb09iamVjdCwgcmV2ZXJzZUNoYW5nZVRvT2JqZWN0KTtcbiAgICB9O1xuICAgIENoYW5nZU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgQ2hhbmdlT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIENoYW5nZU9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5DaGFuZ2VPYmplY3RGYWN0b3J5ID0gQ2hhbmdlT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NoYW5nZU9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKENoYW5nZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVW5kbyBSZWRvIFNlcnZpY2UuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL0Jhc2VVbmRvUmVkb1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1VuZG9SZWRvU2VydmljZScsIFtcbiAgICAnQmFzZVVuZG9SZWRvU2VydmljZScsIGZ1bmN0aW9uIChCYXNlVW5kb1JlZG9TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IE9iamVjdC5jcmVhdGUoQmFzZVVuZG9SZWRvU2VydmljZSk7XG4gICAgICAgIGNoaWxkLmluaXQoKTtcbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnb3BwaWFGb290ZXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9vcHBpYV9mb290ZXJfZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnQgZmlsZSBmb3IgdGhlIElOVEVSQUNUSU9OX1NQRUNTIGNvbnN0YW50LlxuICovXG52YXIgSU5URVJBQ1RJT05fU1BFQ1MgPSByZXF1aXJlKCdpbnRlcmFjdGlvbnMvaW50ZXJhY3Rpb25fc3BlY3MuanNvbicpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0lOVEVSQUNUSU9OX1NQRUNTJywgSU5URVJBQ1RJT05fU1BFQ1MpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==