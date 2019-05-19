(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~top~61bb2de1"],{

/***/ "./core/templates/dev/head/domain/classifier/AnswerClassificationResultObjectFactory.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/classifier/AnswerClassificationResultObjectFactory.ts ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Factory for creating new frontend instances of answer
 *     Classification Result domain objects.
 */
oppia.factory('AnswerClassificationResultObjectFactory', [function () {
        var AnswerClassificationResult = function (outcome, answerGroupIndex, ruleIndex, classificationCategorization) {
            this.outcome = outcome;
            this.answerGroupIndex = answerGroupIndex;
            this.ruleIndex = ruleIndex;
            this.classificationCategorization = classificationCategorization;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AnswerClassificationResult['createNew'] = function (
        /* eslint-enable dot-notation */
        outcome, answerGroupIndex, ruleIndex, classificationCategorization) {
            return new AnswerClassificationResult(outcome, answerGroupIndex, ruleIndex, classificationCategorization);
        };
        return AnswerClassificationResult;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/classifier/ClassifierObjectFactory.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/classifier/ClassifierObjectFactory.ts ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Factory for creating new frontend instances of Classifier
 *     domain objects.
 */
oppia.factory('ClassifierObjectFactory', [function () {
        var Classifier = function (algorithmId, classifierData, dataSchemaVersion) {
            this.algorithmId = algorithmId;
            this.classifierData = classifierData;
            this.dataSchemaVersion = dataSchemaVersion;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Classifier['create'] = function (
        /* eslint-enable dot-notation */
        algorithmId, classifierData, dataSchemaVersion) {
            return new Classifier(algorithmId, classifierData, dataSchemaVersion);
        };
        return Classifier;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/objects/FractionObjectFactory.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/domain/objects/FractionObjectFactory.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Factory for creating instances of Fraction
 * domain objects.
 */
oppia.constant('FRACTION_PARSING_ERRORS', {
    INVALID_CHARS: 'Please only use numerical digits, spaces or forward slashes (/)',
    INVALID_FORMAT: 'Please enter a valid fraction (e.g., 5/3 or 1 2/3)',
    DIVISION_BY_ZERO: 'Please do not put 0 in the denominator'
});
oppia.factory('FractionObjectFactory', [
    'FRACTION_PARSING_ERRORS', function (FRACTION_PARSING_ERRORS) {
        var Fraction = function (isNegative, wholeNumber, numerator, denominator) {
            this.isNegative = isNegative;
            this.wholeNumber = wholeNumber;
            this.numerator = numerator;
            this.denominator = denominator;
        };
        Fraction.prototype.toString = function () {
            var fractionString = '';
            if (this.numerator !== 0) {
                fractionString += this.numerator + '/' + this.denominator;
            }
            if (this.wholeNumber !== 0) {
                fractionString = this.wholeNumber + ' ' + fractionString;
                // If the fractional part was empty then there will be a trailing
                // whitespace.
                fractionString = fractionString.trim();
            }
            if (this.isNegative && fractionString !== '') {
                fractionString = '-' + fractionString;
            }
            return fractionString === '' ? '0' : fractionString;
        };
        Fraction.prototype.toDict = function () {
            return {
                isNegative: this.isNegative,
                wholeNumber: this.wholeNumber,
                numerator: this.numerator,
                denominator: this.denominator
            };
        };
        Fraction.prototype.toFloat = function () {
            var totalParts = (this.wholeNumber * this.denominator) + this.numerator;
            var floatVal = (totalParts / this.denominator);
            return this.isNegative ? -floatVal : floatVal;
        };
        Fraction.prototype.getIntegerPart = function () {
            return this.isNegative ? -this.wholeNumber : this.wholeNumber;
        };
        Fraction.prototype.convertToSimplestForm = function () {
            var gcd = function (x, y) {
                return y === 0 ? x : gcd(y, x % y);
            };
            var g = gcd(this.numerator, this.denominator);
            var numerator = this.numerator / g;
            var denominator = this.denominator / g;
            return new Fraction(this.isNegative, this.wholeNumber, numerator, denominator);
        };
        Fraction.prototype.hasNonzeroIntegerPart = function () {
            return this.wholeNumber !== 0;
        };
        Fraction.prototype.isImproperFraction = function () {
            return this.denominator <= this.numerator;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Fraction['fromRawInputString'] = function (rawInput) {
            /* eslint-enable dot-notation */
            var INVALID_CHARS_REGEX = /[^\d\s\/-]/g;
            if (INVALID_CHARS_REGEX.test(rawInput)) {
                throw new Error(FRACTION_PARSING_ERRORS.INVALID_CHARS);
            }
            var FRACTION_REGEX = /^\s*-?\s*((\d*\s*\d+\s*\/\s*\d+)|\d+)\s*$/;
            if (!FRACTION_REGEX.test(rawInput)) {
                throw new Error(FRACTION_PARSING_ERRORS.INVALID_FORMAT);
            }
            var isNegative = false;
            var wholeNumber = 0;
            var numerator = 0;
            var denominator = 1;
            rawInput = rawInput.trim();
            if (rawInput.charAt(0) === '-') {
                isNegative = true;
                // Remove the negative char from the string.
                rawInput = rawInput.substring(1);
            }
            // Filter result from split to remove empty strings.
            var numbers = rawInput.split(/\/|\s/g).filter(function (token) {
                // The empty string will evaluate to false.
                return Boolean(token);
            });
            if (numbers.length === 1) {
                wholeNumber = parseInt(numbers[0]);
            }
            else if (numbers.length === 2) {
                numerator = parseInt(numbers[0]);
                denominator = parseInt(numbers[1]);
            }
            else {
                // numbers.length == 3
                wholeNumber = parseInt(numbers[0]);
                numerator = parseInt(numbers[1]);
                denominator = parseInt(numbers[2]);
            }
            if (denominator === 0) {
                throw new Error(FRACTION_PARSING_ERRORS.DIVISION_BY_ZERO);
            }
            return new Fraction(isNegative, wholeNumber, numerator, denominator);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Fraction['fromDict'] = function (fractionDict) {
            /* eslint-enable dot-notation */
            return new Fraction(fractionDict.isNegative, fractionDict.wholeNumber, fractionDict.numerator, fractionDict.denominator);
        };
        return Fraction;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Utility service for checking web browser type.
 */
oppia.factory('BrowserCheckerService', [
    'AUTOGENERATED_AUDIO_LANGUAGES',
    function (AUTOGENERATED_AUDIO_LANGUAGES) {
        // For details on the reliability of this check, see
        // https://stackoverflow.com/questions/9847580/
        // how-to-detect-safari-chrome-ie-firefox-and-opera-browser#answer-9851769
        var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
            return p.toString() === '[object SafariRemoteNotification]';
        })(!window.safari ||
            (typeof window.safari !== 'undefined' && window.safari.pushNotification));
        var _supportsSpeechSynthesis = function () {
            var supportLang = false;
            if (window.hasOwnProperty('speechSynthesis')) {
                speechSynthesis.getVoices().forEach(function (voice) {
                    AUTOGENERATED_AUDIO_LANGUAGES.forEach(function (audioLanguage) {
                        if (voice.lang === audioLanguage.speech_synthesis_code ||
                            (_isMobileDevice() &&
                                voice.lang === audioLanguage.speech_synthesis_code_mobile)) {
                            supportLang = true;
                        }
                    });
                });
            }
            return supportLang;
        };
        var _isMobileDevice = function () {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return userAgent.match(/iPhone/i) || userAgent.match(/Android/i);
        };
        return {
            supportsSpeechSynthesis: function () {
                return _supportsSpeechSynthesis();
            },
            isMobileDevice: function () {
                return _isMobileDevice();
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration_player/AnswerClassificationService.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration_player/AnswerClassificationService.ts ***!
  \*****************************************************************************************/
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
__webpack_require__(/*! pages/exploration_player/PredictionAlgorithmRegistryService.ts */ "./core/templates/dev/head/pages/exploration_player/PredictionAlgorithmRegistryService.ts");
__webpack_require__(/*! pages/exploration_player/StateClassifierMappingService.ts */ "./core/templates/dev/head/pages/exploration_player/StateClassifierMappingService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
// TODO(bhenning): Find a better place for these constants.
// NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
// the corresponding classification constants defined in core.domain.exp_domain.
oppia.constant('EXPLICIT_CLASSIFICATION', 'explicit');
oppia.constant('TRAINING_DATA_CLASSIFICATION', 'training_data_match');
oppia.constant('STATISTICAL_CLASSIFICATION', 'statistical_classifier');
oppia.constant('DEFAULT_OUTCOME_CLASSIFICATION', 'default_outcome');
oppia.factory('AnswerClassificationService', [
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

/***/ "./core/templates/dev/head/pages/exploration_player/PredictionAlgorithmRegistryService.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration_player/PredictionAlgorithmRegistryService.ts ***!
  \************************************************************************************************/
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
oppia.factory('PredictionAlgorithmRegistryService', [
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

/***/ "./core/templates/dev/head/pages/exploration_player/StateClassifierMappingService.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration_player/StateClassifierMappingService.ts ***!
  \*******************************************************************************************/
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
 * @fileoverview Services for mapping state names to classifier details.
 */
__webpack_require__(/*! domain/classifier/ClassifierObjectFactory.ts */ "./core/templates/dev/head/domain/classifier/ClassifierObjectFactory.ts");
oppia.factory('StateClassifierMappingService', [
    'ClassifierObjectFactory', function (ClassifierObjectFactory) {
        var stateClassifierMapping = null;
        return {
            init: function (backendStateClassifierMapping) {
                stateClassifierMapping = {};
                var algorithmId, classifierData, dataSchemaVersion;
                for (var stateName in backendStateClassifierMapping) {
                    if (backendStateClassifierMapping.hasOwnProperty(stateName)) {
                        algorithmId = backendStateClassifierMapping[stateName].algorithm_id;
                        classifierData = backendStateClassifierMapping[stateName].classifier_data;
                        dataSchemaVersion = backendStateClassifierMapping[stateName].data_schema_version;
                        stateClassifierMapping[stateName] = ClassifierObjectFactory.create(algorithmId, classifierData, dataSchemaVersion);
                    }
                }
            },
            getClassifier: function (stateName) {
                if (stateClassifierMapping &&
                    stateClassifierMapping.hasOwnProperty(stateName)) {
                    return stateClassifierMapping[stateName];
                }
                else {
                    return null;
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/SiteAnalyticsService.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/services/SiteAnalyticsService.ts ***!
  \******************************************************************/
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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
oppia.factory('SiteAnalyticsService', ['$window', function ($window) {
        var CAN_SEND_ANALYTICS_EVENTS = constants.CAN_SEND_ANALYTICS_EVENTS;
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/events
        var _sendEventToGoogleAnalytics = function (eventCategory, eventAction, eventLabel) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
            }
        };
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/
        //   social-interactions
        var _sendSocialEventToGoogleAnalytics = function (network, action, targetUrl) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'social', network, action, targetUrl);
            }
        };
        return {
            // The srcElement refers to the element on the page that is clicked.
            registerStartLoginEvent: function (srcElement) {
                _sendEventToGoogleAnalytics('LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
            },
            registerNewSignupEvent: function () {
                _sendEventToGoogleAnalytics('SignupButton', 'click', '');
            },
            registerClickBrowseLibraryButtonEvent: function () {
                _sendEventToGoogleAnalytics('BrowseLibraryButton', 'click', $window.location.pathname);
            },
            registerGoToDonationSiteEvent: function (donationSiteName) {
                _sendEventToGoogleAnalytics('GoToDonationSite', 'click', donationSiteName);
            },
            registerApplyToTeachWithOppiaEvent: function () {
                _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
            },
            registerClickCreateExplorationButtonEvent: function () {
                _sendEventToGoogleAnalytics('CreateExplorationButton', 'click', $window.location.pathname);
            },
            registerCreateNewExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
            },
            registerCreateNewExplorationInCollectionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExplorationFromCollection', 'create', explorationId);
            },
            registerCreateNewCollectionEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
            },
            registerCommitChangesToPrivateExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPrivateExploration', 'click', explorationId);
            },
            registerShareExplorationEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerShareCollectionEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerOpenEmbedInfoEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
            },
            registerCommitChangesToPublicExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPublicExploration', 'click', explorationId);
            },
            // Metrics for tutorial on first creating exploration
            registerTutorialModalOpenEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('TutorialModalOpen', 'open', explorationId);
            },
            registerDeclineTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('DeclineTutorialModal', 'click', explorationId);
            },
            registerAcceptTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('AcceptTutorialModal', 'click', explorationId);
            },
            // Metrics for visiting the help center
            registerClickHelpButtonEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('ClickHelpButton', 'click', explorationId);
            },
            registerVisitHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitHelpCenter', 'click', explorationId);
            },
            registerOpenTutorialFromHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('OpenTutorialFromHelpCenter', 'click', explorationId);
            },
            // Metrics for exiting the tutorial
            registerSkipTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SkipTutorial', 'click', explorationId);
            },
            registerFinishTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FinishTutorial', 'click', explorationId);
            },
            // Metrics for first time editor use
            registerEditorFirstEntryEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstEnterEditor', 'open', explorationId);
            },
            registerFirstOpenContentBoxEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstOpenContentBox', 'open', explorationId);
            },
            registerFirstSaveContentEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveContent', 'click', explorationId);
            },
            registerFirstClickAddInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstClickAddInteraction', 'click', explorationId);
            },
            registerFirstSelectInteractionTypeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSelectInteractionType', 'click', explorationId);
            },
            registerFirstSaveInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveInteraction', 'click', explorationId);
            },
            registerFirstSaveRuleEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveRule', 'click', explorationId);
            },
            registerFirstCreateSecondStateEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstCreateSecondState', 'create', explorationId);
            },
            // Metrics for publishing explorations
            registerSavePlayableExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SavePlayableExploration', 'save', explorationId);
            },
            registerOpenPublishExplorationModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExplorationModal', 'open', explorationId);
            },
            registerPublishExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExploration', 'click', explorationId);
            },
            registerVisitOppiaFromIframeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitOppiaFromIframe', 'click', explorationId);
            },
            registerNewCard: function (cardNum) {
                if (cardNum <= 10 || cardNum % 10 === 0) {
                    _sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
                }
            },
            registerFinishExploration: function () {
                _sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
            },
            registerOpenCollectionFromLandingPageEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('OpenFractionsFromLandingPage', 'click', collectionId);
            },
            registerStewardsLandingPageEvent: function (viewerType, buttonText) {
                _sendEventToGoogleAnalytics('ClickButtonOnStewardsPage', 'click', viewerType + ':' + buttonText);
            },
            registerSaveRecordedAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SaveRecordedAudio', 'click', explorationId);
            },
            registerStartAudioRecordingEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('StartAudioRecording', 'click', explorationId);
            },
            registerUploadAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('UploadRecordedAudio', 'click', explorationId);
            },
        };
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vY2xhc3NpZmllci9BbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2NsYXNzaWZpZXIvQ2xhc3NpZmllck9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL29iamVjdHMvRnJhY3Rpb25PYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91dGlsaXRpZXMvQnJvd3NlckNoZWNrZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uX3BsYXllci9BbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb25fcGxheWVyL1ByZWRpY3Rpb25BbGdvcml0aG1SZWdpc3RyeVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb25fcGxheWVyL1N0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNoQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUMvQkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRKQUE4RDtBQUN0RSxtQkFBTyxDQUFDLGdLQUFnRTtBQUN4RSxtQkFBTyxDQUFDLHNKQUEyRDtBQUNuRSxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsRUFBRTtBQUNyQixtQkFBbUIsTUFBTTtBQUN6QjtBQUNBLG1CQUFtQixPQUFPO0FBQzFCLG1CQUFtQixTQUFTO0FBQzVCO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix5QkFBeUI7QUFDcEQsK0JBQStCLGtDQUFrQztBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLE9BQU87QUFDOUI7QUFDQSx1QkFBdUIsT0FBTztBQUM5QjtBQUNBLHVCQUF1QixFQUFFO0FBQ3pCLHVCQUF1QixTQUFTO0FBQ2hDO0FBQ0E7QUFDQSx3QkFBd0IsMkJBQTJCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMseUJBQXlCO0FBQzVEO0FBQ0EsMkNBQTJDLHlDQUF5QztBQUNwRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDRIQUE4QztBQUN0RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSyIsImZpbGUiOiJhZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5za2lsbF9lZGl0b3J+dG9wfjYxYmIyZGUxLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBhbnN3ZXJcbiAqICAgICBDbGFzc2lmaWNhdGlvbiBSZXN1bHQgZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0Fuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdCA9IGZ1bmN0aW9uIChvdXRjb21lLCBhbnN3ZXJHcm91cEluZGV4LCBydWxlSW5kZXgsIGNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMub3V0Y29tZSA9IG91dGNvbWU7XG4gICAgICAgICAgICB0aGlzLmFuc3dlckdyb3VwSW5kZXggPSBhbnN3ZXJHcm91cEluZGV4O1xuICAgICAgICAgICAgdGhpcy5ydWxlSW5kZXggPSBydWxlSW5kZXg7XG4gICAgICAgICAgICB0aGlzLmNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb24gPSBjbGFzc2lmaWNhdGlvbkNhdGVnb3JpemF0aW9uO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdFsnY3JlYXRlTmV3J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIG91dGNvbWUsIGFuc3dlckdyb3VwSW5kZXgsIHJ1bGVJbmRleCwgY2xhc3NpZmljYXRpb25DYXRlZ29yaXphdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdChvdXRjb21lLCBhbnN3ZXJHcm91cEluZGV4LCBydWxlSW5kZXgsIGNsYXNzaWZpY2F0aW9uQ2F0ZWdvcml6YXRpb24pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQ7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIENsYXNzaWZpZXJcbiAqICAgICBkb21haW4gb2JqZWN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQ2xhc3NpZmllck9iamVjdEZhY3RvcnknLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgQ2xhc3NpZmllciA9IGZ1bmN0aW9uIChhbGdvcml0aG1JZCwgY2xhc3NpZmllckRhdGEsIGRhdGFTY2hlbWFWZXJzaW9uKSB7XG4gICAgICAgICAgICB0aGlzLmFsZ29yaXRobUlkID0gYWxnb3JpdGhtSWQ7XG4gICAgICAgICAgICB0aGlzLmNsYXNzaWZpZXJEYXRhID0gY2xhc3NpZmllckRhdGE7XG4gICAgICAgICAgICB0aGlzLmRhdGFTY2hlbWFWZXJzaW9uID0gZGF0YVNjaGVtYVZlcnNpb247XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIENsYXNzaWZpZXJbJ2NyZWF0ZSddID0gZnVuY3Rpb24gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBhbGdvcml0aG1JZCwgY2xhc3NpZmllckRhdGEsIGRhdGFTY2hlbWFWZXJzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENsYXNzaWZpZXIoYWxnb3JpdGhtSWQsIGNsYXNzaWZpZXJEYXRhLCBkYXRhU2NoZW1hVmVyc2lvbik7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBDbGFzc2lmaWVyO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgaW5zdGFuY2VzIG9mIEZyYWN0aW9uXG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xub3BwaWEuY29uc3RhbnQoJ0ZSQUNUSU9OX1BBUlNJTkdfRVJST1JTJywge1xuICAgIElOVkFMSURfQ0hBUlM6ICdQbGVhc2Ugb25seSB1c2UgbnVtZXJpY2FsIGRpZ2l0cywgc3BhY2VzIG9yIGZvcndhcmQgc2xhc2hlcyAoLyknLFxuICAgIElOVkFMSURfRk9STUFUOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgZnJhY3Rpb24gKGUuZy4sIDUvMyBvciAxIDIvMyknLFxuICAgIERJVklTSU9OX0JZX1pFUk86ICdQbGVhc2UgZG8gbm90IHB1dCAwIGluIHRoZSBkZW5vbWluYXRvcidcbn0pO1xub3BwaWEuZmFjdG9yeSgnRnJhY3Rpb25PYmplY3RGYWN0b3J5JywgW1xuICAgICdGUkFDVElPTl9QQVJTSU5HX0VSUk9SUycsIGZ1bmN0aW9uIChGUkFDVElPTl9QQVJTSU5HX0VSUk9SUykge1xuICAgICAgICB2YXIgRnJhY3Rpb24gPSBmdW5jdGlvbiAoaXNOZWdhdGl2ZSwgd2hvbGVOdW1iZXIsIG51bWVyYXRvciwgZGVub21pbmF0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuaXNOZWdhdGl2ZSA9IGlzTmVnYXRpdmU7XG4gICAgICAgICAgICB0aGlzLndob2xlTnVtYmVyID0gd2hvbGVOdW1iZXI7XG4gICAgICAgICAgICB0aGlzLm51bWVyYXRvciA9IG51bWVyYXRvcjtcbiAgICAgICAgICAgIHRoaXMuZGVub21pbmF0b3IgPSBkZW5vbWluYXRvcjtcbiAgICAgICAgfTtcbiAgICAgICAgRnJhY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZyYWN0aW9uU3RyaW5nID0gJyc7XG4gICAgICAgICAgICBpZiAodGhpcy5udW1lcmF0b3IgIT09IDApIHtcbiAgICAgICAgICAgICAgICBmcmFjdGlvblN0cmluZyArPSB0aGlzLm51bWVyYXRvciArICcvJyArIHRoaXMuZGVub21pbmF0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy53aG9sZU51bWJlciAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGZyYWN0aW9uU3RyaW5nID0gdGhpcy53aG9sZU51bWJlciArICcgJyArIGZyYWN0aW9uU3RyaW5nO1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBmcmFjdGlvbmFsIHBhcnQgd2FzIGVtcHR5IHRoZW4gdGhlcmUgd2lsbCBiZSBhIHRyYWlsaW5nXG4gICAgICAgICAgICAgICAgLy8gd2hpdGVzcGFjZS5cbiAgICAgICAgICAgICAgICBmcmFjdGlvblN0cmluZyA9IGZyYWN0aW9uU3RyaW5nLnRyaW0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmVnYXRpdmUgJiYgZnJhY3Rpb25TdHJpbmcgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgZnJhY3Rpb25TdHJpbmcgPSAnLScgKyBmcmFjdGlvblN0cmluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmcmFjdGlvblN0cmluZyA9PT0gJycgPyAnMCcgOiBmcmFjdGlvblN0cmluZztcbiAgICAgICAgfTtcbiAgICAgICAgRnJhY3Rpb24ucHJvdG90eXBlLnRvRGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaXNOZWdhdGl2ZTogdGhpcy5pc05lZ2F0aXZlLFxuICAgICAgICAgICAgICAgIHdob2xlTnVtYmVyOiB0aGlzLndob2xlTnVtYmVyLFxuICAgICAgICAgICAgICAgIG51bWVyYXRvcjogdGhpcy5udW1lcmF0b3IsXG4gICAgICAgICAgICAgICAgZGVub21pbmF0b3I6IHRoaXMuZGVub21pbmF0b3JcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIEZyYWN0aW9uLnByb3RvdHlwZS50b0Zsb2F0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRvdGFsUGFydHMgPSAodGhpcy53aG9sZU51bWJlciAqIHRoaXMuZGVub21pbmF0b3IpICsgdGhpcy5udW1lcmF0b3I7XG4gICAgICAgICAgICB2YXIgZmxvYXRWYWwgPSAodG90YWxQYXJ0cyAvIHRoaXMuZGVub21pbmF0b3IpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNOZWdhdGl2ZSA/IC1mbG9hdFZhbCA6IGZsb2F0VmFsO1xuICAgICAgICB9O1xuICAgICAgICBGcmFjdGlvbi5wcm90b3R5cGUuZ2V0SW50ZWdlclBhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc05lZ2F0aXZlID8gLXRoaXMud2hvbGVOdW1iZXIgOiB0aGlzLndob2xlTnVtYmVyO1xuICAgICAgICB9O1xuICAgICAgICBGcmFjdGlvbi5wcm90b3R5cGUuY29udmVydFRvU2ltcGxlc3RGb3JtID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGdjZCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHkgPT09IDAgPyB4IDogZ2NkKHksIHggJSB5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgZyA9IGdjZCh0aGlzLm51bWVyYXRvciwgdGhpcy5kZW5vbWluYXRvcik7XG4gICAgICAgICAgICB2YXIgbnVtZXJhdG9yID0gdGhpcy5udW1lcmF0b3IgLyBnO1xuICAgICAgICAgICAgdmFyIGRlbm9taW5hdG9yID0gdGhpcy5kZW5vbWluYXRvciAvIGc7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZyYWN0aW9uKHRoaXMuaXNOZWdhdGl2ZSwgdGhpcy53aG9sZU51bWJlciwgbnVtZXJhdG9yLCBkZW5vbWluYXRvcik7XG4gICAgICAgIH07XG4gICAgICAgIEZyYWN0aW9uLnByb3RvdHlwZS5oYXNOb256ZXJvSW50ZWdlclBhcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53aG9sZU51bWJlciAhPT0gMDtcbiAgICAgICAgfTtcbiAgICAgICAgRnJhY3Rpb24ucHJvdG90eXBlLmlzSW1wcm9wZXJGcmFjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlbm9taW5hdG9yIDw9IHRoaXMubnVtZXJhdG9yO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBGcmFjdGlvblsnZnJvbVJhd0lucHV0U3RyaW5nJ10gPSBmdW5jdGlvbiAocmF3SW5wdXQpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgSU5WQUxJRF9DSEFSU19SRUdFWCA9IC9bXlxcZFxcc1xcLy1dL2c7XG4gICAgICAgICAgICBpZiAoSU5WQUxJRF9DSEFSU19SRUdFWC50ZXN0KHJhd0lucHV0KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihGUkFDVElPTl9QQVJTSU5HX0VSUk9SUy5JTlZBTElEX0NIQVJTKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBGUkFDVElPTl9SRUdFWCA9IC9eXFxzKi0/XFxzKigoXFxkKlxccypcXGQrXFxzKlxcL1xccypcXGQrKXxcXGQrKVxccyokLztcbiAgICAgICAgICAgIGlmICghRlJBQ1RJT05fUkVHRVgudGVzdChyYXdJbnB1dCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoRlJBQ1RJT05fUEFSU0lOR19FUlJPUlMuSU5WQUxJRF9GT1JNQVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGlzTmVnYXRpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciB3aG9sZU51bWJlciA9IDA7XG4gICAgICAgICAgICB2YXIgbnVtZXJhdG9yID0gMDtcbiAgICAgICAgICAgIHZhciBkZW5vbWluYXRvciA9IDE7XG4gICAgICAgICAgICByYXdJbnB1dCA9IHJhd0lucHV0LnRyaW0oKTtcbiAgICAgICAgICAgIGlmIChyYXdJbnB1dC5jaGFyQXQoMCkgPT09ICctJykge1xuICAgICAgICAgICAgICAgIGlzTmVnYXRpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbmVnYXRpdmUgY2hhciBmcm9tIHRoZSBzdHJpbmcuXG4gICAgICAgICAgICAgICAgcmF3SW5wdXQgPSByYXdJbnB1dC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGaWx0ZXIgcmVzdWx0IGZyb20gc3BsaXQgdG8gcmVtb3ZlIGVtcHR5IHN0cmluZ3MuXG4gICAgICAgICAgICB2YXIgbnVtYmVycyA9IHJhd0lucHV0LnNwbGl0KC9cXC98XFxzL2cpLmZpbHRlcihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZW1wdHkgc3RyaW5nIHdpbGwgZXZhbHVhdGUgdG8gZmFsc2UuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEJvb2xlYW4odG9rZW4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobnVtYmVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICB3aG9sZU51bWJlciA9IHBhcnNlSW50KG51bWJlcnNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobnVtYmVycy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBudW1lcmF0b3IgPSBwYXJzZUludChudW1iZXJzWzBdKTtcbiAgICAgICAgICAgICAgICBkZW5vbWluYXRvciA9IHBhcnNlSW50KG51bWJlcnNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbnVtYmVycy5sZW5ndGggPT0gM1xuICAgICAgICAgICAgICAgIHdob2xlTnVtYmVyID0gcGFyc2VJbnQobnVtYmVyc1swXSk7XG4gICAgICAgICAgICAgICAgbnVtZXJhdG9yID0gcGFyc2VJbnQobnVtYmVyc1sxXSk7XG4gICAgICAgICAgICAgICAgZGVub21pbmF0b3IgPSBwYXJzZUludChudW1iZXJzWzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkZW5vbWluYXRvciA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihGUkFDVElPTl9QQVJTSU5HX0VSUk9SUy5ESVZJU0lPTl9CWV9aRVJPKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgRnJhY3Rpb24oaXNOZWdhdGl2ZSwgd2hvbGVOdW1iZXIsIG51bWVyYXRvciwgZGVub21pbmF0b3IpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBGcmFjdGlvblsnZnJvbURpY3QnXSA9IGZ1bmN0aW9uIChmcmFjdGlvbkRpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IEZyYWN0aW9uKGZyYWN0aW9uRGljdC5pc05lZ2F0aXZlLCBmcmFjdGlvbkRpY3Qud2hvbGVOdW1iZXIsIGZyYWN0aW9uRGljdC5udW1lcmF0b3IsIGZyYWN0aW9uRGljdC5kZW5vbWluYXRvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBGcmFjdGlvbjtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlIGZvciBjaGVja2luZyB3ZWIgYnJvd3NlciB0eXBlLlxuICovXG5vcHBpYS5mYWN0b3J5KCdCcm93c2VyQ2hlY2tlclNlcnZpY2UnLCBbXG4gICAgJ0FVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTJyxcbiAgICBmdW5jdGlvbiAoQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMpIHtcbiAgICAgICAgLy8gRm9yIGRldGFpbHMgb24gdGhlIHJlbGlhYmlsaXR5IG9mIHRoaXMgY2hlY2ssIHNlZVxuICAgICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85ODQ3NTgwL1xuICAgICAgICAvLyBob3ctdG8tZGV0ZWN0LXNhZmFyaS1jaHJvbWUtaWUtZmlyZWZveC1hbmQtb3BlcmEtYnJvd3NlciNhbnN3ZXItOTg1MTc2OVxuICAgICAgICB2YXIgaXNTYWZhcmkgPSAvY29uc3RydWN0b3IvaS50ZXN0KHdpbmRvdy5IVE1MRWxlbWVudCkgfHwgKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICByZXR1cm4gcC50b1N0cmluZygpID09PSAnW29iamVjdCBTYWZhcmlSZW1vdGVOb3RpZmljYXRpb25dJztcbiAgICAgICAgfSkoIXdpbmRvdy5zYWZhcmkgfHxcbiAgICAgICAgICAgICh0eXBlb2Ygd2luZG93LnNhZmFyaSAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnNhZmFyaS5wdXNoTm90aWZpY2F0aW9uKSk7XG4gICAgICAgIHZhciBfc3VwcG9ydHNTcGVlY2hTeW50aGVzaXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3VwcG9ydExhbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuaGFzT3duUHJvcGVydHkoJ3NwZWVjaFN5bnRoZXNpcycpKSB7XG4gICAgICAgICAgICAgICAgc3BlZWNoU3ludGhlc2lzLmdldFZvaWNlcygpLmZvckVhY2goZnVuY3Rpb24gKHZvaWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIEFVVE9HRU5FUkFURURfQVVESU9fTEFOR1VBR0VTLmZvckVhY2goZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2b2ljZS5sYW5nID09PSBhdWRpb0xhbmd1YWdlLnNwZWVjaF9zeW50aGVzaXNfY29kZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfaXNNb2JpbGVEZXZpY2UoKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2ljZS5sYW5nID09PSBhdWRpb0xhbmd1YWdlLnNwZWVjaF9zeW50aGVzaXNfY29kZV9tb2JpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydExhbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdXBwb3J0TGFuZztcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc01vYmlsZURldmljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IHVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1cHBvcnRzU3BlZWNoU3ludGhlc2lzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9zdXBwb3J0c1NwZWVjaFN5bnRoZXNpcygpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc01vYmlsZURldmljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDbGFzc2lmaWNhdGlvbiBzZXJ2aWNlIGZvciBhbnN3ZXIgZ3JvdXBzLlxuICovXG5yZXF1aXJlKCdkb21haW4vY2xhc3NpZmllci9BbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uX3BsYXllci9QcmVkaWN0aW9uQWxnb3JpdGhtUmVnaXN0cnlTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdwYWdlcy9leHBsb3JhdGlvbl9wbGF5ZXIvU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbi8vIFRPRE8oYmhlbm5pbmcpOiBGaW5kIGEgYmV0dGVyIHBsYWNlIGZvciB0aGVzZSBjb25zdGFudHMuXG4vLyBOT1RFIFRPIERFVkVMT1BFUlM6IFRoZXNlIGNvbnN0YW50cyBtdXN0IGJlIHRoZSBzYW1lIChpbiBuYW1lIGFuZCB2YWx1ZSkgYXNcbi8vIHRoZSBjb3JyZXNwb25kaW5nIGNsYXNzaWZpY2F0aW9uIGNvbnN0YW50cyBkZWZpbmVkIGluIGNvcmUuZG9tYWluLmV4cF9kb21haW4uXG5vcHBpYS5jb25zdGFudCgnRVhQTElDSVRfQ0xBU1NJRklDQVRJT04nLCAnZXhwbGljaXQnKTtcbm9wcGlhLmNvbnN0YW50KCdUUkFJTklOR19EQVRBX0NMQVNTSUZJQ0FUSU9OJywgJ3RyYWluaW5nX2RhdGFfbWF0Y2gnKTtcbm9wcGlhLmNvbnN0YW50KCdTVEFUSVNUSUNBTF9DTEFTU0lGSUNBVElPTicsICdzdGF0aXN0aWNhbF9jbGFzc2lmaWVyJyk7XG5vcHBpYS5jb25zdGFudCgnREVGQVVMVF9PVVRDT01FX0NMQVNTSUZJQ0FUSU9OJywgJ2RlZmF1bHRfb3V0Y29tZScpO1xub3BwaWEuZmFjdG9yeSgnQW5zd2VyQ2xhc3NpZmljYXRpb25TZXJ2aWNlJywgW1xuICAgICdBbGVydHNTZXJ2aWNlJywgJ0Fuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeScsXG4gICAgJ1ByZWRpY3Rpb25BbGdvcml0aG1SZWdpc3RyeVNlcnZpY2UnLCAnU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1NlcnZpY2UnLFxuICAgICdERUZBVUxUX09VVENPTUVfQ0xBU1NJRklDQVRJT04nLCAnRU5BQkxFX01MX0NMQVNTSUZJRVJTJyxcbiAgICAnRVhQTElDSVRfQ0xBU1NJRklDQVRJT04nLFxuICAgICdJTlRFUkFDVElPTl9TUEVDUycsICdTVEFUSVNUSUNBTF9DTEFTU0lGSUNBVElPTicsXG4gICAgJ1RSQUlOSU5HX0RBVEFfQ0xBU1NJRklDQVRJT04nLFxuICAgIGZ1bmN0aW9uIChBbGVydHNTZXJ2aWNlLCBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnksIFByZWRpY3Rpb25BbGdvcml0aG1SZWdpc3RyeVNlcnZpY2UsIFN0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlLCBERUZBVUxUX09VVENPTUVfQ0xBU1NJRklDQVRJT04sIEVOQUJMRV9NTF9DTEFTU0lGSUVSUywgRVhQTElDSVRfQ0xBU1NJRklDQVRJT04sIElOVEVSQUNUSU9OX1NQRUNTLCBTVEFUSVNUSUNBTF9DTEFTU0lGSUNBVElPTiwgVFJBSU5JTkdfREFUQV9DTEFTU0lGSUNBVElPTikge1xuICAgICAgICAvKipcbiAgICAgICAgICogRmluZHMgdGhlIGZpcnN0IGFuc3dlciBncm91cCB3aXRoIGEgcnVsZSB0aGF0IHJldHVybnMgdHJ1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHsqfSBhbnN3ZXIgLSBUaGUgYW5zd2VyIHRoYXQgdGhlIHVzZXIgaGFzIHN1Ym1pdHRlZC5cbiAgICAgICAgICogQHBhcmFtIHthcnJheX0gYW5zd2VyR3JvdXBzIC0gVGhlIGFuc3dlciBncm91cHMgb2YgdGhlIGludGVyYWN0aW9uLiBFYWNoXG4gICAgICAgICAqICAgICBhbnN3ZXIgZ3JvdXAgY29udGFpbnMgcnVsZV9zcGVjcywgd2hpY2ggaXMgYSBsaXN0IG9mIHJ1bGVzLlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZGVmYXVsdE91dGNvbWUgLSBUaGUgZGVmYXVsdCBvdXRjb21lIG9mIHRoZSBpbnRlcmFjdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UgVGhlIHNlcnZpY2Ugd2hpY2ggY29udGFpbnMgdGhlXG4gICAgICAgICAqICAgICBleHBsaWNpdCBydWxlcyBvZiB0aGF0IGludGVyYWN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHtvYmplY3R9IEFuIEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0IGRvbWFpbiBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgY2xhc3NpZnlBbnN3ZXIgPSBmdW5jdGlvbiAoYW5zd2VyLCBhbnN3ZXJHcm91cHMsIGRlZmF1bHRPdXRjb21lLCBpbnRlcmFjdGlvblJ1bGVzU2VydmljZSkge1xuICAgICAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgZ3JvdXAgdGhhdCBjb250YWlucyBhIHJ1bGUgd2hpY2ggcmV0dXJucyB0cnVlXG4gICAgICAgICAgICAvLyBUT0RPKGJoZW5uaW5nKTogSW1wbGVtZW50IHRyYWluaW5nIGRhdGEgY2xhc3NpZmljYXRpb24uXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuc3dlckdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW5zd2VyR3JvdXBzW2ldLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBydWxlID0gYW5zd2VyR3JvdXBzW2ldLnJ1bGVzW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2VbcnVsZS50eXBlXShhbnN3ZXIsIHJ1bGUuaW5wdXRzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0T2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoYW5zd2VyR3JvdXBzW2ldLm91dGNvbWUsIGksIGosIEVYUExJQ0lUX0NMQVNTSUZJQ0FUSU9OKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIElmIG5vIHJ1bGUgaW4gYW55IGFuc3dlciBncm91cCByZXR1cm5zIHRydWUsIHRoZSBkZWZhdWx0ICdncm91cCcgaXNcbiAgICAgICAgICAgIC8vIHJldHVybmVkLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIGRlZmF1bHQgb3V0Y29tZSBpcyBub3QgZGVmaW5lZC5cbiAgICAgICAgICAgIGlmIChkZWZhdWx0T3V0Y29tZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdE9iamVjdEZhY3RvcnkuY3JlYXRlTmV3KGRlZmF1bHRPdXRjb21lLCBhbnN3ZXJHcm91cHMubGVuZ3RoLCAwLCBERUZBVUxUX09VVENPTUVfQ0xBU1NJRklDQVRJT04pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdTb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHRoZSBleHBsb3JhdGlvbi4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xhc3NpZmllcyB0aGUgYW5zd2VyIGFjY29yZGluZyB0byB0aGUgYW5zd2VyIGdyb3Vwcy4gYW5kIHJldHVybnMgdGhlXG4gICAgICAgICAgICAgKiBjb3JyZXNwb25kaW5nIGFuc3dlciBjbGFzc2lmaWNhdGlvbiByZXN1bHQuXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzdGF0ZSB3aGVyZSB0aGUgdXNlclxuICAgICAgICAgICAgICogICBzdWJtaXR0ZWQgdGhlIGFuc3dlci5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbnRlcmFjdGlvbkluT2xkU3RhdGUgLSBUaGUgaW50ZXJhY3Rpb24gcHJlc2VudCBpbiB0aGVcbiAgICAgICAgICAgICAqICAgc3RhdGUgd2hlcmUgdGhlIHVzZXIgc3VibWl0dGVkIHRoZSBhbnN3ZXIuXG4gICAgICAgICAgICAgKiBAcGFyYW0geyp9IGFuc3dlciAtIFRoZSBhbnN3ZXIgdGhhdCB0aGUgdXNlciBoYXMgc3VibWl0dGVkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UgLSBUaGUgc2VydmljZSB3aGljaCBjb250YWluc1xuICAgICAgICAgICAgICogICB0aGUgZXhwbGljaXQgcnVsZXMgb2YgdGhhdCBpbnRlcmFjdGlvbi5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdH0gVGhlIHJlc3VsdGluZ1xuICAgICAgICAgICAgICogICBBbnN3ZXJDbGFzc2lmaWNhdGlvblJlc3VsdCBkb21haW4gb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRNYXRjaGluZ0NsYXNzaWZpY2F0aW9uUmVzdWx0OiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBpbnRlcmFjdGlvbkluT2xkU3RhdGUsIGFuc3dlciwgaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHZhciBhbnN3ZXJHcm91cHMgPSBpbnRlcmFjdGlvbkluT2xkU3RhdGUuYW5zd2VyR3JvdXBzO1xuICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0T3V0Y29tZSA9IGludGVyYWN0aW9uSW5PbGRTdGF0ZS5kZWZhdWx0T3V0Y29tZTtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQgPSBjbGFzc2lmeUFuc3dlcihhbnN3ZXIsIGFuc3dlckdyb3VwcywgZGVmYXVsdE91dGNvbWUsIGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB0aGUgZXhwbG9yYXRpb246IG5vICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2ludGVyYWN0aW9uUnVsZXNTZXJ2aWNlIHdhcyBhdmFpbGFibGUuJyk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdObyBpbnRlcmFjdGlvblJ1bGVzU2VydmljZSB3YXMgYXZhaWxhYmxlIHRvIGNsYXNzaWZ5IHRoZSBhbnN3ZXIuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBydWxlQmFzZWRPdXRjb21lSXNEZWZhdWx0ID0gKGFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0Lm91dGNvbWUgPT09IGRlZmF1bHRPdXRjb21lKTtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb25Jc1RyYWluYWJsZSA9IElOVEVSQUNUSU9OX1NQRUNTW2ludGVyYWN0aW9uSW5PbGRTdGF0ZS5pZF0uaXNfdHJhaW5hYmxlO1xuICAgICAgICAgICAgICAgIGlmIChydWxlQmFzZWRPdXRjb21lSXNEZWZhdWx0ICYmIGludGVyYWN0aW9uSXNUcmFpbmFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbnN3ZXJHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbnN3ZXJHcm91cHNbaV0udHJhaW5pbmdEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhbnN3ZXJHcm91cHNbaV0udHJhaW5pbmdEYXRhLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmVxdWFscyhhbnN3ZXIsIGFuc3dlckdyb3Vwc1tpXS50cmFpbmluZ0RhdGFbal0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhhbnN3ZXJHcm91cHNbaV0ub3V0Y29tZSwgaSwgbnVsbCwgVFJBSU5JTkdfREFUQV9DTEFTU0lGSUNBVElPTik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKEVOQUJMRV9NTF9DTEFTU0lGSUVSUykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNsYXNzaWZpZXIgPSBTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nU2VydmljZS5nZXRDbGFzc2lmaWVyKHN0YXRlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3NpZmllciAmJiBjbGFzc2lmaWVyLmNsYXNzaWZpZXJEYXRhICYmIChjbGFzc2lmaWVyLmFsZ29yaXRobUlkICYmIGNsYXNzaWZpZXIuZGF0YVNjaGVtYVZlcnNpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZWRpY3Rpb25TZXJ2aWNlID0gKFByZWRpY3Rpb25BbGdvcml0aG1SZWdpc3RyeVNlcnZpY2UuZ2V0UHJlZGljdGlvblNlcnZpY2UoY2xhc3NpZmllci5hbGdvcml0aG1JZCwgY2xhc3NpZmllci5kYXRhU2NoZW1hVmVyc2lvbikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHByZWRpY3Rpb24gc2VydmljZSBleGlzdHMsIHdlIHJ1biBjbGFzc2lmaWVyLiBXZSByZXR1cm4gdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGVmYXVsdCBvdXRjb21lIG90aGVyd2lzZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlZGljdGlvblNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZWRpY3RlZEFuc3dlckdyb3VwSW5kZXggPSBwcmVkaWN0aW9uU2VydmljZS5wcmVkaWN0KGNsYXNzaWZpZXIuY2xhc3NpZmllckRhdGEsIGFuc3dlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmVkaWN0ZWRBbnN3ZXJHcm91cEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQgPSAoQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhkZWZhdWx0T3V0Y29tZSwgYW5zd2VyR3JvdXBzLmxlbmd0aCwgMCwgREVGQVVMVF9PVVRDT01FX0NMQVNTSUZJQ0FUSU9OKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHQgPSAoQW5zd2VyQ2xhc3NpZmljYXRpb25SZXN1bHRPYmplY3RGYWN0b3J5LmNyZWF0ZU5ldyhhbnN3ZXJHcm91cHNbcHJlZGljdGVkQW5zd2VyR3JvdXBJbmRleF0ub3V0Y29tZSwgcHJlZGljdGVkQW5zd2VyR3JvdXBJbmRleCwgbnVsbCwgU1RBVElTVElDQUxfQ0xBU1NJRklDQVRJT04pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuc3dlckNsYXNzaWZpY2F0aW9uUmVzdWx0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzQ2xhc3NpZmllZEV4cGxpY2l0bHlPckdvZXNUb05ld1N0YXRlOiBmdW5jdGlvbiAoc3RhdGVOYW1lLCBzdGF0ZSwgYW5zd2VyLCBpbnRlcmFjdGlvblJ1bGVzU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmdldE1hdGNoaW5nQ2xhc3NpZmljYXRpb25SZXN1bHQoc3RhdGVOYW1lLCBzdGF0ZS5pbnRlcmFjdGlvbiwgYW5zd2VyLCBpbnRlcmFjdGlvblJ1bGVzU2VydmljZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChyZXN1bHQub3V0Y29tZS5kZXN0ICE9PSBzdGF0ZS5uYW1lIHx8XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jbGFzc2lmaWNhdGlvbkNhdGVnb3JpemF0aW9uICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9PVVRDT01FX0NMQVNTSUZJQ0FUSU9OKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFwcGluZyBhbGdvcml0aG1JZCB0byBQcmVkaWN0aW9uQWxnb3JpdGhtU2VydmljZS5cbiAqL1xub3BwaWEuZmFjdG9yeSgnUHJlZGljdGlvbkFsZ29yaXRobVJlZ2lzdHJ5U2VydmljZScsIFtcbiAgICAnJGluamVjdG9yJywgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhpcyBtYXBwaW5nIG5lZWRzIHRvIGJlIHVwZGF0ZWQgd2hlbmV2ZXIgYSBuZXcgcHJlZGljdGlvbiBzZXJ2aWNlIG5lZWRzXG4gICAgICAgICAqIHRvIGJlIGFkZGVkIGZvciBjbGFzc2lmaWNhdGlvbi4gVGhlIG1hcHBpbmcgaXMgZnJvbSBhbGdvcml0aG1JZCB0byBhXG4gICAgICAgICAqIGxpc3Qgb2Ygb2JqZWN0cy4gVGhlIG1hcHBpbmcgc2hvdWxkIGJlIG9mIHRoZSB0eXBlOlxuICAgICAgICAgKiB7XG4gICAgICAgICAqICAgYWxnb3JpdGhtSWQ6IHtcbiAgICAgICAgICogICAgIGRhdGFTY2hlbWFWZXJzaW9uOiBwcmVkaWN0aW9uU2VydmljZVxuICAgICAgICAgKiAgIH1cbiAgICAgICAgICogfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGFsZ29yaXRobUlkUHJlZGljdGlvblNlcnZpY2VNYXBwaW5nID0ge1xuICAgICAgICAgICAgQ29kZUNsYXNzaWZpZXI6IHtcbiAgICAgICAgICAgICAgICB2MTogJ0NvZGVSZXBsUHJlZGljdGlvblNlcnZpY2UnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgVGV4dENsYXNzaWZpZXI6IHtcbiAgICAgICAgICAgICAgICB2MTogJ1RleHRJbnB1dFByZWRpY3Rpb25TZXJ2aWNlJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0UHJlZGljdGlvblNlcnZpY2U6IGZ1bmN0aW9uIChhbGdvcml0aG1JZCwgZGF0YVNjaGVtYVZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoYWxnb3JpdGhtSWRQcmVkaWN0aW9uU2VydmljZU1hcHBpbmcuaGFzT3duUHJvcGVydHkoYWxnb3JpdGhtSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGNvbnZlcnQgZGF0YVNjaGVtYVZlcnNpb24gdG8gYSBzdHJpbmcgYmVsb3cgc2luY2UgSlMgb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAvLyBjYW4ndCBoYXZlIGludGVnZXIgcHJvcGVydGllcy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlcnZpY2VOYW1lID0gKGFsZ29yaXRobUlkUHJlZGljdGlvblNlcnZpY2VNYXBwaW5nW2FsZ29yaXRobUlkXVsndicgKyBkYXRhU2NoZW1hVmVyc2lvbi50b1N0cmluZygpXSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KHNlcnZpY2VOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBUaGUgYmVsb3cgZnVuY3Rpb24gaXMgcmVxdWlyZWQgZm9yIHJ1bm5pbmcgdGVzdHMgd2l0aCBzYW1wbGVcbiAgICAgICAgICAgIC8vIHByZWRpY3Rpb24gc2VydmljZXMuXG4gICAgICAgICAgICBzZXRNYXBwaW5nOiBmdW5jdGlvbiAobmV3QWxnb3JpdGhtSWRQcmVkaWN0aW9uU2VydmljZU1hcHBpbmcpIHtcbiAgICAgICAgICAgICAgICBhbGdvcml0aG1JZFByZWRpY3Rpb25TZXJ2aWNlTWFwcGluZyA9IChuZXdBbGdvcml0aG1JZFByZWRpY3Rpb25TZXJ2aWNlTWFwcGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2VzIGZvciBtYXBwaW5nIHN0YXRlIG5hbWVzIHRvIGNsYXNzaWZpZXIgZGV0YWlscy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2NsYXNzaWZpZXIvQ2xhc3NpZmllck9iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1N0YXRlQ2xhc3NpZmllck1hcHBpbmdTZXJ2aWNlJywgW1xuICAgICdDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeScsIGZ1bmN0aW9uIChDbGFzc2lmaWVyT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB2YXIgc3RhdGVDbGFzc2lmaWVyTWFwcGluZyA9IG51bGw7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoYmFja2VuZFN0YXRlQ2xhc3NpZmllck1hcHBpbmcpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzaWZpZXJNYXBwaW5nID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGFsZ29yaXRobUlkLCBjbGFzc2lmaWVyRGF0YSwgZGF0YVNjaGVtYVZlcnNpb247XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIGJhY2tlbmRTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrZW5kU3RhdGVDbGFzc2lmaWVyTWFwcGluZy5oYXNPd25Qcm9wZXJ0eShzdGF0ZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGdvcml0aG1JZCA9IGJhY2tlbmRTdGF0ZUNsYXNzaWZpZXJNYXBwaW5nW3N0YXRlTmFtZV0uYWxnb3JpdGhtX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NpZmllckRhdGEgPSBiYWNrZW5kU3RhdGVDbGFzc2lmaWVyTWFwcGluZ1tzdGF0ZU5hbWVdLmNsYXNzaWZpZXJfZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFTY2hlbWFWZXJzaW9uID0gYmFja2VuZFN0YXRlQ2xhc3NpZmllck1hcHBpbmdbc3RhdGVOYW1lXS5kYXRhX3NjaGVtYV92ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVDbGFzc2lmaWVyTWFwcGluZ1tzdGF0ZU5hbWVdID0gQ2xhc3NpZmllck9iamVjdEZhY3RvcnkuY3JlYXRlKGFsZ29yaXRobUlkLCBjbGFzc2lmaWVyRGF0YSwgZGF0YVNjaGVtYVZlcnNpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldENsYXNzaWZpZXI6IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVDbGFzc2lmaWVyTWFwcGluZyAmJlxuICAgICAgICAgICAgICAgICAgICBzdGF0ZUNsYXNzaWZpZXJNYXBwaW5nLmhhc093blByb3BlcnR5KHN0YXRlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlQ2xhc3NpZmllck1hcHBpbmdbc3RhdGVOYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xuLy8gU2VydmljZSBmb3Igc2VuZGluZyBldmVudHMgdG8gR29vZ2xlIEFuYWx5dGljcy5cbi8vXG4vLyBOb3RlIHRoYXQgZXZlbnRzIGFyZSBvbmx5IHNlbnQgaWYgdGhlIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgZmxhZyBpc1xuLy8gdHVybmVkIG9uLiBUaGlzIGZsYWcgbXVzdCBiZSB0dXJuZWQgb24gZXhwbGljaXRseSBieSB0aGUgYXBwbGljYXRpb25cbi8vIG93bmVyIGluIGZlY29uZi5weS5cbm9wcGlhLmZhY3RvcnkoJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgdmFyIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgPSBjb25zdGFudHMuQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUztcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9ldmVudHNcbiAgICAgICAgdmFyIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCBldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvXG4gICAgICAgIC8vICAgc29jaWFsLWludGVyYWN0aW9uc1xuICAgICAgICB2YXIgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdzb2NpYWwnLCBuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGUgc3JjRWxlbWVudCByZWZlcnMgdG8gdGhlIGVsZW1lbnQgb24gdGhlIHBhZ2UgdGhhdCBpcyBjbGlja2VkLlxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydExvZ2luRXZlbnQ6IGZ1bmN0aW9uIChzcmNFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdMb2dpbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnICcgKyBzcmNFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld1NpZ251cEV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTaWdudXBCdXR0b24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0Jyb3dzZUxpYnJhcnlCdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQnJvd3NlTGlicmFyeUJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyR29Ub0RvbmF0aW9uU2l0ZUV2ZW50OiBmdW5jdGlvbiAoZG9uYXRpb25TaXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnR29Ub0RvbmF0aW9uU2l0ZScsICdjbGljaycsIGRvbmF0aW9uU2l0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQXBwbHlUb1RlYWNoV2l0aE9wcGlhRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FwcGx5VG9UZWFjaFdpdGhPcHBpYScsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQ3JlYXRlRXhwbG9yYXRpb25CdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ3JlYXRlRXhwbG9yYXRpb25CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbkZyb21Db2xsZWN0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdDb2xsZWN0aW9uJywgJ2NyZWF0ZScsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9Qcml2YXRlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHJpdmF0ZUV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRW1iZWRJbmZvTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHVibGljRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHVibGljRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB0dXRvcmlhbCBvbiBmaXJzdCBjcmVhdGluZyBleHBsb3JhdGlvblxuICAgICAgICAgICAgcmVnaXN0ZXJUdXRvcmlhbE1vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVHV0b3JpYWxNb2RhbE9wZW4nLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRGVjbGluZVR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0RlY2xpbmVUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBY2NlcHRUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBY2NlcHRUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdmlzaXRpbmcgdGhlIGhlbHAgY2VudGVyXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrSGVscEJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tIZWxwQnV0dG9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdEhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0SGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZXhpdGluZyB0aGUgdHV0b3JpYWxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2tpcFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTa2lwVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaW5pc2hUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGZpcnN0IHRpbWUgZWRpdG9yIHVzZVxuICAgICAgICAgICAgcmVnaXN0ZXJFZGl0b3JGaXJzdEVudHJ5RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdEVudGVyRWRpdG9yJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0T3BlbkNvbnRlbnRCb3hFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0T3BlbkNvbnRlbnRCb3gnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlQ29udGVudEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlQ29udGVudCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDbGlja0FkZEludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVSdWxlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVSdWxlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZVNlY29uZFN0YXRlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENyZWF0ZVNlY29uZFN0YXRlJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHB1Ymxpc2hpbmcgZXhwbG9yYXRpb25zXG4gICAgICAgICAgICByZWdpc3RlclNhdmVQbGF5YWJsZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUGxheWFibGVFeHBsb3JhdGlvbicsICdzYXZlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuUHVibGlzaEV4cGxvcmF0aW9uTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclB1Ymxpc2hFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdE9wcGlhRnJvbUlmcmFtZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRPcHBpYUZyb21JZnJhbWUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld0NhcmQ6IGZ1bmN0aW9uIChjYXJkTnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmROdW0gPD0gMTAgfHwgY2FyZE51bSAlIDEwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyTmV3Q2FyZCcsICdjbGljaycsIGNhcmROdW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJGaW5pc2hFeHBsb3JhdGlvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5Db2xsZWN0aW9uRnJvbUxhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5GcmFjdGlvbnNGcm9tTGFuZGluZ1BhZ2UnLCAnY2xpY2snLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3Rld2FyZHNMYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAodmlld2VyVHlwZSwgYnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tCdXR0b25PblN0ZXdhcmRzUGFnZScsICdjbGljaycsIHZpZXdlclR5cGUgKyAnOicgKyBidXR0b25UZXh0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNhdmVSZWNvcmRlZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRBdWRpb1JlY29yZGluZ0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU3RhcnRBdWRpb1JlY29yZGluZycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVXBsb2FkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1VwbG9hZFJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfV0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==