/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"collection_editor": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.scripts.ts","vendors~about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboar~7856c05a","vendors~admin~collection_editor~collection_player~creator_dashboard~exploration_editor~exploration_p~7f8bcc67","vendors~admin~collection_editor~creator_dashboard~exploration_editor~exploration_player~practice_ses~988cfeb1","about~admin~collection_editor~collection_player~community_dashboard~contact~creator_dashboard~donate~e06a4a17","collection_editor~story_editor","collection_editor~collection_player","admin~collection_editor","collection_editor~topic_viewer"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts ***!
  \********************************************************************************************************/
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
/**
 * @fileoverview Directive for the select2 autocomplete component.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('select2Dropdown', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        // Directive for incorporating select2 dropdowns.
        return {
            restrict: 'E',
            scope: {
                // Whether to allow multiple choices. In order to do so, the value of
                // this attribute must be the exact string 'true'.
                allowMultipleChoices: '@',
                choices: '=',
                // An additional CSS class to add to the select2 dropdown. May be
                // undefined.
                dropdownCssClass: '@',
                // A function that formats a new selection. May be undefined.
                formatNewSelection: '=',
                // The message shown when an invalid search term is entered. May be
                // undefined, in which case this defaults to 'No matches found'.
                invalidSearchTermMessage: '@',
                item: '=',
                // The regex used to validate newly-entered choices that do not
                // already exist. If it is undefined then all new choices are rejected.
                newChoiceRegex: '@',
                onSelectionChange: '&',
                placeholder: '@',
                width: '@'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/custom-forms-directives/' +
                'select2-dropdown.directive.html'),
            controller: ['$scope', '$element', function ($scope, $element) {
                    $scope.newChoiceValidator = new RegExp($scope.newChoiceRegex);
                    var select2Options = {
                        allowClear: false,
                        data: $scope.choices,
                        multiple: $scope.allowMultipleChoices === 'true',
                        tags: $scope.newChoiceRegex !== undefined,
                        placeholder: $scope.placeholder,
                        width: $scope.width || '250px',
                        dropdownCssClass: null,
                        createTag: function (params) {
                            return params.term.match($scope.newChoiceValidator) ? {
                                id: params.term,
                                text: params.term
                            } : null;
                        },
                        templateResult: function (queryResult) {
                            var doesChoiceMatchText = function (choice) {
                                return choice.id === queryResult.text;
                            };
                            if ($scope.choices && $scope.choices.some(doesChoiceMatchText)) {
                                return queryResult.text;
                            }
                            else {
                                if ($scope.formatNewSelection) {
                                    return $scope.formatNewSelection(queryResult.text);
                                }
                                else {
                                    return queryResult.text;
                                }
                            }
                        },
                        language: {
                            noResults: function () {
                                if ($scope.invalidSearchTermMessage) {
                                    return $scope.invalidSearchTermMessage;
                                }
                                else {
                                    return 'No matches found';
                                }
                            }
                        }
                    };
                    if ($scope.dropdownCssClass) {
                        select2Options.dropdownCssClass = $scope.dropdownCssClass;
                    }
                    var select2Node = $element[0].firstChild;
                    // Initialize the dropdown.
                    $(select2Node).select2(select2Options);
                    $(select2Node).val($scope.item).trigger('change');
                    // Update $scope.item when the selection changes.
                    $(select2Node).on('change', function () {
                        $scope.item = $(select2Node).val();
                        $scope.$apply();
                        $scope.onSelectionChange();
                    });
                    // Respond to external changes in $scope.item
                    $scope.$watch('item', function (newValue) {
                        $(select2Node).val(newValue);
                    });
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/state-editor/state-editor-properties-services/state-editor.service.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state-editor/state-editor-properties-services/state-editor.service.ts ***!
  \******************************************************************************************************************/
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview A service that maintains a record of the objects exclusive to
 * a state.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var solution_validity_service_1 = __webpack_require__(/*! pages/exploration-editor-page/editor-tab/services/solution-validity.service */ "./core/templates/dev/head/pages/exploration-editor-page/editor-tab/services/solution-validity.service.ts");
/* eslint-enable max-len */
var StateEditorService = /** @class */ (function () {
    function StateEditorService(solutionValidityService) {
        this.solutionValidityService = solutionValidityService;
        this.activeStateName = null;
        this.stateNames = [];
        this.correctnessFeedbackEnabled = null;
        this.inQuestionMode = null;
        // Currently, the only place where this is used in the state editor
        // is in solution verification. So, once the interaction is set in this
        // service, the given solutions would be automatically verified for the set
        // interaction.
        // TODO(#7165): Replace 'any' with the exact type. This has been kept as
        // 'any' because the return type is a interaction domain object which can be
        // typed once InteractionObjectFactory is upgraded.
        this.interaction = null;
        this.misconceptionsBySkill = {};
        this.explorationIsWhitelisted = false;
        this.solicitAnswerDetails = null;
    }
    StateEditorService.prototype.getActiveStateName = function () {
        return this.activeStateName;
    };
    StateEditorService.prototype.setActiveStateName = function (newActiveStateName) {
        if (newActiveStateName === '' || newActiveStateName === null) {
            console.error('Invalid active state name: ' + newActiveStateName);
            return;
        }
        this.activeStateName = newActiveStateName;
    };
    StateEditorService.prototype.isExplorationWhitelisted = function () {
        return this.explorationIsWhitelisted;
    };
    StateEditorService.prototype.updateExplorationWhitelistedStatus = function (value) {
        this.explorationIsWhitelisted = value;
    };
    StateEditorService.prototype.setMisconceptionsBySkill = function (newMisconceptionsBySkill) {
        this.misconceptionsBySkill = newMisconceptionsBySkill;
    };
    StateEditorService.prototype.getMisconceptionsBySkill = function () {
        return this.misconceptionsBySkill;
    };
    StateEditorService.prototype.setInteraction = function (newInteraction) {
        this.interaction = newInteraction;
    };
    StateEditorService.prototype.setInteractionId = function (newId) {
        this.interaction.setId(newId);
    };
    StateEditorService.prototype.setInteractionAnswerGroups = function (newAnswerGroups) {
        this.interaction.setAnswerGroups(newAnswerGroups);
    };
    StateEditorService.prototype.setInteractionDefaultOutcome = function (newOutcome) {
        this.interaction.setDefaultOutcome(newOutcome);
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'newArgs' is a dict with underscore_cased keys which
    // give tslint errors against underscore_casing in favor of camelCasing.
    StateEditorService.prototype.setInteractionCustomizationArgs = function (newArgs) {
        this.interaction.setCustomizationArgs(newArgs);
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'solution' is a solution domain object which can be typed
    // once SolutionObjectFactory is upgraded.
    StateEditorService.prototype.setInteractionSolution = function (solution) {
        this.interaction.setSolution(solution);
    };
    StateEditorService.prototype.setInteractionHints = function (hints) {
        this.interaction.setHints(hints);
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a interaction domain object which can be
    // typed once InteractionObjectFactory is upgraded.
    StateEditorService.prototype.getInteraction = function () {
        return cloneDeep_1.default(this.interaction);
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'customizationArgs' is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    StateEditorService.prototype.getAnswerChoices = function (interactionId, customizationArgs) {
        if (!interactionId) {
            return null;
        }
        // Special cases for multiple choice input and image click input.
        if (interactionId === 'MultipleChoiceInput') {
            return customizationArgs.choices.value.map(function (val, ind) {
                return {
                    val: ind,
                    label: val
                };
            });
        }
        else if (interactionId === 'ImageClickInput') {
            var _answerChoices = [];
            var imageWithRegions = customizationArgs.imageAndRegions.value;
            for (var j = 0; j < imageWithRegions.labeledRegions.length; j++) {
                _answerChoices.push({
                    val: imageWithRegions.labeledRegions[j].label,
                    label: imageWithRegions.labeledRegions[j].label
                });
            }
            return _answerChoices;
        }
        else if (interactionId === 'ItemSelectionInput' ||
            interactionId === 'DragAndDropSortInput') {
            return customizationArgs.choices.value.map(function (val) {
                return {
                    val: val,
                    label: val
                };
            });
        }
        else {
            return null;
        }
    };
    StateEditorService.prototype.setInQuestionMode = function (newModeValue) {
        this.inQuestionMode = newModeValue;
    };
    StateEditorService.prototype.isInQuestionMode = function () {
        return this.inQuestionMode;
    };
    StateEditorService.prototype.setCorrectnessFeedbackEnabled = function (newCorrectnessFeedbackEnabled) {
        this.correctnessFeedbackEnabled = newCorrectnessFeedbackEnabled;
    };
    StateEditorService.prototype.getCorrectnessFeedbackEnabled = function () {
        return this.correctnessFeedbackEnabled;
    };
    StateEditorService.prototype.setSolicitAnswerDetails = function (newSolicitAnswerDetails) {
        this.solicitAnswerDetails = newSolicitAnswerDetails;
    };
    StateEditorService.prototype.getSolicitAnswerDetails = function () {
        return this.solicitAnswerDetails;
    };
    StateEditorService.prototype.setStateNames = function (newStateNames) {
        this.stateNames = newStateNames;
    };
    StateEditorService.prototype.getStateNames = function () {
        return this.stateNames;
    };
    StateEditorService.prototype.isCurrentSolutionValid = function () {
        return this.solutionValidityService.isSolutionValid(this.activeStateName);
    };
    StateEditorService.prototype.deleteCurrentSolutionValidity = function () {
        this.solutionValidityService.deleteSolutionValidity(this.activeStateName);
    };
    var _a;
    StateEditorService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof solution_validity_service_1.SolutionValidityService !== "undefined" && solution_validity_service_1.SolutionValidityService) === "function" ? _a : Object])
    ], StateEditorService);
    return StateEditorService;
}());
exports.StateEditorService = StateEditorService;
angular.module('oppia').factory('StateEditorService', static_1.downgradeInjectable(StateEditorService));


/***/ }),

/***/ "./core/templates/dev/head/domain/classifier/AnswerClassificationResultObjectFactory.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/classifier/AnswerClassificationResultObjectFactory.ts ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of answer
 *     Classification Result domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var AnswerClassificationResult = /** @class */ (function () {
    function AnswerClassificationResult(outcome, answerGroupIndex, ruleIndex, classificationCategorization) {
        this.outcome = outcome;
        this.answerGroupIndex = answerGroupIndex;
        this.ruleIndex = ruleIndex;
        this.classificationCategorization = classificationCategorization;
    }
    return AnswerClassificationResult;
}());
exports.AnswerClassificationResult = AnswerClassificationResult;
var AnswerClassificationResultObjectFactory = /** @class */ (function () {
    function AnswerClassificationResultObjectFactory() {
    }
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'outcome' is an outcome domain object and this can be
    // directly typed to 'Outcome' type once 'OutcomeObjectFactory' is upgraded.
    AnswerClassificationResultObjectFactory.prototype.createNew = function (outcome, answerGroupIndex, ruleIndex, classificationCategorization) {
        return new AnswerClassificationResult(outcome, answerGroupIndex, ruleIndex, classificationCategorization);
    };
    AnswerClassificationResultObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], AnswerClassificationResultObjectFactory);
    return AnswerClassificationResultObjectFactory;
}());
exports.AnswerClassificationResultObjectFactory = AnswerClassificationResultObjectFactory;
angular.module('oppia').factory('AnswerClassificationResultObjectFactory', static_1.downgradeInjectable(AnswerClassificationResultObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/classifier/ClassifierObjectFactory.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/classifier/ClassifierObjectFactory.ts ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Classifier
 *     domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var Classifier = /** @class */ (function () {
    function Classifier(algorithmId, classifierData, dataSchemaVersion) {
        this.algorithmId = algorithmId;
        this.classifierData = classifierData;
        this.dataSchemaVersion = dataSchemaVersion;
    }
    return Classifier;
}());
exports.Classifier = Classifier;
var ClassifierObjectFactory = /** @class */ (function () {
    function ClassifierObjectFactory() {
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'classifierData' is a dict with underscore_cased keys which
    // give tslint errors against underscore_casing in favor of camelCasing.
    ClassifierObjectFactory.prototype.create = function (algorithmId, classifierData, dataSchemaVersion) {
        return new Classifier(algorithmId, classifierData, dataSchemaVersion);
    };
    ClassifierObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ClassifierObjectFactory);
    return ClassifierObjectFactory;
}());
exports.ClassifierObjectFactory = ClassifierObjectFactory;
angular.module('oppia').factory('ClassifierObjectFactory', static_1.downgradeInjectable(ClassifierObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts ***!
  \****************************************************************************************/
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
 * @fileoverview Service to change the rights of collections in the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').factory('CollectionRightsBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'COLLECTION_RIGHTS_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, COLLECTION_RIGHTS_URL_TEMPLATE) {
        // Maps previously loaded collection rights to their IDs.
        var collectionRightsCache = {};
        var _fetchCollectionRights = function (collectionId, successCallback, errorCallback) {
            var collectionRightsUrl = UrlInterpolationService.interpolateUrl(COLLECTION_RIGHTS_URL_TEMPLATE, {
                collection_id: collectionId
            });
            $http.get(collectionRightsUrl).then(function (response) {
                if (successCallback) {
                    successCallback(response.data);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _setCollectionStatus = function (collectionId, collectionVersion, isPublic, successCallback, errorCallback) {
            var collectionPublishUrl = UrlInterpolationService.interpolateUrl('/collection_editor_handler/publish/<collection_id>', {
                collection_id: collectionId
            });
            var collectionUnpublishUrl = UrlInterpolationService.interpolateUrl('/collection_editor_handler/unpublish/<collection_id>', {
                collection_id: collectionId
            });
            var putParams = {
                version: collectionVersion
            };
            var requestUrl = (isPublic ? collectionPublishUrl : collectionUnpublishUrl);
            $http.put(requestUrl, putParams).then(function (response) {
                collectionRightsCache[collectionId] = response.data;
                if (successCallback) {
                    successCallback(response.data);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _isCached = function (collectionId) {
            return collectionRightsCache.hasOwnProperty(collectionId);
        };
        return {
            /**
             * Gets a collection's rights, given its ID.
             */
            fetchCollectionRights: function (collectionId) {
                return $q(function (resolve, reject) {
                    _fetchCollectionRights(collectionId, resolve, reject);
                });
            },
            /**
             * Behaves exactly as fetchCollectionRights (including callback
             * behavior and returning a promise object), except this function will
             * attempt to see whether the given collection rights has been
             * cached. If it has not yet been cached, it will fetch the collection
             * rights from the backend. If it successfully retrieves the collection
             * rights from the backend, it will store it in the cache to avoid
             * requests from the backend in further function calls.
             */
            loadCollectionRights: function (collectionId) {
                return $q(function (resolve, reject) {
                    if (_isCached(collectionId)) {
                        if (resolve) {
                            resolve(collectionRightsCache[collectionId]);
                        }
                    }
                    else {
                        _fetchCollectionRights(collectionId, function (collectionRights) {
                            // Save the fetched collection rights to avoid future fetches.
                            collectionRightsCache[collectionId] = collectionRights;
                            if (resolve) {
                                resolve(collectionRightsCache[collectionId]);
                            }
                        }, reject);
                    }
                });
            },
            /**
             * Returns whether the given collection rights is stored within the
             * local data cache or if it needs to be retrieved from the backend
             * upon a laod.
             */
            isCached: function (collectionId) {
                return _isCached(collectionId);
            },
            /**
             * Replaces the current collection rights in the cache given by the
             * specified collection ID with a new collection rights object.
             */
            cacheCollectionRights: function (collectionId, collectionRights) {
                collectionRightsCache[collectionId] = angular.copy(collectionRights);
            },
            /**
             * Updates a collection's rights to be have public learner access, given
             * its ID and version.
             */
            setCollectionPublic: function (collectionId, collectionVersion) {
                return $q(function (resolve, reject) {
                    _setCollectionStatus(collectionId, collectionVersion, true, resolve, reject);
                });
            },
            /**
             * Updates a collection's rights to be have private learner access,
             * given its ID and version.
             */
            setCollectionPrivate: function (collectionId, collectionVersion) {
                return $q(function (resolve, reject) {
                    _setCollectionStatus(collectionId, collectionVersion, false, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionRightsObjectFactory.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionRightsObjectFactory.ts ***!
  \************************************************************************************/
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection rights domain objects.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var CollectionRights = /** @class */ (function () {
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionRightsObject' is a dict with
    // underscore_cased keys which give tslint errors against underscore_casing
    // in favor of camelCasing.
    function CollectionRights(collectionRightsObject) {
        this._collectionId = collectionRightsObject.collection_id;
        this._canEdit = collectionRightsObject.can_edit;
        this._canUnpublish = collectionRightsObject.can_unpublish;
        this._isPrivate = collectionRightsObject.is_private;
        this._ownerNames = collectionRightsObject.owner_names;
    }
    CollectionRights.prototype.getCollectionId = function () {
        return this._collectionId;
    };
    // Returns true if the the user can edit the collection. This property is
    // immutable.
    CollectionRights.prototype.canEdit = function () {
        return this._canEdit;
    };
    // Returns true if the user can unpublish the collection.
    CollectionRights.prototype.canUnpublish = function () {
        return this._canUnpublish;
    };
    // Returns true if the collection is private.
    CollectionRights.prototype.isPrivate = function () {
        return this._isPrivate;
    };
    // Returns true if the collection is public.
    CollectionRights.prototype.isPublic = function () {
        return !this._isPrivate;
    };
    // Sets isPrivate to false only if the user can edit the corresponding
    // collection.
    CollectionRights.prototype.setPublic = function () {
        if (this.canEdit()) {
            this._isPrivate = false;
        }
        else {
            throw new Error('User is not allowed to edit this collection.');
        }
    };
    // Sets isPrivate to true only if canUnpublish and canEdit are both true.
    CollectionRights.prototype.setPrivate = function () {
        if (this.canEdit() && this.canUnpublish()) {
            this._isPrivate = true;
        }
        else {
            throw new Error('User is not allowed to unpublish this collection.');
        }
    };
    // Returns the owner names of the collection. This property is immutable.
    CollectionRights.prototype.getOwnerNames = function () {
        return cloneDeep_1.default(this._ownerNames);
    };
    // Returns the reference to the internal ownerNames array; this function is
    // only meant to be used for Angular bindings and should never be used in
    // code. Please use getOwnerNames() and related functions, instead. Please
    // also be aware this exposes internal state of the collection rights domain
    // object, so changes to the array itself may internally break the domain
    // object.
    CollectionRights.prototype.getBindableOwnerNames = function () {
        return this._ownerNames;
    };
    // Reassigns all values within this collection to match the existing
    // collection rights. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this collection rights.
    // Note that the collection nodes within this collection will be completely
    // redefined as copies from the specified collection rights
    CollectionRights.prototype.copyFromCollectionRights = function (otherCollectionRights) {
        this._collectionId = otherCollectionRights.getCollectionId();
        this._canEdit = otherCollectionRights.canEdit();
        this._isPrivate = otherCollectionRights.isPrivate();
        this._canUnpublish = otherCollectionRights.canUnpublish();
        this._ownerNames = otherCollectionRights.getOwnerNames();
    };
    return CollectionRights;
}());
exports.CollectionRights = CollectionRights;
var CollectionRightsObjectFactory = /** @class */ (function () {
    function CollectionRightsObjectFactory() {
    }
    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection python dict.
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'collectionRightsBackendObject' is a dict with
    // underscore_cased keys which give tslint errors against underscore_casing
    // in favor of camelCasing.
    CollectionRightsObjectFactory.prototype.create = function (collectionRightsBackendObject) {
        return new CollectionRights(cloneDeep_1.default(collectionRightsBackendObject));
    };
    // Create a new, empty collection rights object. This is not guaranteed to
    // pass validation tests.
    CollectionRightsObjectFactory.prototype.createEmptyCollectionRights = function () {
        return new CollectionRights({
            owner_names: []
        });
    };
    CollectionRightsObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], CollectionRightsObjectFactory);
    return CollectionRightsObjectFactory;
}());
exports.CollectionRightsObjectFactory = CollectionRightsObjectFactory;
angular.module('oppia').factory('CollectionRightsObjectFactory', static_1.downgradeInjectable(CollectionRightsObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionUpdateService.ts ***!
  \******************************************************************************/
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
 * @fileoverview Service to build changes to a collection. These changes may
 * then be used by other services, such as a backend API service to update the
 * collection in the backend. This service also registers all changes with the
 * undo/redo service.
 */
__webpack_require__(/*! domain/collection/CollectionNodeObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/ChangeObjectFactory.ts */ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/collection/collection-domain.constants.ajs.ts */ "./core/templates/dev/head/domain/collection/collection-domain.constants.ajs.ts");
angular.module('oppia').factory('CollectionUpdateService', [
    'ChangeObjectFactory',
    'CollectionNodeObjectFactory', 'UndoRedoService',
    'CMD_ADD_COLLECTION_NODE',
    'CMD_DELETE_COLLECTION_NODE',
    'CMD_EDIT_COLLECTION_NODE_PROPERTY',
    'CMD_EDIT_COLLECTION_PROPERTY', 'CMD_SWAP_COLLECTION_NODES',
    'COLLECTION_PROPERTY_CATEGORY', 'COLLECTION_PROPERTY_LANGUAGE_CODE',
    'COLLECTION_PROPERTY_OBJECTIVE',
    'COLLECTION_PROPERTY_TAGS', 'COLLECTION_PROPERTY_TITLE', function (ChangeObjectFactory, CollectionNodeObjectFactory, UndoRedoService, CMD_ADD_COLLECTION_NODE, CMD_DELETE_COLLECTION_NODE, CMD_EDIT_COLLECTION_NODE_PROPERTY, CMD_EDIT_COLLECTION_PROPERTY, CMD_SWAP_COLLECTION_NODES, COLLECTION_PROPERTY_CATEGORY, COLLECTION_PROPERTY_LANGUAGE_CODE, COLLECTION_PROPERTY_OBJECTIVE, COLLECTION_PROPERTY_TAGS, COLLECTION_PROPERTY_TITLE) {
        // Creates a change using an apply function, reverse function, a change
        // command and related parameters. The change is applied to a given
        // collection.
        var _applyChange = function (collection, command, params, apply, reverse) {
            var changeDict = angular.copy(params);
            changeDict.cmd = command;
            var changeObj = ChangeObjectFactory.create(changeDict, apply, reverse);
            UndoRedoService.applyChange(changeObj, collection);
        };
        var _getParameterFromChangeDict = function (changeDict, paramName) {
            return changeDict[paramName];
        };
        // Applies a collection property change, specifically. See _applyChange()
        // for details on the other behavior of this function.
        var _applyPropertyChange = function (collection, propertyName, newValue, oldValue, apply, reverse) {
            _applyChange(collection, CMD_EDIT_COLLECTION_PROPERTY, {
                property_name: propertyName,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _getNewPropertyValueFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'new_value');
        };
        // Applies a property change to a collection node. See _applyChanges() for
        // details on the other behavior of this function.
        var _applyNodePropertyChange = function (collection, propertyName, explorationId, newValue, oldValue, apply, reverse) {
            _applyChange(collection, CMD_EDIT_COLLECTION_NODE_PROPERTY, {
                property_name: propertyName,
                exploration_id: explorationId,
                new_value: angular.copy(newValue),
                old_value: angular.copy(oldValue)
            }, apply, reverse);
        };
        var _getExplorationIdFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'exploration_id');
        };
        var _getFirstIndexFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'first_index');
        };
        var _getSecondIndexFromChangeDict = function (changeDict) {
            return _getParameterFromChangeDict(changeDict, 'second_index');
        };
        // These functions are associated with updates available in
        // core.domain.collection_services.apply_change_list.
        return {
            /**
             * Adds a new exploration to a collection and records the change in the
             * undo/redo service.
             */
            addCollectionNode: function (collection, explorationId, explorationSummaryBackendObject) {
                var oldSummaryBackendObject = angular.copy(explorationSummaryBackendObject);
                _applyChange(collection, CMD_ADD_COLLECTION_NODE, {
                    exploration_id: explorationId
                }, function (changeDict, collection) {
                    // Apply.
                    var explorationId = _getExplorationIdFromChangeDict(changeDict);
                    var collectionNode = (CollectionNodeObjectFactory.createFromExplorationId(explorationId));
                    collectionNode.setExplorationSummaryObject(oldSummaryBackendObject);
                    collection.addCollectionNode(collectionNode);
                }, function (changeDict, collection) {
                    // Undo.
                    var explorationId = _getExplorationIdFromChangeDict(changeDict);
                    collection.deleteCollectionNode(explorationId);
                });
            },
            swapNodes: function (collection, firstIndex, secondIndex) {
                _applyChange(collection, CMD_SWAP_COLLECTION_NODES, {
                    first_index: firstIndex,
                    second_index: secondIndex
                }, function (changeDict, collection) {
                    // Apply.
                    var firstIndex = _getFirstIndexFromChangeDict(changeDict);
                    var secondIndex = _getSecondIndexFromChangeDict(changeDict);
                    collection.swapCollectionNodes(firstIndex, secondIndex);
                }, function (changeDict, collection) {
                    // Undo.
                    var firstIndex = _getFirstIndexFromChangeDict(changeDict);
                    var secondIndex = _getSecondIndexFromChangeDict(changeDict);
                    collection.swapCollectionNodes(firstIndex, secondIndex);
                });
            },
            /**
             * Removes an exploration from a collection and records the change in
             * the undo/redo service.
             */
            deleteCollectionNode: function (collection, explorationId) {
                var oldCollectionNode = angular.copy(collection.getCollectionNodeByExplorationId(explorationId));
                _applyChange(collection, CMD_DELETE_COLLECTION_NODE, {
                    exploration_id: explorationId
                }, function (changeDict, collection) {
                    // Apply.
                    var explorationId = _getExplorationIdFromChangeDict(changeDict);
                    collection.deleteCollectionNode(explorationId);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.addCollectionNode(oldCollectionNode);
                });
            },
            /**
             * Changes the title of a collection and records the change in the
             * undo/redo service.
             */
            setCollectionTitle: function (collection, title) {
                var oldTitle = angular.copy(collection.getTitle());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_TITLE, title, oldTitle, function (changeDict, collection) {
                    // Apply
                    var title = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setTitle(title);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setTitle(oldTitle);
                });
            },
            /**
             * Changes the category of a collection and records the change in the
             * undo/redo service.
             */
            setCollectionCategory: function (collection, category) {
                var oldCategory = angular.copy(collection.getCategory());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_CATEGORY, category, oldCategory, function (changeDict, collection) {
                    // Apply.
                    var category = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setCategory(category);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setCategory(oldCategory);
                });
            },
            /**
             * Changes the objective of a collection and records the change in the
             * undo/redo service.
             */
            setCollectionObjective: function (collection, objective) {
                var oldObjective = angular.copy(collection.getObjective());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_OBJECTIVE, objective, oldObjective, function (changeDict, collection) {
                    // Apply.
                    var objective = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setObjective(objective);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setObjective(oldObjective);
                });
            },
            /**
             * Changes the language code of a collection and records the change in
             * the undo/redo service.
             */
            setCollectionLanguageCode: function (collection, languageCode) {
                var oldLanguageCode = angular.copy(collection.getLanguageCode());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_LANGUAGE_CODE, languageCode, oldLanguageCode, function (changeDict, collection) {
                    // Apply.
                    var languageCode = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setLanguageCode(languageCode);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setLanguageCode(oldLanguageCode);
                });
            },
            /**
             * Changes the tags of a collection and records the change in
             * the undo/redo service.
             */
            setCollectionTags: function (collection, tags) {
                var oldTags = angular.copy(collection.getTags());
                _applyPropertyChange(collection, COLLECTION_PROPERTY_TAGS, tags, oldTags, function (changeDict, collection) {
                    // Apply.
                    var tags = _getNewPropertyValueFromChangeDict(changeDict);
                    collection.setTags(tags);
                }, function (changeDict, collection) {
                    // Undo.
                    collection.setTags(oldTags);
                });
            },
            /**
             * Returns whether the given change object constructed by this service
             * is adding a new collection node to a collection.
             */
            isAddingCollectionNode: function (changeObject) {
                var backendChangeObject = changeObject.getBackendChangeObject();
                return backendChangeObject.cmd === CMD_ADD_COLLECTION_NODE;
            },
            /**
             * Returns the exploration ID referenced by the specified change object,
             * or undefined if the given changeObject does not reference an
             * exploration ID. The change object is expected to be one constructed
             * by this service.
             */
            getExplorationIdFromChangeObject: function (changeObject) {
                return _getExplorationIdFromChangeDict(changeObject.getBackendChangeObject());
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/CollectionValidationService.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/CollectionValidationService.ts ***!
  \**********************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Service to validate the consistency of a collection. These
 * checks are performable in the frontend to avoid sending a potentially invalid
 * collection to the backend, which performs similar validation checks to these
 * in collection_domain.Collection and subsequent domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var CollectionValidationService = /** @class */ (function () {
    function CollectionValidationService() {
    }
    CollectionValidationService.prototype._getNonexistentExplorationIds = function (collection) {
        return collection.getCollectionNodes().filter(function (collectionNode) {
            return !collectionNode.doesExplorationExist();
        }).map(function (collectionNode) {
            return collectionNode.getExplorationId();
        });
    };
    CollectionValidationService.prototype._getPrivateExplorationIds = function (collection) {
        return collection.getCollectionNodes().filter(function (collectionNode) {
            return collectionNode.isExplorationPrivate();
        }).map(function (collectionNode) {
            return collectionNode.getExplorationId();
        });
    };
    // Validates that the tags for the collection are in the proper format,
    // returns true if all tags are in the correct format.
    CollectionValidationService.prototype.validateTagFormat = function (tags) {
        // Check to ensure that all tags follow the format specified in
        // TAG_REGEX.
        // @ts-ignore: TODO(#7434): Remove this ignore after we find a way to get
        // rid of the TS2339 error on AppConstants.
        var tagRegex = new RegExp(app_constants_1.AppConstants.TAG_REGEX);
        return tags.every(function (tag) {
            return tag.match(tagRegex);
        });
    };
    // Validates that the tags for the collection do not have duplicates,
    // returns true if there are no duplicates.
    CollectionValidationService.prototype.validateDuplicateTags = function (tags) {
        return tags.every(function (tag, idx) {
            return tags.indexOf(tag, idx + 1) === -1;
        });
    };
    // Validates that the tags for the collection are normalized,
    // returns true if all tags were normalized.
    CollectionValidationService.prototype.validateTagsNormalized = function (tags) {
        return tags.every(function (tag) {
            return tag === tag.trim().replace(/\s+/g, ' ');
        });
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a list with varying element types.
    CollectionValidationService.prototype._validateCollection = function (collection, isPublic) {
        // NOTE TO DEVELOPERS: Please ensure that this validation logic is the
        // same as that in core.domain.collection_domain.Collection.validate().
        var issues = [];
        var collectionHasNodes = collection.getCollectionNodeCount() > 0;
        if (!collectionHasNodes) {
            issues.push('There should be at least 1 exploration in the collection.');
        }
        var nonexistentExpIds = this._getNonexistentExplorationIds(collection);
        if (nonexistentExpIds.length !== 0) {
            issues.push('The following exploration(s) either do not exist, or you do not ' +
                'have edit access to add them to this collection: ' +
                nonexistentExpIds.join(', '));
        }
        if (isPublic) {
            var privateExpIds = this._getPrivateExplorationIds(collection);
            if (privateExpIds.length !== 0) {
                issues.push('Private explorations cannot be added to a public collection: ' +
                    privateExpIds.join(', '));
            }
        }
        return issues;
    };
    /**
     * Returns a list of error strings found when validating the provided
     * collection. The validation methods used in this function are written to
     * match the validations performed in the backend. This function is
     * expensive, so it should be called sparingly.
     */
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a list with varying element types.
    CollectionValidationService.prototype.findValidationIssuesForPrivateCollection = function (collection) {
        return this._validateCollection(collection, false);
    };
    /**
     * Behaves in the same way as findValidationIssuesForPrivateCollection(),
     * except additional validation checks are performed which are specific to
     * public collections. This function is expensive, so it should be called
     * sparingly.
     */
    CollectionValidationService.prototype.findValidationIssuesForPublicCollection = function (collection) {
        return this._validateCollection(collection, true);
    };
    /**
     * Returns false if the tags are not validate.
     */
    CollectionValidationService.prototype.isTagValid = function (tags) {
        return this.validateTagFormat(tags) && this.validateDuplicateTags(tags) &&
            this.validateTagsNormalized(tags);
    };
    CollectionValidationService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], CollectionValidationService);
    return CollectionValidationService;
}());
exports.CollectionValidationService = CollectionValidationService;
angular.module('oppia').factory('CollectionValidationService', static_1.downgradeInjectable(CollectionValidationService));


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts ***!
  \******************************************************************************************/
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
 * @fileoverview Service to send changes to a collection to the backend.
 */
__webpack_require__(/*! domain/collection/ReadOnlyCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/ReadOnlyCollectionBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
// TODO(bhenning): I think that this might be better merged with the
// CollectionBackendApiService. However, that violates the principle of a
// backend API service being available for exactly one URL. To fix this, the
// backend controller could support both get and put and be pulled out of the
// collection learner and moved into its own controller. This is a new pattern
// for the backend, but it makes sense based on the usage of the get HTTP
// request by both the learner and editor views. This would result in one
// backend controller (file and class) for handling retrieving and changing
// collection data, as well as one frontend service for interfacing with it.
// Discuss and decide whether this is a good approach and then remove this TODO
// after deciding and acting upon the decision (which would mean implementing
// it if it's agreed upon).
angular.module('oppia').factory('EditableCollectionBackendApiService', [
    '$http', '$q', 'ReadOnlyCollectionBackendApiService',
    'UrlInterpolationService',
    'EDITABLE_COLLECTION_DATA_URL_TEMPLATE',
    function ($http, $q, ReadOnlyCollectionBackendApiService, UrlInterpolationService, EDITABLE_COLLECTION_DATA_URL_TEMPLATE) {
        var _fetchCollection = function (collectionId, successCallback, errorCallback) {
            var collectionDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_COLLECTION_DATA_URL_TEMPLATE, {
                collection_id: collectionId
            });
            $http.get(collectionDataUrl).then(function (response) {
                var collection = angular.copy(response.data.collection);
                if (successCallback) {
                    successCallback(collection);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateCollection = function (collectionId, collectionVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableCollectionDataUrl = UrlInterpolationService.interpolateUrl(EDITABLE_COLLECTION_DATA_URL_TEMPLATE, {
                collection_id: collectionId
            });
            var putData = {
                version: collectionVersion,
                commit_message: commitMessage,
                change_list: changeList
            };
            $http.put(editableCollectionDataUrl, putData).then(function (response) {
                // The returned data is an updated collection dict.
                var collection = angular.copy(response.data.collection);
                // Update the ReadOnlyCollectionBackendApiService's cache with the new
                // collection.
                ReadOnlyCollectionBackendApiService.cacheCollection(collectionId, collection);
                if (successCallback) {
                    successCallback(collection);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            fetchCollection: function (collectionId) {
                return $q(function (resolve, reject) {
                    _fetchCollection(collectionId, resolve, reject);
                });
            },
            /**
             * Updates a collection in the backend with the provided collection ID.
             * The changes only apply to the collection of the given version and the
             * request to update the collection will fail if the provided collection
             * version is older than the current version stored in the backend. Both
             * the changes and the message to associate with those changes are used
             * to commit a change to the collection. The new collection is passed to
             * the success callback, if one is provided to the returned promise
             * object. Errors are passed to the error callback, if one is provided.
             * Finally, if the update is successful, the returned collection will be
             * cached within the CollectionBackendApiService to ensure the cache is
             * not out-of-date with any updates made by this backend API service.
             */
            updateCollection: function (collectionId, collectionVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateCollection(collectionId, collectionVersion, commitMessage, changeList, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/SearchExplorationsBackendApiService.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/SearchExplorationsBackendApiService.ts ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to search explorations metadata.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').factory('SearchExplorationsBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'SEARCH_EXPLORATION_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, SEARCH_EXPLORATION_URL_TEMPLATE) {
        var _fetchExplorations = function (searchQuery, successCallback, errorCallback) {
            var queryUrl = UrlInterpolationService.interpolateUrl(SEARCH_EXPLORATION_URL_TEMPLATE, {
                query: btoa(searchQuery)
            });
            $http.get(queryUrl).then(function (response) {
                successCallback(response.data);
            }, function (errorResponse) {
                errorCallback(errorResponse.data);
            });
        };
        return {
            /**
             * Returns exploration's metadata dict, given a search query. Search
             * queries are tokens that will be matched against exploration's title
             * and objective.
             */
            fetchExplorations: function (searchQuery) {
                return $q(function (resolve, reject) {
                    _fetchExplorations(searchQuery, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/collection-domain.constants.ajs.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/collection-domain.constants.ajs.ts ***!
  \**************************************************************************************/
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for collection domain services.
 */
// These should match the constants defined in core.domain.collection_domain.
// TODO(bhenning): The values of these constants should be provided by the
// backend.
// NOTE TO DEVELOPERS: the properties 'prerequisite_skills' and
// 'acquired_skills' are deprecated. Do not use them.
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var collection_domain_constants_1 = __webpack_require__(/*! domain/collection/collection-domain.constants */ "./core/templates/dev/head/domain/collection/collection-domain.constants.ts");
angular.module('oppia').constant('CMD_ADD_COLLECTION_NODE', collection_domain_constants_1.CollectionDomainConstants.CMD_ADD_COLLECTION_NODE);
angular.module('oppia').constant('CMD_SWAP_COLLECTION_NODES', collection_domain_constants_1.CollectionDomainConstants.CMD_SWAP_COLLECTION_NODES);
angular.module('oppia').constant('CMD_DELETE_COLLECTION_NODE', collection_domain_constants_1.CollectionDomainConstants.CMD_DELETE_COLLECTION_NODE);
angular.module('oppia').constant('CMD_EDIT_COLLECTION_PROPERTY', collection_domain_constants_1.CollectionDomainConstants.CMD_EDIT_COLLECTION_PROPERTY);
angular.module('oppia').constant('CMD_EDIT_COLLECTION_NODE_PROPERTY', collection_domain_constants_1.CollectionDomainConstants.CMD_EDIT_COLLECTION_NODE_PROPERTY);
angular.module('oppia').constant('COLLECTION_PROPERTY_TITLE', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_PROPERTY_TITLE);
angular.module('oppia').constant('COLLECTION_PROPERTY_CATEGORY', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_PROPERTY_CATEGORY);
angular.module('oppia').constant('COLLECTION_PROPERTY_OBJECTIVE', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_PROPERTY_OBJECTIVE);
angular.module('oppia').constant('COLLECTION_PROPERTY_LANGUAGE_CODE', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant('COLLECTION_PROPERTY_TAGS', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_PROPERTY_TAGS);
angular.module('oppia').constant('CMD_ADD_COLLECTION_SKILL', collection_domain_constants_1.CollectionDomainConstants.CMD_ADD_COLLECTION_SKILL);
angular.module('oppia').constant('CMD_DELETE_COLLECTION_SKILL', collection_domain_constants_1.CollectionDomainConstants.CMD_DELETE_COLLECTION_SKILL);
angular.module('oppia').constant('COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS);
angular.module('oppia').constant('COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS', collection_domain_constants_1.CollectionDomainConstants.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS);


/***/ }),

/***/ "./core/templates/dev/head/domain/collection/collection-domain.constants.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/collection/collection-domain.constants.ts ***!
  \**********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants for collection domain services.
 */
// These should match the constants defined in core.domain.collection_domain.
// TODO(bhenning): The values of these constants should be provided by the
// backend.
// NOTE TO DEVELOPERS: the properties 'prerequisite_skills' and
// 'acquired_skills' are deprecated. Do not use them.
var CollectionDomainConstants = /** @class */ (function () {
    function CollectionDomainConstants() {
    }
    CollectionDomainConstants.CMD_ADD_COLLECTION_NODE = 'add_collection_node';
    CollectionDomainConstants.CMD_SWAP_COLLECTION_NODES = 'swap_nodes';
    CollectionDomainConstants.CMD_DELETE_COLLECTION_NODE = 'delete_collection_node';
    CollectionDomainConstants.CMD_EDIT_COLLECTION_PROPERTY = 'edit_collection_property';
    CollectionDomainConstants.CMD_EDIT_COLLECTION_NODE_PROPERTY = 'edit_collection_node_property';
    CollectionDomainConstants.COLLECTION_PROPERTY_TITLE = 'title';
    CollectionDomainConstants.COLLECTION_PROPERTY_CATEGORY = 'category';
    CollectionDomainConstants.COLLECTION_PROPERTY_OBJECTIVE = 'objective';
    CollectionDomainConstants.COLLECTION_PROPERTY_LANGUAGE_CODE = 'language_code';
    CollectionDomainConstants.COLLECTION_PROPERTY_TAGS = 'tags';
    CollectionDomainConstants.CMD_ADD_COLLECTION_SKILL = 'add_collection_skill';
    CollectionDomainConstants.CMD_DELETE_COLLECTION_SKILL = 'delete_collection_skill';
    CollectionDomainConstants.COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS = 'prerequisite_skill_ids';
    CollectionDomainConstants.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS = 'acquired_skill_ids';
    return CollectionDomainConstants;
}());
exports.CollectionDomainConstants = CollectionDomainConstants;


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/AnswerGroupObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/AnswerGroupObjectFactory.ts ***!
  \********************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of AnswerGroup
 * domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var OutcomeObjectFactory_1 = __webpack_require__(/*! domain/exploration/OutcomeObjectFactory */ "./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts");
var RuleObjectFactory_1 = __webpack_require__(/*! domain/exploration/RuleObjectFactory */ "./core/templates/dev/head/domain/exploration/RuleObjectFactory.ts");
var AnswerGroup = /** @class */ (function () {
    function AnswerGroup(rules, outcome, trainingData, taggedSkillMisconceptionId) {
        this.rules = rules;
        this.outcome = outcome;
        this.trainingData = trainingData;
        this.taggedSkillMisconceptionId = taggedSkillMisconceptionId;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    AnswerGroup.prototype.toBackendDict = function () {
        return {
            rule_specs: this.rules.map(function (rule) {
                return rule.toBackendDict();
            }),
            outcome: this.outcome.toBackendDict(),
            training_data: this.trainingData,
            tagged_skill_misconception_id: this.taggedSkillMisconceptionId
        };
    };
    return AnswerGroup;
}());
exports.AnswerGroup = AnswerGroup;
var AnswerGroupObjectFactory = /** @class */ (function () {
    function AnswerGroupObjectFactory(outcomeObjectFactory, ruleObjectFactory) {
        this.outcomeObjectFactory = outcomeObjectFactory;
        this.ruleObjectFactory = ruleObjectFactory;
    }
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since 'ruleBackendDicts' is a complex object with elements as keys
    // having varying types. An exact type needs tobe found.
    AnswerGroupObjectFactory.prototype.generateRulesFromBackend = function (ruleBackendDicts) {
        var _this = this;
        return ruleBackendDicts.map(function (ruleBackendDict) {
            return _this.ruleObjectFactory.createFromBackendDict(ruleBackendDict);
        });
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'trainingData' is an array of dicts with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    AnswerGroupObjectFactory.prototype.createNew = function (rules, outcome, trainingData, taggedSkillMisconceptionId) {
        return new AnswerGroup(rules, outcome, trainingData, taggedSkillMisconceptionId);
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'answerGroupBackendDict' is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    AnswerGroupObjectFactory.prototype.createFromBackendDict = function (answerGroupBackendDict) {
        return new AnswerGroup(this.generateRulesFromBackend(answerGroupBackendDict.rule_specs), this.outcomeObjectFactory.createFromBackendDict(answerGroupBackendDict.outcome), answerGroupBackendDict.training_data, answerGroupBackendDict.tagged_skill_misconception_id);
    };
    var _a, _b;
    AnswerGroupObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof OutcomeObjectFactory_1.OutcomeObjectFactory !== "undefined" && OutcomeObjectFactory_1.OutcomeObjectFactory) === "function" ? _a : Object, typeof (_b = typeof RuleObjectFactory_1.RuleObjectFactory !== "undefined" && RuleObjectFactory_1.RuleObjectFactory) === "function" ? _b : Object])
    ], AnswerGroupObjectFactory);
    return AnswerGroupObjectFactory;
}());
exports.AnswerGroupObjectFactory = AnswerGroupObjectFactory;
angular.module('oppia').factory('AnswerGroupObjectFactory', static_1.downgradeInjectable(AnswerGroupObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/EditableExplorationBackendApiService.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/EditableExplorationBackendApiService.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to a exploration to the backend.
 */
__webpack_require__(/*! domain/exploration/ReadOnlyExplorationBackendApiService.ts */ "./core/templates/dev/head/domain/exploration/ReadOnlyExplorationBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/exploration-player-page/exploration-player-page.constants.ajs.ts */ "./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ajs.ts");
angular.module('oppia').factory('EditableExplorationBackendApiService', [
    '$http', '$q', 'ReadOnlyExplorationBackendApiService',
    'UrlInterpolationService', 'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
    'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
    function ($http, $q, ReadOnlyExplorationBackendApiService, UrlInterpolationService, EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE, EDITABLE_EXPLORATION_DATA_URL_TEMPLATE) {
        var _fetchExploration = function (explorationId, applyDraft, successCallback, errorCallback) {
            var editableExplorationDataUrl = _getExplorationUrl(explorationId, applyDraft);
            $http.get(editableExplorationDataUrl).then(function (response) {
                var exploration = angular.copy(response.data);
                if (successCallback) {
                    successCallback(exploration);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _updateExploration = function (explorationId, explorationVersion, commitMessage, changeList, successCallback, errorCallback) {
            var editableExplorationDataUrl = _getExplorationUrl(explorationId, null);
            var putData = {
                version: explorationVersion,
                commit_message: commitMessage,
                change_list: changeList
            };
            $http.put(editableExplorationDataUrl, putData).then(function (response) {
                // The returned data is an updated exploration dict.
                var exploration = angular.copy(response.data);
                // Delete from the ReadOnlyExplorationBackendApiService's cache
                // As the two versions of the data (learner and editor) now differ
                ReadOnlyExplorationBackendApiService.deleteExplorationFromCache(explorationId, exploration);
                if (successCallback) {
                    successCallback(exploration);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _deleteExploration = function (explorationId, successCallback, errorCallback) {
            var editableExplorationDataUrl = _getExplorationUrl(explorationId, null);
            $http['delete'](editableExplorationDataUrl).then(function () {
                // Delete item from the ReadOnlyExplorationBackendApiService's cache
                ReadOnlyExplorationBackendApiService.deleteExplorationFromCache(explorationId);
                if (successCallback) {
                    successCallback({});
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _getExplorationUrl = function (explorationId, applyDraft) {
            if (applyDraft) {
                return UrlInterpolationService.interpolateUrl(EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE, {
                    exploration_id: explorationId,
                    apply_draft: JSON.stringify(applyDraft)
                });
            }
            return UrlInterpolationService.interpolateUrl(EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, {
                exploration_id: explorationId
            });
        };
        return {
            fetchExploration: function (explorationId) {
                return $q(function (resolve, reject) {
                    _fetchExploration(explorationId, null, resolve, reject);
                });
            },
            fetchApplyDraftExploration: function (explorationId) {
                return $q(function (resolve, reject) {
                    _fetchExploration(explorationId, true, resolve, reject);
                });
            },
            /**
             * Updates an exploration in the backend with the provided exploration
             * ID. The changes only apply to the exploration of the given version
             * and the request to update the exploration will fail if the provided
             * exploration version is older than the current version stored in the
             * backend. Both the changes and the message to associate with those
             * changes are used to commit a change to the exploration.
             * The new exploration is passed to the success callback,
             * if one is provided to the returned promise object. Errors are passed
             * to the error callback, if one is provided. Please note, once this is
             * called the cached exploration in ReadOnlyExplorationBackendApiService
             * will be deleted. This is due to the differences in the back-end
             * editor object and the back-end player object. As it stands now,
             * we are unable to cache any Exploration object obtained from the
             * editor beackend.
             */
            updateExploration: function (explorationId, explorationVersion, commitMessage, changeList) {
                return $q(function (resolve, reject) {
                    _updateExploration(explorationId, explorationVersion, commitMessage, changeList, resolve, reject);
                });
            },
            /**
             * Deletes an exploration in the backend with the provided exploration
             * ID. If successful, the exploration will also be deleted from the
             * ReadOnlyExplorationBackendApiService cache as well.
             * Errors are passed to the error callback, if one is provided.
             */
            deleteExploration: function (explorationId) {
                return $q(function (resolve, reject) {
                    _deleteExploration(explorationId, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of ExplorationDraft
 * domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var ExplorationDraft = /** @class */ (function () {
    function ExplorationDraft(draftChanges, draftChangeListId) {
        this.draftChanges = draftChanges;
        this.draftChangeListId = draftChangeListId;
    }
    /**
     * Checks whether the draft object has been overwritten by another
     * draft which has been committed to the back-end. If the supplied draft id
     * has a different value then a newer changeList must have been committed
     * to the back-end.
     * @param {Integer} - currentDraftId. The id of the draft changes whch was
     *  retrieved from the back-end.
     * @returns {Boolean} - True iff the currentDraftId is the same as the
     * draftChangeListId corresponding to this draft.
     */
    ExplorationDraft.prototype.isValid = function (currentDraftId) {
        return (currentDraftId === this.draftChangeListId);
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since 'draftChanges' is an array of dicts with possible
    // underscore_cased keys. A thorough check needs to be done to assure of
    // its exact type.
    ExplorationDraft.prototype.getChanges = function () {
        return this.draftChanges;
    };
    return ExplorationDraft;
}());
exports.ExplorationDraft = ExplorationDraft;
var ExplorationDraftObjectFactory = /** @class */ (function () {
    function ExplorationDraftObjectFactory() {
    }
    ExplorationDraftObjectFactory.prototype.createFromLocalStorageDict = function (explorationDraftDict) {
        return new ExplorationDraft(explorationDraftDict.draftChanges, explorationDraftDict.draftChangeListId);
    };
    ExplorationDraftObjectFactory.prototype.toLocalStorageDict = function (
    // TODO(#7165): Replace 'any' with the exact type. This has been typed
    // as 'any' since 'changeList' is an array of dicts with possible
    // underscore_cased keys. A thorough check needs to be done to assure of
    // its exact type.
    changeList, draftChangeListId) {
        return {
            draftChanges: changeList,
            draftChangeListId: draftChangeListId
        };
    };
    ExplorationDraftObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ExplorationDraftObjectFactory);
    return ExplorationDraftObjectFactory;
}());
exports.ExplorationDraftObjectFactory = ExplorationDraftObjectFactory;
angular.module('oppia').factory('ExplorationDraftObjectFactory', static_1.downgradeInjectable(ExplorationDraftObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/HintObjectFactory.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/HintObjectFactory.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of Hint
 * domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var SubtitledHtmlObjectFactory_1 = __webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
var Hint = /** @class */ (function () {
    function Hint(hintContent) {
        this.hintContent = hintContent;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    Hint.prototype.toBackendDict = function () {
        return {
            hint_content: this.hintContent.toBackendDict()
        };
    };
    return Hint;
}());
exports.Hint = Hint;
var HintObjectFactory = /** @class */ (function () {
    function HintObjectFactory(subtitledHtmlObjectFactory) {
        this.subtitledHtmlObjectFactory = subtitledHtmlObjectFactory;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'hintBackendDict' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    HintObjectFactory.prototype.createFromBackendDict = function (hintBackendDict) {
        return new Hint(this.subtitledHtmlObjectFactory.createFromBackendDict(hintBackendDict.hint_content));
    };
    HintObjectFactory.prototype.createNew = function (hintContentId, hintContent) {
        return new Hint(this.subtitledHtmlObjectFactory.createDefault(hintContent, hintContentId));
    };
    var _a;
    HintObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof SubtitledHtmlObjectFactory_1.SubtitledHtmlObjectFactory !== "undefined" && SubtitledHtmlObjectFactory_1.SubtitledHtmlObjectFactory) === "function" ? _a : Object])
    ], HintObjectFactory);
    return HintObjectFactory;
}());
exports.HintObjectFactory = HintObjectFactory;
angular.module('oppia').factory('HintObjectFactory', static_1.downgradeInjectable(HintObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/InteractionObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/InteractionObjectFactory.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Interaction
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/AnswerGroupObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/AnswerGroupObjectFactory.ts");
__webpack_require__(/*! domain/exploration/HintObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/HintObjectFactory.ts");
__webpack_require__(/*! domain/exploration/OutcomeObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts");
__webpack_require__(/*! domain/exploration/SolutionObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SolutionObjectFactory.ts");
angular.module('oppia').factory('InteractionObjectFactory', [
    'AnswerGroupObjectFactory', 'HintObjectFactory', 'OutcomeObjectFactory',
    'SolutionObjectFactory',
    function (AnswerGroupObjectFactory, HintObjectFactory, OutcomeObjectFactory, SolutionObjectFactory) {
        var Interaction = function (answerGroups, confirmedUnclassifiedAnswers, customizationArgs, defaultOutcome, hints, id, solution) {
            this.answerGroups = answerGroups;
            this.confirmedUnclassifiedAnswers = confirmedUnclassifiedAnswers;
            this.customizationArgs = customizationArgs;
            this.defaultOutcome = defaultOutcome;
            this.hints = hints;
            this.id = id;
            this.solution = solution;
        };
        Interaction.prototype.setId = function (newValue) {
            this.id = newValue;
        };
        Interaction.prototype.setAnswerGroups = function (newValue) {
            this.answerGroups = newValue;
        };
        Interaction.prototype.setDefaultOutcome = function (newValue) {
            this.defaultOutcome = newValue;
        };
        Interaction.prototype.setCustomizationArgs = function (newValue) {
            this.customizationArgs = newValue;
        };
        Interaction.prototype.setSolution = function (newValue) {
            this.solution = newValue;
        };
        Interaction.prototype.setHints = function (newValue) {
            this.hints = newValue;
        };
        Interaction.prototype.copy = function (otherInteraction) {
            this.answerGroups = angular.copy(otherInteraction.answerGroups);
            this.confirmedUnclassifiedAnswers =
                angular.copy(otherInteraction.confirmedUnclassifiedAnswers);
            this.customizationArgs = angular.copy(otherInteraction.customizationArgs);
            this.defaultOutcome = angular.copy(otherInteraction.defaultOutcome);
            this.hints = angular.copy(otherInteraction.hints);
            this.id = angular.copy(otherInteraction.id);
            this.solution = angular.copy(otherInteraction.solution);
        };
        Interaction.prototype.toBackendDict = function () {
            return {
                answer_groups: this.answerGroups.map(function (answerGroup) {
                    return answerGroup.toBackendDict();
                }),
                confirmed_unclassified_answers: this.confirmedUnclassifiedAnswers,
                customization_args: this.customizationArgs,
                default_outcome: this.defaultOutcome ? this.defaultOutcome.toBackendDict() : null,
                hints: this.hints.map(function (hint) {
                    return hint.toBackendDict();
                }),
                id: this.id,
                solution: this.solution ? this.solution.toBackendDict() : null
            };
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Interaction['createFromBackendDict'] = function (interactionDict) {
            /* eslint-enable dot-notation */
            var defaultOutcome;
            if (interactionDict.default_outcome) {
                defaultOutcome = OutcomeObjectFactory.createFromBackendDict(interactionDict.default_outcome);
            }
            else {
                defaultOutcome = null;
            }
            return new Interaction(generateAnswerGroupsFromBackend(interactionDict.answer_groups), interactionDict.confirmed_unclassified_answers, interactionDict.customization_args, defaultOutcome, generateHintsFromBackend(interactionDict.hints), interactionDict.id, interactionDict.solution ? (generateSolutionFromBackend(interactionDict.solution)) : null);
        };
        var generateAnswerGroupsFromBackend = function (answerGroupBackendDicts) {
            return answerGroupBackendDicts.map(function (answerGroupBackendDict) {
                return AnswerGroupObjectFactory.createFromBackendDict(answerGroupBackendDict);
            });
        };
        var generateHintsFromBackend = function (hintBackendDicts) {
            return hintBackendDicts.map(function (hintBackendDict) {
                return HintObjectFactory.createFromBackendDict(hintBackendDict);
            });
        };
        var generateSolutionFromBackend = function (solutionBackendDict) {
            return SolutionObjectFactory.createFromBackendDict(solutionBackendDict);
        };
        return Interaction;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts ***!
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of Outcome
 * domain objects.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var SubtitledHtmlObjectFactory_1 = __webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
var Outcome = /** @class */ (function () {
    function Outcome(dest, feedback, labelledAsCorrect, paramChanges, refresherExplorationId, missingPrerequisiteSkillId) {
        this.dest = dest;
        this.feedback = feedback;
        this.labelledAsCorrect = labelledAsCorrect;
        this.paramChanges = paramChanges;
        this.refresherExplorationId = refresherExplorationId;
        this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
    }
    Outcome.prototype.setDestination = function (newValue) {
        this.dest = newValue;
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    Outcome.prototype.toBackendDict = function () {
        return {
            dest: this.dest,
            feedback: this.feedback.toBackendDict(),
            labelled_as_correct: this.labelledAsCorrect,
            param_changes: this.paramChanges,
            refresher_exploration_id: this.refresherExplorationId,
            missing_prerequisite_skill_id: this.missingPrerequisiteSkillId
        };
    };
    Outcome.prototype.hasNonemptyFeedback = function () {
        return this.feedback.getHtml().trim() !== '';
    };
    /**
     * Returns true iff an outcome has a self-loop, no feedback, and no
     * refresher exploration.
     */
    Outcome.prototype.isConfusing = function (currentStateName) {
        return (this.dest === currentStateName &&
            !this.hasNonemptyFeedback() &&
            this.refresherExplorationId === null);
    };
    return Outcome;
}());
exports.Outcome = Outcome;
var OutcomeObjectFactory = /** @class */ (function () {
    function OutcomeObjectFactory(subtitledHtmlObjectFactory) {
        this.subtitledHtmlObjectFactory = subtitledHtmlObjectFactory;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    OutcomeObjectFactory.prototype.createNew = function (dest, feedbackTextId, feedbackText, paramChanges) {
        return new Outcome(dest, this.subtitledHtmlObjectFactory.createDefault(feedbackText, feedbackTextId), false, paramChanges, null, null);
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'outcomeDict' is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    OutcomeObjectFactory.prototype.createFromBackendDict = function (outcomeDict) {
        return new Outcome(outcomeDict.dest, this.subtitledHtmlObjectFactory.createFromBackendDict(outcomeDict.feedback), outcomeDict.labelled_as_correct, outcomeDict.param_changes, outcomeDict.refresher_exploration_id, outcomeDict.missing_prerequisite_skill_id);
    };
    var _a;
    OutcomeObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof SubtitledHtmlObjectFactory_1.SubtitledHtmlObjectFactory !== "undefined" && SubtitledHtmlObjectFactory_1.SubtitledHtmlObjectFactory) === "function" ? _a : Object])
    ], OutcomeObjectFactory);
    return OutcomeObjectFactory;
}());
exports.OutcomeObjectFactory = OutcomeObjectFactory;
angular.module('oppia').factory('OutcomeObjectFactory', static_1.downgradeInjectable(OutcomeObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ParamChangeObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ParamChangeObjectFactory.ts ***!
  \********************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of ParamChange
 * domain objects.
 */
var cloneDeep_1 = __importDefault(__webpack_require__(/*! lodash/cloneDeep */ "./node_modules/lodash/cloneDeep.js"));
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var DEFAULT_CUSTOMIZATION_ARGS = {
    Copier: {
        parse_with_jinja: true,
        value: '5'
    },
    RandomSelector: {
        list_of_values: ['sample value']
    }
};
var ParamChange = /** @class */ (function () {
    function ParamChange(customizationArgs, generatorId, name) {
        this.customizationArgs = customizationArgs;
        this.generatorId = generatorId;
        this.name = name;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys which
    // give tslint errors against underscore_casing in favor of camelCasing.
    ParamChange.prototype.toBackendDict = function () {
        return {
            customization_args: this.customizationArgs,
            generator_id: this.generatorId,
            name: this.name
        };
    };
    ParamChange.prototype.resetCustomizationArgs = function () {
        this.customizationArgs = cloneDeep_1.default(DEFAULT_CUSTOMIZATION_ARGS[this.generatorId]);
    };
    return ParamChange;
}());
exports.ParamChange = ParamChange;
var ParamChangeObjectFactory = /** @class */ (function () {
    function ParamChangeObjectFactory() {
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'paramChangeBackendDict' is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    ParamChangeObjectFactory.prototype.createFromBackendDict = function (paramChangeBackendDict) {
        return new ParamChange(paramChangeBackendDict.customization_args, paramChangeBackendDict.generator_id, paramChangeBackendDict.name);
    };
    ParamChangeObjectFactory.prototype.createEmpty = function (paramName) {
        return new ParamChange({
            parse_with_jinja: true,
            value: ''
        }, 'Copier', paramName);
    };
    ParamChangeObjectFactory.prototype.createDefault = function (paramName) {
        return new ParamChange(cloneDeep_1.default(DEFAULT_CUSTOMIZATION_ARGS.Copier), 'Copier', paramName);
    };
    ParamChangeObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ParamChangeObjectFactory);
    return ParamChangeObjectFactory;
}());
exports.ParamChangeObjectFactory = ParamChangeObjectFactory;
angular.module('oppia').factory('ParamChangeObjectFactory', static_1.downgradeInjectable(ParamChangeObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ParamChangesObjectFactory.ts":
/*!*********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ParamChangesObjectFactory.ts ***!
  \*********************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend arrays of ParamChange
 * domain objects.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var ParamChangeObjectFactory_ts_1 = __webpack_require__(/*! domain/exploration/ParamChangeObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ParamChangeObjectFactory.ts");
var ParamChangesObjectFactory = /** @class */ (function () {
    function ParamChangesObjectFactory(paramChangeObjectFactory) {
        this.paramChangeObjectFactory = paramChangeObjectFactory;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'paramChangeBackendList' is a dict with underscore_cased keys
    // which give tslint errors against underscore_casing in favor of camelCasing.
    ParamChangesObjectFactory.prototype.createFromBackendList = function (paramChangeBackendList) {
        var _this = this;
        return paramChangeBackendList.map(function (paramChangeBackendDict) {
            return _this.paramChangeObjectFactory.createFromBackendDict(paramChangeBackendDict);
        });
    };
    var _a;
    ParamChangesObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof ParamChangeObjectFactory_ts_1.ParamChangeObjectFactory !== "undefined" && ParamChangeObjectFactory_ts_1.ParamChangeObjectFactory) === "function" ? _a : Object])
    ], ParamChangesObjectFactory);
    return ParamChangesObjectFactory;
}());
exports.ParamChangesObjectFactory = ParamChangesObjectFactory;
angular.module('oppia').factory('ParamChangesObjectFactory', static_1.downgradeInjectable(ParamChangesObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ReadOnlyExplorationBackendApiService.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ReadOnlyExplorationBackendApiService.ts ***!
  \********************************************************************************************/
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
 * @fileoverview Service to retrieve read only information
 * about explorations from the backend.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/exploration-player-page/exploration-player-page.constants.ajs.ts */ "./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ajs.ts");
angular.module('oppia').factory('ReadOnlyExplorationBackendApiService', [
    '$http', '$q', 'UrlInterpolationService',
    'EXPLORATION_DATA_URL_TEMPLATE', 'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
    function ($http, $q, UrlInterpolationService, EXPLORATION_DATA_URL_TEMPLATE, EXPLORATION_VERSION_DATA_URL_TEMPLATE) {
        // Maps previously loaded explorations to their IDs.
        var _explorationCache = [];
        var _fetchExploration = function (explorationId, version, successCallback, errorCallback) {
            var explorationDataUrl = _getExplorationUrl(explorationId, version);
            $http.get(explorationDataUrl).then(function (response) {
                var exploration = angular.copy(response.data);
                if (successCallback) {
                    successCallback(exploration);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        var _isCached = function (explorationId) {
            return _explorationCache.hasOwnProperty(explorationId);
        };
        var _getExplorationUrl = function (explorationId, version) {
            if (version) {
                return UrlInterpolationService.interpolateUrl(EXPLORATION_VERSION_DATA_URL_TEMPLATE, {
                    exploration_id: explorationId,
                    version: String(version)
                });
            }
            return UrlInterpolationService.interpolateUrl(EXPLORATION_DATA_URL_TEMPLATE, {
                exploration_id: explorationId
            });
        };
        return {
            /**
             * Retrieves an exploration from the backend given an exploration ID
             * and version number (or none). This returns a promise object that
             * allows success and rejection callbacks to be registered. If the
             * exploration is successfully loaded and a success callback function
             * is provided to the promise object, the success callback is called
             * with the exploration passed in as a parameter. If something goes
             * wrong while trying to fetch the exploration, the rejection callback
             * is called instead, if present. The rejection callback function is
             * passed any data returned by the backend in the case of an error.
             */
            fetchExploration: function (explorationId, version) {
                return $q(function (resolve, reject) {
                    _fetchExploration(explorationId, version, resolve, reject);
                });
            },
            /**
             * Behaves in the exact same way as fetchExploration (including
             * callback behavior and returning a promise object),
             * except this function will attempt to see whether the latest version
             * of the given exploration has already been loaded. If it has not yet
             * been loaded, it will fetch the exploration from the backend. If it
             * successfully retrieves the exploration from the backend, this method
             * will store the exploration in the cache to avoid requests from the
             * backend in further function calls.
             */
            loadLatestExploration: function (explorationId) {
                return $q(function (resolve, reject) {
                    if (_isCached(explorationId)) {
                        if (resolve) {
                            resolve(angular.copy(_explorationCache[explorationId]));
                        }
                    }
                    else {
                        _fetchExploration(explorationId, null, function (exploration) {
                            // Save the fetched exploration to avoid future fetches.
                            _explorationCache[explorationId] = exploration;
                            if (resolve) {
                                resolve(angular.copy(exploration));
                            }
                        }, reject);
                    }
                });
            },
            /**
             * Retrieves an exploration from the backend given an exploration ID
             * and version number. This method does not interact with any cache
             * and using this method will not overwrite or touch the state of the
             * cache. All previous data in the cache will still be retained after
             * this call.
             */
            loadExploration: function (explorationId, version) {
                return $q(function (resolve, reject) {
                    _fetchExploration(explorationId, version, function (exploration) {
                        if (resolve) {
                            resolve(angular.copy(exploration));
                        }
                    }, reject);
                });
            },
            /**
             * Returns whether the given exploration is stored within the local
             * data cache or if it needs to be retrieved from the backend upon a
             * load.
             */
            isCached: function (explorationId) {
                return _isCached(explorationId);
            },
            /**
             * Replaces the current exploration in the cache given by the specified
             * exploration ID with a new exploration object.
             */
            cacheExploration: function (explorationId, exploration) {
                _explorationCache[explorationId] = angular.copy(exploration);
            },
            /**
             * Clears the local exploration data cache, forcing all future loads to
             * re-request the previously loaded explorations from the backend.
             */
            clearExplorationCache: function () {
                _explorationCache = [];
            },
            /**
             * Deletes a specific exploration from the local cache
             */
            deleteExplorationFromCache: function (explorationId) {
                if (_isCached(explorationId)) {
                    delete _explorationCache[explorationId];
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/RuleObjectFactory.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/RuleObjectFactory.ts ***!
  \*************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of Rule
 * domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var Rule = /** @class */ (function () {
    function Rule(type, inputs) {
        this.type = type;
        this.inputs = inputs;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys which
    // gives tslint errors against underscore_casing in favor of camelCasing.
    Rule.prototype.toBackendDict = function () {
        return {
            rule_type: this.type,
            inputs: this.inputs
        };
    };
    return Rule;
}());
exports.Rule = Rule;
var RuleObjectFactory = /** @class */ (function () {
    function RuleObjectFactory() {
    }
    RuleObjectFactory.prototype.createNew = function (type, inputs) {
        return new Rule(type, inputs);
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'ruleDict' is a dict with underscore_cased keys which
    // gives tslint errors against underscore_casing in favor of camelCasing.
    RuleObjectFactory.prototype.createFromBackendDict = function (ruleDict) {
        return new Rule(ruleDict.rule_type, ruleDict.inputs);
    };
    RuleObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], RuleObjectFactory);
    return RuleObjectFactory;
}());
exports.RuleObjectFactory = RuleObjectFactory;
angular.module('oppia').factory('RuleObjectFactory', static_1.downgradeInjectable(RuleObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/SolutionObjectFactory.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/SolutionObjectFactory.ts ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of Solution
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
__webpack_require__(/*! domain/objects/FractionObjectFactory.ts */ "./core/templates/dev/head/domain/objects/FractionObjectFactory.ts");
__webpack_require__(/*! domain/objects/NumberWithUnitsObjectFactory.ts */ "./core/templates/dev/head/domain/objects/NumberWithUnitsObjectFactory.ts");
__webpack_require__(/*! filters/string-utility-filters/convert-to-plain-text.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts");
__webpack_require__(/*! services/ExplorationHtmlFormatterService.ts */ "./core/templates/dev/head/services/ExplorationHtmlFormatterService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
angular.module('oppia').factory('SolutionObjectFactory', [
    '$filter', 'ExplorationHtmlFormatterService', 'FractionObjectFactory',
    'HtmlEscaperService', 'NumberWithUnitsObjectFactory',
    'SubtitledHtmlObjectFactory',
    function ($filter, ExplorationHtmlFormatterService, FractionObjectFactory, HtmlEscaperService, NumberWithUnitsObjectFactory, SubtitledHtmlObjectFactory) {
        var Solution = function (answerIsExclusive, correctAnswer, explanation) {
            this.answerIsExclusive = answerIsExclusive;
            this.correctAnswer = correctAnswer;
            this.explanation = explanation;
        };
        Solution.prototype.toBackendDict = function () {
            return {
                answer_is_exclusive: this.answerIsExclusive,
                correct_answer: this.correctAnswer,
                explanation: this.explanation.toBackendDict()
            };
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Solution['createFromBackendDict'] = function (solutionBackendDict) {
            /* eslint-enable dot-notation */
            return new Solution(solutionBackendDict.answer_is_exclusive, solutionBackendDict.correct_answer, SubtitledHtmlObjectFactory.createFromBackendDict(solutionBackendDict.explanation));
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Solution['createNew'] = function (
        /* eslint-enable dot-notation */
        answerIsExclusive, correctAnswer, explanationHtml, explanationId) {
            return new Solution(answerIsExclusive, correctAnswer, SubtitledHtmlObjectFactory.createDefault(explanationHtml, explanationId));
        };
        Solution.prototype.getSummary = function (interactionId) {
            var solutionType = (this.answerIsExclusive ? 'The only' : 'One');
            var correctAnswer = null;
            if (interactionId === 'GraphInput') {
                correctAnswer = '[Graph]';
            }
            else if (interactionId === 'MathExpressionInput') {
                correctAnswer = this.correctAnswer.latex;
            }
            else if (interactionId === 'CodeRepl' ||
                interactionId === 'PencilCodeEditor') {
                correctAnswer = this.correctAnswer.code;
            }
            else if (interactionId === 'MusicNotesInput') {
                correctAnswer = '[Music Notes]';
            }
            else if (interactionId === 'LogicProof') {
                correctAnswer = this.correctAnswer.correct;
            }
            else if (interactionId === 'FractionInput') {
                correctAnswer = FractionObjectFactory.fromDict(this.correctAnswer).toString();
            }
            else if (interactionId === 'NumberWithUnits') {
                correctAnswer = NumberWithUnitsObjectFactory.fromDict(this.correctAnswer).toString();
            }
            else {
                correctAnswer = (HtmlEscaperService.objToEscapedJson(this.correctAnswer));
            }
            var explanation = ($filter('convertToPlainText')(this.explanation.getHtml()));
            return (solutionType + ' solution is "' + correctAnswer +
                '". ' + explanation + '.');
        };
        Solution.prototype.setCorrectAnswer = function (correctAnswer) {
            this.correctAnswer = correctAnswer;
        };
        Solution.prototype.setExplanation = function (explanation) {
            this.explanation = explanation;
        };
        Solution.prototype.getOppiaShortAnswerResponseHtml = function (interaction) {
            return {
                prefix: (this.answerIsExclusive ? 'The only' : 'One'),
                answer: ExplorationHtmlFormatterService.getShortAnswerHtml(this.correctAnswer, interaction.id, interaction.customizationArgs)
            };
        };
        Solution.prototype.getOppiaSolutionExplanationResponseHtml =
            function () {
                return this.explanation.getHtml();
            };
        return Solution;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/StatesObjectFactory.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/StatesObjectFactory.ts ***!
  \***************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of State
 * domain objects given a list of backend state dictionaries.
 */
__webpack_require__(/*! domain/state/StateObjectFactory.ts */ "./core/templates/dev/head/domain/state/StateObjectFactory.ts");
angular.module('oppia').factory('StatesObjectFactory', [
    'StateObjectFactory', 'INTERACTION_SPECS',
    function (StateObjectFactory, INTERACTION_SPECS) {
        var States = function (states) {
            this._states = states;
        };
        States.prototype.getState = function (stateName) {
            return angular.copy(this._states[stateName]);
        };
        // TODO(tjiang11): Remove getStateObjects() and replace calls
        // with an object to represent data to be manipulated inside
        // ExplorationDiffService.
        States.prototype.getStateObjects = function () {
            return angular.copy(this._states);
        };
        States.prototype.addState = function (newStateName) {
            this._states[newStateName] = StateObjectFactory.createDefaultState(newStateName);
        };
        States.prototype.setState = function (stateName, stateData) {
            this._states[stateName] = angular.copy(stateData);
        };
        States.prototype.hasState = function (stateName) {
            return this._states.hasOwnProperty(stateName);
        };
        States.prototype.deleteState = function (deleteStateName) {
            delete this._states[deleteStateName];
            for (var otherStateName in this._states) {
                var interaction = this._states[otherStateName].interaction;
                var groups = interaction.answerGroups;
                for (var i = 0; i < groups.length; i++) {
                    if (groups[i].outcome.dest === deleteStateName) {
                        groups[i].outcome.dest = otherStateName;
                    }
                }
                if (interaction.defaultOutcome) {
                    if (interaction.defaultOutcome.dest === deleteStateName) {
                        interaction.defaultOutcome.dest = otherStateName;
                    }
                }
            }
        };
        States.prototype.renameState = function (oldStateName, newStateName) {
            this._states[newStateName] = angular.copy(this._states[oldStateName]);
            this._states[newStateName].setName(newStateName);
            delete this._states[oldStateName];
            for (var otherStateName in this._states) {
                var interaction = this._states[otherStateName].interaction;
                var groups = interaction.answerGroups;
                for (var i = 0; i < groups.length; i++) {
                    if (groups[i].outcome.dest === oldStateName) {
                        groups[i].outcome.dest = newStateName;
                    }
                }
                if (interaction.defaultOutcome) {
                    if (interaction.defaultOutcome.dest === oldStateName) {
                        interaction.defaultOutcome.dest = newStateName;
                    }
                }
            }
        };
        States.prototype.getStateNames = function () {
            return Object.keys(this._states);
        };
        States.prototype.getFinalStateNames = function () {
            var finalStateNames = [];
            for (var stateName in this._states) {
                var interaction = this._states[stateName].interaction;
                if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
                    finalStateNames.push(stateName);
                }
            }
            return finalStateNames;
        };
        States.prototype.getAllVoiceoverLanguageCodes = function () {
            var allAudioLanguageCodes = [];
            for (var stateName in this._states) {
                var state = this._states[stateName];
                var contentIdsList = state.recordedVoiceovers.getAllContentId();
                contentIdsList.forEach(function (contentId) {
                    var audioLanguageCodes = (state.recordedVoiceovers.getVoiceoverLanguageCodes(contentId));
                    audioLanguageCodes.forEach(function (languageCode) {
                        if (allAudioLanguageCodes.indexOf(languageCode) === -1) {
                            allAudioLanguageCodes.push(languageCode);
                        }
                    });
                });
            }
            return allAudioLanguageCodes;
        };
        States.prototype.getAllVoiceovers = function (languageCode) {
            var allAudioTranslations = {};
            for (var stateName in this._states) {
                var state = this._states[stateName];
                allAudioTranslations[stateName] = [];
                var contentIdsList = state.recordedVoiceovers.getAllContentId();
                contentIdsList.forEach(function (contentId) {
                    var audioTranslations = (state.recordedVoiceovers.getBindableVoiceovers(contentId));
                    if (audioTranslations.hasOwnProperty(languageCode)) {
                        allAudioTranslations[stateName].push(audioTranslations[languageCode]);
                    }
                });
            }
            return allAudioTranslations;
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        States['createFromBackendDict'] = function (statesBackendDict) {
            /* eslint-enable dot-notation */
            var stateObjectsDict = {};
            for (var stateName in statesBackendDict) {
                stateObjectsDict[stateName] = StateObjectFactory.createFromBackendDict(stateName, statesBackendDict[stateName]);
            }
            return new States(stateObjectsDict);
        };
        return States;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/WrittenTranslationObjectFactory.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/WrittenTranslationObjectFactory.ts ***!
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of
 * WrittenTranslation domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var WrittenTranslation = /** @class */ (function () {
    function WrittenTranslation(html, needsUpdate) {
        this.html = html;
        this.needsUpdate = needsUpdate;
    }
    WrittenTranslation.prototype.getHtml = function () {
        return this.html;
    };
    WrittenTranslation.prototype.setHtml = function (html) {
        this.html = html;
    };
    WrittenTranslation.prototype.markAsNeedingUpdate = function () {
        this.needsUpdate = true;
    };
    WrittenTranslation.prototype.toggleNeedsUpdateAttribute = function () {
        this.needsUpdate = !this.needsUpdate;
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys which
    // gives tslint errors against underscore_casing in favor of camelCasing.
    WrittenTranslation.prototype.toBackendDict = function () {
        return {
            html: this.html,
            needs_update: this.needsUpdate
        };
    };
    return WrittenTranslation;
}());
exports.WrittenTranslation = WrittenTranslation;
var WrittenTranslationObjectFactory = /** @class */ (function () {
    function WrittenTranslationObjectFactory() {
    }
    WrittenTranslationObjectFactory.prototype.createNew = function (html) {
        return new WrittenTranslation(html, false);
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'translationBackendDict' is a dict with underscore_cased keys
    // which gives tslint errors against underscore_casing in favor of
    // camelCasing.
    WrittenTranslationObjectFactory.prototype.createFromBackendDict = function (translationBackendDict) {
        return new WrittenTranslation(translationBackendDict.html, translationBackendDict.needs_update);
    };
    WrittenTranslationObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], WrittenTranslationObjectFactory);
    return WrittenTranslationObjectFactory;
}());
exports.WrittenTranslationObjectFactory = WrittenTranslationObjectFactory;
angular.module('oppia').factory('WrittenTranslationObjectFactory', static_1.downgradeInjectable(WrittenTranslationObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/WrittenTranslationsObjectFactory.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/WrittenTranslationsObjectFactory.ts ***!
  \****************************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of
 * WrittenTranslations domain objects.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var WrittenTranslationObjectFactory_1 = __webpack_require__(/*! domain/exploration/WrittenTranslationObjectFactory */ "./core/templates/dev/head/domain/exploration/WrittenTranslationObjectFactory.ts");
var WrittenTranslations = /** @class */ (function () {
    function WrittenTranslations(translationsMapping, writtenTranslationObjectFactory) {
        this.translationsMapping = translationsMapping;
        this._writtenTranslationObjectFactory = writtenTranslationObjectFactory;
    }
    WrittenTranslations.prototype.getAllContentId = function () {
        return Object.keys(this.translationsMapping);
    };
    // TODO(#7165): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict whose exact type needs to be
    // found by doing a good research.
    WrittenTranslations.prototype.getWrittenTranslation = function (contentId, langCode) {
        return this.translationsMapping[contentId][langCode];
    };
    WrittenTranslations.prototype.markAllTranslationsAsNeedingUpdate = function (contentId) {
        var languageCodeToWrittenTranslation = (this.translationsMapping[contentId]);
        for (var languageCode in languageCodeToWrittenTranslation) {
            languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
        }
    };
    WrittenTranslations.prototype.getTranslationsLanguageCodes = function (contentId) {
        return Object.keys(this.translationsMapping[contentId]);
    };
    WrittenTranslations.prototype.hasWrittenTranslation = function (contentId, langaugeCode) {
        if (!this.translationsMapping.hasOwnProperty(contentId)) {
            return false;
        }
        return this.getTranslationsLanguageCodes(contentId).indexOf(langaugeCode) !== -1;
    };
    WrittenTranslations.prototype.hasUnflaggedWrittenTranslations = function (contentId) {
        var writtenTranslations = this.translationsMapping[contentId];
        for (var languageCode in writtenTranslations) {
            if (!writtenTranslations[languageCode].needsUpdate) {
                return true;
            }
        }
        return false;
    };
    WrittenTranslations.prototype.addContentId = function (contentId) {
        if (this.translationsMapping.hasOwnProperty(contentId)) {
            throw Error('Trying to add duplicate content id.');
        }
        this.translationsMapping[contentId] = {};
    };
    WrittenTranslations.prototype.deleteContentId = function (contentId) {
        if (!this.translationsMapping.hasOwnProperty(contentId)) {
            throw Error('Unable to find the given content id.');
        }
        delete this.translationsMapping[contentId];
    };
    WrittenTranslations.prototype.addWrittenTranslation = function (contentId, languageCode, html) {
        var writtenTranslations = this.translationsMapping[contentId];
        if (writtenTranslations.hasOwnProperty(languageCode)) {
            throw Error('Trying to add duplicate language code.');
        }
        writtenTranslations[languageCode] = (this._writtenTranslationObjectFactory.createNew(html));
    };
    WrittenTranslations.prototype.updateWrittenTranslationHtml = function (contentId, languageCode, html) {
        var writtenTranslations = this.translationsMapping[contentId];
        if (!writtenTranslations.hasOwnProperty(languageCode)) {
            throw Error('Unable to find the given language code.');
        }
        writtenTranslations[languageCode].setHtml(html);
        // Marking translation updated.
        writtenTranslations[languageCode].needsUpdate = false;
    };
    WrittenTranslations.prototype.toggleNeedsUpdateAttribute = function (contentId, languageCode) {
        var writtenTranslations = this.translationsMapping[contentId];
        writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
    };
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because the return type is a dict with underscore_cased keys which
    // give tslint errors against underscore_casing in favor of camelCasing.
    WrittenTranslations.prototype.toBackendDict = function () {
        var translationsMappingDict = {};
        for (var contentId in this.translationsMapping) {
            var langaugeToWrittenTranslation = this.translationsMapping[contentId];
            var langaugeToWrittenTranslationDict = {};
            Object.keys(langaugeToWrittenTranslation).forEach(function (lang) {
                langaugeToWrittenTranslationDict[lang] = (langaugeToWrittenTranslation[lang].toBackendDict());
            });
            translationsMappingDict[contentId] = langaugeToWrittenTranslationDict;
        }
        return { translations_mapping: translationsMappingDict };
    };
    return WrittenTranslations;
}());
exports.WrittenTranslations = WrittenTranslations;
var WrittenTranslationsObjectFactory = /** @class */ (function () {
    function WrittenTranslationsObjectFactory(writtenTranslationObjectFactory) {
        this.writtenTranslationObjectFactory = writtenTranslationObjectFactory;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'writtenTranslationsDict' is a dict with underscore_cased
    // keys which give tslint errors against underscore_casing in favor of
    // camelCasing.
    WrittenTranslationsObjectFactory.prototype.createFromBackendDict = function (writtenTranslationsDict) {
        var _this = this;
        var translationsMapping = {};
        Object.keys(writtenTranslationsDict.translations_mapping).forEach(function (contentId) {
            translationsMapping[contentId] = {};
            var languageCodeToWrittenTranslationDict = (writtenTranslationsDict.translations_mapping[contentId]);
            Object.keys(languageCodeToWrittenTranslationDict).forEach(function (langCode) {
                translationsMapping[contentId][langCode] = (_this.writtenTranslationObjectFactory.createFromBackendDict(languageCodeToWrittenTranslationDict[langCode]));
            });
        });
        return new WrittenTranslations(translationsMapping, this.writtenTranslationObjectFactory);
    };
    WrittenTranslationsObjectFactory.prototype.createEmpty = function () {
        return new WrittenTranslations({}, this.writtenTranslationObjectFactory);
    };
    var _a;
    WrittenTranslationsObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof WrittenTranslationObjectFactory_1.WrittenTranslationObjectFactory !== "undefined" && WrittenTranslationObjectFactory_1.WrittenTranslationObjectFactory) === "function" ? _a : Object])
    ], WrittenTranslationsObjectFactory);
    return WrittenTranslationsObjectFactory;
}());
exports.WrittenTranslationsObjectFactory = WrittenTranslationsObjectFactory;
angular.module('oppia').factory('WrittenTranslationsObjectFactory', static_1.downgradeInjectable(WrittenTranslationsObjectFactory));


/***/ }),

/***/ "./core/templates/dev/head/domain/state/StateObjectFactory.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/domain/state/StateObjectFactory.ts ***!
  \********************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of State
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/RecordedVoiceoversObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/RecordedVoiceoversObjectFactory.ts");
__webpack_require__(/*! domain/exploration/InteractionObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/InteractionObjectFactory.ts");
__webpack_require__(/*! domain/exploration/ParamChangesObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ParamChangesObjectFactory.ts");
__webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
__webpack_require__(/*! domain/exploration/WrittenTranslationsObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/WrittenTranslationsObjectFactory.ts");
angular.module('oppia').factory('StateObjectFactory', [
    'InteractionObjectFactory', 'ParamChangesObjectFactory',
    'RecordedVoiceoversObjectFactory', 'SubtitledHtmlObjectFactory',
    'WrittenTranslationsObjectFactory', 'NEW_STATE_TEMPLATE', function (InteractionObjectFactory, ParamChangesObjectFactory, RecordedVoiceoversObjectFactory, SubtitledHtmlObjectFactory, WrittenTranslationsObjectFactory, NEW_STATE_TEMPLATE) {
        var State = function (name, classifierModelId, content, interaction, paramChanges, recordedVoiceovers, solicitAnswerDetails, writtenTranslations) {
            this.name = name;
            this.classifierModelId = classifierModelId;
            this.content = content;
            this.interaction = interaction;
            this.paramChanges = paramChanges;
            this.recordedVoiceovers = recordedVoiceovers;
            this.solicitAnswerDetails = solicitAnswerDetails;
            this.writtenTranslations = writtenTranslations;
        };
        State.prototype.setName = function (newName) {
            this.name = newName;
        };
        // Instance methods.
        State.prototype.toBackendDict = function () {
            return {
                content: this.content.toBackendDict(),
                classifier_model_id: this.classifierModelId,
                interaction: this.interaction.toBackendDict(),
                param_changes: this.paramChanges.map(function (paramChange) {
                    return paramChange.toBackendDict();
                }),
                recorded_voiceovers: this.recordedVoiceovers.toBackendDict(),
                solicit_answer_details: this.solicitAnswerDetails,
                written_translations: this.writtenTranslations.toBackendDict()
            };
        };
        State.prototype.copy = function (otherState) {
            this.name = otherState.name;
            this.classifierModelId = otherState.classifierModelId;
            this.content = angular.copy(otherState.content);
            this.interaction.copy(otherState.interaction);
            this.paramChanges = angular.copy(otherState.paramChanges);
            this.recordedVoiceovers = angular.copy(otherState.recordedVoiceovers);
            this.solicitAnswerDetails = angular.copy(otherState.solicitAnswerDetails);
            this.writtenTranslations = angular.copy(otherState.writtenTranslations);
        };
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        State['createDefaultState'] = function (newStateName) {
            /* eslint-enable dot-notation */
            var newStateTemplate = angular.copy(NEW_STATE_TEMPLATE);
            var newState = this.createFromBackendDict(newStateName, {
                classifier_model_id: newStateTemplate.classifier_model_id,
                content: newStateTemplate.content,
                interaction: newStateTemplate.interaction,
                param_changes: newStateTemplate.param_changes,
                recorded_voiceovers: newStateTemplate.recorded_voiceovers,
                solicit_answer_details: newStateTemplate.solicit_answer_details,
                written_translations: newStateTemplate.written_translations
            });
            newState.interaction.defaultOutcome.dest = newStateName;
            return newState;
        };
        // Static class methods. Note that "this" is not available in
        // static contexts.
        // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        State['createFromBackendDict'] = function (stateName, stateDict) {
            /* eslint-enable dot-notation */
            return new State(stateName, stateDict.classifier_model_id, SubtitledHtmlObjectFactory.createFromBackendDict(stateDict.content), InteractionObjectFactory.createFromBackendDict(stateDict.interaction), ParamChangesObjectFactory.createFromBackendList(stateDict.param_changes), RecordedVoiceoversObjectFactory.createFromBackendDict(stateDict.recorded_voiceovers), stateDict.solicit_answer_details, WrittenTranslationsObjectFactory.createFromBackendDict(stateDict.written_translations));
        };
        return State;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/summary/ExplorationSummaryBackendApiService.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/summary/ExplorationSummaryBackendApiService.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Service to retrieve information about exploration summaries
 * from the backend.
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ValidatorsService.ts */ "./core/templates/dev/head/services/ValidatorsService.ts");
angular.module('oppia').factory('ExplorationSummaryBackendApiService', [
    '$http', '$q', 'AlertsService',
    'ValidatorsService', 'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE',
    function ($http, $q, AlertsService, ValidatorsService, EXPLORATION_SUMMARY_DATA_URL_TEMPLATE) {
        var _fetchExpSummaries = function (explorationIds, includePrivateExplorations, successCallback, errorCallback) {
            if (!explorationIds.every(ValidatorsService.isValidExplorationId)) {
                AlertsService.addWarning('Please enter a valid exploration ID.');
                var returnValue = [];
                for (var i = 0; i < explorationIds.length; i++) {
                    returnValue.push(null);
                }
                return $q.resolve(returnValue);
            }
            var explorationSummaryDataUrl = EXPLORATION_SUMMARY_DATA_URL_TEMPLATE;
            $http.get(explorationSummaryDataUrl, {
                params: {
                    stringified_exp_ids: JSON.stringify(explorationIds),
                    include_private_explorations: JSON.stringify(includePrivateExplorations)
                }
            }).then(function (response) {
                var summaries = angular.copy(response.data.summaries);
                if (successCallback) {
                    if (summaries === null) {
                        var summariesError = ('Summaries fetched are null for explorationIds: ' + explorationIds);
                        throw new Error(summariesError);
                    }
                    successCallback(summaries);
                }
            }, function (errorResponse) {
                if (errorCallback) {
                    errorCallback(errorResponse.data);
                }
            });
        };
        return {
            /**
             * Fetches a list of public exploration summaries and private
             * exploration summaries for which the current user has access from the
             * backend for each exploration ID provided. The provided list of
             * exploration summaries are in the same order as input exploration IDs
             * list, though some may be missing (if the exploration doesn't exist or
             * or the user does not have access to it).
             */
            loadPublicAndPrivateExplorationSummaries: function (explorationIds) {
                return $q(function (resolve, reject) {
                    _fetchExpSummaries(explorationIds, true, resolve, reject);
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/camel-case-to-hyphens.filter.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/camel-case-to-hyphens.filter.ts ***!
  \************************************************************************************************/
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
 * @fileoverview CamelCaseToHyphens filter for Oppia.
 */
angular.module('oppia').filter('camelCaseToHyphens', [function () {
        return function (input) {
            var result = input.replace(/([a-z])?([A-Z])/g, '$1-$2').toLowerCase();
            if (result[0] === '-') {
                result = result.substring(1);
            }
            return result;
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts ***!
  \************************************************************************************************/
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
 * @fileoverview ConvertToPlainText filter for Oppia.
 */
angular.module('oppia').filter('convertToPlainText', [function () {
        return function (input) {
            var strippedText = input.replace(/(<([^>]+)>)/ig, '');
            strippedText = strippedText.replace(/&nbsp;/ig, ' ');
            strippedText = strippedText.replace(/&quot;/ig, '');
            var trimmedText = strippedText.trim();
            if (trimmedText.length === 0) {
                return strippedText;
            }
            else {
                return trimmedText;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview NormalizeWhitespace filter for Oppia.
 */
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
// Filter that removes whitespace from the beginning and end of a string, and
// replaces interior whitespace with a single space character.
angular.module('oppia').filter('normalizeWhitespace', [
    'UtilsService', function (UtilsService) {
        return function (input) {
            if (UtilsService.isString(input)) {
                // Remove whitespace from the beginning and end of the string, and
                // replace interior whitespace with a single space character.
                input = input.trim();
                input = input.replace(/\s{2,}/g, ' ');
                return input;
            }
            else {
                return input;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ajs.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ajs.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Constants for the collection editor page.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var collection_editor_page_constants_1 = __webpack_require__(/*! pages/collection-editor-page/collection-editor-page.constants */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ts");
// TODO(bhenning): These constants should be provided by the backend.
angular.module('oppia').constant('EDITABLE_COLLECTION_DATA_URL_TEMPLATE', collection_editor_page_constants_1.CollectionEditorPageConstants.EDITABLE_COLLECTION_DATA_URL_TEMPLATE);
angular.module('oppia').constant('COLLECTION_RIGHTS_URL_TEMPLATE', collection_editor_page_constants_1.CollectionEditorPageConstants.COLLECTION_RIGHTS_URL_TEMPLATE);
angular.module('oppia').constant('COLLECTION_TITLE_INPUT_FOCUS_LABEL', collection_editor_page_constants_1.CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL);
angular.module('oppia').constant('SEARCH_EXPLORATION_URL_TEMPLATE', collection_editor_page_constants_1.CollectionEditorPageConstants.SEARCH_EXPLORATION_URL_TEMPLATE);
angular.module('oppia').constant('EVENT_COLLECTION_INITIALIZED', collection_editor_page_constants_1.CollectionEditorPageConstants.EVENT_COLLECTION_INITIALIZED);
angular.module('oppia').constant('EVENT_COLLECTION_REINITIALIZED', collection_editor_page_constants_1.CollectionEditorPageConstants.EVENT_COLLECTION_REINITIALIZED);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Constants for the collection editor page.
 */
// TODO(bhenning): These constants should be provided by the backend.
var CollectionEditorPageConstants = /** @class */ (function () {
    function CollectionEditorPageConstants() {
    }
    CollectionEditorPageConstants.EDITABLE_COLLECTION_DATA_URL_TEMPLATE = '/collection_editor_handler/data/<collection_id>';
    CollectionEditorPageConstants.COLLECTION_RIGHTS_URL_TEMPLATE = '/collection_editor_handler/rights/<collection_id>';
    CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL = 'collectionTitleInputFocusLabel';
    CollectionEditorPageConstants.SEARCH_EXPLORATION_URL_TEMPLATE = '/exploration/metadata_search?q=<query>';
    CollectionEditorPageConstants.EVENT_COLLECTION_INITIALIZED = 'collectionInitialized';
    CollectionEditorPageConstants.EVENT_COLLECTION_REINITIALIZED = 'collectionReinitialized';
    return CollectionEditorPageConstants;
}());
exports.CollectionEditorPageConstants = CollectionEditorPageConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.directive.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.directive.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Primary directive for the collection editor page.
 */
__webpack_require__(/*! pages/collection-editor-page/editor-tab/collection-editor-tab.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-editor-tab.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/history-tab/collection-history-tab.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/history-tab/collection-history-tab.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/settings-tab/collection-settings-tab.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-settings-tab.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/statistics-tab/collection-statistics-tab.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/statistics-tab/collection-statistics-tab.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! services/PageTitleService.ts */ "./core/templates/dev/head/services/PageTitleService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! pages/collection-editor-page/collection-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ajs.ts");
__webpack_require__(/*! pages/interaction-specs.constants.ajs.ts */ "./core/templates/dev/head/pages/interaction-specs.constants.ajs.ts");
angular.module('oppia').directive('collectionEditorPage', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/collection-editor-page.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', 'CollectionEditorStateService', 'PageTitleService',
                'RouterService', 'UrlService', 'EVENT_COLLECTION_INITIALIZED',
                'EVENT_COLLECTION_REINITIALIZED',
                function ($scope, CollectionEditorStateService, PageTitleService, RouterService, UrlService, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED) {
                    var ctrl = this;
                    ctrl.getActiveTabName = RouterService.getActiveTabName;
                    // Load the collection to be edited.
                    CollectionEditorStateService.loadCollection(UrlService.getCollectionIdFromEditorUrl());
                    var setTitle = function () {
                        var title = (CollectionEditorStateService.getCollection().getTitle());
                        if (title) {
                            PageTitleService.setPageTitle(title + ' - Oppia Editor');
                        }
                        else {
                            PageTitleService.setPageTitle('Untitled Collection - Oppia Editor');
                        }
                    };
                    $scope.$on(EVENT_COLLECTION_INITIALIZED, setTitle);
                    $scope.$on(EVENT_COLLECTION_REINITIALIZED, setTitle);
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.module.ts ***!
  \***********************************************************************************************/
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Module for the collection editor page.
 */
__webpack_require__(/*! core-js/es7/reflect */ "./node_modules/core-js/es7/reflect.js");
__webpack_require__(/*! zone.js */ "./node_modules/zone.js/dist/zone.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var platform_browser_1 = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var http_1 = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
// This component is needed to force-bootstrap Angular at the beginning of the
// app.
var ServiceBootstrapComponent = /** @class */ (function () {
    function ServiceBootstrapComponent() {
    }
    ServiceBootstrapComponent = __decorate([
        core_1.Component({
            selector: 'service-bootstrap',
            template: ''
        })
    ], ServiceBootstrapComponent);
    return ServiceBootstrapComponent;
}());
exports.ServiceBootstrapComponent = ServiceBootstrapComponent;
var app_constants_1 = __webpack_require__(/*! app.constants */ "./core/templates/dev/head/app.constants.ts");
var collection_domain_constants_1 = __webpack_require__(/*! domain/collection/collection-domain.constants */ "./core/templates/dev/head/domain/collection/collection-domain.constants.ts");
var editor_domain_constants_1 = __webpack_require__(/*! domain/editor/editor-domain.constants */ "./core/templates/dev/head/domain/editor/editor-domain.constants.ts");
var interactions_extension_constants_1 = __webpack_require__(/*! interactions/interactions-extension.constants */ "./extensions/interactions/interactions-extension.constants.ts");
var objects_domain_constants_1 = __webpack_require__(/*! domain/objects/objects-domain.constants */ "./core/templates/dev/head/domain/objects/objects-domain.constants.ts");
var services_constants_1 = __webpack_require__(/*! services/services.constants */ "./core/templates/dev/head/services/services.constants.ts");
var collection_editor_page_constants_1 = __webpack_require__(/*! pages/collection-editor-page/collection-editor-page.constants */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ts");
var CollectionEditorPageModule = /** @class */ (function () {
    function CollectionEditorPageModule() {
    }
    // Empty placeholder method to satisfy the `Compiler`.
    CollectionEditorPageModule.prototype.ngDoBootstrap = function () { };
    CollectionEditorPageModule = __decorate([
        core_1.NgModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule
            ],
            declarations: [
                ServiceBootstrapComponent
            ],
            entryComponents: [
                ServiceBootstrapComponent
            ],
            providers: [
                app_constants_1.AppConstants,
                collection_domain_constants_1.CollectionDomainConstants,
                editor_domain_constants_1.EditorDomainConstants,
                interactions_extension_constants_1.InteractionsExtensionsConstants,
                objects_domain_constants_1.ObjectsDomainConstants,
                services_constants_1.ServicesConstants,
                collection_editor_page_constants_1.CollectionEditorPageConstants
            ]
        })
    ], CollectionEditorPageModule);
    return CollectionEditorPageModule;
}());
var platform_browser_dynamic_1 = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
var static_2 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var bootstrapFn = function (extraProviders) {
    var platformRef = platform_browser_dynamic_1.platformBrowserDynamic(extraProviders);
    return platformRef.bootstrapModule(CollectionEditorPageModule);
};
var downgradedModule = static_2.downgradeModule(bootstrapFn);
angular.module('oppia', [
    'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
    'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
    'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
    'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
    downgradedModule
])
    // This directive is the downgraded version of the Angular component to
    // bootstrap the Angular 8.
    .directive('serviceBootstrap', static_1.downgradeComponent({
    component: ServiceBootstrapComponent
}));


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.scripts.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.scripts.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Directives required in collection editor.
 */
// The module needs to be loaded before everything else since it defines the
// main module the elements are attached to.
__webpack_require__(/*! pages/collection-editor-page/collection-editor-page.module.ts */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.module.ts");
__webpack_require__(/*! App.ts */ "./core/templates/dev/head/App.ts");
__webpack_require__(/*! base_components/BaseContentDirective.ts */ "./core/templates/dev/head/base_components/BaseContentDirective.ts");
__webpack_require__(/*! pages/collection-editor-page/collection-editor-page.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/navbar/collection-editor-navbar-breadcrumb.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/navbar/collection-editor-navbar-breadcrumb.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/navbar/collection-editor-navbar.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/navbar/collection-editor-navbar.directive.ts");


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-editor-tab.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-editor-tab.directive.ts ***!
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
 * @fileoverview Controller for the main tab of the collection editor.
 */
__webpack_require__(/*! pages/collection-editor-page/editor-tab/collection-node-creator.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-node-creator.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/editor-tab/collection-node-editor.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-node-editor.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-linearizer.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-linearizer.service.ts");
angular.module('oppia').directive('collectionEditorTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/editor-tab/' +
                'collection-editor-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'CollectionEditorStateService', 'CollectionLinearizerService',
                function (CollectionEditorStateService, CollectionLinearizerService) {
                    var ctrl = this;
                    ctrl.hasLoadedCollection = (CollectionEditorStateService.hasLoadedCollection);
                    ctrl.collection = CollectionEditorStateService.getCollection();
                    // Returns a list of collection nodes which represents a valid linear
                    // path through the collection.
                    ctrl.getLinearlySortedNodes = function () {
                        return (CollectionLinearizerService.getCollectionNodesInPlayableOrder(ctrl.collection));
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-node-creator.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-node-creator.directive.ts ***!
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
 * @fileoverview Directive for creating a new collection node.
 */
__webpack_require__(/*! domain/collection/CollectionNodeObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionNodeObjectFactory.ts");
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/collection/SearchExplorationsBackendApiService.ts */ "./core/templates/dev/head/domain/collection/SearchExplorationsBackendApiService.ts");
__webpack_require__(/*! domain/summary/ExplorationSummaryBackendApiService.ts */ "./core/templates/dev/head/domain/summary/ExplorationSummaryBackendApiService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! filters/string-utility-filters/normalize-whitespace.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-linearizer.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-linearizer.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/ValidatorsService.ts */ "./core/templates/dev/head/services/ValidatorsService.ts");
angular.module('oppia').directive('collectionNodeCreator', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/editor-tab/' +
                'collection-node-creator.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$http', '$window', '$filter', 'AlertsService',
                'ValidatorsService', 'CollectionEditorStateService',
                'CollectionLinearizerService', 'CollectionUpdateService',
                'CollectionNodeObjectFactory', 'ExplorationSummaryBackendApiService',
                'SearchExplorationsBackendApiService', 'SiteAnalyticsService',
                'INVALID_NAME_CHARS',
                function ($http, $window, $filter, AlertsService, ValidatorsService, CollectionEditorStateService, CollectionLinearizerService, CollectionUpdateService, CollectionNodeObjectFactory, ExplorationSummaryBackendApiService, SearchExplorationsBackendApiService, SiteAnalyticsService, INVALID_NAME_CHARS) {
                    var ctrl = this;
                    ctrl.collection = CollectionEditorStateService.getCollection();
                    ctrl.newExplorationId = '';
                    ctrl.newExplorationTitle = '';
                    ctrl.searchQueryHasError = false;
                    var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';
                    /**
                     * Fetches a list of exploration metadata dicts from backend, given
                     * a search query. It then extracts the title and id of the
                     * exploration to prepare typeahead options.
                     */
                    ctrl.fetchTypeaheadResults = function (searchQuery) {
                        if (isValidSearchQuery(searchQuery)) {
                            ctrl.searchQueryHasError = false;
                            return SearchExplorationsBackendApiService.fetchExplorations(searchQuery).then(function (explorationMetadataBackendDict) {
                                var options = [];
                                explorationMetadataBackendDict.collection_node_metadata_list.
                                    map(function (item) {
                                    if (!ctrl.collection.containsCollectionNode(item.id)) {
                                        options.push(item.title + ' (' + item.id + ')');
                                    }
                                });
                                return options;
                            }, function () {
                                AlertsService.addWarning('There was an error when searching for matching ' +
                                    'explorations.');
                            });
                        }
                        else {
                            ctrl.searchQueryHasError = true;
                        }
                    };
                    var isValidSearchQuery = function (searchQuery) {
                        // Allow underscores because they are allowed in exploration IDs.
                        var INVALID_SEARCH_CHARS = (INVALID_NAME_CHARS.filter(function (item) {
                            return item !== '_';
                        }));
                        for (var i = 0; i < INVALID_SEARCH_CHARS.length; i++) {
                            if (searchQuery.indexOf(INVALID_SEARCH_CHARS[i]) !== -1) {
                                return false;
                            }
                        }
                        return true;
                    };
                    var addExplorationToCollection = function (newExplorationId) {
                        if (!newExplorationId) {
                            AlertsService.addWarning('Cannot add an empty exploration ID.');
                            return;
                        }
                        if (ctrl.collection.containsCollectionNode(newExplorationId)) {
                            AlertsService.addWarning('There is already an exploration in this collection ' +
                                'with that id.');
                            return;
                        }
                        ExplorationSummaryBackendApiService
                            .loadPublicAndPrivateExplorationSummaries([newExplorationId])
                            .then(function (summaries) {
                            var summaryBackendObject = null;
                            if (summaries.length !== 0 &&
                                summaries[0].id === newExplorationId) {
                                summaryBackendObject = summaries[0];
                            }
                            if (summaryBackendObject) {
                                CollectionLinearizerService.appendCollectionNode(ctrl.collection, newExplorationId, summaryBackendObject);
                            }
                            else {
                                AlertsService.addWarning('That exploration does not exist or you do not have edit ' +
                                    'access to it.');
                            }
                        }, function () {
                            AlertsService.addWarning('There was an error while adding an exploration to the ' +
                                'collection.');
                        });
                    };
                    var convertTypeaheadToExplorationId = function (typeaheadOption) {
                        var matchResults = typeaheadOption.match(/\((.*?)\)$/);
                        if (matchResults === null) {
                            return typeaheadOption;
                        }
                        return matchResults[1];
                    };
                    // Creates a new exploration, then adds it to the collection.
                    ctrl.createNewExploration = function () {
                        var title = $filter('normalizeWhitespace')(ctrl.newExplorationTitle);
                        if (!ValidatorsService.isValidExplorationTitle(title, true)) {
                            return;
                        }
                        // Create a new exploration with the given title.
                        $http.post('/contributehandler/create_new', {
                            title: title
                        }).then(function (response) {
                            ctrl.newExplorationTitle = '';
                            var newExplorationId = response.data.explorationId;
                            SiteAnalyticsService
                                .registerCreateNewExplorationInCollectionEvent(newExplorationId);
                            addExplorationToCollection(newExplorationId);
                        });
                    };
                    // Checks whether the user has left a '#' at the end of their ID
                    // by accident (which can happen if it's being copy/pasted from the
                    // editor page.
                    ctrl.isMalformedId = function (typedExplorationId) {
                        return (typedExplorationId &&
                            typedExplorationId.lastIndexOf('#') ===
                                typedExplorationId.length - 1);
                    };
                    ctrl.addExploration = function () {
                        addExplorationToCollection(convertTypeaheadToExplorationId(ctrl.newExplorationId));
                        ctrl.newExplorationId = '';
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-node-editor.directive.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/editor-tab/collection-node-editor.directive.ts ***!
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
 * @fileoverview Directive for displaying and editing a collection node. This
 * directive allows creators to shift nodes to left or right
 * and also delete the collection node represented by this directive.
 */
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-linearizer.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-linearizer.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').directive('collectionNodeEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {
                getCollectionNode: '&collectionNode',
                getLinearIndex: '&linearIndex'
            },
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/editor-tab/' +
                'collection-node-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'CollectionEditorStateService', 'CollectionLinearizerService',
                'CollectionUpdateService', 'AlertsService',
                function (CollectionEditorStateService, CollectionLinearizerService, CollectionUpdateService, AlertsService) {
                    var ctrl = this;
                    ctrl.collection = CollectionEditorStateService.getCollection();
                    // Deletes this collection node from the frontend collection
                    // object and also updates the changelist.
                    ctrl.deleteNode = function () {
                        var explorationId = ctrl.getCollectionNode().getExplorationId();
                        if (!CollectionLinearizerService.removeCollectionNode(ctrl.collection, explorationId)) {
                            AlertsService.fatalWarning('Internal collection editor error. Could not delete ' +
                                'exploration by ID: ' + explorationId);
                        }
                    };
                    // Shifts this collection node left in the linearized list of the
                    // collection, if possible.
                    ctrl.shiftNodeLeft = function () {
                        var explorationId = ctrl.getCollectionNode().getExplorationId();
                        if (!CollectionLinearizerService.shiftNodeLeft(ctrl.collection, explorationId)) {
                            AlertsService.fatalWarning('Internal collection editor error. Could not shift node left ' +
                                'with ID: ' + explorationId);
                        }
                    };
                    // Shifts this collection node right in the linearized list of the
                    // collection, if possible.
                    ctrl.shiftNodeRight = function () {
                        var explorationId = ctrl.getCollectionNode().getExplorationId();
                        if (!CollectionLinearizerService.shiftNodeRight(ctrl.collection, explorationId)) {
                            AlertsService.fatalWarning('Internal collection editor error. Could not shift node ' +
                                'right with ID: ' + explorationId);
                        }
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/history-tab/collection-history-tab.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/history-tab/collection-history-tab.directive.ts ***!
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
 * @fileoverview Controller for the history tab of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('collectionHistoryTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/history-tab/' +
                'collection-history-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/navbar/collection-editor-navbar-breadcrumb.directive.ts":
/*!**********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/navbar/collection-editor-navbar-breadcrumb.directive.ts ***!
  \**********************************************************************************************************************/
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
 * @fileoverview Controller for the navbar breadcrumb of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/router.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/router.service.ts");
__webpack_require__(/*! services/stateful/FocusManagerService.ts */ "./core/templates/dev/head/services/stateful/FocusManagerService.ts");
// TODO(bhenning): After the navbar is moved to a directive, this directive
// should be updated to say 'Loading...' if the collection editor's controller
// is not yet finished loading the collection. Also, this directive should
// support both displaying the current title of the collection (or untitled if
// it does not yet have one) or setting a new title in the case of an untitled
// collection.
angular.module('oppia').directive('collectionEditorNavbarBreadcrumb', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/navbar/' +
                'collection-editor-navbar-breadcrumb.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'RouterService', 'CollectionEditorStateService',
                'FocusManagerService', 'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
                function (RouterService, CollectionEditorStateService, FocusManagerService, COLLECTION_TITLE_INPUT_FOCUS_LABEL) {
                    var ctrl = this;
                    var _TAB_NAMES_TO_HUMAN_READABLE_NAMES = {
                        main: 'Edit',
                        preview: 'Preview',
                        settings: 'Settings',
                        stats: 'Statistics',
                        improvements: 'Improvements',
                        history: 'History',
                    };
                    ctrl.collection = CollectionEditorStateService.getCollection();
                    ctrl.getCurrentTabName = function () {
                        return _TAB_NAMES_TO_HUMAN_READABLE_NAMES[RouterService.getActiveTabName()];
                    };
                    ctrl.editCollectionTitle = function () {
                        RouterService.navigateToSettingsTab();
                        FocusManagerService.setFocus(COLLECTION_TITLE_INPUT_FOCUS_LABEL);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/navbar/collection-editor-navbar.directive.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/navbar/collection-editor-navbar.directive.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Directive for the navbar of the collection editor.
 */
__webpack_require__(/*! components/forms/custom-forms-directives/select2-dropdown.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts");
__webpack_require__(/*! components/common-layout-directives/common-elements/loading-dots.directive.ts */ "./core/templates/dev/head/components/common-layout-directives/common-elements/loading-dots.directive.ts");
__webpack_require__(/*! domain/collection/CollectionRightsBackendApiService.ts */ "./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts");
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/collection/CollectionValidationService.ts */ "./core/templates/dev/head/domain/collection/CollectionValidationService.ts");
__webpack_require__(/*! domain/collection/EditableCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/router.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/router.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
angular.module('oppia').directive('collectionEditorNavbar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/navbar/' +
                'collection-editor-navbar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$uibModal', 'AlertsService', 'RouterService',
                'UndoRedoService', 'CollectionEditorStateService',
                'CollectionValidationService',
                'CollectionRightsBackendApiService',
                'EditableCollectionBackendApiService', 'UrlService',
                'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
                'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
                function ($scope, $uibModal, AlertsService, RouterService, UndoRedoService, CollectionEditorStateService, CollectionValidationService, CollectionRightsBackendApiService, EditableCollectionBackendApiService, UrlService, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
                    var ctrl = this;
                    ctrl.collectionId = UrlService.getCollectionIdFromEditorUrl();
                    ctrl.collection = CollectionEditorStateService.getCollection();
                    ctrl.collectionRights = (CollectionEditorStateService.getCollectionRights());
                    ctrl.isLoadingCollection = (CollectionEditorStateService.isLoadingCollection);
                    ctrl.validationIssues = [];
                    ctrl.isSaveInProgress = (CollectionEditorStateService.isSavingCollection);
                    ctrl.getActiveTabName = RouterService.getActiveTabName;
                    ctrl.selectMainTab = RouterService.navigateToMainTab;
                    ctrl.selectPreviewTab = RouterService.navigateToPreviewTab;
                    ctrl.selectSettingsTab = RouterService.navigateToSettingsTab;
                    ctrl.selectStatsTab = RouterService.navigateToStatsTab;
                    ctrl.selectHistoryTab = RouterService.navigateToHistoryTab;
                    var _validateCollection = function () {
                        if (ctrl.collectionRights.isPrivate()) {
                            ctrl.validationIssues = (CollectionValidationService
                                .findValidationIssuesForPrivateCollection(ctrl.collection));
                        }
                        else {
                            ctrl.validationIssues = (CollectionValidationService
                                .findValidationIssuesForPublicCollection(ctrl.collection));
                        }
                    };
                    var _publishCollection = function () {
                        // TODO(bhenning): This also needs a confirmation of destructive
                        // action since it is not reversible.
                        CollectionRightsBackendApiService.setCollectionPublic(ctrl.collectionId, ctrl.collection.getVersion()).then(function () {
                            ctrl.collectionRights.setPublic();
                            CollectionEditorStateService.setCollectionRights(ctrl.collectionRights);
                        });
                    };
                    $scope.$on(EVENT_COLLECTION_INITIALIZED, _validateCollection);
                    $scope.$on(EVENT_COLLECTION_REINITIALIZED, _validateCollection);
                    $scope.$on(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED, _validateCollection);
                    ctrl.getWarningsCount = function () {
                        return ctrl.validationIssues.length;
                    };
                    ctrl.getChangeListCount = function () {
                        return UndoRedoService.getChangeCount();
                    };
                    ctrl.isCollectionSaveable = function () {
                        return (ctrl.getChangeListCount() > 0 &&
                            ctrl.validationIssues.length === 0);
                    };
                    ctrl.isCollectionPublishable = function () {
                        return (ctrl.collectionRights.isPrivate() &&
                            ctrl.getChangeListCount() === 0 &&
                            ctrl.validationIssues.length === 0);
                    };
                    ctrl.saveChanges = function () {
                        var isPrivate = ctrl.collectionRights.isPrivate();
                        var modalInstance = $uibModal.open({
                            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/templates/' +
                                'collection-editor-save-modal.directive.html'),
                            backdrop: true,
                            controller: [
                                '$scope', '$uibModalInstance',
                                function ($scope, $uibModalInstance) {
                                    $scope.isCollectionPrivate = isPrivate;
                                    $scope.save = function (commitMessage) {
                                        $uibModalInstance.close(commitMessage);
                                    };
                                    $scope.cancel = function () {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                }
                            ]
                        });
                        modalInstance.result.then(function (commitMessage) {
                            CollectionEditorStateService.saveCollection(commitMessage);
                        });
                    };
                    ctrl.publishCollection = function () {
                        var additionalMetadataNeeded = (!ctrl.collection.getTitle() ||
                            !ctrl.collection.getObjective() ||
                            !ctrl.collection.getCategory());
                        if (additionalMetadataNeeded) {
                            $uibModal.open({
                                bindToController: {},
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/templates/' +
                                    'collection-editor-pre-publish-modal.directive.html'),
                                backdrop: true,
                                controllerAs: '$ctrl',
                                controller: [
                                    '$uibModalInstance', 'CollectionEditorStateService',
                                    'CollectionUpdateService', 'ALL_CATEGORIES',
                                    function ($uibModalInstance, CollectionEditorStateService, CollectionUpdateService, ALL_CATEGORIES) {
                                        var ctrl = this;
                                        var collection = (CollectionEditorStateService.getCollection());
                                        ctrl.requireTitleToBeSpecified = !collection.getTitle();
                                        ctrl.requireObjectiveToBeSpecified = (!collection.getObjective());
                                        ctrl.requireCategoryToBeSpecified = (!collection.getCategory());
                                        ctrl.newTitle = collection.getTitle();
                                        ctrl.newObjective = collection.getObjective();
                                        ctrl.newCategory = collection.getCategory();
                                        ctrl.CATEGORY_LIST_FOR_SELECT2 = [];
                                        for (var i = 0; i < ALL_CATEGORIES.length; i++) {
                                            ctrl.CATEGORY_LIST_FOR_SELECT2.push({
                                                id: ALL_CATEGORIES[i],
                                                text: ALL_CATEGORIES[i]
                                            });
                                        }
                                        ctrl.isSavingAllowed = function () {
                                            return Boolean(ctrl.newTitle && ctrl.newObjective &&
                                                ctrl.newCategory);
                                        };
                                        ctrl.save = function () {
                                            if (!ctrl.newTitle) {
                                                AlertsService.addWarning('Please specify a title');
                                                return;
                                            }
                                            if (!ctrl.newObjective) {
                                                AlertsService.addWarning('Please specify an objective');
                                                return;
                                            }
                                            if (!ctrl.newCategory) {
                                                AlertsService.addWarning('Please specify a category');
                                                return;
                                            }
                                            // Record any fields that have changed.
                                            var metadataList = [];
                                            if (ctrl.newTitle !== collection.getTitle()) {
                                                metadataList.push('title');
                                                CollectionUpdateService.setCollectionTitle(collection, ctrl.newTitle);
                                            }
                                            if (ctrl.newObjective !== collection.getObjective()) {
                                                metadataList.push('objective');
                                                CollectionUpdateService.setCollectionObjective(collection, ctrl.newObjective);
                                            }
                                            if (ctrl.newCategory !== collection.getCategory()) {
                                                metadataList.push('category');
                                                CollectionUpdateService.setCollectionCategory(collection, ctrl.newCategory);
                                            }
                                            $uibModalInstance.close(metadataList);
                                        };
                                        ctrl.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                    }
                                ]
                            }).result.then(function (metadataList) {
                                var commitMessage = ('Add metadata: ' + metadataList.join(', ') + '.');
                                CollectionEditorStateService.saveCollection(commitMessage, _publishCollection);
                            });
                        }
                        else {
                            _publishCollection();
                        }
                    };
                    // Unpublish the collection. Will only show up if the collection is
                    // public and the user has access to the collection.
                    ctrl.unpublishCollection = function () {
                        CollectionRightsBackendApiService.setCollectionPrivate(ctrl.collectionId, ctrl.collection.getVersion()).then(function () {
                            ctrl.collectionRights.setPrivate();
                            CollectionEditorStateService.setCollectionRights(ctrl.collectionRights);
                        }, function () {
                            AlertsService.addWarning('There was an error when unpublishing the collection.');
                        });
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */
__webpack_require__(/*! domain/collection/CollectionObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionObjectFactory.ts");
__webpack_require__(/*! domain/collection/CollectionRightsBackendApiService.ts */ "./core/templates/dev/head/domain/collection/CollectionRightsBackendApiService.ts");
__webpack_require__(/*! domain/collection/CollectionRightsObjectFactory.ts */ "./core/templates/dev/head/domain/collection/CollectionRightsObjectFactory.ts");
__webpack_require__(/*! domain/collection/EditableCollectionBackendApiService.ts */ "./core/templates/dev/head/domain/collection/EditableCollectionBackendApiService.ts");
__webpack_require__(/*! domain/editor/undo_redo/UndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/collection-editor-page/collection-editor-page.constants.ajs.ts */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.constants.ajs.ts");
angular.module('oppia').factory('CollectionEditorStateService', [
    '$rootScope', 'AlertsService', 'CollectionObjectFactory',
    'CollectionRightsBackendApiService', 'CollectionRightsObjectFactory',
    'EditableCollectionBackendApiService', 'UndoRedoService',
    'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
    function ($rootScope, AlertsService, CollectionObjectFactory, CollectionRightsBackendApiService, CollectionRightsObjectFactory, EditableCollectionBackendApiService, UndoRedoService, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED) {
        var _collection = CollectionObjectFactory.createEmptyCollection();
        var _collectionRights = (CollectionRightsObjectFactory.createEmptyCollectionRights());
        var _collectionIsInitialized = false;
        var _collectionIsLoading = false;
        var _collectionIsBeingSaved = false;
        var _setCollection = function (collection) {
            _collection.copyFromCollection(collection);
            if (_collectionIsInitialized) {
                $rootScope.$broadcast(EVENT_COLLECTION_REINITIALIZED);
            }
            else {
                $rootScope.$broadcast(EVENT_COLLECTION_INITIALIZED);
                _collectionIsInitialized = true;
            }
        };
        var _updateCollection = function (newBackendCollectionObject) {
            _setCollection(CollectionObjectFactory.create(newBackendCollectionObject));
        };
        var _setCollectionRights = function (collectionRights) {
            _collectionRights.copyFromCollectionRights(collectionRights);
        };
        var _updateCollectionRights = function (newBackendCollectionRightsObject) {
            _setCollectionRights(CollectionRightsObjectFactory.create(newBackendCollectionRightsObject));
        };
        return {
            /**
             * Loads, or reloads, the collection stored by this service given a
             * specified collection ID. See setCollection() for more information on
             * additional behavior of this function.
             */
            loadCollection: function (collectionId) {
                _collectionIsLoading = true;
                EditableCollectionBackendApiService.fetchCollection(collectionId).then(function (newBackendCollectionObject) {
                    _updateCollection(newBackendCollectionObject);
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when loading the collection.');
                    _collectionIsLoading = false;
                });
                CollectionRightsBackendApiService.fetchCollectionRights(collectionId).then(function (newBackendCollectionRightsObject) {
                    _updateCollectionRights(newBackendCollectionRightsObject);
                    _collectionIsLoading = false;
                }, function (error) {
                    AlertsService.addWarning(error ||
                        'There was an error when loading the collection rights.');
                    _collectionIsLoading = false;
                });
            },
            /**
             * Returns whether this service is currently attempting to load the
             * collection maintained by this service.
             */
            isLoadingCollection: function () {
                return _collectionIsLoading;
            },
            /**
             * Returns whether a collection has yet been loaded using either
             * loadCollection() or setCollection().
             */
            hasLoadedCollection: function () {
                return _collectionIsInitialized;
            },
            /**
             * Returns the current collection to be shared among the collection
             * editor. Please note any changes to this collection will be propogated
             * to all bindings to it. This collection object will be retained for the
             * lifetime of the editor. This function never returns null, though it may
             * return an empty collection object if the collection has not yet been
             * loaded for this editor instance.
             */
            getCollection: function () {
                return _collection;
            },
            /**
             * Returns the current collection rights to be shared among the collection
             * editor. Please note any changes to this collection rights will be
             * propogated to all bindings to it. This collection rights object will
             * be retained for the lifetime of the editor. This function never returns
             * null, though it may return an empty collection rights object if the
             * collection rights has not yet been loaded for this editor instance.
             */
            getCollectionRights: function () {
                return _collectionRights;
            },
            /**
             * Sets the collection stored within this service, propogating changes to
             * all bindings to the collection returned by getCollection(). The first
             * time this is called it will fire a global event based on the
             * EVENT_COLLECTION_INITIALIZED constant. All subsequent
             * calls will similarly fire a EVENT_COLLECTION_REINITIALIZED event.
             */
            setCollection: function (collection) {
                _setCollection(collection);
            },
            /**
             * Sets the collection rights stored within this service, propogating
             * changes to all bindings to the collection returned by
             * getCollectionRights(). The first time this is called it will fire a
             * global event based on the EVENT_COLLECTION_INITIALIZED constant. All
             * subsequent calls will similarly fire a EVENT_COLLECTION_REINITIALIZED
             * event.
             */
            setCollectionRights: function (collectionRights) {
                _setCollectionRights(collectionRights);
            },
            /**
             * Attempts to save the current collection given a commit message. This
             * function cannot be called until after a collection has been initialized
             * in this service. Returns false if a save is not performed due to no
             * changes pending, or true if otherwise. This function, upon success,
             * will clear the UndoRedoService of pending changes. This function also
             * shares behavior with setCollection(), when it succeeds.
             */
            saveCollection: function (commitMessage, successCallback) {
                if (!_collectionIsInitialized) {
                    AlertsService.fatalWarning('Cannot save a collection before one is loaded.');
                }
                // Don't attempt to save the collection if there are no changes pending.
                if (!UndoRedoService.hasChanges()) {
                    return false;
                }
                _collectionIsBeingSaved = true;
                EditableCollectionBackendApiService.updateCollection(_collection.getId(), _collection.getVersion(), commitMessage, UndoRedoService.getCommittableChangeList()).then(function (collectionBackendObject) {
                    _updateCollection(collectionBackendObject);
                    UndoRedoService.clearChanges();
                    _collectionIsBeingSaved = false;
                    if (successCallback) {
                        successCallback();
                    }
                }, function (error) {
                    AlertsService.addWarning(error || 'There was an error when saving the collection.');
                    _collectionIsBeingSaved = false;
                });
                return true;
            },
            /**
             * Returns whether this service is currently attempting to save the
             * collection maintained by this service.
             */
            isSavingCollection: function () {
                return _collectionIsBeingSaved;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/services/collection-linearizer.service.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/services/collection-linearizer.service.ts ***!
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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
angular.module('oppia').factory('CollectionLinearizerService', [
    'CollectionUpdateService',
    function (CollectionUpdateService) {
        var _getNextExplorationId = function (collection, completedExpIds) {
            var explorationIds = collection.getExplorationIds();
            for (var i = 0; i < explorationIds.length; i++) {
                if (completedExpIds.indexOf(explorationIds[i]) === -1) {
                    return explorationIds[i];
                }
            }
            return null;
        };
        // Given a non linear collection input, the function will linearize it by
        // picking the first node it encounters on the branch and ignore the others.
        var _getCollectionNodesInPlayableOrder = function (collection) {
            return collection.getCollectionNodes();
        };
        var addAfter = function (collection, curExplorationId, newExplorationId) {
            var curCollectionNode = collection.getCollectionNodeByExplorationId(curExplorationId);
        };
        var findNodeIndex = function (linearNodeList, explorationId) {
            var index = -1;
            for (var i = 0; i < linearNodeList.length; i++) {
                if (linearNodeList[i].getExplorationId() === explorationId) {
                    index = i;
                    break;
                }
            }
            return index;
        };
        // Swap the node at the specified index with the node immediately to the
        // left of it.
        var swapLeft = function (collection, linearNodeList, nodeIndex) {
            var node = linearNodeList[nodeIndex];
            var leftNodeIndex = nodeIndex > 0 ? nodeIndex - 1 : null;
            if (leftNodeIndex === null) {
                return;
            }
            CollectionUpdateService.swapNodes(collection, leftNodeIndex, nodeIndex);
        };
        var swapRight = function (collection, linearNodeList, nodeIndex) {
            // Swapping right is the same as swapping the node one to the right
            // leftward.
            if (nodeIndex < linearNodeList.length - 1) {
                swapLeft(collection, linearNodeList, nodeIndex + 1);
            }
            // Otherwise it is a no-op (cannot swap the last node right).
        };
        var shiftNode = function (collection, explorationId, swapFunction) {
            // There is nothing to shift if the collection has only 1 node.
            if (collection.getCollectionNodeCount() > 1) {
                var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
                var nodeIndex = findNodeIndex(linearNodeList, explorationId);
                if (nodeIndex === -1) {
                    return false;
                }
                swapFunction(collection, linearNodeList, nodeIndex);
            }
            return true;
        };
        return {
            /**
             * Given a collection and a list of completed exploration IDs within the
             * context of that collection, returns a list of which explorations in the
             * collection is immediately playable by the user. NOTE: This function
             * does not assume that the collection is linear.
             */
            getNextExplorationId: function (collection, completedExpIds) {
                return _getNextExplorationId(collection, completedExpIds);
            },
            /**
             * Given a collection, returns a linear list of collection nodes which
             * represents a valid path for playing through this collection.
             */
            getCollectionNodesInPlayableOrder: function (collection) {
                return _getCollectionNodesInPlayableOrder(collection);
            },
            /**
             * Inserts a new collection node at the end of the collection's playable
             * list of explorations, based on the specified exploration ID and
             * exploration summary backend object.
             */
            appendCollectionNode: function (collection, explorationId, summaryBackendObject) {
                var linearNodeList = _getCollectionNodesInPlayableOrder(collection);
                CollectionUpdateService.addCollectionNode(collection, explorationId, summaryBackendObject);
                if (linearNodeList.length > 0) {
                    var lastNode = linearNodeList[linearNodeList.length - 1];
                    addAfter(collection, lastNode.getExplorationId(), explorationId);
                }
            },
            /**
             * Remove a collection node from a given collection which maps to the
             * specified exploration ID. This function ensures the linear structure of
             * the collection is maintained. Returns whether the provided exploration
             * ID is contained within the linearly playable path of the specified
             * collection.
             */
            removeCollectionNode: function (collection, explorationId) {
                if (!collection.containsCollectionNode(explorationId)) {
                    return false;
                }
                // Delete the node
                CollectionUpdateService.deleteCollectionNode(collection, explorationId);
                return true;
            },
            /**
             * Looks up a collection node given an exploration ID in the specified
             * collection and attempts to shift it left in the linear ordering of the
             * collection. If the node is the first exploration played by the player,
             * then this function is a no-op. Returns false if the specified
             * exploration ID does not associate to any nodes in the collection.
             */
            shiftNodeLeft: function (collection, explorationId) {
                return shiftNode(collection, explorationId, swapLeft);
            },
            /**
             * Looks up a collection node given an exploration ID in the specified
             * collection and attempts to shift it right in the linear ordering of the
             * collection. If the node is the last exploration played by the player,
             * then this function is a no-op. Returns false if the specified
             * exploration ID does not associate to any nodes in the collection.
             */
            shiftNodeRight: function (collection, explorationId) {
                return shiftNode(collection, explorationId, swapRight);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-details-editor.directive.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-details-editor.directive.ts ***!
  \******************************************************************************************************************/
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
 * @fileoverview Directive for displaying and editing a collection details.
 * Edit options include: changing the title, objective, and category, and also
 * adding a new exploration.
 */
__webpack_require__(/*! components/forms/custom-forms-directives/select2-dropdown.directive.ts */ "./core/templates/dev/head/components/forms/custom-forms-directives/select2-dropdown.directive.ts");
__webpack_require__(/*! domain/collection/CollectionUpdateService.ts */ "./core/templates/dev/head/domain/collection/CollectionUpdateService.ts");
__webpack_require__(/*! domain/collection/CollectionValidationService.ts */ "./core/templates/dev/head/domain/collection/CollectionValidationService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection-editor-page/collection-editor-page.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/collection-editor-page.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').directive('collectionDetailsEditor', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/settings-tab/' +
                'collection-details-editor.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', 'CollectionEditorStateService', 'CollectionUpdateService',
                'CollectionValidationService', 'AlertsService', 'ALL_CATEGORIES',
                'ALL_LANGUAGE_CODES', 'COLLECTION_TITLE_INPUT_FOCUS_LABEL',
                'EVENT_COLLECTION_INITIALIZED', 'EVENT_COLLECTION_REINITIALIZED',
                'TAG_REGEX',
                function ($scope, CollectionEditorStateService, CollectionUpdateService, CollectionValidationService, AlertsService, ALL_CATEGORIES, ALL_LANGUAGE_CODES, COLLECTION_TITLE_INPUT_FOCUS_LABEL, EVENT_COLLECTION_INITIALIZED, EVENT_COLLECTION_REINITIALIZED, TAG_REGEX) {
                    var ctrl = this;
                    ctrl.collection = CollectionEditorStateService.getCollection();
                    ctrl.COLLECTION_TITLE_INPUT_FOCUS_LABEL = (COLLECTION_TITLE_INPUT_FOCUS_LABEL);
                    ctrl.hasPageLoaded = (CollectionEditorStateService.hasLoadedCollection);
                    ctrl.CATEGORY_LIST_FOR_SELECT2 = ALL_CATEGORIES.map(function (category) {
                        return {
                            id: category,
                            text: category
                        };
                    });
                    ctrl.languageListForSelect = ALL_LANGUAGE_CODES;
                    ctrl.TAG_REGEX = TAG_REGEX;
                    var refreshSettingsTab = function () {
                        ctrl.displayedCollectionTitle = ctrl.collection.getTitle();
                        ctrl.displayedCollectionObjective = (ctrl.collection.getObjective());
                        ctrl.displayedCollectionCategory = (ctrl.collection.getCategory());
                        ctrl.displayedCollectionLanguage = (ctrl.collection.getLanguageCode());
                        ctrl.displayedCollectionTags = (ctrl.collection.getTags());
                        var categoryIsInSelect2 = ctrl.CATEGORY_LIST_FOR_SELECT2.some(function (categoryItem) {
                            return categoryItem.id === ctrl.collection.getCategory();
                        });
                        // If the current category is not in the dropdown, add it
                        // as the first option.
                        if (!categoryIsInSelect2 && ctrl.collection.getCategory()) {
                            ctrl.CATEGORY_LIST_FOR_SELECT2.unshift({
                                id: ctrl.collection.getCategory(),
                                text: ctrl.collection.getCategory()
                            });
                        }
                    };
                    $scope.$on(EVENT_COLLECTION_INITIALIZED, refreshSettingsTab);
                    $scope.$on(EVENT_COLLECTION_REINITIALIZED, refreshSettingsTab);
                    ctrl.updateCollectionTitle = function () {
                        CollectionUpdateService.setCollectionTitle(ctrl.collection, ctrl.displayedCollectionTitle);
                    };
                    ctrl.updateCollectionObjective = function () {
                        CollectionUpdateService.setCollectionObjective(ctrl.collection, ctrl.displayedCollectionObjective);
                    };
                    ctrl.updateCollectionCategory = function () {
                        CollectionUpdateService.setCollectionCategory(ctrl.collection, ctrl.displayedCollectionCategory);
                    };
                    ctrl.updateCollectionLanguageCode = function () {
                        CollectionUpdateService.setCollectionLanguageCode(ctrl.collection, ctrl.displayedCollectionLanguage);
                    };
                    // Normalize the tags for the collection
                    var normalizeTags = function (tags) {
                        for (var i = 0; i < tags.length; i++) {
                            tags[i] = tags[i].trim().replace(/\s+/g, ' ');
                        }
                        return tags;
                    };
                    ctrl.updateCollectionTags = function () {
                        ctrl.displayedCollectionTags = normalizeTags(ctrl.displayedCollectionTags);
                        if (!CollectionValidationService.isTagValid(ctrl.displayedCollectionTags)) {
                            AlertsService.addWarning('Please ensure that there are no duplicate tags and that all ' +
                                'tags contain only lower case and spaces.');
                            return;
                        }
                        CollectionUpdateService.setCollectionTags(ctrl.collection, ctrl.displayedCollectionTags);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-permissions-card.directive.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-permissions-card.directive.ts ***!
  \********************************************************************************************************************/
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
 * @fileoverview Directive for displaying the collection's owner name and
 * permissions.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/collection-editor-page/services/collection-editor-state.service.ts */ "./core/templates/dev/head/pages/collection-editor-page/services/collection-editor-state.service.ts");
angular.module('oppia').directive('collectionPermissionsCard', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/settings-tab/' +
                'collection-permissions-card.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                'CollectionEditorStateService',
                function (CollectionEditorStateService) {
                    var ctrl = this;
                    ctrl.collectionRights =
                        CollectionEditorStateService.getCollectionRights();
                    ctrl.hasPageLoaded =
                        CollectionEditorStateService.hasLoadedCollection;
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-settings-tab.directive.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-settings-tab.directive.ts ***!
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
 * @fileoverview Controller for the settings tab of the collection editor.
 */
__webpack_require__(/*! pages/collection-editor-page/settings-tab/collection-details-editor.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-details-editor.directive.ts");
__webpack_require__(/*! pages/collection-editor-page/settings-tab/collection-permissions-card.directive.ts */ "./core/templates/dev/head/pages/collection-editor-page/settings-tab/collection-permissions-card.directive.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('collectionSettingsTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/settings-tab/' +
                'collection-settings-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-editor-page/statistics-tab/collection-statistics-tab.directive.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-editor-page/statistics-tab/collection-statistics-tab.directive.ts ***!
  \********************************************************************************************************************/
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
 * @fileoverview Controller for the statistics tab of the collection editor.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('oppia').directive('collectionStatisticsTab', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/collection-editor-page/statistics-tab/' +
                'collection-statistics-tab.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () { }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/editor-tab/services/solution-validity.service.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/editor-tab/services/solution-validity.service.ts ***!
  \****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for keeping track of solution validity.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var SolutionValidityService = /** @class */ (function () {
    function SolutionValidityService() {
        this.solutionValidities = {};
    }
    SolutionValidityService.prototype.init = function (stateNames) {
        var _this = this;
        stateNames.forEach(function (stateName) {
            _this.solutionValidities[stateName] = true;
        });
    };
    SolutionValidityService.prototype.deleteSolutionValidity = function (stateName) {
        delete this.solutionValidities[stateName];
    };
    SolutionValidityService.prototype.onRenameState = function (newStateName, oldStateName) {
        this.solutionValidities[newStateName] =
            this.solutionValidities[oldStateName];
        this.deleteSolutionValidity(oldStateName);
    };
    SolutionValidityService.prototype.updateValidity = function (stateName, solutionIsValid) {
        this.solutionValidities[stateName] = solutionIsValid;
    };
    SolutionValidityService.prototype.isSolutionValid = function (stateName) {
        if (this.solutionValidities.hasOwnProperty(stateName)) {
            return this.solutionValidities[stateName];
        }
    };
    SolutionValidityService.prototype.getAllValidities = function () {
        return this.solutionValidities;
    };
    SolutionValidityService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], SolutionValidityService);
    return SolutionValidityService;
}());
exports.SolutionValidityService = SolutionValidityService;
angular.module('oppia').factory('SolutionValidityService', static_1.downgradeInjectable(SolutionValidityService));


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/angular-name.service.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/angular-name.service.ts ***!
  \************************************************************************************************/
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
 * @fileoverview A service that maps IDs to Angular names.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var AngularNameService = /** @class */ (function () {
    function AngularNameService() {
    }
    AngularNameService_1 = AngularNameService;
    AngularNameService.prototype.getNameOfInteractionRulesService = function (interactionId) {
        AngularNameService_1.angularName = interactionId.charAt(0) +
            interactionId.slice(1) + 'RulesService';
        return AngularNameService_1.angularName;
    };
    var AngularNameService_1;
    AngularNameService.angularName = null;
    AngularNameService = AngularNameService_1 = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], AngularNameService);
    return AngularNameService;
}());
exports.AngularNameService = AngularNameService;
angular.module('oppia').factory('AngularNameService', static_1.downgradeInjectable(AngularNameService));


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/autosave-info-modals.service.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/autosave-info-modals.service.ts ***!
  \********************************************************************************************************/
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
/**
 * @fileoverview Service for displaying different types of modals depending
 * on the type of response received as a result of the autosaving request.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/changes-in-human-readable-form.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/changes-in-human-readable-form.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/exploration-data.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-data.service.ts");
__webpack_require__(/*! services/LocalStorageService.ts */ "./core/templates/dev/head/services/LocalStorageService.ts");
angular.module('oppia').factory('AutosaveInfoModalsService', [
    '$log', '$timeout', '$uibModal', '$window',
    'ChangesInHumanReadableFormService', 'ExplorationDataService',
    'LocalStorageService', 'UrlInterpolationService',
    function ($log, $timeout, $uibModal, $window, ChangesInHumanReadableFormService, ExplorationDataService, LocalStorageService, UrlInterpolationService) {
        var _isModalOpen = false;
        var _refreshPage = function (delay) {
            $timeout(function () {
                $window.location.reload();
            }, delay);
        };
        return {
            showNonStrictValidationFailModal: function () {
                $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/modal-templates/' +
                        'save-validation-fail-modal.template.html'),
                    // Prevent modal from closing when the user clicks outside it.
                    backdrop: 'static',
                    controller: [
                        '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.closeAndRefresh = function () {
                                $uibModalInstance.dismiss('cancel');
                                _refreshPage(20);
                            };
                        }
                    ]
                }).result.then(function () {
                    _isModalOpen = false;
                }, function () {
                    _isModalOpen = false;
                });
                _isModalOpen = true;
            },
            isModalOpen: function () {
                return _isModalOpen;
            },
            showVersionMismatchModal: function (lostChanges) {
                $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/modal-templates/' +
                        'save-version-mismatch-modal.template.html'),
                    // Prevent modal from closing when the user clicks outside it.
                    backdrop: 'static',
                    controller: ['$scope', function ($scope) {
                            // When the user clicks on discard changes button, signal backend
                            // to discard the draft and reload the page thereafter.
                            $scope.discardChanges = function () {
                                ExplorationDataService.discardDraft(function () {
                                    _refreshPage(20);
                                });
                            };
                            $scope.hasLostChanges = (lostChanges && lostChanges.length > 0);
                            if ($scope.hasLostChanges) {
                                // TODO(sll): This should also include changes to exploration
                                // properties (such as the exploration title, category, etc.).
                                $scope.lostChangesHtml = (ChangesInHumanReadableFormService.makeHumanReadable(lostChanges).html());
                                $log.error('Lost changes: ' + JSON.stringify(lostChanges));
                            }
                        }],
                    windowClass: 'oppia-autosave-version-mismatch-modal'
                }).result.then(function () {
                    _isModalOpen = false;
                }, function () {
                    _isModalOpen = false;
                });
                _isModalOpen = true;
            },
            showLostChangesModal: function (lostChanges, explorationId) {
                $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/modal-templates/' +
                        'lost-changes-modal.template.html'),
                    // Prevent modal from closing when the user clicks outside it.
                    backdrop: 'static',
                    controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            // When the user clicks on discard changes button, signal backend
                            // to discard the draft and reload the page thereafter.
                            $scope.close = function () {
                                LocalStorageService.removeExplorationDraft(explorationId);
                                $uibModalInstance.dismiss('cancel');
                            };
                            $scope.lostChangesHtml = (ChangesInHumanReadableFormService.makeHumanReadable(lostChanges).html());
                            $log.error('Lost changes: ' + JSON.stringify(lostChanges));
                        }],
                    windowClass: 'oppia-lost-changes-modal'
                }).result.then(function () {
                    _isModalOpen = false;
                }, function () {
                    _isModalOpen = false;
                });
                _isModalOpen = true;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/change-list.service.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/change-list.service.ts ***!
  \***********************************************************************************************/
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
/**
 * @fileoverview A service that maintains a provisional list of changes to be
 * committed to the server.
 */
__webpack_require__(/*! pages/exploration-editor-page/services/autosave-info-modals.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/autosave-info-modals.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/exploration-data.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-data.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').factory('ChangeListService', [
    '$log', '$rootScope', 'AlertsService', 'AutosaveInfoModalsService',
    'ExplorationDataService',
    function ($log, $rootScope, AlertsService, AutosaveInfoModalsService, ExplorationDataService) {
        // TODO(sll): Implement undo, redo functionality. Show a message on each
        // step saying what the step is doing.
        // TODO(sll): Allow the user to view the list of changes made so far, as
        // well as the list of changes in the undo stack.
        // Temporary buffer for changes made to the exploration.
        var explorationChangeList = [];
        // Stack for storing undone changes. The last element is the most recently
        // undone change.
        var undoneChangeStack = [];
        // All these constants should correspond to those in exp_domain.py.
        // TODO(sll): Enforce this in code.
        var CMD_ADD_STATE = 'add_state';
        var CMD_RENAME_STATE = 'rename_state';
        var CMD_DELETE_STATE = 'delete_state';
        var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
        var CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property';
        var ALLOWED_EXPLORATION_BACKEND_NAMES = {
            category: true,
            init_state_name: true,
            language_code: true,
            objective: true,
            param_changes: true,
            param_specs: true,
            tags: true,
            title: true,
            auto_tts_enabled: true,
            correctness_feedback_enabled: true
        };
        var ALLOWED_STATE_BACKEND_NAMES = {
            answer_groups: true,
            confirmed_unclassified_answers: true,
            content: true,
            recorded_voiceovers: true,
            default_outcome: true,
            hints: true,
            param_changes: true,
            param_specs: true,
            solicit_answer_details: true,
            solution: true,
            state_name: true,
            widget_customization_args: true,
            widget_id: true,
            written_translations: true
        };
        var autosaveChangeListOnChange = function (explorationChangeList) {
            // Asynchronously send an autosave request, and check for errors in the
            // response:
            // If error is present -> Check for the type of error occurred
            // (Display the corresponding modals in both cases, if not already
            // opened):
            // - Version Mismatch.
            // - Non-strict Validation Fail.
            ExplorationDataService.autosaveChangeList(explorationChangeList, function (response) {
                if (!response.data.is_version_of_draft_valid) {
                    if (!AutosaveInfoModalsService.isModalOpen()) {
                        AutosaveInfoModalsService.showVersionMismatchModal(explorationChangeList);
                    }
                }
            }, function () {
                AlertsService.clearWarnings();
                $log.error('nonStrictValidationFailure: ' +
                    JSON.stringify(explorationChangeList));
                if (!AutosaveInfoModalsService.isModalOpen()) {
                    AutosaveInfoModalsService.showNonStrictValidationFailModal();
                }
            });
        };
        var addChange = function (changeDict) {
            if ($rootScope.loadingMessage) {
                return;
            }
            explorationChangeList.push(changeDict);
            undoneChangeStack = [];
            autosaveChangeListOnChange(explorationChangeList);
        };
        return {
            /**
             * Saves a change dict that represents adding a new state. It is the
             * responsbility of the caller to check that the new state name is valid.
             *
             * @param {string} stateName - The name of the newly-added state
             */
            addState: function (stateName) {
                addChange({
                    cmd: CMD_ADD_STATE,
                    state_name: stateName
                });
            },
            /**
             * Saves a change dict that represents deleting a new state. It is the
             * responsbility of the caller to check that the deleted state name
             * corresponds to an existing state.
             *
             * @param {string} stateName - The name of the deleted state.
             */
            deleteState: function (stateName) {
                addChange({
                    cmd: CMD_DELETE_STATE,
                    state_name: stateName
                });
            },
            discardAllChanges: function () {
                explorationChangeList = [];
                undoneChangeStack = [];
                ExplorationDataService.discardDraft();
            },
            /**
             * Saves a change dict that represents a change to an exploration
             * property (such as its title, category, ...). It is the responsibility
             * of the caller to check that the old and new values are not equal.
             *
             * @param {string} backendName - The backend name of the property
             *   (e.g. title, category)
             * @param {string} newValue - The new value of the property
             * @param {string} oldValue - The previous value of the property
             */
            editExplorationProperty: function (backendName, newValue, oldValue) {
                if (!ALLOWED_EXPLORATION_BACKEND_NAMES.hasOwnProperty(backendName)) {
                    AlertsService.addWarning('Invalid exploration property: ' + backendName);
                    return;
                }
                addChange({
                    cmd: CMD_EDIT_EXPLORATION_PROPERTY,
                    new_value: angular.copy(newValue),
                    old_value: angular.copy(oldValue),
                    property_name: backendName
                });
            },
            /**
             * Saves a change dict that represents a change to a state property. It
             * is the responsibility of the caller to check that the old and new
             * values are not equal.
             *
             * @param {string} stateName - The name of the state that is being edited
             * @param {string} backendName - The backend name of the edited property
             * @param {string} newValue - The new value of the property
             * @param {string} oldValue - The previous value of the property
             */
            editStateProperty: function (stateName, backendName, newValue, oldValue) {
                if (!ALLOWED_STATE_BACKEND_NAMES.hasOwnProperty(backendName)) {
                    AlertsService.addWarning('Invalid state property: ' + backendName);
                    return;
                }
                addChange({
                    cmd: CMD_EDIT_STATE_PROPERTY,
                    new_value: angular.copy(newValue),
                    old_value: angular.copy(oldValue),
                    property_name: backendName,
                    state_name: stateName
                });
            },
            getChangeList: function () {
                return angular.copy(explorationChangeList);
            },
            isExplorationLockedForEditing: function () {
                return explorationChangeList.length > 0;
            },
            /**
             * Initializes the current changeList with the one received from backend.
             * This behavior exists only in case of an autosave.
             *
             * @param {object} changeList - Autosaved changeList data
             */
            loadAutosavedChangeList: function (changeList) {
                explorationChangeList = changeList;
            },
            /**
             * Saves a change dict that represents the renaming of a state. This
             * is also intended to change the initial state name if necessary
             * (that is, the latter change is implied and does not have to be
             * recorded separately in another change dict). It is the responsibility
             * of the caller to check that the two names are not equal.
             *
             * @param {string} newStateName - The new name of the state
             * @param {string} oldStateName - The previous name of the state
             */
            renameState: function (newStateName, oldStateName) {
                addChange({
                    cmd: CMD_RENAME_STATE,
                    new_state_name: newStateName,
                    old_state_name: oldStateName
                });
            },
            undoLastChange: function () {
                if (explorationChangeList.length === 0) {
                    AlertsService.addWarning('There are no changes to undo.');
                    return;
                }
                var lastChange = explorationChangeList.pop();
                undoneChangeStack.push(lastChange);
                autosaveChangeListOnChange(explorationChangeList);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/changes-in-human-readable-form.service.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/changes-in-human-readable-form.service.ts ***!
  \******************************************************************************************************************/
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
/**
 * @fileoverview Service to get changes in human readable form.
 */
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
angular.module('oppia').factory('ChangesInHumanReadableFormService', [
    'UtilsService', function (UtilsService) {
        var CMD_ADD_STATE = 'add_state';
        var CMD_RENAME_STATE = 'rename_state';
        var CMD_DELETE_STATE = 'delete_state';
        var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
        var makeRulesListHumanReadable = function (answerGroupValue) {
            var rulesList = [];
            answerGroupValue.rules.forEach(function (rule) {
                var ruleElm = angular.element('<li></li>');
                ruleElm.html('<p>Type: ' + rule.type + '</p>');
                ruleElm.append('<p>Value: ' + (Object.keys(rule.inputs).map(function (input) {
                    return rule.inputs[input];
                })).toString() + '</p>');
                rulesList.push(ruleElm);
            });
            return rulesList;
        };
        // An edit is represented either as an object or an array. If it's an
        // object, then simply return that object. In case of an array, return
        // the last item.
        var getStatePropertyValue = function (statePropertyValue) {
            return angular.isArray(statePropertyValue) ?
                statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
        };
        // Detects whether an object of the type 'answer_group' or
        // 'default_outcome' has been added, edited or deleted.
        // Returns - 'addded', 'edited' or 'deleted' accordingly.
        var getRelativeChangeToGroups = function (changeObject) {
            var newValue = changeObject.new_value;
            var oldValue = changeObject.old_value;
            var result = '';
            if (angular.isArray(newValue) && angular.isArray(oldValue)) {
                result = (newValue.length > oldValue.length) ?
                    'added' : (newValue.length === oldValue.length) ?
                    'edited' : 'deleted';
            }
            else {
                if (!UtilsService.isEmpty(oldValue)) {
                    if (!UtilsService.isEmpty(newValue)) {
                        result = 'edited';
                    }
                    else {
                        result = 'deleted';
                    }
                }
                else if (!UtilsService.isEmpty(newValue)) {
                    result = 'added';
                }
            }
            return result;
        };
        var makeHumanReadable = function (lostChanges) {
            var outerHtml = angular.element('<ul></ul>');
            var stateWiseEditsMapping = {};
            // The variable stateWiseEditsMapping stores the edits grouped by state.
            // For instance, you made the following edits:
            // 1. Changed content to 'Welcome!' instead of '' in 'Introduction'.
            // 2. Added an interaction in this state.
            // 2. Added a new state 'End'.
            // 3. Ended Exporation from state 'End'.
            // stateWiseEditsMapping will look something like this:
            // - 'Introduction': [
            //   - 'Edited Content: Welcome!',:
            //   - 'Added Interaction: Continue',
            //   - 'Added interaction customizations']
            // - 'End': ['Ended exploration']
            lostChanges.forEach(function (lostChange) {
                switch (lostChange.cmd) {
                    case CMD_ADD_STATE:
                        outerHtml.append(angular.element('<li></li>').html('Added state: ' + lostChange.state_name));
                        break;
                    case CMD_RENAME_STATE:
                        outerHtml.append(angular.element('<li></li>').html('Renamed state: ' + lostChange.old_state_name + ' to ' +
                            lostChange.new_state_name));
                        break;
                    case CMD_DELETE_STATE:
                        outerHtml.append(angular.element('<li></li>').html('Deleted state: ' + lostChange.state_name));
                        break;
                    case CMD_EDIT_STATE_PROPERTY:
                        var newValue = getStatePropertyValue(lostChange.new_value);
                        var oldValue = getStatePropertyValue(lostChange.old_value);
                        var stateName = lostChange.state_name;
                        if (!stateWiseEditsMapping[stateName]) {
                            stateWiseEditsMapping[stateName] = [];
                        }
                        switch (lostChange.property_name) {
                            case 'content':
                                if (newValue !== null) {
                                    // TODO(sll): Also add display of audio translations here.
                                    stateWiseEditsMapping[stateName].push(angular.element('<div></div>').html('<strong>Edited content: </strong><div class="content">' +
                                        newValue.html + '</div>')
                                        .addClass('state-edit-desc'));
                                }
                                break;
                            case 'widget_id':
                                var lostChangeValue = '';
                                if (oldValue === null) {
                                    if (newValue !== 'EndExploration') {
                                        lostChangeValue = ('<strong>Added Interaction: </strong>' +
                                            newValue);
                                    }
                                    else {
                                        lostChangeValue = 'Ended Exploration';
                                    }
                                }
                                else {
                                    lostChangeValue = ('<strong>Deleted Interaction: </strong>' +
                                        oldValue);
                                }
                                stateWiseEditsMapping[stateName].push(angular.element('<div></div>').html(lostChangeValue)
                                    .addClass('state-edit-desc'));
                                break;
                            case 'widget_customization_args':
                                var lostChangeValue = '';
                                if (UtilsService.isEmpty(oldValue)) {
                                    lostChangeValue = 'Added Interaction Customizations';
                                }
                                else if (UtilsService.isEmpty(newValue)) {
                                    lostChangeValue = 'Removed Interaction Customizations';
                                }
                                else {
                                    lostChangeValue = 'Edited Interaction Customizations';
                                }
                                stateWiseEditsMapping[stateName].push(angular.element('<div></div>').html(lostChangeValue)
                                    .addClass('state-edit-desc'));
                                break;
                            case 'answer_groups':
                                var answerGroupChanges = getRelativeChangeToGroups(lostChange);
                                var answerGroupHtml = '';
                                if (answerGroupChanges === 'added') {
                                    answerGroupHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                        newValue.outcome.dest + '</p>');
                                    answerGroupHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                        '<div class="feedback">' +
                                        newValue.outcome.feedback.getHtml() + '</div></div>');
                                    var rulesList = makeRulesListHumanReadable(newValue);
                                    if (rulesList.length > 0) {
                                        answerGroupHtml += '<p class="sub-edit"><i>Rules: </i></p>';
                                        var rulesListHtml = (angular.element('<ol></ol>').addClass('rules-list'));
                                        for (var rule in rulesList) {
                                            rulesListHtml.html(rulesList[rule][0].outerHTML);
                                        }
                                        answerGroupHtml += rulesListHtml[0].outerHTML;
                                    }
                                    stateWiseEditsMapping[stateName].push(angular.element('<div><strong>Added answer group: ' +
                                        '</strong></div>')
                                        .append(answerGroupHtml)
                                        .addClass('state-edit-desc answer-group'));
                                }
                                else if (answerGroupChanges === 'edited') {
                                    if (newValue.outcome.dest !== oldValue.outcome.dest) {
                                        answerGroupHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                            newValue.outcome.dest + '</p>');
                                    }
                                    if (!angular.equals(newValue.outcome.feedback.getHtml(), oldValue.outcome.feedback.getHtml())) {
                                        answerGroupHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                            '<div class="feedback">' +
                                            newValue.outcome.feedback.getHtml() +
                                            '</div></div>');
                                    }
                                    if (!angular.equals(newValue.rules, oldValue.rules)) {
                                        var rulesList = makeRulesListHumanReadable(newValue);
                                        if (rulesList.length > 0) {
                                            answerGroupHtml += ('<p class="sub-edit"><i>Rules: </i></p>');
                                            var rulesListHtml = (angular.element('<ol></ol>')
                                                .addClass('rules-list'));
                                            for (var rule in rulesList) {
                                                rulesListHtml.html(rulesList[rule][0].outerHTML);
                                            }
                                            answerGroupChanges = rulesListHtml[0].outerHTML;
                                        }
                                    }
                                    stateWiseEditsMapping[stateName].push(angular.element('<div><strong>Edited answer group: <strong>' +
                                        '</div>')
                                        .append(answerGroupHtml)
                                        .addClass('state-edit-desc answer-group'));
                                }
                                else if (answerGroupChanges === 'deleted') {
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Deleted answer group</div>')
                                        .addClass('state-edit-desc'));
                                }
                                break;
                            case 'default_outcome':
                                var defaultOutcomeChanges = getRelativeChangeToGroups(lostChange);
                                var defaultOutcomeHtml = '';
                                if (defaultOutcomeChanges === 'added') {
                                    defaultOutcomeHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                        newValue.dest + '</p>');
                                    defaultOutcomeHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                        '<div class="feedback">' + newValue.feedback.getHtml() +
                                        '</div></div>');
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Added default outcome: </div>')
                                        .append(defaultOutcomeHtml)
                                        .addClass('state-edit-desc default-outcome'));
                                }
                                else if (defaultOutcomeChanges === 'edited') {
                                    if (newValue.dest !== oldValue.dest) {
                                        defaultOutcomeHtml += ('<p class="sub-edit"><i>Destination: </i>' +
                                            newValue.dest +
                                            '</p>');
                                    }
                                    if (!angular.equals(newValue.feedback.getHtml(), oldValue.feedback.getHtml())) {
                                        defaultOutcomeHtml += ('<div class="sub-edit"><i>Feedback: </i>' +
                                            '<div class="feedback">' + newValue.feedback +
                                            '</div></div>');
                                    }
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Edited default outcome: </div>')
                                        .append(defaultOutcomeHtml)
                                        .addClass('state-edit-desc default-outcome'));
                                }
                                else if (defaultOutcomeChanges === 'deleted') {
                                    stateWiseEditsMapping[stateName].push(angular.element('<div>Deleted default outcome</div>')
                                        .addClass('state-edit-desc'));
                                }
                        }
                }
            });
            for (var stateName in stateWiseEditsMapping) {
                var stateChangesEl = angular.element('<li>Edits to state: ' + stateName + '</li>');
                for (var stateEdit in stateWiseEditsMapping[stateName]) {
                    stateChangesEl.append(stateWiseEditsMapping[stateName][stateEdit]);
                }
                outerHtml.append(stateChangesEl);
            }
            return outerHtml;
        };
        return {
            makeHumanReadable: function (lostChanges) {
                try {
                    return makeHumanReadable(lostChanges);
                }
                catch (e) {
                    return angular.element('<div>Error: Could not recover lost changes.</div>');
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-data.service.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/exploration-data.service.ts ***!
  \****************************************************************************************************/
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
/**
 * @fileoverview Service for handling all interactions
 * with the exploration editor backend.
 */
__webpack_require__(/*! domain/exploration/EditableExplorationBackendApiService.ts */ "./core/templates/dev/head/domain/exploration/EditableExplorationBackendApiService.ts");
__webpack_require__(/*! domain/exploration/ReadOnlyExplorationBackendApiService.ts */ "./core/templates/dev/head/domain/exploration/ReadOnlyExplorationBackendApiService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/LocalStorageService.ts */ "./core/templates/dev/head/services/LocalStorageService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/services.constants.ajs.ts */ "./core/templates/dev/head/services/services.constants.ajs.ts");
angular.module('oppia').factory('ExplorationDataService', [
    '$http', '$log', '$q', '$window', 'AlertsService',
    'EditableExplorationBackendApiService', 'LocalStorageService',
    'ReadOnlyExplorationBackendApiService', 'UrlService',
    function ($http, $log, $q, $window, AlertsService, EditableExplorationBackendApiService, LocalStorageService, ReadOnlyExplorationBackendApiService, UrlService) {
        // The pathname (without the hash) should be: .../create/{exploration_id}
        var explorationId = '';
        var draftChangeListId = null;
        var pathnameArray = UrlService.getPathname().split('/');
        for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'create') {
                explorationId = pathnameArray[i + 1];
                break;
            }
        }
        if (!explorationId) {
            $log.error('Unexpected call to ExplorationDataService for pathname ', pathnameArray[i]);
            // Note: if we do not return anything, Karma unit tests fail.
            return {};
        }
        var resolvedAnswersUrlPrefix = ('/createhandler/resolved_answers/' + explorationId);
        var explorationDraftAutosaveUrl = ('/createhandler/autosave_draft/' + explorationId);
        // Put exploration variables here.
        var explorationData = {
            explorationId: explorationId,
            data: null,
            // Note that the changeList is the full changeList since the last
            // committed version (as opposed to the most recent autosave).
            autosaveChangeList: function (changeList, successCallback, errorCallback) {
                if (successCallback === void 0) { successCallback = function (response) { }; }
                if (errorCallback === void 0) { errorCallback = function () { }; }
                // First save locally to be retrieved later if save is unsuccessful.
                LocalStorageService.saveExplorationDraft(explorationId, changeList, draftChangeListId);
                $http.put(explorationDraftAutosaveUrl, {
                    change_list: changeList,
                    version: explorationData.data.version
                }).then(function (response) {
                    draftChangeListId = response.data.draft_change_list_id;
                    // We can safely remove the locally saved draft copy if it was saved
                    // to the backend.
                    LocalStorageService.removeExplorationDraft(explorationId);
                    if (successCallback) {
                        successCallback(response);
                    }
                }, function () {
                    if (errorCallback) {
                        errorCallback();
                    }
                });
            },
            discardDraft: function (successCallback, errorCallback) {
                $http.post(explorationDraftAutosaveUrl, {}).then(function () {
                    LocalStorageService.removeExplorationDraft(explorationId);
                    if (successCallback) {
                        successCallback();
                    }
                }, function () {
                    if (errorCallback) {
                        errorCallback();
                    }
                });
            },
            // Returns a promise that supplies the data for the current exploration.
            getData: function (errorCallback) {
                if (explorationData.data) {
                    $log.info('Found exploration data in cache.');
                    return $q.resolve(explorationData.data);
                }
                else {
                    // Retrieve data from the server.
                    // WARNING: Note that this is a version of the exploration with draft
                    // changes applied. This makes a force-refresh necessary when changes
                    // are discarded, otherwise the exploration-with-draft-changes
                    // (which is cached here) will be reused.
                    return (EditableExplorationBackendApiService.fetchApplyDraftExploration(explorationId).then(function (response) {
                        $log.info('Retrieved exploration data.');
                        $log.info(response);
                        draftChangeListId = response.draft_change_list_id;
                        explorationData.data = response;
                        var draft = LocalStorageService.getExplorationDraft(explorationId);
                        if (draft) {
                            if (draft.isValid(draftChangeListId)) {
                                var changeList = draft.getChanges();
                                explorationData.autosaveChangeList(changeList, function () {
                                    // A reload is needed so that the changelist just saved is
                                    // loaded as opposed to the exploration returned by this
                                    // response.
                                    $window.location.reload();
                                });
                            }
                            else {
                                errorCallback(explorationId, draft.getChanges());
                            }
                        }
                        return response;
                    }));
                }
            },
            // Returns a promise supplying the last saved version for the current
            // exploration.
            getLastSavedData: function () {
                return ReadOnlyExplorationBackendApiService.loadLatestExploration(explorationId).then(function (response) {
                    $log.info('Retrieved saved exploration data.');
                    $log.info(response);
                    return response.exploration;
                });
            },
            resolveAnswers: function (stateName, resolvedAnswersList) {
                AlertsService.clearWarnings();
                $http.put(resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName), {
                    resolved_answers: resolvedAnswersList
                });
            },
            /**
             * Saves the exploration to the backend, and, on a success callback,
             * updates the local copy of the exploration data.
             * @param {object} changeList - Represents the change list for
             *   this save. Each element of the list is a command representing an
             *   editing action (such as add state, delete state, etc.). See the
             *  _'Change' class in exp_services.py for full documentation.
             * @param {string} commitMessage - The user-entered commit message for
             *   this save operation.
             */
            save: function (changeList, commitMessage, successCallback, errorCallback) {
                EditableExplorationBackendApiService.updateExploration(explorationId, explorationData.data.version, commitMessage, changeList).then(function (response) {
                    AlertsService.clearWarnings();
                    explorationData.data = response;
                    if (successCallback) {
                        successCallback(response.is_version_of_draft_valid, response.draft_changes);
                    }
                }, function () {
                    if (errorCallback) {
                        errorCallback();
                    }
                });
            }
        };
        return explorationData;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-init-state-name.service.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/exploration-init-state-name.service.ts ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview A data service that stores the name of the exploration's
 * initial state. NOTE: This service does not perform validation. Users of this
 * service should ensure that new initial state names passed to the service are
 * valid.
 */
__webpack_require__(/*! pages/exploration-editor-page/services/exploration-property.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-property.service.ts");
angular.module('oppia').factory('ExplorationInitStateNameService', [
    'ExplorationPropertyService', function (ExplorationPropertyService) {
        var child = Object.create(ExplorationPropertyService);
        child.propertyName = 'init_state_name';
        return child;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-property.service.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/exploration-property.service.ts ***!
  \********************************************************************************************************/
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
/**
 * @fileoverview Services for storing exploration properties for
 * displaying and editing them in multiple places in the UI,
 * with base class as ExplorationPropertyService.
 */
__webpack_require__(/*! pages/exploration-editor-page/services/change-list.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/change-list.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('oppia').factory('ExplorationPropertyService', [
    '$log', '$rootScope', 'AlertsService', 'ChangeListService',
    function ($log, $rootScope, AlertsService, ChangeListService) {
        // Public base API for data services corresponding to exploration properties
        // (title, category, etc.)
        var BACKEND_CONVERSIONS = {
            param_changes: function (paramChanges) {
                return paramChanges.map(function (paramChange) {
                    return paramChange.toBackendDict();
                });
            },
            param_specs: function (paramSpecs) {
                return paramSpecs.toBackendDict();
            },
        };
        return {
            init: function (value) {
                if (this.propertyName === null) {
                    throw 'Exploration property name cannot be null.';
                }
                $log.info('Initializing exploration ' + this.propertyName + ':', value);
                // The current value of the property (which may not have been saved to
                // the frontend yet). In general, this will be bound directly to the UI.
                this.displayed = angular.copy(value);
                // The previous (saved-in-the-frontend) value of the property. Here,
                // 'saved' means that this is the latest value of the property as
                // determined by the frontend change list.
                this.savedMemento = angular.copy(value);
                $rootScope.$broadcast('explorationPropertyChanged');
            },
            // Returns whether the current value has changed from the memento.
            hasChanged: function () {
                return !angular.equals(this.savedMemento, this.displayed);
            },
            // The backend name for this property. THIS MUST BE SPECIFIED BY
            // SUBCLASSES.
            propertyName: null,
            // Transforms the given value into a normalized form. THIS CAN BE
            // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
            _normalize: function (value) {
                return value;
            },
            // Validates the given value and returns a boolean stating whether it
            // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
            // behavior is to always return true.
            _isValid: function (value) {
                return true;
            },
            // Normalizes the displayed value. Then, if the memento and the displayed
            // value are the same, does nothing. Otherwise, creates a new entry in the
            // change list, and updates the memento to the displayed value.
            saveDisplayedValue: function () {
                if (this.propertyName === null) {
                    throw 'Exploration property name cannot be null.';
                }
                this.displayed = this._normalize(this.displayed);
                if (!this._isValid(this.displayed) || !this.hasChanged()) {
                    this.restoreFromMemento();
                    return;
                }
                if (angular.equals(this.displayed, this.savedMemento)) {
                    return;
                }
                AlertsService.clearWarnings();
                var newBackendValue = angular.copy(this.displayed);
                var oldBackendValue = angular.copy(this.savedMemento);
                if (BACKEND_CONVERSIONS.hasOwnProperty(this.propertyName)) {
                    newBackendValue =
                        BACKEND_CONVERSIONS[this.propertyName](this.displayed);
                    oldBackendValue =
                        BACKEND_CONVERSIONS[this.propertyName](this.savedMemento);
                }
                ChangeListService.editExplorationProperty(this.propertyName, newBackendValue, oldBackendValue);
                this.savedMemento = angular.copy(this.displayed);
                $rootScope.$broadcast('explorationPropertyChanged');
            },
            // Reverts the displayed value to the saved memento.
            restoreFromMemento: function () {
                this.displayed = angular.copy(this.savedMemento);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-states.service.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/exploration-states.service.ts ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Data service for keeping track of the exploration's states.
 * Note that this is unlike the other exploration property services, in that it
 * keeps no mementos.
 */
__webpack_require__(/*! domain/exploration/StatesObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/StatesObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! filters/string-utility-filters/normalize-whitespace.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/angular-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/angular-name.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/change-list.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/change-list.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/exploration-init-state-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-init-state-name.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/editor-tab/services/solution-validity.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/editor-tab/services/solution-validity.service.ts");
__webpack_require__(/*! pages/exploration-player-page/services/answer-classification.service.ts */ "./core/templates/dev/head/pages/exploration-player-page/services/answer-classification.service.ts");
__webpack_require__(/*! components/state-editor/state-editor-properties-services/state-editor.service.ts */ "./core/templates/dev/head/components/state-editor/state-editor-properties-services/state-editor.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! services/ValidatorsService.ts */ "./core/templates/dev/head/services/ValidatorsService.ts");
angular.module('oppia').factory('ExplorationStatesService', [
    '$filter', '$injector', '$location', '$q', '$rootScope', '$uibModal',
    'AlertsService', 'AngularNameService', 'AnswerClassificationService',
    'ChangeListService', 'ContextService', 'ExplorationInitStateNameService',
    'SolutionValidityService', 'StateEditorService', 'StatesObjectFactory',
    'UrlInterpolationService', 'ValidatorsService',
    function ($filter, $injector, $location, $q, $rootScope, $uibModal, AlertsService, AngularNameService, AnswerClassificationService, ChangeListService, ContextService, ExplorationInitStateNameService, SolutionValidityService, StateEditorService, StatesObjectFactory, UrlInterpolationService, ValidatorsService) {
        var _states = null;
        var stateAddedCallbacks = [];
        var stateDeletedCallbacks = [];
        var stateRenamedCallbacks = [];
        var stateInteractionSavedCallbacks = [];
        // Properties that have a different backend representation from the
        // frontend and must be converted.
        var BACKEND_CONVERSIONS = {
            answer_groups: function (answerGroups) {
                return answerGroups.map(function (answerGroup) {
                    return answerGroup.toBackendDict();
                });
            },
            content: function (content) {
                return content.toBackendDict();
            },
            recorded_voiceovers: function (recordedVoiceovers) {
                return recordedVoiceovers.toBackendDict();
            },
            default_outcome: function (defaultOutcome) {
                if (defaultOutcome) {
                    return defaultOutcome.toBackendDict();
                }
                else {
                    return null;
                }
            },
            hints: function (hints) {
                return hints.map(function (hint) {
                    return hint.toBackendDict();
                });
            },
            param_changes: function (paramChanges) {
                return paramChanges.map(function (paramChange) {
                    return paramChange.toBackendDict();
                });
            },
            param_specs: function (paramSpecs) {
                return paramSpecs.toBackendDict();
            },
            solution: function (solution) {
                if (solution) {
                    return solution.toBackendDict();
                }
                else {
                    return null;
                }
            },
            written_translations: function (writtenTranslations) {
                return writtenTranslations.toBackendDict();
            }
        };
        // Maps backend names to the corresponding frontend dict accessor lists.
        var PROPERTY_REF_DATA = {
            answer_groups: ['interaction', 'answerGroups'],
            confirmed_unclassified_answers: [
                'interaction', 'confirmedUnclassifiedAnswers'
            ],
            content: ['content'],
            recorded_voiceovers: ['recordedVoiceovers'],
            default_outcome: ['interaction', 'defaultOutcome'],
            param_changes: ['paramChanges'],
            param_specs: ['paramSpecs'],
            hints: ['interaction', 'hints'],
            solicit_answer_details: ['solicitAnswerDetails'],
            solution: ['interaction', 'solution'],
            widget_id: ['interaction', 'id'],
            widget_customization_args: ['interaction', 'customizationArgs'],
            written_translations: ['writtenTranslations']
        };
        var CONTENT_ID_EXTRACTORS = {
            answer_groups: function (answerGroups) {
                var contentIds = new Set();
                answerGroups.forEach(function (answerGroup) {
                    contentIds.add(answerGroup.outcome.feedback.getContentId());
                });
                return contentIds;
            },
            default_outcome: function (defaultOutcome) {
                var contentIds = new Set();
                if (defaultOutcome) {
                    contentIds.add(defaultOutcome.feedback.getContentId());
                }
                return contentIds;
            },
            hints: function (hints) {
                var contentIds = new Set();
                hints.forEach(function (hint) {
                    contentIds.add(hint.hintContent.getContentId());
                });
                return contentIds;
            },
            solution: function (solution) {
                var contentIds = new Set();
                if (solution) {
                    contentIds.add(solution.explanation.getContentId());
                }
                return contentIds;
            }
        };
        var _getElementsInFirstSetButNotInSecond = function (setA, setB) {
            var diffList = Array.from(setA).filter(function (element) {
                return !setB.has(element);
            });
            return diffList;
        };
        var _setState = function (stateName, stateData, refreshGraph) {
            _states.setState(stateName, angular.copy(stateData));
            if (refreshGraph) {
                $rootScope.$broadcast('refreshGraph');
            }
        };
        var getStatePropertyMemento = function (stateName, backendName) {
            var accessorList = PROPERTY_REF_DATA[backendName];
            var propertyRef = _states.getState(stateName);
            try {
                accessorList.forEach(function (key) {
                    propertyRef = propertyRef[key];
                });
            }
            catch (e) {
                var additionalInfo = ('\nUndefined states error debug logs:' +
                    '\nRequested state name: ' + stateName +
                    '\nExploration ID: ' + ContextService.getExplorationId() +
                    '\nChange list: ' + JSON.stringify(ChangeListService.getChangeList()) +
                    '\nAll states names: ' + _states.getStateNames());
                e.message += additionalInfo;
                throw e;
            }
            return angular.copy(propertyRef);
        };
        var saveStateProperty = function (stateName, backendName, newValue) {
            var oldValue = getStatePropertyMemento(stateName, backendName);
            var newBackendValue = angular.copy(newValue);
            var oldBackendValue = angular.copy(oldValue);
            if (BACKEND_CONVERSIONS.hasOwnProperty(backendName)) {
                newBackendValue = convertToBackendRepresentation(newValue, backendName);
                oldBackendValue = convertToBackendRepresentation(oldValue, backendName);
            }
            if (!angular.equals(oldValue, newValue)) {
                ChangeListService.editStateProperty(stateName, backendName, newBackendValue, oldBackendValue);
                var newStateData = _states.getState(stateName);
                var accessorList = PROPERTY_REF_DATA[backendName];
                if (CONTENT_ID_EXTRACTORS.hasOwnProperty(backendName)) {
                    var oldContentIds = CONTENT_ID_EXTRACTORS[backendName](oldValue);
                    var newContentIds = CONTENT_ID_EXTRACTORS[backendName](newValue);
                    var contentIdsToDelete = _getElementsInFirstSetButNotInSecond(oldContentIds, newContentIds);
                    var contentIdsToAdd = _getElementsInFirstSetButNotInSecond(newContentIds, oldContentIds);
                    contentIdsToDelete.forEach(function (contentId) {
                        newStateData.recordedVoiceovers.deleteContentId(contentId);
                        newStateData.writtenTranslations.deleteContentId(contentId);
                    });
                    contentIdsToAdd.forEach(function (contentId) {
                        newStateData.recordedVoiceovers.addContentId(contentId);
                        newStateData.writtenTranslations.addContentId(contentId);
                    });
                }
                var propertyRef = newStateData;
                for (var i = 0; i < accessorList.length - 1; i++) {
                    propertyRef = propertyRef[accessorList[i]];
                }
                propertyRef[accessorList[accessorList.length - 1]] = angular.copy(newValue);
                // We do not refresh the state editor immediately after the interaction
                // id alone is saved, because the customization args dict will be
                // temporarily invalid. A change in interaction id will always entail
                // a change in the customization args dict anyway, so the graph will
                // get refreshed after both properties have been updated.
                var refreshGraph = (backendName !== 'widget_id');
                _setState(stateName, newStateData, refreshGraph);
            }
        };
        var convertToBackendRepresentation = function (frontendValue, backendName) {
            var conversionFunction = BACKEND_CONVERSIONS[backendName];
            return conversionFunction(frontendValue);
        };
        // TODO(sll): Add unit tests for all get/save methods.
        return {
            init: function (statesBackendDict) {
                _states = StatesObjectFactory.createFromBackendDict(statesBackendDict);
                // Initialize the solutionValidityService.
                SolutionValidityService.init(_states.getStateNames());
                _states.getStateNames().forEach(function (stateName) {
                    var solution = _states.getState(stateName).interaction.solution;
                    if (solution) {
                        var result = (AnswerClassificationService.getMatchingClassificationResult(stateName, _states.getState(stateName).interaction, solution.correctAnswer, $injector.get(AngularNameService.getNameOfInteractionRulesService(_states.getState(stateName).interaction.id))));
                        var solutionIsValid = stateName !== result.outcome.dest;
                        SolutionValidityService.updateValidity(stateName, solutionIsValid);
                    }
                });
            },
            getStates: function () {
                return angular.copy(_states);
            },
            getStateNames: function () {
                return _states.getStateNames();
            },
            hasState: function (stateName) {
                return _states.hasState(stateName);
            },
            getState: function (stateName) {
                return angular.copy(_states.getState(stateName));
            },
            setState: function (stateName, stateData) {
                _setState(stateName, stateData, true);
            },
            isNewStateNameValid: function (newStateName, showWarnings) {
                if (_states.hasState(newStateName)) {
                    if (showWarnings) {
                        AlertsService.addWarning('A state with this name already exists.');
                    }
                    return false;
                }
                return (ValidatorsService.isValidStateName(newStateName, showWarnings));
            },
            getStateContentMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'content');
            },
            saveStateContent: function (stateName, newContent) {
                saveStateProperty(stateName, 'content', newContent);
            },
            getStateParamChangesMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'param_changes');
            },
            saveStateParamChanges: function (stateName, newParamChanges) {
                saveStateProperty(stateName, 'param_changes', newParamChanges);
            },
            getInteractionIdMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'widget_id');
            },
            saveInteractionId: function (stateName, newInteractionId) {
                saveStateProperty(stateName, 'widget_id', newInteractionId);
                stateInteractionSavedCallbacks.forEach(function (callback) {
                    callback(stateName);
                });
            },
            getInteractionCustomizationArgsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'widget_customization_args');
            },
            saveInteractionCustomizationArgs: function (stateName, newCustomizationArgs) {
                saveStateProperty(stateName, 'widget_customization_args', newCustomizationArgs);
                stateInteractionSavedCallbacks.forEach(function (callback) {
                    callback(stateName);
                });
            },
            getInteractionAnswerGroupsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'answer_groups');
            },
            saveInteractionAnswerGroups: function (stateName, newAnswerGroups) {
                saveStateProperty(stateName, 'answer_groups', newAnswerGroups);
                stateInteractionSavedCallbacks.forEach(function (callback) {
                    callback(stateName);
                });
            },
            getConfirmedUnclassifiedAnswersMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'confirmed_unclassified_answers');
            },
            saveConfirmedUnclassifiedAnswers: function (stateName, newAnswers) {
                saveStateProperty(stateName, 'confirmed_unclassified_answers', newAnswers);
                stateInteractionSavedCallbacks.forEach(function (callback) {
                    callback(stateName);
                });
            },
            getInteractionDefaultOutcomeMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'default_outcome');
            },
            saveInteractionDefaultOutcome: function (stateName, newDefaultOutcome) {
                saveStateProperty(stateName, 'default_outcome', newDefaultOutcome);
            },
            getHintsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'hints');
            },
            saveHints: function (stateName, newHints) {
                saveStateProperty(stateName, 'hints', newHints);
            },
            getSolutionMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'solution');
            },
            saveSolution: function (stateName, newSolution) {
                saveStateProperty(stateName, 'solution', newSolution);
            },
            getRecordedVoiceoversMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'recorded_voiceovers');
            },
            saveRecordedVoiceovers: function (stateName, newRecordedVoiceovers) {
                saveStateProperty(stateName, 'recorded_voiceovers', newRecordedVoiceovers);
            },
            getSolicitAnswerDetailsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'solicit_answer_details');
            },
            saveSolicitAnswerDetails: function (stateName, newSolicitAnswerDetails) {
                saveStateProperty(stateName, 'solicit_answer_details', newSolicitAnswerDetails);
            },
            getWrittenTranslationsMemento: function (stateName) {
                return getStatePropertyMemento(stateName, 'written_translations');
            },
            saveWrittenTranslations: function (stateName, newWrittenTranslations) {
                saveStateProperty(stateName, 'written_translations', newWrittenTranslations);
            },
            isInitialized: function () {
                return _states !== null;
            },
            addState: function (newStateName, successCallback) {
                newStateName = $filter('normalizeWhitespace')(newStateName);
                if (!ValidatorsService.isValidStateName(newStateName, true)) {
                    return;
                }
                if (_states.hasState(newStateName)) {
                    AlertsService.addWarning('A state with this name already exists.');
                    return;
                }
                AlertsService.clearWarnings();
                _states.addState(newStateName);
                ChangeListService.addState(newStateName);
                stateAddedCallbacks.forEach(function (callback) {
                    callback(newStateName);
                });
                $rootScope.$broadcast('refreshGraph');
                if (successCallback) {
                    successCallback(newStateName);
                }
            },
            deleteState: function (deleteStateName) {
                AlertsService.clearWarnings();
                var initStateName = ExplorationInitStateNameService.displayed;
                if (deleteStateName === initStateName) {
                    return $q.reject('The initial state can not be deleted.');
                }
                if (!_states.hasState(deleteStateName)) {
                    var message = 'No state with name ' + deleteStateName + ' exists.';
                    AlertsService.addWarning(message);
                    return $q.reject(message);
                }
                return $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/exploration-editor-page/editor-tab/templates/' +
                        'modal-templates/confirm-delete-state-modal.template.html'),
                    backdrop: true,
                    controller: [
                        '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.deleteStateWarningText = ('Are you sure you want to delete the card "' +
                                deleteStateName + '"?');
                            $scope.reallyDelete = function () {
                                $uibModalInstance.close();
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss();
                                AlertsService.clearWarnings();
                            };
                        }
                    ]
                }).result.then(function () {
                    _states.deleteState(deleteStateName);
                    ChangeListService.deleteState(deleteStateName);
                    if (StateEditorService.getActiveStateName() === deleteStateName) {
                        StateEditorService.setActiveStateName(ExplorationInitStateNameService.savedMemento);
                    }
                    stateDeletedCallbacks.forEach(function (callback) {
                        callback(deleteStateName);
                    });
                    $location.path('/gui/' + StateEditorService.getActiveStateName());
                    $rootScope.$broadcast('refreshGraph');
                    // This ensures that if the deletion changes rules in the current
                    // state, they get updated in the view.
                    $rootScope.$broadcast('refreshStateEditor');
                });
            },
            renameState: function (oldStateName, newStateName) {
                newStateName = $filter('normalizeWhitespace')(newStateName);
                if (!ValidatorsService.isValidStateName(newStateName, true)) {
                    return;
                }
                if (_states.hasState(newStateName)) {
                    AlertsService.addWarning('A state with this name already exists.');
                    return;
                }
                AlertsService.clearWarnings();
                _states.renameState(oldStateName, newStateName);
                StateEditorService.setActiveStateName(newStateName);
                // The 'rename state' command must come before the 'change
                // init_state_name' command in the change list, otherwise the backend
                // will raise an error because the new initial state name does not
                // exist.
                ChangeListService.renameState(newStateName, oldStateName);
                SolutionValidityService.onRenameState(newStateName, oldStateName);
                // Amend initStateName appropriately, if necessary. Note that this
                // must come after the state renaming, otherwise saving will lead to
                // a complaint that the new name is not a valid state name.
                if (ExplorationInitStateNameService.displayed === oldStateName) {
                    ExplorationInitStateNameService.displayed = newStateName;
                    ExplorationInitStateNameService.saveDisplayedValue(newStateName);
                }
                stateRenamedCallbacks.forEach(function (callback) {
                    callback(oldStateName, newStateName);
                });
                $rootScope.$broadcast('refreshGraph');
            },
            registerOnStateAddedCallback: function (callback) {
                stateAddedCallbacks.push(callback);
            },
            registerOnStateDeletedCallback: function (callback) {
                stateDeletedCallbacks.push(callback);
            },
            registerOnStateRenamedCallback: function (callback) {
                stateRenamedCallbacks.push(callback);
            },
            registerOnStateInteractionSavedCallback: function (callback) {
                stateInteractionSavedCallbacks.push(callback);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/services/router.service.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/services/router.service.ts ***!
  \******************************************************************************************/
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
/**
 * @fileoverview Service that handles routing for the exploration editor page.
 */
__webpack_require__(/*! pages/exploration-editor-page/services/exploration-init-state-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-init-state-name.service.ts");
__webpack_require__(/*! pages/exploration-editor-page/services/exploration-states.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/services/exploration-states.service.ts");
__webpack_require__(/*! components/state-editor/state-editor-properties-services/state-editor.service.ts */ "./core/templates/dev/head/components/state-editor/state-editor-properties-services/state-editor.service.ts");
__webpack_require__(/*! services/ExplorationFeaturesService.ts */ "./core/templates/dev/head/services/ExplorationFeaturesService.ts");
angular.module('oppia').factory('RouterService', [
    '$interval', '$location', '$rootScope', '$timeout', '$window',
    'ExplorationFeaturesService', 'ExplorationInitStateNameService',
    'ExplorationStatesService', 'StateEditorService',
    function ($interval, $location, $rootScope, $timeout, $window, ExplorationFeaturesService, ExplorationInitStateNameService, ExplorationStatesService, StateEditorService) {
        var TABS = {
            MAIN: { name: 'main', path: '/main' },
            TRANSLATION: { name: 'translation', path: '/translation' },
            PREVIEW: { name: 'preview', path: '/preview' },
            SETTINGS: { name: 'settings', path: '/settings' },
            STATS: { name: 'stats', path: '/stats' },
            IMPROVEMENTS: { name: 'improvements', path: '/improvements' },
            HISTORY: { name: 'history', path: '/history' },
            FEEDBACK: { name: 'feedback', path: '/feedback' },
        };
        var SLUG_GUI = 'gui';
        var SLUG_PREVIEW = 'preview';
        var activeTabName = TABS.MAIN.name;
        var isImprovementsTabEnabled = ExplorationFeaturesService.isImprovementsTabEnabled;
        // When the URL path changes, reroute to the appropriate tab in the
        // exploration editor page.
        $rootScope.$watch(function () {
            return $location.path();
        }, function (newPath, oldPath) {
            if (newPath === '') {
                $location.path(oldPath);
                return;
            }
            if (!oldPath) {
                // This can happen when clicking on links whose href is "#".
                return;
            }
            // TODO(oparry): Determine whether this is necessary, since
            // _savePendingChanges() is called by each of the navigateTo... functions
            $rootScope.$broadcast('externalSave');
            if (newPath.indexOf(TABS.TRANSLATION.path) === 0) {
                activeTabName = TABS.TRANSLATION.name;
                var waitForStatesToLoad = $interval(function () {
                    if (ExplorationStatesService.isInitialized()) {
                        $interval.cancel(waitForStatesToLoad);
                        if (!StateEditorService.getActiveStateName()) {
                            StateEditorService.setActiveStateName(ExplorationInitStateNameService.savedMemento);
                        }
                        $rootScope.$broadcast('refreshTranslationTab');
                    }
                }, 300);
            }
            else if (newPath.indexOf(TABS.PREVIEW.path) === 0) {
                activeTabName = TABS.PREVIEW.name;
                _doNavigationWithState(newPath, SLUG_PREVIEW);
            }
            else if (newPath === TABS.SETTINGS.path) {
                activeTabName = TABS.SETTINGS.name;
                $rootScope.$broadcast('refreshSettingsTab');
            }
            else if (newPath === TABS.STATS.path) {
                activeTabName = TABS.STATS.name;
                $rootScope.$broadcast('refreshStatisticsTab');
            }
            else if (newPath === TABS.IMPROVEMENTS.path) {
                activeTabName = TABS.IMPROVEMENTS.name;
                var waitToCheckThatImprovementsTabIsEnabled = $interval(function () {
                    if (ExplorationFeaturesService.isInitialized()) {
                        $interval.cancel(waitToCheckThatImprovementsTabIsEnabled);
                        if (!ExplorationFeaturesService.isImprovementsTabEnabled()) {
                            RouterService.navigateToMainTab(null);
                        }
                    }
                }, 5);
            }
            else if (newPath === TABS.HISTORY.path) {
                // TODO(sll): Do this on-hover rather than on-click.
                $rootScope.$broadcast('refreshVersionHistory', {
                    forceRefresh: false
                });
                activeTabName = TABS.HISTORY.name;
            }
            else if (newPath === TABS.FEEDBACK.path) {
                activeTabName = TABS.FEEDBACK.name;
                var waitToCheckThatFeedbackTabIsEnabled = $interval(function () {
                    if (ExplorationFeaturesService.isInitialized()) {
                        $interval.cancel(waitToCheckThatFeedbackTabIsEnabled);
                        if (ExplorationFeaturesService.isImprovementsTabEnabled()) {
                            RouterService.navigateToMainTab(null);
                        }
                    }
                }, 5);
            }
            else if (newPath.indexOf('/gui/') === 0) {
                activeTabName = TABS.MAIN.name;
                _doNavigationWithState(newPath, SLUG_GUI);
            }
            else {
                if (ExplorationInitStateNameService.savedMemento) {
                    $location.path('/gui/' + ExplorationInitStateNameService.savedMemento);
                }
            }
        });
        var _doNavigationWithState = function (path, pathType) {
            var pathBase = '/' + pathType + '/';
            var putativeStateName = path.substring(pathBase.length);
            var waitForStatesToLoad = $interval(function () {
                if (ExplorationStatesService.isInitialized()) {
                    $interval.cancel(waitForStatesToLoad);
                    if (ExplorationStatesService.hasState(putativeStateName)) {
                        StateEditorService.setActiveStateName(putativeStateName);
                        if (pathType === SLUG_GUI) {
                            $rootScope.$broadcast('refreshStateEditor');
                            // Fire an event to center the Graph in the Editor.
                            $rootScope.$broadcast('centerGraph');
                        }
                    }
                    else {
                        $location.path(pathBase +
                            ExplorationInitStateNameService.savedMemento);
                    }
                }
            }, 300);
        };
        var _savePendingChanges = function () {
            try {
                $rootScope.$broadcast('externalSave');
            }
            catch (e) {
                // Sometimes, AngularJS throws a "Cannot read property $$nextSibling of
                // null" error. To get around this we must use $apply().
                $rootScope.$apply(function () {
                    $rootScope.$broadcast('externalSave');
                });
            }
        };
        var _getCurrentStateFromLocationPath = function () {
            if ($location.path().indexOf('/gui/') !== -1) {
                return $location.path().substring('/gui/'.length);
            }
            else {
                return null;
            }
        };
        var _actuallyNavigate = function (pathType, newStateName) {
            if (pathType !== SLUG_GUI && pathType !== SLUG_PREVIEW) {
                return;
            }
            if (newStateName) {
                StateEditorService.setActiveStateName(newStateName);
            }
            $location.path('/' + pathType + '/' +
                StateEditorService.getActiveStateName());
            $window.scrollTo(0, 0);
        };
        var RouterService = {
            savePendingChanges: function () {
                _savePendingChanges();
            },
            getActiveTabName: function () {
                return activeTabName;
            },
            isLocationSetToNonStateEditorTab: function () {
                var currentPath = $location.path();
                return (currentPath === TABS.TRANSLATION.path ||
                    currentPath === TABS.PREVIEW.path ||
                    currentPath === TABS.STATS.path ||
                    currentPath === TABS.IMPROVEMENTS.path ||
                    currentPath === TABS.SETTINGS.path ||
                    currentPath === TABS.HISTORY.path ||
                    currentPath === TABS.FEEDBACK.path);
            },
            getCurrentStateFromLocationPath: function () {
                return _getCurrentStateFromLocationPath();
            },
            navigateToMainTab: function (stateName) {
                _savePendingChanges();
                if (_getCurrentStateFromLocationPath() === stateName) {
                    return;
                }
                if (activeTabName === TABS.MAIN.name) {
                    $('.oppia-editor-cards-container').fadeOut(function () {
                        _actuallyNavigate(SLUG_GUI, stateName);
                        // We need to use $apply to update all our bindings. However we
                        // can't directly use $apply, as there is already another $apply in
                        // progress, the one which angular itself has called at the start.
                        // So we use $applyAsync to ensure that this $apply is called just
                        // after the previous $apply is finished executing. Refer to this
                        // link for more information -
                        // http://blog.theodybrothers.com/2015/08/getting-inside-angular-scopeapplyasync.html
                        $rootScope.$applyAsync();
                        $timeout(function () {
                            $('.oppia-editor-cards-container').fadeIn();
                        }, 150);
                    });
                }
                else {
                    _actuallyNavigate(SLUG_GUI, stateName);
                }
            },
            navigateToTranslationTab: function () {
                _savePendingChanges();
                $location.path(TABS.TRANSLATION.path);
            },
            navigateToPreviewTab: function () {
                if (activeTabName !== TABS.PREVIEW.name) {
                    _savePendingChanges();
                    _actuallyNavigate(SLUG_PREVIEW, null);
                }
            },
            navigateToStatsTab: function () {
                _savePendingChanges();
                $location.path(TABS.STATS.path);
            },
            navigateToImprovementsTab: function () {
                _savePendingChanges();
                $location.path(TABS.IMPROVEMENTS.path);
            },
            navigateToSettingsTab: function () {
                _savePendingChanges();
                $location.path(TABS.SETTINGS.path);
            },
            navigateToHistoryTab: function () {
                _savePendingChanges();
                $location.path(TABS.HISTORY.path);
            },
            navigateToFeedbackTab: function () {
                _savePendingChanges();
                $location.path(TABS.FEEDBACK.path);
            },
        };
        return RouterService;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ajs.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ajs.ts ***!
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants to be used in the learner view.
 */
// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
var exploration_player_page_constants_1 = __webpack_require__(/*! pages/exploration-player-page/exploration-player-page.constants */ "./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ts");
angular.module('oppia').constant('CONTENT_FOCUS_LABEL_PREFIX', exploration_player_page_constants_1.ExplorationPlayerConstants.CONTENT_FOCUS_LABEL_PREFIX);
angular.module('oppia').constant('TWO_CARD_THRESHOLD_PX', exploration_player_page_constants_1.ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX);
angular.module('oppia').constant('CONTINUE_BUTTON_FOCUS_LABEL', exploration_player_page_constants_1.ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL);
/* Called when a new audio-equippable component is loaded and displayed
   to the user, allowing for the automatic playing of audio if necessary. */
angular.module('oppia').constant('EVENT_AUTOPLAY_AUDIO', exploration_player_page_constants_1.ExplorationPlayerConstants.EVENT_AUTOPLAY_AUDIO);
// The enforced waiting period before the first hint request.
angular.module('oppia').constant('WAIT_FOR_FIRST_HINT_MSEC', exploration_player_page_constants_1.ExplorationPlayerConstants.WAIT_FOR_FIRST_HINT_MSEC);
// The enforced waiting period before each of the subsequent hint requests.
angular.module('oppia').constant('WAIT_FOR_SUBSEQUENT_HINTS_MSEC', exploration_player_page_constants_1.ExplorationPlayerConstants.WAIT_FOR_SUBSEQUENT_HINTS_MSEC);
// The time delay between the learner clicking the hint button
// and the appearance of the hint.
angular.module('oppia').constant('DELAY_FOR_HINT_FEEDBACK_MSEC', exploration_player_page_constants_1.ExplorationPlayerConstants.DELAY_FOR_HINT_FEEDBACK_MSEC);
// Array of i18n IDs for the possible hint request strings.
angular.module('oppia').constant('HINT_REQUEST_STRING_I18N_IDS', exploration_player_page_constants_1.ExplorationPlayerConstants.HINT_REQUEST_STRING_I18N_IDS);
/* This should match the CSS class defined in the tutor card directive. */
angular.module('oppia').constant('AUDIO_HIGHLIGHT_CSS_CLASS', exploration_player_page_constants_1.ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS);
angular.module('oppia').constant('FLAG_EXPLORATION_URL_TEMPLATE', exploration_player_page_constants_1.ExplorationPlayerConstants.FLAG_EXPLORATION_URL_TEMPLATE);
// TODO(bhenning): Find a better place for these constants.
// NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
// the corresponding classification constants defined in core.domain.exp_domain.
angular.module('oppia').constant('EXPLICIT_CLASSIFICATION', exploration_player_page_constants_1.ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION);
angular.module('oppia').constant('TRAINING_DATA_CLASSIFICATION', exploration_player_page_constants_1.ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION);
angular.module('oppia').constant('STATISTICAL_CLASSIFICATION', exploration_player_page_constants_1.ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION);
angular.module('oppia').constant('DEFAULT_OUTCOME_CLASSIFICATION', exploration_player_page_constants_1.ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION);
angular.module('oppia').constant('EXPLORATION_MODE', exploration_player_page_constants_1.ExplorationPlayerConstants.EXPLORATION_MODE);
angular.module('oppia').constant('STATS_EVENT_TYPES', exploration_player_page_constants_1.ExplorationPlayerConstants.STATS_EVENT_TYPES);
angular.module('oppia').constant('STATS_REPORTING_URLS', exploration_player_page_constants_1.ExplorationPlayerConstants.STATS_REPORTING_URLS);
angular.module('oppia').constant('FEEDBACK_POPOVER_PATH', exploration_player_page_constants_1.ExplorationPlayerConstants.FEEDBACK_POPOVER_PATH);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ts ***!
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Constants to be used in the learner view.
 */
var ExplorationPlayerConstants = /** @class */ (function () {
    function ExplorationPlayerConstants() {
    }
    ExplorationPlayerConstants.CONTENT_FOCUS_LABEL_PREFIX = 'content-focus-label-';
    ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX = 960;
    ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL = 'continueButton';
    /* Called when a new audio-equippable component is loaded and displayed
       to the user, allowing for the automatic playing of audio if necessary. */
    ExplorationPlayerConstants.EVENT_AUTOPLAY_AUDIO = 'autoPlayAudio';
    // The enforced waiting period before the first hint request.
    ExplorationPlayerConstants.WAIT_FOR_FIRST_HINT_MSEC = 60000;
    // The enforced waiting period before each of the subsequent hint requests.
    ExplorationPlayerConstants.WAIT_FOR_SUBSEQUENT_HINTS_MSEC = 30000;
    // The time delay between the learner clicking the hint button
    // and the appearance of the hint.
    ExplorationPlayerConstants.DELAY_FOR_HINT_FEEDBACK_MSEC = 100;
    // Array of i18n IDs for the possible hint request strings.
    ExplorationPlayerConstants.HINT_REQUEST_STRING_I18N_IDS = [
        'I18N_PLAYER_HINT_REQUEST_STRING_1',
        'I18N_PLAYER_HINT_REQUEST_STRING_2',
        'I18N_PLAYER_HINT_REQUEST_STRING_3'
    ];
    /* This should match the CSS class defined in the tutor card directive. */
    ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS = 'conversation-skin-audio-highlight';
    ExplorationPlayerConstants.FLAG_EXPLORATION_URL_TEMPLATE = '/flagexplorationhandler/<exploration_id>';
    // TODO(bhenning): Find a better place for these constants.
    // NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
    // the corresponding classification constants defined in
    // core.domain.exp_domain.
    ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION = 'explicit';
    ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION = 'training_data_match';
    ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION = 'statistical_classifier';
    ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome';
    ExplorationPlayerConstants.EXPLORATION_MODE = {
        EXPLORATION: 'exploration',
        PRETEST: 'pretest',
        QUESTION_PLAYER: 'question_player',
        STORY_CHAPTER: 'story_chapter',
        OTHER: 'other'
    };
    ExplorationPlayerConstants.STATS_EVENT_TYPES = {
        EVENT_TYPE_START_EXPLORATION: 'start',
        EVENT_TYPE_ACTUAL_START_EXPLORATION: 'actual_start',
        EVENT_TYPE_COMPLETE_EXPLORATION: 'complete',
        EVENT_TYPE_STATE_HIT: 'state_hit',
        EVENT_TYPE_STATE_COMPLETED: 'state_complete',
        EVENT_TYPE_ANSWER_SUBMITTED: 'answer_submitted',
        EVENT_TYPE_SOLUTION_HIT: 'solution_hit',
        EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP: 'leave_for_refresher_exp',
    };
    ExplorationPlayerConstants.STATS_REPORTING_URLS = {
        ANSWER_SUBMITTED: '/explorehandler/answer_submitted_event/<exploration_id>',
        EXPLORATION_COMPLETED: ('/explorehandler/exploration_complete_event/<exploration_id>'),
        EXPLORATION_MAYBE_LEFT: ('/explorehandler/exploration_maybe_leave_event/<exploration_id>'),
        EXPLORATION_STARTED: ('/explorehandler/exploration_start_event/<exploration_id>'),
        STATE_HIT: '/explorehandler/state_hit_event/<exploration_id>',
        STATE_COMPLETED: '/explorehandler/state_complete_event/<exploration_id>',
        EXPLORATION_ACTUALLY_STARTED: ('/explorehandler/exploration_actual_start_event/<exploration_id>'),
        SOLUTION_HIT: '/explorehandler/solution_hit_event/<exploration_id>',
        LEAVE_FOR_REFRESHER_EXP: ('/explorehandler/leave_for_refresher_exp_event/<exploration_id>'),
        STATS_EVENTS: '/explorehandler/stats_events/<exploration_id>'
    };
    ExplorationPlayerConstants.FEEDBACK_POPOVER_PATH = '/pages/exploration-player-page/templates/' +
        'feedback-popup-container.template.html';
    return ExplorationPlayerConstants;
}());
exports.ExplorationPlayerConstants = ExplorationPlayerConstants;


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/services/answer-classification.service.ts":
/*!*********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/services/answer-classification.service.ts ***!
  \*********************************************************************************************************/
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
 * @fileoverview Classification service for answer groups.
 */
__webpack_require__(/*! domain/classifier/AnswerClassificationResultObjectFactory.ts */ "./core/templates/dev/head/domain/classifier/AnswerClassificationResultObjectFactory.ts");
__webpack_require__(/*! pages/exploration-player-page/services/prediction-algorithm-registry.service.ts */ "./core/templates/dev/head/pages/exploration-player-page/services/prediction-algorithm-registry.service.ts");
__webpack_require__(/*! pages/exploration-player-page/services/state-classifier-mapping.service.ts */ "./core/templates/dev/head/pages/exploration-player-page/services/state-classifier-mapping.service.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! pages/exploration-player-page/exploration-player-page.constants.ajs.ts */ "./core/templates/dev/head/pages/exploration-player-page/exploration-player-page.constants.ajs.ts");
__webpack_require__(/*! pages/interaction-specs.constants.ajs.ts */ "./core/templates/dev/head/pages/interaction-specs.constants.ajs.ts");
angular.module('oppia').factory('AnswerClassificationService', [
    'AlertsService', 'AnswerClassificationResultObjectFactory',
    'PredictionAlgorithmRegistryService', 'StateClassifierMappingService',
    'DEFAULT_OUTCOME_CLASSIFICATION', 'ENABLE_ML_CLASSIFIERS',
    'EXPLICIT_CLASSIFICATION',
    'INTERACTION_SPECS', 'STATISTICAL_CLASSIFICATION',
    'TRAINING_DATA_CLASSIFICATION',
    function (AlertsService, AnswerClassificationResultObjectFactory, PredictionAlgorithmRegistryService, StateClassifierMappingService, DEFAULT_OUTCOME_CLASSIFICATION, ENABLE_ML_CLASSIFIERS, EXPLICIT_CLASSIFICATION, INTERACTION_SPECS, STATISTICAL_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION) {
        /**
         * Finds the first answer group with a rule that returns true.
         *
         * @param {*} answer - The answer that the user has submitted.
         * @param {array} answerGroups - The answer groups of the interaction. Each
         *     answer group contains rule_specs, which is a list of rules.
         * @param {object} defaultOutcome - The default outcome of the interaction.
         * @param {function} interactionRulesService The service which contains the
         *     explicit rules of that interaction.
         *
         * @return {object} An AnswerClassificationResult domain object.
         */
        var classifyAnswer = function (answer, answerGroups, defaultOutcome, interactionRulesService) {
            // Find the first group that contains a rule which returns true
            // TODO(bhenning): Implement training data classification.
            for (var i = 0; i < answerGroups.length; i++) {
                for (var j = 0; j < answerGroups[i].rules.length; j++) {
                    var rule = answerGroups[i].rules[j];
                    if (interactionRulesService[rule.type](answer, rule.inputs)) {
                        return AnswerClassificationResultObjectFactory.createNew(answerGroups[i].outcome, i, j, EXPLICIT_CLASSIFICATION);
                    }
                }
            }
            // If no rule in any answer group returns true, the default 'group' is
            // returned. Throws an error if the default outcome is not defined.
            if (defaultOutcome) {
                return AnswerClassificationResultObjectFactory.createNew(defaultOutcome, answerGroups.length, 0, DEFAULT_OUTCOME_CLASSIFICATION);
            }
            else {
                AlertsService.addWarning('Something went wrong with the exploration.');
            }
        };
        return {
            /**
             * Classifies the answer according to the answer groups. and returns the
             * corresponding answer classification result.
             *
             * @param {string} stateName - The name of the state where the user
             *   submitted the answer.
             * @param {object} interactionInOldState - The interaction present in the
             *   state where the user submitted the answer.
             * @param {*} answer - The answer that the user has submitted.
             * @param {function} interactionRulesService - The service which contains
             *   the explicit rules of that interaction.
             *
             * @return {AnswerClassificationResult} The resulting
             *   AnswerClassificationResult domain object.
             */
            getMatchingClassificationResult: function (stateName, interactionInOldState, answer, interactionRulesService) {
                var answerClassificationResult = null;
                var answerGroups = interactionInOldState.answerGroups;
                var defaultOutcome = interactionInOldState.defaultOutcome;
                if (interactionRulesService) {
                    answerClassificationResult = classifyAnswer(answer, answerGroups, defaultOutcome, interactionRulesService);
                }
                else {
                    AlertsService.addWarning('Something went wrong with the exploration: no ' +
                        'interactionRulesService was available.');
                    throw Error('No interactionRulesService was available to classify the answer.');
                }
                var ruleBasedOutcomeIsDefault = (answerClassificationResult.outcome === defaultOutcome);
                var interactionIsTrainable = INTERACTION_SPECS[interactionInOldState.id].is_trainable;
                if (ruleBasedOutcomeIsDefault && interactionIsTrainable) {
                    for (var i = 0; i < answerGroups.length; i++) {
                        if (answerGroups[i].trainingData) {
                            for (var j = 0; j < answerGroups[i].trainingData.length; j++) {
                                if (angular.equals(answer, answerGroups[i].trainingData[j])) {
                                    return AnswerClassificationResultObjectFactory.createNew(answerGroups[i].outcome, i, null, TRAINING_DATA_CLASSIFICATION);
                                }
                            }
                        }
                    }
                    if (ENABLE_ML_CLASSIFIERS) {
                        var classifier = StateClassifierMappingService.getClassifier(stateName);
                        if (classifier && classifier.classifierData && (classifier.algorithmId && classifier.dataSchemaVersion)) {
                            var predictionService = (PredictionAlgorithmRegistryService.getPredictionService(classifier.algorithmId, classifier.dataSchemaVersion));
                            // If prediction service exists, we run classifier. We return the
                            // default outcome otherwise.
                            if (predictionService) {
                                var predictedAnswerGroupIndex = predictionService.predict(classifier.classifierData, answer);
                                if (predictedAnswerGroupIndex === -1) {
                                    answerClassificationResult = (AnswerClassificationResultObjectFactory.createNew(defaultOutcome, answerGroups.length, 0, DEFAULT_OUTCOME_CLASSIFICATION));
                                }
                                answerClassificationResult = (AnswerClassificationResultObjectFactory.createNew(answerGroups[predictedAnswerGroupIndex].outcome, predictedAnswerGroupIndex, null, STATISTICAL_CLASSIFICATION));
                            }
                        }
                    }
                }
                return answerClassificationResult;
            },
            isClassifiedExplicitlyOrGoesToNewState: function (stateName, state, answer, interactionRulesService) {
                var result = this.getMatchingClassificationResult(stateName, state.interaction, answer, interactionRulesService);
                return (result.outcome.dest !== state.name ||
                    result.classificationCategorization !==
                        DEFAULT_OUTCOME_CLASSIFICATION);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/services/prediction-algorithm-registry.service.ts":
/*!*****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/services/prediction-algorithm-registry.service.ts ***!
  \*****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for mapping algorithmId to PredictionAlgorithmService.
 */
angular.module('oppia').factory('PredictionAlgorithmRegistryService', [
    '$injector', function ($injector) {
        /**
         * This mapping needs to be updated whenever a new prediction service needs
         * to be added for classification. The mapping is from algorithmId to a
         * list of objects. The mapping should be of the type:
         * {
         *   algorithmId: {
         *     dataSchemaVersion: predictionService
         *   }
         * }
         */
        var algorithmIdPredictionServiceMapping = {
            CodeClassifier: {
                v1: 'CodeReplPredictionService'
            },
            TextClassifier: {
                v1: 'TextInputPredictionService'
            }
        };
        return {
            getPredictionService: function (algorithmId, dataSchemaVersion) {
                if (algorithmIdPredictionServiceMapping.hasOwnProperty(algorithmId)) {
                    // We convert dataSchemaVersion to a string below since JS objects
                    // can't have integer properties.
                    var serviceName = (algorithmIdPredictionServiceMapping[algorithmId]['v' + dataSchemaVersion.toString()]);
                    return $injector.get(serviceName);
                }
                else {
                    return null;
                }
            },
            // The below function is required for running tests with sample
            // prediction services.
            setMapping: function (newAlgorithmIdPredictionServiceMapping) {
                algorithmIdPredictionServiceMapping = (newAlgorithmIdPredictionServiceMapping);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-player-page/services/state-classifier-mapping.service.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-player-page/services/state-classifier-mapping.service.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Services for mapping state names to classifier details.
 */
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var ClassifierObjectFactory_1 = __webpack_require__(/*! domain/classifier/ClassifierObjectFactory */ "./core/templates/dev/head/domain/classifier/ClassifierObjectFactory.ts");
var StateClassifierMappingService = /** @class */ (function () {
    function StateClassifierMappingService(classifierObjectFactory) {
        this.classifierObjectFactory = classifierObjectFactory;
        this.stateClassifierMapping = null;
    }
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'backendStateClassifierMapping' is a dict with
    // underscore_cased keys which give tslint errors against underscore_casing in
    // favor of camelCasing.
    StateClassifierMappingService.prototype.init = function (backendStateClassifierMapping) {
        this.stateClassifierMapping = {};
        var algorithmId, classifierData, dataSchemaVersion;
        for (var stateName in backendStateClassifierMapping) {
            if (backendStateClassifierMapping.hasOwnProperty(stateName)) {
                algorithmId = backendStateClassifierMapping[stateName].algorithm_id;
                classifierData = backendStateClassifierMapping[stateName].classifier_data;
                dataSchemaVersion = backendStateClassifierMapping[stateName].data_schema_version;
                this.stateClassifierMapping[stateName] =
                    this.classifierObjectFactory.create(algorithmId, classifierData, dataSchemaVersion);
            }
        }
    };
    StateClassifierMappingService.prototype.getClassifier = function (stateName) {
        if (this.stateClassifierMapping &&
            this.stateClassifierMapping.hasOwnProperty(stateName)) {
            return this.stateClassifierMapping[stateName];
        }
        else {
            return null;
        }
    };
    var _a;
    StateClassifierMappingService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof ClassifierObjectFactory_1.ClassifierObjectFactory !== "undefined" && ClassifierObjectFactory_1.ClassifierObjectFactory) === "function" ? _a : Object])
    ], StateClassifierMappingService);
    return StateClassifierMappingService;
}());
exports.StateClassifierMappingService = StateClassifierMappingService;
angular.module('oppia').factory('StateClassifierMappingService', static_1.downgradeInjectable(StateClassifierMappingService));


/***/ }),

/***/ "./core/templates/dev/head/services/ExplorationFeaturesService.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/services/ExplorationFeaturesService.ts ***!
  \************************************************************************/
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
 * @fileoverview Service for determining the visibility of advanced features in
 *               the exploration editor.
 */
var core_1 = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
var static_1 = __webpack_require__(/*! @angular/upgrade/static */ "./node_modules/@angular/upgrade/bundles/upgrade-static.umd.js");
var ExplorationFeaturesService = /** @class */ (function () {
    function ExplorationFeaturesService() {
    }
    ExplorationFeaturesService_1 = ExplorationFeaturesService;
    // TODO(#7176): Replace 'any' with the exact type. This has been kept as
    // 'any' because 'explorationData' and 'featuresData' are dicts with
    // underscore_cased keys which give tslint errors against underscore_casing
    // in favor of camelCasing.
    ExplorationFeaturesService.prototype.init = function (explorationData, featuresData) {
        if (ExplorationFeaturesService_1.serviceIsInitialized) {
            return;
        }
        ExplorationFeaturesService_1.settings.isImprovementsTabEnabled =
            featuresData.is_improvements_tab_enabled;
        ExplorationFeaturesService_1.settings.isPlaythroughRecordingEnabled =
            featuresData.is_exploration_whitelisted;
        if (explorationData.param_changes &&
            explorationData.param_changes.length > 0) {
            this.enableParameters();
        }
        else {
            for (var state in explorationData.states) {
                if (explorationData.states[state].param_changes.length > 0) {
                    this.enableParameters();
                    break;
                }
            }
        }
        ExplorationFeaturesService_1.serviceIsInitialized = true;
    };
    ExplorationFeaturesService.prototype.isInitialized = function () {
        return ExplorationFeaturesService_1.serviceIsInitialized;
    };
    ExplorationFeaturesService.prototype.areParametersEnabled = function () {
        return ExplorationFeaturesService_1.settings.areParametersEnabled;
    };
    ExplorationFeaturesService.prototype.isImprovementsTabEnabled = function () {
        return ExplorationFeaturesService_1.settings.isImprovementsTabEnabled;
    };
    ExplorationFeaturesService.prototype.isPlaythroughRecordingEnabled = function () {
        return ExplorationFeaturesService_1.settings.isPlaythroughRecordingEnabled;
    };
    ExplorationFeaturesService.prototype.enableParameters = function () {
        ExplorationFeaturesService_1.settings.areParametersEnabled = true;
    };
    var ExplorationFeaturesService_1;
    ExplorationFeaturesService.serviceIsInitialized = false;
    ExplorationFeaturesService.settings = {
        isImprovementsTabEnabled: false,
        isPlaythroughRecordingEnabled: false,
        areParametersEnabled: false
    };
    ExplorationFeaturesService = ExplorationFeaturesService_1 = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ExplorationFeaturesService);
    return ExplorationFeaturesService;
}());
exports.ExplorationFeaturesService = ExplorationFeaturesService;
angular.module('oppia').factory('ExplorationFeaturesService', static_1.downgradeInjectable(ExplorationFeaturesService));


/***/ }),

/***/ "./core/templates/dev/head/services/ExplorationHtmlFormatterService.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/services/ExplorationHtmlFormatterService.ts ***!
  \*****************************************************************************/
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
/**
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
__webpack_require__(/*! filters/string-utility-filters/camel-case-to-hyphens.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/camel-case-to-hyphens.filter.ts");
__webpack_require__(/*! services/ExtensionTagAssemblerService.ts */ "./core/templates/dev/head/services/ExtensionTagAssemblerService.ts");
__webpack_require__(/*! services/HtmlEscaperService.ts */ "./core/templates/dev/head/services/HtmlEscaperService.ts");
// A service that provides a number of utility functions useful to both the
// editor and player.
angular.module('oppia').factory('ExplorationHtmlFormatterService', [
    '$filter', 'ExtensionTagAssemblerService', 'HtmlEscaperService',
    function ($filter, ExtensionTagAssemblerService, HtmlEscaperService) {
        return {
            /**
             * @param {string} interactionId - The interaction id.
             * @param {object} interactionCustomizationArgSpecs - The various
             *   attributes that the interaction depends on.
             * @param {boolean} parentHasLastAnswerProperty - If this function is
             *   called in the exploration_player view (including the preview mode),
             *   callers should ensure that parentHasLastAnswerProperty is set to
             *   true and $scope.lastAnswer =
             *   PlayerTranscriptService.getLastAnswerOnDisplayedCard(index) is set on
             *   the parent controller of the returned tag.
             *   Otherwise, parentHasLastAnswerProperty should be set to false.
             * @param {string} labelForFocusTarget - The label for setting focus on
             *   the interaction.
             */
            getInteractionHtml: function (interactionId, interactionCustomizationArgSpecs, parentHasLastAnswerProperty, labelForFocusTarget) {
                var htmlInteractionId = $filter('camelCaseToHyphens')(interactionId);
                var element = $('<oppia-interactive-' + htmlInteractionId + '>');
                element = (ExtensionTagAssemblerService.formatCustomizationArgAttrs(element, interactionCustomizationArgSpecs));
                element.attr('last-answer', parentHasLastAnswerProperty ?
                    'lastAnswer' : 'null');
                if (labelForFocusTarget) {
                    element.attr('label-for-focus-target', labelForFocusTarget);
                }
                return element.get(0).outerHTML;
            },
            getAnswerHtml: function (answer, interactionId, interactionCustomizationArgs) {
                // TODO(sll): Get rid of this special case for multiple choice.
                var interactionChoices = null;
                if (interactionCustomizationArgs.choices) {
                    interactionChoices = interactionCustomizationArgs.choices.value;
                }
                var el = $('<oppia-response-' + $filter('camelCaseToHyphens')(interactionId) + '>');
                el.attr('answer', HtmlEscaperService.objToEscapedJson(answer));
                if (interactionChoices) {
                    el.attr('choices', HtmlEscaperService.objToEscapedJson(interactionChoices));
                }
                return ($('<div>').append(el)).html();
            },
            getShortAnswerHtml: function (answer, interactionId, interactionCustomizationArgs) {
                // TODO(sll): Get rid of this special case for multiple choice.
                var interactionChoices = null;
                if (interactionCustomizationArgs.choices) {
                    interactionChoices = interactionCustomizationArgs.choices.value;
                }
                var el = $('<oppia-short-response-' + $filter('camelCaseToHyphens')(interactionId) + '>');
                el.attr('answer', HtmlEscaperService.objToEscapedJson(answer));
                if (interactionChoices) {
                    el.attr('choices', HtmlEscaperService.objToEscapedJson(interactionChoices));
                }
                return ($('<span>').append(el)).html();
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/ExtensionTagAssemblerService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/ExtensionTagAssemblerService.ts ***!
  \**************************************************************************/
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
/**
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
__webpack_require__(/*! filters/string-utility-filters/camel-case-to-hyphens.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/camel-case-to-hyphens.filter.ts");
// Service for assembling extension tags (for interactions).
angular.module('oppia').factory('ExtensionTagAssemblerService', [
    '$filter', 'HtmlEscaperService', function ($filter, HtmlEscaperService) {
        return {
            formatCustomizationArgAttrs: function (element, customizationArgSpecs) {
                for (var caSpecName in customizationArgSpecs) {
                    var caSpecValue = customizationArgSpecs[caSpecName].value;
                    element.attr($filter('camelCaseToHyphens')(caSpecName) + '-with-value', HtmlEscaperService.objToEscapedJson(caSpecValue));
                }
                return element;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/LocalStorageService.ts":
/*!*****************************************************************!*\
  !*** ./core/templates/dev/head/services/LocalStorageService.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for saving data locally on the client machine.
 */
__webpack_require__(/*! domain/exploration/ExplorationDraftObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ExplorationDraftObjectFactory.ts");
// Service for saving exploration draft changes to local storage.
//
// Note that the draft is only saved if localStorage exists and works
// (i.e. has storage capacity).
angular.module('oppia').factory('LocalStorageService', [
    'ExplorationDraftObjectFactory',
    function (ExplorationDraftObjectFactory) {
        // Check that local storage exists and works as expected.
        // If it does storage stores the localStorage object,
        // else storage is undefined or false.
        var storage = (function () {
            var test = 'test';
            var result;
            try {
                localStorage.setItem(test, test);
                result = localStorage.getItem(test) === test;
                localStorage.removeItem(test);
                return result && localStorage;
            }
            catch (exception) { }
        }());
        var LAST_SELECTED_TRANSLATION_LANGUAGE_KEY = ('last_selected_translation_lang');
        /**
         * Create the key to access the changeList in localStorage
         * @param {String} explorationId - The exploration id of the changeList
         *   to be accessed.
         */
        var _createExplorationDraftKey = function (explorationId) {
            return 'draft_' + explorationId;
        };
        return {
            /**
             * Check that localStorage is available to the client.
             * @returns {boolean} true iff the client has access to localStorage.
             */
            isStorageAvailable: function () {
                return Boolean(storage);
            },
            /**
             * Save the given changeList to localStorage along with its
             * draftChangeListId
             * @param {String} explorationId - The id of the exploration
             *   associated with the changeList to be saved.
             * @param {List} changeList - The exploration change list to be saved.
             * @param {Integer} draftChangeListId - The id of the draft to be saved.
             */
            saveExplorationDraft: function (explorationId, changeList, draftChangeListId) {
                var localSaveKey = _createExplorationDraftKey(explorationId);
                if (storage) {
                    var draftDict = ExplorationDraftObjectFactory.toLocalStorageDict(changeList, draftChangeListId);
                    storage.setItem(localSaveKey, JSON.stringify(draftDict));
                }
            },
            /**
             * Retrieve the local save of the changeList associated with the given
             * exploration id.
             * @param {String} explorationId - The exploration id of the change list
             *   to be retrieved.
             * @returns {Object} The local save draft object if it exists,
             *   else null.
             */
            getExplorationDraft: function (explorationId) {
                if (storage) {
                    var draftDict = JSON.parse(storage.getItem(_createExplorationDraftKey(explorationId)));
                    if (draftDict) {
                        return ExplorationDraftObjectFactory.createFromLocalStorageDict(draftDict);
                    }
                }
                return null;
            },
            /**
             * Remove the local save of the changeList associated with the given
             * exploration id.
             * @param {String} explorationId - The exploration id of the change list
             *   to be removed.
             */
            removeExplorationDraft: function (explorationId) {
                if (storage) {
                    storage.removeItem(_createExplorationDraftKey(explorationId));
                }
            },
            /**
             * Save the given language code to localStorage along.
             * @param {List} changeList - The last selected language code to be saved.
             */
            updateLastSelectedTranslationLanguageCode: function (languageCode) {
                if (storage) {
                    storage.setItem(LAST_SELECTED_TRANSLATION_LANGUAGE_KEY, languageCode);
                }
            },
            /**
             * Retrieve the local save of the last selected language for translation.
             * @returns {String} The local save of the last selected language for
             *   translation if it exists, else null.
             */
            getLastSelectedTranslationLanguageCode: function () {
                if (storage) {
                    var languageCode = (storage.getItem(LAST_SELECTED_TRANSLATION_LANGUAGE_KEY));
                    return languageCode;
                }
                return null;
            },
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/ValidatorsService.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/services/ValidatorsService.ts ***!
  \***************************************************************/
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
/**
 * @fileoverview Service for validating things and (optionally) displaying
 * warning messages if the validation fails.
 */
__webpack_require__(/*! filters/string-utility-filters/normalize-whitespace.filter.ts */ "./core/templates/dev/head/filters/string-utility-filters/normalize-whitespace.filter.ts");
angular.module('oppia').factory('ValidatorsService', [
    '$filter', 'AlertsService', 'INVALID_NAME_CHARS',
    function ($filter, AlertsService, INVALID_NAME_CHARS) {
        return {
            /**
             * Checks whether an entity name is valid, and displays a warning message
             * if it isn't.
             * @param {string} input - The input to be checked.
             * @param {boolean} showWarnings - Whether to show warnings in the
             *   butterbar.
             * @return {boolean} True if the entity name is valid, false otherwise.
             */
            isValidEntityName: function (input, showWarnings, allowEmpty) {
                input = $filter('normalizeWhitespace')(input);
                if (!input && !allowEmpty) {
                    if (showWarnings) {
                        AlertsService.addWarning('Please enter a non-empty name.');
                    }
                    return false;
                }
                for (var i = 0; i < INVALID_NAME_CHARS.length; i++) {
                    if (input.indexOf(INVALID_NAME_CHARS[i]) !== -1) {
                        if (showWarnings) {
                            AlertsService.addWarning('Invalid input. Please use a non-empty description ' +
                                'consisting of alphanumeric characters, spaces and/or hyphens.');
                        }
                        return false;
                    }
                }
                return true;
            },
            isValidExplorationTitle: function (input, showWarnings) {
                if (!this.isValidEntityName(input, showWarnings)) {
                    return false;
                }
                if (input.length > 40) {
                    if (showWarnings) {
                        AlertsService.addWarning('Exploration titles should be at most 40 characters long.');
                    }
                    return false;
                }
                return true;
            },
            // NB: this does not check whether the card name already exists in the
            // states dict.
            isValidStateName: function (input, showWarnings) {
                if (!this.isValidEntityName(input, showWarnings)) {
                    return false;
                }
                if (input.length > 50) {
                    if (showWarnings) {
                        AlertsService.addWarning('Card names should be at most 50 characters long.');
                    }
                    return false;
                }
                return true;
            },
            isNonempty: function (input, showWarnings) {
                if (!input) {
                    if (showWarnings) {
                        // TODO(sll): Allow this warning to be more specific in terms of
                        // what needs to be entered.
                        AlertsService.addWarning('Please enter a non-empty value.');
                    }
                    return false;
                }
                return true;
            },
            isValidExplorationId: function (input, showWarnings) {
                // Exploration IDs are urlsafe base64-encoded.
                var VALID_ID_CHARS_REGEX = /^[a-zA-Z0-9_\-]+$/g;
                if (!input || !VALID_ID_CHARS_REGEX.test(input)) {
                    if (showWarnings) {
                        AlertsService.addWarning('Please enter a valid exploration ID.');
                    }
                    return false;
                }
                return true;
            }
        };
    }
]);


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9jdXN0b20tZm9ybXMtZGlyZWN0aXZlcy9zZWxlY3QyLWRyb3Bkb3duLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3ItcHJvcGVydGllcy1zZXJ2aWNlcy9zdGF0ZS1lZGl0b3Iuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY2xhc3NpZmllci9BbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NsYXNzaWZpZXIvQ2xhc3NpZmllck9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9FZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9TZWFyY2hFeHBsb3JhdGlvbnNCYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY29sbGVjdGlvbi9jb2xsZWN0aW9uLWRvbWFpbi5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9jb2xsZWN0aW9uL2NvbGxlY3Rpb24tZG9tYWluLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9FZGl0YWJsZUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL0V4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9IaW50T2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vSW50ZXJhY3Rpb25PYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9PdXRjb21lT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9QYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9SZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1J1bGVPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9Tb2x1dGlvbk9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1N0YXRlc09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9zdGF0ZS9TdGF0ZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3N1bW1hcnkvRXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NhbWVsLWNhc2UtdG8taHlwaGVucy5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NvbnZlcnQtdG8tcGxhaW4tdGV4dC5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL25vcm1hbGl6ZS13aGl0ZXNwYWNlLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UuY29uc3RhbnRzLmFqcy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UuY29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9jb2xsZWN0aW9uLWVkaXRvci1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uuc2NyaXB0cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2VkaXRvci10YWIvY29sbGVjdGlvbi1lZGl0b3ItdGFiLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2VkaXRvci10YWIvY29sbGVjdGlvbi1ub2RlLWNyZWF0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvZWRpdG9yLXRhYi9jb2xsZWN0aW9uLW5vZGUtZWRpdG9yLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2hpc3RvcnktdGFiL2NvbGxlY3Rpb24taGlzdG9yeS10YWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvbmF2YmFyL2NvbGxlY3Rpb24tZWRpdG9yLW5hdmJhci1icmVhZGNydW1iLmRpcmVjdGl2ZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL25hdmJhci9jb2xsZWN0aW9uLWVkaXRvci1uYXZiYXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvY29sbGVjdGlvbi1lZGl0b3Itc3RhdGUuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2NvbGxlY3Rpb24tbGluZWFyaXplci5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2V0dGluZ3MtdGFiL2NvbGxlY3Rpb24tZGV0YWlscy1lZGl0b3IuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2V0dGluZ3MtdGFiL2NvbGxlY3Rpb24tcGVybWlzc2lvbnMtY2FyZC5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9zZXR0aW5ncy10YWIvY29sbGVjdGlvbi1zZXR0aW5ncy10YWIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvY29sbGVjdGlvbi1zdGF0aXN0aWNzLXRhYi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZWRpdG9yLXRhYi9zZXJ2aWNlcy9zb2x1dGlvbi12YWxpZGl0eS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2FuZ3VsYXItbmFtZS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2F1dG9zYXZlLWluZm8tbW9kYWxzLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvY2hhbmdlLWxpc3Quc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9jaGFuZ2VzLWluLWh1bWFuLXJlYWRhYmxlLWZvcm0uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9leHBsb3JhdGlvbi1kYXRhLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvZXhwbG9yYXRpb24taW5pdC1zdGF0ZS1uYW1lLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvZXhwbG9yYXRpb24tcHJvcGVydHkuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9leHBsb3JhdGlvbi1zdGF0ZXMuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9yb3V0ZXIuc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS5jb25zdGFudHMuYWpzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlLmNvbnN0YW50cy50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS9zZXJ2aWNlcy9hbnN3ZXItY2xhc3NpZmljYXRpb24uc2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS9zZXJ2aWNlcy9wcmVkaWN0aW9uLWFsZ29yaXRobS1yZWdpc3RyeS5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzL3N0YXRlLWNsYXNzaWZpZXItbWFwcGluZy5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0V4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0V4cGxvcmF0aW9uSHRtbEZvcm1hdHRlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvRXh0ZW5zaW9uVGFnQXNzZW1ibGVyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Mb2NhbFN0b3JhZ2VTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1ZhbGlkYXRvcnNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdCQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUFpQiw0QkFBNEI7QUFDN0M7QUFDQTtBQUNBLDBCQUFrQiwyQkFBMkI7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxtQkFBTyxDQUFDLDhGQUF5QjtBQUNoRCxhQUFhLG1CQUFPLENBQUMsaUVBQWU7QUFDcEMsc0JBQXNCLG1CQUFPLENBQUMsaUVBQWU7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTs7Ozs7Ozs7Ozs7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvSkFBMEQ7QUFDbEUsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFD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Q2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRIQUE4QztBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLDJCQUEyQjtBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwyQkFBMkI7QUFDdEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsT0FBTztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUIsdUJBQXVCLE9BQU87QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCLHVCQUF1QixPQUFPO0FBQzlCLHVCQUF1QixPQUFPO0FBQzlCLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUI7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUIsdUJBQXVCLE9BQU87QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0ZBQTBCO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQy9QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SkFBNEQ7QUFD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QWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsOExBQ29DO0FBQzVDLG1CQUFPLENBQUMsNEtBQXNFO0FBQzlFLG1CQUFPLENBQUMsb01BQ3FCO0FBQzdCLG1CQUFPLENBQUMsZ0hBQXdDO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiw4QkFBOEI7QUFDakQsMEJBQTBCLDRDQUE0QztBQUN0RSxzQkFBc0Isb0NBQW9DO0FBQzFELHVCQUF1QixzQ0FBc0M7QUFDN0Qsb0JBQW9CLGdDQUFnQztBQUNwRCwyQkFBMkIsOENBQThDO0FBQ3pFLHNCQUFzQixvQ0FBb0M7QUFDMUQsdUJBQXVCLHNDQUFzQztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzFQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxjQUFjO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsbUJBQU8sQ0FBQyxxS0FBaUU7QUFDbkg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLGNBQWM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDs7Ozs7Ozs7Ozs7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyw0SkFBOEQ7QUFDdEUsbUJBQU8sQ0FBQyxrTUFDc0M7QUFDOUMsbUJBQU8sQ0FBQyx3TEFB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsOEpBQStEO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUIsdUJBQXVCLFFBQVE7QUFDL0I7QUFDQSx3QkFBd0IsUUFBUTtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsK0JBQStCO0FBQzlEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29sbGVjdGlvbl9lZGl0b3IuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4gXHRmdW5jdGlvbiB3ZWJwYWNrSnNvbnBDYWxsYmFjayhkYXRhKSB7XG4gXHRcdHZhciBjaHVua0lkcyA9IGRhdGFbMF07XG4gXHRcdHZhciBtb3JlTW9kdWxlcyA9IGRhdGFbMV07XG4gXHRcdHZhciBleGVjdXRlTW9kdWxlcyA9IGRhdGFbMl07XG5cbiBcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4gXHRcdC8vIHRoZW4gZmxhZyBhbGwgXCJjaHVua0lkc1wiIGFzIGxvYWRlZCBhbmQgZmlyZSBjYWxsYmFja1xuIFx0XHR2YXIgbW9kdWxlSWQsIGNodW5rSWQsIGkgPSAwLCByZXNvbHZlcyA9IFtdO1xuIFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuIFx0XHRcdGNodW5rSWQgPSBjaHVua0lkc1tpXTtcbiBcdFx0XHRpZihpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0pIHtcbiBcdFx0XHRcdHJlc29sdmVzLnB1c2goaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdWzBdKTtcbiBcdFx0XHR9XG4gXHRcdFx0aW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gMDtcbiBcdFx0fVxuIFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbiBcdFx0XHRpZihPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuIFx0XHRcdFx0bW9kdWxlc1ttb2R1bGVJZF0gPSBtb3JlTW9kdWxlc1ttb2R1bGVJZF07XG4gXHRcdFx0fVxuIFx0XHR9XG4gXHRcdGlmKHBhcmVudEpzb25wRnVuY3Rpb24pIHBhcmVudEpzb25wRnVuY3Rpb24oZGF0YSk7XG5cbiBcdFx0d2hpbGUocmVzb2x2ZXMubGVuZ3RoKSB7XG4gXHRcdFx0cmVzb2x2ZXMuc2hpZnQoKSgpO1xuIFx0XHR9XG5cbiBcdFx0Ly8gYWRkIGVudHJ5IG1vZHVsZXMgZnJvbSBsb2FkZWQgY2h1bmsgdG8gZGVmZXJyZWQgbGlzdFxuIFx0XHRkZWZlcnJlZE1vZHVsZXMucHVzaC5hcHBseShkZWZlcnJlZE1vZHVsZXMsIGV4ZWN1dGVNb2R1bGVzIHx8IFtdKTtcblxuIFx0XHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIGFsbCBjaHVua3MgcmVhZHlcbiBcdFx0cmV0dXJuIGNoZWNrRGVmZXJyZWRNb2R1bGVzKCk7XG4gXHR9O1xuIFx0ZnVuY3Rpb24gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKSB7XG4gXHRcdHZhciByZXN1bHQ7XG4gXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZE1vZHVsZXMubGVuZ3RoOyBpKyspIHtcbiBcdFx0XHR2YXIgZGVmZXJyZWRNb2R1bGUgPSBkZWZlcnJlZE1vZHVsZXNbaV07XG4gXHRcdFx0dmFyIGZ1bGZpbGxlZCA9IHRydWU7XG4gXHRcdFx0Zm9yKHZhciBqID0gMTsgaiA8IGRlZmVycmVkTW9kdWxlLmxlbmd0aDsgaisrKSB7XG4gXHRcdFx0XHR2YXIgZGVwSWQgPSBkZWZlcnJlZE1vZHVsZVtqXTtcbiBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rc1tkZXBJZF0gIT09IDApIGZ1bGZpbGxlZCA9IGZhbHNlO1xuIFx0XHRcdH1cbiBcdFx0XHRpZihmdWxmaWxsZWQpIHtcbiBcdFx0XHRcdGRlZmVycmVkTW9kdWxlcy5zcGxpY2UoaS0tLCAxKTtcbiBcdFx0XHRcdHJlc3VsdCA9IF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gZGVmZXJyZWRNb2R1bGVbMF0pO1xuIFx0XHRcdH1cbiBcdFx0fVxuXG4gXHRcdHJldHVybiByZXN1bHQ7XG4gXHR9XG5cbiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4gXHQvLyB1bmRlZmluZWQgPSBjaHVuayBub3QgbG9hZGVkLCBudWxsID0gY2h1bmsgcHJlbG9hZGVkL3ByZWZldGNoZWRcbiBcdC8vIFByb21pc2UgPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4gXHR2YXIgaW5zdGFsbGVkQ2h1bmtzID0ge1xuIFx0XHRcImNvbGxlY3Rpb25fZWRpdG9yXCI6IDBcbiBcdH07XG5cbiBcdHZhciBkZWZlcnJlZE1vZHVsZXMgPSBbXTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0dmFyIGpzb25wQXJyYXkgPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gPSB3aW5kb3dbXCJ3ZWJwYWNrSnNvbnBcIl0gfHwgW107XG4gXHR2YXIgb2xkSnNvbnBGdW5jdGlvbiA9IGpzb25wQXJyYXkucHVzaC5iaW5kKGpzb25wQXJyYXkpO1xuIFx0anNvbnBBcnJheS5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2s7XG4gXHRqc29ucEFycmF5ID0ganNvbnBBcnJheS5zbGljZSgpO1xuIFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb25wQXJyYXkubGVuZ3RoOyBpKyspIHdlYnBhY2tKc29ucENhbGxiYWNrKGpzb25wQXJyYXlbaV0pO1xuIFx0dmFyIHBhcmVudEpzb25wRnVuY3Rpb24gPSBvbGRKc29ucEZ1bmN0aW9uO1xuXG5cbiBcdC8vIGFkZCBlbnRyeSBtb2R1bGUgdG8gZGVmZXJyZWQgbGlzdFxuIFx0ZGVmZXJyZWRNb2R1bGVzLnB1c2goW1wiLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uuc2NyaXB0cy50c1wiLFwidmVuZG9yc35hYm91dH5hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jb21tdW5pdHlfZGFzaGJvYXJkfmNvbnRhY3R+Y3JlYXRvcl9kYXNoYm9hcn43ODU2YzA1YVwiLFwidmVuZG9yc35hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcH43ZjhiY2M2N1wiLFwidmVuZG9yc35hZG1pbn5jb2xsZWN0aW9uX2VkaXRvcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfnByYWN0aWNlX3Nlc345ODhjZmViMVwiLFwiYWJvdXR+YWRtaW5+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29tbXVuaXR5X2Rhc2hib2FyZH5jb250YWN0fmNyZWF0b3JfZGFzaGJvYXJkfmRvbmF0ZX5lMDZhNGExN1wiLFwiY29sbGVjdGlvbl9lZGl0b3J+c3RvcnlfZWRpdG9yXCIsXCJjb2xsZWN0aW9uX2VkaXRvcn5jb2xsZWN0aW9uX3BsYXllclwiLFwiYWRtaW5+Y29sbGVjdGlvbl9lZGl0b3JcIixcImNvbGxlY3Rpb25fZWRpdG9yfnRvcGljX3ZpZXdlclwiXSk7XG4gXHQvLyBydW4gZGVmZXJyZWQgbW9kdWxlcyB3aGVuIHJlYWR5XG4gXHRyZXR1cm4gY2hlY2tEZWZlcnJlZE1vZHVsZXMoKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgc2VsZWN0MiBhdXRvY29tcGxldGUgY29tcG9uZW50LlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ3NlbGVjdDJEcm9wZG93bicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgLy8gRGlyZWN0aXZlIGZvciBpbmNvcnBvcmF0aW5nIHNlbGVjdDIgZHJvcGRvd25zLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgLy8gV2hldGhlciB0byBhbGxvdyBtdWx0aXBsZSBjaG9pY2VzLiBJbiBvcmRlciB0byBkbyBzbywgdGhlIHZhbHVlIG9mXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBhdHRyaWJ1dGUgbXVzdCBiZSB0aGUgZXhhY3Qgc3RyaW5nICd0cnVlJy5cbiAgICAgICAgICAgICAgICBhbGxvd011bHRpcGxlQ2hvaWNlczogJ0AnLFxuICAgICAgICAgICAgICAgIGNob2ljZXM6ICc9JyxcbiAgICAgICAgICAgICAgICAvLyBBbiBhZGRpdGlvbmFsIENTUyBjbGFzcyB0byBhZGQgdG8gdGhlIHNlbGVjdDIgZHJvcGRvd24uIE1heSBiZVxuICAgICAgICAgICAgICAgIC8vIHVuZGVmaW5lZC5cbiAgICAgICAgICAgICAgICBkcm9wZG93bkNzc0NsYXNzOiAnQCcsXG4gICAgICAgICAgICAgICAgLy8gQSBmdW5jdGlvbiB0aGF0IGZvcm1hdHMgYSBuZXcgc2VsZWN0aW9uLiBNYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICAgICAgICAgIGZvcm1hdE5ld1NlbGVjdGlvbjogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSBtZXNzYWdlIHNob3duIHdoZW4gYW4gaW52YWxpZCBzZWFyY2ggdGVybSBpcyBlbnRlcmVkLiBNYXkgYmVcbiAgICAgICAgICAgICAgICAvLyB1bmRlZmluZWQsIGluIHdoaWNoIGNhc2UgdGhpcyBkZWZhdWx0cyB0byAnTm8gbWF0Y2hlcyBmb3VuZCcuXG4gICAgICAgICAgICAgICAgaW52YWxpZFNlYXJjaFRlcm1NZXNzYWdlOiAnQCcsXG4gICAgICAgICAgICAgICAgaXRlbTogJz0nLFxuICAgICAgICAgICAgICAgIC8vIFRoZSByZWdleCB1c2VkIHRvIHZhbGlkYXRlIG5ld2x5LWVudGVyZWQgY2hvaWNlcyB0aGF0IGRvIG5vdFxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgZXhpc3QuIElmIGl0IGlzIHVuZGVmaW5lZCB0aGVuIGFsbCBuZXcgY2hvaWNlcyBhcmUgcmVqZWN0ZWQuXG4gICAgICAgICAgICAgICAgbmV3Q2hvaWNlUmVnZXg6ICdAJyxcbiAgICAgICAgICAgICAgICBvblNlbGVjdGlvbkNoYW5nZTogJyYnLFxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnQCcsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICdAJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvZm9ybXMvY3VzdG9tLWZvcm1zLWRpcmVjdGl2ZXMvJyArXG4gICAgICAgICAgICAgICAgJ3NlbGVjdDItZHJvcGRvd24uZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRlbGVtZW50JywgZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5ld0Nob2ljZVZhbGlkYXRvciA9IG5ldyBSZWdFeHAoJHNjb3BlLm5ld0Nob2ljZVJlZ2V4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdDJPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dDbGVhcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiAkc2NvcGUuY2hvaWNlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlOiAkc2NvcGUuYWxsb3dNdWx0aXBsZUNob2ljZXMgPT09ICd0cnVlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3M6ICRzY29wZS5uZXdDaG9pY2VSZWdleCAhPT0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICRzY29wZS5wbGFjZWhvbGRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAkc2NvcGUud2lkdGggfHwgJzI1MHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyb3Bkb3duQ3NzQ2xhc3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUYWc6IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zLnRlcm0ubWF0Y2goJHNjb3BlLm5ld0Nob2ljZVZhbGlkYXRvcikgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwYXJhbXMudGVybSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogcGFyYW1zLnRlcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVJlc3VsdDogZnVuY3Rpb24gKHF1ZXJ5UmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvZXNDaG9pY2VNYXRjaFRleHQgPSBmdW5jdGlvbiAoY2hvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaG9pY2UuaWQgPT09IHF1ZXJ5UmVzdWx0LnRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmNob2ljZXMgJiYgJHNjb3BlLmNob2ljZXMuc29tZShkb2VzQ2hvaWNlTWF0Y2hUZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnlSZXN1bHQudGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZm9ybWF0TmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmZvcm1hdE5ld1NlbGVjdGlvbihxdWVyeVJlc3VsdC50ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeVJlc3VsdC50ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9SZXN1bHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuaW52YWxpZFNlYXJjaFRlcm1NZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmludmFsaWRTZWFyY2hUZXJtTWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnTm8gbWF0Y2hlcyBmb3VuZCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUuZHJvcGRvd25Dc3NDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0Mk9wdGlvbnMuZHJvcGRvd25Dc3NDbGFzcyA9ICRzY29wZS5kcm9wZG93bkNzc0NsYXNzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3QyTm9kZSA9ICRlbGVtZW50WzBdLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIGRyb3Bkb3duLlxuICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS5zZWxlY3QyKHNlbGVjdDJPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgJChzZWxlY3QyTm9kZSkudmFsKCRzY29wZS5pdGVtKS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlICRzY29wZS5pdGVtIHdoZW4gdGhlIHNlbGVjdGlvbiBjaGFuZ2VzLlxuICAgICAgICAgICAgICAgICAgICAkKHNlbGVjdDJOb2RlKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLml0ZW0gPSAkKHNlbGVjdDJOb2RlKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5vblNlbGVjdGlvbkNoYW5nZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzcG9uZCB0byBleHRlcm5hbCBjaGFuZ2VzIGluICRzY29wZS5pdGVtXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kd2F0Y2goJ2l0ZW0nLCBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoc2VsZWN0Mk5vZGUpLnZhbChuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBBIHNlcnZpY2UgdGhhdCBtYWludGFpbnMgYSByZWNvcmQgb2YgdGhlIG9iamVjdHMgZXhjbHVzaXZlIHRvXG4gKiBhIHN0YXRlLlxuICovXG52YXIgY2xvbmVEZWVwXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcImxvZGFzaC9jbG9uZURlZXBcIikpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHNvbHV0aW9uX3ZhbGlkaXR5X3NlcnZpY2VfMSA9IHJlcXVpcmUoXCJwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL3NlcnZpY2VzL3NvbHV0aW9uLXZhbGlkaXR5LnNlcnZpY2VcIik7XG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbnZhciBTdGF0ZUVkaXRvclNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RhdGVFZGl0b3JTZXJ2aWNlKHNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlKSB7XG4gICAgICAgIHRoaXMuc29sdXRpb25WYWxpZGl0eVNlcnZpY2UgPSBzb2x1dGlvblZhbGlkaXR5U2VydmljZTtcbiAgICAgICAgdGhpcy5hY3RpdmVTdGF0ZU5hbWUgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YXRlTmFtZXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb3JyZWN0bmVzc0ZlZWRiYWNrRW5hYmxlZCA9IG51bGw7XG4gICAgICAgIHRoaXMuaW5RdWVzdGlvbk1vZGUgPSBudWxsO1xuICAgICAgICAvLyBDdXJyZW50bHksIHRoZSBvbmx5IHBsYWNlIHdoZXJlIHRoaXMgaXMgdXNlZCBpbiB0aGUgc3RhdGUgZWRpdG9yXG4gICAgICAgIC8vIGlzIGluIHNvbHV0aW9uIHZlcmlmaWNhdGlvbi4gU28sIG9uY2UgdGhlIGludGVyYWN0aW9uIGlzIHNldCBpbiB0aGlzXG4gICAgICAgIC8vIHNlcnZpY2UsIHRoZSBnaXZlbiBzb2x1dGlvbnMgd291bGQgYmUgYXV0b21hdGljYWxseSB2ZXJpZmllZCBmb3IgdGhlIHNldFxuICAgICAgICAvLyBpbnRlcmFjdGlvbi5cbiAgICAgICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgICAgIC8vICdhbnknIGJlY2F1c2UgdGhlIHJldHVybiB0eXBlIGlzIGEgaW50ZXJhY3Rpb24gZG9tYWluIG9iamVjdCB3aGljaCBjYW4gYmVcbiAgICAgICAgLy8gdHlwZWQgb25jZSBJbnRlcmFjdGlvbk9iamVjdEZhY3RvcnkgaXMgdXBncmFkZWQuXG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLm1pc2NvbmNlcHRpb25zQnlTa2lsbCA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxvcmF0aW9uSXNXaGl0ZWxpc3RlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNvbGljaXRBbnN3ZXJEZXRhaWxzID0gbnVsbDtcbiAgICB9XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5nZXRBY3RpdmVTdGF0ZU5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZVN0YXRlTmFtZTtcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuc2V0QWN0aXZlU3RhdGVOYW1lID0gZnVuY3Rpb24gKG5ld0FjdGl2ZVN0YXRlTmFtZSkge1xuICAgICAgICBpZiAobmV3QWN0aXZlU3RhdGVOYW1lID09PSAnJyB8fCBuZXdBY3RpdmVTdGF0ZU5hbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgYWN0aXZlIHN0YXRlIG5hbWU6ICcgKyBuZXdBY3RpdmVTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWN0aXZlU3RhdGVOYW1lID0gbmV3QWN0aXZlU3RhdGVOYW1lO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5pc0V4cGxvcmF0aW9uV2hpdGVsaXN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4cGxvcmF0aW9uSXNXaGl0ZWxpc3RlZDtcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUudXBkYXRlRXhwbG9yYXRpb25XaGl0ZWxpc3RlZFN0YXR1cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmV4cGxvcmF0aW9uSXNXaGl0ZWxpc3RlZCA9IHZhbHVlO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5zZXRNaXNjb25jZXB0aW9uc0J5U2tpbGwgPSBmdW5jdGlvbiAobmV3TWlzY29uY2VwdGlvbnNCeVNraWxsKSB7XG4gICAgICAgIHRoaXMubWlzY29uY2VwdGlvbnNCeVNraWxsID0gbmV3TWlzY29uY2VwdGlvbnNCeVNraWxsO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5nZXRNaXNjb25jZXB0aW9uc0J5U2tpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1pc2NvbmNlcHRpb25zQnlTa2lsbDtcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuc2V0SW50ZXJhY3Rpb24gPSBmdW5jdGlvbiAobmV3SW50ZXJhY3Rpb24pIHtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbiA9IG5ld0ludGVyYWN0aW9uO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5zZXRJbnRlcmFjdGlvbklkID0gZnVuY3Rpb24gKG5ld0lkKSB7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc2V0SWQobmV3SWQpO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5zZXRJbnRlcmFjdGlvbkFuc3dlckdyb3VwcyA9IGZ1bmN0aW9uIChuZXdBbnN3ZXJHcm91cHMpIHtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zZXRBbnN3ZXJHcm91cHMobmV3QW5zd2VyR3JvdXBzKTtcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuc2V0SW50ZXJhY3Rpb25EZWZhdWx0T3V0Y29tZSA9IGZ1bmN0aW9uIChuZXdPdXRjb21lKSB7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc2V0RGVmYXVsdE91dGNvbWUobmV3T3V0Y29tZSk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICduZXdBcmdzJyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2hcbiAgICAvLyBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBTdGF0ZUVkaXRvclNlcnZpY2UucHJvdG90eXBlLnNldEludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3MgPSBmdW5jdGlvbiAobmV3QXJncykge1xuICAgICAgICB0aGlzLmludGVyYWN0aW9uLnNldEN1c3RvbWl6YXRpb25BcmdzKG5ld0FyZ3MpO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnc29sdXRpb24nIGlzIGEgc29sdXRpb24gZG9tYWluIG9iamVjdCB3aGljaCBjYW4gYmUgdHlwZWRcbiAgICAvLyBvbmNlIFNvbHV0aW9uT2JqZWN0RmFjdG9yeSBpcyB1cGdyYWRlZC5cbiAgICBTdGF0ZUVkaXRvclNlcnZpY2UucHJvdG90eXBlLnNldEludGVyYWN0aW9uU29sdXRpb24gPSBmdW5jdGlvbiAoc29sdXRpb24pIHtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zZXRTb2x1dGlvbihzb2x1dGlvbik7XG4gICAgfTtcbiAgICBTdGF0ZUVkaXRvclNlcnZpY2UucHJvdG90eXBlLnNldEludGVyYWN0aW9uSGludHMgPSBmdW5jdGlvbiAoaGludHMpIHtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zZXRIaW50cyhoaW50cyk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGludGVyYWN0aW9uIGRvbWFpbiBvYmplY3Qgd2hpY2ggY2FuIGJlXG4gICAgLy8gdHlwZWQgb25jZSBJbnRlcmFjdGlvbk9iamVjdEZhY3RvcnkgaXMgdXBncmFkZWQuXG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5nZXRJbnRlcmFjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNsb25lRGVlcF8xLmRlZmF1bHQodGhpcy5pbnRlcmFjdGlvbik7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdjdXN0b21pemF0aW9uQXJncycgaXMgYSBkaWN0IHdpdGggdW5kZXJzY29yZV9jYXNlZCBrZXlzXG4gICAgLy8gd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2YgY2FtZWxDYXNpbmcuXG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5nZXRBbnN3ZXJDaG9pY2VzID0gZnVuY3Rpb24gKGludGVyYWN0aW9uSWQsIGN1c3RvbWl6YXRpb25BcmdzKSB7XG4gICAgICAgIGlmICghaW50ZXJhY3Rpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3BlY2lhbCBjYXNlcyBmb3IgbXVsdGlwbGUgY2hvaWNlIGlucHV0IGFuZCBpbWFnZSBjbGljayBpbnB1dC5cbiAgICAgICAgaWYgKGludGVyYWN0aW9uSWQgPT09ICdNdWx0aXBsZUNob2ljZUlucHV0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGN1c3RvbWl6YXRpb25BcmdzLmNob2ljZXMudmFsdWUubWFwKGZ1bmN0aW9uICh2YWwsIGluZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbDogaW5kLFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogdmFsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uSWQgPT09ICdJbWFnZUNsaWNrSW5wdXQnKSB7XG4gICAgICAgICAgICB2YXIgX2Fuc3dlckNob2ljZXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBpbWFnZVdpdGhSZWdpb25zID0gY3VzdG9taXphdGlvbkFyZ3MuaW1hZ2VBbmRSZWdpb25zLnZhbHVlO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBpbWFnZVdpdGhSZWdpb25zLmxhYmVsZWRSZWdpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgX2Fuc3dlckNob2ljZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHZhbDogaW1hZ2VXaXRoUmVnaW9ucy5sYWJlbGVkUmVnaW9uc1tqXS5sYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGltYWdlV2l0aFJlZ2lvbnMubGFiZWxlZFJlZ2lvbnNbal0ubGFiZWxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBfYW5zd2VyQ2hvaWNlcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbklkID09PSAnSXRlbVNlbGVjdGlvbklucHV0JyB8fFxuICAgICAgICAgICAgaW50ZXJhY3Rpb25JZCA9PT0gJ0RyYWdBbmREcm9wU29ydElucHV0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGN1c3RvbWl6YXRpb25BcmdzLmNob2ljZXMudmFsdWUubWFwKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB2YWw6IHZhbCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IHZhbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTdGF0ZUVkaXRvclNlcnZpY2UucHJvdG90eXBlLnNldEluUXVlc3Rpb25Nb2RlID0gZnVuY3Rpb24gKG5ld01vZGVWYWx1ZSkge1xuICAgICAgICB0aGlzLmluUXVlc3Rpb25Nb2RlID0gbmV3TW9kZVZhbHVlO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5pc0luUXVlc3Rpb25Nb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pblF1ZXN0aW9uTW9kZTtcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuc2V0Q29ycmVjdG5lc3NGZWVkYmFja0VuYWJsZWQgPSBmdW5jdGlvbiAobmV3Q29ycmVjdG5lc3NGZWVkYmFja0VuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5jb3JyZWN0bmVzc0ZlZWRiYWNrRW5hYmxlZCA9IG5ld0NvcnJlY3RuZXNzRmVlZGJhY2tFbmFibGVkO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5nZXRDb3JyZWN0bmVzc0ZlZWRiYWNrRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ycmVjdG5lc3NGZWVkYmFja0VuYWJsZWQ7XG4gICAgfTtcbiAgICBTdGF0ZUVkaXRvclNlcnZpY2UucHJvdG90eXBlLnNldFNvbGljaXRBbnN3ZXJEZXRhaWxzID0gZnVuY3Rpb24gKG5ld1NvbGljaXRBbnN3ZXJEZXRhaWxzKSB7XG4gICAgICAgIHRoaXMuc29saWNpdEFuc3dlckRldGFpbHMgPSBuZXdTb2xpY2l0QW5zd2VyRGV0YWlscztcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuZ2V0U29saWNpdEFuc3dlckRldGFpbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvbGljaXRBbnN3ZXJEZXRhaWxzO1xuICAgIH07XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnByb3RvdHlwZS5zZXRTdGF0ZU5hbWVzID0gZnVuY3Rpb24gKG5ld1N0YXRlTmFtZXMpIHtcbiAgICAgICAgdGhpcy5zdGF0ZU5hbWVzID0gbmV3U3RhdGVOYW1lcztcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuZ2V0U3RhdGVOYW1lcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGVOYW1lcztcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuaXNDdXJyZW50U29sdXRpb25WYWxpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc29sdXRpb25WYWxpZGl0eVNlcnZpY2UuaXNTb2x1dGlvblZhbGlkKHRoaXMuYWN0aXZlU3RhdGVOYW1lKTtcbiAgICB9O1xuICAgIFN0YXRlRWRpdG9yU2VydmljZS5wcm90b3R5cGUuZGVsZXRlQ3VycmVudFNvbHV0aW9uVmFsaWRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc29sdXRpb25WYWxpZGl0eVNlcnZpY2UuZGVsZXRlU29sdXRpb25WYWxpZGl0eSh0aGlzLmFjdGl2ZVN0YXRlTmFtZSk7XG4gICAgfTtcbiAgICB2YXIgX2E7XG4gICAgU3RhdGVFZGl0b3JTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIHNvbHV0aW9uX3ZhbGlkaXR5X3NlcnZpY2VfMS5Tb2x1dGlvblZhbGlkaXR5U2VydmljZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzb2x1dGlvbl92YWxpZGl0eV9zZXJ2aWNlXzEuU29sdXRpb25WYWxpZGl0eVNlcnZpY2UpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgU3RhdGVFZGl0b3JTZXJ2aWNlKTtcbiAgICByZXR1cm4gU3RhdGVFZGl0b3JTZXJ2aWNlO1xufSgpKTtcbmV4cG9ydHMuU3RhdGVFZGl0b3JTZXJ2aWNlID0gU3RhdGVFZGl0b3JTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnU3RhdGVFZGl0b3JTZXJ2aWNlJywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShTdGF0ZUVkaXRvclNlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBhbnN3ZXJcbiAqICAgICBDbGFzc2lmaWNhdGlvbiBSZXN1bHQgZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdChvdXRjb21lLCBhbnN3ZXJHcm91cEluZGV4LCBydWxlSW5kZXgsIGNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb24pIHtcbiAgICAgICAgdGhpcy5vdXRjb21lID0gb3V0Y29tZTtcbiAgICAgICAgdGhpcy5hbnN3ZXJHcm91cEluZGV4ID0gYW5zd2VyR3JvdXBJbmRleDtcbiAgICAgICAgdGhpcy5ydWxlSW5kZXggPSBydWxlSW5kZXg7XG4gICAgICAgIHRoaXMuY2xhc3NpZmljYXRpb25DYXRlZ29yaXphdGlvbiA9IGNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb247XG4gICAgfVxuICAgIHJldHVybiBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdDtcbn0oKSk7XG5leHBvcnRzLkFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0ID0gQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQ7XG52YXIgQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnb3V0Y29tZScgaXMgYW4gb3V0Y29tZSBkb21haW4gb2JqZWN0IGFuZCB0aGlzIGNhbiBiZVxuICAgIC8vIGRpcmVjdGx5IHR5cGVkIHRvICdPdXRjb21lJyB0eXBlIG9uY2UgJ091dGNvbWVPYmplY3RGYWN0b3J5JyBpcyB1cGdyYWRlZC5cbiAgICBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZU5ldyA9IGZ1bmN0aW9uIChvdXRjb21lLCBhbnN3ZXJHcm91cEluZGV4LCBydWxlSW5kZXgsIGNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdChvdXRjb21lLCBhbnN3ZXJHcm91cEluZGV4LCBydWxlSW5kZXgsIGNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb24pO1xuICAgIH07XG4gICAgQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeSA9IEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0Fuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgQ2xhc3NpZmllclxuICogICAgIGRvbWFpbiBvYmplY3RzLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgQ2xhc3NpZmllciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDbGFzc2lmaWVyKGFsZ29yaXRobUlkLCBjbGFzc2lmaWVyRGF0YSwgZGF0YVNjaGVtYVZlcnNpb24pIHtcbiAgICAgICAgdGhpcy5hbGdvcml0aG1JZCA9IGFsZ29yaXRobUlkO1xuICAgICAgICB0aGlzLmNsYXNzaWZpZXJEYXRhID0gY2xhc3NpZmllckRhdGE7XG4gICAgICAgIHRoaXMuZGF0YVNjaGVtYVZlcnNpb24gPSBkYXRhU2NoZW1hVmVyc2lvbjtcbiAgICB9XG4gICAgcmV0dXJuIENsYXNzaWZpZXI7XG59KCkpO1xuZXhwb3J0cy5DbGFzc2lmaWVyID0gQ2xhc3NpZmllcjtcbnZhciBDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnY2xhc3NpZmllckRhdGEnIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaFxuICAgIC8vIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLlxuICAgIENsYXNzaWZpZXJPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoYWxnb3JpdGhtSWQsIGNsYXNzaWZpZXJEYXRhLCBkYXRhU2NoZW1hVmVyc2lvbikge1xuICAgICAgICByZXR1cm4gbmV3IENsYXNzaWZpZXIoYWxnb3JpdGhtSWQsIGNsYXNzaWZpZXJEYXRhLCBkYXRhU2NoZW1hVmVyc2lvbik7XG4gICAgfTtcbiAgICBDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIENsYXNzaWZpZXJPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuQ2xhc3NpZmllck9iamVjdEZhY3RvcnkgPSBDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NsYXNzaWZpZXJPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGNoYW5nZSB0aGUgcmlnaHRzIG9mIGNvbGxlY3Rpb25zIGluIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnQ09MTEVDVElPTl9SSUdIVFNfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgQ09MTEVDVElPTl9SSUdIVFNfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIC8vIE1hcHMgcHJldmlvdXNseSBsb2FkZWQgY29sbGVjdGlvbiByaWdodHMgdG8gdGhlaXIgSURzLlxuICAgICAgICB2YXIgY29sbGVjdGlvblJpZ2h0c0NhY2hlID0ge307XG4gICAgICAgIHZhciBfZmV0Y2hDb2xsZWN0aW9uUmlnaHRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgY29sbGVjdGlvblJpZ2h0c1VybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKENPTExFQ1RJT05fUklHSFRTX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoY29sbGVjdGlvblJpZ2h0c1VybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9zZXRDb2xsZWN0aW9uU3RhdHVzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIGlzUHVibGljLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uUHVibGlzaFVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvY29sbGVjdGlvbl9lZGl0b3JfaGFuZGxlci9wdWJsaXNoLzxjb2xsZWN0aW9uX2lkPicsIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uX2lkOiBjb2xsZWN0aW9uSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25VbnB1Ymxpc2hVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybCgnL2NvbGxlY3Rpb25fZWRpdG9yX2hhbmRsZXIvdW5wdWJsaXNoLzxjb2xsZWN0aW9uX2lkPicsIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uX2lkOiBjb2xsZWN0aW9uSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHB1dFBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBjb2xsZWN0aW9uVmVyc2lvblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0VXJsID0gKGlzUHVibGljID8gY29sbGVjdGlvblB1Ymxpc2hVcmwgOiBjb2xsZWN0aW9uVW5wdWJsaXNoVXJsKTtcbiAgICAgICAgICAgICRodHRwLnB1dChyZXF1ZXN0VXJsLCBwdXRQYXJhbXMpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvblJpZ2h0c0NhY2hlW2NvbGxlY3Rpb25JZF0gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvclJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjayhlcnJvclJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2lzQ2FjaGVkID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25SaWdodHNDYWNoZS5oYXNPd25Qcm9wZXJ0eShjb2xsZWN0aW9uSWQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHZXRzIGEgY29sbGVjdGlvbidzIHJpZ2h0cywgZ2l2ZW4gaXRzIElELlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmZXRjaENvbGxlY3Rpb25SaWdodHM6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hDb2xsZWN0aW9uUmlnaHRzKGNvbGxlY3Rpb25JZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJlaGF2ZXMgZXhhY3RseSBhcyBmZXRjaENvbGxlY3Rpb25SaWdodHMgKGluY2x1ZGluZyBjYWxsYmFja1xuICAgICAgICAgICAgICogYmVoYXZpb3IgYW5kIHJldHVybmluZyBhIHByb21pc2Ugb2JqZWN0KSwgZXhjZXB0IHRoaXMgZnVuY3Rpb24gd2lsbFxuICAgICAgICAgICAgICogYXR0ZW1wdCB0byBzZWUgd2hldGhlciB0aGUgZ2l2ZW4gY29sbGVjdGlvbiByaWdodHMgaGFzIGJlZW5cbiAgICAgICAgICAgICAqIGNhY2hlZC4gSWYgaXQgaGFzIG5vdCB5ZXQgYmVlbiBjYWNoZWQsIGl0IHdpbGwgZmV0Y2ggdGhlIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAqIHJpZ2h0cyBmcm9tIHRoZSBiYWNrZW5kLiBJZiBpdCBzdWNjZXNzZnVsbHkgcmV0cmlldmVzIHRoZSBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgKiByaWdodHMgZnJvbSB0aGUgYmFja2VuZCwgaXQgd2lsbCBzdG9yZSBpdCBpbiB0aGUgY2FjaGUgdG8gYXZvaWRcbiAgICAgICAgICAgICAqIHJlcXVlc3RzIGZyb20gdGhlIGJhY2tlbmQgaW4gZnVydGhlciBmdW5jdGlvbiBjYWxscy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9hZENvbGxlY3Rpb25SaWdodHM6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2lzQ2FjaGVkKGNvbGxlY3Rpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShjb2xsZWN0aW9uUmlnaHRzQ2FjaGVbY29sbGVjdGlvbklkXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfZmV0Y2hDb2xsZWN0aW9uUmlnaHRzKGNvbGxlY3Rpb25JZCwgZnVuY3Rpb24gKGNvbGxlY3Rpb25SaWdodHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBmZXRjaGVkIGNvbGxlY3Rpb24gcmlnaHRzIHRvIGF2b2lkIGZ1dHVyZSBmZXRjaGVzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25SaWdodHNDYWNoZVtjb2xsZWN0aW9uSWRdID0gY29sbGVjdGlvblJpZ2h0cztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGNvbGxlY3Rpb25SaWdodHNDYWNoZVtjb2xsZWN0aW9uSWRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGNvbGxlY3Rpb24gcmlnaHRzIGlzIHN0b3JlZCB3aXRoaW4gdGhlXG4gICAgICAgICAgICAgKiBsb2NhbCBkYXRhIGNhY2hlIG9yIGlmIGl0IG5lZWRzIHRvIGJlIHJldHJpZXZlZCBmcm9tIHRoZSBiYWNrZW5kXG4gICAgICAgICAgICAgKiB1cG9uIGEgbGFvZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNDYWNoZWQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2lzQ2FjaGVkKGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXBsYWNlcyB0aGUgY3VycmVudCBjb2xsZWN0aW9uIHJpZ2h0cyBpbiB0aGUgY2FjaGUgZ2l2ZW4gYnkgdGhlXG4gICAgICAgICAgICAgKiBzcGVjaWZpZWQgY29sbGVjdGlvbiBJRCB3aXRoIGEgbmV3IGNvbGxlY3Rpb24gcmlnaHRzIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2FjaGVDb2xsZWN0aW9uUmlnaHRzOiBmdW5jdGlvbiAoY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uUmlnaHRzKSB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvblJpZ2h0c0NhY2hlW2NvbGxlY3Rpb25JZF0gPSBhbmd1bGFyLmNvcHkoY29sbGVjdGlvblJpZ2h0cyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBVcGRhdGVzIGEgY29sbGVjdGlvbidzIHJpZ2h0cyB0byBiZSBoYXZlIHB1YmxpYyBsZWFybmVyIGFjY2VzcywgZ2l2ZW5cbiAgICAgICAgICAgICAqIGl0cyBJRCBhbmQgdmVyc2lvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0Q29sbGVjdGlvblB1YmxpYzogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfc2V0Q29sbGVjdGlvblN0YXR1cyhjb2xsZWN0aW9uSWQsIGNvbGxlY3Rpb25WZXJzaW9uLCB0cnVlLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVXBkYXRlcyBhIGNvbGxlY3Rpb24ncyByaWdodHMgdG8gYmUgaGF2ZSBwcml2YXRlIGxlYXJuZXIgYWNjZXNzLFxuICAgICAgICAgICAgICogZ2l2ZW4gaXRzIElEIGFuZCB2ZXJzaW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uUHJpdmF0ZTogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfc2V0Q29sbGVjdGlvblN0YXR1cyhjb2xsZWN0aW9uSWQsIGNvbGxlY3Rpb25WZXJzaW9uLCBmYWxzZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgYW5kIG11dGF0aW5nIGluc3RhbmNlcyBvZiBmcm9udGVuZFxuICogY29sbGVjdGlvbiByaWdodHMgZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBjbG9uZURlZXBfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2Nsb25lRGVlcFwiKSk7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgQ29sbGVjdGlvblJpZ2h0cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdjb2xsZWN0aW9uUmlnaHRzT2JqZWN0JyBpcyBhIGRpY3Qgd2l0aFxuICAgIC8vIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZ1xuICAgIC8vIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLlxuICAgIGZ1bmN0aW9uIENvbGxlY3Rpb25SaWdodHMoY29sbGVjdGlvblJpZ2h0c09iamVjdCkge1xuICAgICAgICB0aGlzLl9jb2xsZWN0aW9uSWQgPSBjb2xsZWN0aW9uUmlnaHRzT2JqZWN0LmNvbGxlY3Rpb25faWQ7XG4gICAgICAgIHRoaXMuX2NhbkVkaXQgPSBjb2xsZWN0aW9uUmlnaHRzT2JqZWN0LmNhbl9lZGl0O1xuICAgICAgICB0aGlzLl9jYW5VbnB1Ymxpc2ggPSBjb2xsZWN0aW9uUmlnaHRzT2JqZWN0LmNhbl91bnB1Ymxpc2g7XG4gICAgICAgIHRoaXMuX2lzUHJpdmF0ZSA9IGNvbGxlY3Rpb25SaWdodHNPYmplY3QuaXNfcHJpdmF0ZTtcbiAgICAgICAgdGhpcy5fb3duZXJOYW1lcyA9IGNvbGxlY3Rpb25SaWdodHNPYmplY3Qub3duZXJfbmFtZXM7XG4gICAgfVxuICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLmdldENvbGxlY3Rpb25JZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb25JZDtcbiAgICB9O1xuICAgIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgdGhlIHVzZXIgY2FuIGVkaXQgdGhlIGNvbGxlY3Rpb24uIFRoaXMgcHJvcGVydHkgaXNcbiAgICAvLyBpbW11dGFibGUuXG4gICAgQ29sbGVjdGlvblJpZ2h0cy5wcm90b3R5cGUuY2FuRWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhbkVkaXQ7XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIHVzZXIgY2FuIHVucHVibGlzaCB0aGUgY29sbGVjdGlvbi5cbiAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5jYW5VbnB1Ymxpc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYW5VbnB1Ymxpc2g7XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGNvbGxlY3Rpb24gaXMgcHJpdmF0ZS5cbiAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5pc1ByaXZhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc1ByaXZhdGU7XG4gICAgfTtcbiAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGNvbGxlY3Rpb24gaXMgcHVibGljLlxuICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLmlzUHVibGljID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuX2lzUHJpdmF0ZTtcbiAgICB9O1xuICAgIC8vIFNldHMgaXNQcml2YXRlIHRvIGZhbHNlIG9ubHkgaWYgdGhlIHVzZXIgY2FuIGVkaXQgdGhlIGNvcnJlc3BvbmRpbmdcbiAgICAvLyBjb2xsZWN0aW9uLlxuICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLnNldFB1YmxpYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FuRWRpdCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1ByaXZhdGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlciBpcyBub3QgYWxsb3dlZCB0byBlZGl0IHRoaXMgY29sbGVjdGlvbi4nKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gU2V0cyBpc1ByaXZhdGUgdG8gdHJ1ZSBvbmx5IGlmIGNhblVucHVibGlzaCBhbmQgY2FuRWRpdCBhcmUgYm90aCB0cnVlLlxuICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLnNldFByaXZhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmNhbkVkaXQoKSAmJiB0aGlzLmNhblVucHVibGlzaCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1ByaXZhdGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VyIGlzIG5vdCBhbGxvd2VkIHRvIHVucHVibGlzaCB0aGlzIGNvbGxlY3Rpb24uJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIFJldHVybnMgdGhlIG93bmVyIG5hbWVzIG9mIHRoZSBjb2xsZWN0aW9uLiBUaGlzIHByb3BlcnR5IGlzIGltbXV0YWJsZS5cbiAgICBDb2xsZWN0aW9uUmlnaHRzLnByb3RvdHlwZS5nZXRPd25lck5hbWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2xvbmVEZWVwXzEuZGVmYXVsdCh0aGlzLl9vd25lck5hbWVzKTtcbiAgICB9O1xuICAgIC8vIFJldHVybnMgdGhlIHJlZmVyZW5jZSB0byB0aGUgaW50ZXJuYWwgb3duZXJOYW1lcyBhcnJheTsgdGhpcyBmdW5jdGlvbiBpc1xuICAgIC8vIG9ubHkgbWVhbnQgdG8gYmUgdXNlZCBmb3IgQW5ndWxhciBiaW5kaW5ncyBhbmQgc2hvdWxkIG5ldmVyIGJlIHVzZWQgaW5cbiAgICAvLyBjb2RlLiBQbGVhc2UgdXNlIGdldE93bmVyTmFtZXMoKSBhbmQgcmVsYXRlZCBmdW5jdGlvbnMsIGluc3RlYWQuIFBsZWFzZVxuICAgIC8vIGFsc28gYmUgYXdhcmUgdGhpcyBleHBvc2VzIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb2xsZWN0aW9uIHJpZ2h0cyBkb21haW5cbiAgICAvLyBvYmplY3QsIHNvIGNoYW5nZXMgdG8gdGhlIGFycmF5IGl0c2VsZiBtYXkgaW50ZXJuYWxseSBicmVhayB0aGUgZG9tYWluXG4gICAgLy8gb2JqZWN0LlxuICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLmdldEJpbmRhYmxlT3duZXJOYW1lcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX293bmVyTmFtZXM7XG4gICAgfTtcbiAgICAvLyBSZWFzc2lnbnMgYWxsIHZhbHVlcyB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uIHRvIG1hdGNoIHRoZSBleGlzdGluZ1xuICAgIC8vIGNvbGxlY3Rpb24gcmlnaHRzLiBUaGlzIGlzIHBlcmZvcm1lZCBhcyBhIGRlZXAgY29weSBzdWNoIHRoYXQgbm9uZSBvZiB0aGVcbiAgICAvLyBpbnRlcm5hbCwgYmluZGFibGUgb2JqZWN0cyBhcmUgY2hhbmdlZCB3aXRoaW4gdGhpcyBjb2xsZWN0aW9uIHJpZ2h0cy5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIGNvbGxlY3Rpb24gbm9kZXMgd2l0aGluIHRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIGNvbXBsZXRlbHlcbiAgICAvLyByZWRlZmluZWQgYXMgY29waWVzIGZyb20gdGhlIHNwZWNpZmllZCBjb2xsZWN0aW9uIHJpZ2h0c1xuICAgIENvbGxlY3Rpb25SaWdodHMucHJvdG90eXBlLmNvcHlGcm9tQ29sbGVjdGlvblJpZ2h0cyA9IGZ1bmN0aW9uIChvdGhlckNvbGxlY3Rpb25SaWdodHMpIHtcbiAgICAgICAgdGhpcy5fY29sbGVjdGlvbklkID0gb3RoZXJDb2xsZWN0aW9uUmlnaHRzLmdldENvbGxlY3Rpb25JZCgpO1xuICAgICAgICB0aGlzLl9jYW5FZGl0ID0gb3RoZXJDb2xsZWN0aW9uUmlnaHRzLmNhbkVkaXQoKTtcbiAgICAgICAgdGhpcy5faXNQcml2YXRlID0gb3RoZXJDb2xsZWN0aW9uUmlnaHRzLmlzUHJpdmF0ZSgpO1xuICAgICAgICB0aGlzLl9jYW5VbnB1Ymxpc2ggPSBvdGhlckNvbGxlY3Rpb25SaWdodHMuY2FuVW5wdWJsaXNoKCk7XG4gICAgICAgIHRoaXMuX293bmVyTmFtZXMgPSBvdGhlckNvbGxlY3Rpb25SaWdodHMuZ2V0T3duZXJOYW1lcygpO1xuICAgIH07XG4gICAgcmV0dXJuIENvbGxlY3Rpb25SaWdodHM7XG59KCkpO1xuZXhwb3J0cy5Db2xsZWN0aW9uUmlnaHRzID0gQ29sbGVjdGlvblJpZ2h0cztcbnZhciBDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgLy8gU3RhdGljIGNsYXNzIG1ldGhvZHMuIE5vdGUgdGhhdCBcInRoaXNcIiBpcyBub3QgYXZhaWxhYmxlIGluIHN0YXRpY1xuICAgIC8vIGNvbnRleHRzLiBUaGlzIGZ1bmN0aW9uIHRha2VzIGEgSlNPTiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGJhY2tlbmRcbiAgICAvLyBjb2xsZWN0aW9uIHB5dGhvbiBkaWN0LlxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ2NvbGxlY3Rpb25SaWdodHNCYWNrZW5kT2JqZWN0JyBpcyBhIGRpY3Qgd2l0aFxuICAgIC8vIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZ1xuICAgIC8vIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLlxuICAgIENvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoY29sbGVjdGlvblJpZ2h0c0JhY2tlbmRPYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2xsZWN0aW9uUmlnaHRzKGNsb25lRGVlcF8xLmRlZmF1bHQoY29sbGVjdGlvblJpZ2h0c0JhY2tlbmRPYmplY3QpKTtcbiAgICB9O1xuICAgIC8vIENyZWF0ZSBhIG5ldywgZW1wdHkgY29sbGVjdGlvbiByaWdodHMgb2JqZWN0LiBUaGlzIGlzIG5vdCBndWFyYW50ZWVkIHRvXG4gICAgLy8gcGFzcyB2YWxpZGF0aW9uIHRlc3RzLlxuICAgIENvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVFbXB0eUNvbGxlY3Rpb25SaWdodHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29sbGVjdGlvblJpZ2h0cyh7XG4gICAgICAgICAgICBvd25lcl9uYW1lczogW11cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIENvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuQ29sbGVjdGlvblJpZ2h0c09iamVjdEZhY3RvcnkgPSBDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGJ1aWxkIGNoYW5nZXMgdG8gYSBjb2xsZWN0aW9uLiBUaGVzZSBjaGFuZ2VzIG1heVxuICogdGhlbiBiZSB1c2VkIGJ5IG90aGVyIHNlcnZpY2VzLCBzdWNoIGFzIGEgYmFja2VuZCBBUEkgc2VydmljZSB0byB1cGRhdGUgdGhlXG4gKiBjb2xsZWN0aW9uIGluIHRoZSBiYWNrZW5kLiBUaGlzIHNlcnZpY2UgYWxzbyByZWdpc3RlcnMgYWxsIGNoYW5nZXMgd2l0aCB0aGVcbiAqIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL0NoYW5nZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vY29sbGVjdGlvbi1kb21haW4uY29uc3RhbnRzLmFqcy50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UnLCBbXG4gICAgJ0NoYW5nZU9iamVjdEZhY3RvcnknLFxuICAgICdDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnknLCAnVW5kb1JlZG9TZXJ2aWNlJyxcbiAgICAnQ01EX0FERF9DT0xMRUNUSU9OX05PREUnLFxuICAgICdDTURfREVMRVRFX0NPTExFQ1RJT05fTk9ERScsXG4gICAgJ0NNRF9FRElUX0NPTExFQ1RJT05fTk9ERV9QUk9QRVJUWScsXG4gICAgJ0NNRF9FRElUX0NPTExFQ1RJT05fUFJPUEVSVFknLCAnQ01EX1NXQVBfQ09MTEVDVElPTl9OT0RFUycsXG4gICAgJ0NPTExFQ1RJT05fUFJPUEVSVFlfQ0FURUdPUlknLCAnQ09MTEVDVElPTl9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFJyxcbiAgICAnQ09MTEVDVElPTl9QUk9QRVJUWV9PQkpFQ1RJVkUnLFxuICAgICdDT0xMRUNUSU9OX1BST1BFUlRZX1RBR1MnLCAnQ09MTEVDVElPTl9QUk9QRVJUWV9USVRMRScsIGZ1bmN0aW9uIChDaGFuZ2VPYmplY3RGYWN0b3J5LCBDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnksIFVuZG9SZWRvU2VydmljZSwgQ01EX0FERF9DT0xMRUNUSU9OX05PREUsIENNRF9ERUxFVEVfQ09MTEVDVElPTl9OT0RFLCBDTURfRURJVF9DT0xMRUNUSU9OX05PREVfUFJPUEVSVFksIENNRF9FRElUX0NPTExFQ1RJT05fUFJPUEVSVFksIENNRF9TV0FQX0NPTExFQ1RJT05fTk9ERVMsIENPTExFQ1RJT05fUFJPUEVSVFlfQ0FURUdPUlksIENPTExFQ1RJT05fUFJPUEVSVFlfTEFOR1VBR0VfQ09ERSwgQ09MTEVDVElPTl9QUk9QRVJUWV9PQkpFQ1RJVkUsIENPTExFQ1RJT05fUFJPUEVSVFlfVEFHUywgQ09MTEVDVElPTl9QUk9QRVJUWV9USVRMRSkge1xuICAgICAgICAvLyBDcmVhdGVzIGEgY2hhbmdlIHVzaW5nIGFuIGFwcGx5IGZ1bmN0aW9uLCByZXZlcnNlIGZ1bmN0aW9uLCBhIGNoYW5nZVxuICAgICAgICAvLyBjb21tYW5kIGFuZCByZWxhdGVkIHBhcmFtZXRlcnMuIFRoZSBjaGFuZ2UgaXMgYXBwbGllZCB0byBhIGdpdmVuXG4gICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgIHZhciBfYXBwbHlDaGFuZ2UgPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY29tbWFuZCwgcGFyYW1zLCBhcHBseSwgcmV2ZXJzZSkge1xuICAgICAgICAgICAgdmFyIGNoYW5nZURpY3QgPSBhbmd1bGFyLmNvcHkocGFyYW1zKTtcbiAgICAgICAgICAgIGNoYW5nZURpY3QuY21kID0gY29tbWFuZDtcbiAgICAgICAgICAgIHZhciBjaGFuZ2VPYmogPSBDaGFuZ2VPYmplY3RGYWN0b3J5LmNyZWF0ZShjaGFuZ2VEaWN0LCBhcHBseSwgcmV2ZXJzZSk7XG4gICAgICAgICAgICBVbmRvUmVkb1NlcnZpY2UuYXBwbHlDaGFuZ2UoY2hhbmdlT2JqLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdCA9IGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBwYXJhbU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VEaWN0W3BhcmFtTmFtZV07XG4gICAgICAgIH07XG4gICAgICAgIC8vIEFwcGxpZXMgYSBjb2xsZWN0aW9uIHByb3BlcnR5IGNoYW5nZSwgc3BlY2lmaWNhbGx5LiBTZWUgX2FwcGx5Q2hhbmdlKClcbiAgICAgICAgLy8gZm9yIGRldGFpbHMgb24gdGhlIG90aGVyIGJlaGF2aW9yIG9mIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgIHZhciBfYXBwbHlQcm9wZXJ0eUNoYW5nZSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBwcm9wZXJ0eU5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSwgYXBwbHksIHJldmVyc2UpIHtcbiAgICAgICAgICAgIF9hcHBseUNoYW5nZShjb2xsZWN0aW9uLCBDTURfRURJVF9DT0xMRUNUSU9OX1BST1BFUlRZLCB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfbmFtZTogcHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgIG5ld192YWx1ZTogYW5ndWxhci5jb3B5KG5ld1ZhbHVlKSxcbiAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGFuZ3VsYXIuY29weShvbGRWYWx1ZSlcbiAgICAgICAgICAgIH0sIGFwcGx5LCByZXZlcnNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0LCAnbmV3X3ZhbHVlJyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEFwcGxpZXMgYSBwcm9wZXJ0eSBjaGFuZ2UgdG8gYSBjb2xsZWN0aW9uIG5vZGUuIFNlZSBfYXBwbHlDaGFuZ2VzKCkgZm9yXG4gICAgICAgIC8vIGRldGFpbHMgb24gdGhlIG90aGVyIGJlaGF2aW9yIG9mIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgIHZhciBfYXBwbHlOb2RlUHJvcGVydHlDaGFuZ2UgPSBmdW5jdGlvbiAoY29sbGVjdGlvbiwgcHJvcGVydHlOYW1lLCBleHBsb3JhdGlvbklkLCBuZXdWYWx1ZSwgb2xkVmFsdWUsIGFwcGx5LCByZXZlcnNlKSB7XG4gICAgICAgICAgICBfYXBwbHlDaGFuZ2UoY29sbGVjdGlvbiwgQ01EX0VESVRfQ09MTEVDVElPTl9OT0RFX1BST1BFUlRZLCB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHlfbmFtZTogcHJvcGVydHlOYW1lLFxuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uX2lkOiBleHBsb3JhdGlvbklkLFxuICAgICAgICAgICAgICAgIG5ld192YWx1ZTogYW5ndWxhci5jb3B5KG5ld1ZhbHVlKSxcbiAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGFuZ3VsYXIuY29weShvbGRWYWx1ZSlcbiAgICAgICAgICAgIH0sIGFwcGx5LCByZXZlcnNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRFeHBsb3JhdGlvbklkRnJvbUNoYW5nZURpY3QgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0LCAnZXhwbG9yYXRpb25faWQnKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRGaXJzdEluZGV4RnJvbUNoYW5nZURpY3QgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIF9nZXRQYXJhbWV0ZXJGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0LCAnZmlyc3RfaW5kZXgnKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRTZWNvbmRJbmRleEZyb21DaGFuZ2VEaWN0ID0gZnVuY3Rpb24gKGNoYW5nZURpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBfZ2V0UGFyYW1ldGVyRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCwgJ3NlY29uZF9pbmRleCcpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUaGVzZSBmdW5jdGlvbnMgYXJlIGFzc29jaWF0ZWQgd2l0aCB1cGRhdGVzIGF2YWlsYWJsZSBpblxuICAgICAgICAvLyBjb3JlLmRvbWFpbi5jb2xsZWN0aW9uX3NlcnZpY2VzLmFwcGx5X2NoYW5nZV9saXN0LlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBZGRzIGEgbmV3IGV4cGxvcmF0aW9uIHRvIGEgY29sbGVjdGlvbiBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluIHRoZVxuICAgICAgICAgICAgICogdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGFkZENvbGxlY3Rpb25Ob2RlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCwgZXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRTdW1tYXJ5QmFja2VuZE9iamVjdCA9IGFuZ3VsYXIuY29weShleHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kT2JqZWN0KTtcbiAgICAgICAgICAgICAgICBfYXBwbHlDaGFuZ2UoY29sbGVjdGlvbiwgQ01EX0FERF9DT0xMRUNUSU9OX05PREUsIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWRcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBfZ2V0RXhwbG9yYXRpb25JZEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29sbGVjdGlvbk5vZGUgPSAoQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21FeHBsb3JhdGlvbklkKGV4cGxvcmF0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbk5vZGUuc2V0RXhwbG9yYXRpb25TdW1tYXJ5T2JqZWN0KG9sZFN1bW1hcnlCYWNrZW5kT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5hZGRDb2xsZWN0aW9uTm9kZShjb2xsZWN0aW9uTm9kZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBfZ2V0RXhwbG9yYXRpb25JZEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLmRlbGV0ZUNvbGxlY3Rpb25Ob2RlKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN3YXBOb2RlczogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGZpcnN0SW5kZXgsIHNlY29uZEluZGV4KSB7XG4gICAgICAgICAgICAgICAgX2FwcGx5Q2hhbmdlKGNvbGxlY3Rpb24sIENNRF9TV0FQX0NPTExFQ1RJT05fTk9ERVMsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfaW5kZXg6IGZpcnN0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIHNlY29uZF9pbmRleDogc2Vjb25kSW5kZXhcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0SW5kZXggPSBfZ2V0Rmlyc3RJbmRleEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2Vjb25kSW5kZXggPSBfZ2V0U2Vjb25kSW5kZXhGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zd2FwQ29sbGVjdGlvbk5vZGVzKGZpcnN0SW5kZXgsIHNlY29uZEluZGV4KTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3RJbmRleCA9IF9nZXRGaXJzdEluZGV4RnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWNvbmRJbmRleCA9IF9nZXRTZWNvbmRJbmRleEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnN3YXBDb2xsZWN0aW9uTm9kZXMoZmlyc3RJbmRleCwgc2Vjb25kSW5kZXgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlcyBhbiBleHBsb3JhdGlvbiBmcm9tIGEgY29sbGVjdGlvbiBhbmQgcmVjb3JkcyB0aGUgY2hhbmdlIGluXG4gICAgICAgICAgICAgKiB0aGUgdW5kby9yZWRvIHNlcnZpY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlbGV0ZUNvbGxlY3Rpb25Ob2RlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRDb2xsZWN0aW9uTm9kZSA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uLmdldENvbGxlY3Rpb25Ob2RlQnlFeHBsb3JhdGlvbklkKGV4cGxvcmF0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlDaGFuZ2UoY29sbGVjdGlvbiwgQ01EX0RFTEVURV9DT0xMRUNUSU9OX05PREUsIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWRcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBfZ2V0RXhwbG9yYXRpb25JZEZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLmRlbGV0ZUNvbGxlY3Rpb25Ob2RlKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uYWRkQ29sbGVjdGlvbk5vZGUob2xkQ29sbGVjdGlvbk5vZGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgdGl0bGUgb2YgYSBjb2xsZWN0aW9uIGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW4gdGhlXG4gICAgICAgICAgICAgKiB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0Q29sbGVjdGlvblRpdGxlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgdGl0bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkVGl0bGUgPSBhbmd1bGFyLmNvcHkoY29sbGVjdGlvbi5nZXRUaXRsZSgpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlQcm9wZXJ0eUNoYW5nZShjb2xsZWN0aW9uLCBDT0xMRUNUSU9OX1BST1BFUlRZX1RJVExFLCB0aXRsZSwgb2xkVGl0bGUsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5XG4gICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0VGl0bGUodGl0bGUpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0VGl0bGUob2xkVGl0bGUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgY2F0ZWdvcnkgb2YgYSBjb2xsZWN0aW9uIGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW4gdGhlXG4gICAgICAgICAgICAgKiB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0Q29sbGVjdGlvbkNhdGVnb3J5OiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkQ2F0ZWdvcnkgPSBhbmd1bGFyLmNvcHkoY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlQcm9wZXJ0eUNoYW5nZShjb2xsZWN0aW9uLCBDT0xMRUNUSU9OX1BST1BFUlRZX0NBVEVHT1JZLCBjYXRlZ29yeSwgb2xkQ2F0ZWdvcnksIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSBfZ2V0TmV3UHJvcGVydHlWYWx1ZUZyb21DaGFuZ2VEaWN0KGNoYW5nZURpY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnNldENhdGVnb3J5KGNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnNldENhdGVnb3J5KG9sZENhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENoYW5nZXMgdGhlIG9iamVjdGl2ZSBvZiBhIGNvbGxlY3Rpb24gYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpbiB0aGVcbiAgICAgICAgICAgICAqIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uT2JqZWN0aXZlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgb2JqZWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZE9iamVjdGl2ZSA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uLmdldE9iamVjdGl2ZSgpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlQcm9wZXJ0eUNoYW5nZShjb2xsZWN0aW9uLCBDT0xMRUNUSU9OX1BST1BFUlRZX09CSkVDVElWRSwgb2JqZWN0aXZlLCBvbGRPYmplY3RpdmUsIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGx5LlxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0aXZlID0gX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRPYmplY3RpdmUob2JqZWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmRvLlxuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnNldE9iamVjdGl2ZShvbGRPYmplY3RpdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hhbmdlcyB0aGUgbGFuZ3VhZ2UgY29kZSBvZiBhIGNvbGxlY3Rpb24gYW5kIHJlY29yZHMgdGhlIGNoYW5nZSBpblxuICAgICAgICAgICAgICogdGhlIHVuZG8vcmVkbyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uTGFuZ3VhZ2VDb2RlOiBmdW5jdGlvbiAoY29sbGVjdGlvbiwgbGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZExhbmd1YWdlQ29kZSA9IGFuZ3VsYXIuY29weShjb2xsZWN0aW9uLmdldExhbmd1YWdlQ29kZSgpKTtcbiAgICAgICAgICAgICAgICBfYXBwbHlQcm9wZXJ0eUNoYW5nZShjb2xsZWN0aW9uLCBDT0xMRUNUSU9OX1BST1BFUlRZX0xBTkdVQUdFX0NPREUsIGxhbmd1YWdlQ29kZSwgb2xkTGFuZ3VhZ2VDb2RlLCBmdW5jdGlvbiAoY2hhbmdlRGljdCwgY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBcHBseS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhbmd1YWdlQ29kZSA9IF9nZXROZXdQcm9wZXJ0eVZhbHVlRnJvbUNoYW5nZURpY3QoY2hhbmdlRGljdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0TGFuZ3VhZ2VDb2RlKGxhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5kby5cbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRMYW5ndWFnZUNvZGUob2xkTGFuZ3VhZ2VDb2RlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENoYW5nZXMgdGhlIHRhZ3Mgb2YgYSBjb2xsZWN0aW9uIGFuZCByZWNvcmRzIHRoZSBjaGFuZ2UgaW5cbiAgICAgICAgICAgICAqIHRoZSB1bmRvL3JlZG8gc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0Q29sbGVjdGlvblRhZ3M6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCB0YWdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZFRhZ3MgPSBhbmd1bGFyLmNvcHkoY29sbGVjdGlvbi5nZXRUYWdzKCkpO1xuICAgICAgICAgICAgICAgIF9hcHBseVByb3BlcnR5Q2hhbmdlKGNvbGxlY3Rpb24sIENPTExFQ1RJT05fUFJPUEVSVFlfVEFHUywgdGFncywgb2xkVGFncywgZnVuY3Rpb24gKGNoYW5nZURpY3QsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwbHkuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWdzID0gX2dldE5ld1Byb3BlcnR5VmFsdWVGcm9tQ2hhbmdlRGljdChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbi5zZXRUYWdzKHRhZ3MpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChjaGFuZ2VEaWN0LCBjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZG8uXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24uc2V0VGFncyhvbGRUYWdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gY2hhbmdlIG9iamVjdCBjb25zdHJ1Y3RlZCBieSB0aGlzIHNlcnZpY2VcbiAgICAgICAgICAgICAqIGlzIGFkZGluZyBhIG5ldyBjb2xsZWN0aW9uIG5vZGUgdG8gYSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0FkZGluZ0NvbGxlY3Rpb25Ob2RlOiBmdW5jdGlvbiAoY2hhbmdlT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGJhY2tlbmRDaGFuZ2VPYmplY3QgPSBjaGFuZ2VPYmplY3QuZ2V0QmFja2VuZENoYW5nZU9iamVjdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBiYWNrZW5kQ2hhbmdlT2JqZWN0LmNtZCA9PT0gQ01EX0FERF9DT0xMRUNUSU9OX05PREU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHRoZSBleHBsb3JhdGlvbiBJRCByZWZlcmVuY2VkIGJ5IHRoZSBzcGVjaWZpZWQgY2hhbmdlIG9iamVjdCxcbiAgICAgICAgICAgICAqIG9yIHVuZGVmaW5lZCBpZiB0aGUgZ2l2ZW4gY2hhbmdlT2JqZWN0IGRvZXMgbm90IHJlZmVyZW5jZSBhblxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gSUQuIFRoZSBjaGFuZ2Ugb2JqZWN0IGlzIGV4cGVjdGVkIHRvIGJlIG9uZSBjb25zdHJ1Y3RlZFxuICAgICAgICAgICAgICogYnkgdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRFeHBsb3JhdGlvbklkRnJvbUNoYW5nZU9iamVjdDogZnVuY3Rpb24gKGNoYW5nZU9iamVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0RXhwbG9yYXRpb25JZEZyb21DaGFuZ2VEaWN0KGNoYW5nZU9iamVjdC5nZXRCYWNrZW5kQ2hhbmdlT2JqZWN0KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHZhbGlkYXRlIHRoZSBjb25zaXN0ZW5jeSBvZiBhIGNvbGxlY3Rpb24uIFRoZXNlXG4gKiBjaGVja3MgYXJlIHBlcmZvcm1hYmxlIGluIHRoZSBmcm9udGVuZCB0byBhdm9pZCBzZW5kaW5nIGEgcG90ZW50aWFsbHkgaW52YWxpZFxuICogY29sbGVjdGlvbiB0byB0aGUgYmFja2VuZCwgd2hpY2ggcGVyZm9ybXMgc2ltaWxhciB2YWxpZGF0aW9uIGNoZWNrcyB0byB0aGVzZVxuICogaW4gY29sbGVjdGlvbl9kb21haW4uQ29sbGVjdGlvbiBhbmQgc3Vic2VxdWVudCBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIGFwcF9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJhcHAuY29uc3RhbnRzXCIpO1xudmFyIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UoKSB7XG4gICAgfVxuICAgIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS5wcm90b3R5cGUuX2dldE5vbmV4aXN0ZW50RXhwbG9yYXRpb25JZHMgPSBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZXMoKS5maWx0ZXIoZnVuY3Rpb24gKGNvbGxlY3Rpb25Ob2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gIWNvbGxlY3Rpb25Ob2RlLmRvZXNFeHBsb3JhdGlvbkV4aXN0KCk7XG4gICAgICAgIH0pLm1hcChmdW5jdGlvbiAoY29sbGVjdGlvbk5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uTm9kZS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLnByb3RvdHlwZS5fZ2V0UHJpdmF0ZUV4cGxvcmF0aW9uSWRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVzKCkuZmlsdGVyKGZ1bmN0aW9uIChjb2xsZWN0aW9uTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25Ob2RlLmlzRXhwbG9yYXRpb25Qcml2YXRlKCk7XG4gICAgICAgIH0pLm1hcChmdW5jdGlvbiAoY29sbGVjdGlvbk5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uTm9kZS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gVmFsaWRhdGVzIHRoYXQgdGhlIHRhZ3MgZm9yIHRoZSBjb2xsZWN0aW9uIGFyZSBpbiB0aGUgcHJvcGVyIGZvcm1hdCxcbiAgICAvLyByZXR1cm5zIHRydWUgaWYgYWxsIHRhZ3MgYXJlIGluIHRoZSBjb3JyZWN0IGZvcm1hdC5cbiAgICBDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UucHJvdG90eXBlLnZhbGlkYXRlVGFnRm9ybWF0ID0gZnVuY3Rpb24gKHRhZ3MpIHtcbiAgICAgICAgLy8gQ2hlY2sgdG8gZW5zdXJlIHRoYXQgYWxsIHRhZ3MgZm9sbG93IHRoZSBmb3JtYXQgc3BlY2lmaWVkIGluXG4gICAgICAgIC8vIFRBR19SRUdFWC5cbiAgICAgICAgLy8gQHRzLWlnbm9yZTogVE9ETygjNzQzNCk6IFJlbW92ZSB0aGlzIGlnbm9yZSBhZnRlciB3ZSBmaW5kIGEgd2F5IHRvIGdldFxuICAgICAgICAvLyByaWQgb2YgdGhlIFRTMjMzOSBlcnJvciBvbiBBcHBDb25zdGFudHMuXG4gICAgICAgIHZhciB0YWdSZWdleCA9IG5ldyBSZWdFeHAoYXBwX2NvbnN0YW50c18xLkFwcENvbnN0YW50cy5UQUdfUkVHRVgpO1xuICAgICAgICByZXR1cm4gdGFncy5ldmVyeShmdW5jdGlvbiAodGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFnLm1hdGNoKHRhZ1JlZ2V4KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBWYWxpZGF0ZXMgdGhhdCB0aGUgdGFncyBmb3IgdGhlIGNvbGxlY3Rpb24gZG8gbm90IGhhdmUgZHVwbGljYXRlcyxcbiAgICAvLyByZXR1cm5zIHRydWUgaWYgdGhlcmUgYXJlIG5vIGR1cGxpY2F0ZXMuXG4gICAgQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLnByb3RvdHlwZS52YWxpZGF0ZUR1cGxpY2F0ZVRhZ3MgPSBmdW5jdGlvbiAodGFncykge1xuICAgICAgICByZXR1cm4gdGFncy5ldmVyeShmdW5jdGlvbiAodGFnLCBpZHgpIHtcbiAgICAgICAgICAgIHJldHVybiB0YWdzLmluZGV4T2YodGFnLCBpZHggKyAxKSA9PT0gLTE7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gVmFsaWRhdGVzIHRoYXQgdGhlIHRhZ3MgZm9yIHRoZSBjb2xsZWN0aW9uIGFyZSBub3JtYWxpemVkLFxuICAgIC8vIHJldHVybnMgdHJ1ZSBpZiBhbGwgdGFncyB3ZXJlIG5vcm1hbGl6ZWQuXG4gICAgQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLnByb3RvdHlwZS52YWxpZGF0ZVRhZ3NOb3JtYWxpemVkID0gZnVuY3Rpb24gKHRhZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRhZ3MuZXZlcnkoZnVuY3Rpb24gKHRhZykge1xuICAgICAgICAgICAgcmV0dXJuIHRhZyA9PT0gdGFnLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSB0aGUgcmV0dXJuIHR5cGUgaXMgYSBsaXN0IHdpdGggdmFyeWluZyBlbGVtZW50IHR5cGVzLlxuICAgIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS5wcm90b3R5cGUuX3ZhbGlkYXRlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBpc1B1YmxpYykge1xuICAgICAgICAvLyBOT1RFIFRPIERFVkVMT1BFUlM6IFBsZWFzZSBlbnN1cmUgdGhhdCB0aGlzIHZhbGlkYXRpb24gbG9naWMgaXMgdGhlXG4gICAgICAgIC8vIHNhbWUgYXMgdGhhdCBpbiBjb3JlLmRvbWFpbi5jb2xsZWN0aW9uX2RvbWFpbi5Db2xsZWN0aW9uLnZhbGlkYXRlKCkuXG4gICAgICAgIHZhciBpc3N1ZXMgPSBbXTtcbiAgICAgICAgdmFyIGNvbGxlY3Rpb25IYXNOb2RlcyA9IGNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVDb3VudCgpID4gMDtcbiAgICAgICAgaWYgKCFjb2xsZWN0aW9uSGFzTm9kZXMpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdUaGVyZSBzaG91bGQgYmUgYXQgbGVhc3QgMSBleHBsb3JhdGlvbiBpbiB0aGUgY29sbGVjdGlvbi4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9uZXhpc3RlbnRFeHBJZHMgPSB0aGlzLl9nZXROb25leGlzdGVudEV4cGxvcmF0aW9uSWRzKGNvbGxlY3Rpb24pO1xuICAgICAgICBpZiAobm9uZXhpc3RlbnRFeHBJZHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICBpc3N1ZXMucHVzaCgnVGhlIGZvbGxvd2luZyBleHBsb3JhdGlvbihzKSBlaXRoZXIgZG8gbm90IGV4aXN0LCBvciB5b3UgZG8gbm90ICcgK1xuICAgICAgICAgICAgICAgICdoYXZlIGVkaXQgYWNjZXNzIHRvIGFkZCB0aGVtIHRvIHRoaXMgY29sbGVjdGlvbjogJyArXG4gICAgICAgICAgICAgICAgbm9uZXhpc3RlbnRFeHBJZHMuam9pbignLCAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUHVibGljKSB7XG4gICAgICAgICAgICB2YXIgcHJpdmF0ZUV4cElkcyA9IHRoaXMuX2dldFByaXZhdGVFeHBsb3JhdGlvbklkcyhjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIGlmIChwcml2YXRlRXhwSWRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKCdQcml2YXRlIGV4cGxvcmF0aW9ucyBjYW5ub3QgYmUgYWRkZWQgdG8gYSBwdWJsaWMgY29sbGVjdGlvbjogJyArXG4gICAgICAgICAgICAgICAgICAgIHByaXZhdGVFeHBJZHMuam9pbignLCAnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzc3VlcztcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGVycm9yIHN0cmluZ3MgZm91bmQgd2hlbiB2YWxpZGF0aW5nIHRoZSBwcm92aWRlZFxuICAgICAqIGNvbGxlY3Rpb24uIFRoZSB2YWxpZGF0aW9uIG1ldGhvZHMgdXNlZCBpbiB0aGlzIGZ1bmN0aW9uIGFyZSB3cml0dGVuIHRvXG4gICAgICogbWF0Y2ggdGhlIHZhbGlkYXRpb25zIHBlcmZvcm1lZCBpbiB0aGUgYmFja2VuZC4gVGhpcyBmdW5jdGlvbiBpc1xuICAgICAqIGV4cGVuc2l2ZSwgc28gaXQgc2hvdWxkIGJlIGNhbGxlZCBzcGFyaW5nbHkuXG4gICAgICovXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSB0aGUgcmV0dXJuIHR5cGUgaXMgYSBsaXN0IHdpdGggdmFyeWluZyBlbGVtZW50IHR5cGVzLlxuICAgIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS5wcm90b3R5cGUuZmluZFZhbGlkYXRpb25Jc3N1ZXNGb3JQcml2YXRlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvbiwgZmFsc2UpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQmVoYXZlcyBpbiB0aGUgc2FtZSB3YXkgYXMgZmluZFZhbGlkYXRpb25Jc3N1ZXNGb3JQcml2YXRlQ29sbGVjdGlvbigpLFxuICAgICAqIGV4Y2VwdCBhZGRpdGlvbmFsIHZhbGlkYXRpb24gY2hlY2tzIGFyZSBwZXJmb3JtZWQgd2hpY2ggYXJlIHNwZWNpZmljIHRvXG4gICAgICogcHVibGljIGNvbGxlY3Rpb25zLiBUaGlzIGZ1bmN0aW9uIGlzIGV4cGVuc2l2ZSwgc28gaXQgc2hvdWxkIGJlIGNhbGxlZFxuICAgICAqIHNwYXJpbmdseS5cbiAgICAgKi9cbiAgICBDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UucHJvdG90eXBlLmZpbmRWYWxpZGF0aW9uSXNzdWVzRm9yUHVibGljQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZUNvbGxlY3Rpb24oY29sbGVjdGlvbiwgdHJ1ZSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGZhbHNlIGlmIHRoZSB0YWdzIGFyZSBub3QgdmFsaWRhdGUuXG4gICAgICovXG4gICAgQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLnByb3RvdHlwZS5pc1RhZ1ZhbGlkID0gZnVuY3Rpb24gKHRhZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVUYWdGb3JtYXQodGFncykgJiYgdGhpcy52YWxpZGF0ZUR1cGxpY2F0ZVRhZ3ModGFncykgJiZcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdGVUYWdzTm9ybWFsaXplZCh0YWdzKTtcbiAgICB9O1xuICAgIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSlcbiAgICBdLCBDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UpO1xuICAgIHJldHVybiBDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5Db2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UgPSBDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlbmQgY2hhbmdlcyB0byBhIGNvbGxlY3Rpb24gdG8gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL1JlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG4vLyBUT0RPKGJoZW5uaW5nKTogSSB0aGluayB0aGF0IHRoaXMgbWlnaHQgYmUgYmV0dGVyIG1lcmdlZCB3aXRoIHRoZVxuLy8gQ29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLiBIb3dldmVyLCB0aGF0IHZpb2xhdGVzIHRoZSBwcmluY2lwbGUgb2YgYVxuLy8gYmFja2VuZCBBUEkgc2VydmljZSBiZWluZyBhdmFpbGFibGUgZm9yIGV4YWN0bHkgb25lIFVSTC4gVG8gZml4IHRoaXMsIHRoZVxuLy8gYmFja2VuZCBjb250cm9sbGVyIGNvdWxkIHN1cHBvcnQgYm90aCBnZXQgYW5kIHB1dCBhbmQgYmUgcHVsbGVkIG91dCBvZiB0aGVcbi8vIGNvbGxlY3Rpb24gbGVhcm5lciBhbmQgbW92ZWQgaW50byBpdHMgb3duIGNvbnRyb2xsZXIuIFRoaXMgaXMgYSBuZXcgcGF0dGVyblxuLy8gZm9yIHRoZSBiYWNrZW5kLCBidXQgaXQgbWFrZXMgc2Vuc2UgYmFzZWQgb24gdGhlIHVzYWdlIG9mIHRoZSBnZXQgSFRUUFxuLy8gcmVxdWVzdCBieSBib3RoIHRoZSBsZWFybmVyIGFuZCBlZGl0b3Igdmlld3MuIFRoaXMgd291bGQgcmVzdWx0IGluIG9uZVxuLy8gYmFja2VuZCBjb250cm9sbGVyIChmaWxlIGFuZCBjbGFzcykgZm9yIGhhbmRsaW5nIHJldHJpZXZpbmcgYW5kIGNoYW5naW5nXG4vLyBjb2xsZWN0aW9uIGRhdGEsIGFzIHdlbGwgYXMgb25lIGZyb250ZW5kIHNlcnZpY2UgZm9yIGludGVyZmFjaW5nIHdpdGggaXQuXG4vLyBEaXNjdXNzIGFuZCBkZWNpZGUgd2hldGhlciB0aGlzIGlzIGEgZ29vZCBhcHByb2FjaCBhbmQgdGhlbiByZW1vdmUgdGhpcyBUT0RPXG4vLyBhZnRlciBkZWNpZGluZyBhbmQgYWN0aW5nIHVwb24gdGhlIGRlY2lzaW9uICh3aGljaCB3b3VsZCBtZWFuIGltcGxlbWVudGluZ1xuLy8gaXQgaWYgaXQncyBhZ3JlZWQgdXBvbikuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnUmVhZE9ubHlDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ0VESVRBQkxFX0NPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFJlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgRURJVEFCTEVfQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURSkge1xuICAgICAgICB2YXIgX2ZldGNoQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb25EYXRhVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRURJVEFCTEVfQ09MTEVDVElPTl9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6IGNvbGxlY3Rpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoY29sbGVjdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGVkaXRhYmxlQ29sbGVjdGlvbkRhdGFVcmwgPSBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9DT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9pZDogY29sbGVjdGlvbklkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwdXREYXRhID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IGNvbGxlY3Rpb25WZXJzaW9uLFxuICAgICAgICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYW5nZV9saXN0OiBjaGFuZ2VMaXN0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJGh0dHAucHV0KGVkaXRhYmxlQ29sbGVjdGlvbkRhdGFVcmwsIHB1dERhdGEpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHJldHVybmVkIGRhdGEgaXMgYW4gdXBkYXRlZCBjb2xsZWN0aW9uIGRpY3QuXG4gICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb24gPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIFJlYWRPbmx5Q29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJ3MgY2FjaGUgd2l0aCB0aGUgbmV3XG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBSZWFkT25seUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS5jYWNoZUNvbGxlY3Rpb24oY29sbGVjdGlvbklkLCBjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZldGNoQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaENvbGxlY3Rpb24oY29sbGVjdGlvbklkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVXBkYXRlcyBhIGNvbGxlY3Rpb24gaW4gdGhlIGJhY2tlbmQgd2l0aCB0aGUgcHJvdmlkZWQgY29sbGVjdGlvbiBJRC5cbiAgICAgICAgICAgICAqIFRoZSBjaGFuZ2VzIG9ubHkgYXBwbHkgdG8gdGhlIGNvbGxlY3Rpb24gb2YgdGhlIGdpdmVuIHZlcnNpb24gYW5kIHRoZVxuICAgICAgICAgICAgICogcmVxdWVzdCB0byB1cGRhdGUgdGhlIGNvbGxlY3Rpb24gd2lsbCBmYWlsIGlmIHRoZSBwcm92aWRlZCBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgKiB2ZXJzaW9uIGlzIG9sZGVyIHRoYW4gdGhlIGN1cnJlbnQgdmVyc2lvbiBzdG9yZWQgaW4gdGhlIGJhY2tlbmQuIEJvdGhcbiAgICAgICAgICAgICAqIHRoZSBjaGFuZ2VzIGFuZCB0aGUgbWVzc2FnZSB0byBhc3NvY2lhdGUgd2l0aCB0aG9zZSBjaGFuZ2VzIGFyZSB1c2VkXG4gICAgICAgICAgICAgKiB0byBjb21taXQgYSBjaGFuZ2UgdG8gdGhlIGNvbGxlY3Rpb24uIFRoZSBuZXcgY29sbGVjdGlvbiBpcyBwYXNzZWQgdG9cbiAgICAgICAgICAgICAqIHRoZSBzdWNjZXNzIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQgdG8gdGhlIHJldHVybmVkIHByb21pc2VcbiAgICAgICAgICAgICAqIG9iamVjdC4gRXJyb3JzIGFyZSBwYXNzZWQgdG8gdGhlIGVycm9yIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICAgKiBGaW5hbGx5LCBpZiB0aGUgdXBkYXRlIGlzIHN1Y2Nlc3NmdWwsIHRoZSByZXR1cm5lZCBjb2xsZWN0aW9uIHdpbGwgYmVcbiAgICAgICAgICAgICAqIGNhY2hlZCB3aXRoaW4gdGhlIENvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSB0byBlbnN1cmUgdGhlIGNhY2hlIGlzXG4gICAgICAgICAgICAgKiBub3Qgb3V0LW9mLWRhdGUgd2l0aCBhbnkgdXBkYXRlcyBtYWRlIGJ5IHRoaXMgYmFja2VuZCBBUEkgc2VydmljZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbGxlY3Rpb25JZCwgY29sbGVjdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uSWQsIGNvbGxlY3Rpb25WZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlYXJjaCBleHBsb3JhdGlvbnMgbWV0YWRhdGEuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1NlYXJjaEV4cGxvcmF0aW9uc0JhY2tlbmRBcGlTZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgJ1NFQVJDSF9FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFVybEludGVycG9sYXRpb25TZXJ2aWNlLCBTRUFSQ0hfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIHZhciBfZmV0Y2hFeHBsb3JhdGlvbnMgPSBmdW5jdGlvbiAoc2VhcmNoUXVlcnksIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHF1ZXJ5VXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoU0VBUkNIX0VYUExPUkFUSU9OX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBidG9hKHNlYXJjaFF1ZXJ5KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaHR0cC5nZXQocXVlcnlVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyBleHBsb3JhdGlvbidzIG1ldGFkYXRhIGRpY3QsIGdpdmVuIGEgc2VhcmNoIHF1ZXJ5LiBTZWFyY2hcbiAgICAgICAgICAgICAqIHF1ZXJpZXMgYXJlIHRva2VucyB0aGF0IHdpbGwgYmUgbWF0Y2hlZCBhZ2FpbnN0IGV4cGxvcmF0aW9uJ3MgdGl0bGVcbiAgICAgICAgICAgICAqIGFuZCBvYmplY3RpdmUuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZldGNoRXhwbG9yYXRpb25zOiBmdW5jdGlvbiAoc2VhcmNoUXVlcnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hFeHBsb3JhdGlvbnMoc2VhcmNoUXVlcnksIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgY29sbGVjdGlvbiBkb21haW4gc2VydmljZXMuXG4gKi9cbi8vIFRoZXNlIHNob3VsZCBtYXRjaCB0aGUgY29uc3RhbnRzIGRlZmluZWQgaW4gY29yZS5kb21haW4uY29sbGVjdGlvbl9kb21haW4uXG4vLyBUT0RPKGJoZW5uaW5nKTogVGhlIHZhbHVlcyBvZiB0aGVzZSBjb25zdGFudHMgc2hvdWxkIGJlIHByb3ZpZGVkIGJ5IHRoZVxuLy8gYmFja2VuZC5cbi8vIE5PVEUgVE8gREVWRUxPUEVSUzogdGhlIHByb3BlcnRpZXMgJ3ByZXJlcXVpc2l0ZV9za2lsbHMnIGFuZFxuLy8gJ2FjcXVpcmVkX3NraWxscycgYXJlIGRlcHJlY2F0ZWQuIERvIG5vdCB1c2UgdGhlbS5cbi8vIFRPRE8oIzcwOTIpOiBEZWxldGUgdGhpcyBmaWxlIG9uY2UgbWlncmF0aW9uIGlzIGNvbXBsZXRlIGFuZCB0aGVzZSBBbmd1bGFySlNcbi8vIGVxdWl2YWxlbnRzIG9mIHRoZSBBbmd1bGFyIGNvbnN0YW50cyBhcmUgbm8gbG9uZ2VyIG5lZWRlZC5cbnZhciBjb2xsZWN0aW9uX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vY29sbGVjdGlvbi9jb2xsZWN0aW9uLWRvbWFpbi5jb25zdGFudHNcIik7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX0FERF9DT0xMRUNUSU9OX05PREUnLCBjb2xsZWN0aW9uX2RvbWFpbl9jb25zdGFudHNfMS5Db2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNNRF9BRERfQ09MTEVDVElPTl9OT0RFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfU1dBUF9DT0xMRUNUSU9OX05PREVTJywgY29sbGVjdGlvbl9kb21haW5fY29uc3RhbnRzXzEuQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cy5DTURfU1dBUF9DT0xMRUNUSU9OX05PREVTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDTURfREVMRVRFX0NPTExFQ1RJT05fTk9ERScsIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9DT0xMRUNUSU9OX05PREUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9FRElUX0NPTExFQ1RJT05fUFJPUEVSVFknLCBjb2xsZWN0aW9uX2RvbWFpbl9jb25zdGFudHNfMS5Db2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNNRF9FRElUX0NPTExFQ1RJT05fUFJPUEVSVFkpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9FRElUX0NPTExFQ1RJT05fTk9ERV9QUk9QRVJUWScsIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX0VESVRfQ09MTEVDVElPTl9OT0RFX1BST1BFUlRZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX1BST1BFUlRZX1RJVExFJywgY29sbGVjdGlvbl9kb21haW5fY29uc3RhbnRzXzEuQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cy5DT0xMRUNUSU9OX1BST1BFUlRZX1RJVExFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX1BST1BFUlRZX0NBVEVHT1JZJywgY29sbGVjdGlvbl9kb21haW5fY29uc3RhbnRzXzEuQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cy5DT0xMRUNUSU9OX1BST1BFUlRZX0NBVEVHT1JZKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX1BST1BFUlRZX09CSkVDVElWRScsIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ09MTEVDVElPTl9QUk9QRVJUWV9PQkpFQ1RJVkUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fUFJPUEVSVFlfTEFOR1VBR0VfQ09ERScsIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ09MTEVDVElPTl9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX1BST1BFUlRZX1RBR1MnLCBjb2xsZWN0aW9uX2RvbWFpbl9jb25zdGFudHNfMS5Db2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNPTExFQ1RJT05fUFJPUEVSVFlfVEFHUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ01EX0FERF9DT0xMRUNUSU9OX1NLSUxMJywgY29sbGVjdGlvbl9kb21haW5fY29uc3RhbnRzXzEuQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cy5DTURfQUREX0NPTExFQ1RJT05fU0tJTEwpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NNRF9ERUxFVEVfQ09MTEVDVElPTl9TS0lMTCcsIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX0RFTEVURV9DT0xMRUNUSU9OX1NLSUxMKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUycsIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ09MTEVDVElPTl9OT0RFX1BST1BFUlRZX1BSRVJFUVVJU0lURV9TS0lMTF9JRFMpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMnLCBjb2xsZWN0aW9uX2RvbWFpbl9jb25zdGFudHNfMS5Db2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNPTExFQ1RJT05fTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgZm9yIGNvbGxlY3Rpb24gZG9tYWluIHNlcnZpY2VzLlxuICovXG4vLyBUaGVzZSBzaG91bGQgbWF0Y2ggdGhlIGNvbnN0YW50cyBkZWZpbmVkIGluIGNvcmUuZG9tYWluLmNvbGxlY3Rpb25fZG9tYWluLlxuLy8gVE9ETyhiaGVubmluZyk6IFRoZSB2YWx1ZXMgb2YgdGhlc2UgY29uc3RhbnRzIHNob3VsZCBiZSBwcm92aWRlZCBieSB0aGVcbi8vIGJhY2tlbmQuXG4vLyBOT1RFIFRPIERFVkVMT1BFUlM6IHRoZSBwcm9wZXJ0aWVzICdwcmVyZXF1aXNpdGVfc2tpbGxzJyBhbmRcbi8vICdhY3F1aXJlZF9za2lsbHMnIGFyZSBkZXByZWNhdGVkLiBEbyBub3QgdXNlIHRoZW0uXG52YXIgQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNNRF9BRERfQ09MTEVDVElPTl9OT0RFID0gJ2FkZF9jb2xsZWN0aW9uX25vZGUnO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX1NXQVBfQ09MTEVDVElPTl9OT0RFUyA9ICdzd2FwX25vZGVzJztcbiAgICBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNNRF9ERUxFVEVfQ09MTEVDVElPTl9OT0RFID0gJ2RlbGV0ZV9jb2xsZWN0aW9uX25vZGUnO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX0VESVRfQ09MTEVDVElPTl9QUk9QRVJUWSA9ICdlZGl0X2NvbGxlY3Rpb25fcHJvcGVydHknO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX0VESVRfQ09MTEVDVElPTl9OT0RFX1BST1BFUlRZID0gJ2VkaXRfY29sbGVjdGlvbl9ub2RlX3Byb3BlcnR5JztcbiAgICBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNPTExFQ1RJT05fUFJPUEVSVFlfVElUTEUgPSAndGl0bGUnO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ09MTEVDVElPTl9QUk9QRVJUWV9DQVRFR09SWSA9ICdjYXRlZ29yeSc7XG4gICAgQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cy5DT0xMRUNUSU9OX1BST1BFUlRZX09CSkVDVElWRSA9ICdvYmplY3RpdmUnO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ09MTEVDVElPTl9QUk9QRVJUWV9MQU5HVUFHRV9DT0RFID0gJ2xhbmd1YWdlX2NvZGUnO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ09MTEVDVElPTl9QUk9QRVJUWV9UQUdTID0gJ3RhZ3MnO1xuICAgIENvbGxlY3Rpb25Eb21haW5Db25zdGFudHMuQ01EX0FERF9DT0xMRUNUSU9OX1NLSUxMID0gJ2FkZF9jb2xsZWN0aW9uX3NraWxsJztcbiAgICBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNNRF9ERUxFVEVfQ09MTEVDVElPTl9TS0lMTCA9ICdkZWxldGVfY29sbGVjdGlvbl9za2lsbCc7XG4gICAgQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cy5DT0xMRUNUSU9OX05PREVfUFJPUEVSVFlfUFJFUkVRVUlTSVRFX1NLSUxMX0lEUyA9ICdwcmVyZXF1aXNpdGVfc2tpbGxfaWRzJztcbiAgICBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzLkNPTExFQ1RJT05fTk9ERV9QUk9QRVJUWV9BQ1FVSVJFRF9TS0lMTF9JRFMgPSAnYWNxdWlyZWRfc2tpbGxfaWRzJztcbiAgICByZXR1cm4gQ29sbGVjdGlvbkRvbWFpbkNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMgPSBDb2xsZWN0aW9uRG9tYWluQ29uc3RhbnRzO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBBbnN3ZXJHcm91cFxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBPdXRjb21lT2JqZWN0RmFjdG9yeV8xID0gcmVxdWlyZShcImRvbWFpbi9leHBsb3JhdGlvbi9PdXRjb21lT2JqZWN0RmFjdG9yeVwiKTtcbnZhciBSdWxlT2JqZWN0RmFjdG9yeV8xID0gcmVxdWlyZShcImRvbWFpbi9leHBsb3JhdGlvbi9SdWxlT2JqZWN0RmFjdG9yeVwiKTtcbnZhciBBbnN3ZXJHcm91cCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBbnN3ZXJHcm91cChydWxlcywgb3V0Y29tZSwgdHJhaW5pbmdEYXRhLCB0YWdnZWRTa2lsbE1pc2NvbmNlcHRpb25JZCkge1xuICAgICAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgICAgIHRoaXMub3V0Y29tZSA9IG91dGNvbWU7XG4gICAgICAgIHRoaXMudHJhaW5pbmdEYXRhID0gdHJhaW5pbmdEYXRhO1xuICAgICAgICB0aGlzLnRhZ2dlZFNraWxsTWlzY29uY2VwdGlvbklkID0gdGFnZ2VkU2tpbGxNaXNjb25jZXB0aW9uSWQ7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgdGhlIHJldHVybiB0eXBlIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWQga2V5c1xuICAgIC8vIHdoaWNoIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLlxuICAgIEFuc3dlckdyb3VwLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcnVsZV9zcGVjczogdGhpcy5ydWxlcy5tYXAoZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVsZS50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG91dGNvbWU6IHRoaXMub3V0Y29tZS50b0JhY2tlbmREaWN0KCksXG4gICAgICAgICAgICB0cmFpbmluZ19kYXRhOiB0aGlzLnRyYWluaW5nRGF0YSxcbiAgICAgICAgICAgIHRhZ2dlZF9za2lsbF9taXNjb25jZXB0aW9uX2lkOiB0aGlzLnRhZ2dlZFNraWxsTWlzY29uY2VwdGlvbklkXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gQW5zd2VyR3JvdXA7XG59KCkpO1xuZXhwb3J0cy5BbnN3ZXJHcm91cCA9IEFuc3dlckdyb3VwO1xudmFyIEFuc3dlckdyb3VwT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBbnN3ZXJHcm91cE9iamVjdEZhY3Rvcnkob3V0Y29tZU9iamVjdEZhY3RvcnksIHJ1bGVPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMub3V0Y29tZU9iamVjdEZhY3RvcnkgPSBvdXRjb21lT2JqZWN0RmFjdG9yeTtcbiAgICAgICAgdGhpcy5ydWxlT2JqZWN0RmFjdG9yeSA9IHJ1bGVPYmplY3RGYWN0b3J5O1xuICAgIH1cbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIHR5cGVkXG4gICAgLy8gYXMgJ2FueScgc2luY2UgJ3J1bGVCYWNrZW5kRGljdHMnIGlzIGEgY29tcGxleCBvYmplY3Qgd2l0aCBlbGVtZW50cyBhcyBrZXlzXG4gICAgLy8gaGF2aW5nIHZhcnlpbmcgdHlwZXMuIEFuIGV4YWN0IHR5cGUgbmVlZHMgdG9iZSBmb3VuZC5cbiAgICBBbnN3ZXJHcm91cE9iamVjdEZhY3RvcnkucHJvdG90eXBlLmdlbmVyYXRlUnVsZXNGcm9tQmFja2VuZCA9IGZ1bmN0aW9uIChydWxlQmFja2VuZERpY3RzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiBydWxlQmFja2VuZERpY3RzLm1hcChmdW5jdGlvbiAocnVsZUJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMucnVsZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHJ1bGVCYWNrZW5kRGljdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAndHJhaW5pbmdEYXRhJyBpcyBhbiBhcnJheSBvZiBkaWN0cyB3aXRoIHVuZGVyc2NvcmVfY2FzZWRcbiAgICAvLyBrZXlzIHdoaWNoIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mXG4gICAgLy8gY2FtZWxDYXNpbmcuXG4gICAgQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbiAocnVsZXMsIG91dGNvbWUsIHRyYWluaW5nRGF0YSwgdGFnZ2VkU2tpbGxNaXNjb25jZXB0aW9uSWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBBbnN3ZXJHcm91cChydWxlcywgb3V0Y29tZSwgdHJhaW5pbmdEYXRhLCB0YWdnZWRTa2lsbE1pc2NvbmNlcHRpb25JZCk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdhbnN3ZXJHcm91cEJhY2tlbmREaWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXNcbiAgICAvLyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBBbnN3ZXJHcm91cE9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChhbnN3ZXJHcm91cEJhY2tlbmREaWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgQW5zd2VyR3JvdXAodGhpcy5nZW5lcmF0ZVJ1bGVzRnJvbUJhY2tlbmQoYW5zd2VyR3JvdXBCYWNrZW5kRGljdC5ydWxlX3NwZWNzKSwgdGhpcy5vdXRjb21lT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoYW5zd2VyR3JvdXBCYWNrZW5kRGljdC5vdXRjb21lKSwgYW5zd2VyR3JvdXBCYWNrZW5kRGljdC50cmFpbmluZ19kYXRhLCBhbnN3ZXJHcm91cEJhY2tlbmREaWN0LnRhZ2dlZF9za2lsbF9taXNjb25jZXB0aW9uX2lkKTtcbiAgICB9O1xuICAgIHZhciBfYSwgX2I7XG4gICAgQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIE91dGNvbWVPYmplY3RGYWN0b3J5XzEuT3V0Y29tZU9iamVjdEZhY3RvcnkgIT09IFwidW5kZWZpbmVkXCIgJiYgT3V0Y29tZU9iamVjdEZhY3RvcnlfMS5PdXRjb21lT2JqZWN0RmFjdG9yeSkgPT09IFwiZnVuY3Rpb25cIiA/IF9hIDogT2JqZWN0LCB0eXBlb2YgKF9iID0gdHlwZW9mIFJ1bGVPYmplY3RGYWN0b3J5XzEuUnVsZU9iamVjdEZhY3RvcnkgIT09IFwidW5kZWZpbmVkXCIgJiYgUnVsZU9iamVjdEZhY3RvcnlfMS5SdWxlT2JqZWN0RmFjdG9yeSkgPT09IFwiZnVuY3Rpb25cIiA/IF9iIDogT2JqZWN0XSlcbiAgICBdLCBBbnN3ZXJHcm91cE9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBBbnN3ZXJHcm91cE9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5BbnN3ZXJHcm91cE9iamVjdEZhY3RvcnkgPSBBbnN3ZXJHcm91cE9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdBbnN3ZXJHcm91cE9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKEFuc3dlckdyb3VwT2JqZWN0RmFjdG9yeSkpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHNlbmQgY2hhbmdlcyB0byBhIGV4cGxvcmF0aW9uIHRvIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFZGl0YWJsZUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1JlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZScsXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgJ0VESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfRFJBRlRfVVJMX1RFTVBMQVRFJyxcbiAgICAnRURJVEFCTEVfRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEVESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfRFJBRlRfVVJMX1RFTVBMQVRFLCBFRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURSkge1xuICAgICAgICB2YXIgX2ZldGNoRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgYXBwbHlEcmFmdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwgPSBfZ2V0RXhwbG9yYXRpb25VcmwoZXhwbG9yYXRpb25JZCwgYXBwbHlEcmFmdCk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGV4cGxvcmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVFeHBsb3JhdGlvbiA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBleHBsb3JhdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGVkaXRhYmxlRXhwbG9yYXRpb25EYXRhVXJsID0gX2dldEV4cGxvcmF0aW9uVXJsKGV4cGxvcmF0aW9uSWQsIG51bGwpO1xuICAgICAgICAgICAgdmFyIHB1dERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbjogZXhwbG9yYXRpb25WZXJzaW9uLFxuICAgICAgICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYW5nZV9saXN0OiBjaGFuZ2VMaXN0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJGh0dHAucHV0KGVkaXRhYmxlRXhwbG9yYXRpb25EYXRhVXJsLCBwdXREYXRhKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSByZXR1cm5lZCBkYXRhIGlzIGFuIHVwZGF0ZWQgZXhwbG9yYXRpb24gZGljdC5cbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb24gPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgLy8gRGVsZXRlIGZyb20gdGhlIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSdzIGNhY2hlXG4gICAgICAgICAgICAgICAgLy8gQXMgdGhlIHR3byB2ZXJzaW9ucyBvZiB0aGUgZGF0YSAobGVhcm5lciBhbmQgZWRpdG9yKSBub3cgZGlmZmVyXG4gICAgICAgICAgICAgICAgUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmRlbGV0ZUV4cGxvcmF0aW9uRnJvbUNhY2hlKGV4cGxvcmF0aW9uSWQsIGV4cGxvcmF0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhleHBsb3JhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZGVsZXRlRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwgPSBfZ2V0RXhwbG9yYXRpb25VcmwoZXhwbG9yYXRpb25JZCwgbnVsbCk7XG4gICAgICAgICAgICAkaHR0cFsnZGVsZXRlJ10oZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIERlbGV0ZSBpdGVtIGZyb20gdGhlIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSdzIGNhY2hlXG4gICAgICAgICAgICAgICAgUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmRlbGV0ZUV4cGxvcmF0aW9uRnJvbUNhY2hlKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHt9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRFeHBsb3JhdGlvblVybCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBhcHBseURyYWZ0KSB7XG4gICAgICAgICAgICBpZiAoYXBwbHlEcmFmdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX0RSQUZUX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlfZHJhZnQ6IEpTT04uc3RyaW5naWZ5KGFwcGx5RHJhZnQpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRURJVEFCTEVfRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmZXRjaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaEV4cGxvcmF0aW9uKGV4cGxvcmF0aW9uSWQsIG51bGwsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmV0Y2hBcHBseURyYWZ0RXhwbG9yYXRpb246IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoRXhwbG9yYXRpb24oZXhwbG9yYXRpb25JZCwgdHJ1ZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFVwZGF0ZXMgYW4gZXhwbG9yYXRpb24gaW4gdGhlIGJhY2tlbmQgd2l0aCB0aGUgcHJvdmlkZWQgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAqIElELiBUaGUgY2hhbmdlcyBvbmx5IGFwcGx5IHRvIHRoZSBleHBsb3JhdGlvbiBvZiB0aGUgZ2l2ZW4gdmVyc2lvblxuICAgICAgICAgICAgICogYW5kIHRoZSByZXF1ZXN0IHRvIHVwZGF0ZSB0aGUgZXhwbG9yYXRpb24gd2lsbCBmYWlsIGlmIHRoZSBwcm92aWRlZFxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gdmVyc2lvbiBpcyBvbGRlciB0aGFuIHRoZSBjdXJyZW50IHZlcnNpb24gc3RvcmVkIGluIHRoZVxuICAgICAgICAgICAgICogYmFja2VuZC4gQm90aCB0aGUgY2hhbmdlcyBhbmQgdGhlIG1lc3NhZ2UgdG8gYXNzb2NpYXRlIHdpdGggdGhvc2VcbiAgICAgICAgICAgICAqIGNoYW5nZXMgYXJlIHVzZWQgdG8gY29tbWl0IGEgY2hhbmdlIHRvIHRoZSBleHBsb3JhdGlvbi5cbiAgICAgICAgICAgICAqIFRoZSBuZXcgZXhwbG9yYXRpb24gaXMgcGFzc2VkIHRvIHRoZSBzdWNjZXNzIGNhbGxiYWNrLFxuICAgICAgICAgICAgICogaWYgb25lIGlzIHByb3ZpZGVkIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIG9iamVjdC4gRXJyb3JzIGFyZSBwYXNzZWRcbiAgICAgICAgICAgICAqIHRvIHRoZSBlcnJvciBjYWxsYmFjaywgaWYgb25lIGlzIHByb3ZpZGVkLiBQbGVhc2Ugbm90ZSwgb25jZSB0aGlzIGlzXG4gICAgICAgICAgICAgKiBjYWxsZWQgdGhlIGNhY2hlZCBleHBsb3JhdGlvbiBpbiBSZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2VcbiAgICAgICAgICAgICAqIHdpbGwgYmUgZGVsZXRlZC4gVGhpcyBpcyBkdWUgdG8gdGhlIGRpZmZlcmVuY2VzIGluIHRoZSBiYWNrLWVuZFxuICAgICAgICAgICAgICogZWRpdG9yIG9iamVjdCBhbmQgdGhlIGJhY2stZW5kIHBsYXllciBvYmplY3QuIEFzIGl0IHN0YW5kcyBub3csXG4gICAgICAgICAgICAgKiB3ZSBhcmUgdW5hYmxlIHRvIGNhY2hlIGFueSBFeHBsb3JhdGlvbiBvYmplY3Qgb2J0YWluZWQgZnJvbSB0aGVcbiAgICAgICAgICAgICAqIGVkaXRvciBiZWFja2VuZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdXBkYXRlRXhwbG9yYXRpb246IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBleHBsb3JhdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlRXhwbG9yYXRpb24oZXhwbG9yYXRpb25JZCwgZXhwbG9yYXRpb25WZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0LCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGVsZXRlcyBhbiBleHBsb3JhdGlvbiBpbiB0aGUgYmFja2VuZCB3aXRoIHRoZSBwcm92aWRlZCBleHBsb3JhdGlvblxuICAgICAgICAgICAgICogSUQuIElmIHN1Y2Nlc3NmdWwsIHRoZSBleHBsb3JhdGlvbiB3aWxsIGFsc28gYmUgZGVsZXRlZCBmcm9tIHRoZVxuICAgICAgICAgICAgICogUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlIGNhY2hlIGFzIHdlbGwuXG4gICAgICAgICAgICAgKiBFcnJvcnMgYXJlIHBhc3NlZCB0byB0aGUgZXJyb3IgY2FsbGJhY2ssIGlmIG9uZSBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGVsZXRlRXhwbG9yYXRpb246IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2RlbGV0ZUV4cGxvcmF0aW9uKGV4cGxvcmF0aW9uSWQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGluc3RhbmNlcyBvZiBFeHBsb3JhdGlvbkRyYWZ0XG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIEV4cGxvcmF0aW9uRHJhZnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXhwbG9yYXRpb25EcmFmdChkcmFmdENoYW5nZXMsIGRyYWZ0Q2hhbmdlTGlzdElkKSB7XG4gICAgICAgIHRoaXMuZHJhZnRDaGFuZ2VzID0gZHJhZnRDaGFuZ2VzO1xuICAgICAgICB0aGlzLmRyYWZ0Q2hhbmdlTGlzdElkID0gZHJhZnRDaGFuZ2VMaXN0SWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3aGV0aGVyIHRoZSBkcmFmdCBvYmplY3QgaGFzIGJlZW4gb3ZlcndyaXR0ZW4gYnkgYW5vdGhlclxuICAgICAqIGRyYWZ0IHdoaWNoIGhhcyBiZWVuIGNvbW1pdHRlZCB0byB0aGUgYmFjay1lbmQuIElmIHRoZSBzdXBwbGllZCBkcmFmdCBpZFxuICAgICAqIGhhcyBhIGRpZmZlcmVudCB2YWx1ZSB0aGVuIGEgbmV3ZXIgY2hhbmdlTGlzdCBtdXN0IGhhdmUgYmVlbiBjb21taXR0ZWRcbiAgICAgKiB0byB0aGUgYmFjay1lbmQuXG4gICAgICogQHBhcmFtIHtJbnRlZ2VyfSAtIGN1cnJlbnREcmFmdElkLiBUaGUgaWQgb2YgdGhlIGRyYWZ0IGNoYW5nZXMgd2hjaCB3YXNcbiAgICAgKiAgcmV0cmlldmVkIGZyb20gdGhlIGJhY2stZW5kLlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSAtIFRydWUgaWZmIHRoZSBjdXJyZW50RHJhZnRJZCBpcyB0aGUgc2FtZSBhcyB0aGVcbiAgICAgKiBkcmFmdENoYW5nZUxpc3RJZCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgZHJhZnQuXG4gICAgICovXG4gICAgRXhwbG9yYXRpb25EcmFmdC5wcm90b3R5cGUuaXNWYWxpZCA9IGZ1bmN0aW9uIChjdXJyZW50RHJhZnRJZCkge1xuICAgICAgICByZXR1cm4gKGN1cnJlbnREcmFmdElkID09PSB0aGlzLmRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICB9O1xuICAgIC8vIFRPRE8oIzcxNjUpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4gdHlwZWRcbiAgICAvLyBhcyAnYW55JyBzaW5jZSAnZHJhZnRDaGFuZ2VzJyBpcyBhbiBhcnJheSBvZiBkaWN0cyB3aXRoIHBvc3NpYmxlXG4gICAgLy8gdW5kZXJzY29yZV9jYXNlZCBrZXlzLiBBIHRob3JvdWdoIGNoZWNrIG5lZWRzIHRvIGJlIGRvbmUgdG8gYXNzdXJlIG9mXG4gICAgLy8gaXRzIGV4YWN0IHR5cGUuXG4gICAgRXhwbG9yYXRpb25EcmFmdC5wcm90b3R5cGUuZ2V0Q2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZHJhZnRDaGFuZ2VzO1xuICAgIH07XG4gICAgcmV0dXJuIEV4cGxvcmF0aW9uRHJhZnQ7XG59KCkpO1xuZXhwb3J0cy5FeHBsb3JhdGlvbkRyYWZ0ID0gRXhwbG9yYXRpb25EcmFmdDtcbnZhciBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeSgpIHtcbiAgICB9XG4gICAgRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21Mb2NhbFN0b3JhZ2VEaWN0ID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uRHJhZnREaWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwbG9yYXRpb25EcmFmdChleHBsb3JhdGlvbkRyYWZ0RGljdC5kcmFmdENoYW5nZXMsIGV4cGxvcmF0aW9uRHJhZnREaWN0LmRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICB9O1xuICAgIEV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5LnByb3RvdHlwZS50b0xvY2FsU3RvcmFnZURpY3QgPSBmdW5jdGlvbiAoXG4gICAgLy8gVE9ETygjNzE2NSk6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiB0eXBlZFxuICAgIC8vIGFzICdhbnknIHNpbmNlICdjaGFuZ2VMaXN0JyBpcyBhbiBhcnJheSBvZiBkaWN0cyB3aXRoIHBvc3NpYmxlXG4gICAgLy8gdW5kZXJzY29yZV9jYXNlZCBrZXlzLiBBIHRob3JvdWdoIGNoZWNrIG5lZWRzIHRvIGJlIGRvbmUgdG8gYXNzdXJlIG9mXG4gICAgLy8gaXRzIGV4YWN0IHR5cGUuXG4gICAgY2hhbmdlTGlzdCwgZHJhZnRDaGFuZ2VMaXN0SWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRyYWZ0Q2hhbmdlczogY2hhbmdlTGlzdCxcbiAgICAgICAgICAgIGRyYWZ0Q2hhbmdlTGlzdElkOiBkcmFmdENoYW5nZUxpc3RJZFxuICAgICAgICB9O1xuICAgIH07XG4gICAgRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkV4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5ID0gRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgSGludFxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeV8xID0gcmVxdWlyZShcImRvbWFpbi9leHBsb3JhdGlvbi9TdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeVwiKTtcbnZhciBIaW50ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEhpbnQoaGludENvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5oaW50Q29udGVudCA9IGhpbnRDb250ZW50O1xuICAgIH1cbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkXG4gICAgLy8ga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZlxuICAgIC8vIGNhbWVsQ2FzaW5nLlxuICAgIEhpbnQucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBoaW50X2NvbnRlbnQ6IHRoaXMuaGludENvbnRlbnQudG9CYWNrZW5kRGljdCgpXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gSGludDtcbn0oKSk7XG5leHBvcnRzLkhpbnQgPSBIaW50O1xudmFyIEhpbnRPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEhpbnRPYmplY3RGYWN0b3J5KHN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMuc3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkgPSBzdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeTtcbiAgICB9XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSAnaGludEJhY2tlbmREaWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkXG4gICAgLy8ga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZlxuICAgIC8vIGNhbWVsQ2FzaW5nLlxuICAgIEhpbnRPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoaGludEJhY2tlbmREaWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgSGludCh0aGlzLnN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChoaW50QmFja2VuZERpY3QuaGludF9jb250ZW50KSk7XG4gICAgfTtcbiAgICBIaW50T2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24gKGhpbnRDb250ZW50SWQsIGhpbnRDb250ZW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgSGludCh0aGlzLnN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5LmNyZWF0ZURlZmF1bHQoaGludENvbnRlbnQsIGhpbnRDb250ZW50SWQpKTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBIaW50T2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSksXG4gICAgICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbdHlwZW9mIChfYSA9IHR5cGVvZiBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeV8xLlN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5ICE9PSBcInVuZGVmaW5lZFwiICYmIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5XzEuU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgSGludE9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBIaW50T2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLkhpbnRPYmplY3RGYWN0b3J5ID0gSGludE9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdIaW50T2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoSGludE9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBJbnRlcmFjdGlvblxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9BbnN3ZXJHcm91cE9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9IaW50T2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL091dGNvbWVPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vU29sdXRpb25PYmplY3RGYWN0b3J5LnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdJbnRlcmFjdGlvbk9iamVjdEZhY3RvcnknLCBbXG4gICAgJ0Fuc3dlckdyb3VwT2JqZWN0RmFjdG9yeScsICdIaW50T2JqZWN0RmFjdG9yeScsICdPdXRjb21lT2JqZWN0RmFjdG9yeScsXG4gICAgJ1NvbHV0aW9uT2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKEFuc3dlckdyb3VwT2JqZWN0RmFjdG9yeSwgSGludE9iamVjdEZhY3RvcnksIE91dGNvbWVPYmplY3RGYWN0b3J5LCBTb2x1dGlvbk9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdmFyIEludGVyYWN0aW9uID0gZnVuY3Rpb24gKGFuc3dlckdyb3VwcywgY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycywgY3VzdG9taXphdGlvbkFyZ3MsIGRlZmF1bHRPdXRjb21lLCBoaW50cywgaWQsIHNvbHV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmFuc3dlckdyb3VwcyA9IGFuc3dlckdyb3VwcztcbiAgICAgICAgICAgIHRoaXMuY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycyA9IGNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnM7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbWl6YXRpb25BcmdzID0gY3VzdG9taXphdGlvbkFyZ3M7XG4gICAgICAgICAgICB0aGlzLmRlZmF1bHRPdXRjb21lID0gZGVmYXVsdE91dGNvbWU7XG4gICAgICAgICAgICB0aGlzLmhpbnRzID0gaGludHM7XG4gICAgICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgICAgICB0aGlzLnNvbHV0aW9uID0gc29sdXRpb247XG4gICAgICAgIH07XG4gICAgICAgIEludGVyYWN0aW9uLnByb3RvdHlwZS5zZXRJZCA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG5ld1ZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICBJbnRlcmFjdGlvbi5wcm90b3R5cGUuc2V0QW5zd2VyR3JvdXBzID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLmFuc3dlckdyb3VwcyA9IG5ld1ZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICBJbnRlcmFjdGlvbi5wcm90b3R5cGUuc2V0RGVmYXVsdE91dGNvbWUgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdE91dGNvbWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgSW50ZXJhY3Rpb24ucHJvdG90eXBlLnNldEN1c3RvbWl6YXRpb25BcmdzID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLmN1c3RvbWl6YXRpb25BcmdzID0gbmV3VmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIEludGVyYWN0aW9uLnByb3RvdHlwZS5zZXRTb2x1dGlvbiA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5zb2x1dGlvbiA9IG5ld1ZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICBJbnRlcmFjdGlvbi5wcm90b3R5cGUuc2V0SGludHMgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuaGludHMgPSBuZXdWYWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgSW50ZXJhY3Rpb24ucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAob3RoZXJJbnRlcmFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5hbnN3ZXJHcm91cHMgPSBhbmd1bGFyLmNvcHkob3RoZXJJbnRlcmFjdGlvbi5hbnN3ZXJHcm91cHMpO1xuICAgICAgICAgICAgdGhpcy5jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzID1cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmNvcHkob3RoZXJJbnRlcmFjdGlvbi5jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzKTtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9taXphdGlvbkFyZ3MgPSBhbmd1bGFyLmNvcHkob3RoZXJJbnRlcmFjdGlvbi5jdXN0b21pemF0aW9uQXJncyk7XG4gICAgICAgICAgICB0aGlzLmRlZmF1bHRPdXRjb21lID0gYW5ndWxhci5jb3B5KG90aGVySW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUpO1xuICAgICAgICAgICAgdGhpcy5oaW50cyA9IGFuZ3VsYXIuY29weShvdGhlckludGVyYWN0aW9uLmhpbnRzKTtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBhbmd1bGFyLmNvcHkob3RoZXJJbnRlcmFjdGlvbi5pZCk7XG4gICAgICAgICAgICB0aGlzLnNvbHV0aW9uID0gYW5ndWxhci5jb3B5KG90aGVySW50ZXJhY3Rpb24uc29sdXRpb24pO1xuICAgICAgICB9O1xuICAgICAgICBJbnRlcmFjdGlvbi5wcm90b3R5cGUudG9CYWNrZW5kRGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgYW5zd2VyX2dyb3VwczogdGhpcy5hbnN3ZXJHcm91cHMubWFwKGZ1bmN0aW9uIChhbnN3ZXJHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYW5zd2VyR3JvdXAudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGNvbmZpcm1lZF91bmNsYXNzaWZpZWRfYW5zd2VyczogdGhpcy5jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzLFxuICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25fYXJnczogdGhpcy5jdXN0b21pemF0aW9uQXJncyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0X291dGNvbWU6IHRoaXMuZGVmYXVsdE91dGNvbWUgPyB0aGlzLmRlZmF1bHRPdXRjb21lLnRvQmFja2VuZERpY3QoKSA6IG51bGwsXG4gICAgICAgICAgICAgICAgaGludHM6IHRoaXMuaGludHMubWFwKGZ1bmN0aW9uIChoaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoaW50LnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5pZCxcbiAgICAgICAgICAgICAgICBzb2x1dGlvbjogdGhpcy5zb2x1dGlvbiA/IHRoaXMuc29sdXRpb24udG9CYWNrZW5kRGljdCgpIDogbnVsbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyhhbmtpdGEyNDA3OTYpOiBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgSW50ZXJhY3Rpb25bJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKGludGVyYWN0aW9uRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHZhciBkZWZhdWx0T3V0Y29tZTtcbiAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbkRpY3QuZGVmYXVsdF9vdXRjb21lKSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdE91dGNvbWUgPSBPdXRjb21lT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoaW50ZXJhY3Rpb25EaWN0LmRlZmF1bHRfb3V0Y29tZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0T3V0Y29tZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IEludGVyYWN0aW9uKGdlbmVyYXRlQW5zd2VyR3JvdXBzRnJvbUJhY2tlbmQoaW50ZXJhY3Rpb25EaWN0LmFuc3dlcl9ncm91cHMpLCBpbnRlcmFjdGlvbkRpY3QuY29uZmlybWVkX3VuY2xhc3NpZmllZF9hbnN3ZXJzLCBpbnRlcmFjdGlvbkRpY3QuY3VzdG9taXphdGlvbl9hcmdzLCBkZWZhdWx0T3V0Y29tZSwgZ2VuZXJhdGVIaW50c0Zyb21CYWNrZW5kKGludGVyYWN0aW9uRGljdC5oaW50cyksIGludGVyYWN0aW9uRGljdC5pZCwgaW50ZXJhY3Rpb25EaWN0LnNvbHV0aW9uID8gKGdlbmVyYXRlU29sdXRpb25Gcm9tQmFja2VuZChpbnRlcmFjdGlvbkRpY3Quc29sdXRpb24pKSA6IG51bGwpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZ2VuZXJhdGVBbnN3ZXJHcm91cHNGcm9tQmFja2VuZCA9IGZ1bmN0aW9uIChhbnN3ZXJHcm91cEJhY2tlbmREaWN0cykge1xuICAgICAgICAgICAgcmV0dXJuIGFuc3dlckdyb3VwQmFja2VuZERpY3RzLm1hcChmdW5jdGlvbiAoYW5zd2VyR3JvdXBCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBbnN3ZXJHcm91cE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KGFuc3dlckdyb3VwQmFja2VuZERpY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBnZW5lcmF0ZUhpbnRzRnJvbUJhY2tlbmQgPSBmdW5jdGlvbiAoaGludEJhY2tlbmREaWN0cykge1xuICAgICAgICAgICAgcmV0dXJuIGhpbnRCYWNrZW5kRGljdHMubWFwKGZ1bmN0aW9uIChoaW50QmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSGludE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KGhpbnRCYWNrZW5kRGljdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGdlbmVyYXRlU29sdXRpb25Gcm9tQmFja2VuZCA9IGZ1bmN0aW9uIChzb2x1dGlvbkJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gU29sdXRpb25PYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzb2x1dGlvbkJhY2tlbmREaWN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEludGVyYWN0aW9uO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBPdXRjb21lXG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5XzEgPSByZXF1aXJlKFwiZG9tYWluL2V4cGxvcmF0aW9uL1N1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5XCIpO1xudmFyIE91dGNvbWUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gT3V0Y29tZShkZXN0LCBmZWVkYmFjaywgbGFiZWxsZWRBc0NvcnJlY3QsIHBhcmFtQ2hhbmdlcywgcmVmcmVzaGVyRXhwbG9yYXRpb25JZCwgbWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWQpIHtcbiAgICAgICAgdGhpcy5kZXN0ID0gZGVzdDtcbiAgICAgICAgdGhpcy5mZWVkYmFjayA9IGZlZWRiYWNrO1xuICAgICAgICB0aGlzLmxhYmVsbGVkQXNDb3JyZWN0ID0gbGFiZWxsZWRBc0NvcnJlY3Q7XG4gICAgICAgIHRoaXMucGFyYW1DaGFuZ2VzID0gcGFyYW1DaGFuZ2VzO1xuICAgICAgICB0aGlzLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQgPSByZWZyZXNoZXJFeHBsb3JhdGlvbklkO1xuICAgICAgICB0aGlzLm1pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkID0gbWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWQ7XG4gICAgfVxuICAgIE91dGNvbWUucHJvdG90eXBlLnNldERlc3RpbmF0aW9uID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGVzdCA9IG5ld1ZhbHVlO1xuICAgIH07XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSB0aGUgcmV0dXJuIHR5cGUgaXMgYSBkaWN0IHdpdGggdW5kZXJzY29yZV9jYXNlZCBrZXlzXG4gICAgLy8gd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2YgY2FtZWxDYXNpbmcuXG4gICAgT3V0Y29tZS5wcm90b3R5cGUudG9CYWNrZW5kRGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRlc3Q6IHRoaXMuZGVzdCxcbiAgICAgICAgICAgIGZlZWRiYWNrOiB0aGlzLmZlZWRiYWNrLnRvQmFja2VuZERpY3QoKSxcbiAgICAgICAgICAgIGxhYmVsbGVkX2FzX2NvcnJlY3Q6IHRoaXMubGFiZWxsZWRBc0NvcnJlY3QsXG4gICAgICAgICAgICBwYXJhbV9jaGFuZ2VzOiB0aGlzLnBhcmFtQ2hhbmdlcyxcbiAgICAgICAgICAgIHJlZnJlc2hlcl9leHBsb3JhdGlvbl9pZDogdGhpcy5yZWZyZXNoZXJFeHBsb3JhdGlvbklkLFxuICAgICAgICAgICAgbWlzc2luZ19wcmVyZXF1aXNpdGVfc2tpbGxfaWQ6IHRoaXMubWlzc2luZ1ByZXJlcXVpc2l0ZVNraWxsSWRcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIE91dGNvbWUucHJvdG90eXBlLmhhc05vbmVtcHR5RmVlZGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZlZWRiYWNrLmdldEh0bWwoKS50cmltKCkgIT09ICcnO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0cnVlIGlmZiBhbiBvdXRjb21lIGhhcyBhIHNlbGYtbG9vcCwgbm8gZmVlZGJhY2ssIGFuZCBub1xuICAgICAqIHJlZnJlc2hlciBleHBsb3JhdGlvbi5cbiAgICAgKi9cbiAgICBPdXRjb21lLnByb3RvdHlwZS5pc0NvbmZ1c2luZyA9IGZ1bmN0aW9uIChjdXJyZW50U3RhdGVOYW1lKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5kZXN0ID09PSBjdXJyZW50U3RhdGVOYW1lICYmXG4gICAgICAgICAgICAhdGhpcy5oYXNOb25lbXB0eUZlZWRiYWNrKCkgJiZcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaGVyRXhwbG9yYXRpb25JZCA9PT0gbnVsbCk7XG4gICAgfTtcbiAgICByZXR1cm4gT3V0Y29tZTtcbn0oKSk7XG5leHBvcnRzLk91dGNvbWUgPSBPdXRjb21lO1xudmFyIE91dGNvbWVPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE91dGNvbWVPYmplY3RGYWN0b3J5KHN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMuc3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkgPSBzdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeTtcbiAgICB9XG4gICAgLy8gVE9ETygjNzE3Nik6IFJlcGxhY2UgJ2FueScgd2l0aCB0aGUgZXhhY3QgdHlwZS4gVGhpcyBoYXMgYmVlbiBrZXB0IGFzXG4gICAgLy8gJ2FueScgYmVjYXVzZSB0aGUgcmV0dXJuIHR5cGUgaXMgYSBkaWN0IHdpdGggdW5kZXJzY29yZV9jYXNlZCBrZXlzXG4gICAgLy8gd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2YgY2FtZWxDYXNpbmcuXG4gICAgT3V0Y29tZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZU5ldyA9IGZ1bmN0aW9uIChkZXN0LCBmZWVkYmFja1RleHRJZCwgZmVlZGJhY2tUZXh0LCBwYXJhbUNoYW5nZXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBPdXRjb21lKGRlc3QsIHRoaXMuc3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkuY3JlYXRlRGVmYXVsdChmZWVkYmFja1RleHQsIGZlZWRiYWNrVGV4dElkKSwgZmFsc2UsIHBhcmFtQ2hhbmdlcywgbnVsbCwgbnVsbCk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdvdXRjb21lRGljdCcgaXMgYSBkaWN0IHdpdGggdW5kZXJzY29yZV9jYXNlZCBrZXlzXG4gICAgLy8gd2hpY2ggZ2l2ZSB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2YgY2FtZWxDYXNpbmcuXG4gICAgT3V0Y29tZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChvdXRjb21lRGljdCkge1xuICAgICAgICByZXR1cm4gbmV3IE91dGNvbWUob3V0Y29tZURpY3QuZGVzdCwgdGhpcy5zdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qob3V0Y29tZURpY3QuZmVlZGJhY2spLCBvdXRjb21lRGljdC5sYWJlbGxlZF9hc19jb3JyZWN0LCBvdXRjb21lRGljdC5wYXJhbV9jaGFuZ2VzLCBvdXRjb21lRGljdC5yZWZyZXNoZXJfZXhwbG9yYXRpb25faWQsIG91dGNvbWVEaWN0Lm1pc3NpbmdfcHJlcmVxdWlzaXRlX3NraWxsX2lkKTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBPdXRjb21lT2JqZWN0RmFjdG9yeSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuSW5qZWN0YWJsZSh7XG4gICAgICAgICAgICBwcm92aWRlZEluOiAncm9vdCdcbiAgICAgICAgfSksXG4gICAgICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbdHlwZW9mIChfYSA9IHR5cGVvZiBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeV8xLlN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5ICE9PSBcInVuZGVmaW5lZFwiICYmIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5XzEuU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgT3V0Y29tZU9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBPdXRjb21lT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLk91dGNvbWVPYmplY3RGYWN0b3J5ID0gT3V0Y29tZU9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdPdXRjb21lT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoT3V0Y29tZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBQYXJhbUNoYW5nZVxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBjbG9uZURlZXBfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwibG9kYXNoL2Nsb25lRGVlcFwiKSk7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgREVGQVVMVF9DVVNUT01JWkFUSU9OX0FSR1MgPSB7XG4gICAgQ29waWVyOiB7XG4gICAgICAgIHBhcnNlX3dpdGhfamluamE6IHRydWUsXG4gICAgICAgIHZhbHVlOiAnNSdcbiAgICB9LFxuICAgIFJhbmRvbVNlbGVjdG9yOiB7XG4gICAgICAgIGxpc3Rfb2ZfdmFsdWVzOiBbJ3NhbXBsZSB2YWx1ZSddXG4gICAgfVxufTtcbnZhciBQYXJhbUNoYW5nZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYXJhbUNoYW5nZShjdXN0b21pemF0aW9uQXJncywgZ2VuZXJhdG9ySWQsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5jdXN0b21pemF0aW9uQXJncyA9IGN1c3RvbWl6YXRpb25BcmdzO1xuICAgICAgICB0aGlzLmdlbmVyYXRvcklkID0gZ2VuZXJhdG9ySWQ7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgdGhlIHJldHVybiB0eXBlIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaFxuICAgIC8vIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nIGluIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLlxuICAgIFBhcmFtQ2hhbmdlLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3VzdG9taXphdGlvbl9hcmdzOiB0aGlzLmN1c3RvbWl6YXRpb25BcmdzLFxuICAgICAgICAgICAgZ2VuZXJhdG9yX2lkOiB0aGlzLmdlbmVyYXRvcklkLFxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lXG4gICAgICAgIH07XG4gICAgfTtcbiAgICBQYXJhbUNoYW5nZS5wcm90b3R5cGUucmVzZXRDdXN0b21pemF0aW9uQXJncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jdXN0b21pemF0aW9uQXJncyA9IGNsb25lRGVlcF8xLmRlZmF1bHQoREVGQVVMVF9DVVNUT01JWkFUSU9OX0FSR1NbdGhpcy5nZW5lcmF0b3JJZF0pO1xuICAgIH07XG4gICAgcmV0dXJuIFBhcmFtQ2hhbmdlO1xufSgpKTtcbmV4cG9ydHMuUGFyYW1DaGFuZ2UgPSBQYXJhbUNoYW5nZTtcbnZhciBQYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdwYXJhbUNoYW5nZUJhY2tlbmREaWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXNcbiAgICAvLyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBQYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChwYXJhbUNoYW5nZUJhY2tlbmREaWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUGFyYW1DaGFuZ2UocGFyYW1DaGFuZ2VCYWNrZW5kRGljdC5jdXN0b21pemF0aW9uX2FyZ3MsIHBhcmFtQ2hhbmdlQmFja2VuZERpY3QuZ2VuZXJhdG9yX2lkLCBwYXJhbUNoYW5nZUJhY2tlbmREaWN0Lm5hbWUpO1xuICAgIH07XG4gICAgUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVFbXB0eSA9IGZ1bmN0aW9uIChwYXJhbU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXJhbUNoYW5nZSh7XG4gICAgICAgICAgICBwYXJzZV93aXRoX2ppbmphOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWU6ICcnXG4gICAgICAgIH0sICdDb3BpZXInLCBwYXJhbU5hbWUpO1xuICAgIH07XG4gICAgUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVEZWZhdWx0ID0gZnVuY3Rpb24gKHBhcmFtTmFtZSkge1xuICAgICAgICByZXR1cm4gbmV3IFBhcmFtQ2hhbmdlKGNsb25lRGVlcF8xLmRlZmF1bHQoREVGQVVMVF9DVVNUT01JWkFUSU9OX0FSR1MuQ29waWVyKSwgJ0NvcGllcicsIHBhcmFtTmFtZSk7XG4gICAgfTtcbiAgICBQYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5O1xufSgpKTtcbmV4cG9ydHMuUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5ID0gUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5Jywgc3RhdGljXzEuZG93bmdyYWRlSW5qZWN0YWJsZShQYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBhcnJheXMgb2YgUGFyYW1DaGFuZ2VcbiAqIGRvbWFpbiBvYmplY3RzLlxuICovXG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5X3RzXzEgPSByZXF1aXJlKFwiZG9tYWluL2V4cGxvcmF0aW9uL1BhcmFtQ2hhbmdlT2JqZWN0RmFjdG9yeS50c1wiKTtcbnZhciBQYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnkocGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMucGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5ID0gcGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5O1xuICAgIH1cbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICdwYXJhbUNoYW5nZUJhY2tlbmRMaXN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXNcbiAgICAvLyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBQYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZExpc3QgPSBmdW5jdGlvbiAocGFyYW1DaGFuZ2VCYWNrZW5kTGlzdCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gcGFyYW1DaGFuZ2VCYWNrZW5kTGlzdC5tYXAoZnVuY3Rpb24gKHBhcmFtQ2hhbmdlQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy5wYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHBhcmFtQ2hhbmdlQmFja2VuZERpY3QpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHZhciBfYTtcbiAgICBQYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIFBhcmFtQ2hhbmdlT2JqZWN0RmFjdG9yeV90c18xLlBhcmFtQ2hhbmdlT2JqZWN0RmFjdG9yeSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBQYXJhbUNoYW5nZU9iamVjdEZhY3RvcnlfdHNfMS5QYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkpID09PSBcImZ1bmN0aW9uXCIgPyBfYSA6IE9iamVjdF0pXG4gICAgXSwgUGFyYW1DaGFuZ2VzT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIFBhcmFtQ2hhbmdlc09iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5QYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5ID0gUGFyYW1DaGFuZ2VzT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1BhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFBhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byByZXRyaWV2ZSByZWFkIG9ubHkgaW5mb3JtYXRpb25cbiAqIGFib3V0IGV4cGxvcmF0aW9ucyBmcm9tIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdSZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICAnRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUnLCAnRVhQTE9SQVRJT05fVkVSU0lPTl9EQVRBX1VSTF9URU1QTEFURScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEVYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCBFWFBMT1JBVElPTl9WRVJTSU9OX0RBVEFfVVJMX1RFTVBMQVRFKSB7XG4gICAgICAgIC8vIE1hcHMgcHJldmlvdXNseSBsb2FkZWQgZXhwbG9yYXRpb25zIHRvIHRoZWlyIElEcy5cbiAgICAgICAgdmFyIF9leHBsb3JhdGlvbkNhY2hlID0gW107XG4gICAgICAgIHZhciBfZmV0Y2hFeHBsb3JhdGlvbiA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCB2ZXJzaW9uLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBleHBsb3JhdGlvbkRhdGFVcmwgPSBfZ2V0RXhwbG9yYXRpb25VcmwoZXhwbG9yYXRpb25JZCwgdmVyc2lvbik7XG4gICAgICAgICAgICAkaHR0cC5nZXQoZXhwbG9yYXRpb25EYXRhVXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBleHBsb3JhdGlvbiA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhleHBsb3JhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfaXNDYWNoZWQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9leHBsb3JhdGlvbkNhY2hlLmhhc093blByb3BlcnR5KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEV4cGxvcmF0aW9uVXJsID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIHZlcnNpb24pIHtcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVYUExPUkFUSU9OX1ZFUlNJT05fREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWQsXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IFN0cmluZyh2ZXJzaW9uKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZXMgYW4gZXhwbG9yYXRpb24gZnJvbSB0aGUgYmFja2VuZCBnaXZlbiBhbiBleHBsb3JhdGlvbiBJRFxuICAgICAgICAgICAgICogYW5kIHZlcnNpb24gbnVtYmVyIChvciBub25lKS4gVGhpcyByZXR1cm5zIGEgcHJvbWlzZSBvYmplY3QgdGhhdFxuICAgICAgICAgICAgICogYWxsb3dzIHN1Y2Nlc3MgYW5kIHJlamVjdGlvbiBjYWxsYmFja3MgdG8gYmUgcmVnaXN0ZXJlZC4gSWYgdGhlXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBpcyBzdWNjZXNzZnVsbHkgbG9hZGVkIGFuZCBhIHN1Y2Nlc3MgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgICAgICAgICAqIGlzIHByb3ZpZGVkIHRvIHRoZSBwcm9taXNlIG9iamVjdCwgdGhlIHN1Y2Nlc3MgY2FsbGJhY2sgaXMgY2FsbGVkXG4gICAgICAgICAgICAgKiB3aXRoIHRoZSBleHBsb3JhdGlvbiBwYXNzZWQgaW4gYXMgYSBwYXJhbWV0ZXIuIElmIHNvbWV0aGluZyBnb2VzXG4gICAgICAgICAgICAgKiB3cm9uZyB3aGlsZSB0cnlpbmcgdG8gZmV0Y2ggdGhlIGV4cGxvcmF0aW9uLCB0aGUgcmVqZWN0aW9uIGNhbGxiYWNrXG4gICAgICAgICAgICAgKiBpcyBjYWxsZWQgaW5zdGVhZCwgaWYgcHJlc2VudC4gVGhlIHJlamVjdGlvbiBjYWxsYmFjayBmdW5jdGlvbiBpc1xuICAgICAgICAgICAgICogcGFzc2VkIGFueSBkYXRhIHJldHVybmVkIGJ5IHRoZSBiYWNrZW5kIGluIHRoZSBjYXNlIG9mIGFuIGVycm9yLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmZXRjaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgdmVyc2lvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaEV4cGxvcmF0aW9uKGV4cGxvcmF0aW9uSWQsIHZlcnNpb24sIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBCZWhhdmVzIGluIHRoZSBleGFjdCBzYW1lIHdheSBhcyBmZXRjaEV4cGxvcmF0aW9uIChpbmNsdWRpbmdcbiAgICAgICAgICAgICAqIGNhbGxiYWNrIGJlaGF2aW9yIGFuZCByZXR1cm5pbmcgYSBwcm9taXNlIG9iamVjdCksXG4gICAgICAgICAgICAgKiBleGNlcHQgdGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gc2VlIHdoZXRoZXIgdGhlIGxhdGVzdCB2ZXJzaW9uXG4gICAgICAgICAgICAgKiBvZiB0aGUgZ2l2ZW4gZXhwbG9yYXRpb24gaGFzIGFscmVhZHkgYmVlbiBsb2FkZWQuIElmIGl0IGhhcyBub3QgeWV0XG4gICAgICAgICAgICAgKiBiZWVuIGxvYWRlZCwgaXQgd2lsbCBmZXRjaCB0aGUgZXhwbG9yYXRpb24gZnJvbSB0aGUgYmFja2VuZC4gSWYgaXRcbiAgICAgICAgICAgICAqIHN1Y2Nlc3NmdWxseSByZXRyaWV2ZXMgdGhlIGV4cGxvcmF0aW9uIGZyb20gdGhlIGJhY2tlbmQsIHRoaXMgbWV0aG9kXG4gICAgICAgICAgICAgKiB3aWxsIHN0b3JlIHRoZSBleHBsb3JhdGlvbiBpbiB0aGUgY2FjaGUgdG8gYXZvaWQgcmVxdWVzdHMgZnJvbSB0aGVcbiAgICAgICAgICAgICAqIGJhY2tlbmQgaW4gZnVydGhlciBmdW5jdGlvbiBjYWxscy5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9hZExhdGVzdEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfaXNDYWNoZWQoZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhbmd1bGFyLmNvcHkoX2V4cGxvcmF0aW9uQ2FjaGVbZXhwbG9yYXRpb25JZF0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9mZXRjaEV4cGxvcmF0aW9uKGV4cGxvcmF0aW9uSWQsIG51bGwsIGZ1bmN0aW9uIChleHBsb3JhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGZldGNoZWQgZXhwbG9yYXRpb24gdG8gYXZvaWQgZnV0dXJlIGZldGNoZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2V4cGxvcmF0aW9uQ2FjaGVbZXhwbG9yYXRpb25JZF0gPSBleHBsb3JhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFuZ3VsYXIuY29weShleHBsb3JhdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHJpZXZlcyBhbiBleHBsb3JhdGlvbiBmcm9tIHRoZSBiYWNrZW5kIGdpdmVuIGFuIGV4cGxvcmF0aW9uIElEXG4gICAgICAgICAgICAgKiBhbmQgdmVyc2lvbiBudW1iZXIuIFRoaXMgbWV0aG9kIGRvZXMgbm90IGludGVyYWN0IHdpdGggYW55IGNhY2hlXG4gICAgICAgICAgICAgKiBhbmQgdXNpbmcgdGhpcyBtZXRob2Qgd2lsbCBub3Qgb3ZlcndyaXRlIG9yIHRvdWNoIHRoZSBzdGF0ZSBvZiB0aGVcbiAgICAgICAgICAgICAqIGNhY2hlLiBBbGwgcHJldmlvdXMgZGF0YSBpbiB0aGUgY2FjaGUgd2lsbCBzdGlsbCBiZSByZXRhaW5lZCBhZnRlclxuICAgICAgICAgICAgICogdGhpcyBjYWxsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkRXhwbG9yYXRpb246IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCB2ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoRXhwbG9yYXRpb24oZXhwbG9yYXRpb25JZCwgdmVyc2lvbiwgZnVuY3Rpb24gKGV4cGxvcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5ndWxhci5jb3B5KGV4cGxvcmF0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGV4cGxvcmF0aW9uIGlzIHN0b3JlZCB3aXRoaW4gdGhlIGxvY2FsXG4gICAgICAgICAgICAgKiBkYXRhIGNhY2hlIG9yIGlmIGl0IG5lZWRzIHRvIGJlIHJldHJpZXZlZCBmcm9tIHRoZSBiYWNrZW5kIHVwb24gYVxuICAgICAgICAgICAgICogbG9hZC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNDYWNoZWQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc0NhY2hlZChleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlcGxhY2VzIHRoZSBjdXJyZW50IGV4cGxvcmF0aW9uIGluIHRoZSBjYWNoZSBnaXZlbiBieSB0aGUgc3BlY2lmaWVkXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBJRCB3aXRoIGEgbmV3IGV4cGxvcmF0aW9uIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2FjaGVFeHBsb3JhdGlvbjogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIGV4cGxvcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgX2V4cGxvcmF0aW9uQ2FjaGVbZXhwbG9yYXRpb25JZF0gPSBhbmd1bGFyLmNvcHkoZXhwbG9yYXRpb24pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xlYXJzIHRoZSBsb2NhbCBleHBsb3JhdGlvbiBkYXRhIGNhY2hlLCBmb3JjaW5nIGFsbCBmdXR1cmUgbG9hZHMgdG9cbiAgICAgICAgICAgICAqIHJlLXJlcXVlc3QgdGhlIHByZXZpb3VzbHkgbG9hZGVkIGV4cGxvcmF0aW9ucyBmcm9tIHRoZSBiYWNrZW5kLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjbGVhckV4cGxvcmF0aW9uQ2FjaGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfZXhwbG9yYXRpb25DYWNoZSA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRGVsZXRlcyBhIHNwZWNpZmljIGV4cGxvcmF0aW9uIGZyb20gdGhlIGxvY2FsIGNhY2hlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlbGV0ZUV4cGxvcmF0aW9uRnJvbUNhY2hlOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIGlmIChfaXNDYWNoZWQoZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIF9leHBsb3JhdGlvbkNhY2hlW2V4cGxvcmF0aW9uSWRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBSdWxlXG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIFJ1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUnVsZSh0eXBlLCBpbnB1dHMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5pbnB1dHMgPSBpbnB1dHM7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgdGhlIHJldHVybiB0eXBlIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaFxuICAgIC8vIGdpdmVzIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBSdWxlLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcnVsZV90eXBlOiB0aGlzLnR5cGUsXG4gICAgICAgICAgICBpbnB1dHM6IHRoaXMuaW5wdXRzXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gUnVsZTtcbn0oKSk7XG5leHBvcnRzLlJ1bGUgPSBSdWxlO1xudmFyIFJ1bGVPYmplY3RGYWN0b3J5ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJ1bGVPYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICBSdWxlT2JqZWN0RmFjdG9yeS5wcm90b3R5cGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24gKHR5cGUsIGlucHV0cykge1xuICAgICAgICByZXR1cm4gbmV3IFJ1bGUodHlwZSwgaW5wdXRzKTtcbiAgICB9O1xuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ3J1bGVEaWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2hcbiAgICAvLyBnaXZlcyB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2YgY2FtZWxDYXNpbmcuXG4gICAgUnVsZU9iamVjdEZhY3RvcnkucHJvdG90eXBlLmNyZWF0ZUZyb21CYWNrZW5kRGljdCA9IGZ1bmN0aW9uIChydWxlRGljdCkge1xuICAgICAgICByZXR1cm4gbmV3IFJ1bGUocnVsZURpY3QucnVsZV90eXBlLCBydWxlRGljdC5pbnB1dHMpO1xuICAgIH07XG4gICAgUnVsZU9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgUnVsZU9iamVjdEZhY3RvcnkpO1xuICAgIHJldHVybiBSdWxlT2JqZWN0RmFjdG9yeTtcbn0oKSk7XG5leHBvcnRzLlJ1bGVPYmplY3RGYWN0b3J5ID0gUnVsZU9iamVjdEZhY3Rvcnk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdSdWxlT2JqZWN0RmFjdG9yeScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoUnVsZU9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBTb2x1dGlvblxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9TdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL29iamVjdHMvRnJhY3Rpb25PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vb2JqZWN0cy9OdW1iZXJXaXRoVW5pdHNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRXhwbG9yYXRpb25IdG1sRm9ybWF0dGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTb2x1dGlvbk9iamVjdEZhY3RvcnknLCBbXG4gICAgJyRmaWx0ZXInLCAnRXhwbG9yYXRpb25IdG1sRm9ybWF0dGVyU2VydmljZScsICdGcmFjdGlvbk9iamVjdEZhY3RvcnknLFxuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnTnVtYmVyV2l0aFVuaXRzT2JqZWN0RmFjdG9yeScsXG4gICAgJ1N1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5JyxcbiAgICBmdW5jdGlvbiAoJGZpbHRlciwgRXhwbG9yYXRpb25IdG1sRm9ybWF0dGVyU2VydmljZSwgRnJhY3Rpb25PYmplY3RGYWN0b3J5LCBIdG1sRXNjYXBlclNlcnZpY2UsIE51bWJlcldpdGhVbml0c09iamVjdEZhY3RvcnksIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHZhciBTb2x1dGlvbiA9IGZ1bmN0aW9uIChhbnN3ZXJJc0V4Y2x1c2l2ZSwgY29ycmVjdEFuc3dlciwgZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuYW5zd2VySXNFeGNsdXNpdmUgPSBhbnN3ZXJJc0V4Y2x1c2l2ZTtcbiAgICAgICAgICAgIHRoaXMuY29ycmVjdEFuc3dlciA9IGNvcnJlY3RBbnN3ZXI7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gZXhwbGFuYXRpb247XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJfaXNfZXhjbHVzaXZlOiB0aGlzLmFuc3dlcklzRXhjbHVzaXZlLFxuICAgICAgICAgICAgICAgIGNvcnJlY3RfYW5zd2VyOiB0aGlzLmNvcnJlY3RBbnN3ZXIsXG4gICAgICAgICAgICAgICAgZXhwbGFuYXRpb246IHRoaXMuZXhwbGFuYXRpb24udG9CYWNrZW5kRGljdCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTb2x1dGlvblsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc29sdXRpb25CYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgU29sdXRpb24oc29sdXRpb25CYWNrZW5kRGljdC5hbnN3ZXJfaXNfZXhjbHVzaXZlLCBzb2x1dGlvbkJhY2tlbmREaWN0LmNvcnJlY3RfYW5zd2VyLCBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc29sdXRpb25CYWNrZW5kRGljdC5leHBsYW5hdGlvbikpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTb2x1dGlvblsnY3JlYXRlTmV3J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIGFuc3dlcklzRXhjbHVzaXZlLCBjb3JyZWN0QW5zd2VyLCBleHBsYW5hdGlvbkh0bWwsIGV4cGxhbmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU29sdXRpb24oYW5zd2VySXNFeGNsdXNpdmUsIGNvcnJlY3RBbnN3ZXIsIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5LmNyZWF0ZURlZmF1bHQoZXhwbGFuYXRpb25IdG1sLCBleHBsYW5hdGlvbklkKSk7XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS5nZXRTdW1tYXJ5ID0gZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgIHZhciBzb2x1dGlvblR5cGUgPSAodGhpcy5hbnN3ZXJJc0V4Y2x1c2l2ZSA/ICdUaGUgb25seScgOiAnT25lJyk7XG4gICAgICAgICAgICB2YXIgY29ycmVjdEFuc3dlciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ0dyYXBoSW5wdXQnKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9ICdbR3JhcGhdJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uSWQgPT09ICdNYXRoRXhwcmVzc2lvbklucHV0Jykge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RBbnN3ZXIgPSB0aGlzLmNvcnJlY3RBbnN3ZXIubGF0ZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbklkID09PSAnQ29kZVJlcGwnIHx8XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25JZCA9PT0gJ1BlbmNpbENvZGVFZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9IHRoaXMuY29ycmVjdEFuc3dlci5jb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ011c2ljTm90ZXNJbnB1dCcpIHtcbiAgICAgICAgICAgICAgICBjb3JyZWN0QW5zd2VyID0gJ1tNdXNpYyBOb3Rlc10nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ0xvZ2ljUHJvb2YnKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9IHRoaXMuY29ycmVjdEFuc3dlci5jb3JyZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ0ZyYWN0aW9uSW5wdXQnKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9IEZyYWN0aW9uT2JqZWN0RmFjdG9yeS5mcm9tRGljdCh0aGlzLmNvcnJlY3RBbnN3ZXIpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbklkID09PSAnTnVtYmVyV2l0aFVuaXRzJykge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RBbnN3ZXIgPSBOdW1iZXJXaXRoVW5pdHNPYmplY3RGYWN0b3J5LmZyb21EaWN0KHRoaXMuY29ycmVjdEFuc3dlcikudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RBbnN3ZXIgPSAoSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24odGhpcy5jb3JyZWN0QW5zd2VyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZXhwbGFuYXRpb24gPSAoJGZpbHRlcignY29udmVydFRvUGxhaW5UZXh0JykodGhpcy5leHBsYW5hdGlvbi5nZXRIdG1sKCkpKTtcbiAgICAgICAgICAgIHJldHVybiAoc29sdXRpb25UeXBlICsgJyBzb2x1dGlvbiBpcyBcIicgKyBjb3JyZWN0QW5zd2VyICtcbiAgICAgICAgICAgICAgICAnXCIuICcgKyBleHBsYW5hdGlvbiArICcuJyk7XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS5zZXRDb3JyZWN0QW5zd2VyID0gZnVuY3Rpb24gKGNvcnJlY3RBbnN3ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29ycmVjdEFuc3dlciA9IGNvcnJlY3RBbnN3ZXI7XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS5zZXRFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uIChleHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IGV4cGxhbmF0aW9uO1xuICAgICAgICB9O1xuICAgICAgICBTb2x1dGlvbi5wcm90b3R5cGUuZ2V0T3BwaWFTaG9ydEFuc3dlclJlc3BvbnNlSHRtbCA9IGZ1bmN0aW9uIChpbnRlcmFjdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwcmVmaXg6ICh0aGlzLmFuc3dlcklzRXhjbHVzaXZlID8gJ1RoZSBvbmx5JyA6ICdPbmUnKSxcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IEV4cGxvcmF0aW9uSHRtbEZvcm1hdHRlclNlcnZpY2UuZ2V0U2hvcnRBbnN3ZXJIdG1sKHRoaXMuY29ycmVjdEFuc3dlciwgaW50ZXJhY3Rpb24uaWQsIGludGVyYWN0aW9uLmN1c3RvbWl6YXRpb25BcmdzKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgU29sdXRpb24ucHJvdG90eXBlLmdldE9wcGlhU29sdXRpb25FeHBsYW5hdGlvblJlc3BvbnNlSHRtbCA9XG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwbGFuYXRpb24uZ2V0SHRtbCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIFN0YXRlXG4gKiBkb21haW4gb2JqZWN0cyBnaXZlbiBhIGxpc3Qgb2YgYmFja2VuZCBzdGF0ZSBkaWN0aW9uYXJpZXMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9zdGF0ZS9TdGF0ZU9iamVjdEZhY3RvcnkudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1N0YXRlc09iamVjdEZhY3RvcnknLCBbXG4gICAgJ1N0YXRlT2JqZWN0RmFjdG9yeScsICdJTlRFUkFDVElPTl9TUEVDUycsXG4gICAgZnVuY3Rpb24gKFN0YXRlT2JqZWN0RmFjdG9yeSwgSU5URVJBQ1RJT05fU1BFQ1MpIHtcbiAgICAgICAgdmFyIFN0YXRlcyA9IGZ1bmN0aW9uIChzdGF0ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlcyA9IHN0YXRlcztcbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGVzLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkodGhpcy5fc3RhdGVzW3N0YXRlTmFtZV0pO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKHRqaWFuZzExKTogUmVtb3ZlIGdldFN0YXRlT2JqZWN0cygpIGFuZCByZXBsYWNlIGNhbGxzXG4gICAgICAgIC8vIHdpdGggYW4gb2JqZWN0IHRvIHJlcHJlc2VudCBkYXRhIHRvIGJlIG1hbmlwdWxhdGVkIGluc2lkZVxuICAgICAgICAvLyBFeHBsb3JhdGlvbkRpZmZTZXJ2aWNlLlxuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmdldFN0YXRlT2JqZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkodGhpcy5fc3RhdGVzKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGVzLnByb3RvdHlwZS5hZGRTdGF0ZSA9IGZ1bmN0aW9uIChuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlc1tuZXdTdGF0ZU5hbWVdID0gU3RhdGVPYmplY3RGYWN0b3J5LmNyZWF0ZURlZmF1bHRTdGF0ZShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlTmFtZSwgc3RhdGVEYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZXNbc3RhdGVOYW1lXSA9IGFuZ3VsYXIuY29weShzdGF0ZURhdGEpO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmhhc1N0YXRlID0gZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlcy5oYXNPd25Qcm9wZXJ0eShzdGF0ZU5hbWUpO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmRlbGV0ZVN0YXRlID0gZnVuY3Rpb24gKGRlbGV0ZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N0YXRlc1tkZWxldGVTdGF0ZU5hbWVdO1xuICAgICAgICAgICAgZm9yICh2YXIgb3RoZXJTdGF0ZU5hbWUgaW4gdGhpcy5fc3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gdGhpcy5fc3RhdGVzW290aGVyU3RhdGVOYW1lXS5pbnRlcmFjdGlvbjtcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXBzID0gaW50ZXJhY3Rpb24uYW5zd2VyR3JvdXBzO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChncm91cHNbaV0ub3V0Y29tZS5kZXN0ID09PSBkZWxldGVTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1tpXS5vdXRjb21lLmRlc3QgPSBvdGhlclN0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lLmRlc3QgPT09IGRlbGV0ZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUuZGVzdCA9IG90aGVyU3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLnJlbmFtZVN0YXRlID0gZnVuY3Rpb24gKG9sZFN0YXRlTmFtZSwgbmV3U3RhdGVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZXNbbmV3U3RhdGVOYW1lXSA9IGFuZ3VsYXIuY29weSh0aGlzLl9zdGF0ZXNbb2xkU3RhdGVOYW1lXSk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZXNbbmV3U3RhdGVOYW1lXS5zZXROYW1lKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc3RhdGVzW29sZFN0YXRlTmFtZV07XG4gICAgICAgICAgICBmb3IgKHZhciBvdGhlclN0YXRlTmFtZSBpbiB0aGlzLl9zdGF0ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSB0aGlzLl9zdGF0ZXNbb3RoZXJTdGF0ZU5hbWVdLmludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgIHZhciBncm91cHMgPSBpbnRlcmFjdGlvbi5hbnN3ZXJHcm91cHM7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3Vwc1tpXS5vdXRjb21lLmRlc3QgPT09IG9sZFN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzW2ldLm91dGNvbWUuZGVzdCA9IG5ld1N0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lLmRlc3QgPT09IG9sZFN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUuZGVzdCA9IG5ld1N0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGVzLnByb3RvdHlwZS5nZXRTdGF0ZU5hbWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3N0YXRlcyk7XG4gICAgICAgIH07XG4gICAgICAgIFN0YXRlcy5wcm90b3R5cGUuZ2V0RmluYWxTdGF0ZU5hbWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpbmFsU3RhdGVOYW1lcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHRoaXMuX3N0YXRlcykge1xuICAgICAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbiA9IHRoaXMuX3N0YXRlc1tzdGF0ZU5hbWVdLmludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5pZCAmJiBJTlRFUkFDVElPTl9TUEVDU1tpbnRlcmFjdGlvbi5pZF0uaXNfdGVybWluYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZmluYWxTdGF0ZU5hbWVzLnB1c2goc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmluYWxTdGF0ZU5hbWVzO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmdldEFsbFZvaWNlb3Zlckxhbmd1YWdlQ29kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYWxsQXVkaW9MYW5ndWFnZUNvZGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBzdGF0ZU5hbWUgaW4gdGhpcy5fc3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5fc3RhdGVzW3N0YXRlTmFtZV07XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHNMaXN0ID0gc3RhdGUucmVjb3JkZWRWb2ljZW92ZXJzLmdldEFsbENvbnRlbnRJZCgpO1xuICAgICAgICAgICAgICAgIGNvbnRlbnRJZHNMaXN0LmZvckVhY2goZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXVkaW9MYW5ndWFnZUNvZGVzID0gKHN0YXRlLnJlY29yZGVkVm9pY2VvdmVycy5nZXRWb2ljZW92ZXJMYW5ndWFnZUNvZGVzKGNvbnRlbnRJZCkpO1xuICAgICAgICAgICAgICAgICAgICBhdWRpb0xhbmd1YWdlQ29kZXMuZm9yRWFjaChmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQXVkaW9MYW5ndWFnZUNvZGVzLmluZGV4T2YobGFuZ3VhZ2VDb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxBdWRpb0xhbmd1YWdlQ29kZXMucHVzaChsYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhbGxBdWRpb0xhbmd1YWdlQ29kZXM7XG4gICAgICAgIH07XG4gICAgICAgIFN0YXRlcy5wcm90b3R5cGUuZ2V0QWxsVm9pY2VvdmVycyA9IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBhbGxBdWRpb1RyYW5zbGF0aW9ucyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHRoaXMuX3N0YXRlcykge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuX3N0YXRlc1tzdGF0ZU5hbWVdO1xuICAgICAgICAgICAgICAgIGFsbEF1ZGlvVHJhbnNsYXRpb25zW3N0YXRlTmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudElkc0xpc3QgPSBzdGF0ZS5yZWNvcmRlZFZvaWNlb3ZlcnMuZ2V0QWxsQ29udGVudElkKCk7XG4gICAgICAgICAgICAgICAgY29udGVudElkc0xpc3QuZm9yRWFjaChmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdWRpb1RyYW5zbGF0aW9ucyA9IChzdGF0ZS5yZWNvcmRlZFZvaWNlb3ZlcnMuZ2V0QmluZGFibGVWb2ljZW92ZXJzKGNvbnRlbnRJZCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXVkaW9UcmFuc2xhdGlvbnMuaGFzT3duUHJvcGVydHkobGFuZ3VhZ2VDb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsQXVkaW9UcmFuc2xhdGlvbnNbc3RhdGVOYW1lXS5wdXNoKGF1ZGlvVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWxsQXVkaW9UcmFuc2xhdGlvbnM7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8oYW5raXRhMjQwNzk2KTogUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFN0YXRlc1snY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc3RhdGVzQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgc3RhdGVPYmplY3RzRGljdCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHN0YXRlc0JhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICAgICAgc3RhdGVPYmplY3RzRGljdFtzdGF0ZU5hbWVdID0gU3RhdGVPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzdGF0ZU5hbWUsIHN0YXRlc0JhY2tlbmREaWN0W3N0YXRlTmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZXMoc3RhdGVPYmplY3RzRGljdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdGF0ZXM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2ZcbiAqIFdyaXR0ZW5UcmFuc2xhdGlvbiBkb21haW4gb2JqZWN0cy5cbiAqL1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIFdyaXR0ZW5UcmFuc2xhdGlvbiA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXcml0dGVuVHJhbnNsYXRpb24oaHRtbCwgbmVlZHNVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5odG1sID0gaHRtbDtcbiAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9IG5lZWRzVXBkYXRlO1xuICAgIH1cbiAgICBXcml0dGVuVHJhbnNsYXRpb24ucHJvdG90eXBlLmdldEh0bWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmh0bWw7XG4gICAgfTtcbiAgICBXcml0dGVuVHJhbnNsYXRpb24ucHJvdG90eXBlLnNldEh0bWwgPSBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICB0aGlzLmh0bWwgPSBodG1sO1xuICAgIH07XG4gICAgV3JpdHRlblRyYW5zbGF0aW9uLnByb3RvdHlwZS5tYXJrQXNOZWVkaW5nVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB9O1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbi5wcm90b3R5cGUudG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSAhdGhpcy5uZWVkc1VwZGF0ZTtcbiAgICB9O1xuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgdGhlIHJldHVybiB0eXBlIGlzIGEgZGljdCB3aXRoIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaFxuICAgIC8vIGdpdmVzIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBXcml0dGVuVHJhbnNsYXRpb24ucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBodG1sOiB0aGlzLmh0bWwsXG4gICAgICAgICAgICBuZWVkc191cGRhdGU6IHRoaXMubmVlZHNVcGRhdGVcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHJldHVybiBXcml0dGVuVHJhbnNsYXRpb247XG59KCkpO1xuZXhwb3J0cy5Xcml0dGVuVHJhbnNsYXRpb24gPSBXcml0dGVuVHJhbnNsYXRpb247XG52YXIgV3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5KCkge1xuICAgIH1cbiAgICBXcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVOZXcgPSBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICByZXR1cm4gbmV3IFdyaXR0ZW5UcmFuc2xhdGlvbihodG1sLCBmYWxzZSk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlICd0cmFuc2xhdGlvbkJhY2tlbmREaWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXNcbiAgICAvLyB3aGljaCBnaXZlcyB0c2xpbnQgZXJyb3JzIGFnYWluc3QgdW5kZXJzY29yZV9jYXNpbmcgaW4gZmF2b3Igb2ZcbiAgICAvLyBjYW1lbENhc2luZy5cbiAgICBXcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZERpY3QgPSBmdW5jdGlvbiAodHJhbnNsYXRpb25CYWNrZW5kRGljdCkge1xuICAgICAgICByZXR1cm4gbmV3IFdyaXR0ZW5UcmFuc2xhdGlvbih0cmFuc2xhdGlvbkJhY2tlbmREaWN0Lmh0bWwsIHRyYW5zbGF0aW9uQmFja2VuZERpY3QubmVlZHNfdXBkYXRlKTtcbiAgICB9O1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgV3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeSk7XG4gICAgcmV0dXJuIFdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5Xcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5ID0gV3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1dyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2ZcbiAqIFdyaXR0ZW5UcmFuc2xhdGlvbnMgZG9tYWluIG9iamVjdHMuXG4gKi9cbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBXcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5XzEgPSByZXF1aXJlKFwiZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnlcIik7XG52YXIgV3JpdHRlblRyYW5zbGF0aW9ucyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXcml0dGVuVHJhbnNsYXRpb25zKHRyYW5zbGF0aW9uc01hcHBpbmcsIHdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nID0gdHJhbnNsYXRpb25zTWFwcGluZztcbiAgICAgICAgdGhpcy5fd3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeSA9IHdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3Rvcnk7XG4gICAgfVxuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLmdldEFsbENvbnRlbnRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudHJhbnNsYXRpb25zTWFwcGluZyk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTY1KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGRpY3Qgd2hvc2UgZXhhY3QgdHlwZSBuZWVkcyB0byBiZVxuICAgIC8vIGZvdW5kIGJ5IGRvaW5nIGEgZ29vZCByZXNlYXJjaC5cbiAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5nZXRXcml0dGVuVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAoY29udGVudElkLCBsYW5nQ29kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF1bbGFuZ0NvZGVdO1xuICAgIH07XG4gICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUubWFya0FsbFRyYW5zbGF0aW9uc0FzTmVlZGluZ1VwZGF0ZSA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgdmFyIGxhbmd1YWdlQ29kZVRvV3JpdHRlblRyYW5zbGF0aW9uID0gKHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdKTtcbiAgICAgICAgZm9yICh2YXIgbGFuZ3VhZ2VDb2RlIGluIGxhbmd1YWdlQ29kZVRvV3JpdHRlblRyYW5zbGF0aW9uKSB7XG4gICAgICAgICAgICBsYW5ndWFnZUNvZGVUb1dyaXR0ZW5UcmFuc2xhdGlvbltsYW5ndWFnZUNvZGVdLm1hcmtBc05lZWRpbmdVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUuZ2V0VHJhbnNsYXRpb25zTGFuZ3VhZ2VDb2RlcyA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdKTtcbiAgICB9O1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLmhhc1dyaXR0ZW5UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmdhdWdlQ29kZSkge1xuICAgICAgICBpZiAoIXRoaXMudHJhbnNsYXRpb25zTWFwcGluZy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNsYXRpb25zTGFuZ3VhZ2VDb2Rlcyhjb250ZW50SWQpLmluZGV4T2YobGFuZ2F1Z2VDb2RlKSAhPT0gLTE7XG4gICAgfTtcbiAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5oYXNVbmZsYWdnZWRXcml0dGVuVHJhbnNsYXRpb25zID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICB2YXIgd3JpdHRlblRyYW5zbGF0aW9ucyA9IHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICBmb3IgKHZhciBsYW5ndWFnZUNvZGUgaW4gd3JpdHRlblRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgaWYgKCF3cml0dGVuVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0ubmVlZHNVcGRhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5hZGRDb250ZW50SWQgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmcuaGFzT3duUHJvcGVydHkoY29udGVudElkKSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RyeWluZyB0byBhZGQgZHVwbGljYXRlIGNvbnRlbnQgaWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF0gPSB7fTtcbiAgICB9O1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLmRlbGV0ZUNvbnRlbnRJZCA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmcuaGFzT3duUHJvcGVydHkoY29udGVudElkKSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIHRoZSBnaXZlbiBjb250ZW50IGlkLicpO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXTtcbiAgICB9O1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLmFkZFdyaXR0ZW5UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmd1YWdlQ29kZSwgaHRtbCkge1xuICAgICAgICB2YXIgd3JpdHRlblRyYW5zbGF0aW9ucyA9IHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICBpZiAod3JpdHRlblRyYW5zbGF0aW9ucy5oYXNPd25Qcm9wZXJ0eShsYW5ndWFnZUNvZGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVHJ5aW5nIHRvIGFkZCBkdXBsaWNhdGUgbGFuZ3VhZ2UgY29kZS4nKTtcbiAgICAgICAgfVxuICAgICAgICB3cml0dGVuVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0gPSAodGhpcy5fd3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoaHRtbCkpO1xuICAgIH07XG4gICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUudXBkYXRlV3JpdHRlblRyYW5zbGF0aW9uSHRtbCA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmd1YWdlQ29kZSwgaHRtbCkge1xuICAgICAgICB2YXIgd3JpdHRlblRyYW5zbGF0aW9ucyA9IHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICBpZiAoIXdyaXR0ZW5UcmFuc2xhdGlvbnMuaGFzT3duUHJvcGVydHkobGFuZ3VhZ2VDb2RlKSkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIHRoZSBnaXZlbiBsYW5ndWFnZSBjb2RlLicpO1xuICAgICAgICB9XG4gICAgICAgIHdyaXR0ZW5UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXS5zZXRIdG1sKGh0bWwpO1xuICAgICAgICAvLyBNYXJraW5nIHRyYW5zbGF0aW9uIHVwZGF0ZWQuXG4gICAgICAgIHdyaXR0ZW5UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXS5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgIH07XG4gICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUudG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoY29udGVudElkLCBsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgdmFyIHdyaXR0ZW5UcmFuc2xhdGlvbnMgPSB0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXTtcbiAgICAgICAgd3JpdHRlblRyYW5zbGF0aW9uc1tsYW5ndWFnZUNvZGVdLnRvZ2dsZU5lZWRzVXBkYXRlQXR0cmlidXRlKCk7XG4gICAgfTtcbiAgICAvLyBUT0RPKCM3MTc2KTogUmVwbGFjZSAnYW55JyB3aXRoIHRoZSBleGFjdCB0eXBlLiBUaGlzIGhhcyBiZWVuIGtlcHQgYXNcbiAgICAvLyAnYW55JyBiZWNhdXNlIHRoZSByZXR1cm4gdHlwZSBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkIGtleXMgd2hpY2hcbiAgICAvLyBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZiBjYW1lbENhc2luZy5cbiAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdHJhbnNsYXRpb25zTWFwcGluZ0RpY3QgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgY29udGVudElkIGluIHRoaXMudHJhbnNsYXRpb25zTWFwcGluZykge1xuICAgICAgICAgICAgdmFyIGxhbmdhdWdlVG9Xcml0dGVuVHJhbnNsYXRpb24gPSB0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXTtcbiAgICAgICAgICAgIHZhciBsYW5nYXVnZVRvV3JpdHRlblRyYW5zbGF0aW9uRGljdCA9IHt9O1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobGFuZ2F1Z2VUb1dyaXR0ZW5UcmFuc2xhdGlvbikuZm9yRWFjaChmdW5jdGlvbiAobGFuZykge1xuICAgICAgICAgICAgICAgIGxhbmdhdWdlVG9Xcml0dGVuVHJhbnNsYXRpb25EaWN0W2xhbmddID0gKGxhbmdhdWdlVG9Xcml0dGVuVHJhbnNsYXRpb25bbGFuZ10udG9CYWNrZW5kRGljdCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdHJhbnNsYXRpb25zTWFwcGluZ0RpY3RbY29udGVudElkXSA9IGxhbmdhdWdlVG9Xcml0dGVuVHJhbnNsYXRpb25EaWN0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHRyYW5zbGF0aW9uc19tYXBwaW5nOiB0cmFuc2xhdGlvbnNNYXBwaW5nRGljdCB9O1xuICAgIH07XG4gICAgcmV0dXJuIFdyaXR0ZW5UcmFuc2xhdGlvbnM7XG59KCkpO1xuZXhwb3J0cy5Xcml0dGVuVHJhbnNsYXRpb25zID0gV3JpdHRlblRyYW5zbGF0aW9ucztcbnZhciBXcml0dGVuVHJhbnNsYXRpb25zT2JqZWN0RmFjdG9yeSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXcml0dGVuVHJhbnNsYXRpb25zT2JqZWN0RmFjdG9yeSh3cml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMud3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeSA9IHdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3Rvcnk7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ3dyaXR0ZW5UcmFuc2xhdGlvbnNEaWN0JyBpcyBhIGRpY3Qgd2l0aCB1bmRlcnNjb3JlX2Nhc2VkXG4gICAgLy8ga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpbiBmYXZvciBvZlxuICAgIC8vIGNhbWVsQ2FzaW5nLlxuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVGcm9tQmFja2VuZERpY3QgPSBmdW5jdGlvbiAod3JpdHRlblRyYW5zbGF0aW9uc0RpY3QpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9uc01hcHBpbmcgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMod3JpdHRlblRyYW5zbGF0aW9uc0RpY3QudHJhbnNsYXRpb25zX21hcHBpbmcpLmZvckVhY2goZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgdHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdID0ge307XG4gICAgICAgICAgICB2YXIgbGFuZ3VhZ2VDb2RlVG9Xcml0dGVuVHJhbnNsYXRpb25EaWN0ID0gKHdyaXR0ZW5UcmFuc2xhdGlvbnNEaWN0LnRyYW5zbGF0aW9uc19tYXBwaW5nW2NvbnRlbnRJZF0pO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobGFuZ3VhZ2VDb2RlVG9Xcml0dGVuVHJhbnNsYXRpb25EaWN0KS5mb3JFYWNoKGZ1bmN0aW9uIChsYW5nQ29kZSkge1xuICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXVtsYW5nQ29kZV0gPSAoX3RoaXMud3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QobGFuZ3VhZ2VDb2RlVG9Xcml0dGVuVHJhbnNsYXRpb25EaWN0W2xhbmdDb2RlXSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3IFdyaXR0ZW5UcmFuc2xhdGlvbnModHJhbnNsYXRpb25zTWFwcGluZywgdGhpcy53cml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5KTtcbiAgICB9O1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnByb3RvdHlwZS5jcmVhdGVFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBXcml0dGVuVHJhbnNsYXRpb25zKHt9LCB0aGlzLndyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkpO1xuICAgIH07XG4gICAgdmFyIF9hO1xuICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5ID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KSxcbiAgICAgICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFt0eXBlb2YgKF9hID0gdHlwZW9mIFdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnlfMS5Xcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5ICE9PSBcInVuZGVmaW5lZFwiICYmIFdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnlfMS5Xcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5KSA9PT0gXCJmdW5jdGlvblwiID8gX2EgOiBPYmplY3RdKVxuICAgIF0sIFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5KTtcbiAgICByZXR1cm4gV3JpdHRlblRyYW5zbGF0aW9uc09iamVjdEZhY3Rvcnk7XG59KCkpO1xuZXhwb3J0cy5Xcml0dGVuVHJhbnNsYXRpb25zT2JqZWN0RmFjdG9yeSA9IFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5O1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnV3JpdHRlblRyYW5zbGF0aW9uc09iamVjdEZhY3RvcnknLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5KSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgU3RhdGVcbiAqIGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL0ludGVyYWN0aW9uT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL1BhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9TdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdTdGF0ZU9iamVjdEZhY3RvcnknLCBbXG4gICAgJ0ludGVyYWN0aW9uT2JqZWN0RmFjdG9yeScsICdQYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5JyxcbiAgICAnUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeScsICdTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeScsXG4gICAgJ1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5JywgJ05FV19TVEFURV9URU1QTEFURScsIGZ1bmN0aW9uIChJbnRlcmFjdGlvbk9iamVjdEZhY3RvcnksIFBhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnksIFJlY29yZGVkVm9pY2VvdmVyc09iamVjdEZhY3RvcnksIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5LCBXcml0dGVuVHJhbnNsYXRpb25zT2JqZWN0RmFjdG9yeSwgTkVXX1NUQVRFX1RFTVBMQVRFKSB7XG4gICAgICAgIHZhciBTdGF0ZSA9IGZ1bmN0aW9uIChuYW1lLCBjbGFzc2lmaWVyTW9kZWxJZCwgY29udGVudCwgaW50ZXJhY3Rpb24sIHBhcmFtQ2hhbmdlcywgcmVjb3JkZWRWb2ljZW92ZXJzLCBzb2xpY2l0QW5zd2VyRGV0YWlscywgd3JpdHRlblRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NpZmllck1vZGVsSWQgPSBjbGFzc2lmaWVyTW9kZWxJZDtcbiAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uID0gaW50ZXJhY3Rpb247XG4gICAgICAgICAgICB0aGlzLnBhcmFtQ2hhbmdlcyA9IHBhcmFtQ2hhbmdlcztcbiAgICAgICAgICAgIHRoaXMucmVjb3JkZWRWb2ljZW92ZXJzID0gcmVjb3JkZWRWb2ljZW92ZXJzO1xuICAgICAgICAgICAgdGhpcy5zb2xpY2l0QW5zd2VyRGV0YWlscyA9IHNvbGljaXRBbnN3ZXJEZXRhaWxzO1xuICAgICAgICAgICAgdGhpcy53cml0dGVuVHJhbnNsYXRpb25zID0gd3JpdHRlblRyYW5zbGF0aW9ucztcbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGUucHJvdG90eXBlLnNldE5hbWUgPSBmdW5jdGlvbiAobmV3TmFtZSkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmV3TmFtZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gSW5zdGFuY2UgbWV0aG9kcy5cbiAgICAgICAgU3RhdGUucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHRoaXMuY29udGVudC50b0JhY2tlbmREaWN0KCksXG4gICAgICAgICAgICAgICAgY2xhc3NpZmllcl9tb2RlbF9pZDogdGhpcy5jbGFzc2lmaWVyTW9kZWxJZCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbjogdGhpcy5pbnRlcmFjdGlvbi50b0JhY2tlbmREaWN0KCksXG4gICAgICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogdGhpcy5wYXJhbUNoYW5nZXMubWFwKGZ1bmN0aW9uIChwYXJhbUNoYW5nZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1DaGFuZ2UudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIHJlY29yZGVkX3ZvaWNlb3ZlcnM6IHRoaXMucmVjb3JkZWRWb2ljZW92ZXJzLnRvQmFja2VuZERpY3QoKSxcbiAgICAgICAgICAgICAgICBzb2xpY2l0X2Fuc3dlcl9kZXRhaWxzOiB0aGlzLnNvbGljaXRBbnN3ZXJEZXRhaWxzLFxuICAgICAgICAgICAgICAgIHdyaXR0ZW5fdHJhbnNsYXRpb25zOiB0aGlzLndyaXR0ZW5UcmFuc2xhdGlvbnMudG9CYWNrZW5kRGljdCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChvdGhlclN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBvdGhlclN0YXRlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmNsYXNzaWZpZXJNb2RlbElkID0gb3RoZXJTdGF0ZS5jbGFzc2lmaWVyTW9kZWxJZDtcbiAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGFuZ3VsYXIuY29weShvdGhlclN0YXRlLmNvbnRlbnQpO1xuICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5jb3B5KG90aGVyU3RhdGUuaW50ZXJhY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5wYXJhbUNoYW5nZXMgPSBhbmd1bGFyLmNvcHkob3RoZXJTdGF0ZS5wYXJhbUNoYW5nZXMpO1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRlZFZvaWNlb3ZlcnMgPSBhbmd1bGFyLmNvcHkob3RoZXJTdGF0ZS5yZWNvcmRlZFZvaWNlb3ZlcnMpO1xuICAgICAgICAgICAgdGhpcy5zb2xpY2l0QW5zd2VyRGV0YWlscyA9IGFuZ3VsYXIuY29weShvdGhlclN0YXRlLnNvbGljaXRBbnN3ZXJEZXRhaWxzKTtcbiAgICAgICAgICAgIHRoaXMud3JpdHRlblRyYW5zbGF0aW9ucyA9IGFuZ3VsYXIuY29weShvdGhlclN0YXRlLndyaXR0ZW5UcmFuc2xhdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKGFua2l0YTI0MDc5Nik6IFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTdGF0ZVsnY3JlYXRlRGVmYXVsdFN0YXRlJ10gPSBmdW5jdGlvbiAobmV3U3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgdmFyIG5ld1N0YXRlVGVtcGxhdGUgPSBhbmd1bGFyLmNvcHkoTkVXX1NUQVRFX1RFTVBMQVRFKTtcbiAgICAgICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMuY3JlYXRlRnJvbUJhY2tlbmREaWN0KG5ld1N0YXRlTmFtZSwge1xuICAgICAgICAgICAgICAgIGNsYXNzaWZpZXJfbW9kZWxfaWQ6IG5ld1N0YXRlVGVtcGxhdGUuY2xhc3NpZmllcl9tb2RlbF9pZCxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBuZXdTdGF0ZVRlbXBsYXRlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb246IG5ld1N0YXRlVGVtcGxhdGUuaW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogbmV3U3RhdGVUZW1wbGF0ZS5wYXJhbV9jaGFuZ2VzLFxuICAgICAgICAgICAgICAgIHJlY29yZGVkX3ZvaWNlb3ZlcnM6IG5ld1N0YXRlVGVtcGxhdGUucmVjb3JkZWRfdm9pY2VvdmVycyxcbiAgICAgICAgICAgICAgICBzb2xpY2l0X2Fuc3dlcl9kZXRhaWxzOiBuZXdTdGF0ZVRlbXBsYXRlLnNvbGljaXRfYW5zd2VyX2RldGFpbHMsXG4gICAgICAgICAgICAgICAgd3JpdHRlbl90cmFuc2xhdGlvbnM6IG5ld1N0YXRlVGVtcGxhdGUud3JpdHRlbl90cmFuc2xhdGlvbnNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbmV3U3RhdGUuaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUuZGVzdCA9IG5ld1N0YXRlTmFtZTtcbiAgICAgICAgICAgIHJldHVybiBuZXdTdGF0ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU3RhdGljIGNsYXNzIG1ldGhvZHMuIE5vdGUgdGhhdCBcInRoaXNcIiBpcyBub3QgYXZhaWxhYmxlIGluXG4gICAgICAgIC8vIHN0YXRpYyBjb250ZXh0cy5cbiAgICAgICAgLy8gVE9ETyhhbmtpdGEyNDA3OTYpOiBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgU3RhdGVbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKHN0YXRlTmFtZSwgc3RhdGVEaWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZShzdGF0ZU5hbWUsIHN0YXRlRGljdC5jbGFzc2lmaWVyX21vZGVsX2lkLCBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc3RhdGVEaWN0LmNvbnRlbnQpLCBJbnRlcmFjdGlvbk9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHN0YXRlRGljdC5pbnRlcmFjdGlvbiksIFBhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmRMaXN0KHN0YXRlRGljdC5wYXJhbV9jaGFuZ2VzKSwgUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc3RhdGVEaWN0LnJlY29yZGVkX3ZvaWNlb3ZlcnMpLCBzdGF0ZURpY3Quc29saWNpdF9hbnN3ZXJfZGV0YWlscywgV3JpdHRlblRyYW5zbGF0aW9uc09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHN0YXRlRGljdC53cml0dGVuX3RyYW5zbGF0aW9ucykpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gU3RhdGU7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgZXhwbG9yYXRpb24gc3VtbWFyaWVzXG4gKiBmcm9tIHRoZSBiYWNrZW5kLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9WYWxpZGF0b3JzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZEFwaVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ0FsZXJ0c1NlcnZpY2UnLFxuICAgICdWYWxpZGF0b3JzU2VydmljZScsICdFWFBMT1JBVElPTl9TVU1NQVJZX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBBbGVydHNTZXJ2aWNlLCBWYWxpZGF0b3JzU2VydmljZSwgRVhQTE9SQVRJT05fU1VNTUFSWV9EQVRBX1VSTF9URU1QTEFURSkge1xuICAgICAgICB2YXIgX2ZldGNoRXhwU3VtbWFyaWVzID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWRzLCBpbmNsdWRlUHJpdmF0ZUV4cGxvcmF0aW9ucywgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoIWV4cGxvcmF0aW9uSWRzLmV2ZXJ5KFZhbGlkYXRvcnNTZXJ2aWNlLmlzVmFsaWRFeHBsb3JhdGlvbklkKSkge1xuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnUGxlYXNlIGVudGVyIGEgdmFsaWQgZXhwbG9yYXRpb24gSUQuJyk7XG4gICAgICAgICAgICAgICAgdmFyIHJldHVyblZhbHVlID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHBsb3JhdGlvbklkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZS5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShyZXR1cm5WYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25TdW1tYXJ5RGF0YVVybCA9IEVYUExPUkFUSU9OX1NVTU1BUllfREFUQV9VUkxfVEVNUExBVEU7XG4gICAgICAgICAgICAkaHR0cC5nZXQoZXhwbG9yYXRpb25TdW1tYXJ5RGF0YVVybCwge1xuICAgICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdpZmllZF9leHBfaWRzOiBKU09OLnN0cmluZ2lmeShleHBsb3JhdGlvbklkcyksXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVfcHJpdmF0ZV9leHBsb3JhdGlvbnM6IEpTT04uc3RyaW5naWZ5KGluY2x1ZGVQcml2YXRlRXhwbG9yYXRpb25zKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1bW1hcmllcyA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLnN1bW1hcmllcyk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyaWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3VtbWFyaWVzRXJyb3IgPSAoJ1N1bW1hcmllcyBmZXRjaGVkIGFyZSBudWxsIGZvciBleHBsb3JhdGlvbklkczogJyArIGV4cGxvcmF0aW9uSWRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzdW1tYXJpZXNFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHN1bW1hcmllcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEZldGNoZXMgYSBsaXN0IG9mIHB1YmxpYyBleHBsb3JhdGlvbiBzdW1tYXJpZXMgYW5kIHByaXZhdGVcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIHN1bW1hcmllcyBmb3Igd2hpY2ggdGhlIGN1cnJlbnQgdXNlciBoYXMgYWNjZXNzIGZyb20gdGhlXG4gICAgICAgICAgICAgKiBiYWNrZW5kIGZvciBlYWNoIGV4cGxvcmF0aW9uIElEIHByb3ZpZGVkLiBUaGUgcHJvdmlkZWQgbGlzdCBvZlxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gc3VtbWFyaWVzIGFyZSBpbiB0aGUgc2FtZSBvcmRlciBhcyBpbnB1dCBleHBsb3JhdGlvbiBJRHNcbiAgICAgICAgICAgICAqIGxpc3QsIHRob3VnaCBzb21lIG1heSBiZSBtaXNzaW5nIChpZiB0aGUgZXhwbG9yYXRpb24gZG9lc24ndCBleGlzdCBvclxuICAgICAgICAgICAgICogb3IgdGhlIHVzZXIgZG9lcyBub3QgaGF2ZSBhY2Nlc3MgdG8gaXQpLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkUHVibGljQW5kUHJpdmF0ZUV4cGxvcmF0aW9uU3VtbWFyaWVzOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hFeHBTdW1tYXJpZXMoZXhwbG9yYXRpb25JZHMsIHRydWUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENhbWVsQ2FzZVRvSHlwaGVucyBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5maWx0ZXIoJ2NhbWVsQ2FzZVRvSHlwaGVucycsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBpbnB1dC5yZXBsYWNlKC8oW2Etel0pPyhbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHRbMF0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udmVydFRvUGxhaW5UZXh0IGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZpbHRlcignY29udmVydFRvUGxhaW5UZXh0JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdmFyIHN0cmlwcGVkVGV4dCA9IGlucHV0LnJlcGxhY2UoLyg8KFtePl0rKT4pL2lnLCAnJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJm5ic3A7L2lnLCAnICcpO1xuICAgICAgICAgICAgc3RyaXBwZWRUZXh0ID0gc3RyaXBwZWRUZXh0LnJlcGxhY2UoLyZxdW90Oy9pZywgJycpO1xuICAgICAgICAgICAgdmFyIHRyaW1tZWRUZXh0ID0gc3RyaXBwZWRUZXh0LnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkVGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyaXBwZWRUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWRUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTm9ybWFsaXplV2hpdGVzcGFjZSBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5yZXF1aXJlKCdzZXJ2aWNlcy9VdGlsc1NlcnZpY2UudHMnKTtcbi8vIEZpbHRlciB0aGF0IHJlbW92ZXMgd2hpdGVzcGFjZSBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIGVuZCBvZiBhIHN0cmluZywgYW5kXG4vLyByZXBsYWNlcyBpbnRlcmlvciB3aGl0ZXNwYWNlIHdpdGggYSBzaW5nbGUgc3BhY2UgY2hhcmFjdGVyLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmlsdGVyKCdub3JtYWxpemVXaGl0ZXNwYWNlJywgW1xuICAgICdVdGlsc1NlcnZpY2UnLCBmdW5jdGlvbiAoVXRpbHNTZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIGlmIChVdGlsc1NlcnZpY2UuaXNTdHJpbmcoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHdoaXRlc3BhY2UgZnJvbSB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgdGhlIHN0cmluZywgYW5kXG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBpbnRlcmlvciB3aGl0ZXNwYWNlIHdpdGggYSBzaW5nbGUgc3BhY2UgY2hhcmFjdGVyLlxuICAgICAgICAgICAgICAgIGlucHV0ID0gaW5wdXQudHJpbSgpO1xuICAgICAgICAgICAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvXFxzezIsfS9nLCAnICcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29uc3RhbnRzIGZvciB0aGUgY29sbGVjdGlvbiBlZGl0b3IgcGFnZS5cbiAqL1xuLy8gVE9ETygjNzA5Mik6IERlbGV0ZSB0aGlzIGZpbGUgb25jZSBtaWdyYXRpb24gaXMgY29tcGxldGUgYW5kIHRoZXNlIEFuZ3VsYXJKU1xuLy8gZXF1aXZhbGVudHMgb2YgdGhlIEFuZ3VsYXIgY29uc3RhbnRzIGFyZSBubyBsb25nZXIgbmVlZGVkLlxudmFyIGNvbGxlY3Rpb25fZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9jb2xsZWN0aW9uLWVkaXRvci1wYWdlLmNvbnN0YW50c1wiKTtcbi8vIFRPRE8oYmhlbm5pbmcpOiBUaGVzZSBjb25zdGFudHMgc2hvdWxkIGJlIHByb3ZpZGVkIGJ5IHRoZSBiYWNrZW5kLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VESVRBQkxFX0NPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUnLCBjb2xsZWN0aW9uX2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLkNvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzLkVESVRBQkxFX0NPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fUklHSFRTX1VSTF9URU1QTEFURScsIGNvbGxlY3Rpb25fZWRpdG9yX3BhZ2VfY29uc3RhbnRzXzEuQ29sbGVjdGlvbkVkaXRvclBhZ2VDb25zdGFudHMuQ09MTEVDVElPTl9SSUdIVFNfVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX1RJVExFX0lOUFVUX0ZPQ1VTX0xBQkVMJywgY29sbGVjdGlvbl9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5Db2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cy5DT0xMRUNUSU9OX1RJVExFX0lOUFVUX0ZPQ1VTX0xBQkVMKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTRUFSQ0hfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFJywgY29sbGVjdGlvbl9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5Db2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cy5TRUFSQ0hfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEJywgY29sbGVjdGlvbl9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5Db2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdFVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRUQnLCBjb2xsZWN0aW9uX2VkaXRvcl9wYWdlX2NvbnN0YW50c18xLkNvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzLkVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnN0YW50cyBmb3IgdGhlIGNvbGxlY3Rpb24gZWRpdG9yIHBhZ2UuXG4gKi9cbi8vIFRPRE8oYmhlbm5pbmcpOiBUaGVzZSBjb25zdGFudHMgc2hvdWxkIGJlIHByb3ZpZGVkIGJ5IHRoZSBiYWNrZW5kLlxudmFyIENvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzKCkge1xuICAgIH1cbiAgICBDb2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cy5FRElUQUJMRV9DT0xMRUNUSU9OX0RBVEFfVVJMX1RFTVBMQVRFID0gJy9jb2xsZWN0aW9uX2VkaXRvcl9oYW5kbGVyL2RhdGEvPGNvbGxlY3Rpb25faWQ+JztcbiAgICBDb2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cy5DT0xMRUNUSU9OX1JJR0hUU19VUkxfVEVNUExBVEUgPSAnL2NvbGxlY3Rpb25fZWRpdG9yX2hhbmRsZXIvcmlnaHRzLzxjb2xsZWN0aW9uX2lkPic7XG4gICAgQ29sbGVjdGlvbkVkaXRvclBhZ2VDb25zdGFudHMuQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCA9ICdjb2xsZWN0aW9uVGl0bGVJbnB1dEZvY3VzTGFiZWwnO1xuICAgIENvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzLlNFQVJDSF9FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUgPSAnL2V4cGxvcmF0aW9uL21ldGFkYXRhX3NlYXJjaD9xPTxxdWVyeT4nO1xuICAgIENvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzLkVWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQgPSAnY29sbGVjdGlvbkluaXRpYWxpemVkJztcbiAgICBDb2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cy5FVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRUQgPSAnY29sbGVjdGlvblJlaW5pdGlhbGl6ZWQnO1xuICAgIHJldHVybiBDb2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50cztcbn0oKSk7XG5leHBvcnRzLkNvbGxlY3Rpb25FZGl0b3JQYWdlQ29uc3RhbnRzID0gQ29sbGVjdGlvbkVkaXRvclBhZ2VDb25zdGFudHM7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFByaW1hcnkgZGlyZWN0aXZlIGZvciB0aGUgY29sbGVjdGlvbiBlZGl0b3IgcGFnZS5cbiAqL1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL2NvbGxlY3Rpb24tZWRpdG9yLXRhYi5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvaGlzdG9yeS10YWIvJyArXG4gICAgJ2NvbGxlY3Rpb24taGlzdG9yeS10YWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NldHRpbmdzLXRhYi8nICtcbiAgICAnY29sbGVjdGlvbi1zZXR0aW5ncy10YWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3N0YXRpc3RpY3MtdGFiLycgK1xuICAgICdjb2xsZWN0aW9uLXN0YXRpc3RpY3MtdGFiLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9jb2xsZWN0aW9uLWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9QYWdlVGl0bGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS5jb25zdGFudHMuYWpzLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9pbnRlcmFjdGlvbi1zcGVjcy5jb25zdGFudHMuYWpzLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25FZGl0b3JQYWdlJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9jb2xsZWN0aW9uLWVkaXRvci1wYWdlLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICdDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlJywgJ1BhZ2VUaXRsZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdSb3V0ZXJTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgJ0VWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgUGFnZVRpdGxlU2VydmljZSwgUm91dGVyU2VydmljZSwgVXJsU2VydmljZSwgRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCwgRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVEKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRBY3RpdmVUYWJOYW1lID0gUm91dGVyU2VydmljZS5nZXRBY3RpdmVUYWJOYW1lO1xuICAgICAgICAgICAgICAgICAgICAvLyBMb2FkIHRoZSBjb2xsZWN0aW9uIHRvIGJlIGVkaXRlZC5cbiAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5sb2FkQ29sbGVjdGlvbihVcmxTZXJ2aWNlLmdldENvbGxlY3Rpb25JZEZyb21FZGl0b3JVcmwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aXRsZSA9IChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKS5nZXRUaXRsZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBhZ2VUaXRsZVNlcnZpY2Uuc2V0UGFnZVRpdGxlKHRpdGxlICsgJyAtIE9wcGlhIEVkaXRvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUGFnZVRpdGxlU2VydmljZS5zZXRQYWdlVGl0bGUoJ1VudGl0bGVkIENvbGxlY3Rpb24gLSBPcHBpYSBFZGl0b3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVELCBzZXRUaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVELCBzZXRUaXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBjb2xsZWN0aW9uIGVkaXRvciBwYWdlLlxuICovXG5yZXF1aXJlKFwiY29yZS1qcy9lczcvcmVmbGVjdFwiKTtcbnJlcXVpcmUoXCJ6b25lLmpzXCIpO1xudmFyIGNvcmVfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb3JlXCIpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCIpO1xudmFyIHN0YXRpY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3VwZ3JhZGUvc3RhdGljXCIpO1xudmFyIGh0dHBfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci9jb21tb24vaHR0cFwiKTtcbi8vIFRoaXMgY29tcG9uZW50IGlzIG5lZWRlZCB0byBmb3JjZS1ib290c3RyYXAgQW5ndWxhciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuLy8gYXBwLlxudmFyIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCgpIHtcbiAgICB9XG4gICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuQ29tcG9uZW50KHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnc2VydmljZS1ib290c3RyYXAnLFxuICAgICAgICAgICAgdGVtcGxhdGU6ICcnXG4gICAgICAgIH0pXG4gICAgXSwgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudCk7XG4gICAgcmV0dXJuIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnQ7XG59KCkpO1xuZXhwb3J0cy5TZXJ2aWNlQm9vdHN0cmFwQ29tcG9uZW50ID0gU2VydmljZUJvb3RzdHJhcENvbXBvbmVudDtcbnZhciBhcHBfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiYXBwLmNvbnN0YW50c1wiKTtcbnZhciBjb2xsZWN0aW9uX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vY29sbGVjdGlvbi9jb2xsZWN0aW9uLWRvbWFpbi5jb25zdGFudHNcIik7XG52YXIgZWRpdG9yX2RvbWFpbl9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJkb21haW4vZWRpdG9yL2VkaXRvci1kb21haW4uY29uc3RhbnRzXCIpO1xudmFyIGludGVyYWN0aW9uc19leHRlbnNpb25fY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiaW50ZXJhY3Rpb25zL2ludGVyYWN0aW9ucy1leHRlbnNpb24uY29uc3RhbnRzXCIpO1xudmFyIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xID0gcmVxdWlyZShcImRvbWFpbi9vYmplY3RzL29iamVjdHMtZG9tYWluLmNvbnN0YW50c1wiKTtcbnZhciBzZXJ2aWNlc19jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJzZXJ2aWNlcy9zZXJ2aWNlcy5jb25zdGFudHNcIik7XG52YXIgY29sbGVjdGlvbl9lZGl0b3JfcGFnZV9jb25zdGFudHNfMSA9IHJlcXVpcmUoXCJwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UuY29uc3RhbnRzXCIpO1xudmFyIENvbGxlY3Rpb25FZGl0b3JQYWdlTW9kdWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbGxlY3Rpb25FZGl0b3JQYWdlTW9kdWxlKCkge1xuICAgIH1cbiAgICAvLyBFbXB0eSBwbGFjZWhvbGRlciBtZXRob2QgdG8gc2F0aXNmeSB0aGUgYENvbXBpbGVyYC5cbiAgICBDb2xsZWN0aW9uRWRpdG9yUGFnZU1vZHVsZS5wcm90b3R5cGUubmdEb0Jvb3RzdHJhcCA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICBDb2xsZWN0aW9uRWRpdG9yUGFnZU1vZHVsZSA9IF9fZGVjb3JhdGUoW1xuICAgICAgICBjb3JlXzEuTmdNb2R1bGUoe1xuICAgICAgICAgICAgaW1wb3J0czogW1xuICAgICAgICAgICAgICAgIHBsYXRmb3JtX2Jyb3dzZXJfMS5Ccm93c2VyTW9kdWxlLFxuICAgICAgICAgICAgICAgIGh0dHBfMS5IdHRwQ2xpZW50TW9kdWxlXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgICAgICAgICAgU2VydmljZUJvb3RzdHJhcENvbXBvbmVudFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGVudHJ5Q29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgIFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICBhcHBfY29uc3RhbnRzXzEuQXBwQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25fZG9tYWluX2NvbnN0YW50c18xLkNvbGxlY3Rpb25Eb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICAgICAgZWRpdG9yX2RvbWFpbl9jb25zdGFudHNfMS5FZGl0b3JEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25zX2V4dGVuc2lvbl9jb25zdGFudHNfMS5JbnRlcmFjdGlvbnNFeHRlbnNpb25zQ29uc3RhbnRzLFxuICAgICAgICAgICAgICAgIG9iamVjdHNfZG9tYWluX2NvbnN0YW50c18xLk9iamVjdHNEb21haW5Db25zdGFudHMsXG4gICAgICAgICAgICAgICAgc2VydmljZXNfY29uc3RhbnRzXzEuU2VydmljZXNDb25zdGFudHMsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbl9lZGl0b3JfcGFnZV9jb25zdGFudHNfMS5Db2xsZWN0aW9uRWRpdG9yUGFnZUNvbnN0YW50c1xuICAgICAgICAgICAgXVxuICAgICAgICB9KVxuICAgIF0sIENvbGxlY3Rpb25FZGl0b3JQYWdlTW9kdWxlKTtcbiAgICByZXR1cm4gQ29sbGVjdGlvbkVkaXRvclBhZ2VNb2R1bGU7XG59KCkpO1xudmFyIHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xID0gcmVxdWlyZShcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pY1wiKTtcbnZhciBzdGF0aWNfMiA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBib290c3RyYXBGbiA9IGZ1bmN0aW9uIChleHRyYVByb3ZpZGVycykge1xuICAgIHZhciBwbGF0Zm9ybVJlZiA9IHBsYXRmb3JtX2Jyb3dzZXJfZHluYW1pY18xLnBsYXRmb3JtQnJvd3NlckR5bmFtaWMoZXh0cmFQcm92aWRlcnMpO1xuICAgIHJldHVybiBwbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGUoQ29sbGVjdGlvbkVkaXRvclBhZ2VNb2R1bGUpO1xufTtcbnZhciBkb3duZ3JhZGVkTW9kdWxlID0gc3RhdGljXzIuZG93bmdyYWRlTW9kdWxlKGJvb3RzdHJhcEZuKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScsIFtcbiAgICAnZG5kTGlzdHMnLCAnaGVhZHJvb20nLCAnaW5maW5pdGUtc2Nyb2xsJywgJ25nQW5pbWF0ZScsXG4gICAgJ25nQXVkaW8nLCAnbmdDb29raWVzJywgJ25nSW1nQ3JvcCcsICduZ0pveVJpZGUnLCAnbmdNYXRlcmlhbCcsXG4gICAgJ25nUmVzb3VyY2UnLCAnbmdTYW5pdGl6ZScsICduZ1RvdWNoJywgJ3Bhc2NhbHByZWNodC50cmFuc2xhdGUnLFxuICAgICd0b2FzdHInLCAndWkuYm9vdHN0cmFwJywgJ3VpLnNvcnRhYmxlJywgJ3VpLnRyZWUnLCAndWkudmFsaWRhdGUnLFxuICAgIGRvd25ncmFkZWRNb2R1bGVcbl0pXG4gICAgLy8gVGhpcyBkaXJlY3RpdmUgaXMgdGhlIGRvd25ncmFkZWQgdmVyc2lvbiBvZiB0aGUgQW5ndWxhciBjb21wb25lbnQgdG9cbiAgICAvLyBib290c3RyYXAgdGhlIEFuZ3VsYXIgOC5cbiAgICAuZGlyZWN0aXZlKCdzZXJ2aWNlQm9vdHN0cmFwJywgc3RhdGljXzEuZG93bmdyYWRlQ29tcG9uZW50KHtcbiAgICBjb21wb25lbnQ6IFNlcnZpY2VCb290c3RyYXBDb21wb25lbnRcbn0pKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlcyByZXF1aXJlZCBpbiBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xuLy8gVGhlIG1vZHVsZSBuZWVkcyB0byBiZSBsb2FkZWQgYmVmb3JlIGV2ZXJ5dGhpbmcgZWxzZSBzaW5jZSBpdCBkZWZpbmVzIHRoZVxuLy8gbWFpbiBtb2R1bGUgdGhlIGVsZW1lbnRzIGFyZSBhdHRhY2hlZCB0by5cbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS5tb2R1bGUudHMnKTtcbnJlcXVpcmUoJ0FwcC50cycpO1xucmVxdWlyZSgnYmFzZV9jb21wb25lbnRzL0Jhc2VDb250ZW50RGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL25hdmJhci8nICtcbiAgICAnY29sbGVjdGlvbi1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL25hdmJhci8nICtcbiAgICAnY29sbGVjdGlvbi1lZGl0b3ItbmF2YmFyLmRpcmVjdGl2ZS50cycpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgbWFpbiB0YWIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2VkaXRvci10YWIvJyArXG4gICAgJ2NvbGxlY3Rpb24tbm9kZS1jcmVhdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiLycgK1xuICAgICdjb2xsZWN0aW9uLW5vZGUtZWRpdG9yLmRpcmVjdGl2ZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9jb2xsZWN0aW9uLWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2NvbGxlY3Rpb24tbGluZWFyaXplci5zZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25FZGl0b3JUYWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2VkaXRvci10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tZWRpdG9yLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlJywgJ0NvbGxlY3Rpb25MaW5lYXJpemVyU2VydmljZScsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UsIENvbGxlY3Rpb25MaW5lYXJpemVyU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaGFzTG9hZGVkQ29sbGVjdGlvbiA9IChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmhhc0xvYWRlZENvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJucyBhIGxpc3Qgb2YgY29sbGVjdGlvbiBub2RlcyB3aGljaCByZXByZXNlbnRzIGEgdmFsaWQgbGluZWFyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBhdGggdGhyb3VnaCB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRMaW5lYXJseVNvcnRlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UuZ2V0Q29sbGVjdGlvbk5vZGVzSW5QbGF5YWJsZU9yZGVyKGN0cmwuY29sbGVjdGlvbikpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciBjcmVhdGluZyBhIG5ldyBjb2xsZWN0aW9uIG5vZGUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25Ob2RlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL1NlYXJjaEV4cGxvcmF0aW9uc0JhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vc3VtbWFyeS9FeHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL25vcm1hbGl6ZS13aGl0ZXNwYWNlLmZpbHRlci50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9jb2xsZWN0aW9uLWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2NvbGxlY3Rpb24tbGluZWFyaXplci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVmFsaWRhdG9yc1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnY29sbGVjdGlvbk5vZGVDcmVhdG9yJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uLW5vZGUtY3JlYXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckaHR0cCcsICckd2luZG93JywgJyRmaWx0ZXInLCAnQWxlcnRzU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ1ZhbGlkYXRvcnNTZXJ2aWNlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLCAnQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uTm9kZU9iamVjdEZhY3RvcnknLCAnRXhwbG9yYXRpb25TdW1tYXJ5QmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdTZWFyY2hFeHBsb3JhdGlvbnNCYWNrZW5kQXBpU2VydmljZScsICdTaXRlQW5hbHl0aWNzU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0lOVkFMSURfTkFNRV9DSEFSUycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRodHRwLCAkd2luZG93LCAkZmlsdGVyLCBBbGVydHNTZXJ2aWNlLCBWYWxpZGF0b3JzU2VydmljZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlLCBDb2xsZWN0aW9uVXBkYXRlU2VydmljZSwgQ29sbGVjdGlvbk5vZGVPYmplY3RGYWN0b3J5LCBFeHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kQXBpU2VydmljZSwgU2VhcmNoRXhwbG9yYXRpb25zQmFja2VuZEFwaVNlcnZpY2UsIFNpdGVBbmFseXRpY3NTZXJ2aWNlLCBJTlZBTElEX05BTUVfQ0hBUlMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5uZXdFeHBsb3JhdGlvbklkID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubmV3RXhwbG9yYXRpb25UaXRsZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNlYXJjaFF1ZXJ5SGFzRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIENSRUFURV9ORVdfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFID0gJy9jcmVhdGUvPGV4cGxvcmF0aW9uX2lkPic7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBGZXRjaGVzIGEgbGlzdCBvZiBleHBsb3JhdGlvbiBtZXRhZGF0YSBkaWN0cyBmcm9tIGJhY2tlbmQsIGdpdmVuXG4gICAgICAgICAgICAgICAgICAgICAqIGEgc2VhcmNoIHF1ZXJ5LiBJdCB0aGVuIGV4dHJhY3RzIHRoZSB0aXRsZSBhbmQgaWQgb2YgdGhlXG4gICAgICAgICAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIHRvIHByZXBhcmUgdHlwZWFoZWFkIG9wdGlvbnMuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmZldGNoVHlwZWFoZWFkUmVzdWx0cyA9IGZ1bmN0aW9uIChzZWFyY2hRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzVmFsaWRTZWFyY2hRdWVyeShzZWFyY2hRdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnNlYXJjaFF1ZXJ5SGFzRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gU2VhcmNoRXhwbG9yYXRpb25zQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hFeHBsb3JhdGlvbnMoc2VhcmNoUXVlcnkpLnRoZW4oZnVuY3Rpb24gKGV4cGxvcmF0aW9uTWV0YWRhdGFCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbk1ldGFkYXRhQmFja2VuZERpY3QuY29sbGVjdGlvbl9ub2RlX21ldGFkYXRhX2xpc3QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC5jb2xsZWN0aW9uLmNvbnRhaW5zQ29sbGVjdGlvbk5vZGUoaXRlbS5pZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnB1c2goaXRlbS50aXRsZSArICcgKCcgKyBpdGVtLmlkICsgJyknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdUaGVyZSB3YXMgYW4gZXJyb3Igd2hlbiBzZWFyY2hpbmcgZm9yIG1hdGNoaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2V4cGxvcmF0aW9ucy4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2VhcmNoUXVlcnlIYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc1ZhbGlkU2VhcmNoUXVlcnkgPSBmdW5jdGlvbiAoc2VhcmNoUXVlcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbG93IHVuZGVyc2NvcmVzIGJlY2F1c2UgdGhleSBhcmUgYWxsb3dlZCBpbiBleHBsb3JhdGlvbiBJRHMuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgSU5WQUxJRF9TRUFSQ0hfQ0hBUlMgPSAoSU5WQUxJRF9OQU1FX0NIQVJTLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtICE9PSAnXyc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IElOVkFMSURfU0VBUkNIX0NIQVJTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaFF1ZXJ5LmluZGV4T2YoSU5WQUxJRF9TRUFSQ0hfQ0hBUlNbaV0pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBhZGRFeHBsb3JhdGlvblRvQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChuZXdFeHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld0V4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0Nhbm5vdCBhZGQgYW4gZW1wdHkgZXhwbG9yYXRpb24gSUQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuY29sbGVjdGlvbi5jb250YWluc0NvbGxlY3Rpb25Ob2RlKG5ld0V4cGxvcmF0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdUaGVyZSBpcyBhbHJlYWR5IGFuIGV4cGxvcmF0aW9uIGluIHRoaXMgY29sbGVjdGlvbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3dpdGggdGhhdCBpZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvblN1bW1hcnlCYWNrZW5kQXBpU2VydmljZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5sb2FkUHVibGljQW5kUHJpdmF0ZUV4cGxvcmF0aW9uU3VtbWFyaWVzKFtuZXdFeHBsb3JhdGlvbklkXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoc3VtbWFyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1hcnlCYWNrZW5kT2JqZWN0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyaWVzLmxlbmd0aCAhPT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJpZXNbMF0uaWQgPT09IG5ld0V4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeUJhY2tlbmRPYmplY3QgPSBzdW1tYXJpZXNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5QmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UuYXBwZW5kQ29sbGVjdGlvbk5vZGUoY3RybC5jb2xsZWN0aW9uLCBuZXdFeHBsb3JhdGlvbklkLCBzdW1tYXJ5QmFja2VuZE9iamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoYXQgZXhwbG9yYXRpb24gZG9lcyBub3QgZXhpc3Qgb3IgeW91IGRvIG5vdCBoYXZlIGVkaXQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYWNjZXNzIHRvIGl0LicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGlsZSBhZGRpbmcgYW4gZXhwbG9yYXRpb24gdG8gdGhlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udmVydFR5cGVhaGVhZFRvRXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uICh0eXBlYWhlYWRPcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaFJlc3VsdHMgPSB0eXBlYWhlYWRPcHRpb24ubWF0Y2goL1xcKCguKj8pXFwpJC8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoUmVzdWx0cyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0eXBlYWhlYWRPcHRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hSZXN1bHRzWzFdO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGVzIGEgbmV3IGV4cGxvcmF0aW9uLCB0aGVuIGFkZHMgaXQgdG8gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY3JlYXRlTmV3RXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGl0bGUgPSAkZmlsdGVyKCdub3JtYWxpemVXaGl0ZXNwYWNlJykoY3RybC5uZXdFeHBsb3JhdGlvblRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghVmFsaWRhdG9yc1NlcnZpY2UuaXNWYWxpZEV4cGxvcmF0aW9uVGl0bGUodGl0bGUsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGV4cGxvcmF0aW9uIHdpdGggdGhlIGdpdmVuIHRpdGxlLlxuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAucG9zdCgnL2NvbnRyaWJ1dGVoYW5kbGVyL2NyZWF0ZV9uZXcnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubmV3RXhwbG9yYXRpb25UaXRsZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdFeHBsb3JhdGlvbklkID0gcmVzcG9uc2UuZGF0YS5leHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQobmV3RXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkRXhwbG9yYXRpb25Ub0NvbGxlY3Rpb24obmV3RXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2tzIHdoZXRoZXIgdGhlIHVzZXIgaGFzIGxlZnQgYSAnIycgYXQgdGhlIGVuZCBvZiB0aGVpciBJRFxuICAgICAgICAgICAgICAgICAgICAvLyBieSBhY2NpZGVudCAod2hpY2ggY2FuIGhhcHBlbiBpZiBpdCdzIGJlaW5nIGNvcHkvcGFzdGVkIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIGVkaXRvciBwYWdlLlxuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTWFsZm9ybWVkSWQgPSBmdW5jdGlvbiAodHlwZWRFeHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVkRXhwbG9yYXRpb25JZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVkRXhwbG9yYXRpb25JZC5sYXN0SW5kZXhPZignIycpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlZEV4cGxvcmF0aW9uSWQubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuYWRkRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRFeHBsb3JhdGlvblRvQ29sbGVjdGlvbihjb252ZXJ0VHlwZWFoZWFkVG9FeHBsb3JhdGlvbklkKGN0cmwubmV3RXhwbG9yYXRpb25JZCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5uZXdFeHBsb3JhdGlvbklkID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGRpc3BsYXlpbmcgYW5kIGVkaXRpbmcgYSBjb2xsZWN0aW9uIG5vZGUuIFRoaXNcbiAqIGRpcmVjdGl2ZSBhbGxvd3MgY3JlYXRvcnMgdG8gc2hpZnQgbm9kZXMgdG8gbGVmdCBvciByaWdodFxuICogYW5kIGFsc28gZGVsZXRlIHRoZSBjb2xsZWN0aW9uIG5vZGUgcmVwcmVzZW50ZWQgYnkgdGhpcyBkaXJlY3RpdmUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2NvbGxlY3Rpb24tZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvY29sbGVjdGlvbi1saW5lYXJpemVyLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnY29sbGVjdGlvbk5vZGVFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge1xuICAgICAgICAgICAgICAgIGdldENvbGxlY3Rpb25Ob2RlOiAnJmNvbGxlY3Rpb25Ob2RlJyxcbiAgICAgICAgICAgICAgICBnZXRMaW5lYXJJbmRleDogJyZsaW5lYXJJbmRleCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2VkaXRvci10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tbm9kZS1lZGl0b3IuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZScsICdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uVXBkYXRlU2VydmljZScsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlLCBDb2xsZWN0aW9uVXBkYXRlU2VydmljZSwgQWxlcnRzU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvbiA9IENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAvLyBEZWxldGVzIHRoaXMgY29sbGVjdGlvbiBub2RlIGZyb20gdGhlIGZyb250ZW5kIGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0IGFuZCBhbHNvIHVwZGF0ZXMgdGhlIGNoYW5nZWxpc3QuXG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZGVsZXRlTm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHBsb3JhdGlvbklkID0gY3RybC5nZXRDb2xsZWN0aW9uTm9kZSgpLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghQ29sbGVjdGlvbkxpbmVhcml6ZXJTZXJ2aWNlLnJlbW92ZUNvbGxlY3Rpb25Ob2RlKGN0cmwuY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnSW50ZXJuYWwgY29sbGVjdGlvbiBlZGl0b3IgZXJyb3IuIENvdWxkIG5vdCBkZWxldGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdleHBsb3JhdGlvbiBieSBJRDogJyArIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBTaGlmdHMgdGhpcyBjb2xsZWN0aW9uIG5vZGUgbGVmdCBpbiB0aGUgbGluZWFyaXplZCBsaXN0IG9mIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uLCBpZiBwb3NzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgY3RybC5zaGlmdE5vZGVMZWZ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uSWQgPSBjdHJsLmdldENvbGxlY3Rpb25Ob2RlKCkuZ2V0RXhwbG9yYXRpb25JZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2Uuc2hpZnROb2RlTGVmdChjdHJsLmNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0ludGVybmFsIGNvbGxlY3Rpb24gZWRpdG9yIGVycm9yLiBDb3VsZCBub3Qgc2hpZnQgbm9kZSBsZWZ0ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd2l0aCBJRDogJyArIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBTaGlmdHMgdGhpcyBjb2xsZWN0aW9uIG5vZGUgcmlnaHQgaW4gdGhlIGxpbmVhcml6ZWQgbGlzdCBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbiwgaWYgcG9zc2libGUuXG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hpZnROb2RlUmlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IGN0cmwuZ2V0Q29sbGVjdGlvbk5vZGUoKS5nZXRFeHBsb3JhdGlvbklkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUNvbGxlY3Rpb25MaW5lYXJpemVyU2VydmljZS5zaGlmdE5vZGVSaWdodChjdHJsLmNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0ludGVybmFsIGNvbGxlY3Rpb24gZWRpdG9yIGVycm9yLiBDb3VsZCBub3Qgc2hpZnQgbm9kZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3JpZ2h0IHdpdGggSUQ6ICcgKyBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBoaXN0b3J5IHRhYiBvZiB0aGUgY29sbGVjdGlvbiBlZGl0b3IuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnY29sbGVjdGlvbkhpc3RvcnlUYWInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2hpc3RvcnktdGFiLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uLWhpc3RvcnktdGFiLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbZnVuY3Rpb24gKCkgeyB9XVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgbmF2YmFyIGJyZWFkY3J1bWIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2NvbGxlY3Rpb24tZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL3JvdXRlci5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9zdGF0ZWZ1bC9Gb2N1c01hbmFnZXJTZXJ2aWNlLnRzJyk7XG4vLyBUT0RPKGJoZW5uaW5nKTogQWZ0ZXIgdGhlIG5hdmJhciBpcyBtb3ZlZCB0byBhIGRpcmVjdGl2ZSwgdGhpcyBkaXJlY3RpdmVcbi8vIHNob3VsZCBiZSB1cGRhdGVkIHRvIHNheSAnTG9hZGluZy4uLicgaWYgdGhlIGNvbGxlY3Rpb24gZWRpdG9yJ3MgY29udHJvbGxlclxuLy8gaXMgbm90IHlldCBmaW5pc2hlZCBsb2FkaW5nIHRoZSBjb2xsZWN0aW9uLiBBbHNvLCB0aGlzIGRpcmVjdGl2ZSBzaG91bGRcbi8vIHN1cHBvcnQgYm90aCBkaXNwbGF5aW5nIHRoZSBjdXJyZW50IHRpdGxlIG9mIHRoZSBjb2xsZWN0aW9uIChvciB1bnRpdGxlZCBpZlxuLy8gaXQgZG9lcyBub3QgeWV0IGhhdmUgb25lKSBvciBzZXR0aW5nIGEgbmV3IHRpdGxlIGluIHRoZSBjYXNlIG9mIGFuIHVudGl0bGVkXG4vLyBjb2xsZWN0aW9uLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjb2xsZWN0aW9uRWRpdG9yTmF2YmFyQnJlYWRjcnVtYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvbmF2YmFyLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uLWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICdSb3V0ZXJTZXJ2aWNlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdGb2N1c01hbmFnZXJTZXJ2aWNlJywgJ0NPTExFQ1RJT05fVElUTEVfSU5QVVRfRk9DVVNfTEFCRUwnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChSb3V0ZXJTZXJ2aWNlLCBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLCBGb2N1c01hbmFnZXJTZXJ2aWNlLCBDT0xMRUNUSU9OX1RJVExFX0lOUFVUX0ZPQ1VTX0xBQkVMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9UQUJfTkFNRVNfVE9fSFVNQU5fUkVBREFCTEVfTkFNRVMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluOiAnRWRpdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3OiAnUHJldmlldycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nczogJ1NldHRpbmdzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzOiAnU3RhdGlzdGljcycsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbXByb3ZlbWVudHM6ICdJbXByb3ZlbWVudHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGlzdG9yeTogJ0hpc3RvcnknLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRDdXJyZW50VGFiTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfVEFCX05BTUVTX1RPX0hVTUFOX1JFQURBQkxFX05BTUVTW1JvdXRlclNlcnZpY2UuZ2V0QWN0aXZlVGFiTmFtZSgpXTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5lZGl0Q29sbGVjdGlvblRpdGxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm91dGVyU2VydmljZS5uYXZpZ2F0ZVRvU2V0dGluZ3NUYWIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEZvY3VzTWFuYWdlclNlcnZpY2Uuc2V0Rm9jdXMoQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL3NlbGVjdDItZHJvcGRvd24uZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9jb21tb24tZWxlbWVudHMvJyArXG4gICAgJ2xvYWRpbmctZG90cy5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25SaWdodHNCYWNrZW5kQXBpU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9jb2xsZWN0aW9uLWVkaXRvci1zdGF0ZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9yb3V0ZXIuc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25FZGl0b3JOYXZiYXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL25hdmJhci8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1lZGl0b3ItbmF2YmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWwnLCAnQWxlcnRzU2VydmljZScsICdSb3V0ZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnVW5kb1JlZG9TZXJ2aWNlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdFZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZScsICdVcmxTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCcsICdFVkVOVF9DT0xMRUNUSU9OX1JFSU5JVElBTElaRUQnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBSb3V0ZXJTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UsIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZSwgQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLCBFZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZSwgVXJsU2VydmljZSwgRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCwgRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVELCBFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvbklkID0gVXJsU2VydmljZS5nZXRDb2xsZWN0aW9uSWRGcm9tRWRpdG9yVXJsKCk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvbiA9IENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0Q29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25SaWdodHMgPSAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5nZXRDb2xsZWN0aW9uUmlnaHRzKCkpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTG9hZGluZ0NvbGxlY3Rpb24gPSAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5pc0xvYWRpbmdDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC52YWxpZGF0aW9uSXNzdWVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTYXZlSW5Qcm9ncmVzcyA9IChDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmlzU2F2aW5nQ29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0QWN0aXZlVGFiTmFtZSA9IFJvdXRlclNlcnZpY2UuZ2V0QWN0aXZlVGFiTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZWxlY3RNYWluVGFiID0gUm91dGVyU2VydmljZS5uYXZpZ2F0ZVRvTWFpblRhYjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZWxlY3RQcmV2aWV3VGFiID0gUm91dGVyU2VydmljZS5uYXZpZ2F0ZVRvUHJldmlld1RhYjtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5zZWxlY3RTZXR0aW5nc1RhYiA9IFJvdXRlclNlcnZpY2UubmF2aWdhdGVUb1NldHRpbmdzVGFiO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNlbGVjdFN0YXRzVGFiID0gUm91dGVyU2VydmljZS5uYXZpZ2F0ZVRvU3RhdHNUYWI7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2VsZWN0SGlzdG9yeVRhYiA9IFJvdXRlclNlcnZpY2UubmF2aWdhdGVUb0hpc3RvcnlUYWI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfdmFsaWRhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuY29sbGVjdGlvblJpZ2h0cy5pc1ByaXZhdGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudmFsaWRhdGlvbklzc3VlcyA9IChDb2xsZWN0aW9uVmFsaWRhdGlvblNlcnZpY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmRWYWxpZGF0aW9uSXNzdWVzRm9yUHJpdmF0ZUNvbGxlY3Rpb24oY3RybC5jb2xsZWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnZhbGlkYXRpb25Jc3N1ZXMgPSAoQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kVmFsaWRhdGlvbklzc3Vlc0ZvclB1YmxpY0NvbGxlY3Rpb24oY3RybC5jb2xsZWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBfcHVibGlzaENvbGxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKGJoZW5uaW5nKTogVGhpcyBhbHNvIG5lZWRzIGEgY29uZmlybWF0aW9uIG9mIGRlc3RydWN0aXZlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhY3Rpb24gc2luY2UgaXQgaXMgbm90IHJldmVyc2libGUuXG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uUmlnaHRzQmFja2VuZEFwaVNlcnZpY2Uuc2V0Q29sbGVjdGlvblB1YmxpYyhjdHJsLmNvbGxlY3Rpb25JZCwgY3RybC5jb2xsZWN0aW9uLmdldFZlcnNpb24oKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jb2xsZWN0aW9uUmlnaHRzLnNldFB1YmxpYygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2Uuc2V0Q29sbGVjdGlvblJpZ2h0cyhjdHJsLmNvbGxlY3Rpb25SaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCwgX3ZhbGlkYXRlQ29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS4kb24oRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVELCBfdmFsaWRhdGVDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCwgX3ZhbGlkYXRlQ29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ2V0V2FybmluZ3NDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHJsLnZhbGlkYXRpb25Jc3N1ZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldENoYW5nZUxpc3RDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBVbmRvUmVkb1NlcnZpY2UuZ2V0Q2hhbmdlQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0NvbGxlY3Rpb25TYXZlYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoY3RybC5nZXRDaGFuZ2VMaXN0Q291bnQoKSA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnZhbGlkYXRpb25Jc3N1ZXMubGVuZ3RoID09PSAwKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc0NvbGxlY3Rpb25QdWJsaXNoYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoY3RybC5jb2xsZWN0aW9uUmlnaHRzLmlzUHJpdmF0ZSgpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRDaGFuZ2VMaXN0Q291bnQoKSA9PT0gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudmFsaWRhdGlvbklzc3Vlcy5sZW5ndGggPT09IDApO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnNhdmVDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzUHJpdmF0ZSA9IGN0cmwuY29sbGVjdGlvblJpZ2h0cy5pc1ByaXZhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UvdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1lZGl0b3Itc2F2ZS1tb2RhbC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNDb2xsZWN0aW9uUHJpdmF0ZSA9IGlzUHJpdmF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKGNvbW1pdE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShjb21taXRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbiAoY29tbWl0TWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2Uuc2F2ZUNvbGxlY3Rpb24oY29tbWl0TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5wdWJsaXNoQ29sbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRpdGlvbmFsTWV0YWRhdGFOZWVkZWQgPSAoIWN0cmwuY29sbGVjdGlvbi5nZXRUaXRsZSgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIWN0cmwuY29sbGVjdGlvbi5nZXRPYmplY3RpdmUoKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICFjdHJsLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkaXRpb25hbE1ldGFkYXRhTmVlZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS90ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1lZGl0b3ItcHJlLXB1Ymxpc2gtbW9kYWwuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyR1aWJNb2RhbEluc3RhbmNlJywgJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlJywgJ0FMTF9DQVRFR09SSUVTJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkdWliTW9kYWxJbnN0YW5jZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UsIEFMTF9DQVRFR09SSUVTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xsZWN0aW9uID0gKENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuZ2V0Q29sbGVjdGlvbigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnJlcXVpcmVUaXRsZVRvQmVTcGVjaWZpZWQgPSAhY29sbGVjdGlvbi5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucmVxdWlyZU9iamVjdGl2ZVRvQmVTcGVjaWZpZWQgPSAoIWNvbGxlY3Rpb24uZ2V0T2JqZWN0aXZlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwucmVxdWlyZUNhdGVnb3J5VG9CZVNwZWNpZmllZCA9ICghY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm5ld1RpdGxlID0gY29sbGVjdGlvbi5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubmV3T2JqZWN0aXZlID0gY29sbGVjdGlvbi5nZXRPYmplY3RpdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm5ld0NhdGVnb3J5ID0gY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuQ0FURUdPUllfTElTVF9GT1JfU0VMRUNUMiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQUxMX0NBVEVHT1JJRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5DQVRFR09SWV9MSVNUX0ZPUl9TRUxFQ1QyLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IEFMTF9DQVRFR09SSUVTW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogQUxMX0NBVEVHT1JJRVNbaV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNTYXZpbmdBbGxvd2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQm9vbGVhbihjdHJsLm5ld1RpdGxlICYmIGN0cmwubmV3T2JqZWN0aXZlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm5ld0NhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2F2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsLm5ld1RpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1BsZWFzZSBzcGVjaWZ5IGEgdGl0bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwubmV3T2JqZWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1BsZWFzZSBzcGVjaWZ5IGFuIG9iamVjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC5uZXdDYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2Ugc3BlY2lmeSBhIGNhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVjb3JkIGFueSBmaWVsZHMgdGhhdCBoYXZlIGNoYW5nZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZXRhZGF0YUxpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwubmV3VGl0bGUgIT09IGNvbGxlY3Rpb24uZ2V0VGl0bGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGFMaXN0LnB1c2goJ3RpdGxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uVGl0bGUoY29sbGVjdGlvbiwgY3RybC5uZXdUaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwubmV3T2JqZWN0aXZlICE9PSBjb2xsZWN0aW9uLmdldE9iamVjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YUxpc3QucHVzaCgnb2JqZWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uT2JqZWN0aXZlKGNvbGxlY3Rpb24sIGN0cmwubmV3T2JqZWN0aXZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3RybC5uZXdDYXRlZ29yeSAhPT0gY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YUxpc3QucHVzaCgnY2F0ZWdvcnknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25DYXRlZ29yeShjb2xsZWN0aW9uLCBjdHJsLm5ld0NhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShtZXRhZGF0YUxpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAobWV0YWRhdGFMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb21taXRNZXNzYWdlID0gKCdBZGQgbWV0YWRhdGE6ICcgKyBtZXRhZGF0YUxpc3Quam9pbignLCAnKSArICcuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2Uuc2F2ZUNvbGxlY3Rpb24oY29tbWl0TWVzc2FnZSwgX3B1Ymxpc2hDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9wdWJsaXNoQ29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBVbnB1Ymxpc2ggdGhlIGNvbGxlY3Rpb24uIFdpbGwgb25seSBzaG93IHVwIGlmIHRoZSBjb2xsZWN0aW9uIGlzXG4gICAgICAgICAgICAgICAgICAgIC8vIHB1YmxpYyBhbmQgdGhlIHVzZXIgaGFzIGFjY2VzcyB0byB0aGUgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgY3RybC51bnB1Ymxpc2hDb2xsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLnNldENvbGxlY3Rpb25Qcml2YXRlKGN0cmwuY29sbGVjdGlvbklkLCBjdHJsLmNvbGxlY3Rpb24uZ2V0VmVyc2lvbigpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb25SaWdodHMuc2V0UHJpdmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2Uuc2V0Q29sbGVjdGlvblJpZ2h0cyhjdHJsLmNvbGxlY3Rpb25SaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnVGhlcmUgd2FzIGFuIGVycm9yIHdoZW4gdW5wdWJsaXNoaW5nIHRoZSBjb2xsZWN0aW9uLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIG1haW50YWluIHRoZSBzdGF0ZSBvZiBhIHNpbmdsZSBjb2xsZWN0aW9uIHNoYXJlZFxuICogdGhyb3VnaG91dCB0aGUgY29sbGVjdGlvbiBlZGl0b3IuIFRoaXMgc2VydmljZSBwcm92aWRlcyBmdW5jdGlvbmFsaXR5IGZvclxuICogcmV0cmlldmluZyB0aGUgY29sbGVjdGlvbiwgc2F2aW5nIGl0LCBhbmQgbGlzdGVuaW5nIGZvciBjaGFuZ2VzLlxuICovXG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL1VuZG9SZWRvU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9jb2xsZWN0aW9uLWVkaXRvci1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0NvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UnLCBbXG4gICAgJyRyb290U2NvcGUnLCAnQWxlcnRzU2VydmljZScsICdDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeScsXG4gICAgJ0NvbGxlY3Rpb25SaWdodHNCYWNrZW5kQXBpU2VydmljZScsICdDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeScsXG4gICAgJ0VkaXRhYmxlQ29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJywgJ1VuZG9SZWRvU2VydmljZScsXG4gICAgJ0VWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQnLCAnRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVEJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQWxlcnRzU2VydmljZSwgQ29sbGVjdGlvbk9iamVjdEZhY3RvcnksIENvbGxlY3Rpb25SaWdodHNCYWNrZW5kQXBpU2VydmljZSwgQ29sbGVjdGlvblJpZ2h0c09iamVjdEZhY3RvcnksIEVkaXRhYmxlQ29sbGVjdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLCBVbmRvUmVkb1NlcnZpY2UsIEVWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQsIEVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCkge1xuICAgICAgICB2YXIgX2NvbGxlY3Rpb24gPSBDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVFbXB0eUNvbGxlY3Rpb24oKTtcbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uUmlnaHRzID0gKENvbGxlY3Rpb25SaWdodHNPYmplY3RGYWN0b3J5LmNyZWF0ZUVtcHR5Q29sbGVjdGlvblJpZ2h0cygpKTtcbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uSXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgICB2YXIgX2NvbGxlY3Rpb25Jc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgdmFyIF9jb2xsZWN0aW9uSXNCZWluZ1NhdmVkID0gZmFsc2U7XG4gICAgICAgIHZhciBfc2V0Q29sbGVjdGlvbiA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICBfY29sbGVjdGlvbi5jb3B5RnJvbUNvbGxlY3Rpb24oY29sbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAoX2NvbGxlY3Rpb25Jc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCk7XG4gICAgICAgICAgICAgICAgX2NvbGxlY3Rpb25Jc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24gKG5ld0JhY2tlbmRDb2xsZWN0aW9uT2JqZWN0KSB7XG4gICAgICAgICAgICBfc2V0Q29sbGVjdGlvbihDb2xsZWN0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGUobmV3QmFja2VuZENvbGxlY3Rpb25PYmplY3QpKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9zZXRDb2xsZWN0aW9uUmlnaHRzID0gZnVuY3Rpb24gKGNvbGxlY3Rpb25SaWdodHMpIHtcbiAgICAgICAgICAgIF9jb2xsZWN0aW9uUmlnaHRzLmNvcHlGcm9tQ29sbGVjdGlvblJpZ2h0cyhjb2xsZWN0aW9uUmlnaHRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVDb2xsZWN0aW9uUmlnaHRzID0gZnVuY3Rpb24gKG5ld0JhY2tlbmRDb2xsZWN0aW9uUmlnaHRzT2JqZWN0KSB7XG4gICAgICAgICAgICBfc2V0Q29sbGVjdGlvblJpZ2h0cyhDb2xsZWN0aW9uUmlnaHRzT2JqZWN0RmFjdG9yeS5jcmVhdGUobmV3QmFja2VuZENvbGxlY3Rpb25SaWdodHNPYmplY3QpKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogTG9hZHMsIG9yIHJlbG9hZHMsIHRoZSBjb2xsZWN0aW9uIHN0b3JlZCBieSB0aGlzIHNlcnZpY2UgZ2l2ZW4gYVxuICAgICAgICAgICAgICogc3BlY2lmaWVkIGNvbGxlY3Rpb24gSUQuIFNlZSBzZXRDb2xsZWN0aW9uKCkgZm9yIG1vcmUgaW5mb3JtYXRpb24gb25cbiAgICAgICAgICAgICAqIGFkZGl0aW9uYWwgYmVoYXZpb3Igb2YgdGhpcyBmdW5jdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9hZENvbGxlY3Rpb246IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfY29sbGVjdGlvbklzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgRWRpdGFibGVDb2xsZWN0aW9uQmFja2VuZEFwaVNlcnZpY2UuZmV0Y2hDb2xsZWN0aW9uKGNvbGxlY3Rpb25JZCkudGhlbihmdW5jdGlvbiAobmV3QmFja2VuZENvbGxlY3Rpb25PYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZUNvbGxlY3Rpb24obmV3QmFja2VuZENvbGxlY3Rpb25PYmplY3QpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoZXJyb3IgfHwgJ1RoZXJlIHdhcyBhbiBlcnJvciB3aGVuIGxvYWRpbmcgdGhlIGNvbGxlY3Rpb24uJyk7XG4gICAgICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgQ29sbGVjdGlvblJpZ2h0c0JhY2tlbmRBcGlTZXJ2aWNlLmZldGNoQ29sbGVjdGlvblJpZ2h0cyhjb2xsZWN0aW9uSWQpLnRoZW4oZnVuY3Rpb24gKG5ld0JhY2tlbmRDb2xsZWN0aW9uUmlnaHRzT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF91cGRhdGVDb2xsZWN0aW9uUmlnaHRzKG5ld0JhY2tlbmRDb2xsZWN0aW9uUmlnaHRzT2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgX2NvbGxlY3Rpb25Jc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKGVycm9yIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGFuIGVycm9yIHdoZW4gbG9hZGluZyB0aGUgY29sbGVjdGlvbiByaWdodHMuJyk7XG4gICAgICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzZXJ2aWNlIGlzIGN1cnJlbnRseSBhdHRlbXB0aW5nIHRvIGxvYWQgdGhlXG4gICAgICAgICAgICAgKiBjb2xsZWN0aW9uIG1haW50YWluZWQgYnkgdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0xvYWRpbmdDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uSXNMb2FkaW5nO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB3aGV0aGVyIGEgY29sbGVjdGlvbiBoYXMgeWV0IGJlZW4gbG9hZGVkIHVzaW5nIGVpdGhlclxuICAgICAgICAgICAgICogbG9hZENvbGxlY3Rpb24oKSBvciBzZXRDb2xsZWN0aW9uKCkuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGhhc0xvYWRlZENvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2NvbGxlY3Rpb25Jc0luaXRpYWxpemVkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBjb2xsZWN0aW9uIHRvIGJlIHNoYXJlZCBhbW9uZyB0aGUgY29sbGVjdGlvblxuICAgICAgICAgICAgICogZWRpdG9yLiBQbGVhc2Ugbm90ZSBhbnkgY2hhbmdlcyB0byB0aGlzIGNvbGxlY3Rpb24gd2lsbCBiZSBwcm9wb2dhdGVkXG4gICAgICAgICAgICAgKiB0byBhbGwgYmluZGluZ3MgdG8gaXQuIFRoaXMgY29sbGVjdGlvbiBvYmplY3Qgd2lsbCBiZSByZXRhaW5lZCBmb3IgdGhlXG4gICAgICAgICAgICAgKiBsaWZldGltZSBvZiB0aGUgZWRpdG9yLiBUaGlzIGZ1bmN0aW9uIG5ldmVyIHJldHVybnMgbnVsbCwgdGhvdWdoIGl0IG1heVxuICAgICAgICAgICAgICogcmV0dXJuIGFuIGVtcHR5IGNvbGxlY3Rpb24gb2JqZWN0IGlmIHRoZSBjb2xsZWN0aW9uIGhhcyBub3QgeWV0IGJlZW5cbiAgICAgICAgICAgICAqIGxvYWRlZCBmb3IgdGhpcyBlZGl0b3IgaW5zdGFuY2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldENvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2NvbGxlY3Rpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24gcmlnaHRzIHRvIGJlIHNoYXJlZCBhbW9uZyB0aGUgY29sbGVjdGlvblxuICAgICAgICAgICAgICogZWRpdG9yLiBQbGVhc2Ugbm90ZSBhbnkgY2hhbmdlcyB0byB0aGlzIGNvbGxlY3Rpb24gcmlnaHRzIHdpbGwgYmVcbiAgICAgICAgICAgICAqIHByb3BvZ2F0ZWQgdG8gYWxsIGJpbmRpbmdzIHRvIGl0LiBUaGlzIGNvbGxlY3Rpb24gcmlnaHRzIG9iamVjdCB3aWxsXG4gICAgICAgICAgICAgKiBiZSByZXRhaW5lZCBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBlZGl0b3IuIFRoaXMgZnVuY3Rpb24gbmV2ZXIgcmV0dXJuc1xuICAgICAgICAgICAgICogbnVsbCwgdGhvdWdoIGl0IG1heSByZXR1cm4gYW4gZW1wdHkgY29sbGVjdGlvbiByaWdodHMgb2JqZWN0IGlmIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiByaWdodHMgaGFzIG5vdCB5ZXQgYmVlbiBsb2FkZWQgZm9yIHRoaXMgZWRpdG9yIGluc3RhbmNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRDb2xsZWN0aW9uUmlnaHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb2xsZWN0aW9uUmlnaHRzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0cyB0aGUgY29sbGVjdGlvbiBzdG9yZWQgd2l0aGluIHRoaXMgc2VydmljZSwgcHJvcG9nYXRpbmcgY2hhbmdlcyB0b1xuICAgICAgICAgICAgICogYWxsIGJpbmRpbmdzIHRvIHRoZSBjb2xsZWN0aW9uIHJldHVybmVkIGJ5IGdldENvbGxlY3Rpb24oKS4gVGhlIGZpcnN0XG4gICAgICAgICAgICAgKiB0aW1lIHRoaXMgaXMgY2FsbGVkIGl0IHdpbGwgZmlyZSBhIGdsb2JhbCBldmVudCBiYXNlZCBvbiB0aGVcbiAgICAgICAgICAgICAqIEVWRU5UX0NPTExFQ1RJT05fSU5JVElBTElaRUQgY29uc3RhbnQuIEFsbCBzdWJzZXF1ZW50XG4gICAgICAgICAgICAgKiBjYWxscyB3aWxsIHNpbWlsYXJseSBmaXJlIGEgRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVEIGV2ZW50LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZXRDb2xsZWN0aW9uOiBmdW5jdGlvbiAoY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIF9zZXRDb2xsZWN0aW9uKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0cyB0aGUgY29sbGVjdGlvbiByaWdodHMgc3RvcmVkIHdpdGhpbiB0aGlzIHNlcnZpY2UsIHByb3BvZ2F0aW5nXG4gICAgICAgICAgICAgKiBjaGFuZ2VzIHRvIGFsbCBiaW5kaW5ncyB0byB0aGUgY29sbGVjdGlvbiByZXR1cm5lZCBieVxuICAgICAgICAgICAgICogZ2V0Q29sbGVjdGlvblJpZ2h0cygpLiBUaGUgZmlyc3QgdGltZSB0aGlzIGlzIGNhbGxlZCBpdCB3aWxsIGZpcmUgYVxuICAgICAgICAgICAgICogZ2xvYmFsIGV2ZW50IGJhc2VkIG9uIHRoZSBFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEIGNvbnN0YW50LiBBbGxcbiAgICAgICAgICAgICAqIHN1YnNlcXVlbnQgY2FsbHMgd2lsbCBzaW1pbGFybHkgZmlyZSBhIEVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRFxuICAgICAgICAgICAgICogZXZlbnQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldENvbGxlY3Rpb25SaWdodHM6IGZ1bmN0aW9uIChjb2xsZWN0aW9uUmlnaHRzKSB7XG4gICAgICAgICAgICAgICAgX3NldENvbGxlY3Rpb25SaWdodHMoY29sbGVjdGlvblJpZ2h0cyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBdHRlbXB0cyB0byBzYXZlIHRoZSBjdXJyZW50IGNvbGxlY3Rpb24gZ2l2ZW4gYSBjb21taXQgbWVzc2FnZS4gVGhpc1xuICAgICAgICAgICAgICogZnVuY3Rpb24gY2Fubm90IGJlIGNhbGxlZCB1bnRpbCBhZnRlciBhIGNvbGxlY3Rpb24gaGFzIGJlZW4gaW5pdGlhbGl6ZWRcbiAgICAgICAgICAgICAqIGluIHRoaXMgc2VydmljZS4gUmV0dXJucyBmYWxzZSBpZiBhIHNhdmUgaXMgbm90IHBlcmZvcm1lZCBkdWUgdG8gbm9cbiAgICAgICAgICAgICAqIGNoYW5nZXMgcGVuZGluZywgb3IgdHJ1ZSBpZiBvdGhlcndpc2UuIFRoaXMgZnVuY3Rpb24sIHVwb24gc3VjY2VzcyxcbiAgICAgICAgICAgICAqIHdpbGwgY2xlYXIgdGhlIFVuZG9SZWRvU2VydmljZSBvZiBwZW5kaW5nIGNoYW5nZXMuIFRoaXMgZnVuY3Rpb24gYWxzb1xuICAgICAgICAgICAgICogc2hhcmVzIGJlaGF2aW9yIHdpdGggc2V0Q29sbGVjdGlvbigpLCB3aGVuIGl0IHN1Y2NlZWRzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzYXZlQ29sbGVjdGlvbjogZnVuY3Rpb24gKGNvbW1pdE1lc3NhZ2UsIHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghX2NvbGxlY3Rpb25Jc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuZmF0YWxXYXJuaW5nKCdDYW5ub3Qgc2F2ZSBhIGNvbGxlY3Rpb24gYmVmb3JlIG9uZSBpcyBsb2FkZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIERvbid0IGF0dGVtcHQgdG8gc2F2ZSB0aGUgY29sbGVjdGlvbiBpZiB0aGVyZSBhcmUgbm8gY2hhbmdlcyBwZW5kaW5nLlxuICAgICAgICAgICAgICAgIGlmICghVW5kb1JlZG9TZXJ2aWNlLmhhc0NoYW5nZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNCZWluZ1NhdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBFZGl0YWJsZUNvbGxlY3Rpb25CYWNrZW5kQXBpU2VydmljZS51cGRhdGVDb2xsZWN0aW9uKF9jb2xsZWN0aW9uLmdldElkKCksIF9jb2xsZWN0aW9uLmdldFZlcnNpb24oKSwgY29tbWl0TWVzc2FnZSwgVW5kb1JlZG9TZXJ2aWNlLmdldENvbW1pdHRhYmxlQ2hhbmdlTGlzdCgpKS50aGVuKGZ1bmN0aW9uIChjb2xsZWN0aW9uQmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfdXBkYXRlQ29sbGVjdGlvbihjb2xsZWN0aW9uQmFja2VuZE9iamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIFVuZG9SZWRvU2VydmljZS5jbGVhckNoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgX2NvbGxlY3Rpb25Jc0JlaW5nU2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKGVycm9yIHx8ICdUaGVyZSB3YXMgYW4gZXJyb3Igd2hlbiBzYXZpbmcgdGhlIGNvbGxlY3Rpb24uJyk7XG4gICAgICAgICAgICAgICAgICAgIF9jb2xsZWN0aW9uSXNCZWluZ1NhdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzZXJ2aWNlIGlzIGN1cnJlbnRseSBhdHRlbXB0aW5nIHRvIHNhdmUgdGhlXG4gICAgICAgICAgICAgKiBjb2xsZWN0aW9uIG1haW50YWluZWQgYnkgdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc1NhdmluZ0NvbGxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2NvbGxlY3Rpb25Jc0JlaW5nU2F2ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gbWFpbnRhaW4gdGhlIHN0YXRlIG9mIGEgc2luZ2xlIGNvbGxlY3Rpb24gc2hhcmVkXG4gKiB0aHJvdWdob3V0IHRoZSBjb2xsZWN0aW9uIGVkaXRvci4gVGhpcyBzZXJ2aWNlIHByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgZm9yXG4gKiByZXRyaWV2aW5nIHRoZSBjb2xsZWN0aW9uLCBzYXZpbmcgaXQsIGFuZCBsaXN0ZW5pbmcgZm9yIGNoYW5nZXMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9jb2xsZWN0aW9uL0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDb2xsZWN0aW9uTGluZWFyaXplclNlcnZpY2UnLCBbXG4gICAgJ0NvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIF9nZXROZXh0RXhwbG9yYXRpb25JZCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBjb21wbGV0ZWRFeHBJZHMpIHtcbiAgICAgICAgICAgIHZhciBleHBsb3JhdGlvbklkcyA9IGNvbGxlY3Rpb24uZ2V0RXhwbG9yYXRpb25JZHMoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwbG9yYXRpb25JZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkRXhwSWRzLmluZGV4T2YoZXhwbG9yYXRpb25JZHNbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25JZHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEdpdmVuIGEgbm9uIGxpbmVhciBjb2xsZWN0aW9uIGlucHV0LCB0aGUgZnVuY3Rpb24gd2lsbCBsaW5lYXJpemUgaXQgYnlcbiAgICAgICAgLy8gcGlja2luZyB0aGUgZmlyc3Qgbm9kZSBpdCBlbmNvdW50ZXJzIG9uIHRoZSBicmFuY2ggYW5kIGlnbm9yZSB0aGUgb3RoZXJzLlxuICAgICAgICB2YXIgX2dldENvbGxlY3Rpb25Ob2Rlc0luUGxheWFibGVPcmRlciA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGFkZEFmdGVyID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGN1ckV4cGxvcmF0aW9uSWQsIG5ld0V4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHZhciBjdXJDb2xsZWN0aW9uTm9kZSA9IGNvbGxlY3Rpb24uZ2V0Q29sbGVjdGlvbk5vZGVCeUV4cGxvcmF0aW9uSWQoY3VyRXhwbG9yYXRpb25JZCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBmaW5kTm9kZUluZGV4ID0gZnVuY3Rpb24gKGxpbmVhck5vZGVMaXN0LCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSAtMTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZWFyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGluZWFyTm9kZUxpc3RbaV0uZ2V0RXhwbG9yYXRpb25JZCgpID09PSBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICB9O1xuICAgICAgICAvLyBTd2FwIHRoZSBub2RlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggd2l0aCB0aGUgbm9kZSBpbW1lZGlhdGVseSB0byB0aGVcbiAgICAgICAgLy8gbGVmdCBvZiBpdC5cbiAgICAgICAgdmFyIHN3YXBMZWZ0ID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGxpbmVhck5vZGVMaXN0LCBub2RlSW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbGluZWFyTm9kZUxpc3Rbbm9kZUluZGV4XTtcbiAgICAgICAgICAgIHZhciBsZWZ0Tm9kZUluZGV4ID0gbm9kZUluZGV4ID4gMCA/IG5vZGVJbmRleCAtIDEgOiBudWxsO1xuICAgICAgICAgICAgaWYgKGxlZnROb2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zd2FwTm9kZXMoY29sbGVjdGlvbiwgbGVmdE5vZGVJbmRleCwgbm9kZUluZGV4KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN3YXBSaWdodCA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBsaW5lYXJOb2RlTGlzdCwgbm9kZUluZGV4KSB7XG4gICAgICAgICAgICAvLyBTd2FwcGluZyByaWdodCBpcyB0aGUgc2FtZSBhcyBzd2FwcGluZyB0aGUgbm9kZSBvbmUgdG8gdGhlIHJpZ2h0XG4gICAgICAgICAgICAvLyBsZWZ0d2FyZC5cbiAgICAgICAgICAgIGlmIChub2RlSW5kZXggPCBsaW5lYXJOb2RlTGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgc3dhcExlZnQoY29sbGVjdGlvbiwgbGluZWFyTm9kZUxpc3QsIG5vZGVJbmRleCArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGl0IGlzIGEgbm8tb3AgKGNhbm5vdCBzd2FwIHRoZSBsYXN0IG5vZGUgcmlnaHQpLlxuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hpZnROb2RlID0gZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQsIHN3YXBGdW5jdGlvbikge1xuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm90aGluZyB0byBzaGlmdCBpZiB0aGUgY29sbGVjdGlvbiBoYXMgb25seSAxIG5vZGUuXG4gICAgICAgICAgICBpZiAoY29sbGVjdGlvbi5nZXRDb2xsZWN0aW9uTm9kZUNvdW50KCkgPiAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVhck5vZGVMaXN0ID0gX2dldENvbGxlY3Rpb25Ob2Rlc0luUGxheWFibGVPcmRlcihjb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUluZGV4ID0gZmluZE5vZGVJbmRleChsaW5lYXJOb2RlTGlzdCwgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzd2FwRnVuY3Rpb24oY29sbGVjdGlvbiwgbGluZWFyTm9kZUxpc3QsIG5vZGVJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2l2ZW4gYSBjb2xsZWN0aW9uIGFuZCBhIGxpc3Qgb2YgY29tcGxldGVkIGV4cGxvcmF0aW9uIElEcyB3aXRoaW4gdGhlXG4gICAgICAgICAgICAgKiBjb250ZXh0IG9mIHRoYXQgY29sbGVjdGlvbiwgcmV0dXJucyBhIGxpc3Qgb2Ygd2hpY2ggZXhwbG9yYXRpb25zIGluIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbiBpcyBpbW1lZGlhdGVseSBwbGF5YWJsZSBieSB0aGUgdXNlci4gTk9URTogVGhpcyBmdW5jdGlvblxuICAgICAgICAgICAgICogZG9lcyBub3QgYXNzdW1lIHRoYXQgdGhlIGNvbGxlY3Rpb24gaXMgbGluZWFyLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXROZXh0RXhwbG9yYXRpb25JZDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGNvbXBsZXRlZEV4cElkcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0TmV4dEV4cGxvcmF0aW9uSWQoY29sbGVjdGlvbiwgY29tcGxldGVkRXhwSWRzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdpdmVuIGEgY29sbGVjdGlvbiwgcmV0dXJucyBhIGxpbmVhciBsaXN0IG9mIGNvbGxlY3Rpb24gbm9kZXMgd2hpY2hcbiAgICAgICAgICAgICAqIHJlcHJlc2VudHMgYSB2YWxpZCBwYXRoIGZvciBwbGF5aW5nIHRocm91Z2ggdGhpcyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXI6IGZ1bmN0aW9uIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXIoY29sbGVjdGlvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBJbnNlcnRzIGEgbmV3IGNvbGxlY3Rpb24gbm9kZSBhdCB0aGUgZW5kIG9mIHRoZSBjb2xsZWN0aW9uJ3MgcGxheWFibGVcbiAgICAgICAgICAgICAqIGxpc3Qgb2YgZXhwbG9yYXRpb25zLCBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGV4cGxvcmF0aW9uIElEIGFuZFxuICAgICAgICAgICAgICogZXhwbG9yYXRpb24gc3VtbWFyeSBiYWNrZW5kIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYXBwZW5kQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkLCBzdW1tYXJ5QmFja2VuZE9iamVjdCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lYXJOb2RlTGlzdCA9IF9nZXRDb2xsZWN0aW9uTm9kZXNJblBsYXlhYmxlT3JkZXIoY29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UuYWRkQ29sbGVjdGlvbk5vZGUoY29sbGVjdGlvbiwgZXhwbG9yYXRpb25JZCwgc3VtbWFyeUJhY2tlbmRPYmplY3QpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5lYXJOb2RlTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0Tm9kZSA9IGxpbmVhck5vZGVMaXN0W2xpbmVhck5vZGVMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBhZGRBZnRlcihjb2xsZWN0aW9uLCBsYXN0Tm9kZS5nZXRFeHBsb3JhdGlvbklkKCksIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJlbW92ZSBhIGNvbGxlY3Rpb24gbm9kZSBmcm9tIGEgZ2l2ZW4gY29sbGVjdGlvbiB3aGljaCBtYXBzIHRvIHRoZVxuICAgICAgICAgICAgICogc3BlY2lmaWVkIGV4cGxvcmF0aW9uIElELiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgdGhlIGxpbmVhciBzdHJ1Y3R1cmUgb2ZcbiAgICAgICAgICAgICAqIHRoZSBjb2xsZWN0aW9uIGlzIG1haW50YWluZWQuIFJldHVybnMgd2hldGhlciB0aGUgcHJvdmlkZWQgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAqIElEIGlzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGxpbmVhcmx5IHBsYXlhYmxlIHBhdGggb2YgdGhlIHNwZWNpZmllZFxuICAgICAgICAgICAgICogY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmVtb3ZlQ29sbGVjdGlvbk5vZGU6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb2xsZWN0aW9uLmNvbnRhaW5zQ29sbGVjdGlvbk5vZGUoZXhwbG9yYXRpb25JZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBEZWxldGUgdGhlIG5vZGVcbiAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5kZWxldGVDb2xsZWN0aW9uTm9kZShjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExvb2tzIHVwIGEgY29sbGVjdGlvbiBub2RlIGdpdmVuIGFuIGV4cGxvcmF0aW9uIElEIGluIHRoZSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAqIGNvbGxlY3Rpb24gYW5kIGF0dGVtcHRzIHRvIHNoaWZ0IGl0IGxlZnQgaW4gdGhlIGxpbmVhciBvcmRlcmluZyBvZiB0aGVcbiAgICAgICAgICAgICAqIGNvbGxlY3Rpb24uIElmIHRoZSBub2RlIGlzIHRoZSBmaXJzdCBleHBsb3JhdGlvbiBwbGF5ZWQgYnkgdGhlIHBsYXllcixcbiAgICAgICAgICAgICAqIHRoZW4gdGhpcyBmdW5jdGlvbiBpcyBhIG5vLW9wLiBSZXR1cm5zIGZhbHNlIGlmIHRoZSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIElEIGRvZXMgbm90IGFzc29jaWF0ZSB0byBhbnkgbm9kZXMgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNoaWZ0Tm9kZUxlZnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoaWZ0Tm9kZShjb2xsZWN0aW9uLCBleHBsb3JhdGlvbklkLCBzd2FwTGVmdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMb29rcyB1cCBhIGNvbGxlY3Rpb24gbm9kZSBnaXZlbiBhbiBleHBsb3JhdGlvbiBJRCBpbiB0aGUgc3BlY2lmaWVkXG4gICAgICAgICAgICAgKiBjb2xsZWN0aW9uIGFuZCBhdHRlbXB0cyB0byBzaGlmdCBpdCByaWdodCBpbiB0aGUgbGluZWFyIG9yZGVyaW5nIG9mIHRoZVxuICAgICAgICAgICAgICogY29sbGVjdGlvbi4gSWYgdGhlIG5vZGUgaXMgdGhlIGxhc3QgZXhwbG9yYXRpb24gcGxheWVkIGJ5IHRoZSBwbGF5ZXIsXG4gICAgICAgICAgICAgKiB0aGVuIHRoaXMgZnVuY3Rpb24gaXMgYSBuby1vcC4gUmV0dXJucyBmYWxzZSBpZiB0aGUgc3BlY2lmaWVkXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBJRCBkb2VzIG5vdCBhc3NvY2lhdGUgdG8gYW55IG5vZGVzIGluIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzaGlmdE5vZGVSaWdodDogZnVuY3Rpb24gKGNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2hpZnROb2RlKGNvbGxlY3Rpb24sIGV4cGxvcmF0aW9uSWQsIHN3YXBSaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgZGlzcGxheWluZyBhbmQgZWRpdGluZyBhIGNvbGxlY3Rpb24gZGV0YWlscy5cbiAqIEVkaXQgb3B0aW9ucyBpbmNsdWRlOiBjaGFuZ2luZyB0aGUgdGl0bGUsIG9iamVjdGl2ZSwgYW5kIGNhdGVnb3J5LCBhbmQgYWxzb1xuICogYWRkaW5nIGEgbmV3IGV4cGxvcmF0aW9uLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2Zvcm1zL2N1c3RvbS1mb3Jtcy1kaXJlY3RpdmVzL3NlbGVjdDItZHJvcGRvd24uZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vY29sbGVjdGlvbi9Db2xsZWN0aW9uVXBkYXRlU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL2NvbGxlY3Rpb24vQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2UuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2NvbGxlY3Rpb24tZWRpdG9yLXN0YXRlLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmRpcmVjdGl2ZSgnY29sbGVjdGlvbkRldGFpbHNFZGl0b3InLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NldHRpbmdzLXRhYi8nICtcbiAgICAgICAgICAgICAgICAnY29sbGVjdGlvbi1kZXRhaWxzLWVkaXRvci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZScsICdDb2xsZWN0aW9uVXBkYXRlU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0NvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZScsICdBbGVydHNTZXJ2aWNlJywgJ0FMTF9DQVRFR09SSUVTJyxcbiAgICAgICAgICAgICAgICAnQUxMX0xBTkdVQUdFX0NPREVTJywgJ0NPTExFQ1RJT05fVElUTEVfSU5QVVRfRk9DVVNfTEFCRUwnLFxuICAgICAgICAgICAgICAgICdFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVEJywgJ0VWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCcsXG4gICAgICAgICAgICAgICAgJ1RBR19SRUdFWCcsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSwgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2UsIENvbGxlY3Rpb25WYWxpZGF0aW9uU2VydmljZSwgQWxlcnRzU2VydmljZSwgQUxMX0NBVEVHT1JJRVMsIEFMTF9MQU5HVUFHRV9DT0RFUywgQ09MTEVDVElPTl9USVRMRV9JTlBVVF9GT0NVU19MQUJFTCwgRVZFTlRfQ09MTEVDVElPTl9JTklUSUFMSVpFRCwgRVZFTlRfQ09MTEVDVElPTl9SRUlOSVRJQUxJWkVELCBUQUdfUkVHRVgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN0cmwgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5DT0xMRUNUSU9OX1RJVExFX0lOUFVUX0ZPQ1VTX0xBQkVMID0gKENPTExFQ1RJT05fVElUTEVfSU5QVVRfRk9DVVNfTEFCRUwpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmhhc1BhZ2VMb2FkZWQgPSAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZS5oYXNMb2FkZWRDb2xsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5DQVRFR09SWV9MSVNUX0ZPUl9TRUxFQ1QyID0gQUxMX0NBVEVHT1JJRVMubWFwKGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogY2F0ZWdvcnlcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmxhbmd1YWdlTGlzdEZvclNlbGVjdCA9IEFMTF9MQU5HVUFHRV9DT0RFUztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5UQUdfUkVHRVggPSBUQUdfUkVHRVg7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWZyZXNoU2V0dGluZ3NUYWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25UaXRsZSA9IGN0cmwuY29sbGVjdGlvbi5nZXRUaXRsZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5kaXNwbGF5ZWRDb2xsZWN0aW9uT2JqZWN0aXZlID0gKGN0cmwuY29sbGVjdGlvbi5nZXRPYmplY3RpdmUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25DYXRlZ29yeSA9IChjdHJsLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25MYW5ndWFnZSA9IChjdHJsLmNvbGxlY3Rpb24uZ2V0TGFuZ3VhZ2VDb2RlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5kaXNwbGF5ZWRDb2xsZWN0aW9uVGFncyA9IChjdHJsLmNvbGxlY3Rpb24uZ2V0VGFncygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYXRlZ29yeUlzSW5TZWxlY3QyID0gY3RybC5DQVRFR09SWV9MSVNUX0ZPUl9TRUxFQ1QyLnNvbWUoZnVuY3Rpb24gKGNhdGVnb3J5SXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYXRlZ29yeUl0ZW0uaWQgPT09IGN0cmwuY29sbGVjdGlvbi5nZXRDYXRlZ29yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBjYXRlZ29yeSBpcyBub3QgaW4gdGhlIGRyb3Bkb3duLCBhZGQgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIHRoZSBmaXJzdCBvcHRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNhdGVnb3J5SXNJblNlbGVjdDIgJiYgY3RybC5jb2xsZWN0aW9uLmdldENhdGVnb3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLkNBVEVHT1JZX0xJU1RfRk9SX1NFTEVDVDIudW5zaGlmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBjdHJsLmNvbGxlY3Rpb24uZ2V0Q2F0ZWdvcnkoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogY3RybC5jb2xsZWN0aW9uLmdldENhdGVnb3J5KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRvbihFVkVOVF9DT0xMRUNUSU9OX0lOSVRJQUxJWkVELCByZWZyZXNoU2V0dGluZ3NUYWIpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKEVWRU5UX0NPTExFQ1RJT05fUkVJTklUSUFMSVpFRCwgcmVmcmVzaFNldHRpbmdzVGFiKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51cGRhdGVDb2xsZWN0aW9uVGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uVXBkYXRlU2VydmljZS5zZXRDb2xsZWN0aW9uVGl0bGUoY3RybC5jb2xsZWN0aW9uLCBjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25UaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXBkYXRlQ29sbGVjdGlvbk9iamVjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25PYmplY3RpdmUoY3RybC5jb2xsZWN0aW9uLCBjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25PYmplY3RpdmUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVwZGF0ZUNvbGxlY3Rpb25DYXRlZ29yeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25DYXRlZ29yeShjdHJsLmNvbGxlY3Rpb24sIGN0cmwuZGlzcGxheWVkQ29sbGVjdGlvbkNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51cGRhdGVDb2xsZWN0aW9uTGFuZ3VhZ2VDb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvblVwZGF0ZVNlcnZpY2Uuc2V0Q29sbGVjdGlvbkxhbmd1YWdlQ29kZShjdHJsLmNvbGxlY3Rpb24sIGN0cmwuZGlzcGxheWVkQ29sbGVjdGlvbkxhbmd1YWdlKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm9ybWFsaXplIHRoZSB0YWdzIGZvciB0aGUgY29sbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICB2YXIgbm9ybWFsaXplVGFncyA9IGZ1bmN0aW9uICh0YWdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdzW2ldID0gdGFnc1tpXS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhZ3M7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXBkYXRlQ29sbGVjdGlvblRhZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25UYWdzID0gbm9ybWFsaXplVGFncyhjdHJsLmRpc3BsYXllZENvbGxlY3Rpb25UYWdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghQ29sbGVjdGlvblZhbGlkYXRpb25TZXJ2aWNlLmlzVGFnVmFsaWQoY3RybC5kaXNwbGF5ZWRDb2xsZWN0aW9uVGFncykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1BsZWFzZSBlbnN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gZHVwbGljYXRlIHRhZ3MgYW5kIHRoYXQgYWxsICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGFncyBjb250YWluIG9ubHkgbG93ZXIgY2FzZSBhbmQgc3BhY2VzLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25VcGRhdGVTZXJ2aWNlLnNldENvbGxlY3Rpb25UYWdzKGN0cmwuY29sbGVjdGlvbiwgY3RybC5kaXNwbGF5ZWRDb2xsZWN0aW9uVGFncyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGRpc3BsYXlpbmcgdGhlIGNvbGxlY3Rpb24ncyBvd25lciBuYW1lIGFuZFxuICogcGVybWlzc2lvbnMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvY29sbGVjdGlvbi1lZGl0b3Itc3RhdGUuc2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjb2xsZWN0aW9uUGVybWlzc2lvbnNDYXJkJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY29sbGVjdGlvbi1lZGl0b3ItcGFnZS9zZXR0aW5ncy10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tcGVybWlzc2lvbnMtY2FyZC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICdDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoQ29sbGVjdGlvbkVkaXRvclN0YXRlU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY29sbGVjdGlvblJpZ2h0cyA9XG4gICAgICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uRWRpdG9yU3RhdGVTZXJ2aWNlLmdldENvbGxlY3Rpb25SaWdodHMoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5oYXNQYWdlTG9hZGVkID1cbiAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25FZGl0b3JTdGF0ZVNlcnZpY2UuaGFzTG9hZGVkQ29sbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXIgZm9yIHRoZSBzZXR0aW5ncyB0YWIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5yZXF1aXJlKCdwYWdlcy9jb2xsZWN0aW9uLWVkaXRvci1wYWdlL3NldHRpbmdzLXRhYi8nICtcbiAgICAnY29sbGVjdGlvbi1kZXRhaWxzLWVkaXRvci5kaXJlY3RpdmUudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2V0dGluZ3MtdGFiLycgK1xuICAgICdjb2xsZWN0aW9uLXBlcm1pc3Npb25zLWNhcmQuZGlyZWN0aXZlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25TZXR0aW5nc1RhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc2V0dGluZ3MtdGFiLycgK1xuICAgICAgICAgICAgICAgICdjb2xsZWN0aW9uLXNldHRpbmdzLXRhYi5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW2Z1bmN0aW9uICgpIHsgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIHN0YXRpc3RpY3MgdGFiIG9mIHRoZSBjb2xsZWN0aW9uIGVkaXRvci5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZGlyZWN0aXZlKCdjb2xsZWN0aW9uU3RhdGlzdGljc1RhYicsIFtcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBmdW5jdGlvbiAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2NvbGxlY3Rpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvJyArXG4gICAgICAgICAgICAgICAgJ2NvbGxlY3Rpb24tc3RhdGlzdGljcy10YWIuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7IH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGtlZXBpbmcgdHJhY2sgb2Ygc29sdXRpb24gdmFsaWRpdHkuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBTb2x1dGlvblZhbGlkaXR5U2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb2x1dGlvblZhbGlkaXR5U2VydmljZSgpIHtcbiAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXMgPSB7fTtcbiAgICB9XG4gICAgU29sdXRpb25WYWxpZGl0eVNlcnZpY2UucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoc3RhdGVOYW1lcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBzdGF0ZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgX3RoaXMuc29sdXRpb25WYWxpZGl0aWVzW3N0YXRlTmFtZV0gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLnByb3RvdHlwZS5kZWxldGVTb2x1dGlvblZhbGlkaXR5ID0gZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXTtcbiAgICB9O1xuICAgIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLnByb3RvdHlwZS5vblJlbmFtZVN0YXRlID0gZnVuY3Rpb24gKG5ld1N0YXRlTmFtZSwgb2xkU3RhdGVOYW1lKSB7XG4gICAgICAgIHRoaXMuc29sdXRpb25WYWxpZGl0aWVzW25ld1N0YXRlTmFtZV0gPVxuICAgICAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbb2xkU3RhdGVOYW1lXTtcbiAgICAgICAgdGhpcy5kZWxldGVTb2x1dGlvblZhbGlkaXR5KG9sZFN0YXRlTmFtZSk7XG4gICAgfTtcbiAgICBTb2x1dGlvblZhbGlkaXR5U2VydmljZS5wcm90b3R5cGUudXBkYXRlVmFsaWRpdHkgPSBmdW5jdGlvbiAoc3RhdGVOYW1lLCBzb2x1dGlvbklzVmFsaWQpIHtcbiAgICAgICAgdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXSA9IHNvbHV0aW9uSXNWYWxpZDtcbiAgICB9O1xuICAgIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLnByb3RvdHlwZS5pc1NvbHV0aW9uVmFsaWQgPSBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLnNvbHV0aW9uVmFsaWRpdGllcy5oYXNPd25Qcm9wZXJ0eShzdGF0ZU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb2x1dGlvblZhbGlkaXRpZXNbc3RhdGVOYW1lXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU29sdXRpb25WYWxpZGl0eVNlcnZpY2UucHJvdG90eXBlLmdldEFsbFZhbGlkaXRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNvbHV0aW9uVmFsaWRpdGllcztcbiAgICB9O1xuICAgIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlKTtcbiAgICByZXR1cm4gU29sdXRpb25WYWxpZGl0eVNlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5Tb2x1dGlvblZhbGlkaXR5U2VydmljZSA9IFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnU29sdXRpb25WYWxpZGl0eVNlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgc2VydmljZSB0aGF0IG1hcHMgSURzIHRvIEFuZ3VsYXIgbmFtZXMuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBBbmd1bGFyTmFtZVNlcnZpY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQW5ndWxhck5hbWVTZXJ2aWNlKCkge1xuICAgIH1cbiAgICBBbmd1bGFyTmFtZVNlcnZpY2VfMSA9IEFuZ3VsYXJOYW1lU2VydmljZTtcbiAgICBBbmd1bGFyTmFtZVNlcnZpY2UucHJvdG90eXBlLmdldE5hbWVPZkludGVyYWN0aW9uUnVsZXNTZXJ2aWNlID0gZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgQW5ndWxhck5hbWVTZXJ2aWNlXzEuYW5ndWxhck5hbWUgPSBpbnRlcmFjdGlvbklkLmNoYXJBdCgwKSArXG4gICAgICAgICAgICBpbnRlcmFjdGlvbklkLnNsaWNlKDEpICsgJ1J1bGVzU2VydmljZSc7XG4gICAgICAgIHJldHVybiBBbmd1bGFyTmFtZVNlcnZpY2VfMS5hbmd1bGFyTmFtZTtcbiAgICB9O1xuICAgIHZhciBBbmd1bGFyTmFtZVNlcnZpY2VfMTtcbiAgICBBbmd1bGFyTmFtZVNlcnZpY2UuYW5ndWxhck5hbWUgPSBudWxsO1xuICAgIEFuZ3VsYXJOYW1lU2VydmljZSA9IEFuZ3VsYXJOYW1lU2VydmljZV8xID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGNvcmVfMS5JbmplY3RhYmxlKHtcbiAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290J1xuICAgICAgICB9KVxuICAgIF0sIEFuZ3VsYXJOYW1lU2VydmljZSk7XG4gICAgcmV0dXJuIEFuZ3VsYXJOYW1lU2VydmljZTtcbn0oKSk7XG5leHBvcnRzLkFuZ3VsYXJOYW1lU2VydmljZSA9IEFuZ3VsYXJOYW1lU2VydmljZTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0FuZ3VsYXJOYW1lU2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoQW5ndWxhck5hbWVTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGRpc3BsYXlpbmcgZGlmZmVyZW50IHR5cGVzIG9mIG1vZGFscyBkZXBlbmRpbmdcbiAqIG9uIHRoZSB0eXBlIG9mIHJlc3BvbnNlIHJlY2VpdmVkIGFzIGEgcmVzdWx0IG9mIHRoZSBhdXRvc2F2aW5nIHJlcXVlc3QuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzLycgK1xuICAgICdjaGFuZ2VzLWluLWh1bWFuLXJlYWRhYmxlLWZvcm0uc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvZXhwbG9yYXRpb24tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Mb2NhbFN0b3JhZ2VTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdBdXRvc2F2ZUluZm9Nb2RhbHNTZXJ2aWNlJywgW1xuICAgICckbG9nJywgJyR0aW1lb3V0JywgJyR1aWJNb2RhbCcsICckd2luZG93JyxcbiAgICAnQ2hhbmdlc0luSHVtYW5SZWFkYWJsZUZvcm1TZXJ2aWNlJywgJ0V4cGxvcmF0aW9uRGF0YVNlcnZpY2UnLFxuICAgICdMb2NhbFN0b3JhZ2VTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGxvZywgJHRpbWVvdXQsICR1aWJNb2RhbCwgJHdpbmRvdywgQ2hhbmdlc0luSHVtYW5SZWFkYWJsZUZvcm1TZXJ2aWNlLCBFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlLCBMb2NhbFN0b3JhZ2VTZXJ2aWNlLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICB2YXIgX2lzTW9kYWxPcGVuID0gZmFsc2U7XG4gICAgICAgIHZhciBfcmVmcmVzaFBhZ2UgPSBmdW5jdGlvbiAoZGVsYXkpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvd05vblN0cmljdFZhbGlkYXRpb25GYWlsTW9kYWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL21vZGFsLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdzYXZlLXZhbGlkYXRpb24tZmFpbC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgbW9kYWwgZnJvbSBjbG9zaW5nIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG91dHNpZGUgaXQuXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNsb3NlQW5kUmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9yZWZyZXNoUGFnZSgyMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pLnJlc3VsdC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfaXNNb2RhbE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfaXNNb2RhbE9wZW4gPSB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzTW9kYWxPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc01vZGFsT3BlbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93VmVyc2lvbk1pc21hdGNoTW9kYWw6IGZ1bmN0aW9uIChsb3N0Q2hhbmdlcykge1xuICAgICAgICAgICAgICAgICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvbW9kYWwtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3NhdmUtdmVyc2lvbi1taXNtYXRjaC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgbW9kYWwgZnJvbSBjbG9zaW5nIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG91dHNpZGUgaXQuXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogWyckc2NvcGUnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgdXNlciBjbGlja3Mgb24gZGlzY2FyZCBjaGFuZ2VzIGJ1dHRvbiwgc2lnbmFsIGJhY2tlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBkaXNjYXJkIHRoZSBkcmFmdCBhbmQgcmVsb2FkIHRoZSBwYWdlIHRoZXJlYWZ0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRpc2NhcmRDaGFuZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlLmRpc2NhcmREcmFmdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVmcmVzaFBhZ2UoMjApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5oYXNMb3N0Q2hhbmdlcyA9IChsb3N0Q2hhbmdlcyAmJiBsb3N0Q2hhbmdlcy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLmhhc0xvc3RDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogVGhpcyBzaG91bGQgYWxzbyBpbmNsdWRlIGNoYW5nZXMgdG8gZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvcGVydGllcyAoc3VjaCBhcyB0aGUgZXhwbG9yYXRpb24gdGl0bGUsIGNhdGVnb3J5LCBldGMuKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvc3RDaGFuZ2VzSHRtbCA9IChDaGFuZ2VzSW5IdW1hblJlYWRhYmxlRm9ybVNlcnZpY2UubWFrZUh1bWFuUmVhZGFibGUobG9zdENoYW5nZXMpLmh0bWwoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoJ0xvc3QgY2hhbmdlczogJyArIEpTT04uc3RyaW5naWZ5KGxvc3RDaGFuZ2VzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvd0NsYXNzOiAnb3BwaWEtYXV0b3NhdmUtdmVyc2lvbi1taXNtYXRjaC1tb2RhbCdcbiAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93TG9zdENoYW5nZXNNb2RhbDogZnVuY3Rpb24gKGxvc3RDaGFuZ2VzLCBleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9tb2RhbC10ZW1wbGF0ZXMvJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnbG9zdC1jaGFuZ2VzLW1vZGFsLnRlbXBsYXRlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBtb2RhbCBmcm9tIGNsb3Npbmcgd2hlbiB0aGUgdXNlciBjbGlja3Mgb3V0c2lkZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgdXNlciBjbGlja3Mgb24gZGlzY2FyZCBjaGFuZ2VzIGJ1dHRvbiwgc2lnbmFsIGJhY2tlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0byBkaXNjYXJkIHRoZSBkcmFmdCBhbmQgcmVsb2FkIHRoZSBwYWdlIHRoZXJlYWZ0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb2NhbFN0b3JhZ2VTZXJ2aWNlLnJlbW92ZUV4cGxvcmF0aW9uRHJhZnQoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvc3RDaGFuZ2VzSHRtbCA9IChDaGFuZ2VzSW5IdW1hblJlYWRhYmxlRm9ybVNlcnZpY2UubWFrZUh1bWFuUmVhZGFibGUobG9zdENoYW5nZXMpLmh0bWwoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignTG9zdCBjaGFuZ2VzOiAnICsgSlNPTi5zdHJpbmdpZnkobG9zdENoYW5nZXMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3dDbGFzczogJ29wcGlhLWxvc3QtY2hhbmdlcy1tb2RhbCdcbiAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pc01vZGFsT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX2lzTW9kYWxPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBzZXJ2aWNlIHRoYXQgbWFpbnRhaW5zIGEgcHJvdmlzaW9uYWwgbGlzdCBvZiBjaGFuZ2VzIHRvIGJlXG4gKiBjb21taXR0ZWQgdG8gdGhlIHNlcnZlci5cbiAqL1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvYXV0b3NhdmUtaW5mby1tb2RhbHMuc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvZXhwbG9yYXRpb24tZGF0YS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdDaGFuZ2VMaXN0U2VydmljZScsIFtcbiAgICAnJGxvZycsICckcm9vdFNjb3BlJywgJ0FsZXJ0c1NlcnZpY2UnLCAnQXV0b3NhdmVJbmZvTW9kYWxzU2VydmljZScsXG4gICAgJ0V4cGxvcmF0aW9uRGF0YVNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkbG9nLCAkcm9vdFNjb3BlLCBBbGVydHNTZXJ2aWNlLCBBdXRvc2F2ZUluZm9Nb2RhbHNTZXJ2aWNlLCBFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlKSB7XG4gICAgICAgIC8vIFRPRE8oc2xsKTogSW1wbGVtZW50IHVuZG8sIHJlZG8gZnVuY3Rpb25hbGl0eS4gU2hvdyBhIG1lc3NhZ2Ugb24gZWFjaFxuICAgICAgICAvLyBzdGVwIHNheWluZyB3aGF0IHRoZSBzdGVwIGlzIGRvaW5nLlxuICAgICAgICAvLyBUT0RPKHNsbCk6IEFsbG93IHRoZSB1c2VyIHRvIHZpZXcgdGhlIGxpc3Qgb2YgY2hhbmdlcyBtYWRlIHNvIGZhciwgYXNcbiAgICAgICAgLy8gd2VsbCBhcyB0aGUgbGlzdCBvZiBjaGFuZ2VzIGluIHRoZSB1bmRvIHN0YWNrLlxuICAgICAgICAvLyBUZW1wb3JhcnkgYnVmZmVyIGZvciBjaGFuZ2VzIG1hZGUgdG8gdGhlIGV4cGxvcmF0aW9uLlxuICAgICAgICB2YXIgZXhwbG9yYXRpb25DaGFuZ2VMaXN0ID0gW107XG4gICAgICAgIC8vIFN0YWNrIGZvciBzdG9yaW5nIHVuZG9uZSBjaGFuZ2VzLiBUaGUgbGFzdCBlbGVtZW50IGlzIHRoZSBtb3N0IHJlY2VudGx5XG4gICAgICAgIC8vIHVuZG9uZSBjaGFuZ2UuXG4gICAgICAgIHZhciB1bmRvbmVDaGFuZ2VTdGFjayA9IFtdO1xuICAgICAgICAvLyBBbGwgdGhlc2UgY29uc3RhbnRzIHNob3VsZCBjb3JyZXNwb25kIHRvIHRob3NlIGluIGV4cF9kb21haW4ucHkuXG4gICAgICAgIC8vIFRPRE8oc2xsKTogRW5mb3JjZSB0aGlzIGluIGNvZGUuXG4gICAgICAgIHZhciBDTURfQUREX1NUQVRFID0gJ2FkZF9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfUkVOQU1FX1NUQVRFID0gJ3JlbmFtZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfREVMRVRFX1NUQVRFID0gJ2RlbGV0ZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfRURJVF9TVEFURV9QUk9QRVJUWSA9ICdlZGl0X3N0YXRlX3Byb3BlcnR5JztcbiAgICAgICAgdmFyIENNRF9FRElUX0VYUExPUkFUSU9OX1BST1BFUlRZID0gJ2VkaXRfZXhwbG9yYXRpb25fcHJvcGVydHknO1xuICAgICAgICB2YXIgQUxMT1dFRF9FWFBMT1JBVElPTl9CQUNLRU5EX05BTUVTID0ge1xuICAgICAgICAgICAgY2F0ZWdvcnk6IHRydWUsXG4gICAgICAgICAgICBpbml0X3N0YXRlX25hbWU6IHRydWUsXG4gICAgICAgICAgICBsYW5ndWFnZV9jb2RlOiB0cnVlLFxuICAgICAgICAgICAgb2JqZWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIHBhcmFtX3NwZWNzOiB0cnVlLFxuICAgICAgICAgICAgdGFnczogdHJ1ZSxcbiAgICAgICAgICAgIHRpdGxlOiB0cnVlLFxuICAgICAgICAgICAgYXV0b190dHNfZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGNvcnJlY3RuZXNzX2ZlZWRiYWNrX2VuYWJsZWQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIEFMTE9XRURfU1RBVEVfQkFDS0VORF9OQU1FUyA9IHtcbiAgICAgICAgICAgIGFuc3dlcl9ncm91cHM6IHRydWUsXG4gICAgICAgICAgICBjb25maXJtZWRfdW5jbGFzc2lmaWVkX2Fuc3dlcnM6IHRydWUsXG4gICAgICAgICAgICBjb250ZW50OiB0cnVlLFxuICAgICAgICAgICAgcmVjb3JkZWRfdm9pY2VvdmVyczogdHJ1ZSxcbiAgICAgICAgICAgIGRlZmF1bHRfb3V0Y29tZTogdHJ1ZSxcbiAgICAgICAgICAgIGhpbnRzOiB0cnVlLFxuICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIHBhcmFtX3NwZWNzOiB0cnVlLFxuICAgICAgICAgICAgc29saWNpdF9hbnN3ZXJfZGV0YWlsczogdHJ1ZSxcbiAgICAgICAgICAgIHNvbHV0aW9uOiB0cnVlLFxuICAgICAgICAgICAgc3RhdGVfbmFtZTogdHJ1ZSxcbiAgICAgICAgICAgIHdpZGdldF9jdXN0b21pemF0aW9uX2FyZ3M6IHRydWUsXG4gICAgICAgICAgICB3aWRnZXRfaWQ6IHRydWUsXG4gICAgICAgICAgICB3cml0dGVuX3RyYW5zbGF0aW9uczogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgICB2YXIgYXV0b3NhdmVDaGFuZ2VMaXN0T25DaGFuZ2UgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25DaGFuZ2VMaXN0KSB7XG4gICAgICAgICAgICAvLyBBc3luY2hyb25vdXNseSBzZW5kIGFuIGF1dG9zYXZlIHJlcXVlc3QsIGFuZCBjaGVjayBmb3IgZXJyb3JzIGluIHRoZVxuICAgICAgICAgICAgLy8gcmVzcG9uc2U6XG4gICAgICAgICAgICAvLyBJZiBlcnJvciBpcyBwcmVzZW50IC0+IENoZWNrIGZvciB0aGUgdHlwZSBvZiBlcnJvciBvY2N1cnJlZFxuICAgICAgICAgICAgLy8gKERpc3BsYXkgdGhlIGNvcnJlc3BvbmRpbmcgbW9kYWxzIGluIGJvdGggY2FzZXMsIGlmIG5vdCBhbHJlYWR5XG4gICAgICAgICAgICAvLyBvcGVuZWQpOlxuICAgICAgICAgICAgLy8gLSBWZXJzaW9uIE1pc21hdGNoLlxuICAgICAgICAgICAgLy8gLSBOb24tc3RyaWN0IFZhbGlkYXRpb24gRmFpbC5cbiAgICAgICAgICAgIEV4cGxvcmF0aW9uRGF0YVNlcnZpY2UuYXV0b3NhdmVDaGFuZ2VMaXN0KGV4cGxvcmF0aW9uQ2hhbmdlTGlzdCwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5kYXRhLmlzX3ZlcnNpb25fb2ZfZHJhZnRfdmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFBdXRvc2F2ZUluZm9Nb2RhbHNTZXJ2aWNlLmlzTW9kYWxPcGVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEF1dG9zYXZlSW5mb01vZGFsc1NlcnZpY2Uuc2hvd1ZlcnNpb25NaXNtYXRjaE1vZGFsKGV4cGxvcmF0aW9uQ2hhbmdlTGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgJGxvZy5lcnJvcignbm9uU3RyaWN0VmFsaWRhdGlvbkZhaWx1cmU6ICcgK1xuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShleHBsb3JhdGlvbkNoYW5nZUxpc3QpKTtcbiAgICAgICAgICAgICAgICBpZiAoIUF1dG9zYXZlSW5mb01vZGFsc1NlcnZpY2UuaXNNb2RhbE9wZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICBBdXRvc2F2ZUluZm9Nb2RhbHNTZXJ2aWNlLnNob3dOb25TdHJpY3RWYWxpZGF0aW9uRmFpbE1vZGFsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBhZGRDaGFuZ2UgPSBmdW5jdGlvbiAoY2hhbmdlRGljdCkge1xuICAgICAgICAgICAgaWYgKCRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleHBsb3JhdGlvbkNoYW5nZUxpc3QucHVzaChjaGFuZ2VEaWN0KTtcbiAgICAgICAgICAgIHVuZG9uZUNoYW5nZVN0YWNrID0gW107XG4gICAgICAgICAgICBhdXRvc2F2ZUNoYW5nZUxpc3RPbkNoYW5nZShleHBsb3JhdGlvbkNoYW5nZUxpc3QpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTYXZlcyBhIGNoYW5nZSBkaWN0IHRoYXQgcmVwcmVzZW50cyBhZGRpbmcgYSBuZXcgc3RhdGUuIEl0IGlzIHRoZVxuICAgICAgICAgICAgICogcmVzcG9uc2JpbGl0eSBvZiB0aGUgY2FsbGVyIHRvIGNoZWNrIHRoYXQgdGhlIG5ldyBzdGF0ZSBuYW1lIGlzIHZhbGlkLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbmV3bHktYWRkZWQgc3RhdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgYWRkU3RhdGU6IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBhZGRDaGFuZ2Uoe1xuICAgICAgICAgICAgICAgICAgICBjbWQ6IENNRF9BRERfU1RBVEUsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlX25hbWU6IHN0YXRlTmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2F2ZXMgYSBjaGFuZ2UgZGljdCB0aGF0IHJlcHJlc2VudHMgZGVsZXRpbmcgYSBuZXcgc3RhdGUuIEl0IGlzIHRoZVxuICAgICAgICAgICAgICogcmVzcG9uc2JpbGl0eSBvZiB0aGUgY2FsbGVyIHRvIGNoZWNrIHRoYXQgdGhlIGRlbGV0ZWQgc3RhdGUgbmFtZVxuICAgICAgICAgICAgICogY29ycmVzcG9uZHMgdG8gYW4gZXhpc3Rpbmcgc3RhdGUuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBkZWxldGVkIHN0YXRlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBkZWxldGVTdGF0ZTogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIGFkZENoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAgIGNtZDogQ01EX0RFTEVURV9TVEFURSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVfbmFtZTogc3RhdGVOYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzY2FyZEFsbENoYW5nZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBleHBsb3JhdGlvbkNoYW5nZUxpc3QgPSBbXTtcbiAgICAgICAgICAgICAgICB1bmRvbmVDaGFuZ2VTdGFjayA9IFtdO1xuICAgICAgICAgICAgICAgIEV4cGxvcmF0aW9uRGF0YVNlcnZpY2UuZGlzY2FyZERyYWZ0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTYXZlcyBhIGNoYW5nZSBkaWN0IHRoYXQgcmVwcmVzZW50cyBhIGNoYW5nZSB0byBhbiBleHBsb3JhdGlvblxuICAgICAgICAgICAgICogcHJvcGVydHkgKHN1Y2ggYXMgaXRzIHRpdGxlLCBjYXRlZ29yeSwgLi4uKS4gSXQgaXMgdGhlIHJlc3BvbnNpYmlsaXR5XG4gICAgICAgICAgICAgKiBvZiB0aGUgY2FsbGVyIHRvIGNoZWNrIHRoYXQgdGhlIG9sZCBhbmQgbmV3IHZhbHVlcyBhcmUgbm90IGVxdWFsLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBiYWNrZW5kTmFtZSAtIFRoZSBiYWNrZW5kIG5hbWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICAgICAgKiAgIChlLmcuIHRpdGxlLCBjYXRlZ29yeSlcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdWYWx1ZSAtIFRoZSBuZXcgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkVmFsdWUgLSBUaGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGVkaXRFeHBsb3JhdGlvblByb3BlcnR5OiBmdW5jdGlvbiAoYmFja2VuZE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghQUxMT1dFRF9FWFBMT1JBVElPTl9CQUNLRU5EX05BTUVTLmhhc093blByb3BlcnR5KGJhY2tlbmROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ludmFsaWQgZXhwbG9yYXRpb24gcHJvcGVydHk6ICcgKyBiYWNrZW5kTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWRkQ2hhbmdlKHtcbiAgICAgICAgICAgICAgICAgICAgY21kOiBDTURfRURJVF9FWFBMT1JBVElPTl9QUk9QRVJUWSxcbiAgICAgICAgICAgICAgICAgICAgbmV3X3ZhbHVlOiBhbmd1bGFyLmNvcHkobmV3VmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICBvbGRfdmFsdWU6IGFuZ3VsYXIuY29weShvbGRWYWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5X25hbWU6IGJhY2tlbmROYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTYXZlcyBhIGNoYW5nZSBkaWN0IHRoYXQgcmVwcmVzZW50cyBhIGNoYW5nZSB0byBhIHN0YXRlIHByb3BlcnR5LiBJdFxuICAgICAgICAgICAgICogaXMgdGhlIHJlc3BvbnNpYmlsaXR5IG9mIHRoZSBjYWxsZXIgdG8gY2hlY2sgdGhhdCB0aGUgb2xkIGFuZCBuZXdcbiAgICAgICAgICAgICAqIHZhbHVlcyBhcmUgbm90IGVxdWFsLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc3RhdGUgdGhhdCBpcyBiZWluZyBlZGl0ZWRcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBiYWNrZW5kTmFtZSAtIFRoZSBiYWNrZW5kIG5hbWUgb2YgdGhlIGVkaXRlZCBwcm9wZXJ0eVxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1ZhbHVlIC0gVGhlIG5ldyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvbGRWYWx1ZSAtIFRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZWRpdFN0YXRlUHJvcGVydHk6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIGJhY2tlbmROYW1lLCBuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUFMTE9XRURfU1RBVEVfQkFDS0VORF9OQU1FUy5oYXNPd25Qcm9wZXJ0eShiYWNrZW5kTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdJbnZhbGlkIHN0YXRlIHByb3BlcnR5OiAnICsgYmFja2VuZE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFkZENoYW5nZSh7XG4gICAgICAgICAgICAgICAgICAgIGNtZDogQ01EX0VESVRfU1RBVEVfUFJPUEVSVFksXG4gICAgICAgICAgICAgICAgICAgIG5ld192YWx1ZTogYW5ndWxhci5jb3B5KG5ld1ZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgb2xkX3ZhbHVlOiBhbmd1bGFyLmNvcHkob2xkVmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eV9uYW1lOiBiYWNrZW5kTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVfbmFtZTogc3RhdGVOYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q2hhbmdlTGlzdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoZXhwbG9yYXRpb25DaGFuZ2VMaXN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0V4cGxvcmF0aW9uTG9ja2VkRm9yRWRpdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbkNoYW5nZUxpc3QubGVuZ3RoID4gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEluaXRpYWxpemVzIHRoZSBjdXJyZW50IGNoYW5nZUxpc3Qgd2l0aCB0aGUgb25lIHJlY2VpdmVkIGZyb20gYmFja2VuZC5cbiAgICAgICAgICAgICAqIFRoaXMgYmVoYXZpb3IgZXhpc3RzIG9ubHkgaW4gY2FzZSBvZiBhbiBhdXRvc2F2ZS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gY2hhbmdlTGlzdCAtIEF1dG9zYXZlZCBjaGFuZ2VMaXN0IGRhdGFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9hZEF1dG9zYXZlZENoYW5nZUxpc3Q6IGZ1bmN0aW9uIChjaGFuZ2VMaXN0KSB7XG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25DaGFuZ2VMaXN0ID0gY2hhbmdlTGlzdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNhdmVzIGEgY2hhbmdlIGRpY3QgdGhhdCByZXByZXNlbnRzIHRoZSByZW5hbWluZyBvZiBhIHN0YXRlLiBUaGlzXG4gICAgICAgICAgICAgKiBpcyBhbHNvIGludGVuZGVkIHRvIGNoYW5nZSB0aGUgaW5pdGlhbCBzdGF0ZSBuYW1lIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgICAgICogKHRoYXQgaXMsIHRoZSBsYXR0ZXIgY2hhbmdlIGlzIGltcGxpZWQgYW5kIGRvZXMgbm90IGhhdmUgdG8gYmVcbiAgICAgICAgICAgICAqIHJlY29yZGVkIHNlcGFyYXRlbHkgaW4gYW5vdGhlciBjaGFuZ2UgZGljdCkuIEl0IGlzIHRoZSByZXNwb25zaWJpbGl0eVxuICAgICAgICAgICAgICogb2YgdGhlIGNhbGxlciB0byBjaGVjayB0aGF0IHRoZSB0d28gbmFtZXMgYXJlIG5vdCBlcXVhbC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3U3RhdGVOYW1lIC0gVGhlIG5ldyBuYW1lIG9mIHRoZSBzdGF0ZVxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG9sZFN0YXRlTmFtZSAtIFRoZSBwcmV2aW91cyBuYW1lIG9mIHRoZSBzdGF0ZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZW5hbWVTdGF0ZTogZnVuY3Rpb24gKG5ld1N0YXRlTmFtZSwgb2xkU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgYWRkQ2hhbmdlKHtcbiAgICAgICAgICAgICAgICAgICAgY21kOiBDTURfUkVOQU1FX1NUQVRFLFxuICAgICAgICAgICAgICAgICAgICBuZXdfc3RhdGVfbmFtZTogbmV3U3RhdGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICBvbGRfc3RhdGVfbmFtZTogb2xkU3RhdGVOYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5kb0xhc3RDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwbG9yYXRpb25DaGFuZ2VMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1RoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIHVuZG8uJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGxhc3RDaGFuZ2UgPSBleHBsb3JhdGlvbkNoYW5nZUxpc3QucG9wKCk7XG4gICAgICAgICAgICAgICAgdW5kb25lQ2hhbmdlU3RhY2sucHVzaChsYXN0Q2hhbmdlKTtcbiAgICAgICAgICAgICAgICBhdXRvc2F2ZUNoYW5nZUxpc3RPbkNoYW5nZShleHBsb3JhdGlvbkNoYW5nZUxpc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGdldCBjaGFuZ2VzIGluIGh1bWFuIHJlYWRhYmxlIGZvcm0uXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL1V0aWxzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnQ2hhbmdlc0luSHVtYW5SZWFkYWJsZUZvcm1TZXJ2aWNlJywgW1xuICAgICdVdGlsc1NlcnZpY2UnLCBmdW5jdGlvbiAoVXRpbHNTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBDTURfQUREX1NUQVRFID0gJ2FkZF9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfUkVOQU1FX1NUQVRFID0gJ3JlbmFtZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfREVMRVRFX1NUQVRFID0gJ2RlbGV0ZV9zdGF0ZSc7XG4gICAgICAgIHZhciBDTURfRURJVF9TVEFURV9QUk9QRVJUWSA9ICdlZGl0X3N0YXRlX3Byb3BlcnR5JztcbiAgICAgICAgdmFyIG1ha2VSdWxlc0xpc3RIdW1hblJlYWRhYmxlID0gZnVuY3Rpb24gKGFuc3dlckdyb3VwVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBydWxlc0xpc3QgPSBbXTtcbiAgICAgICAgICAgIGFuc3dlckdyb3VwVmFsdWUucnVsZXMuZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgICAgICAgICAgICAgIHZhciBydWxlRWxtID0gYW5ndWxhci5lbGVtZW50KCc8bGk+PC9saT4nKTtcbiAgICAgICAgICAgICAgICBydWxlRWxtLmh0bWwoJzxwPlR5cGU6ICcgKyBydWxlLnR5cGUgKyAnPC9wPicpO1xuICAgICAgICAgICAgICAgIHJ1bGVFbG0uYXBwZW5kKCc8cD5WYWx1ZTogJyArIChPYmplY3Qua2V5cyhydWxlLmlucHV0cykubWFwKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVsZS5pbnB1dHNbaW5wdXRdO1xuICAgICAgICAgICAgICAgIH0pKS50b1N0cmluZygpICsgJzwvcD4nKTtcbiAgICAgICAgICAgICAgICBydWxlc0xpc3QucHVzaChydWxlRWxtKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJ1bGVzTGlzdDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gQW4gZWRpdCBpcyByZXByZXNlbnRlZCBlaXRoZXIgYXMgYW4gb2JqZWN0IG9yIGFuIGFycmF5LiBJZiBpdCdzIGFuXG4gICAgICAgIC8vIG9iamVjdCwgdGhlbiBzaW1wbHkgcmV0dXJuIHRoYXQgb2JqZWN0LiBJbiBjYXNlIG9mIGFuIGFycmF5LCByZXR1cm5cbiAgICAgICAgLy8gdGhlIGxhc3QgaXRlbS5cbiAgICAgICAgdmFyIGdldFN0YXRlUHJvcGVydHlWYWx1ZSA9IGZ1bmN0aW9uIChzdGF0ZVByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmlzQXJyYXkoc3RhdGVQcm9wZXJ0eVZhbHVlKSA/XG4gICAgICAgICAgICAgICAgc3RhdGVQcm9wZXJ0eVZhbHVlW3N0YXRlUHJvcGVydHlWYWx1ZS5sZW5ndGggLSAxXSA6IHN0YXRlUHJvcGVydHlWYWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gRGV0ZWN0cyB3aGV0aGVyIGFuIG9iamVjdCBvZiB0aGUgdHlwZSAnYW5zd2VyX2dyb3VwJyBvclxuICAgICAgICAvLyAnZGVmYXVsdF9vdXRjb21lJyBoYXMgYmVlbiBhZGRlZCwgZWRpdGVkIG9yIGRlbGV0ZWQuXG4gICAgICAgIC8vIFJldHVybnMgLSAnYWRkZGVkJywgJ2VkaXRlZCcgb3IgJ2RlbGV0ZWQnIGFjY29yZGluZ2x5LlxuICAgICAgICB2YXIgZ2V0UmVsYXRpdmVDaGFuZ2VUb0dyb3VwcyA9IGZ1bmN0aW9uIChjaGFuZ2VPYmplY3QpIHtcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IGNoYW5nZU9iamVjdC5uZXdfdmFsdWU7XG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBjaGFuZ2VPYmplY3Qub2xkX3ZhbHVlO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShuZXdWYWx1ZSkgJiYgYW5ndWxhci5pc0FycmF5KG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChuZXdWYWx1ZS5sZW5ndGggPiBvbGRWYWx1ZS5sZW5ndGgpID9cbiAgICAgICAgICAgICAgICAgICAgJ2FkZGVkJyA6IChuZXdWYWx1ZS5sZW5ndGggPT09IG9sZFZhbHVlLmxlbmd0aCkgP1xuICAgICAgICAgICAgICAgICAgICAnZWRpdGVkJyA6ICdkZWxldGVkJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghVXRpbHNTZXJ2aWNlLmlzRW1wdHkob2xkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghVXRpbHNTZXJ2aWNlLmlzRW1wdHkobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAnZWRpdGVkJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICdkZWxldGVkJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghVXRpbHNTZXJ2aWNlLmlzRW1wdHkobmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICdhZGRlZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1ha2VIdW1hblJlYWRhYmxlID0gZnVuY3Rpb24gKGxvc3RDaGFuZ2VzKSB7XG4gICAgICAgICAgICB2YXIgb3V0ZXJIdG1sID0gYW5ndWxhci5lbGVtZW50KCc8dWw+PC91bD4nKTtcbiAgICAgICAgICAgIHZhciBzdGF0ZVdpc2VFZGl0c01hcHBpbmcgPSB7fTtcbiAgICAgICAgICAgIC8vIFRoZSB2YXJpYWJsZSBzdGF0ZVdpc2VFZGl0c01hcHBpbmcgc3RvcmVzIHRoZSBlZGl0cyBncm91cGVkIGJ5IHN0YXRlLlxuICAgICAgICAgICAgLy8gRm9yIGluc3RhbmNlLCB5b3UgbWFkZSB0aGUgZm9sbG93aW5nIGVkaXRzOlxuICAgICAgICAgICAgLy8gMS4gQ2hhbmdlZCBjb250ZW50IHRvICdXZWxjb21lIScgaW5zdGVhZCBvZiAnJyBpbiAnSW50cm9kdWN0aW9uJy5cbiAgICAgICAgICAgIC8vIDIuIEFkZGVkIGFuIGludGVyYWN0aW9uIGluIHRoaXMgc3RhdGUuXG4gICAgICAgICAgICAvLyAyLiBBZGRlZCBhIG5ldyBzdGF0ZSAnRW5kJy5cbiAgICAgICAgICAgIC8vIDMuIEVuZGVkIEV4cG9yYXRpb24gZnJvbSBzdGF0ZSAnRW5kJy5cbiAgICAgICAgICAgIC8vIHN0YXRlV2lzZUVkaXRzTWFwcGluZyB3aWxsIGxvb2sgc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAgICAgICAgIC8vIC0gJ0ludHJvZHVjdGlvbic6IFtcbiAgICAgICAgICAgIC8vICAgLSAnRWRpdGVkIENvbnRlbnQ6IFdlbGNvbWUhJyw6XG4gICAgICAgICAgICAvLyAgIC0gJ0FkZGVkIEludGVyYWN0aW9uOiBDb250aW51ZScsXG4gICAgICAgICAgICAvLyAgIC0gJ0FkZGVkIGludGVyYWN0aW9uIGN1c3RvbWl6YXRpb25zJ11cbiAgICAgICAgICAgIC8vIC0gJ0VuZCc6IFsnRW5kZWQgZXhwbG9yYXRpb24nXVxuICAgICAgICAgICAgbG9zdENoYW5nZXMuZm9yRWFjaChmdW5jdGlvbiAobG9zdENoYW5nZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAobG9zdENoYW5nZS5jbWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDTURfQUREX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChhbmd1bGFyLmVsZW1lbnQoJzxsaT48L2xpPicpLmh0bWwoJ0FkZGVkIHN0YXRlOiAnICsgbG9zdENoYW5nZS5zdGF0ZV9uYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDTURfUkVOQU1FX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChhbmd1bGFyLmVsZW1lbnQoJzxsaT48L2xpPicpLmh0bWwoJ1JlbmFtZWQgc3RhdGU6ICcgKyBsb3N0Q2hhbmdlLm9sZF9zdGF0ZV9uYW1lICsgJyB0byAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlLm5ld19zdGF0ZV9uYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDTURfREVMRVRFX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXJIdG1sLmFwcGVuZChhbmd1bGFyLmVsZW1lbnQoJzxsaT48L2xpPicpLmh0bWwoJ0RlbGV0ZWQgc3RhdGU6ICcgKyBsb3N0Q2hhbmdlLnN0YXRlX25hbWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENNRF9FRElUX1NUQVRFX1BST1BFUlRZOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gZ2V0U3RhdGVQcm9wZXJ0eVZhbHVlKGxvc3RDaGFuZ2UubmV3X3ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IGdldFN0YXRlUHJvcGVydHlWYWx1ZShsb3N0Q2hhbmdlLm9sZF92YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdGVOYW1lID0gbG9zdENoYW5nZS5zdGF0ZV9uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGxvc3RDaGFuZ2UucHJvcGVydHlfbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRlbnQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogQWxzbyBhZGQgZGlzcGxheSBvZiBhdWRpbyB0cmFuc2xhdGlvbnMgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PjwvZGl2PicpLmh0bWwoJzxzdHJvbmc+RWRpdGVkIGNvbnRlbnQ6IDwvc3Ryb25nPjxkaXYgY2xhc3M9XCJjb250ZW50XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUuaHRtbCArICc8L2Rpdj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc3RhdGUtZWRpdC1kZXNjJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3dpZGdldF9pZCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb3N0Q2hhbmdlVmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09ICdFbmRFeHBsb3JhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlVmFsdWUgPSAoJzxzdHJvbmc+QWRkZWQgSW50ZXJhY3Rpb246IDwvc3Ryb25nPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlVmFsdWUgPSAnRW5kZWQgRXhwbG9yYXRpb24nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9zdENoYW5nZVZhbHVlID0gKCc8c3Ryb25nPkRlbGV0ZWQgSW50ZXJhY3Rpb246IDwvc3Ryb25nPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj48L2Rpdj4nKS5odG1sKGxvc3RDaGFuZ2VWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc3RhdGUtZWRpdC1kZXNjJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd3aWRnZXRfY3VzdG9taXphdGlvbl9hcmdzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvc3RDaGFuZ2VWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVXRpbHNTZXJ2aWNlLmlzRW1wdHkob2xkVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0Q2hhbmdlVmFsdWUgPSAnQWRkZWQgSW50ZXJhY3Rpb24gQ3VzdG9taXphdGlvbnMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFV0aWxzU2VydmljZS5pc0VtcHR5KG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9zdENoYW5nZVZhbHVlID0gJ1JlbW92ZWQgSW50ZXJhY3Rpb24gQ3VzdG9taXphdGlvbnMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9zdENoYW5nZVZhbHVlID0gJ0VkaXRlZCBJbnRlcmFjdGlvbiBDdXN0b21pemF0aW9ucyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVXaXNlRWRpdHNNYXBwaW5nW3N0YXRlTmFtZV0ucHVzaChhbmd1bGFyLmVsZW1lbnQoJzxkaXY+PC9kaXY+JykuaHRtbChsb3N0Q2hhbmdlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnYW5zd2VyX2dyb3Vwcyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbnN3ZXJHcm91cENoYW5nZXMgPSBnZXRSZWxhdGl2ZUNoYW5nZVRvR3JvdXBzKGxvc3RDaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYW5zd2VyR3JvdXBIdG1sID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbnN3ZXJHcm91cENoYW5nZXMgPT09ICdhZGRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwSHRtbCArPSAoJzxwIGNsYXNzPVwic3ViLWVkaXRcIj48aT5EZXN0aW5hdGlvbjogPC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLm91dGNvbWUuZGVzdCArICc8L3A+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cEh0bWwgKz0gKCc8ZGl2IGNsYXNzPVwic3ViLWVkaXRcIj48aT5GZWVkYmFjazogPC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZmVlZGJhY2tcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZS5vdXRjb21lLmZlZWRiYWNrLmdldEh0bWwoKSArICc8L2Rpdj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydWxlc0xpc3QgPSBtYWtlUnVsZXNMaXN0SHVtYW5SZWFkYWJsZShuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVsZXNMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cEh0bWwgKz0gJzxwIGNsYXNzPVwic3ViLWVkaXRcIj48aT5SdWxlczogPC9pPjwvcD4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydWxlc0xpc3RIdG1sID0gKGFuZ3VsYXIuZWxlbWVudCgnPG9sPjwvb2w+JykuYWRkQ2xhc3MoJ3J1bGVzLWxpc3QnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcnVsZSBpbiBydWxlc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZXNMaXN0SHRtbC5odG1sKHJ1bGVzTGlzdFtydWxlXVswXS5vdXRlckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbnN3ZXJHcm91cEh0bWwgKz0gcnVsZXNMaXN0SHRtbFswXS5vdXRlckhUTUw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj48c3Ryb25nPkFkZGVkIGFuc3dlciBncm91cDogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvc3Ryb25nPjwvZGl2PicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChhbnN3ZXJHcm91cEh0bWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdzdGF0ZS1lZGl0LWRlc2MgYW5zd2VyLWdyb3VwJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuc3dlckdyb3VwQ2hhbmdlcyA9PT0gJ2VkaXRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZS5vdXRjb21lLmRlc3QgIT09IG9sZFZhbHVlLm91dGNvbWUuZGVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwSHRtbCArPSAoJzxwIGNsYXNzPVwic3ViLWVkaXRcIj48aT5EZXN0aW5hdGlvbjogPC9pPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZS5vdXRjb21lLmRlc3QgKyAnPC9wPicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmVxdWFscyhuZXdWYWx1ZS5vdXRjb21lLmZlZWRiYWNrLmdldEh0bWwoKSwgb2xkVmFsdWUub3V0Y29tZS5mZWVkYmFjay5nZXRIdG1sKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyR3JvdXBIdG1sICs9ICgnPGRpdiBjbGFzcz1cInN1Yi1lZGl0XCI+PGk+RmVlZGJhY2s6IDwvaT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmZWVkYmFja1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZS5vdXRjb21lLmZlZWRiYWNrLmdldEh0bWwoKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5lcXVhbHMobmV3VmFsdWUucnVsZXMsIG9sZFZhbHVlLnJ1bGVzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydWxlc0xpc3QgPSBtYWtlUnVsZXNMaXN0SHVtYW5SZWFkYWJsZShuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGVzTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwSHRtbCArPSAoJzxwIGNsYXNzPVwic3ViLWVkaXRcIj48aT5SdWxlczogPC9pPjwvcD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bGVzTGlzdEh0bWwgPSAoYW5ndWxhci5lbGVtZW50KCc8b2w+PC9vbD4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdydWxlcy1saXN0JykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBydWxlIGluIHJ1bGVzTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVsZXNMaXN0SHRtbC5odG1sKHJ1bGVzTGlzdFtydWxlXVswXS5vdXRlckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckdyb3VwQ2hhbmdlcyA9IHJ1bGVzTGlzdEh0bWxbMF0ub3V0ZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PjxzdHJvbmc+RWRpdGVkIGFuc3dlciBncm91cDogPHN0cm9uZz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKGFuc3dlckdyb3VwSHRtbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYyBhbnN3ZXItZ3JvdXAnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoYW5zd2VyR3JvdXBDaGFuZ2VzID09PSAnZGVsZXRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PkRlbGV0ZWQgYW5zd2VyIGdyb3VwPC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdkZWZhdWx0X291dGNvbWUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdE91dGNvbWVDaGFuZ2VzID0gZ2V0UmVsYXRpdmVDaGFuZ2VUb0dyb3Vwcyhsb3N0Q2hhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRPdXRjb21lSHRtbCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdE91dGNvbWVDaGFuZ2VzID09PSAnYWRkZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3V0Y29tZUh0bWwgKz0gKCc8cCBjbGFzcz1cInN1Yi1lZGl0XCI+PGk+RGVzdGluYXRpb246IDwvaT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZS5kZXN0ICsgJzwvcD4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRPdXRjb21lSHRtbCArPSAoJzxkaXYgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkZlZWRiYWNrOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmZWVkYmFja1wiPicgKyBuZXdWYWx1ZS5mZWVkYmFjay5nZXRIdG1sKCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdLnB1c2goYW5ndWxhci5lbGVtZW50KCc8ZGl2PkFkZGVkIGRlZmF1bHQgb3V0Y29tZTogPC9kaXY+JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKGRlZmF1bHRPdXRjb21lSHRtbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3N0YXRlLWVkaXQtZGVzYyBkZWZhdWx0LW91dGNvbWUnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVmYXVsdE91dGNvbWVDaGFuZ2VzID09PSAnZWRpdGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlLmRlc3QgIT09IG9sZFZhbHVlLmRlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0T3V0Y29tZUh0bWwgKz0gKCc8cCBjbGFzcz1cInN1Yi1lZGl0XCI+PGk+RGVzdGluYXRpb246IDwvaT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUuZGVzdCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3A+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKG5ld1ZhbHVlLmZlZWRiYWNrLmdldEh0bWwoKSwgb2xkVmFsdWUuZmVlZGJhY2suZ2V0SHRtbCgpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRPdXRjb21lSHRtbCArPSAoJzxkaXYgY2xhc3M9XCJzdWItZWRpdFwiPjxpPkZlZWRiYWNrOiA8L2k+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZmVlZGJhY2tcIj4nICsgbmV3VmFsdWUuZmVlZGJhY2sgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZVdpc2VFZGl0c01hcHBpbmdbc3RhdGVOYW1lXS5wdXNoKGFuZ3VsYXIuZWxlbWVudCgnPGRpdj5FZGl0ZWQgZGVmYXVsdCBvdXRjb21lOiA8L2Rpdj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoZGVmYXVsdE91dGNvbWVIdG1sKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc3RhdGUtZWRpdC1kZXNjIGRlZmF1bHQtb3V0Y29tZScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChkZWZhdWx0T3V0Y29tZUNoYW5nZXMgPT09ICdkZWxldGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVXaXNlRWRpdHNNYXBwaW5nW3N0YXRlTmFtZV0ucHVzaChhbmd1bGFyLmVsZW1lbnQoJzxkaXY+RGVsZXRlZCBkZWZhdWx0IG91dGNvbWU8L2Rpdj4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnc3RhdGUtZWRpdC1kZXNjJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb3IgKHZhciBzdGF0ZU5hbWUgaW4gc3RhdGVXaXNlRWRpdHNNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlQ2hhbmdlc0VsID0gYW5ndWxhci5lbGVtZW50KCc8bGk+RWRpdHMgdG8gc3RhdGU6ICcgKyBzdGF0ZU5hbWUgKyAnPC9saT4nKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzdGF0ZUVkaXQgaW4gc3RhdGVXaXNlRWRpdHNNYXBwaW5nW3N0YXRlTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVDaGFuZ2VzRWwuYXBwZW5kKHN0YXRlV2lzZUVkaXRzTWFwcGluZ1tzdGF0ZU5hbWVdW3N0YXRlRWRpdF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvdXRlckh0bWwuYXBwZW5kKHN0YXRlQ2hhbmdlc0VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRlckh0bWw7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtYWtlSHVtYW5SZWFkYWJsZTogZnVuY3Rpb24gKGxvc3RDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ha2VIdW1hblJlYWRhYmxlKGxvc3RDaGFuZ2VzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZWxlbWVudCgnPGRpdj5FcnJvcjogQ291bGQgbm90IHJlY292ZXIgbG9zdCBjaGFuZ2VzLjwvZGl2PicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgaGFuZGxpbmcgYWxsIGludGVyYWN0aW9uc1xuICogd2l0aCB0aGUgZXhwbG9yYXRpb24gZWRpdG9yIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9FZGl0YWJsZUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9SZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Mb2NhbFN0b3JhZ2VTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL3NlcnZpY2VzLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0V4cGxvcmF0aW9uRGF0YVNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRsb2cnLCAnJHEnLCAnJHdpbmRvdycsICdBbGVydHNTZXJ2aWNlJyxcbiAgICAnRWRpdGFibGVFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJywgJ0xvY2FsU3RvcmFnZVNlcnZpY2UnLFxuICAgICdSZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UnLCAnVXJsU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkbG9nLCAkcSwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgRWRpdGFibGVFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLCBMb2NhbFN0b3JhZ2VTZXJ2aWNlLCBSZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UsIFVybFNlcnZpY2UpIHtcbiAgICAgICAgLy8gVGhlIHBhdGhuYW1lICh3aXRob3V0IHRoZSBoYXNoKSBzaG91bGQgYmU6IC4uLi9jcmVhdGUve2V4cGxvcmF0aW9uX2lkfVxuICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9ICcnO1xuICAgICAgICB2YXIgZHJhZnRDaGFuZ2VMaXN0SWQgPSBudWxsO1xuICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKS5zcGxpdCgnLycpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhuYW1lQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnY3JlYXRlJykge1xuICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uSWQgPSBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICRsb2cuZXJyb3IoJ1VuZXhwZWN0ZWQgY2FsbCB0byBFeHBsb3JhdGlvbkRhdGFTZXJ2aWNlIGZvciBwYXRobmFtZSAnLCBwYXRobmFtZUFycmF5W2ldKTtcbiAgICAgICAgICAgIC8vIE5vdGU6IGlmIHdlIGRvIG5vdCByZXR1cm4gYW55dGhpbmcsIEthcm1hIHVuaXQgdGVzdHMgZmFpbC5cbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzb2x2ZWRBbnN3ZXJzVXJsUHJlZml4ID0gKCcvY3JlYXRlaGFuZGxlci9yZXNvbHZlZF9hbnN3ZXJzLycgKyBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgdmFyIGV4cGxvcmF0aW9uRHJhZnRBdXRvc2F2ZVVybCA9ICgnL2NyZWF0ZWhhbmRsZXIvYXV0b3NhdmVfZHJhZnQvJyArIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAvLyBQdXQgZXhwbG9yYXRpb24gdmFyaWFibGVzIGhlcmUuXG4gICAgICAgIHZhciBleHBsb3JhdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICBleHBsb3JhdGlvbklkOiBleHBsb3JhdGlvbklkLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGUgY2hhbmdlTGlzdCBpcyB0aGUgZnVsbCBjaGFuZ2VMaXN0IHNpbmNlIHRoZSBsYXN0XG4gICAgICAgICAgICAvLyBjb21taXR0ZWQgdmVyc2lvbiAoYXMgb3Bwb3NlZCB0byB0aGUgbW9zdCByZWNlbnQgYXV0b3NhdmUpLlxuICAgICAgICAgICAgYXV0b3NhdmVDaGFuZ2VMaXN0OiBmdW5jdGlvbiAoY2hhbmdlTGlzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjayA9PT0gdm9pZCAwKSB7IHN1Y2Nlc3NDYWxsYmFjayA9IGZ1bmN0aW9uIChyZXNwb25zZSkgeyB9OyB9XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2sgPT09IHZvaWQgMCkgeyBlcnJvckNhbGxiYWNrID0gZnVuY3Rpb24gKCkgeyB9OyB9XG4gICAgICAgICAgICAgICAgLy8gRmlyc3Qgc2F2ZSBsb2NhbGx5IHRvIGJlIHJldHJpZXZlZCBsYXRlciBpZiBzYXZlIGlzIHVuc3VjY2Vzc2Z1bC5cbiAgICAgICAgICAgICAgICBMb2NhbFN0b3JhZ2VTZXJ2aWNlLnNhdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQsIGNoYW5nZUxpc3QsIGRyYWZ0Q2hhbmdlTGlzdElkKTtcbiAgICAgICAgICAgICAgICAkaHR0cC5wdXQoZXhwbG9yYXRpb25EcmFmdEF1dG9zYXZlVXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZV9saXN0OiBjaGFuZ2VMaXN0LFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBleHBsb3JhdGlvbkRhdGEuZGF0YS52ZXJzaW9uXG4gICAgICAgICAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZHJhZnRDaGFuZ2VMaXN0SWQgPSByZXNwb25zZS5kYXRhLmRyYWZ0X2NoYW5nZV9saXN0X2lkO1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBjYW4gc2FmZWx5IHJlbW92ZSB0aGUgbG9jYWxseSBzYXZlZCBkcmFmdCBjb3B5IGlmIGl0IHdhcyBzYXZlZFxuICAgICAgICAgICAgICAgICAgICAvLyB0byB0aGUgYmFja2VuZC5cbiAgICAgICAgICAgICAgICAgICAgTG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzY2FyZERyYWZ0OiBmdW5jdGlvbiAoc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgJGh0dHAucG9zdChleHBsb3JhdGlvbkRyYWZ0QXV0b3NhdmVVcmwsIHt9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgTG9jYWxTdG9yYWdlU2VydmljZS5yZW1vdmVFeHBsb3JhdGlvbkRyYWZ0KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBwcm9taXNlIHRoYXQgc3VwcGxpZXMgdGhlIGRhdGEgZm9yIHRoZSBjdXJyZW50IGV4cGxvcmF0aW9uLlxuICAgICAgICAgICAgZ2V0RGF0YTogZnVuY3Rpb24gKGVycm9yQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwbG9yYXRpb25EYXRhLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5pbmZvKCdGb3VuZCBleHBsb3JhdGlvbiBkYXRhIGluIGNhY2hlLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShleHBsb3JhdGlvbkRhdGEuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXRyaWV2ZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgICAgICAgICAgICAgLy8gV0FSTklORzogTm90ZSB0aGF0IHRoaXMgaXMgYSB2ZXJzaW9uIG9mIHRoZSBleHBsb3JhdGlvbiB3aXRoIGRyYWZ0XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZXMgYXBwbGllZC4gVGhpcyBtYWtlcyBhIGZvcmNlLXJlZnJlc2ggbmVjZXNzYXJ5IHdoZW4gY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICAvLyBhcmUgZGlzY2FyZGVkLCBvdGhlcndpc2UgdGhlIGV4cGxvcmF0aW9uLXdpdGgtZHJhZnQtY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICAvLyAod2hpY2ggaXMgY2FjaGVkIGhlcmUpIHdpbGwgYmUgcmV1c2VkLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKEVkaXRhYmxlRXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZS5mZXRjaEFwcGx5RHJhZnRFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGxvZy5pbmZvKCdSZXRyaWV2ZWQgZXhwbG9yYXRpb24gZGF0YS4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuaW5mbyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFmdENoYW5nZUxpc3RJZCA9IHJlc3BvbnNlLmRyYWZ0X2NoYW5nZV9saXN0X2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25EYXRhLmRhdGEgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkcmFmdCA9IExvY2FsU3RvcmFnZVNlcnZpY2UuZ2V0RXhwbG9yYXRpb25EcmFmdChleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFmdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcmFmdC5pc1ZhbGlkKGRyYWZ0Q2hhbmdlTGlzdElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlTGlzdCA9IGRyYWZ0LmdldENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25EYXRhLmF1dG9zYXZlQ2hhbmdlTGlzdChjaGFuZ2VMaXN0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHJlbG9hZCBpcyBuZWVkZWQgc28gdGhhdCB0aGUgY2hhbmdlbGlzdCBqdXN0IHNhdmVkIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb2FkZWQgYXMgb3Bwb3NlZCB0byB0aGUgZXhwbG9yYXRpb24gcmV0dXJuZWQgYnkgdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXhwbG9yYXRpb25JZCwgZHJhZnQuZ2V0Q2hhbmdlcygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2Ugc3VwcGx5aW5nIHRoZSBsYXN0IHNhdmVkIHZlcnNpb24gZm9yIHRoZSBjdXJyZW50XG4gICAgICAgICAgICAvLyBleHBsb3JhdGlvbi5cbiAgICAgICAgICAgIGdldExhc3RTYXZlZERhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmxvYWRMYXRlc3RFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmluZm8oJ1JldHJpZXZlZCBzYXZlZCBleHBsb3JhdGlvbiBkYXRhLicpO1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmluZm8ocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZXhwbG9yYXRpb247XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzb2x2ZUFuc3dlcnM6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIHJlc29sdmVkQW5zd2Vyc0xpc3QpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAkaHR0cC5wdXQocmVzb2x2ZWRBbnN3ZXJzVXJsUHJlZml4ICsgJy8nICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0YXRlTmFtZSksIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRfYW5zd2VyczogcmVzb2x2ZWRBbnN3ZXJzTGlzdFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2F2ZXMgdGhlIGV4cGxvcmF0aW9uIHRvIHRoZSBiYWNrZW5kLCBhbmQsIG9uIGEgc3VjY2VzcyBjYWxsYmFjayxcbiAgICAgICAgICAgICAqIHVwZGF0ZXMgdGhlIGxvY2FsIGNvcHkgb2YgdGhlIGV4cGxvcmF0aW9uIGRhdGEuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gY2hhbmdlTGlzdCAtIFJlcHJlc2VudHMgdGhlIGNoYW5nZSBsaXN0IGZvclxuICAgICAgICAgICAgICogICB0aGlzIHNhdmUuIEVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCBpcyBhIGNvbW1hbmQgcmVwcmVzZW50aW5nIGFuXG4gICAgICAgICAgICAgKiAgIGVkaXRpbmcgYWN0aW9uIChzdWNoIGFzIGFkZCBzdGF0ZSwgZGVsZXRlIHN0YXRlLCBldGMuKS4gU2VlIHRoZVxuICAgICAgICAgICAgICogIF8nQ2hhbmdlJyBjbGFzcyBpbiBleHBfc2VydmljZXMucHkgZm9yIGZ1bGwgZG9jdW1lbnRhdGlvbi5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb21taXRNZXNzYWdlIC0gVGhlIHVzZXItZW50ZXJlZCBjb21taXQgbWVzc2FnZSBmb3JcbiAgICAgICAgICAgICAqICAgdGhpcyBzYXZlIG9wZXJhdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2F2ZTogZnVuY3Rpb24gKGNoYW5nZUxpc3QsIGNvbW1pdE1lc3NhZ2UsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIEVkaXRhYmxlRXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZS51cGRhdGVFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkLCBleHBsb3JhdGlvbkRhdGEuZGF0YS52ZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25EYXRhLmRhdGEgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3NDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmlzX3ZlcnNpb25fb2ZfZHJhZnRfdmFsaWQsIHJlc3BvbnNlLmRyYWZ0X2NoYW5nZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBleHBsb3JhdGlvbkRhdGE7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgZGF0YSBzZXJ2aWNlIHRoYXQgc3RvcmVzIHRoZSBuYW1lIG9mIHRoZSBleHBsb3JhdGlvbidzXG4gKiBpbml0aWFsIHN0YXRlLiBOT1RFOiBUaGlzIHNlcnZpY2UgZG9lcyBub3QgcGVyZm9ybSB2YWxpZGF0aW9uLiBVc2VycyBvZiB0aGlzXG4gKiBzZXJ2aWNlIHNob3VsZCBlbnN1cmUgdGhhdCBuZXcgaW5pdGlhbCBzdGF0ZSBuYW1lcyBwYXNzZWQgdG8gdGhlIHNlcnZpY2UgYXJlXG4gKiB2YWxpZC5cbiAqL1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvZXhwbG9yYXRpb24tcHJvcGVydHkuc2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZScsIFtcbiAgICAnRXhwbG9yYXRpb25Qcm9wZXJ0eVNlcnZpY2UnLCBmdW5jdGlvbiAoRXhwbG9yYXRpb25Qcm9wZXJ0eVNlcnZpY2UpIHtcbiAgICAgICAgdmFyIGNoaWxkID0gT2JqZWN0LmNyZWF0ZShFeHBsb3JhdGlvblByb3BlcnR5U2VydmljZSk7XG4gICAgICAgIGNoaWxkLnByb3BlcnR5TmFtZSA9ICdpbml0X3N0YXRlX25hbWUnO1xuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2VzIGZvciBzdG9yaW5nIGV4cGxvcmF0aW9uIHByb3BlcnRpZXMgZm9yXG4gKiBkaXNwbGF5aW5nIGFuZCBlZGl0aW5nIHRoZW0gaW4gbXVsdGlwbGUgcGxhY2VzIGluIHRoZSBVSSxcbiAqIHdpdGggYmFzZSBjbGFzcyBhcyBFeHBsb3JhdGlvblByb3BlcnR5U2VydmljZS5cbiAqL1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2VydmljZXMvY2hhbmdlLWxpc3Quc2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRXhwbG9yYXRpb25Qcm9wZXJ0eVNlcnZpY2UnLCBbXG4gICAgJyRsb2cnLCAnJHJvb3RTY29wZScsICdBbGVydHNTZXJ2aWNlJywgJ0NoYW5nZUxpc3RTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGxvZywgJHJvb3RTY29wZSwgQWxlcnRzU2VydmljZSwgQ2hhbmdlTGlzdFNlcnZpY2UpIHtcbiAgICAgICAgLy8gUHVibGljIGJhc2UgQVBJIGZvciBkYXRhIHNlcnZpY2VzIGNvcnJlc3BvbmRpbmcgdG8gZXhwbG9yYXRpb24gcHJvcGVydGllc1xuICAgICAgICAvLyAodGl0bGUsIGNhdGVnb3J5LCBldGMuKVxuICAgICAgICB2YXIgQkFDS0VORF9DT05WRVJTSU9OUyA9IHtcbiAgICAgICAgICAgIHBhcmFtX2NoYW5nZXM6IGZ1bmN0aW9uIChwYXJhbUNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1DaGFuZ2VzLm1hcChmdW5jdGlvbiAocGFyYW1DaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtQ2hhbmdlLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJhbV9zcGVjczogZnVuY3Rpb24gKHBhcmFtU3BlY3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1TcGVjcy50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydHlOYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdFeHBsb3JhdGlvbiBwcm9wZXJ0eSBuYW1lIGNhbm5vdCBiZSBudWxsLic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRsb2cuaW5mbygnSW5pdGlhbGl6aW5nIGV4cGxvcmF0aW9uICcgKyB0aGlzLnByb3BlcnR5TmFtZSArICc6JywgdmFsdWUpO1xuICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSAod2hpY2ggbWF5IG5vdCBoYXZlIGJlZW4gc2F2ZWQgdG9cbiAgICAgICAgICAgICAgICAvLyB0aGUgZnJvbnRlbmQgeWV0KS4gSW4gZ2VuZXJhbCwgdGhpcyB3aWxsIGJlIGJvdW5kIGRpcmVjdGx5IHRvIHRoZSBVSS5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IGFuZ3VsYXIuY29weSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHByZXZpb3VzIChzYXZlZC1pbi10aGUtZnJvbnRlbmQpIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eS4gSGVyZSxcbiAgICAgICAgICAgICAgICAvLyAnc2F2ZWQnIG1lYW5zIHRoYXQgdGhpcyBpcyB0aGUgbGF0ZXN0IHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSBhc1xuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZWQgYnkgdGhlIGZyb250ZW5kIGNoYW5nZSBsaXN0LlxuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZWRNZW1lbnRvID0gYW5ndWxhci5jb3B5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V4cGxvcmF0aW9uUHJvcGVydHlDaGFuZ2VkJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyB3aGV0aGVyIHRoZSBjdXJyZW50IHZhbHVlIGhhcyBjaGFuZ2VkIGZyb20gdGhlIG1lbWVudG8uXG4gICAgICAgICAgICBoYXNDaGFuZ2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFhbmd1bGFyLmVxdWFscyh0aGlzLnNhdmVkTWVtZW50bywgdGhpcy5kaXNwbGF5ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoZSBiYWNrZW5kIG5hbWUgZm9yIHRoaXMgcHJvcGVydHkuIFRISVMgTVVTVCBCRSBTUEVDSUZJRUQgQllcbiAgICAgICAgICAgIC8vIFNVQkNMQVNTRVMuXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IG51bGwsXG4gICAgICAgICAgICAvLyBUcmFuc2Zvcm1zIHRoZSBnaXZlbiB2YWx1ZSBpbnRvIGEgbm9ybWFsaXplZCBmb3JtLiBUSElTIENBTiBCRVxuICAgICAgICAgICAgLy8gT1ZFUlJJRERFTiBCWSBTVUJDTEFTU0VTLiBUaGUgZGVmYXVsdCBiZWhhdmlvciBpcyB0byBkbyBub3RoaW5nLlxuICAgICAgICAgICAgX25vcm1hbGl6ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlcyB0aGUgZ2l2ZW4gdmFsdWUgYW5kIHJldHVybnMgYSBib29sZWFuIHN0YXRpbmcgd2hldGhlciBpdFxuICAgICAgICAgICAgLy8gaXMgdmFsaWQgb3Igbm90LiBUSElTIENBTiBCRSBPVkVSUklEREVOIEJZIFNVQkNMQVNTRVMuIFRoZSBkZWZhdWx0XG4gICAgICAgICAgICAvLyBiZWhhdmlvciBpcyB0byBhbHdheXMgcmV0dXJuIHRydWUuXG4gICAgICAgICAgICBfaXNWYWxpZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTm9ybWFsaXplcyB0aGUgZGlzcGxheWVkIHZhbHVlLiBUaGVuLCBpZiB0aGUgbWVtZW50byBhbmQgdGhlIGRpc3BsYXllZFxuICAgICAgICAgICAgLy8gdmFsdWUgYXJlIHRoZSBzYW1lLCBkb2VzIG5vdGhpbmcuIE90aGVyd2lzZSwgY3JlYXRlcyBhIG5ldyBlbnRyeSBpbiB0aGVcbiAgICAgICAgICAgIC8vIGNoYW5nZSBsaXN0LCBhbmQgdXBkYXRlcyB0aGUgbWVtZW50byB0byB0aGUgZGlzcGxheWVkIHZhbHVlLlxuICAgICAgICAgICAgc2F2ZURpc3BsYXllZFZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcGVydHlOYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdFeHBsb3JhdGlvbiBwcm9wZXJ0eSBuYW1lIGNhbm5vdCBiZSBudWxsLic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheWVkID0gdGhpcy5fbm9ybWFsaXplKHRoaXMuZGlzcGxheWVkKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQodGhpcy5kaXNwbGF5ZWQpIHx8ICF0aGlzLmhhc0NoYW5nZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmVGcm9tTWVtZW50bygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmVxdWFscyh0aGlzLmRpc3BsYXllZCwgdGhpcy5zYXZlZE1lbWVudG8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0JhY2tlbmRWYWx1ZSA9IGFuZ3VsYXIuY29weSh0aGlzLmRpc3BsYXllZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEJhY2tlbmRWYWx1ZSA9IGFuZ3VsYXIuY29weSh0aGlzLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICAgICAgaWYgKEJBQ0tFTkRfQ09OVkVSU0lPTlMuaGFzT3duUHJvcGVydHkodGhpcy5wcm9wZXJ0eU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0JhY2tlbmRWYWx1ZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBCQUNLRU5EX0NPTlZFUlNJT05TW3RoaXMucHJvcGVydHlOYW1lXSh0aGlzLmRpc3BsYXllZCk7XG4gICAgICAgICAgICAgICAgICAgIG9sZEJhY2tlbmRWYWx1ZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBCQUNLRU5EX0NPTlZFUlNJT05TW3RoaXMucHJvcGVydHlOYW1lXSh0aGlzLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIENoYW5nZUxpc3RTZXJ2aWNlLmVkaXRFeHBsb3JhdGlvblByb3BlcnR5KHRoaXMucHJvcGVydHlOYW1lLCBuZXdCYWNrZW5kVmFsdWUsIG9sZEJhY2tlbmRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlZE1lbWVudG8gPSBhbmd1bGFyLmNvcHkodGhpcy5kaXNwbGF5ZWQpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZXhwbG9yYXRpb25Qcm9wZXJ0eUNoYW5nZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXZlcnRzIHRoZSBkaXNwbGF5ZWQgdmFsdWUgdG8gdGhlIHNhdmVkIG1lbWVudG8uXG4gICAgICAgICAgICByZXN0b3JlRnJvbU1lbWVudG86IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXllZCA9IGFuZ3VsYXIuY29weSh0aGlzLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERhdGEgc2VydmljZSBmb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgZXhwbG9yYXRpb24ncyBzdGF0ZXMuXG4gKiBOb3RlIHRoYXQgdGhpcyBpcyB1bmxpa2UgdGhlIG90aGVyIGV4cGxvcmF0aW9uIHByb3BlcnR5IHNlcnZpY2VzLCBpbiB0aGF0IGl0XG4gKiBrZWVwcyBubyBtZW1lbnRvcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL1N0YXRlc09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9ub3JtYWxpemUtd2hpdGVzcGFjZS5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2FuZ3VsYXItbmFtZS5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy9jaGFuZ2UtbGlzdC5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy8nICtcbiAgICAnZXhwbG9yYXRpb24taW5pdC1zdGF0ZS1uYW1lLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2VkaXRvci10YWIvc2VydmljZXMvJyArXG4gICAgJ3NvbHV0aW9uLXZhbGlkaXR5LnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL3NlcnZpY2VzL2Fuc3dlci1jbGFzc2lmaWNhdGlvbi5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3ItcHJvcGVydGllcy1zZXJ2aWNlcy8nICtcbiAgICAnc3RhdGUtZWRpdG9yLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9WYWxpZGF0b3JzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlJywgW1xuICAgICckZmlsdGVyJywgJyRpbmplY3RvcicsICckbG9jYXRpb24nLCAnJHEnLCAnJHJvb3RTY29wZScsICckdWliTW9kYWwnLFxuICAgICdBbGVydHNTZXJ2aWNlJywgJ0FuZ3VsYXJOYW1lU2VydmljZScsICdBbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UnLFxuICAgICdDaGFuZ2VMaXN0U2VydmljZScsICdDb250ZXh0U2VydmljZScsICdFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlJyxcbiAgICAnU29sdXRpb25WYWxpZGl0eVNlcnZpY2UnLCAnU3RhdGVFZGl0b3JTZXJ2aWNlJywgJ1N0YXRlc09iamVjdEZhY3RvcnknLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdWYWxpZGF0b3JzU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRmaWx0ZXIsICRpbmplY3RvciwgJGxvY2F0aW9uLCAkcSwgJHJvb3RTY29wZSwgJHVpYk1vZGFsLCBBbGVydHNTZXJ2aWNlLCBBbmd1bGFyTmFtZVNlcnZpY2UsIEFuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZSwgQ2hhbmdlTGlzdFNlcnZpY2UsIENvbnRleHRTZXJ2aWNlLCBFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLCBTb2x1dGlvblZhbGlkaXR5U2VydmljZSwgU3RhdGVFZGl0b3JTZXJ2aWNlLCBTdGF0ZXNPYmplY3RGYWN0b3J5LCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgVmFsaWRhdG9yc1NlcnZpY2UpIHtcbiAgICAgICAgdmFyIF9zdGF0ZXMgPSBudWxsO1xuICAgICAgICB2YXIgc3RhdGVBZGRlZENhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgc3RhdGVEZWxldGVkQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHZhciBzdGF0ZVJlbmFtZWRDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIHN0YXRlSW50ZXJhY3Rpb25TYXZlZENhbGxiYWNrcyA9IFtdO1xuICAgICAgICAvLyBQcm9wZXJ0aWVzIHRoYXQgaGF2ZSBhIGRpZmZlcmVudCBiYWNrZW5kIHJlcHJlc2VudGF0aW9uIGZyb20gdGhlXG4gICAgICAgIC8vIGZyb250ZW5kIGFuZCBtdXN0IGJlIGNvbnZlcnRlZC5cbiAgICAgICAgdmFyIEJBQ0tFTkRfQ09OVkVSU0lPTlMgPSB7XG4gICAgICAgICAgICBhbnN3ZXJfZ3JvdXBzOiBmdW5jdGlvbiAoYW5zd2VyR3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuc3dlckdyb3Vwcy5tYXAoZnVuY3Rpb24gKGFuc3dlckdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbnN3ZXJHcm91cC50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udGVudDogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudC50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVjb3JkZWRfdm9pY2VvdmVyczogZnVuY3Rpb24gKHJlY29yZGVkVm9pY2VvdmVycykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmRlZFZvaWNlb3ZlcnMudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlZmF1bHRfb3V0Y29tZTogZnVuY3Rpb24gKGRlZmF1bHRPdXRjb21lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRlZmF1bHRPdXRjb21lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0T3V0Y29tZS50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGludHM6IGZ1bmN0aW9uIChoaW50cykge1xuICAgICAgICAgICAgICAgIHJldHVybiBoaW50cy5tYXAoZnVuY3Rpb24gKGhpbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhpbnQudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhcmFtX2NoYW5nZXM6IGZ1bmN0aW9uIChwYXJhbUNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1DaGFuZ2VzLm1hcChmdW5jdGlvbiAocGFyYW1DaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtQ2hhbmdlLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJhbV9zcGVjczogZnVuY3Rpb24gKHBhcmFtU3BlY3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1TcGVjcy50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc29sdXRpb246IGZ1bmN0aW9uIChzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb24udG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdyaXR0ZW5fdHJhbnNsYXRpb25zOiBmdW5jdGlvbiAod3JpdHRlblRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgICAgIHJldHVybiB3cml0dGVuVHJhbnNsYXRpb25zLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8gTWFwcyBiYWNrZW5kIG5hbWVzIHRvIHRoZSBjb3JyZXNwb25kaW5nIGZyb250ZW5kIGRpY3QgYWNjZXNzb3IgbGlzdHMuXG4gICAgICAgIHZhciBQUk9QRVJUWV9SRUZfREFUQSA9IHtcbiAgICAgICAgICAgIGFuc3dlcl9ncm91cHM6IFsnaW50ZXJhY3Rpb24nLCAnYW5zd2VyR3JvdXBzJ10sXG4gICAgICAgICAgICBjb25maXJtZWRfdW5jbGFzc2lmaWVkX2Fuc3dlcnM6IFtcbiAgICAgICAgICAgICAgICAnaW50ZXJhY3Rpb24nLCAnY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycydcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBjb250ZW50OiBbJ2NvbnRlbnQnXSxcbiAgICAgICAgICAgIHJlY29yZGVkX3ZvaWNlb3ZlcnM6IFsncmVjb3JkZWRWb2ljZW92ZXJzJ10sXG4gICAgICAgICAgICBkZWZhdWx0X291dGNvbWU6IFsnaW50ZXJhY3Rpb24nLCAnZGVmYXVsdE91dGNvbWUnXSxcbiAgICAgICAgICAgIHBhcmFtX2NoYW5nZXM6IFsncGFyYW1DaGFuZ2VzJ10sXG4gICAgICAgICAgICBwYXJhbV9zcGVjczogWydwYXJhbVNwZWNzJ10sXG4gICAgICAgICAgICBoaW50czogWydpbnRlcmFjdGlvbicsICdoaW50cyddLFxuICAgICAgICAgICAgc29saWNpdF9hbnN3ZXJfZGV0YWlsczogWydzb2xpY2l0QW5zd2VyRGV0YWlscyddLFxuICAgICAgICAgICAgc29sdXRpb246IFsnaW50ZXJhY3Rpb24nLCAnc29sdXRpb24nXSxcbiAgICAgICAgICAgIHdpZGdldF9pZDogWydpbnRlcmFjdGlvbicsICdpZCddLFxuICAgICAgICAgICAgd2lkZ2V0X2N1c3RvbWl6YXRpb25fYXJnczogWydpbnRlcmFjdGlvbicsICdjdXN0b21pemF0aW9uQXJncyddLFxuICAgICAgICAgICAgd3JpdHRlbl90cmFuc2xhdGlvbnM6IFsnd3JpdHRlblRyYW5zbGF0aW9ucyddXG4gICAgICAgIH07XG4gICAgICAgIHZhciBDT05URU5UX0lEX0VYVFJBQ1RPUlMgPSB7XG4gICAgICAgICAgICBhbnN3ZXJfZ3JvdXBzOiBmdW5jdGlvbiAoYW5zd2VyR3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgYW5zd2VyR3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGFuc3dlckdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZHMuYWRkKGFuc3dlckdyb3VwLm91dGNvbWUuZmVlZGJhY2suZ2V0Q29udGVudElkKCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50SWRzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlZmF1bHRfb3V0Y29tZTogZnVuY3Rpb24gKGRlZmF1bHRPdXRjb21lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHMgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGRlZmF1bHRPdXRjb21lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZHMuYWRkKGRlZmF1bHRPdXRjb21lLmZlZWRiYWNrLmdldENvbnRlbnRJZCgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRJZHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGludHM6IGZ1bmN0aW9uIChoaW50cykge1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50SWRzID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIGhpbnRzLmZvckVhY2goZnVuY3Rpb24gKGhpbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudElkcy5hZGQoaGludC5oaW50Q29udGVudC5nZXRDb250ZW50SWQoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRJZHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc29sdXRpb246IGZ1bmN0aW9uIChzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50SWRzID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50SWRzLmFkZChzb2x1dGlvbi5leHBsYW5hdGlvbi5nZXRDb250ZW50SWQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50SWRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEVsZW1lbnRzSW5GaXJzdFNldEJ1dE5vdEluU2Vjb25kID0gZnVuY3Rpb24gKHNldEEsIHNldEIpIHtcbiAgICAgICAgICAgIHZhciBkaWZmTGlzdCA9IEFycmF5LmZyb20oc2V0QSkuZmlsdGVyKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFzZXRCLmhhcyhlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGRpZmZMaXN0O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NldFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlTmFtZSwgc3RhdGVEYXRhLCByZWZyZXNoR3JhcGgpIHtcbiAgICAgICAgICAgIF9zdGF0ZXMuc2V0U3RhdGUoc3RhdGVOYW1lLCBhbmd1bGFyLmNvcHkoc3RhdGVEYXRhKSk7XG4gICAgICAgICAgICBpZiAocmVmcmVzaEdyYXBoKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoR3JhcGgnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvID0gZnVuY3Rpb24gKHN0YXRlTmFtZSwgYmFja2VuZE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBhY2Nlc3Nvckxpc3QgPSBQUk9QRVJUWV9SRUZfREFUQVtiYWNrZW5kTmFtZV07XG4gICAgICAgICAgICB2YXIgcHJvcGVydHlSZWYgPSBfc3RhdGVzLmdldFN0YXRlKHN0YXRlTmFtZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGFjY2Vzc29yTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlSZWYgPSBwcm9wZXJ0eVJlZltrZXldO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWRkaXRpb25hbEluZm8gPSAoJ1xcblVuZGVmaW5lZCBzdGF0ZXMgZXJyb3IgZGVidWcgbG9nczonICtcbiAgICAgICAgICAgICAgICAgICAgJ1xcblJlcXVlc3RlZCBzdGF0ZSBuYW1lOiAnICsgc3RhdGVOYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJ1xcbkV4cGxvcmF0aW9uIElEOiAnICsgQ29udGV4dFNlcnZpY2UuZ2V0RXhwbG9yYXRpb25JZCgpICtcbiAgICAgICAgICAgICAgICAgICAgJ1xcbkNoYW5nZSBsaXN0OiAnICsgSlNPTi5zdHJpbmdpZnkoQ2hhbmdlTGlzdFNlcnZpY2UuZ2V0Q2hhbmdlTGlzdCgpKSArXG4gICAgICAgICAgICAgICAgICAgICdcXG5BbGwgc3RhdGVzIG5hbWVzOiAnICsgX3N0YXRlcy5nZXRTdGF0ZU5hbWVzKCkpO1xuICAgICAgICAgICAgICAgIGUubWVzc2FnZSArPSBhZGRpdGlvbmFsSW5mbztcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShwcm9wZXJ0eVJlZik7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBzYXZlU3RhdGVQcm9wZXJ0eSA9IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIGJhY2tlbmROYW1lLCBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCBiYWNrZW5kTmFtZSk7XG4gICAgICAgICAgICB2YXIgbmV3QmFja2VuZFZhbHVlID0gYW5ndWxhci5jb3B5KG5ld1ZhbHVlKTtcbiAgICAgICAgICAgIHZhciBvbGRCYWNrZW5kVmFsdWUgPSBhbmd1bGFyLmNvcHkob2xkVmFsdWUpO1xuICAgICAgICAgICAgaWYgKEJBQ0tFTkRfQ09OVkVSU0lPTlMuaGFzT3duUHJvcGVydHkoYmFja2VuZE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgbmV3QmFja2VuZFZhbHVlID0gY29udmVydFRvQmFja2VuZFJlcHJlc2VudGF0aW9uKG5ld1ZhbHVlLCBiYWNrZW5kTmFtZSk7XG4gICAgICAgICAgICAgICAgb2xkQmFja2VuZFZhbHVlID0gY29udmVydFRvQmFja2VuZFJlcHJlc2VudGF0aW9uKG9sZFZhbHVlLCBiYWNrZW5kTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuZXF1YWxzKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBDaGFuZ2VMaXN0U2VydmljZS5lZGl0U3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsIGJhY2tlbmROYW1lLCBuZXdCYWNrZW5kVmFsdWUsIG9sZEJhY2tlbmRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1N0YXRlRGF0YSA9IF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB2YXIgYWNjZXNzb3JMaXN0ID0gUFJPUEVSVFlfUkVGX0RBVEFbYmFja2VuZE5hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChDT05URU5UX0lEX0VYVFJBQ1RPUlMuaGFzT3duUHJvcGVydHkoYmFja2VuZE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRDb250ZW50SWRzID0gQ09OVEVOVF9JRF9FWFRSQUNUT1JTW2JhY2tlbmROYW1lXShvbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdDb250ZW50SWRzID0gQ09OVEVOVF9JRF9FWFRSQUNUT1JTW2JhY2tlbmROYW1lXShuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50SWRzVG9EZWxldGUgPSBfZ2V0RWxlbWVudHNJbkZpcnN0U2V0QnV0Tm90SW5TZWNvbmQob2xkQ29udGVudElkcywgbmV3Q29udGVudElkcyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50SWRzVG9BZGQgPSBfZ2V0RWxlbWVudHNJbkZpcnN0U2V0QnV0Tm90SW5TZWNvbmQobmV3Q29udGVudElkcywgb2xkQ29udGVudElkcyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZHNUb0RlbGV0ZS5mb3JFYWNoKGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlRGF0YS5yZWNvcmRlZFZvaWNlb3ZlcnMuZGVsZXRlQ29udGVudElkKGNvbnRlbnRJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdTdGF0ZURhdGEud3JpdHRlblRyYW5zbGF0aW9ucy5kZWxldGVDb250ZW50SWQoY29udGVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZHNUb0FkZC5mb3JFYWNoKGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1N0YXRlRGF0YS5yZWNvcmRlZFZvaWNlb3ZlcnMuYWRkQ29udGVudElkKGNvbnRlbnRJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdTdGF0ZURhdGEud3JpdHRlblRyYW5zbGF0aW9ucy5hZGRDb250ZW50SWQoY29udGVudElkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVJlZiA9IG5ld1N0YXRlRGF0YTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjY2Vzc29yTGlzdC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlSZWYgPSBwcm9wZXJ0eVJlZlthY2Nlc3Nvckxpc3RbaV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcm9wZXJ0eVJlZlthY2Nlc3Nvckxpc3RbYWNjZXNzb3JMaXN0Lmxlbmd0aCAtIDFdXSA9IGFuZ3VsYXIuY29weShuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgLy8gV2UgZG8gbm90IHJlZnJlc2ggdGhlIHN0YXRlIGVkaXRvciBpbW1lZGlhdGVseSBhZnRlciB0aGUgaW50ZXJhY3Rpb25cbiAgICAgICAgICAgICAgICAvLyBpZCBhbG9uZSBpcyBzYXZlZCwgYmVjYXVzZSB0aGUgY3VzdG9taXphdGlvbiBhcmdzIGRpY3Qgd2lsbCBiZVxuICAgICAgICAgICAgICAgIC8vIHRlbXBvcmFyaWx5IGludmFsaWQuIEEgY2hhbmdlIGluIGludGVyYWN0aW9uIGlkIHdpbGwgYWx3YXlzIGVudGFpbFxuICAgICAgICAgICAgICAgIC8vIGEgY2hhbmdlIGluIHRoZSBjdXN0b21pemF0aW9uIGFyZ3MgZGljdCBhbnl3YXksIHNvIHRoZSBncmFwaCB3aWxsXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHJlZnJlc2hlZCBhZnRlciBib3RoIHByb3BlcnRpZXMgaGF2ZSBiZWVuIHVwZGF0ZWQuXG4gICAgICAgICAgICAgICAgdmFyIHJlZnJlc2hHcmFwaCA9IChiYWNrZW5kTmFtZSAhPT0gJ3dpZGdldF9pZCcpO1xuICAgICAgICAgICAgICAgIF9zZXRTdGF0ZShzdGF0ZU5hbWUsIG5ld1N0YXRlRGF0YSwgcmVmcmVzaEdyYXBoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNvbnZlcnRUb0JhY2tlbmRSZXByZXNlbnRhdGlvbiA9IGZ1bmN0aW9uIChmcm9udGVuZFZhbHVlLCBiYWNrZW5kTmFtZSkge1xuICAgICAgICAgICAgdmFyIGNvbnZlcnNpb25GdW5jdGlvbiA9IEJBQ0tFTkRfQ09OVkVSU0lPTlNbYmFja2VuZE5hbWVdO1xuICAgICAgICAgICAgcmV0dXJuIGNvbnZlcnNpb25GdW5jdGlvbihmcm9udGVuZFZhbHVlKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyhzbGwpOiBBZGQgdW5pdCB0ZXN0cyBmb3IgYWxsIGdldC9zYXZlIG1ldGhvZHMuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGVzQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgICAgICBfc3RhdGVzID0gU3RhdGVzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc3RhdGVzQmFja2VuZERpY3QpO1xuICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLlxuICAgICAgICAgICAgICAgIFNvbHV0aW9uVmFsaWRpdHlTZXJ2aWNlLmluaXQoX3N0YXRlcy5nZXRTdGF0ZU5hbWVzKCkpO1xuICAgICAgICAgICAgICAgIF9zdGF0ZXMuZ2V0U3RhdGVOYW1lcygpLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc29sdXRpb24gPSBfc3RhdGVzLmdldFN0YXRlKHN0YXRlTmFtZSkuaW50ZXJhY3Rpb24uc29sdXRpb247XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IChBbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UuZ2V0TWF0Y2hpbmdDbGFzc2lmaWNhdGlvblJlc3VsdChzdGF0ZU5hbWUsIF9zdGF0ZXMuZ2V0U3RhdGUoc3RhdGVOYW1lKS5pbnRlcmFjdGlvbiwgc29sdXRpb24uY29ycmVjdEFuc3dlciwgJGluamVjdG9yLmdldChBbmd1bGFyTmFtZVNlcnZpY2UuZ2V0TmFtZU9mSW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UoX3N0YXRlcy5nZXRTdGF0ZShzdGF0ZU5hbWUpLmludGVyYWN0aW9uLmlkKSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzb2x1dGlvbklzVmFsaWQgPSBzdGF0ZU5hbWUgIT09IHJlc3VsdC5vdXRjb21lLmRlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBTb2x1dGlvblZhbGlkaXR5U2VydmljZS51cGRhdGVWYWxpZGl0eShzdGF0ZU5hbWUsIHNvbHV0aW9uSXNWYWxpZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdGF0ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KF9zdGF0ZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0YXRlTmFtZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0YXRlcy5nZXRTdGF0ZU5hbWVzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzU3RhdGU6IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0YXRlcy5oYXNTdGF0ZShzdGF0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0YXRlOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShfc3RhdGVzLmdldFN0YXRlKHN0YXRlTmFtZSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldFN0YXRlOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBzdGF0ZURhdGEpIHtcbiAgICAgICAgICAgICAgICBfc2V0U3RhdGUoc3RhdGVOYW1lLCBzdGF0ZURhdGEsIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzTmV3U3RhdGVOYW1lVmFsaWQ6IGZ1bmN0aW9uIChuZXdTdGF0ZU5hbWUsIHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgIGlmIChfc3RhdGVzLmhhc1N0YXRlKG5ld1N0YXRlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdBIHN0YXRlIHdpdGggdGhpcyBuYW1lIGFscmVhZHkgZXhpc3RzLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIChWYWxpZGF0b3JzU2VydmljZS5pc1ZhbGlkU3RhdGVOYW1lKG5ld1N0YXRlTmFtZSwgc2hvd1dhcm5pbmdzKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RhdGVDb250ZW50TWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdjb250ZW50Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZVN0YXRlQ29udGVudDogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3Q29udGVudCkge1xuICAgICAgICAgICAgICAgIHNhdmVTdGF0ZVByb3BlcnR5KHN0YXRlTmFtZSwgJ2NvbnRlbnQnLCBuZXdDb250ZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdGF0ZVBhcmFtQ2hhbmdlc01lbWVudG86IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCAncGFyYW1fY2hhbmdlcycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVTdGF0ZVBhcmFtQ2hhbmdlczogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3UGFyYW1DaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgc2F2ZVN0YXRlUHJvcGVydHkoc3RhdGVOYW1lLCAncGFyYW1fY2hhbmdlcycsIG5ld1BhcmFtQ2hhbmdlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SW50ZXJhY3Rpb25JZE1lbWVudG86IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCAnd2lkZ2V0X2lkJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUludGVyYWN0aW9uSWQ6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIG5ld0ludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICd3aWRnZXRfaWQnLCBuZXdJbnRlcmFjdGlvbklkKTtcbiAgICAgICAgICAgICAgICBzdGF0ZUludGVyYWN0aW9uU2F2ZWRDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbnRlcmFjdGlvbkN1c3RvbWl6YXRpb25BcmdzTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICd3aWRnZXRfY3VzdG9taXphdGlvbl9hcmdzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3M6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIG5ld0N1c3RvbWl6YXRpb25BcmdzKSB7XG4gICAgICAgICAgICAgICAgc2F2ZVN0YXRlUHJvcGVydHkoc3RhdGVOYW1lLCAnd2lkZ2V0X2N1c3RvbWl6YXRpb25fYXJncycsIG5ld0N1c3RvbWl6YXRpb25BcmdzKTtcbiAgICAgICAgICAgICAgICBzdGF0ZUludGVyYWN0aW9uU2F2ZWRDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbnRlcmFjdGlvbkFuc3dlckdyb3Vwc01lbWVudG86IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCAnYW5zd2VyX2dyb3VwcycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVJbnRlcmFjdGlvbkFuc3dlckdyb3VwczogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3QW5zd2VyR3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgc2F2ZVN0YXRlUHJvcGVydHkoc3RhdGVOYW1lLCAnYW5zd2VyX2dyb3VwcycsIG5ld0Fuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgc3RhdGVJbnRlcmFjdGlvblNhdmVkQ2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2Vyc01lbWVudG86IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCAnY29uZmlybWVkX3VuY2xhc3NpZmllZF9hbnN3ZXJzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnM6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIG5ld0Fuc3dlcnMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdjb25maXJtZWRfdW5jbGFzc2lmaWVkX2Fuc3dlcnMnLCBuZXdBbnN3ZXJzKTtcbiAgICAgICAgICAgICAgICBzdGF0ZUludGVyYWN0aW9uU2F2ZWRDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRJbnRlcmFjdGlvbkRlZmF1bHRPdXRjb21lTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdkZWZhdWx0X291dGNvbWUnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlSW50ZXJhY3Rpb25EZWZhdWx0T3V0Y29tZTogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3RGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdkZWZhdWx0X291dGNvbWUnLCBuZXdEZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGludHNNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ2hpbnRzJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZUhpbnRzOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdIaW50cykge1xuICAgICAgICAgICAgICAgIHNhdmVTdGF0ZVByb3BlcnR5KHN0YXRlTmFtZSwgJ2hpbnRzJywgbmV3SGludHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFNvbHV0aW9uTWVtZW50bzogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRTdGF0ZVByb3BlcnR5TWVtZW50byhzdGF0ZU5hbWUsICdzb2x1dGlvbicpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVTb2x1dGlvbjogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3U29sdXRpb24pIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdzb2x1dGlvbicsIG5ld1NvbHV0aW9uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRSZWNvcmRlZFZvaWNlb3ZlcnNNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ3JlY29yZGVkX3ZvaWNlb3ZlcnMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzYXZlUmVjb3JkZWRWb2ljZW92ZXJzOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBuZXdSZWNvcmRlZFZvaWNlb3ZlcnMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdyZWNvcmRlZF92b2ljZW92ZXJzJywgbmV3UmVjb3JkZWRWb2ljZW92ZXJzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTb2xpY2l0QW5zd2VyRGV0YWlsc01lbWVudG86IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0U3RhdGVQcm9wZXJ0eU1lbWVudG8oc3RhdGVOYW1lLCAnc29saWNpdF9hbnN3ZXJfZGV0YWlscycpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNhdmVTb2xpY2l0QW5zd2VyRGV0YWlsczogZnVuY3Rpb24gKHN0YXRlTmFtZSwgbmV3U29saWNpdEFuc3dlckRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICdzb2xpY2l0X2Fuc3dlcl9kZXRhaWxzJywgbmV3U29saWNpdEFuc3dlckRldGFpbHMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFdyaXR0ZW5UcmFuc2xhdGlvbnNNZW1lbnRvOiBmdW5jdGlvbiAoc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFN0YXRlUHJvcGVydHlNZW1lbnRvKHN0YXRlTmFtZSwgJ3dyaXR0ZW5fdHJhbnNsYXRpb25zJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2F2ZVdyaXR0ZW5UcmFuc2xhdGlvbnM6IGZ1bmN0aW9uIChzdGF0ZU5hbWUsIG5ld1dyaXR0ZW5UcmFuc2xhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGVQcm9wZXJ0eShzdGF0ZU5hbWUsICd3cml0dGVuX3RyYW5zbGF0aW9ucycsIG5ld1dyaXR0ZW5UcmFuc2xhdGlvbnMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5pdGlhbGl6ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3N0YXRlcyAhPT0gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRTdGF0ZTogZnVuY3Rpb24gKG5ld1N0YXRlTmFtZSwgc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGVOYW1lID0gJGZpbHRlcignbm9ybWFsaXplV2hpdGVzcGFjZScpKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFWYWxpZGF0b3JzU2VydmljZS5pc1ZhbGlkU3RhdGVOYW1lKG5ld1N0YXRlTmFtZSwgdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoX3N0YXRlcy5oYXNTdGF0ZShuZXdTdGF0ZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnQSBzdGF0ZSB3aXRoIHRoaXMgbmFtZSBhbHJlYWR5IGV4aXN0cy4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICBfc3RhdGVzLmFkZFN0YXRlKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgQ2hhbmdlTGlzdFNlcnZpY2UuYWRkU3RhdGUobmV3U3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICBzdGF0ZUFkZGVkQ2FsbGJhY2tzLmZvckVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoR3JhcGgnKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVTdGF0ZTogZnVuY3Rpb24gKGRlbGV0ZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgIHZhciBpbml0U3RhdGVOYW1lID0gRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZS5kaXNwbGF5ZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGRlbGV0ZVN0YXRlTmFtZSA9PT0gaW5pdFN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KCdUaGUgaW5pdGlhbCBzdGF0ZSBjYW4gbm90IGJlIGRlbGV0ZWQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghX3N0YXRlcy5oYXNTdGF0ZShkZWxldGVTdGF0ZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0gJ05vIHN0YXRlIHdpdGggbmFtZSAnICsgZGVsZXRlU3RhdGVOYW1lICsgJyBleGlzdHMuJztcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9lZGl0b3ItdGFiL3RlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtb2RhbC10ZW1wbGF0ZXMvY29uZmlybS1kZWxldGUtc3RhdGUtbW9kYWwudGVtcGxhdGUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmRlbGV0ZVN0YXRlV2FybmluZ1RleHQgPSAoJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhlIGNhcmQgXCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlU3RhdGVOYW1lICsgJ1wiPycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWFsbHlEZWxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zdGF0ZXMuZGVsZXRlU3RhdGUoZGVsZXRlU3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgQ2hhbmdlTGlzdFNlcnZpY2UuZGVsZXRlU3RhdGUoZGVsZXRlU3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFN0YXRlRWRpdG9yU2VydmljZS5nZXRBY3RpdmVTdGF0ZU5hbWUoKSA9PT0gZGVsZXRlU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZUVkaXRvclNlcnZpY2Uuc2V0QWN0aXZlU3RhdGVOYW1lKEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2Uuc2F2ZWRNZW1lbnRvKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzdGF0ZURlbGV0ZWRDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRlbGV0ZVN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2d1aS8nICsgU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZWZyZXNoR3JhcGgnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBlbnN1cmVzIHRoYXQgaWYgdGhlIGRlbGV0aW9uIGNoYW5nZXMgcnVsZXMgaW4gdGhlIGN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RhdGUsIHRoZXkgZ2V0IHVwZGF0ZWQgaW4gdGhlIHZpZXcuXG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncmVmcmVzaFN0YXRlRWRpdG9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVuYW1lU3RhdGU6IGZ1bmN0aW9uIChvbGRTdGF0ZU5hbWUsIG5ld1N0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlTmFtZSA9ICRmaWx0ZXIoJ25vcm1hbGl6ZVdoaXRlc3BhY2UnKShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIGlmICghVmFsaWRhdG9yc1NlcnZpY2UuaXNWYWxpZFN0YXRlTmFtZShuZXdTdGF0ZU5hbWUsIHRydWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9zdGF0ZXMuaGFzU3RhdGUobmV3U3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0Egc3RhdGUgd2l0aCB0aGlzIG5hbWUgYWxyZWFkeSBleGlzdHMuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgX3N0YXRlcy5yZW5hbWVTdGF0ZShvbGRTdGF0ZU5hbWUsIG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnNldEFjdGl2ZVN0YXRlTmFtZShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIFRoZSAncmVuYW1lIHN0YXRlJyBjb21tYW5kIG11c3QgY29tZSBiZWZvcmUgdGhlICdjaGFuZ2VcbiAgICAgICAgICAgICAgICAvLyBpbml0X3N0YXRlX25hbWUnIGNvbW1hbmQgaW4gdGhlIGNoYW5nZSBsaXN0LCBvdGhlcndpc2UgdGhlIGJhY2tlbmRcbiAgICAgICAgICAgICAgICAvLyB3aWxsIHJhaXNlIGFuIGVycm9yIGJlY2F1c2UgdGhlIG5ldyBpbml0aWFsIHN0YXRlIG5hbWUgZG9lcyBub3RcbiAgICAgICAgICAgICAgICAvLyBleGlzdC5cbiAgICAgICAgICAgICAgICBDaGFuZ2VMaXN0U2VydmljZS5yZW5hbWVTdGF0ZShuZXdTdGF0ZU5hbWUsIG9sZFN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgU29sdXRpb25WYWxpZGl0eVNlcnZpY2Uub25SZW5hbWVTdGF0ZShuZXdTdGF0ZU5hbWUsIG9sZFN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgLy8gQW1lbmQgaW5pdFN0YXRlTmFtZSBhcHByb3ByaWF0ZWx5LCBpZiBuZWNlc3NhcnkuIE5vdGUgdGhhdCB0aGlzXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBjb21lIGFmdGVyIHRoZSBzdGF0ZSByZW5hbWluZywgb3RoZXJ3aXNlIHNhdmluZyB3aWxsIGxlYWQgdG9cbiAgICAgICAgICAgICAgICAvLyBhIGNvbXBsYWludCB0aGF0IHRoZSBuZXcgbmFtZSBpcyBub3QgYSB2YWxpZCBzdGF0ZSBuYW1lLlxuICAgICAgICAgICAgICAgIGlmIChFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLmRpc3BsYXllZCA9PT0gb2xkU3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2UuZGlzcGxheWVkID0gbmV3U3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLnNhdmVEaXNwbGF5ZWRWYWx1ZShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdGF0ZVJlbmFtZWRDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sob2xkU3RhdGVOYW1lLCBuZXdTdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncmVmcmVzaEdyYXBoJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPblN0YXRlQWRkZWRDYWxsYmFjazogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVBZGRlZENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9uU3RhdGVEZWxldGVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHN0YXRlRGVsZXRlZENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9uU3RhdGVSZW5hbWVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHN0YXRlUmVuYW1lZENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9uU3RhdGVJbnRlcmFjdGlvblNhdmVkQ2FsbGJhY2s6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHN0YXRlSW50ZXJhY3Rpb25TYXZlZENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0aGF0IGhhbmRsZXMgcm91dGluZyBmb3IgdGhlIGV4cGxvcmF0aW9uIGVkaXRvciBwYWdlLlxuICovXG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zZXJ2aWNlcy8nICtcbiAgICAnZXhwbG9yYXRpb24taW5pdC1zdGF0ZS1uYW1lLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3NlcnZpY2VzL2V4cGxvcmF0aW9uLXN0YXRlcy5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdjb21wb25lbnRzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3ItcHJvcGVydGllcy1zZXJ2aWNlcy8nICtcbiAgICAnc3RhdGUtZWRpdG9yLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0V4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLnRzJyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdSb3V0ZXJTZXJ2aWNlJywgW1xuICAgICckaW50ZXJ2YWwnLCAnJGxvY2F0aW9uJywgJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCAnJHdpbmRvdycsXG4gICAgJ0V4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlJywgJ0V4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2UnLFxuICAgICdFeHBsb3JhdGlvblN0YXRlc1NlcnZpY2UnLCAnU3RhdGVFZGl0b3JTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGludGVydmFsLCAkbG9jYXRpb24sICRyb290U2NvcGUsICR0aW1lb3V0LCAkd2luZG93LCBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZSwgRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZSwgRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlLCBTdGF0ZUVkaXRvclNlcnZpY2UpIHtcbiAgICAgICAgdmFyIFRBQlMgPSB7XG4gICAgICAgICAgICBNQUlOOiB7IG5hbWU6ICdtYWluJywgcGF0aDogJy9tYWluJyB9LFxuICAgICAgICAgICAgVFJBTlNMQVRJT046IHsgbmFtZTogJ3RyYW5zbGF0aW9uJywgcGF0aDogJy90cmFuc2xhdGlvbicgfSxcbiAgICAgICAgICAgIFBSRVZJRVc6IHsgbmFtZTogJ3ByZXZpZXcnLCBwYXRoOiAnL3ByZXZpZXcnIH0sXG4gICAgICAgICAgICBTRVRUSU5HUzogeyBuYW1lOiAnc2V0dGluZ3MnLCBwYXRoOiAnL3NldHRpbmdzJyB9LFxuICAgICAgICAgICAgU1RBVFM6IHsgbmFtZTogJ3N0YXRzJywgcGF0aDogJy9zdGF0cycgfSxcbiAgICAgICAgICAgIElNUFJPVkVNRU5UUzogeyBuYW1lOiAnaW1wcm92ZW1lbnRzJywgcGF0aDogJy9pbXByb3ZlbWVudHMnIH0sXG4gICAgICAgICAgICBISVNUT1JZOiB7IG5hbWU6ICdoaXN0b3J5JywgcGF0aDogJy9oaXN0b3J5JyB9LFxuICAgICAgICAgICAgRkVFREJBQ0s6IHsgbmFtZTogJ2ZlZWRiYWNrJywgcGF0aDogJy9mZWVkYmFjaycgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIFNMVUdfR1VJID0gJ2d1aSc7XG4gICAgICAgIHZhciBTTFVHX1BSRVZJRVcgPSAncHJldmlldyc7XG4gICAgICAgIHZhciBhY3RpdmVUYWJOYW1lID0gVEFCUy5NQUlOLm5hbWU7XG4gICAgICAgIHZhciBpc0ltcHJvdmVtZW50c1RhYkVuYWJsZWQgPSBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZS5pc0ltcHJvdmVtZW50c1RhYkVuYWJsZWQ7XG4gICAgICAgIC8vIFdoZW4gdGhlIFVSTCBwYXRoIGNoYW5nZXMsIHJlcm91dGUgdG8gdGhlIGFwcHJvcHJpYXRlIHRhYiBpbiB0aGVcbiAgICAgICAgLy8gZXhwbG9yYXRpb24gZWRpdG9yIHBhZ2UuXG4gICAgICAgICRyb290U2NvcGUuJHdhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkbG9jYXRpb24ucGF0aCgpO1xuICAgICAgICB9LCBmdW5jdGlvbiAobmV3UGF0aCwgb2xkUGF0aCkge1xuICAgICAgICAgICAgaWYgKG5ld1BhdGggPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgob2xkUGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFvbGRQYXRoKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBjYW4gaGFwcGVuIHdoZW4gY2xpY2tpbmcgb24gbGlua3Mgd2hvc2UgaHJlZiBpcyBcIiNcIi5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPKG9wYXJyeSk6IERldGVybWluZSB3aGV0aGVyIHRoaXMgaXMgbmVjZXNzYXJ5LCBzaW5jZVxuICAgICAgICAgICAgLy8gX3NhdmVQZW5kaW5nQ2hhbmdlcygpIGlzIGNhbGxlZCBieSBlYWNoIG9mIHRoZSBuYXZpZ2F0ZVRvLi4uIGZ1bmN0aW9uc1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbFNhdmUnKTtcbiAgICAgICAgICAgIGlmIChuZXdQYXRoLmluZGV4T2YoVEFCUy5UUkFOU0xBVElPTi5wYXRoKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRhYk5hbWUgPSBUQUJTLlRSQU5TTEFUSU9OLm5hbWU7XG4gICAgICAgICAgICAgICAgdmFyIHdhaXRGb3JTdGF0ZXNUb0xvYWQgPSAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoRXhwbG9yYXRpb25TdGF0ZXNTZXJ2aWNlLmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGludGVydmFsLmNhbmNlbCh3YWl0Rm9yU3RhdGVzVG9Mb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RhdGVFZGl0b3JTZXJ2aWNlLnNldEFjdGl2ZVN0YXRlTmFtZShFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hUcmFuc2xhdGlvblRhYicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1BhdGguaW5kZXhPZihUQUJTLlBSRVZJRVcucGF0aCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVUYWJOYW1lID0gVEFCUy5QUkVWSUVXLm5hbWU7XG4gICAgICAgICAgICAgICAgX2RvTmF2aWdhdGlvbldpdGhTdGF0ZShuZXdQYXRoLCBTTFVHX1BSRVZJRVcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3UGF0aCA9PT0gVEFCUy5TRVRUSU5HUy5wYXRoKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiTmFtZSA9IFRBQlMuU0VUVElOR1MubmFtZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hTZXR0aW5nc1RhYicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3UGF0aCA9PT0gVEFCUy5TVEFUUy5wYXRoKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiTmFtZSA9IFRBQlMuU1RBVFMubmFtZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hTdGF0aXN0aWNzVGFiJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdQYXRoID09PSBUQUJTLklNUFJPVkVNRU5UUy5wYXRoKSB7XG4gICAgICAgICAgICAgICAgYWN0aXZlVGFiTmFtZSA9IFRBQlMuSU1QUk9WRU1FTlRTLm5hbWU7XG4gICAgICAgICAgICAgICAgdmFyIHdhaXRUb0NoZWNrVGhhdEltcHJvdmVtZW50c1RhYklzRW5hYmxlZCA9ICRpbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZS5pc0luaXRpYWxpemVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbnRlcnZhbC5jYW5jZWwod2FpdFRvQ2hlY2tUaGF0SW1wcm92ZW1lbnRzVGFiSXNFbmFibGVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UuaXNJbXByb3ZlbWVudHNUYWJFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSb3V0ZXJTZXJ2aWNlLm5hdmlnYXRlVG9NYWluVGFiKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdQYXRoID09PSBUQUJTLkhJU1RPUlkucGF0aCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogRG8gdGhpcyBvbi1ob3ZlciByYXRoZXIgdGhhbiBvbi1jbGljay5cbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hWZXJzaW9uSGlzdG9yeScsIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VSZWZyZXNoOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRhYk5hbWUgPSBUQUJTLkhJU1RPUlkubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1BhdGggPT09IFRBQlMuRkVFREJBQ0sucGF0aCkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVRhYk5hbWUgPSBUQUJTLkZFRURCQUNLLm5hbWU7XG4gICAgICAgICAgICAgICAgdmFyIHdhaXRUb0NoZWNrVGhhdEZlZWRiYWNrVGFiSXNFbmFibGVkID0gJGludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGludGVydmFsLmNhbmNlbCh3YWl0VG9DaGVja1RoYXRGZWVkYmFja1RhYklzRW5hYmxlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UuaXNJbXByb3ZlbWVudHNUYWJFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSb3V0ZXJTZXJ2aWNlLm5hdmlnYXRlVG9NYWluVGFiKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgNSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuZXdQYXRoLmluZGV4T2YoJy9ndWkvJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBhY3RpdmVUYWJOYW1lID0gVEFCUy5NQUlOLm5hbWU7XG4gICAgICAgICAgICAgICAgX2RvTmF2aWdhdGlvbldpdGhTdGF0ZShuZXdQYXRoLCBTTFVHX0dVSSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoRXhwbG9yYXRpb25Jbml0U3RhdGVOYW1lU2VydmljZS5zYXZlZE1lbWVudG8pIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9ndWkvJyArIEV4cGxvcmF0aW9uSW5pdFN0YXRlTmFtZVNlcnZpY2Uuc2F2ZWRNZW1lbnRvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgX2RvTmF2aWdhdGlvbldpdGhTdGF0ZSA9IGZ1bmN0aW9uIChwYXRoLCBwYXRoVHlwZSkge1xuICAgICAgICAgICAgdmFyIHBhdGhCYXNlID0gJy8nICsgcGF0aFR5cGUgKyAnLyc7XG4gICAgICAgICAgICB2YXIgcHV0YXRpdmVTdGF0ZU5hbWUgPSBwYXRoLnN1YnN0cmluZyhwYXRoQmFzZS5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHdhaXRGb3JTdGF0ZXNUb0xvYWQgPSAkaW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChFeHBsb3JhdGlvblN0YXRlc1NlcnZpY2UuaXNJbml0aWFsaXplZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICRpbnRlcnZhbC5jYW5jZWwod2FpdEZvclN0YXRlc1RvTG9hZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChFeHBsb3JhdGlvblN0YXRlc1NlcnZpY2UuaGFzU3RhdGUocHV0YXRpdmVTdGF0ZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZUVkaXRvclNlcnZpY2Uuc2V0QWN0aXZlU3RhdGVOYW1lKHB1dGF0aXZlU3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoVHlwZSA9PT0gU0xVR19HVUkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3JlZnJlc2hTdGF0ZUVkaXRvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgYW4gZXZlbnQgdG8gY2VudGVyIHRoZSBHcmFwaCBpbiB0aGUgRWRpdG9yLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnY2VudGVyR3JhcGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKHBhdGhCYXNlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkluaXRTdGF0ZU5hbWVTZXJ2aWNlLnNhdmVkTWVtZW50byk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3NhdmVQZW5kaW5nQ2hhbmdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdleHRlcm5hbFNhdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gU29tZXRpbWVzLCBBbmd1bGFySlMgdGhyb3dzIGEgXCJDYW5ub3QgcmVhZCBwcm9wZXJ0eSAkJG5leHRTaWJsaW5nIG9mXG4gICAgICAgICAgICAgICAgLy8gbnVsbFwiIGVycm9yLiBUbyBnZXQgYXJvdW5kIHRoaXMgd2UgbXVzdCB1c2UgJGFwcGx5KCkuXG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V4dGVybmFsU2F2ZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgX2dldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJGxvY2F0aW9uLnBhdGgoKS5pbmRleE9mKCcvZ3VpLycpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkbG9jYXRpb24ucGF0aCgpLnN1YnN0cmluZygnL2d1aS8nLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9hY3R1YWxseU5hdmlnYXRlID0gZnVuY3Rpb24gKHBhdGhUeXBlLCBuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIGlmIChwYXRoVHlwZSAhPT0gU0xVR19HVUkgJiYgcGF0aFR5cGUgIT09IFNMVUdfUFJFVklFVykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBTdGF0ZUVkaXRvclNlcnZpY2Uuc2V0QWN0aXZlU3RhdGVOYW1lKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycgKyBwYXRoVHlwZSArICcvJyArXG4gICAgICAgICAgICAgICAgU3RhdGVFZGl0b3JTZXJ2aWNlLmdldEFjdGl2ZVN0YXRlTmFtZSgpKTtcbiAgICAgICAgICAgICR3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBSb3V0ZXJTZXJ2aWNlID0ge1xuICAgICAgICAgICAgc2F2ZVBlbmRpbmdDaGFuZ2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFjdGl2ZVRhYk5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZlVGFiTmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0xvY2F0aW9uU2V0VG9Ob25TdGF0ZUVkaXRvclRhYjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50UGF0aCA9ICRsb2NhdGlvbi5wYXRoKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjdXJyZW50UGF0aCA9PT0gVEFCUy5UUkFOU0xBVElPTi5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLlBSRVZJRVcucGF0aCB8fFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50UGF0aCA9PT0gVEFCUy5TVEFUUy5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLklNUFJPVkVNRU5UUy5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLlNFVFRJTkdTLnBhdGggfHxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhdGggPT09IFRBQlMuSElTVE9SWS5wYXRoIHx8XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQYXRoID09PSBUQUJTLkZFRURCQUNLLnBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGgoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvTWFpblRhYjogZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zYXZlUGVuZGluZ0NoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICBpZiAoX2dldEN1cnJlbnRTdGF0ZUZyb21Mb2NhdGlvblBhdGgoKSA9PT0gc3RhdGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZVRhYk5hbWUgPT09IFRBQlMuTUFJTi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5vcHBpYS1lZGl0b3ItY2FyZHMtY29udGFpbmVyJykuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYWN0dWFsbHlOYXZpZ2F0ZShTTFVHX0dVSSwgc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gdXNlICRhcHBseSB0byB1cGRhdGUgYWxsIG91ciBiaW5kaW5ncy4gSG93ZXZlciB3ZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FuJ3QgZGlyZWN0bHkgdXNlICRhcHBseSwgYXMgdGhlcmUgaXMgYWxyZWFkeSBhbm90aGVyICRhcHBseSBpblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJvZ3Jlc3MsIHRoZSBvbmUgd2hpY2ggYW5ndWxhciBpdHNlbGYgaGFzIGNhbGxlZCBhdCB0aGUgc3RhcnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTbyB3ZSB1c2UgJGFwcGx5QXN5bmMgdG8gZW5zdXJlIHRoYXQgdGhpcyAkYXBwbHkgaXMgY2FsbGVkIGp1c3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFmdGVyIHRoZSBwcmV2aW91cyAkYXBwbHkgaXMgZmluaXNoZWQgZXhlY3V0aW5nLiBSZWZlciB0byB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsaW5rIGZvciBtb3JlIGluZm9ybWF0aW9uIC1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9ibG9nLnRoZW9keWJyb3RoZXJzLmNvbS8yMDE1LzA4L2dldHRpbmctaW5zaWRlLWFuZ3VsYXItc2NvcGVhcHBseWFzeW5jLmh0bWxcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5QXN5bmMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcub3BwaWEtZWRpdG9yLWNhcmRzLWNvbnRhaW5lcicpLmZhZGVJbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfYWN0dWFsbHlOYXZpZ2F0ZShTTFVHX0dVSSwgc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmF2aWdhdGVUb1RyYW5zbGF0aW9uVGFiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFRBQlMuVFJBTlNMQVRJT04ucGF0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmF2aWdhdGVUb1ByZXZpZXdUYWI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aXZlVGFiTmFtZSAhPT0gVEFCUy5QUkVWSUVXLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICBfYWN0dWFsbHlOYXZpZ2F0ZShTTFVHX1BSRVZJRVcsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvU3RhdHNUYWI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2F2ZVBlbmRpbmdDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoVEFCUy5TVEFUUy5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvSW1wcm92ZW1lbnRzVGFiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFRBQlMuSU1QUk9WRU1FTlRTLnBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hdmlnYXRlVG9TZXR0aW5nc1RhYjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zYXZlUGVuZGluZ0NoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aChUQUJTLlNFVFRJTkdTLnBhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hdmlnYXRlVG9IaXN0b3J5VGFiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NhdmVQZW5kaW5nQ2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKFRBQlMuSElTVE9SWS5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYXZpZ2F0ZVRvRmVlZGJhY2tUYWI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2F2ZVBlbmRpbmdDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoVEFCUy5GRUVEQkFDSy5wYXRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBSb3V0ZXJTZXJ2aWNlO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgdG8gYmUgdXNlZCBpbiB0aGUgbGVhcm5lciB2aWV3LlxuICovXG4vLyBUT0RPKCM3MDkyKTogRGVsZXRlIHRoaXMgZmlsZSBvbmNlIG1pZ3JhdGlvbiBpcyBjb21wbGV0ZSBhbmQgdGhlc2UgQW5ndWxhckpTXG4vLyBlcXVpdmFsZW50cyBvZiB0aGUgQW5ndWxhciBjb25zdGFudHMgYXJlIG5vIGxvbmdlciBuZWVkZWQuXG52YXIgZXhwbG9yYXRpb25fcGxheWVyX3BhZ2VfY29uc3RhbnRzXzEgPSByZXF1aXJlKFwicGFnZXMvZXhwbG9yYXRpb24tcGxheWVyLXBhZ2UvZXhwbG9yYXRpb24tcGxheWVyLXBhZ2UuY29uc3RhbnRzXCIpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0NPTlRFTlRfRk9DVVNfTEFCRUxfUFJFRklYJywgZXhwbG9yYXRpb25fcGxheWVyX3BhZ2VfY29uc3RhbnRzXzEuRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuQ09OVEVOVF9GT0NVU19MQUJFTF9QUkVGSVgpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1RXT19DQVJEX1RIUkVTSE9MRF9QWCcsIGV4cGxvcmF0aW9uX3BsYXllcl9wYWdlX2NvbnN0YW50c18xLkV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLlRXT19DQVJEX1RIUkVTSE9MRF9QWCk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnQ09OVElOVUVfQlVUVE9OX0ZPQ1VTX0xBQkVMJywgZXhwbG9yYXRpb25fcGxheWVyX3BhZ2VfY29uc3RhbnRzXzEuRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuQ09OVElOVUVfQlVUVE9OX0ZPQ1VTX0xBQkVMKTtcbi8qIENhbGxlZCB3aGVuIGEgbmV3IGF1ZGlvLWVxdWlwcGFibGUgY29tcG9uZW50IGlzIGxvYWRlZCBhbmQgZGlzcGxheWVkXG4gICB0byB0aGUgdXNlciwgYWxsb3dpbmcgZm9yIHRoZSBhdXRvbWF0aWMgcGxheWluZyBvZiBhdWRpbyBpZiBuZWNlc3NhcnkuICovXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRVZFTlRfQVVUT1BMQVlfQVVESU8nLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5FVkVOVF9BVVRPUExBWV9BVURJTyk7XG4vLyBUaGUgZW5mb3JjZWQgd2FpdGluZyBwZXJpb2QgYmVmb3JlIHRoZSBmaXJzdCBoaW50IHJlcXVlc3QuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnV0FJVF9GT1JfRklSU1RfSElOVF9NU0VDJywgZXhwbG9yYXRpb25fcGxheWVyX3BhZ2VfY29uc3RhbnRzXzEuRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuV0FJVF9GT1JfRklSU1RfSElOVF9NU0VDKTtcbi8vIFRoZSBlbmZvcmNlZCB3YWl0aW5nIHBlcmlvZCBiZWZvcmUgZWFjaCBvZiB0aGUgc3Vic2VxdWVudCBoaW50IHJlcXVlc3RzLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1dBSVRfRk9SX1NVQlNFUVVFTlRfSElOVFNfTVNFQycsIGV4cGxvcmF0aW9uX3BsYXllcl9wYWdlX2NvbnN0YW50c18xLkV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLldBSVRfRk9SX1NVQlNFUVVFTlRfSElOVFNfTVNFQyk7XG4vLyBUaGUgdGltZSBkZWxheSBiZXR3ZWVuIHRoZSBsZWFybmVyIGNsaWNraW5nIHRoZSBoaW50IGJ1dHRvblxuLy8gYW5kIHRoZSBhcHBlYXJhbmNlIG9mIHRoZSBoaW50LlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0RFTEFZX0ZPUl9ISU5UX0ZFRURCQUNLX01TRUMnLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5ERUxBWV9GT1JfSElOVF9GRUVEQkFDS19NU0VDKTtcbi8vIEFycmF5IG9mIGkxOG4gSURzIGZvciB0aGUgcG9zc2libGUgaGludCByZXF1ZXN0IHN0cmluZ3MuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnSElOVF9SRVFVRVNUX1NUUklOR19JMThOX0lEUycsIGV4cGxvcmF0aW9uX3BsYXllcl9wYWdlX2NvbnN0YW50c18xLkV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkhJTlRfUkVRVUVTVF9TVFJJTkdfSTE4Tl9JRFMpO1xuLyogVGhpcyBzaG91bGQgbWF0Y2ggdGhlIENTUyBjbGFzcyBkZWZpbmVkIGluIHRoZSB0dXRvciBjYXJkIGRpcmVjdGl2ZS4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdBVURJT19ISUdITElHSFRfQ1NTX0NMQVNTJywgZXhwbG9yYXRpb25fcGxheWVyX3BhZ2VfY29uc3RhbnRzXzEuRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuQVVESU9fSElHSExJR0hUX0NTU19DTEFTUyk7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5jb25zdGFudCgnRkxBR19FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUnLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5GTEFHX0VYUExPUkFUSU9OX1VSTF9URU1QTEFURSk7XG4vLyBUT0RPKGJoZW5uaW5nKTogRmluZCBhIGJldHRlciBwbGFjZSBmb3IgdGhlc2UgY29uc3RhbnRzLlxuLy8gTk9URSBUTyBERVZFTE9QRVJTOiBUaGVzZSBjb25zdGFudHMgbXVzdCBiZSB0aGUgc2FtZSAoaW4gbmFtZSBhbmQgdmFsdWUpIGFzXG4vLyB0aGUgY29ycmVzcG9uZGluZyBjbGFzc2lmaWNhdGlvbiBjb25zdGFudHMgZGVmaW5lZCBpbiBjb3JlLmRvbWFpbi5leHBfZG9tYWluLlxuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VYUExJQ0lUX0NMQVNTSUZJQ0FUSU9OJywgZXhwbG9yYXRpb25fcGxheWVyX3BhZ2VfY29uc3RhbnRzXzEuRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuRVhQTElDSVRfQ0xBU1NJRklDQVRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ1RSQUlOSU5HX0RBVEFfQ0xBU1NJRklDQVRJT04nLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5UUkFJTklOR19EQVRBX0NMQVNTSUZJQ0FUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVEFUSVNUSUNBTF9DTEFTU0lGSUNBVElPTicsIGV4cGxvcmF0aW9uX3BsYXllcl9wYWdlX2NvbnN0YW50c18xLkV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLlNUQVRJU1RJQ0FMX0NMQVNTSUZJQ0FUSU9OKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdERUZBVUxUX09VVENPTUVfQ0xBU1NJRklDQVRJT04nLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5ERUZBVUxUX09VVENPTUVfQ0xBU1NJRklDQVRJT04pO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuY29uc3RhbnQoJ0VYUExPUkFUSU9OX01PREUnLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5FWFBMT1JBVElPTl9NT0RFKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVEFUU19FVkVOVF9UWVBFUycsIGV4cGxvcmF0aW9uX3BsYXllcl9wYWdlX2NvbnN0YW50c18xLkV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLlNUQVRTX0VWRU5UX1RZUEVTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdTVEFUU19SRVBPUlRJTkdfVVJMUycsIGV4cGxvcmF0aW9uX3BsYXllcl9wYWdlX2NvbnN0YW50c18xLkV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLlNUQVRTX1JFUE9SVElOR19VUkxTKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmNvbnN0YW50KCdGRUVEQkFDS19QT1BPVkVSX1BBVEgnLCBleHBsb3JhdGlvbl9wbGF5ZXJfcGFnZV9jb25zdGFudHNfMS5FeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5GRUVEQkFDS19QT1BPVkVSX1BBVEgpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBDb25zdGFudHMgdG8gYmUgdXNlZCBpbiB0aGUgbGVhcm5lciB2aWV3LlxuICovXG52YXIgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMoKSB7XG4gICAgfVxuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkNPTlRFTlRfRk9DVVNfTEFCRUxfUFJFRklYID0gJ2NvbnRlbnQtZm9jdXMtbGFiZWwtJztcbiAgICBFeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5UV09fQ0FSRF9USFJFU0hPTERfUFggPSA5NjA7XG4gICAgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuQ09OVElOVUVfQlVUVE9OX0ZPQ1VTX0xBQkVMID0gJ2NvbnRpbnVlQnV0dG9uJztcbiAgICAvKiBDYWxsZWQgd2hlbiBhIG5ldyBhdWRpby1lcXVpcHBhYmxlIGNvbXBvbmVudCBpcyBsb2FkZWQgYW5kIGRpc3BsYXllZFxuICAgICAgIHRvIHRoZSB1c2VyLCBhbGxvd2luZyBmb3IgdGhlIGF1dG9tYXRpYyBwbGF5aW5nIG9mIGF1ZGlvIGlmIG5lY2Vzc2FyeS4gKi9cbiAgICBFeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5FVkVOVF9BVVRPUExBWV9BVURJTyA9ICdhdXRvUGxheUF1ZGlvJztcbiAgICAvLyBUaGUgZW5mb3JjZWQgd2FpdGluZyBwZXJpb2QgYmVmb3JlIHRoZSBmaXJzdCBoaW50IHJlcXVlc3QuXG4gICAgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuV0FJVF9GT1JfRklSU1RfSElOVF9NU0VDID0gNjAwMDA7XG4gICAgLy8gVGhlIGVuZm9yY2VkIHdhaXRpbmcgcGVyaW9kIGJlZm9yZSBlYWNoIG9mIHRoZSBzdWJzZXF1ZW50IGhpbnQgcmVxdWVzdHMuXG4gICAgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuV0FJVF9GT1JfU1VCU0VRVUVOVF9ISU5UU19NU0VDID0gMzAwMDA7XG4gICAgLy8gVGhlIHRpbWUgZGVsYXkgYmV0d2VlbiB0aGUgbGVhcm5lciBjbGlja2luZyB0aGUgaGludCBidXR0b25cbiAgICAvLyBhbmQgdGhlIGFwcGVhcmFuY2Ugb2YgdGhlIGhpbnQuXG4gICAgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuREVMQVlfRk9SX0hJTlRfRkVFREJBQ0tfTVNFQyA9IDEwMDtcbiAgICAvLyBBcnJheSBvZiBpMThuIElEcyBmb3IgdGhlIHBvc3NpYmxlIGhpbnQgcmVxdWVzdCBzdHJpbmdzLlxuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkhJTlRfUkVRVUVTVF9TVFJJTkdfSTE4Tl9JRFMgPSBbXG4gICAgICAgICdJMThOX1BMQVlFUl9ISU5UX1JFUVVFU1RfU1RSSU5HXzEnLFxuICAgICAgICAnSTE4Tl9QTEFZRVJfSElOVF9SRVFVRVNUX1NUUklOR18yJyxcbiAgICAgICAgJ0kxOE5fUExBWUVSX0hJTlRfUkVRVUVTVF9TVFJJTkdfMydcbiAgICBdO1xuICAgIC8qIFRoaXMgc2hvdWxkIG1hdGNoIHRoZSBDU1MgY2xhc3MgZGVmaW5lZCBpbiB0aGUgdHV0b3IgY2FyZCBkaXJlY3RpdmUuICovXG4gICAgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuQVVESU9fSElHSExJR0hUX0NTU19DTEFTUyA9ICdjb252ZXJzYXRpb24tc2tpbi1hdWRpby1oaWdobGlnaHQnO1xuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkZMQUdfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFID0gJy9mbGFnZXhwbG9yYXRpb25oYW5kbGVyLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBGaW5kIGEgYmV0dGVyIHBsYWNlIGZvciB0aGVzZSBjb25zdGFudHMuXG4gICAgLy8gTk9URSBUTyBERVZFTE9QRVJTOiBUaGVzZSBjb25zdGFudHMgbXVzdCBiZSB0aGUgc2FtZSAoaW4gbmFtZSBhbmQgdmFsdWUpIGFzXG4gICAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgY2xhc3NpZmljYXRpb24gY29uc3RhbnRzIGRlZmluZWQgaW5cbiAgICAvLyBjb3JlLmRvbWFpbi5leHBfZG9tYWluLlxuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkVYUExJQ0lUX0NMQVNTSUZJQ0FUSU9OID0gJ2V4cGxpY2l0JztcbiAgICBFeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5UUkFJTklOR19EQVRBX0NMQVNTSUZJQ0FUSU9OID0gJ3RyYWluaW5nX2RhdGFfbWF0Y2gnO1xuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLlNUQVRJU1RJQ0FMX0NMQVNTSUZJQ0FUSU9OID0gJ3N0YXRpc3RpY2FsX2NsYXNzaWZpZXInO1xuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkRFRkFVTFRfT1VUQ09NRV9DTEFTU0lGSUNBVElPTiA9ICdkZWZhdWx0X291dGNvbWUnO1xuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLkVYUExPUkFUSU9OX01PREUgPSB7XG4gICAgICAgIEVYUExPUkFUSU9OOiAnZXhwbG9yYXRpb24nLFxuICAgICAgICBQUkVURVNUOiAncHJldGVzdCcsXG4gICAgICAgIFFVRVNUSU9OX1BMQVlFUjogJ3F1ZXN0aW9uX3BsYXllcicsXG4gICAgICAgIFNUT1JZX0NIQVBURVI6ICdzdG9yeV9jaGFwdGVyJyxcbiAgICAgICAgT1RIRVI6ICdvdGhlcidcbiAgICB9O1xuICAgIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzLlNUQVRTX0VWRU5UX1RZUEVTID0ge1xuICAgICAgICBFVkVOVF9UWVBFX1NUQVJUX0VYUExPUkFUSU9OOiAnc3RhcnQnLFxuICAgICAgICBFVkVOVF9UWVBFX0FDVFVBTF9TVEFSVF9FWFBMT1JBVElPTjogJ2FjdHVhbF9zdGFydCcsXG4gICAgICAgIEVWRU5UX1RZUEVfQ09NUExFVEVfRVhQTE9SQVRJT046ICdjb21wbGV0ZScsXG4gICAgICAgIEVWRU5UX1RZUEVfU1RBVEVfSElUOiAnc3RhdGVfaGl0JyxcbiAgICAgICAgRVZFTlRfVFlQRV9TVEFURV9DT01QTEVURUQ6ICdzdGF0ZV9jb21wbGV0ZScsXG4gICAgICAgIEVWRU5UX1RZUEVfQU5TV0VSX1NVQk1JVFRFRDogJ2Fuc3dlcl9zdWJtaXR0ZWQnLFxuICAgICAgICBFVkVOVF9UWVBFX1NPTFVUSU9OX0hJVDogJ3NvbHV0aW9uX2hpdCcsXG4gICAgICAgIEVWRU5UX1RZUEVfTEVBVkVfRk9SX1JFRlJFU0hFUl9FWFA6ICdsZWF2ZV9mb3JfcmVmcmVzaGVyX2V4cCcsXG4gICAgfTtcbiAgICBFeHBsb3JhdGlvblBsYXllckNvbnN0YW50cy5TVEFUU19SRVBPUlRJTkdfVVJMUyA9IHtcbiAgICAgICAgQU5TV0VSX1NVQk1JVFRFRDogJy9leHBsb3JlaGFuZGxlci9hbnN3ZXJfc3VibWl0dGVkX2V2ZW50LzxleHBsb3JhdGlvbl9pZD4nLFxuICAgICAgICBFWFBMT1JBVElPTl9DT01QTEVURUQ6ICgnL2V4cGxvcmVoYW5kbGVyL2V4cGxvcmF0aW9uX2NvbXBsZXRlX2V2ZW50LzxleHBsb3JhdGlvbl9pZD4nKSxcbiAgICAgICAgRVhQTE9SQVRJT05fTUFZQkVfTEVGVDogKCcvZXhwbG9yZWhhbmRsZXIvZXhwbG9yYXRpb25fbWF5YmVfbGVhdmVfZXZlbnQvPGV4cGxvcmF0aW9uX2lkPicpLFxuICAgICAgICBFWFBMT1JBVElPTl9TVEFSVEVEOiAoJy9leHBsb3JlaGFuZGxlci9leHBsb3JhdGlvbl9zdGFydF9ldmVudC88ZXhwbG9yYXRpb25faWQ+JyksXG4gICAgICAgIFNUQVRFX0hJVDogJy9leHBsb3JlaGFuZGxlci9zdGF0ZV9oaXRfZXZlbnQvPGV4cGxvcmF0aW9uX2lkPicsXG4gICAgICAgIFNUQVRFX0NPTVBMRVRFRDogJy9leHBsb3JlaGFuZGxlci9zdGF0ZV9jb21wbGV0ZV9ldmVudC88ZXhwbG9yYXRpb25faWQ+JyxcbiAgICAgICAgRVhQTE9SQVRJT05fQUNUVUFMTFlfU1RBUlRFRDogKCcvZXhwbG9yZWhhbmRsZXIvZXhwbG9yYXRpb25fYWN0dWFsX3N0YXJ0X2V2ZW50LzxleHBsb3JhdGlvbl9pZD4nKSxcbiAgICAgICAgU09MVVRJT05fSElUOiAnL2V4cGxvcmVoYW5kbGVyL3NvbHV0aW9uX2hpdF9ldmVudC88ZXhwbG9yYXRpb25faWQ+JyxcbiAgICAgICAgTEVBVkVfRk9SX1JFRlJFU0hFUl9FWFA6ICgnL2V4cGxvcmVoYW5kbGVyL2xlYXZlX2Zvcl9yZWZyZXNoZXJfZXhwX2V2ZW50LzxleHBsb3JhdGlvbl9pZD4nKSxcbiAgICAgICAgU1RBVFNfRVZFTlRTOiAnL2V4cGxvcmVoYW5kbGVyL3N0YXRzX2V2ZW50cy88ZXhwbG9yYXRpb25faWQ+J1xuICAgIH07XG4gICAgRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMuRkVFREJBQ0tfUE9QT1ZFUl9QQVRIID0gJy9wYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS90ZW1wbGF0ZXMvJyArXG4gICAgICAgICdmZWVkYmFjay1wb3B1cC1jb250YWluZXIudGVtcGxhdGUuaHRtbCc7XG4gICAgcmV0dXJuIEV4cGxvcmF0aW9uUGxheWVyQ29uc3RhbnRzO1xufSgpKTtcbmV4cG9ydHMuRXhwbG9yYXRpb25QbGF5ZXJDb25zdGFudHMgPSBFeHBsb3JhdGlvblBsYXllckNvbnN0YW50cztcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ2xhc3NpZmljYXRpb24gc2VydmljZSBmb3IgYW5zd2VyIGdyb3Vwcy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2NsYXNzaWZpZXIvQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbi1wbGF5ZXItcGFnZS9zZXJ2aWNlcy8nICtcbiAgICAncHJlZGljdGlvbi1hbGdvcml0aG0tcmVnaXN0cnkuc2VydmljZS50cycpO1xucmVxdWlyZSgncGFnZXMvZXhwbG9yYXRpb24tcGxheWVyLXBhZ2Uvc2VydmljZXMvc3RhdGUtY2xhc3NpZmllci1tYXBwaW5nLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlL2V4cGxvcmF0aW9uLXBsYXllci1wYWdlLmNvbnN0YW50cy5hanMudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2ludGVyYWN0aW9uLXNwZWNzLmNvbnN0YW50cy5hanMudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0Fuc3dlckNsYXNzaWZpY2F0aW9uU2VydmljZScsIFtcbiAgICAnQWxlcnRzU2VydmljZScsICdBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnknLFxuICAgICdQcmVkaWN0aW9uQWxnb3JpdGhtUmVnaXN0cnlTZXJ2aWNlJywgJ1N0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlJyxcbiAgICAnREVGQVVMVF9PVVRDT01FX0NMQVNTSUZJQ0FUSU9OJywgJ0VOQUJMRV9NTF9DTEFTU0lGSUVSUycsXG4gICAgJ0VYUExJQ0lUX0NMQVNTSUZJQ0FUSU9OJyxcbiAgICAnSU5URVJBQ1RJT05fU1BFQ1MnLCAnU1RBVElTVElDQUxfQ0xBU1NJRklDQVRJT04nLFxuICAgICdUUkFJTklOR19EQVRBX0NMQVNTSUZJQ0FUSU9OJyxcbiAgICBmdW5jdGlvbiAoQWxlcnRzU2VydmljZSwgQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5LCBQcmVkaWN0aW9uQWxnb3JpdGhtUmVnaXN0cnlTZXJ2aWNlLCBTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nU2VydmljZSwgREVGQVVMVF9PVVRDT01FX0NMQVNTSUZJQ0FUSU9OLCBFTkFCTEVfTUxfQ0xBU1NJRklFUlMsIEVYUExJQ0lUX0NMQVNTSUZJQ0FUSU9OLCBJTlRFUkFDVElPTl9TUEVDUywgU1RBVElTVElDQUxfQ0xBU1NJRklDQVRJT04sIFRSQUlOSU5HX0RBVEFfQ0xBU1NJRklDQVRJT04pIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpbmRzIHRoZSBmaXJzdCBhbnN3ZXIgZ3JvdXAgd2l0aCBhIHJ1bGUgdGhhdCByZXR1cm5zIHRydWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gYW5zd2VyIC0gVGhlIGFuc3dlciB0aGF0IHRoZSB1c2VyIGhhcyBzdWJtaXR0ZWQuXG4gICAgICAgICAqIEBwYXJhbSB7YXJyYXl9IGFuc3dlckdyb3VwcyAtIFRoZSBhbnN3ZXIgZ3JvdXBzIG9mIHRoZSBpbnRlcmFjdGlvbi4gRWFjaFxuICAgICAgICAgKiAgICAgYW5zd2VyIGdyb3VwIGNvbnRhaW5zIHJ1bGVfc3BlY3MsIHdoaWNoIGlzIGEgbGlzdCBvZiBydWxlcy5cbiAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGRlZmF1bHRPdXRjb21lIC0gVGhlIGRlZmF1bHQgb3V0Y29tZSBvZiB0aGUgaW50ZXJhY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlIFRoZSBzZXJ2aWNlIHdoaWNoIGNvbnRhaW5zIHRoZVxuICAgICAgICAgKiAgICAgZXhwbGljaXQgcnVsZXMgb2YgdGhhdCBpbnRlcmFjdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7b2JqZWN0fSBBbiBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdCBkb21haW4gb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGNsYXNzaWZ5QW5zd2VyID0gZnVuY3Rpb24gKGFuc3dlciwgYW5zd2VyR3JvdXBzLCBkZWZhdWx0T3V0Y29tZSwgaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UpIHtcbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGdyb3VwIHRoYXQgY29udGFpbnMgYSBydWxlIHdoaWNoIHJldHVybnMgdHJ1ZVxuICAgICAgICAgICAgLy8gVE9ETyhiaGVubmluZyk6IEltcGxlbWVudCB0cmFpbmluZyBkYXRhIGNsYXNzaWZpY2F0aW9uLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbnN3ZXJHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFuc3dlckdyb3Vwc1tpXS5ydWxlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnVsZSA9IGFuc3dlckdyb3Vwc1tpXS5ydWxlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlW3J1bGUudHlwZV0oYW5zd2VyLCBydWxlLmlucHV0cykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KGFuc3dlckdyb3Vwc1tpXS5vdXRjb21lLCBpLCBqLCBFWFBMSUNJVF9DTEFTU0lGSUNBVElPTik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiBubyBydWxlIGluIGFueSBhbnN3ZXIgZ3JvdXAgcmV0dXJucyB0cnVlLCB0aGUgZGVmYXVsdCAnZ3JvdXAnIGlzXG4gICAgICAgICAgICAvLyByZXR1cm5lZC4gVGhyb3dzIGFuIGVycm9yIGlmIHRoZSBkZWZhdWx0IG91dGNvbWUgaXMgbm90IGRlZmluZWQuXG4gICAgICAgICAgICBpZiAoZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhkZWZhdWx0T3V0Y29tZSwgYW5zd2VyR3JvdXBzLmxlbmd0aCwgMCwgREVGQVVMVF9PVVRDT01FX0NMQVNTSUZJQ0FUSU9OKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB0aGUgZXhwbG9yYXRpb24uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENsYXNzaWZpZXMgdGhlIGFuc3dlciBhY2NvcmRpbmcgdG8gdGhlIGFuc3dlciBncm91cHMuIGFuZCByZXR1cm5zIHRoZVxuICAgICAgICAgICAgICogY29ycmVzcG9uZGluZyBhbnN3ZXIgY2xhc3NpZmljYXRpb24gcmVzdWx0LlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0ZU5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc3RhdGUgd2hlcmUgdGhlIHVzZXJcbiAgICAgICAgICAgICAqICAgc3VibWl0dGVkIHRoZSBhbnN3ZXIuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gaW50ZXJhY3Rpb25Jbk9sZFN0YXRlIC0gVGhlIGludGVyYWN0aW9uIHByZXNlbnQgaW4gdGhlXG4gICAgICAgICAgICAgKiAgIHN0YXRlIHdoZXJlIHRoZSB1c2VyIHN1Ym1pdHRlZCB0aGUgYW5zd2VyLlxuICAgICAgICAgICAgICogQHBhcmFtIHsqfSBhbnN3ZXIgLSBUaGUgYW5zd2VyIHRoYXQgdGhlIHVzZXIgaGFzIHN1Ym1pdHRlZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlIC0gVGhlIHNlcnZpY2Ugd2hpY2ggY29udGFpbnNcbiAgICAgICAgICAgICAqICAgdGhlIGV4cGxpY2l0IHJ1bGVzIG9mIHRoYXQgaW50ZXJhY3Rpb24uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB7QW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHR9IFRoZSByZXN1bHRpbmdcbiAgICAgICAgICAgICAqICAgQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQgZG9tYWluIG9iamVjdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0TWF0Y2hpbmdDbGFzc2lmaWNhdGlvblJlc3VsdDogZnVuY3Rpb24gKHN0YXRlTmFtZSwgaW50ZXJhY3Rpb25Jbk9sZFN0YXRlLCBhbnN3ZXIsIGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB2YXIgYW5zd2VyR3JvdXBzID0gaW50ZXJhY3Rpb25Jbk9sZFN0YXRlLmFuc3dlckdyb3VwcztcbiAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdE91dGNvbWUgPSBpbnRlcmFjdGlvbkluT2xkU3RhdGUuZGVmYXVsdE91dGNvbWU7XG4gICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0ID0gY2xhc3NpZnlBbnN3ZXIoYW5zd2VyLCBhbnN3ZXJHcm91cHMsIGRlZmF1bHRPdXRjb21lLCBpbnRlcmFjdGlvblJ1bGVzU2VydmljZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1NvbWV0aGluZyB3ZW50IHdyb25nIHdpdGggdGhlIGV4cGxvcmF0aW9uOiBubyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdpbnRlcmFjdGlvblJ1bGVzU2VydmljZSB3YXMgYXZhaWxhYmxlLicpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTm8gaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2Ugd2FzIGF2YWlsYWJsZSB0byBjbGFzc2lmeSB0aGUgYW5zd2VyLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcnVsZUJhc2VkT3V0Y29tZUlzRGVmYXVsdCA9IChhbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdC5vdXRjb21lID09PSBkZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uSXNUcmFpbmFibGUgPSBJTlRFUkFDVElPTl9TUEVDU1tpbnRlcmFjdGlvbkluT2xkU3RhdGUuaWRdLmlzX3RyYWluYWJsZTtcbiAgICAgICAgICAgICAgICBpZiAocnVsZUJhc2VkT3V0Y29tZUlzRGVmYXVsdCAmJiBpbnRlcmFjdGlvbklzVHJhaW5hYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5zd2VyR3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5zd2VyR3JvdXBzW2ldLnRyYWluaW5nRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5zd2VyR3JvdXBzW2ldLnRyYWluaW5nRGF0YS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5lcXVhbHMoYW5zd2VyLCBhbnN3ZXJHcm91cHNbaV0udHJhaW5pbmdEYXRhW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoYW5zd2VyR3JvdXBzW2ldLm91dGNvbWUsIGksIG51bGwsIFRSQUlOSU5HX0RBVEFfQ0xBU1NJRklDQVRJT04pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChFTkFCTEVfTUxfQ0xBU1NJRklFUlMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc2lmaWVyID0gU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1NlcnZpY2UuZ2V0Q2xhc3NpZmllcihzdGF0ZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXNzaWZpZXIgJiYgY2xhc3NpZmllci5jbGFzc2lmaWVyRGF0YSAmJiAoY2xhc3NpZmllci5hbGdvcml0aG1JZCAmJiBjbGFzc2lmaWVyLmRhdGFTY2hlbWFWZXJzaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVkaWN0aW9uU2VydmljZSA9IChQcmVkaWN0aW9uQWxnb3JpdGhtUmVnaXN0cnlTZXJ2aWNlLmdldFByZWRpY3Rpb25TZXJ2aWNlKGNsYXNzaWZpZXIuYWxnb3JpdGhtSWQsIGNsYXNzaWZpZXIuZGF0YVNjaGVtYVZlcnNpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBwcmVkaWN0aW9uIHNlcnZpY2UgZXhpc3RzLCB3ZSBydW4gY2xhc3NpZmllci4gV2UgcmV0dXJuIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgb3V0Y29tZSBvdGhlcndpc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZWRpY3Rpb25TZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVkaWN0ZWRBbnN3ZXJHcm91cEluZGV4ID0gcHJlZGljdGlvblNlcnZpY2UucHJlZGljdChjbGFzc2lmaWVyLmNsYXNzaWZpZXJEYXRhLCBhbnN3ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlZGljdGVkQW5zd2VyR3JvdXBJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0ID0gKEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZGVmYXVsdE91dGNvbWUsIGFuc3dlckdyb3Vwcy5sZW5ndGgsIDAsIERFRkFVTFRfT1VUQ09NRV9DTEFTU0lGSUNBVElPTikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0ID0gKEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoYW5zd2VyR3JvdXBzW3ByZWRpY3RlZEFuc3dlckdyb3VwSW5kZXhdLm91dGNvbWUsIHByZWRpY3RlZEFuc3dlckdyb3VwSW5kZXgsIG51bGwsIFNUQVRJU1RJQ0FMX0NMQVNTSUZJQ0FUSU9OKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0NsYXNzaWZpZWRFeHBsaWNpdGx5T3JHb2VzVG9OZXdTdGF0ZTogZnVuY3Rpb24gKHN0YXRlTmFtZSwgc3RhdGUsIGFuc3dlciwgaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5nZXRNYXRjaGluZ0NsYXNzaWZpY2F0aW9uUmVzdWx0KHN0YXRlTmFtZSwgc3RhdGUuaW50ZXJhY3Rpb24sIGFuc3dlciwgaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAocmVzdWx0Lm91dGNvbWUuZGVzdCAhPT0gc3RhdGUubmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY2xhc3NpZmljYXRpb25DYXRlZ29yaXphdGlvbiAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIERFRkFVTFRfT1VUQ09NRV9DTEFTU0lGSUNBVElPTik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIG1hcHBpbmcgYWxnb3JpdGhtSWQgdG8gUHJlZGljdGlvbkFsZ29yaXRobVNlcnZpY2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ1ByZWRpY3Rpb25BbGdvcml0aG1SZWdpc3RyeVNlcnZpY2UnLCBbXG4gICAgJyRpbmplY3RvcicsIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgbWFwcGluZyBuZWVkcyB0byBiZSB1cGRhdGVkIHdoZW5ldmVyIGEgbmV3IHByZWRpY3Rpb24gc2VydmljZSBuZWVkc1xuICAgICAgICAgKiB0byBiZSBhZGRlZCBmb3IgY2xhc3NpZmljYXRpb24uIFRoZSBtYXBwaW5nIGlzIGZyb20gYWxnb3JpdGhtSWQgdG8gYVxuICAgICAgICAgKiBsaXN0IG9mIG9iamVjdHMuIFRoZSBtYXBwaW5nIHNob3VsZCBiZSBvZiB0aGUgdHlwZTpcbiAgICAgICAgICoge1xuICAgICAgICAgKiAgIGFsZ29yaXRobUlkOiB7XG4gICAgICAgICAqICAgICBkYXRhU2NoZW1hVmVyc2lvbjogcHJlZGljdGlvblNlcnZpY2VcbiAgICAgICAgICogICB9XG4gICAgICAgICAqIH1cbiAgICAgICAgICovXG4gICAgICAgIHZhciBhbGdvcml0aG1JZFByZWRpY3Rpb25TZXJ2aWNlTWFwcGluZyA9IHtcbiAgICAgICAgICAgIENvZGVDbGFzc2lmaWVyOiB7XG4gICAgICAgICAgICAgICAgdjE6ICdDb2RlUmVwbFByZWRpY3Rpb25TZXJ2aWNlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFRleHRDbGFzc2lmaWVyOiB7XG4gICAgICAgICAgICAgICAgdjE6ICdUZXh0SW5wdXRQcmVkaWN0aW9uU2VydmljZSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFByZWRpY3Rpb25TZXJ2aWNlOiBmdW5jdGlvbiAoYWxnb3JpdGhtSWQsIGRhdGFTY2hlbWFWZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFsZ29yaXRobUlkUHJlZGljdGlvblNlcnZpY2VNYXBwaW5nLmhhc093blByb3BlcnR5KGFsZ29yaXRobUlkKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBjb252ZXJ0IGRhdGFTY2hlbWFWZXJzaW9uIHRvIGEgc3RyaW5nIGJlbG93IHNpbmNlIEpTIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FuJ3QgaGF2ZSBpbnRlZ2VyIHByb3BlcnRpZXMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXJ2aWNlTmFtZSA9IChhbGdvcml0aG1JZFByZWRpY3Rpb25TZXJ2aWNlTWFwcGluZ1thbGdvcml0aG1JZF1bJ3YnICsgZGF0YVNjaGVtYVZlcnNpb24udG9TdHJpbmcoKV0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldChzZXJ2aWNlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVGhlIGJlbG93IGZ1bmN0aW9uIGlzIHJlcXVpcmVkIGZvciBydW5uaW5nIHRlc3RzIHdpdGggc2FtcGxlXG4gICAgICAgICAgICAvLyBwcmVkaWN0aW9uIHNlcnZpY2VzLlxuICAgICAgICAgICAgc2V0TWFwcGluZzogZnVuY3Rpb24gKG5ld0FsZ29yaXRobUlkUHJlZGljdGlvblNlcnZpY2VNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgYWxnb3JpdGhtSWRQcmVkaWN0aW9uU2VydmljZU1hcHBpbmcgPSAobmV3QWxnb3JpdGhtSWRQcmVkaWN0aW9uU2VydmljZU1hcHBpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZXMgZm9yIG1hcHBpbmcgc3RhdGUgbmFtZXMgdG8gY2xhc3NpZmllciBkZXRhaWxzLlxuICovXG52YXIgc3RhdGljXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvdXBncmFkZS9zdGF0aWNcIik7XG52YXIgY29yZV8xID0gcmVxdWlyZShcIkBhbmd1bGFyL2NvcmVcIik7XG52YXIgQ2xhc3NpZmllck9iamVjdEZhY3RvcnlfMSA9IHJlcXVpcmUoXCJkb21haW4vY2xhc3NpZmllci9DbGFzc2lmaWVyT2JqZWN0RmFjdG9yeVwiKTtcbnZhciBTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nU2VydmljZShjbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB0aGlzLmNsYXNzaWZpZXJPYmplY3RGYWN0b3J5ID0gY2xhc3NpZmllck9iamVjdEZhY3Rvcnk7XG4gICAgICAgIHRoaXMuc3RhdGVDbGFzc2lmaWVyTWFwcGluZyA9IG51bGw7XG4gICAgfVxuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ2JhY2tlbmRTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nJyBpcyBhIGRpY3Qgd2l0aFxuICAgIC8vIHVuZGVyc2NvcmVfY2FzZWQga2V5cyB3aGljaCBnaXZlIHRzbGludCBlcnJvcnMgYWdhaW5zdCB1bmRlcnNjb3JlX2Nhc2luZyBpblxuICAgIC8vIGZhdm9yIG9mIGNhbWVsQ2FzaW5nLlxuICAgIFN0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGJhY2tlbmRTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nKSB7XG4gICAgICAgIHRoaXMuc3RhdGVDbGFzc2lmaWVyTWFwcGluZyA9IHt9O1xuICAgICAgICB2YXIgYWxnb3JpdGhtSWQsIGNsYXNzaWZpZXJEYXRhLCBkYXRhU2NoZW1hVmVyc2lvbjtcbiAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIGJhY2tlbmRTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nKSB7XG4gICAgICAgICAgICBpZiAoYmFja2VuZFN0YXRlQ2xhc3NpZmllck1hcHBpbmcuaGFzT3duUHJvcGVydHkoc3RhdGVOYW1lKSkge1xuICAgICAgICAgICAgICAgIGFsZ29yaXRobUlkID0gYmFja2VuZFN0YXRlQ2xhc3NpZmllck1hcHBpbmdbc3RhdGVOYW1lXS5hbGdvcml0aG1faWQ7XG4gICAgICAgICAgICAgICAgY2xhc3NpZmllckRhdGEgPSBiYWNrZW5kU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1tzdGF0ZU5hbWVdLmNsYXNzaWZpZXJfZGF0YTtcbiAgICAgICAgICAgICAgICBkYXRhU2NoZW1hVmVyc2lvbiA9IGJhY2tlbmRTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nW3N0YXRlTmFtZV0uZGF0YV9zY2hlbWFfdmVyc2lvbjtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlQ2xhc3NpZmllck1hcHBpbmdbc3RhdGVOYW1lXSA9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NpZmllck9iamVjdEZhY3RvcnkuY3JlYXRlKGFsZ29yaXRobUlkLCBjbGFzc2lmaWVyRGF0YSwgZGF0YVNjaGVtYVZlcnNpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nU2VydmljZS5wcm90b3R5cGUuZ2V0Q2xhc3NpZmllciA9IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGVDbGFzc2lmaWVyTWFwcGluZyAmJlxuICAgICAgICAgICAgdGhpcy5zdGF0ZUNsYXNzaWZpZXJNYXBwaW5nLmhhc093blByb3BlcnR5KHN0YXRlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlQ2xhc3NpZmllck1hcHBpbmdbc3RhdGVOYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgX2E7XG4gICAgU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1NlcnZpY2UgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pLFxuICAgICAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW3R5cGVvZiAoX2EgPSB0eXBlb2YgQ2xhc3NpZmllck9iamVjdEZhY3RvcnlfMS5DbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeV8xLkNsYXNzaWZpZXJPYmplY3RGYWN0b3J5KSA9PT0gXCJmdW5jdGlvblwiID8gX2EgOiBPYmplY3RdKVxuICAgIF0sIFN0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlKTtcbiAgICByZXR1cm4gU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1NlcnZpY2U7XG59KCkpO1xuZXhwb3J0cy5TdGF0ZUNsYXNzaWZpZXJNYXBwaW5nU2VydmljZSA9IFN0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1NlcnZpY2UnLCBzdGF0aWNfMS5kb3duZ3JhZGVJbmplY3RhYmxlKFN0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlKSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGRldGVybWluaW5nIHRoZSB2aXNpYmlsaXR5IG9mIGFkdmFuY2VkIGZlYXR1cmVzIGluXG4gKiAgICAgICAgICAgICAgIHRoZSBleHBsb3JhdGlvbiBlZGl0b3IuXG4gKi9cbnZhciBjb3JlXzEgPSByZXF1aXJlKFwiQGFuZ3VsYXIvY29yZVwiKTtcbnZhciBzdGF0aWNfMSA9IHJlcXVpcmUoXCJAYW5ndWxhci91cGdyYWRlL3N0YXRpY1wiKTtcbnZhciBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZSgpIHtcbiAgICB9XG4gICAgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2VfMSA9IEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlO1xuICAgIC8vIFRPRE8oIzcxNzYpOiBSZXBsYWNlICdhbnknIHdpdGggdGhlIGV4YWN0IHR5cGUuIFRoaXMgaGFzIGJlZW4ga2VwdCBhc1xuICAgIC8vICdhbnknIGJlY2F1c2UgJ2V4cGxvcmF0aW9uRGF0YScgYW5kICdmZWF0dXJlc0RhdGEnIGFyZSBkaWN0cyB3aXRoXG4gICAgLy8gdW5kZXJzY29yZV9jYXNlZCBrZXlzIHdoaWNoIGdpdmUgdHNsaW50IGVycm9ycyBhZ2FpbnN0IHVuZGVyc2NvcmVfY2FzaW5nXG4gICAgLy8gaW4gZmF2b3Igb2YgY2FtZWxDYXNpbmcuXG4gICAgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25EYXRhLCBmZWF0dXJlc0RhdGEpIHtcbiAgICAgICAgaWYgKEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlXzEuc2VydmljZUlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZV8xLnNldHRpbmdzLmlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZCA9XG4gICAgICAgICAgICBmZWF0dXJlc0RhdGEuaXNfaW1wcm92ZW1lbnRzX3RhYl9lbmFibGVkO1xuICAgICAgICBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZV8xLnNldHRpbmdzLmlzUGxheXRocm91Z2hSZWNvcmRpbmdFbmFibGVkID1cbiAgICAgICAgICAgIGZlYXR1cmVzRGF0YS5pc19leHBsb3JhdGlvbl93aGl0ZWxpc3RlZDtcbiAgICAgICAgaWYgKGV4cGxvcmF0aW9uRGF0YS5wYXJhbV9jaGFuZ2VzICYmXG4gICAgICAgICAgICBleHBsb3JhdGlvbkRhdGEucGFyYW1fY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZVBhcmFtZXRlcnMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIHN0YXRlIGluIGV4cGxvcmF0aW9uRGF0YS5zdGF0ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwbG9yYXRpb25EYXRhLnN0YXRlc1tzdGF0ZV0ucGFyYW1fY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlUGFyYW1ldGVycygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2VfMS5zZXJ2aWNlSXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgfTtcbiAgICBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZS5wcm90b3R5cGUuaXNJbml0aWFsaXplZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlXzEuc2VydmljZUlzSW5pdGlhbGl6ZWQ7XG4gICAgfTtcbiAgICBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZS5wcm90b3R5cGUuYXJlUGFyYW1ldGVyc0VuYWJsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZV8xLnNldHRpbmdzLmFyZVBhcmFtZXRlcnNFbmFibGVkO1xuICAgIH07XG4gICAgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UucHJvdG90eXBlLmlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlXzEuc2V0dGluZ3MuaXNJbXByb3ZlbWVudHNUYWJFbmFibGVkO1xuICAgIH07XG4gICAgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UucHJvdG90eXBlLmlzUGxheXRocm91Z2hSZWNvcmRpbmdFbmFibGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2VfMS5zZXR0aW5ncy5pc1BsYXl0aHJvdWdoUmVjb3JkaW5nRW5hYmxlZDtcbiAgICB9O1xuICAgIEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLnByb3RvdHlwZS5lbmFibGVQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZV8xLnNldHRpbmdzLmFyZVBhcmFtZXRlcnNFbmFibGVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIHZhciBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZV8xO1xuICAgIEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlLnNlcnZpY2VJc0luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2Uuc2V0dGluZ3MgPSB7XG4gICAgICAgIGlzSW1wcm92ZW1lbnRzVGFiRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGlzUGxheXRocm91Z2hSZWNvcmRpbmdFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgYXJlUGFyYW1ldGVyc0VuYWJsZWQ6IGZhbHNlXG4gICAgfTtcbiAgICBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZSA9IEV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlXzEgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgY29yZV8xLkluamVjdGFibGUoe1xuICAgICAgICAgICAgcHJvdmlkZWRJbjogJ3Jvb3QnXG4gICAgICAgIH0pXG4gICAgXSwgRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UpO1xuICAgIHJldHVybiBFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZTtcbn0oKSk7XG5leHBvcnRzLkV4cGxvcmF0aW9uRmVhdHVyZXNTZXJ2aWNlID0gRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2U7XG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFeHBsb3JhdGlvbkZlYXR1cmVzU2VydmljZScsIHN0YXRpY18xLmRvd25ncmFkZUluamVjdGFibGUoRXhwbG9yYXRpb25GZWF0dXJlc1NlcnZpY2UpKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NhbWVsLWNhc2UtdG8taHlwaGVucy5maWx0ZXIudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0V4dGVuc2lvblRhZ0Fzc2VtYmxlclNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0h0bWxFc2NhcGVyU2VydmljZS50cycpO1xuLy8gQSBzZXJ2aWNlIHRoYXQgcHJvdmlkZXMgYSBudW1iZXIgb2YgdXRpbGl0eSBmdW5jdGlvbnMgdXNlZnVsIHRvIGJvdGggdGhlXG4vLyBlZGl0b3IgYW5kIHBsYXllci5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0V4cGxvcmF0aW9uSHRtbEZvcm1hdHRlclNlcnZpY2UnLCBbXG4gICAgJyRmaWx0ZXInLCAnRXh0ZW5zaW9uVGFnQXNzZW1ibGVyU2VydmljZScsICdIdG1sRXNjYXBlclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkZmlsdGVyLCBFeHRlbnNpb25UYWdBc3NlbWJsZXJTZXJ2aWNlLCBIdG1sRXNjYXBlclNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGludGVyYWN0aW9uSWQgLSBUaGUgaW50ZXJhY3Rpb24gaWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gaW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJnU3BlY3MgLSBUaGUgdmFyaW91c1xuICAgICAgICAgICAgICogICBhdHRyaWJ1dGVzIHRoYXQgdGhlIGludGVyYWN0aW9uIGRlcGVuZHMgb24uXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHBhcmVudEhhc0xhc3RBbnN3ZXJQcm9wZXJ0eSAtIElmIHRoaXMgZnVuY3Rpb24gaXNcbiAgICAgICAgICAgICAqICAgY2FsbGVkIGluIHRoZSBleHBsb3JhdGlvbl9wbGF5ZXIgdmlldyAoaW5jbHVkaW5nIHRoZSBwcmV2aWV3IG1vZGUpLFxuICAgICAgICAgICAgICogICBjYWxsZXJzIHNob3VsZCBlbnN1cmUgdGhhdCBwYXJlbnRIYXNMYXN0QW5zd2VyUHJvcGVydHkgaXMgc2V0IHRvXG4gICAgICAgICAgICAgKiAgIHRydWUgYW5kICRzY29wZS5sYXN0QW5zd2VyID1cbiAgICAgICAgICAgICAqICAgUGxheWVyVHJhbnNjcmlwdFNlcnZpY2UuZ2V0TGFzdEFuc3dlck9uRGlzcGxheWVkQ2FyZChpbmRleCkgaXMgc2V0IG9uXG4gICAgICAgICAgICAgKiAgIHRoZSBwYXJlbnQgY29udHJvbGxlciBvZiB0aGUgcmV0dXJuZWQgdGFnLlxuICAgICAgICAgICAgICogICBPdGhlcndpc2UsIHBhcmVudEhhc0xhc3RBbnN3ZXJQcm9wZXJ0eSBzaG91bGQgYmUgc2V0IHRvIGZhbHNlLlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsRm9yRm9jdXNUYXJnZXQgLSBUaGUgbGFiZWwgZm9yIHNldHRpbmcgZm9jdXMgb25cbiAgICAgICAgICAgICAqICAgdGhlIGludGVyYWN0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRJbnRlcmFjdGlvbkh0bWw6IGZ1bmN0aW9uIChpbnRlcmFjdGlvbklkLCBpbnRlcmFjdGlvbkN1c3RvbWl6YXRpb25BcmdTcGVjcywgcGFyZW50SGFzTGFzdEFuc3dlclByb3BlcnR5LCBsYWJlbEZvckZvY3VzVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGh0bWxJbnRlcmFjdGlvbklkID0gJGZpbHRlcignY2FtZWxDYXNlVG9IeXBoZW5zJykoaW50ZXJhY3Rpb25JZCk7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSAkKCc8b3BwaWEtaW50ZXJhY3RpdmUtJyArIGh0bWxJbnRlcmFjdGlvbklkICsgJz4nKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gKEV4dGVuc2lvblRhZ0Fzc2VtYmxlclNlcnZpY2UuZm9ybWF0Q3VzdG9taXphdGlvbkFyZ0F0dHJzKGVsZW1lbnQsIGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ1NwZWNzKSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5hdHRyKCdsYXN0LWFuc3dlcicsIHBhcmVudEhhc0xhc3RBbnN3ZXJQcm9wZXJ0eSA/XG4gICAgICAgICAgICAgICAgICAgICdsYXN0QW5zd2VyJyA6ICdudWxsJyk7XG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsRm9yRm9jdXNUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hdHRyKCdsYWJlbC1mb3ItZm9jdXMtdGFyZ2V0JywgbGFiZWxGb3JGb2N1c1RhcmdldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmdldCgwKS5vdXRlckhUTUw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QW5zd2VySHRtbDogZnVuY3Rpb24gKGFuc3dlciwgaW50ZXJhY3Rpb25JZCwgaW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJncykge1xuICAgICAgICAgICAgICAgIC8vIFRPRE8oc2xsKTogR2V0IHJpZCBvZiB0aGlzIHNwZWNpYWwgY2FzZSBmb3IgbXVsdGlwbGUgY2hvaWNlLlxuICAgICAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbkNob2ljZXMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbkN1c3RvbWl6YXRpb25BcmdzLmNob2ljZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25DaG9pY2VzID0gaW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJncy5jaG9pY2VzLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZWwgPSAkKCc8b3BwaWEtcmVzcG9uc2UtJyArICRmaWx0ZXIoJ2NhbWVsQ2FzZVRvSHlwaGVucycpKGludGVyYWN0aW9uSWQpICsgJz4nKTtcbiAgICAgICAgICAgICAgICBlbC5hdHRyKCdhbnN3ZXInLCBIdG1sRXNjYXBlclNlcnZpY2Uub2JqVG9Fc2NhcGVkSnNvbihhbnN3ZXIpKTtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25DaG9pY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsLmF0dHIoJ2Nob2ljZXMnLCBIdG1sRXNjYXBlclNlcnZpY2Uub2JqVG9Fc2NhcGVkSnNvbihpbnRlcmFjdGlvbkNob2ljZXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICgkKCc8ZGl2PicpLmFwcGVuZChlbCkpLmh0bWwoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTaG9ydEFuc3dlckh0bWw6IGZ1bmN0aW9uIChhbnN3ZXIsIGludGVyYWN0aW9uSWQsIGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3MpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IEdldCByaWQgb2YgdGhpcyBzcGVjaWFsIGNhc2UgZm9yIG11bHRpcGxlIGNob2ljZS5cbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb25DaG9pY2VzID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJncy5jaG9pY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uQ2hvaWNlcyA9IGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3MuY2hvaWNlcy52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gJCgnPG9wcGlhLXNob3J0LXJlc3BvbnNlLScgKyAkZmlsdGVyKCdjYW1lbENhc2VUb0h5cGhlbnMnKShpbnRlcmFjdGlvbklkKSArICc+Jyk7XG4gICAgICAgICAgICAgICAgZWwuYXR0cignYW5zd2VyJywgSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24oYW5zd2VyKSk7XG4gICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uQ2hvaWNlcykge1xuICAgICAgICAgICAgICAgICAgICBlbC5hdHRyKCdjaG9pY2VzJywgSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24oaW50ZXJhY3Rpb25DaG9pY2VzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAoJCgnPHNwYW4+JykuYXBwZW5kKGVsKSkuaHRtbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBVdGlsaXR5IHNlcnZpY2VzIGZvciBleHBsb3JhdGlvbnMgd2hpY2ggbWF5IGJlIHNoYXJlZCBieSBib3RoXG4gKiB0aGUgbGVhcm5lciBhbmQgZWRpdG9yIHZpZXdzLlxuICovXG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY2FtZWwtY2FzZS10by1oeXBoZW5zLmZpbHRlci50cycpO1xuLy8gU2VydmljZSBmb3IgYXNzZW1ibGluZyBleHRlbnNpb24gdGFncyAoZm9yIGludGVyYWN0aW9ucykuXG5hbmd1bGFyLm1vZHVsZSgnb3BwaWEnKS5mYWN0b3J5KCdFeHRlbnNpb25UYWdBc3NlbWJsZXJTZXJ2aWNlJywgW1xuICAgICckZmlsdGVyJywgJ0h0bWxFc2NhcGVyU2VydmljZScsIGZ1bmN0aW9uICgkZmlsdGVyLCBIdG1sRXNjYXBlclNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZvcm1hdEN1c3RvbWl6YXRpb25BcmdBdHRyczogZnVuY3Rpb24gKGVsZW1lbnQsIGN1c3RvbWl6YXRpb25BcmdTcGVjcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNhU3BlY05hbWUgaW4gY3VzdG9taXphdGlvbkFyZ1NwZWNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYVNwZWNWYWx1ZSA9IGN1c3RvbWl6YXRpb25BcmdTcGVjc1tjYVNwZWNOYW1lXS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hdHRyKCRmaWx0ZXIoJ2NhbWVsQ2FzZVRvSHlwaGVucycpKGNhU3BlY05hbWUpICsgJy13aXRoLXZhbHVlJywgSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24oY2FTcGVjVmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxpdHkgc2VydmljZSBmb3Igc2F2aW5nIGRhdGEgbG9jYWxseSBvbiB0aGUgY2xpZW50IG1hY2hpbmUuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9FeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeS50cycpO1xuLy8gU2VydmljZSBmb3Igc2F2aW5nIGV4cGxvcmF0aW9uIGRyYWZ0IGNoYW5nZXMgdG8gbG9jYWwgc3RvcmFnZS5cbi8vXG4vLyBOb3RlIHRoYXQgdGhlIGRyYWZ0IGlzIG9ubHkgc2F2ZWQgaWYgbG9jYWxTdG9yYWdlIGV4aXN0cyBhbmQgd29ya3Ncbi8vIChpLmUuIGhhcyBzdG9yYWdlIGNhcGFjaXR5KS5cbmFuZ3VsYXIubW9kdWxlKCdvcHBpYScpLmZhY3RvcnkoJ0xvY2FsU3RvcmFnZVNlcnZpY2UnLCBbXG4gICAgJ0V4cGxvcmF0aW9uRHJhZnRPYmplY3RGYWN0b3J5JyxcbiAgICBmdW5jdGlvbiAoRXhwbG9yYXRpb25EcmFmdE9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCBsb2NhbCBzdG9yYWdlIGV4aXN0cyBhbmQgd29ya3MgYXMgZXhwZWN0ZWQuXG4gICAgICAgIC8vIElmIGl0IGRvZXMgc3RvcmFnZSBzdG9yZXMgdGhlIGxvY2FsU3RvcmFnZSBvYmplY3QsXG4gICAgICAgIC8vIGVsc2Ugc3RvcmFnZSBpcyB1bmRlZmluZWQgb3IgZmFsc2UuXG4gICAgICAgIHZhciBzdG9yYWdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0ZXN0ID0gJ3Rlc3QnO1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0odGVzdCwgdGVzdCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0odGVzdCkgPT09IHRlc3Q7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGVzdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdCAmJiBsb2NhbFN0b3JhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXhjZXB0aW9uKSB7IH1cbiAgICAgICAgfSgpKTtcbiAgICAgICAgdmFyIExBU1RfU0VMRUNURURfVFJBTlNMQVRJT05fTEFOR1VBR0VfS0VZID0gKCdsYXN0X3NlbGVjdGVkX3RyYW5zbGF0aW9uX2xhbmcnKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZSB0aGUga2V5IHRvIGFjY2VzcyB0aGUgY2hhbmdlTGlzdCBpbiBsb2NhbFN0b3JhZ2VcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGV4cGxvcmF0aW9uSWQgLSBUaGUgZXhwbG9yYXRpb24gaWQgb2YgdGhlIGNoYW5nZUxpc3RcbiAgICAgICAgICogICB0byBiZSBhY2Nlc3NlZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfY3JlYXRlRXhwbG9yYXRpb25EcmFmdEtleSA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2RyYWZ0XycgKyBleHBsb3JhdGlvbklkO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDaGVjayB0aGF0IGxvY2FsU3RvcmFnZSBpcyBhdmFpbGFibGUgdG8gdGhlIGNsaWVudC5cbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiB0aGUgY2xpZW50IGhhcyBhY2Nlc3MgdG8gbG9jYWxTdG9yYWdlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc1N0b3JhZ2VBdmFpbGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQm9vbGVhbihzdG9yYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNhdmUgdGhlIGdpdmVuIGNoYW5nZUxpc3QgdG8gbG9jYWxTdG9yYWdlIGFsb25nIHdpdGggaXRzXG4gICAgICAgICAgICAgKiBkcmFmdENoYW5nZUxpc3RJZFxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGV4cGxvcmF0aW9uSWQgLSBUaGUgaWQgb2YgdGhlIGV4cGxvcmF0aW9uXG4gICAgICAgICAgICAgKiAgIGFzc29jaWF0ZWQgd2l0aCB0aGUgY2hhbmdlTGlzdCB0byBiZSBzYXZlZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TGlzdH0gY2hhbmdlTGlzdCAtIFRoZSBleHBsb3JhdGlvbiBjaGFuZ2UgbGlzdCB0byBiZSBzYXZlZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7SW50ZWdlcn0gZHJhZnRDaGFuZ2VMaXN0SWQgLSBUaGUgaWQgb2YgdGhlIGRyYWZ0IHRvIGJlIHNhdmVkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzYXZlRXhwbG9yYXRpb25EcmFmdDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIGNoYW5nZUxpc3QsIGRyYWZ0Q2hhbmdlTGlzdElkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2FsU2F2ZUtleSA9IF9jcmVhdGVFeHBsb3JhdGlvbkRyYWZ0S2V5KGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIGlmIChzdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkcmFmdERpY3QgPSBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeS50b0xvY2FsU3RvcmFnZURpY3QoY2hhbmdlTGlzdCwgZHJhZnRDaGFuZ2VMaXN0SWQpO1xuICAgICAgICAgICAgICAgICAgICBzdG9yYWdlLnNldEl0ZW0obG9jYWxTYXZlS2V5LCBKU09OLnN0cmluZ2lmeShkcmFmdERpY3QpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXRyaWV2ZSB0aGUgbG9jYWwgc2F2ZSBvZiB0aGUgY2hhbmdlTGlzdCBhc3NvY2lhdGVkIHdpdGggdGhlIGdpdmVuXG4gICAgICAgICAgICAgKiBleHBsb3JhdGlvbiBpZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBleHBsb3JhdGlvbklkIC0gVGhlIGV4cGxvcmF0aW9uIGlkIG9mIHRoZSBjaGFuZ2UgbGlzdFxuICAgICAgICAgICAgICogICB0byBiZSByZXRyaWV2ZWQuXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgbG9jYWwgc2F2ZSBkcmFmdCBvYmplY3QgaWYgaXQgZXhpc3RzLFxuICAgICAgICAgICAgICogICBlbHNlIG51bGwuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uRHJhZnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRyYWZ0RGljdCA9IEpTT04ucGFyc2Uoc3RvcmFnZS5nZXRJdGVtKF9jcmVhdGVFeHBsb3JhdGlvbkRyYWZ0S2V5KGV4cGxvcmF0aW9uSWQpKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkcmFmdERpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHBsb3JhdGlvbkRyYWZ0T2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tTG9jYWxTdG9yYWdlRGljdChkcmFmdERpY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlIHRoZSBsb2NhbCBzYXZlIG9mIHRoZSBjaGFuZ2VMaXN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW5cbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIGlkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGV4cGxvcmF0aW9uSWQgLSBUaGUgZXhwbG9yYXRpb24gaWQgb2YgdGhlIGNoYW5nZSBsaXN0XG4gICAgICAgICAgICAgKiAgIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlbW92ZUV4cGxvcmF0aW9uRHJhZnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZS5yZW1vdmVJdGVtKF9jcmVhdGVFeHBsb3JhdGlvbkRyYWZ0S2V5KGV4cGxvcmF0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTYXZlIHRoZSBnaXZlbiBsYW5ndWFnZSBjb2RlIHRvIGxvY2FsU3RvcmFnZSBhbG9uZy5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7TGlzdH0gY2hhbmdlTGlzdCAtIFRoZSBsYXN0IHNlbGVjdGVkIGxhbmd1YWdlIGNvZGUgdG8gYmUgc2F2ZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHVwZGF0ZUxhc3RTZWxlY3RlZFRyYW5zbGF0aW9uTGFuZ3VhZ2VDb2RlOiBmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZS5zZXRJdGVtKExBU1RfU0VMRUNURURfVFJBTlNMQVRJT05fTEFOR1VBR0VfS0VZLCBsYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHJpZXZlIHRoZSBsb2NhbCBzYXZlIG9mIHRoZSBsYXN0IHNlbGVjdGVkIGxhbmd1YWdlIGZvciB0cmFuc2xhdGlvbi5cbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBsb2NhbCBzYXZlIG9mIHRoZSBsYXN0IHNlbGVjdGVkIGxhbmd1YWdlIGZvclxuICAgICAgICAgICAgICogICB0cmFuc2xhdGlvbiBpZiBpdCBleGlzdHMsIGVsc2UgbnVsbC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0TGFzdFNlbGVjdGVkVHJhbnNsYXRpb25MYW5ndWFnZUNvZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmFnZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFuZ3VhZ2VDb2RlID0gKHN0b3JhZ2UuZ2V0SXRlbShMQVNUX1NFTEVDVEVEX1RSQU5TTEFUSU9OX0xBTkdVQUdFX0tFWSkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFuZ3VhZ2VDb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIHZhbGlkYXRpbmcgdGhpbmdzIGFuZCAob3B0aW9uYWxseSkgZGlzcGxheWluZ1xuICogd2FybmluZyBtZXNzYWdlcyBpZiB0aGUgdmFsaWRhdGlvbiBmYWlscy5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL25vcm1hbGl6ZS13aGl0ZXNwYWNlLmZpbHRlci50cycpO1xuYW5ndWxhci5tb2R1bGUoJ29wcGlhJykuZmFjdG9yeSgnVmFsaWRhdG9yc1NlcnZpY2UnLCBbXG4gICAgJyRmaWx0ZXInLCAnQWxlcnRzU2VydmljZScsICdJTlZBTElEX05BTUVfQ0hBUlMnLFxuICAgIGZ1bmN0aW9uICgkZmlsdGVyLCBBbGVydHNTZXJ2aWNlLCBJTlZBTElEX05BTUVfQ0hBUlMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2hlY2tzIHdoZXRoZXIgYW4gZW50aXR5IG5hbWUgaXMgdmFsaWQsIGFuZCBkaXNwbGF5cyBhIHdhcm5pbmcgbWVzc2FnZVxuICAgICAgICAgICAgICogaWYgaXQgaXNuJ3QuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gaW5wdXQgLSBUaGUgaW5wdXQgdG8gYmUgY2hlY2tlZC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvd1dhcm5pbmdzIC0gV2hldGhlciB0byBzaG93IHdhcm5pbmdzIGluIHRoZVxuICAgICAgICAgICAgICogICBidXR0ZXJiYXIuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBlbnRpdHkgbmFtZSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc1ZhbGlkRW50aXR5TmFtZTogZnVuY3Rpb24gKGlucHV0LCBzaG93V2FybmluZ3MsIGFsbG93RW1wdHkpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9ICRmaWx0ZXIoJ25vcm1hbGl6ZVdoaXRlc3BhY2UnKShpbnB1dCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpbnB1dCAmJiAhYWxsb3dFbXB0eSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1BsZWFzZSBlbnRlciBhIG5vbi1lbXB0eSBuYW1lLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBJTlZBTElEX05BTUVfQ0hBUlMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0LmluZGV4T2YoSU5WQUxJRF9OQU1FX0NIQVJTW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG93V2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0ludmFsaWQgaW5wdXQuIFBsZWFzZSB1c2UgYSBub24tZW1wdHkgZGVzY3JpcHRpb24gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjb25zaXN0aW5nIG9mIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzLCBzcGFjZXMgYW5kL29yIGh5cGhlbnMuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNWYWxpZEV4cGxvcmF0aW9uVGl0bGU6IGZ1bmN0aW9uIChpbnB1dCwgc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRFbnRpdHlOYW1lKGlucHV0LCBzaG93V2FybmluZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IDQwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG93V2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnRXhwbG9yYXRpb24gdGl0bGVzIHNob3VsZCBiZSBhdCBtb3N0IDQwIGNoYXJhY3RlcnMgbG9uZy4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE5COiB0aGlzIGRvZXMgbm90IGNoZWNrIHdoZXRoZXIgdGhlIGNhcmQgbmFtZSBhbHJlYWR5IGV4aXN0cyBpbiB0aGVcbiAgICAgICAgICAgIC8vIHN0YXRlcyBkaWN0LlxuICAgICAgICAgICAgaXNWYWxpZFN0YXRlTmFtZTogZnVuY3Rpb24gKGlucHV0LCBzaG93V2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZEVudGl0eU5hbWUoaW5wdXQsIHNob3dXYXJuaW5ncykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQubGVuZ3RoID4gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdDYXJkIG5hbWVzIHNob3VsZCBiZSBhdCBtb3N0IDUwIGNoYXJhY3RlcnMgbG9uZy4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzTm9uZW1wdHk6IGZ1bmN0aW9uIChpbnB1dCwgc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IEFsbG93IHRoaXMgd2FybmluZyB0byBiZSBtb3JlIHNwZWNpZmljIGluIHRlcm1zIG9mXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGF0IG5lZWRzIHRvIGJlIGVudGVyZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ1BsZWFzZSBlbnRlciBhIG5vbi1lbXB0eSB2YWx1ZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzVmFsaWRFeHBsb3JhdGlvbklkOiBmdW5jdGlvbiAoaW5wdXQsIHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgIC8vIEV4cGxvcmF0aW9uIElEcyBhcmUgdXJsc2FmZSBiYXNlNjQtZW5jb2RlZC5cbiAgICAgICAgICAgICAgICB2YXIgVkFMSURfSURfQ0hBUlNfUkVHRVggPSAvXlthLXpBLVowLTlfXFwtXSskL2c7XG4gICAgICAgICAgICAgICAgaWYgKCFpbnB1dCB8fCAhVkFMSURfSURfQ0hBUlNfUkVHRVgudGVzdChpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2UgZW50ZXIgYSB2YWxpZCBleHBsb3JhdGlvbiBJRC4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==