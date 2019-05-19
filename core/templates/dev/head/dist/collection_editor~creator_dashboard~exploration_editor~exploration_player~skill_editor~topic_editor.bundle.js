(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~topic_editor"],{

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
/**
 * @fileoverview Factory for creating new frontend instances of AnswerGroup
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/OutcomeObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/OutcomeObjectFactory.ts");
__webpack_require__(/*! domain/exploration/RuleObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/RuleObjectFactory.ts");
oppia.factory('AnswerGroupObjectFactory', [
    'OutcomeObjectFactory', 'RuleObjectFactory',
    function (OutcomeObjectFactory, RuleObjectFactory) {
        var AnswerGroup = function (rules, outcome, trainingData, taggedMisconceptionId) {
            this.rules = rules;
            this.outcome = outcome;
            this.trainingData = trainingData;
            this.taggedMisconceptionId = taggedMisconceptionId;
        };
        AnswerGroup.prototype.toBackendDict = function () {
            return {
                rule_specs: this.rules.map(function (rule) {
                    return rule.toBackendDict();
                }),
                outcome: this.outcome.toBackendDict(),
                training_data: this.trainingData,
                tagged_misconception_id: this.taggedMisconceptionId
            };
        };
        // Static class methods. Note that "this" is not available in
        // static contexts.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AnswerGroup['createNew'] = function (
        /* eslint-enable dot-notation */
        rules, outcome, trainingData, taggedMisconceptionId) {
            return new AnswerGroup(rules, outcome, trainingData, taggedMisconceptionId);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AnswerGroup['createFromBackendDict'] = function (answerGroupBackendDict) {
            /* eslint-enable dot-notation */
            return new AnswerGroup(generateRulesFromBackend(answerGroupBackendDict.rule_specs), OutcomeObjectFactory.createFromBackendDict(answerGroupBackendDict.outcome), answerGroupBackendDict.training_data, answerGroupBackendDict.tagged_misconception_id);
        };
        var generateRulesFromBackend = function (ruleBackendDicts) {
            return ruleBackendDicts.map(function (ruleBackendDict) {
                return RuleObjectFactory.createFromBackendDict(ruleBackendDict);
            });
        };
        return AnswerGroup;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/AudioTranslationObjectFactory.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/AudioTranslationObjectFactory.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of
 * AudioTranslation domain objects.
 */
oppia.factory('AudioTranslationObjectFactory', [function () {
        var AudioTranslation = function (filename, fileSizeBytes, needsUpdate) {
            this.filename = filename;
            this.fileSizeBytes = fileSizeBytes;
            this.needsUpdate = needsUpdate;
        };
        AudioTranslation.prototype.markAsNeedingUpdate = function () {
            this.needsUpdate = true;
        };
        AudioTranslation.prototype.toggleNeedsUpdateAttribute = function () {
            this.needsUpdate = !this.needsUpdate;
        };
        AudioTranslation.prototype.getFileSizeMB = function () {
            var NUM_BYTES_IN_MB = 1 << 20;
            return this.fileSizeBytes / NUM_BYTES_IN_MB;
        };
        AudioTranslation.prototype.toBackendDict = function () {
            return {
                filename: this.filename,
                file_size_bytes: this.fileSizeBytes,
                needs_update: this.needsUpdate
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AudioTranslation['createNew'] = function (filename, fileSizeBytes) {
            /* eslint-enable dot-notation */
            return new AudioTranslation(filename, fileSizeBytes, false);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AudioTranslation['createFromBackendDict'] = function (translationBackendDict) {
            /* eslint-enable dot-notation */
            return new AudioTranslation(translationBackendDict.filename, translationBackendDict.file_size_bytes, translationBackendDict.needs_update);
        };
        return AudioTranslation;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of
 * ContentIdsToAudioTranslations domain objects.
 */
__webpack_require__(/*! domain/exploration/AudioTranslationObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/AudioTranslationObjectFactory.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
oppia.factory('ContentIdsToAudioTranslationsObjectFactory', [
    'AudioTranslationObjectFactory', 'LanguageUtilService',
    'COMPONENT_NAME_FEEDBACK', function (AudioTranslationObjectFactory, LanguageUtilService, COMPONENT_NAME_FEEDBACK) {
        var ContentIdsToAudioTranslations = function (contentIdsToAudioTranslations) {
            this._contentIdsToAudioTranslations = contentIdsToAudioTranslations;
        };
        ContentIdsToAudioTranslations.prototype.getAllContentId = function () {
            return Object.keys(this._contentIdsToAudioTranslations);
        };
        ContentIdsToAudioTranslations.prototype.getBindableAudioTranslations = (function (contentId) {
            return this._contentIdsToAudioTranslations[contentId];
        });
        ContentIdsToAudioTranslations.prototype.getAudioTranslation = function (contentId, langCode) {
            return this._contentIdsToAudioTranslations[contentId][langCode];
        };
        ContentIdsToAudioTranslations.prototype.markAllAudioAsNeedingUpdate = (function (contentId) {
            var audioTranslations = this._contentIdsToAudioTranslations[contentId];
            for (var languageCode in audioTranslations) {
                audioTranslations[languageCode].markAsNeedingUpdate();
            }
        });
        ContentIdsToAudioTranslations.prototype.getAudioLanguageCodes = function (contentId) {
            return Object.keys(this._contentIdsToAudioTranslations[contentId]);
        };
        ContentIdsToAudioTranslations.prototype.hasAudioTranslations = function (contentId) {
            return this.getAudioLanguageCodes(contentId).length > 0;
        };
        ContentIdsToAudioTranslations.prototype.hasUnflaggedAudioTranslations = (function (contentId) {
            var audioTranslations = this._contentIdsToAudioTranslations[contentId];
            for (var languageCode in audioTranslations) {
                if (!audioTranslations[languageCode].needsUpdate) {
                    return true;
                }
            }
            return false;
        });
        ContentIdsToAudioTranslations.prototype.isFullyTranslated = function (contentId) {
            var audioTranslations = this._contentIdsToAudioTranslations[contentId];
            var numLanguages = Object.keys(audioTranslations).length;
            return (numLanguages === LanguageUtilService.getAudioLanguagesCount());
        };
        ContentIdsToAudioTranslations.prototype.addContentId = function (contentId) {
            if (this._contentIdsToAudioTranslations.hasOwnProperty(contentId)) {
                throw Error('Trying to add duplicate content id.');
            }
            this._contentIdsToAudioTranslations[contentId] = {};
        };
        ContentIdsToAudioTranslations.prototype.deleteContentId = function (contentId) {
            if (!this._contentIdsToAudioTranslations.hasOwnProperty(contentId)) {
                throw Error('Unable to find the given content id.');
            }
            delete this._contentIdsToAudioTranslations[contentId];
        };
        ContentIdsToAudioTranslations.prototype.addAudioTranslation = function (contentId, languageCode, filename, fileSizeBytes) {
            var audioTranslations = this._contentIdsToAudioTranslations[contentId];
            if (audioTranslations.hasOwnProperty(languageCode)) {
                throw Error('Trying to add duplicate language code.');
            }
            audioTranslations[languageCode] = (AudioTranslationObjectFactory.createNew(filename, fileSizeBytes));
        };
        ContentIdsToAudioTranslations.prototype.deleteAudioTranslation = function (contentId, languageCode) {
            var audioTranslations = this._contentIdsToAudioTranslations[contentId];
            if (!audioTranslations.hasOwnProperty(languageCode)) {
                throw Error('Trying to remove non-existing translation for language code ' +
                    languageCode);
            }
            delete audioTranslations[languageCode];
        };
        ContentIdsToAudioTranslations.prototype.toggleNeedsUpdateAttribute = (function (contentId, languageCode) {
            var audioTranslations = this._contentIdsToAudioTranslations[contentId];
            audioTranslations[languageCode].toggleNeedsUpdateAttribute();
        });
        ContentIdsToAudioTranslations.prototype.toBackendDict = function () {
            var contentIdsToAudioTranslationsDict = {};
            for (var contentId in this._contentIdsToAudioTranslations) {
                var audioTanslations = this._contentIdsToAudioTranslations[contentId];
                var audioTranslationsDict = {};
                Object.keys(audioTanslations).forEach(function (lang) {
                    audioTranslationsDict[lang] = audioTanslations[lang].toBackendDict();
                });
                contentIdsToAudioTranslationsDict[contentId] = audioTranslationsDict;
            }
            return contentIdsToAudioTranslationsDict;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ContentIdsToAudioTranslations['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        contentIdsToAudioTranslationsDict) {
            var contentIdsToAudioTranslations = {};
            Object.keys(contentIdsToAudioTranslationsDict).forEach(function (contentId) {
                var audioTanslationsDict = (contentIdsToAudioTranslationsDict[contentId]);
                var audioTranslations = {};
                Object.keys(audioTanslationsDict).forEach(function (langCode) {
                    audioTranslations[langCode] = (AudioTranslationObjectFactory.createFromBackendDict(audioTanslationsDict[langCode]));
                });
                contentIdsToAudioTranslations[contentId] = audioTranslations;
            });
            return new ContentIdsToAudioTranslations(contentIdsToAudioTranslations);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ContentIdsToAudioTranslations['createEmpty'] = function () {
            /* eslint-enable dot-notation */
            return new ContentIdsToAudioTranslations({});
        };
        return ContentIdsToAudioTranslations;
    }
]);


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
__webpack_require__(/*! pages/exploration_player/PlayerConstants.ts */ "./core/templates/dev/head/pages/exploration_player/PlayerConstants.ts");
oppia.factory('EditableExplorationBackendApiService', [
    '$http', '$q', 'ReadOnlyExplorationBackendApiService',
    'UrlInterpolationService',
    'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
    'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
    'EXPLORATION_DATA_URL_TEMPLATE',
    'TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE',
    function ($http, $q, ReadOnlyExplorationBackendApiService, UrlInterpolationService, EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE, EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, EXPLORATION_DATA_URL_TEMPLATE, TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE) {
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
            if (!GLOBALS.can_edit && GLOBALS.can_translate) {
                return UrlInterpolationService.interpolateUrl(TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE, {
                    exploration_id: explorationId
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
/**
 * @fileoverview Factory for creating new frontend instances of Hint
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
oppia.factory('HintObjectFactory', [
    'SubtitledHtmlObjectFactory',
    function (SubtitledHtmlObjectFactory) {
        var Hint = function (hintContent) {
            this.hintContent = hintContent;
        };
        Hint.prototype.toBackendDict = function () {
            return {
                hint_content: this.hintContent.toBackendDict()
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Hint['createFromBackendDict'] = function (hintBackendDict) {
            /* eslint-enable dot-notation */
            return new Hint(SubtitledHtmlObjectFactory.createFromBackendDict(hintBackendDict.hint_content));
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Hint['createNew'] = function (hintContentId, hintContent) {
            /* eslint-enable dot-notation */
            return new Hint(SubtitledHtmlObjectFactory.createDefault(hintContent, hintContentId));
        };
        return Hint;
    }
]);


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
oppia.factory('InteractionObjectFactory', [
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
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
/**
 * @fileoverview Factory for creating new frontend instances of Outcome
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
oppia.factory('OutcomeObjectFactory', [
    'SubtitledHtmlObjectFactory',
    function (SubtitledHtmlObjectFactory) {
        var Outcome = function (dest, feedback, labelledAsCorrect, paramChanges, refresherExplorationId, missingPrerequisiteSkillId) {
            this.dest = dest;
            this.feedback = feedback;
            this.labelledAsCorrect = labelledAsCorrect;
            this.paramChanges = paramChanges;
            this.refresherExplorationId = refresherExplorationId;
            this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
        };
        Outcome.prototype.setDestination = function (newValue) {
            this.dest = newValue;
        };
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
        /**
         * Returns true iff an outcome has a self-loop, no feedback, and no
         * refresher exploration.
         */
        Outcome.prototype.isConfusing = function (currentStateName) {
            return (this.dest === currentStateName &&
                !this.hasNonemptyFeedback() &&
                this.refresherExplorationId === null);
        };
        Outcome.prototype.hasNonemptyFeedback = function () {
            return this.feedback.getHtml().trim() !== '';
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Outcome['createNew'] = function (dest, feedbackTextId, feedbackText, 
        /* eslint-enable dot-notation */
        paramChanges) {
            return new Outcome(dest, SubtitledHtmlObjectFactory.createDefault(feedbackText, feedbackTextId), false, paramChanges, null, null);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Outcome['createFromBackendDict'] = function (outcomeDict) {
            /* eslint-enable dot-notation */
            return new Outcome(outcomeDict.dest, SubtitledHtmlObjectFactory.createFromBackendDict(outcomeDict.feedback), outcomeDict.labelled_as_correct, outcomeDict.param_changes, outcomeDict.refresher_exploration_id, outcomeDict.missing_prerequisite_skill_id);
        };
        return Outcome;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/ParamChangeObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/ParamChangeObjectFactory.ts ***!
  \********************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of ParamChange
 * domain objects.
 */
oppia.factory('ParamChangeObjectFactory', [function () {
        var ParamChange = function (customizationArgs, generatorId, name) {
            this.customizationArgs = customizationArgs;
            this.generatorId = generatorId;
            this.name = name;
        };
        var DEFAULT_CUSTOMIZATION_ARGS = {
            Copier: {
                parse_with_jinja: true,
                value: '5'
            },
            RandomSelector: {
                list_of_values: ['sample value']
            }
        };
        ParamChange.prototype.toBackendDict = function () {
            return {
                customization_args: this.customizationArgs,
                generator_id: this.generatorId,
                name: this.name
            };
        };
        ParamChange.prototype.resetCustomizationArgs = function () {
            this.customizationArgs = angular.copy(DEFAULT_CUSTOMIZATION_ARGS[this.generatorId]);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ParamChange['createFromBackendDict'] = function (paramChangeBackendDict) {
            /* eslint-enable dot-notation */
            return new ParamChange(paramChangeBackendDict.customization_args, paramChangeBackendDict.generator_id, paramChangeBackendDict.name);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ParamChange['createEmpty'] = function (paramName) {
            /* eslint-enable dot-notation */
            return new ParamChange({
                parse_with_jinja: true,
                value: ''
            }, 'Copier', paramName);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        ParamChange['createDefault'] = function (paramName) {
            /* eslint-enable dot-notation */
            return new ParamChange(angular.copy(DEFAULT_CUSTOMIZATION_ARGS.Copier), 'Copier', paramName);
        };
        return ParamChange;
    }]);


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
/**
 * @fileoverview Factory for creating new frontend arrays of ParamChange
 * domain objects.
 */
__webpack_require__(/*! domain/exploration/ParamChangeObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ParamChangeObjectFactory.ts");
oppia.factory('ParamChangesObjectFactory', [
    'ParamChangeObjectFactory',
    function (ParamChangeObjectFactory) {
        var createFromBackendList = function (paramChangeBackendList) {
            return paramChangeBackendList.map(function (paramChangeBackendDict) {
                return ParamChangeObjectFactory.createFromBackendDict(paramChangeBackendDict);
            });
        };
        return {
            createFromBackendList: createFromBackendList
        };
    }
]);


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
__webpack_require__(/*! pages/exploration_player/PlayerConstants.ts */ "./core/templates/dev/head/pages/exploration_player/PlayerConstants.ts");
oppia.factory('ReadOnlyExplorationBackendApiService', [
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

/***/ "./core/templates/dev/head/domain/exploration/RecordedVoiceoversObjectFactory.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/RecordedVoiceoversObjectFactory.ts ***!
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
 * @fileoverview Factory for creating new frontend instances of
 * RecordedVoiceovers domain objects.
 */
__webpack_require__(/*! domain/exploration/VoiceoverObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/VoiceoverObjectFactory.ts");
oppia.factory('RecordedVoiceoversObjectFactory', [
    'VoiceoverObjectFactory', 'COMPONENT_NAME_FEEDBACK',
    function (VoiceoverObjectFactory, COMPONENT_NAME_FEEDBACK) {
        var RecordedVoiceovers = function (voiceoversMapping) {
            this.voiceoversMapping = voiceoversMapping;
        };
        RecordedVoiceovers.prototype.getAllContentId = function () {
            return Object.keys(this.voiceoversMapping);
        };
        RecordedVoiceovers.prototype.getBindableVoiceovers = function (contentId) {
            return this.voiceoversMapping[contentId];
        };
        RecordedVoiceovers.prototype.getVoiceover = function (contentId, langCode) {
            return this.voiceoversMapping[contentId][langCode];
        };
        RecordedVoiceovers.prototype.markAllVoiceoversAsNeedingUpdate = function (contentId) {
            var languageCodeToVoiceover = this.voiceoversMapping[contentId];
            for (var languageCode in languageCodeToVoiceover) {
                languageCodeToVoiceover[languageCode].markAsNeedingUpdate();
            }
        };
        RecordedVoiceovers.prototype.getVoiceoverLanguageCodes = function (contentId) {
            return Object.keys(this.voiceoversMapping[contentId]);
        };
        RecordedVoiceovers.prototype.hasVoiceovers = function (contentId) {
            return this.getVoiceoverLanguageCodes(contentId).length > 0;
        };
        RecordedVoiceovers.prototype.hasUnflaggedVoiceovers = function (contentId) {
            var languageCodeToVoiceover = this.voiceoversMapping[contentId];
            for (var languageCode in languageCodeToVoiceover) {
                if (!languageCodeToVoiceover[languageCode].needsUpdate) {
                    return true;
                }
            }
            return false;
        };
        RecordedVoiceovers.prototype.addContentId = function (contentId) {
            if (this.voiceoversMapping.hasOwnProperty(contentId)) {
                throw Error('Trying to add duplicate content id.');
            }
            this.voiceoversMapping[contentId] = {};
        };
        RecordedVoiceovers.prototype.deleteContentId = function (contentId) {
            if (!this.voiceoversMapping.hasOwnProperty(contentId)) {
                throw Error('Unable to find the given content id.');
            }
            delete this.voiceoversMapping[contentId];
        };
        RecordedVoiceovers.prototype.addVoiceover = function (contentId, languageCode, filename, fileSizeBytes) {
            var languageCodeToVoiceover = this.voiceoversMapping[contentId];
            if (languageCodeToVoiceover.hasOwnProperty(languageCode)) {
                throw Error('Trying to add duplicate language code.');
            }
            languageCodeToVoiceover[languageCode] = VoiceoverObjectFactory.createNew(filename, fileSizeBytes);
        };
        RecordedVoiceovers.prototype.deleteVoiceover = function (contentId, languageCode) {
            var languageCodeToVoiceover = this.voiceoversMapping[contentId];
            if (!languageCodeToVoiceover.hasOwnProperty(languageCode)) {
                throw Error('Trying to remove non-existing translation for language code ' +
                    languageCode);
            }
            delete languageCodeToVoiceover[languageCode];
        };
        RecordedVoiceovers.prototype.toggleNeedsUpdateAttribute = function (contentId, languageCode) {
            var languageCodeToVoiceover = this.voiceoversMapping[contentId];
            languageCodeToVoiceover[languageCode].toggleNeedsUpdateAttribute();
        };
        RecordedVoiceovers.prototype.toBackendDict = function () {
            var voiceoversMappingDict = {};
            for (var contentId in this.voiceoversMapping) {
                var languageCodeToVoiceover = this.voiceoversMapping[contentId];
                var languageCodeToVoiceoverDict = {};
                Object.keys(languageCodeToVoiceover).forEach(function (lang) {
                    languageCodeToVoiceoverDict[lang] = (languageCodeToVoiceover[lang].toBackendDict());
                });
                voiceoversMappingDict[contentId] = languageCodeToVoiceoverDict;
            }
            return {
                voiceovers_mapping: voiceoversMappingDict
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        RecordedVoiceovers['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        recordedVoiceoversDict) {
            var voiceoversMapping = {};
            var voiceoversMappingDict = recordedVoiceoversDict.voiceovers_mapping;
            Object.keys(voiceoversMappingDict).forEach(function (contentId) {
                var languageCodeToVoiceoverDict = voiceoversMappingDict[contentId];
                var languageCodeToVoiceover = {};
                Object.keys(languageCodeToVoiceoverDict).forEach(function (langCode) {
                    languageCodeToVoiceover[langCode] = (VoiceoverObjectFactory.createFromBackendDict(languageCodeToVoiceoverDict[langCode]));
                });
                voiceoversMapping[contentId] = languageCodeToVoiceover;
            });
            return new RecordedVoiceovers(voiceoversMapping);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        RecordedVoiceovers['createEmpty'] = function () {
            /* eslint-enable dot-notation */
            return new RecordedVoiceovers({});
        };
        return RecordedVoiceovers;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/RuleObjectFactory.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/RuleObjectFactory.ts ***!
  \*************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of Rule
 * domain objects.
 */
oppia.factory('RuleObjectFactory', [function () {
        var Rule = function (type, inputs) {
            this.type = type;
            this.inputs = inputs;
        };
        Rule.prototype.toBackendDict = function () {
            return {
                rule_type: this.type,
                inputs: this.inputs
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Rule['createNew'] = function (type, inputs) {
            /* eslint-enable dot-notation */
            return new Rule(type, inputs);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Rule['createFromBackendDict'] = function (ruleDict) {
            /* eslint-enable dot-notation */
            return new Rule(ruleDict.rule_type, ruleDict.inputs);
        };
        return Rule;
    }]);


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
oppia.factory('SolutionObjectFactory', [
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Solution['createFromBackendDict'] = function (solutionBackendDict) {
            /* eslint-enable dot-notation */
            return new Solution(solutionBackendDict.answer_is_exclusive, solutionBackendDict.correct_answer, SubtitledHtmlObjectFactory.createFromBackendDict(solutionBackendDict.explanation));
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
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
oppia.factory('StatesObjectFactory', [
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
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

/***/ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts":
/*!**********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts ***!
  \**********************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of SubtitledHtml
 * domain objects.
 */
oppia.factory('SubtitledHtmlObjectFactory', [function () {
        var SubtitledHtml = function (html, contentId) {
            this._html = html;
            this._contentId = contentId;
        };
        SubtitledHtml.prototype.getHtml = function () {
            return this._html;
        };
        SubtitledHtml.prototype.getContentId = function () {
            return this._contentId;
        };
        SubtitledHtml.prototype.setHtml = function (newHtml) {
            this._html = newHtml;
        };
        SubtitledHtml.prototype.hasNoHtml = function () {
            return !this._html;
        };
        SubtitledHtml.prototype.toBackendDict = function () {
            return {
                html: this._html,
                content_id: this._contentId
            };
        };
        SubtitledHtml.prototype.isEmpty = function () {
            return this.hasNoHtml();
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        SubtitledHtml['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        subtitledHtmlBackendDict) {
            return new SubtitledHtml(subtitledHtmlBackendDict.html, subtitledHtmlBackendDict.content_id);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        SubtitledHtml['createDefault'] = function (html, contentId) {
            /* eslint-enable dot-notation */
            return new SubtitledHtml(html, contentId);
        };
        return SubtitledHtml;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/VoiceoverObjectFactory.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/VoiceoverObjectFactory.ts ***!
  \******************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of
 * Voiceover domain objects.
 */
oppia.factory('VoiceoverObjectFactory', [function () {
        var Voiceover = function (filename, fileSizeBytes, needsUpdate) {
            this.filename = filename;
            this.fileSizeBytes = fileSizeBytes;
            this.needsUpdate = needsUpdate;
        };
        Voiceover.prototype.markAsNeedingUpdate = function () {
            this.needsUpdate = true;
        };
        Voiceover.prototype.toggleNeedsUpdateAttribute = function () {
            this.needsUpdate = !this.needsUpdate;
        };
        Voiceover.prototype.getFileSizeMB = function () {
            var NUM_BYTES_IN_MB = 1 << 20;
            return this.fileSizeBytes / NUM_BYTES_IN_MB;
        };
        Voiceover.prototype.toBackendDict = function () {
            return {
                filename: this.filename,
                file_size_bytes: this.fileSizeBytes,
                needs_update: this.needsUpdate
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Voiceover['createNew'] = function (filename, fileSizeBytes) {
            /* eslint-enable dot-notation */
            return new Voiceover(filename, fileSizeBytes, false);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Voiceover['createFromBackendDict'] = function (translationBackendDict) {
            /* eslint-enable dot-notation */
            return new Voiceover(translationBackendDict.filename, translationBackendDict.file_size_bytes, translationBackendDict.needs_update);
        };
        return Voiceover;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/exploration/WrittenTranslationObjectFactory.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/exploration/WrittenTranslationObjectFactory.ts ***!
  \***************************************************************************************/
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
 * @fileoverview Factory for creating new frontend instances of
 * WrittenTranslation domain objects.
 */
oppia.factory('WrittenTranslationObjectFactory', [function () {
        var WrittenTranslation = function (html, needsUpdate) {
            this.html = html;
            this.needsUpdate = needsUpdate;
        };
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
        WrittenTranslation.prototype.toBackendDict = function () {
            return {
                html: this.html,
                needs_update: this.needsUpdate
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        WrittenTranslation['createNew'] = function (html) {
            /* eslint-enable dot-notation */
            return new WrittenTranslation(html, false);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        WrittenTranslation['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        translationBackendDict) {
            return new WrittenTranslation(translationBackendDict.html, translationBackendDict.needs_update);
        };
        return WrittenTranslation;
    }]);


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
/**
 * @fileoverview Factory for creating new frontend instances of
 * WrittenTranslations domain objects.
 */
__webpack_require__(/*! domain/exploration/AudioTranslationObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/AudioTranslationObjectFactory.ts");
__webpack_require__(/*! domain/exploration/WrittenTranslationObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/WrittenTranslationObjectFactory.ts");
__webpack_require__(/*! domain/utilities/LanguageUtilService.ts */ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts");
oppia.factory('WrittenTranslationsObjectFactory', [
    'WrittenTranslationObjectFactory', function (WrittenTranslationObjectFactory) {
        var WrittenTranslations = function (translationsMapping) {
            this.translationsMapping = translationsMapping;
        };
        WrittenTranslations.prototype.getAllContentId = function () {
            return Object.keys(this.translationsMapping);
        };
        WrittenTranslations.prototype.getWrittenTranslation = function (contentId, langCode) {
            return this.translationsMapping[contentId][langCode];
        };
        WrittenTranslations.prototype.markAllTranslationsAsNeedingUpdate = (function (contentId) {
            var languageCodeToWrittenTranslation = (this.translationsMapping[contentId]);
            for (var languageCode in languageCodeToWrittenTranslation) {
                languageCodeToWrittenTranslation[languageCode].markAsNeedingUpdate();
            }
        });
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
            writtenTranslations[languageCode] = (WrittenTranslationObjectFactory.createNew(html));
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
        WrittenTranslations.prototype.toggleNeedsUpdateAttribute = (function (contentId, languageCode) {
            var writtenTranslations = this.translationsMapping[contentId];
            writtenTranslations[languageCode].toggleNeedsUpdateAttribute();
        });
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        WrittenTranslations['createFromBackendDict'] = function (
        /* eslint-enable dot-notation */
        writtenTranslationsDict) {
            var translationsMapping = {};
            Object.keys(writtenTranslationsDict.translations_mapping).forEach(function (contentId) {
                translationsMapping[contentId] = {};
                var languageCodeToWrittenTranslationDict = (writtenTranslationsDict.translations_mapping[contentId]);
                Object.keys(languageCodeToWrittenTranslationDict).forEach(function (langCode) {
                    translationsMapping[contentId][langCode] = (WrittenTranslationObjectFactory.createFromBackendDict(languageCodeToWrittenTranslationDict[langCode]));
                });
            });
            return new WrittenTranslations(translationsMapping);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        WrittenTranslations['createEmpty'] = function () {
            /* eslint-enable dot-notation */
            return new WrittenTranslations({});
        };
        return WrittenTranslations;
    }
]);


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
__webpack_require__(/*! domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts");
__webpack_require__(/*! domain/exploration/RecordedVoiceoversObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/RecordedVoiceoversObjectFactory.ts");
__webpack_require__(/*! domain/exploration/InteractionObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/InteractionObjectFactory.ts");
__webpack_require__(/*! domain/exploration/ParamChangesObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/ParamChangesObjectFactory.ts");
__webpack_require__(/*! domain/exploration/SubtitledHtmlObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/SubtitledHtmlObjectFactory.ts");
__webpack_require__(/*! domain/exploration/WrittenTranslationsObjectFactory.ts */ "./core/templates/dev/head/domain/exploration/WrittenTranslationsObjectFactory.ts");
oppia.factory('StateObjectFactory', [
    'InteractionObjectFactory', 'ParamChangesObjectFactory',
    'RecordedVoiceoversObjectFactory', 'SubtitledHtmlObjectFactory',
    'WrittenTranslationsObjectFactory', function (InteractionObjectFactory, ParamChangesObjectFactory, RecordedVoiceoversObjectFactory, SubtitledHtmlObjectFactory, WrittenTranslationsObjectFactory) {
        var State = function (name, classifierModelId, content, interaction, paramChanges, recordedVoiceovers, writtenTranslations) {
            this.name = name;
            this.classifierModelId = classifierModelId;
            this.content = content;
            this.interaction = interaction;
            this.paramChanges = paramChanges;
            this.recordedVoiceovers = recordedVoiceovers;
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
            this.writtenTranslations = angular.copy(otherState.writtenTranslations);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        State['createDefaultState'] = function (newStateName) {
            /* eslint-enable dot-notation */
            var newStateTemplate = angular.copy(constants.NEW_STATE_TEMPLATE);
            var newState = this.createFromBackendDict(newStateName, {
                classifier_model_id: newStateTemplate.classifier_model_id,
                content: newStateTemplate.content,
                interaction: newStateTemplate.interaction,
                param_changes: newStateTemplate.param_changes,
                recorded_voiceovers: newStateTemplate.recorded_voiceovers,
                written_translations: newStateTemplate.written_translations
            });
            newState.interaction.defaultOutcome.dest = newStateName;
            return newState;
        };
        // Static class methods. Note that "this" is not available in
        // static contexts.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        State['createFromBackendDict'] = function (stateName, stateDict) {
            /* eslint-enable dot-notation */
            return new State(stateName, stateDict.classifier_model_id, SubtitledHtmlObjectFactory.createFromBackendDict(stateDict.content), InteractionObjectFactory.createFromBackendDict(stateDict.interaction), ParamChangesObjectFactory.createFromBackendList(stateDict.param_changes), RecordedVoiceoversObjectFactory.createFromBackendDict(stateDict.recorded_voiceovers), WrittenTranslationsObjectFactory.createFromBackendDict(stateDict.written_translations));
        };
        return State;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/AudioLanguageObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/AudioLanguageObjectFactory.ts ***!
  \********************************************************************************/
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
 * @fileoverview Object factory for creating audio languages.
 */
oppia.factory('AudioLanguageObjectFactory', [
    function () {
        var AudioLanguage = function (id, description, relatedLanguages) {
            this.id = id;
            this.description = description;
            this.relatedLanguages = relatedLanguages;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AudioLanguage['createFromDict'] = function (audioLanguageDict) {
            /* eslint-enable dot-notation */
            return new AudioLanguage(audioLanguageDict.id, audioLanguageDict.description, audioLanguageDict.related_languages);
        };
        return AudioLanguage;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts ***!
  \*********************************************************************************************/
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
 * @fileoverview Object factory for creating autogenerated audio languages.
 */
oppia.factory('AutogeneratedAudioLanguageObjectFactory', [
    function () {
        var AutogeneratedAudioLanguage = function (id, description, explorationLanguage, speechSynthesisCode, speechSynthesisCodeMobile) {
            this.id = id;
            this.description = description;
            this.explorationLanguage = explorationLanguage;
            this.speechSynthesisCode = speechSynthesisCode;
            this.speechSynthesisCodeMobile = speechSynthesisCodeMobile;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        AutogeneratedAudioLanguage['createFromDict'] = (
        /* eslint-enable dot-notation */
        function (autogeneratedAudioLanguageDict) {
            return new AutogeneratedAudioLanguage(autogeneratedAudioLanguageDict.id, autogeneratedAudioLanguageDict.description, autogeneratedAudioLanguageDict.exploration_language, autogeneratedAudioLanguageDict.speech_synthesis_code, autogeneratedAudioLanguageDict.speech_synthesis_code_mobile);
        });
        return AutogeneratedAudioLanguage;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/utilities/LanguageUtilService.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/LanguageUtilService.ts ***!
  \*************************************************************************/
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
 * @fileoverview Utility service for language operations.
 */
__webpack_require__(/*! domain/utilities/AudioLanguageObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/AudioLanguageObjectFactory.ts");
__webpack_require__(/*! domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts */ "./core/templates/dev/head/domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts");
__webpack_require__(/*! domain/utilities/BrowserCheckerService.ts */ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts");
oppia.factory('LanguageUtilService', [
    'AudioLanguageObjectFactory', 'AutogeneratedAudioLanguageObjectFactory',
    'BrowserCheckerService', 'ALL_LANGUAGE_CODES',
    'AUTOGENERATED_AUDIO_LANGUAGES', 'SUPPORTED_AUDIO_LANGUAGES',
    function (AudioLanguageObjectFactory, AutogeneratedAudioLanguageObjectFactory, BrowserCheckerService, ALL_LANGUAGE_CODES, AUTOGENERATED_AUDIO_LANGUAGES, SUPPORTED_AUDIO_LANGUAGES) {
        var supportedAudioLanguageList = SUPPORTED_AUDIO_LANGUAGES;
        var autogeneratedAudioLanguageList = AUTOGENERATED_AUDIO_LANGUAGES;
        var supportedAudioLanguages = {};
        var autogeneratedAudioLanguagesByExplorationLanguageCode = {};
        var autogeneratedAudioLanguagesByAutogeneratedLanguageCode = {};
        var getShortLanguageDescription = function (fullLanguageDescription) {
            var ind = fullLanguageDescription.indexOf(' (');
            if (ind === -1) {
                return fullLanguageDescription;
            }
            else {
                return fullLanguageDescription.substring(0, ind);
            }
        };
        var languageIdsAndTexts = ALL_LANGUAGE_CODES.map(function (languageItem) {
            return {
                id: languageItem.code,
                text: getShortLanguageDescription(languageItem.description)
            };
        });
        var allAudioLanguageCodes = (supportedAudioLanguageList.map(function (audioLanguage) {
            return audioLanguage.id;
        }));
        supportedAudioLanguageList.forEach(function (audioLanguageDict) {
            supportedAudioLanguages[audioLanguageDict.id] =
                AudioLanguageObjectFactory.createFromDict(audioLanguageDict);
        });
        autogeneratedAudioLanguageList.forEach(function (autogeneratedAudioLanguageDict) {
            var autogeneratedAudioLanguage = AutogeneratedAudioLanguageObjectFactory.createFromDict(autogeneratedAudioLanguageDict);
            autogeneratedAudioLanguagesByExplorationLanguageCode[autogeneratedAudioLanguage.explorationLanguage] =
                autogeneratedAudioLanguage;
            autogeneratedAudioLanguagesByAutogeneratedLanguageCode[autogeneratedAudioLanguage.id] =
                autogeneratedAudioLanguage;
        });
        var audioLanguagesCount = allAudioLanguageCodes.length;
        return {
            getLanguageIdsAndTexts: function () {
                return languageIdsAndTexts;
            },
            getAudioLanguagesCount: function () {
                return audioLanguagesCount;
            },
            getAllVoiceoverLanguageCodes: function () {
                return angular.copy(allAudioLanguageCodes);
            },
            getAudioLanguageDescription: function (audioLanguageCode) {
                return supportedAudioLanguages[audioLanguageCode].description;
            },
            // Given a list of audio language codes, returns the complement list, i.e.
            // the list of audio language codes not in the input list.
            getComplementAudioLanguageCodes: function (audioLanguageCodes) {
                return allAudioLanguageCodes.filter(function (languageCode) {
                    return audioLanguageCodes.indexOf(languageCode) === -1;
                });
            },
            getLanguageCodesRelatedToAudioLanguageCode: function (audioLanguageCode) {
                return supportedAudioLanguages[audioLanguageCode].relatedLanguages;
            },
            supportsAutogeneratedAudio: function (explorationLanguageCode) {
                return (BrowserCheckerService.supportsSpeechSynthesis() &&
                    autogeneratedAudioLanguagesByExplorationLanguageCode
                        .hasOwnProperty(explorationLanguageCode));
            },
            isAutogeneratedAudioLanguage: function (audioLanguageCode) {
                return autogeneratedAudioLanguagesByAutogeneratedLanguageCode
                    .hasOwnProperty(audioLanguageCode);
            },
            getAutogeneratedAudioLanguage: function (explorationLanguageCode) {
                return autogeneratedAudioLanguagesByExplorationLanguageCode[explorationLanguageCode];
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
angular.module('stringUtilityFiltersModule').filter('camelCaseToHyphens', [function () {
        return function (input) {
            var result = input.replace(/([a-z])?([A-Z])/g, '$1-$2').toLowerCase();
            if (result[0] === '-') {
                result = result.substring(1);
            }
            return result;
        };
    }
]);


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
angular.module('stringUtilityFiltersModule').filter('normalizeWhitespace', ['UtilsService', function (UtilsService) {
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

/***/ "./core/templates/dev/head/pages/exploration_player/PlayerConstants.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration_player/PlayerConstants.ts ***!
  \*****************************************************************************/
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
/**
 * @fileoverview Contstans to be used in the learner view.
 */
oppia.constant('CONTENT_FOCUS_LABEL_PREFIX', 'content-focus-label-');
oppia.constant('TWO_CARD_THRESHOLD_PX', 960);
oppia.constant('CONTINUE_BUTTON_FOCUS_LABEL', 'continueButton');
/* New card is available but user hasn't gone to it yet (when oppia
   gives a feedback and waits for user to press 'continue').
   Not called when a card is selected by clicking progress dots */
oppia.constant('EVENT_NEW_CARD_AVAILABLE', 'newCardAvailable');
/* Called when the learner moves to a new card that they haven't seen before. */
oppia.constant('EVENT_NEW_CARD_OPENED', 'newCardOpened');
/* Called always when learner moves to a new card.
   Also called when card is selected by clicking on progress dots */
oppia.constant('EVENT_ACTIVE_CARD_CHANGED', 'activeCardChanged');
/* Called when a new audio-equippable component is loaded and displayed
   to the user, allowing for the automatic playing of audio if necessary. */
oppia.constant('EVENT_AUTOPLAY_AUDIO', 'autoPlayAudio');
// The enforced waiting period before the first hint request.
oppia.constant('WAIT_FOR_FIRST_HINT_MSEC', 60000);
// The enforced waiting period before each of the subsequent hint requests.
oppia.constant('WAIT_FOR_SUBSEQUENT_HINTS_MSEC', 30000);
// The time delay between the learner clicking the hint button
// and the appearance of the hint.
oppia.constant('DELAY_FOR_HINT_FEEDBACK_MSEC', 100);
// Array of i18n IDs for the possible hint request strings.
oppia.constant('HINT_REQUEST_STRING_I18N_IDS', [
    'I18N_PLAYER_HINT_REQUEST_STRING_1',
    'I18N_PLAYER_HINT_REQUEST_STRING_2',
    'I18N_PLAYER_HINT_REQUEST_STRING_3'
]);
oppia.constant('EXPLORATION_DATA_URL_TEMPLATE', '/explorehandler/init/<exploration_id>');
oppia.constant('EXPLORATION_VERSION_DATA_URL_TEMPLATE', '/explorehandler/init/<exploration_id>?v=<version>');
oppia.constant('EDITABLE_EXPLORATION_DATA_URL_TEMPLATE', '/createhandler/data/<exploration_id>');
oppia.constant('EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE', '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');
oppia.constant('TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE', '/createhandler/translate/<exploration_id>');
/* This should match the CSS class defined in the tutor card directive. */
oppia.constant('AUDIO_HIGHLIGHT_CSS_CLASS', 'conversation-skin-audio-highlight');


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
oppia.factory('ExplorationHtmlFormatterService', [
    '$filter', 'ExtensionTagAssemblerService', 'HtmlEscaperService',
    'INTERACTION_SPECS',
    function ($filter, ExtensionTagAssemblerService, HtmlEscaperService, INTERACTION_SPECS) {
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
oppia.factory('ExtensionTagAssemblerService', [
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
oppia.factory('ValidatorsService', [
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

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9BdWRpb1RyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9FZGl0YWJsZUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL0hpbnRPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9JbnRlcmFjdGlvbk9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL091dGNvbWVPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9leHBsb3JhdGlvbi9QYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1BhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1JlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vUnVsZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1NvbHV0aW9uT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vU3RhdGVzT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZXhwbG9yYXRpb24vU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1ZvaWNlb3Zlck9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9zdGF0ZS9TdGF0ZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL3V0aWxpdGllcy9BdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0F1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL0xhbmd1YWdlVXRpbFNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NhbWVsLWNhc2UtdG8taHlwaGVucy5maWx0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL25vcm1hbGl6ZS13aGl0ZXNwYWNlLmZpbHRlci50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbl9wbGF5ZXIvUGxheWVyQ29uc3RhbnRzLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0V4cGxvcmF0aW9uSHRtbEZvcm1hdHRlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvRXh0ZW5zaW9uVGFnQXNzZW1ibGVyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9WYWxpZGF0b3JzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SEFBNEM7QUFDcEQsbUJBQU8sQ0FBQyxrSEFBeUM7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNyREw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMElBQXFEO0FBQzdELG1CQUFPLENBQUMsa0hBQXlDO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyx3SkFBNEQ7QUFDcEUsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0QztBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvSUFBa0Q7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RCxtQkFBTyxDQUFDLGtIQUF5QztBQUNqRCxtQkFBTyxDQUFDLHdIQUE0QztBQUNwRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0lBQWtEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDaEVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsNEhBQThDO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QztBQUM1QztBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUN6Q0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0lBQWtEO0FBQzFELG1CQUFPLENBQUMsa0hBQXlDO0FBQ2pELG1CQUFPLENBQUMsZ0lBQWdEO0FBQ3hELG1CQUFPLENBQUMsZ0tBQWdFO0FBQ3hFLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JELG1CQUFPLENBQUMsZ0dBQWdDO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHdHQUFvQztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLG1CQUFtQjtBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsbUJBQW1CO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3JETDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUN0REw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMElBQXFEO0FBQzdELG1CQUFPLENBQUMsOElBQXVEO0FBQy9ELG1CQUFPLENBQUMsa0hBQXlDO0FBQ2pEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxvQkFBb0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxvS0FBa0U7QUFDMUUsbUJBQU8sQ0FBQyw4SUFBdUQ7QUFDL0QsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQsbUJBQU8sQ0FBQyxrSUFBaUQ7QUFDekQsbUJBQU8sQ0FBQyxvSUFBa0Q7QUFDMUQsbUJBQU8sQ0FBQyxnSkFBd0Q7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLGdJQUFnRDtBQUN4RCxtQkFBTyxDQUFDLDBKQUE2RDtBQUNyRSxtQkFBTyxDQUFDLHNIQUEyQztBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakIsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsb0ZBQTBCO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQ0FBMEMsR0FBRztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsZ0tBQWdFO0FBQ3hFLG1CQUFPLENBQUMsb0hBQTBDO0FBQ2xELG1CQUFPLENBQUMsZ0dBQWdDO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsT0FBTztBQUM5Qix1QkFBdUIsT0FBTztBQUM5QjtBQUNBLHVCQUF1QixRQUFRO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnS0FBZ0U7QUFDeEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDhKQUErRDtBQUN2RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixPQUFPO0FBQzlCLHVCQUF1QixRQUFRO0FBQy9CO0FBQ0Esd0JBQXdCLFFBQVE7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLCtCQUErQjtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvbGxlY3Rpb25fZWRpdG9yfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+c2tpbGxfZWRpdG9yfnRvcGljX2VkaXRvci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgQW5zd2VyR3JvdXBcbiAqIGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vT3V0Y29tZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9SdWxlT2JqZWN0RmFjdG9yeS50cycpO1xub3BwaWEuZmFjdG9yeSgnQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5JywgW1xuICAgICdPdXRjb21lT2JqZWN0RmFjdG9yeScsICdSdWxlT2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKE91dGNvbWVPYmplY3RGYWN0b3J5LCBSdWxlT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB2YXIgQW5zd2VyR3JvdXAgPSBmdW5jdGlvbiAocnVsZXMsIG91dGNvbWUsIHRyYWluaW5nRGF0YSwgdGFnZ2VkTWlzY29uY2VwdGlvbklkKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgICAgICAgICB0aGlzLm91dGNvbWUgPSBvdXRjb21lO1xuICAgICAgICAgICAgdGhpcy50cmFpbmluZ0RhdGEgPSB0cmFpbmluZ0RhdGE7XG4gICAgICAgICAgICB0aGlzLnRhZ2dlZE1pc2NvbmNlcHRpb25JZCA9IHRhZ2dlZE1pc2NvbmNlcHRpb25JZDtcbiAgICAgICAgfTtcbiAgICAgICAgQW5zd2VyR3JvdXAucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHJ1bGVfc3BlY3M6IHRoaXMucnVsZXMubWFwKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydWxlLnRvQmFja2VuZERpY3QoKTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBvdXRjb21lOiB0aGlzLm91dGNvbWUudG9CYWNrZW5kRGljdCgpLFxuICAgICAgICAgICAgICAgIHRyYWluaW5nX2RhdGE6IHRoaXMudHJhaW5pbmdEYXRhLFxuICAgICAgICAgICAgICAgIHRhZ2dlZF9taXNjb25jZXB0aW9uX2lkOiB0aGlzLnRhZ2dlZE1pc2NvbmNlcHRpb25JZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gU3RhdGljIGNsYXNzIG1ldGhvZHMuIE5vdGUgdGhhdCBcInRoaXNcIiBpcyBub3QgYXZhaWxhYmxlIGluXG4gICAgICAgIC8vIHN0YXRpYyBjb250ZXh0cy5cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQW5zd2VyR3JvdXBbJ2NyZWF0ZU5ldyddID0gZnVuY3Rpb24gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBydWxlcywgb3V0Y29tZSwgdHJhaW5pbmdEYXRhLCB0YWdnZWRNaXNjb25jZXB0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQW5zd2VyR3JvdXAocnVsZXMsIG91dGNvbWUsIHRyYWluaW5nRGF0YSwgdGFnZ2VkTWlzY29uY2VwdGlvbklkKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQW5zd2VyR3JvdXBbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKGFuc3dlckdyb3VwQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IEFuc3dlckdyb3VwKGdlbmVyYXRlUnVsZXNGcm9tQmFja2VuZChhbnN3ZXJHcm91cEJhY2tlbmREaWN0LnJ1bGVfc3BlY3MpLCBPdXRjb21lT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoYW5zd2VyR3JvdXBCYWNrZW5kRGljdC5vdXRjb21lKSwgYW5zd2VyR3JvdXBCYWNrZW5kRGljdC50cmFpbmluZ19kYXRhLCBhbnN3ZXJHcm91cEJhY2tlbmREaWN0LnRhZ2dlZF9taXNjb25jZXB0aW9uX2lkKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGdlbmVyYXRlUnVsZXNGcm9tQmFja2VuZCA9IGZ1bmN0aW9uIChydWxlQmFja2VuZERpY3RzKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVsZUJhY2tlbmREaWN0cy5tYXAoZnVuY3Rpb24gKHJ1bGVCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBSdWxlT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QocnVsZUJhY2tlbmREaWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQW5zd2VyR3JvdXA7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2ZcbiAqIEF1ZGlvVHJhbnNsYXRpb24gZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0F1ZGlvVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIEF1ZGlvVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGZpbGVTaXplQnl0ZXMsIG5lZWRzVXBkYXRlKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgICAgICAgICB0aGlzLmZpbGVTaXplQnl0ZXMgPSBmaWxlU2l6ZUJ5dGVzO1xuICAgICAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9IG5lZWRzVXBkYXRlO1xuICAgICAgICB9O1xuICAgICAgICBBdWRpb1RyYW5zbGF0aW9uLnByb3RvdHlwZS5tYXJrQXNOZWVkaW5nVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIEF1ZGlvVHJhbnNsYXRpb24ucHJvdG90eXBlLnRvZ2dsZU5lZWRzVXBkYXRlQXR0cmlidXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9ICF0aGlzLm5lZWRzVXBkYXRlO1xuICAgICAgICB9O1xuICAgICAgICBBdWRpb1RyYW5zbGF0aW9uLnByb3RvdHlwZS5nZXRGaWxlU2l6ZU1CID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIE5VTV9CWVRFU19JTl9NQiA9IDEgPDwgMjA7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlU2l6ZUJ5dGVzIC8gTlVNX0JZVEVTX0lOX01CO1xuICAgICAgICB9O1xuICAgICAgICBBdWRpb1RyYW5zbGF0aW9uLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZSxcbiAgICAgICAgICAgICAgICBmaWxlX3NpemVfYnl0ZXM6IHRoaXMuZmlsZVNpemVCeXRlcyxcbiAgICAgICAgICAgICAgICBuZWVkc191cGRhdGU6IHRoaXMubmVlZHNVcGRhdGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEF1ZGlvVHJhbnNsYXRpb25bJ2NyZWF0ZU5ldyddID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBmaWxlU2l6ZUJ5dGVzKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBdWRpb1RyYW5zbGF0aW9uKGZpbGVuYW1lLCBmaWxlU2l6ZUJ5dGVzLCBmYWxzZSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEF1ZGlvVHJhbnNsYXRpb25bJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKHRyYW5zbGF0aW9uQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IEF1ZGlvVHJhbnNsYXRpb24odHJhbnNsYXRpb25CYWNrZW5kRGljdC5maWxlbmFtZSwgdHJhbnNsYXRpb25CYWNrZW5kRGljdC5maWxlX3NpemVfYnl0ZXMsIHRyYW5zbGF0aW9uQmFja2VuZERpY3QubmVlZHNfdXBkYXRlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEF1ZGlvVHJhbnNsYXRpb247XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mXG4gKiBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucyBkb21haW4gb2JqZWN0cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL0F1ZGlvVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0xhbmd1YWdlVXRpbFNlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ0NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zT2JqZWN0RmFjdG9yeScsIFtcbiAgICAnQXVkaW9UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnknLCAnTGFuZ3VhZ2VVdGlsU2VydmljZScsXG4gICAgJ0NPTVBPTkVOVF9OQU1FX0ZFRURCQUNLJywgZnVuY3Rpb24gKEF1ZGlvVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5LCBMYW5ndWFnZVV0aWxTZXJ2aWNlLCBDT01QT05FTlRfTkFNRV9GRUVEQkFDSykge1xuICAgICAgICB2YXIgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMgPSBmdW5jdGlvbiAoY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zID0gY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnM7XG4gICAgICAgIH07XG4gICAgICAgIENvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zLnByb3RvdHlwZS5nZXRBbGxDb250ZW50SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5fY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuZ2V0QmluZGFibGVBdWRpb1RyYW5zbGF0aW9ucyA9IChmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNbY29udGVudElkXTtcbiAgICAgICAgfSk7XG4gICAgICAgIENvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zLnByb3RvdHlwZS5nZXRBdWRpb1RyYW5zbGF0aW9uID0gZnVuY3Rpb24gKGNvbnRlbnRJZCwgbGFuZ0NvZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9uc1tjb250ZW50SWRdW2xhbmdDb2RlXTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMucHJvdG90eXBlLm1hcmtBbGxBdWRpb0FzTmVlZGluZ1VwZGF0ZSA9IChmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICB2YXIgYXVkaW9UcmFuc2xhdGlvbnMgPSB0aGlzLl9jb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9uc1tjb250ZW50SWRdO1xuICAgICAgICAgICAgZm9yICh2YXIgbGFuZ3VhZ2VDb2RlIGluIGF1ZGlvVHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgYXVkaW9UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXS5tYXJrQXNOZWVkaW5nVXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuZ2V0QXVkaW9MYW5ndWFnZUNvZGVzID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zW2NvbnRlbnRJZF0pO1xuICAgICAgICB9O1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuaGFzQXVkaW9UcmFuc2xhdGlvbnMgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBdWRpb0xhbmd1YWdlQ29kZXMoY29udGVudElkKS5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuaGFzVW5mbGFnZ2VkQXVkaW9UcmFuc2xhdGlvbnMgPSAoZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgdmFyIGF1ZGlvVHJhbnNsYXRpb25zID0gdGhpcy5fY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNbY29udGVudElkXTtcbiAgICAgICAgICAgIGZvciAodmFyIGxhbmd1YWdlQ29kZSBpbiBhdWRpb1RyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmICghYXVkaW9UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXS5uZWVkc1VwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuaXNGdWxseVRyYW5zbGF0ZWQgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICB2YXIgYXVkaW9UcmFuc2xhdGlvbnMgPSB0aGlzLl9jb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9uc1tjb250ZW50SWRdO1xuICAgICAgICAgICAgdmFyIG51bUxhbmd1YWdlcyA9IE9iamVjdC5rZXlzKGF1ZGlvVHJhbnNsYXRpb25zKS5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gKG51bUxhbmd1YWdlcyA9PT0gTGFuZ3VhZ2VVdGlsU2VydmljZS5nZXRBdWRpb0xhbmd1YWdlc0NvdW50KCkpO1xuICAgICAgICB9O1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuYWRkQ29udGVudElkID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zLmhhc093blByb3BlcnR5KGNvbnRlbnRJZCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVHJ5aW5nIHRvIGFkZCBkdXBsaWNhdGUgY29udGVudCBpZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zW2NvbnRlbnRJZF0gPSB7fTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMucHJvdG90eXBlLmRlbGV0ZUNvbnRlbnRJZCA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMuaGFzT3duUHJvcGVydHkoY29udGVudElkKSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdVbmFibGUgdG8gZmluZCB0aGUgZ2l2ZW4gY29udGVudCBpZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9uc1tjb250ZW50SWRdO1xuICAgICAgICB9O1xuICAgICAgICBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucy5wcm90b3R5cGUuYWRkQXVkaW9UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmd1YWdlQ29kZSwgZmlsZW5hbWUsIGZpbGVTaXplQnl0ZXMpIHtcbiAgICAgICAgICAgIHZhciBhdWRpb1RyYW5zbGF0aW9ucyA9IHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoYXVkaW9UcmFuc2xhdGlvbnMuaGFzT3duUHJvcGVydHkobGFuZ3VhZ2VDb2RlKSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUcnlpbmcgdG8gYWRkIGR1cGxpY2F0ZSBsYW5ndWFnZSBjb2RlLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXVkaW9UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXSA9IChBdWRpb1RyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGZpbGVTaXplQnl0ZXMpKTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMucHJvdG90eXBlLmRlbGV0ZUF1ZGlvVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAoY29udGVudElkLCBsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBhdWRpb1RyYW5zbGF0aW9ucyA9IHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoIWF1ZGlvVHJhbnNsYXRpb25zLmhhc093blByb3BlcnR5KGxhbmd1YWdlQ29kZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVHJ5aW5nIHRvIHJlbW92ZSBub24tZXhpc3RpbmcgdHJhbnNsYXRpb24gZm9yIGxhbmd1YWdlIGNvZGUgJyArXG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlQ29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgYXVkaW9UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXTtcbiAgICAgICAgfTtcbiAgICAgICAgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMucHJvdG90eXBlLnRvZ2dsZU5lZWRzVXBkYXRlQXR0cmlidXRlID0gKGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgdmFyIGF1ZGlvVHJhbnNsYXRpb25zID0gdGhpcy5fY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNbY29udGVudElkXTtcbiAgICAgICAgICAgIGF1ZGlvVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0udG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIENvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zRGljdCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgY29udGVudElkIGluIHRoaXMuX2NvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF1ZGlvVGFuc2xhdGlvbnMgPSB0aGlzLl9jb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9uc1tjb250ZW50SWRdO1xuICAgICAgICAgICAgICAgIHZhciBhdWRpb1RyYW5zbGF0aW9uc0RpY3QgPSB7fTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhhdWRpb1RhbnNsYXRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGF1ZGlvVHJhbnNsYXRpb25zRGljdFtsYW5nXSA9IGF1ZGlvVGFuc2xhdGlvbnNbbGFuZ10udG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zRGljdFtjb250ZW50SWRdID0gYXVkaW9UcmFuc2xhdGlvbnNEaWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zRGljdDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBjb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9uc0RpY3QpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucyA9IHt9O1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNEaWN0KS5mb3JFYWNoKGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXVkaW9UYW5zbGF0aW9uc0RpY3QgPSAoY29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNEaWN0W2NvbnRlbnRJZF0pO1xuICAgICAgICAgICAgICAgIHZhciBhdWRpb1RyYW5zbGF0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGF1ZGlvVGFuc2xhdGlvbnNEaWN0KS5mb3JFYWNoKGZ1bmN0aW9uIChsYW5nQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICBhdWRpb1RyYW5zbGF0aW9uc1tsYW5nQ29kZV0gPSAoQXVkaW9UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KGF1ZGlvVGFuc2xhdGlvbnNEaWN0W2xhbmdDb2RlXSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zW2NvbnRlbnRJZF0gPSBhdWRpb1RyYW5zbGF0aW9ucztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucyhjb250ZW50SWRzVG9BdWRpb1RyYW5zbGF0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIENvbnRlbnRJZHNUb0F1ZGlvVHJhbnNsYXRpb25zWydjcmVhdGVFbXB0eSddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnMoe30pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gc2VuZCBjaGFuZ2VzIHRvIGEgZXhwbG9yYXRpb24gdG8gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9SZWFkT25seUV4cGxvcmF0aW9uQmFja2VuZEFwaVNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uX3BsYXllci9QbGF5ZXJDb25zdGFudHMudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ0VkaXRhYmxlRXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlJyxcbiAgICAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdFRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX0RSQUZUX1VSTF9URU1QTEFURScsXG4gICAgJ0VESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICAnRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUnLFxuICAgICdUUkFOU0xBVEVfRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHEsIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIEVESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfRFJBRlRfVVJMX1RFTVBMQVRFLCBFRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURSwgRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUsIFRSQU5TTEFURV9FWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURSkge1xuICAgICAgICB2YXIgX2ZldGNoRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgYXBwbHlEcmFmdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwgPSBfZ2V0RXhwbG9yYXRpb25VcmwoZXhwbG9yYXRpb25JZCwgYXBwbHlEcmFmdCk7XG4gICAgICAgICAgICAkaHR0cC5nZXQoZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGV4cGxvcmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF91cGRhdGVFeHBsb3JhdGlvbiA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBleHBsb3JhdGlvblZlcnNpb24sIGNvbW1pdE1lc3NhZ2UsIGNoYW5nZUxpc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGVkaXRhYmxlRXhwbG9yYXRpb25EYXRhVXJsID0gX2dldEV4cGxvcmF0aW9uVXJsKGV4cGxvcmF0aW9uSWQsIG51bGwpO1xuICAgICAgICAgICAgdmFyIHB1dERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdmVyc2lvbjogZXhwbG9yYXRpb25WZXJzaW9uLFxuICAgICAgICAgICAgICAgIGNvbW1pdF9tZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNoYW5nZV9saXN0OiBjaGFuZ2VMaXN0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgJGh0dHAucHV0KGVkaXRhYmxlRXhwbG9yYXRpb25EYXRhVXJsLCBwdXREYXRhKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSByZXR1cm5lZCBkYXRhIGlzIGFuIHVwZGF0ZWQgZXhwbG9yYXRpb24gZGljdC5cbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb24gPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgLy8gRGVsZXRlIGZyb20gdGhlIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSdzIGNhY2hlXG4gICAgICAgICAgICAgICAgLy8gQXMgdGhlIHR3byB2ZXJzaW9ucyBvZiB0aGUgZGF0YSAobGVhcm5lciBhbmQgZWRpdG9yKSBub3cgZGlmZmVyXG4gICAgICAgICAgICAgICAgUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmRlbGV0ZUV4cGxvcmF0aW9uRnJvbUNhY2hlKGV4cGxvcmF0aW9uSWQsIGV4cGxvcmF0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhleHBsb3JhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvckNhbGxiYWNrKGVycm9yUmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZGVsZXRlRXhwbG9yYXRpb24gPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwgPSBfZ2V0RXhwbG9yYXRpb25VcmwoZXhwbG9yYXRpb25JZCwgbnVsbCk7XG4gICAgICAgICAgICAkaHR0cFsnZGVsZXRlJ10oZWRpdGFibGVFeHBsb3JhdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIERlbGV0ZSBpdGVtIGZyb20gdGhlIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSdzIGNhY2hlXG4gICAgICAgICAgICAgICAgUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlLmRlbGV0ZUV4cGxvcmF0aW9uRnJvbUNhY2hlKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHt9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9nZXRFeHBsb3JhdGlvblVybCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCBhcHBseURyYWZ0KSB7XG4gICAgICAgICAgICBpZiAoYXBwbHlEcmFmdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5pbnRlcnBvbGF0ZVVybChFRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX0RSQUZUX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgYXBwbHlfZHJhZnQ6IEpTT04uc3RyaW5naWZ5KGFwcGx5RHJhZnQpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIUdMT0JBTFMuY2FuX2VkaXQgJiYgR0xPQkFMUy5jYW5fdHJhbnNsYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKFRSQU5TTEFURV9FWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKEVESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGV4cGxvcmF0aW9uSWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmV0Y2hFeHBsb3JhdGlvbjogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkLCBudWxsLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZldGNoQXBwbHlEcmFmdEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9mZXRjaEV4cGxvcmF0aW9uKGV4cGxvcmF0aW9uSWQsIHRydWUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBVcGRhdGVzIGFuIGV4cGxvcmF0aW9uIGluIHRoZSBiYWNrZW5kIHdpdGggdGhlIHByb3ZpZGVkIGV4cGxvcmF0aW9uXG4gICAgICAgICAgICAgKiBJRC4gVGhlIGNoYW5nZXMgb25seSBhcHBseSB0byB0aGUgZXhwbG9yYXRpb24gb2YgdGhlIGdpdmVuIHZlcnNpb25cbiAgICAgICAgICAgICAqIGFuZCB0aGUgcmVxdWVzdCB0byB1cGRhdGUgdGhlIGV4cGxvcmF0aW9uIHdpbGwgZmFpbCBpZiB0aGUgcHJvdmlkZWRcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIHZlcnNpb24gaXMgb2xkZXIgdGhhbiB0aGUgY3VycmVudCB2ZXJzaW9uIHN0b3JlZCBpbiB0aGVcbiAgICAgICAgICAgICAqIGJhY2tlbmQuIEJvdGggdGhlIGNoYW5nZXMgYW5kIHRoZSBtZXNzYWdlIHRvIGFzc29jaWF0ZSB3aXRoIHRob3NlXG4gICAgICAgICAgICAgKiBjaGFuZ2VzIGFyZSB1c2VkIHRvIGNvbW1pdCBhIGNoYW5nZSB0byB0aGUgZXhwbG9yYXRpb24uXG4gICAgICAgICAgICAgKiBUaGUgbmV3IGV4cGxvcmF0aW9uIGlzIHBhc3NlZCB0byB0aGUgc3VjY2VzcyBjYWxsYmFjayxcbiAgICAgICAgICAgICAqIGlmIG9uZSBpcyBwcm92aWRlZCB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZSBvYmplY3QuIEVycm9ycyBhcmUgcGFzc2VkXG4gICAgICAgICAgICAgKiB0byB0aGUgZXJyb3IgY2FsbGJhY2ssIGlmIG9uZSBpcyBwcm92aWRlZC4gUGxlYXNlIG5vdGUsIG9uY2UgdGhpcyBpc1xuICAgICAgICAgICAgICogY2FsbGVkIHRoZSBjYWNoZWQgZXhwbG9yYXRpb24gaW4gUmVhZE9ubHlFeHBsb3JhdGlvbkJhY2tlbmRBcGlTZXJ2aWNlXG4gICAgICAgICAgICAgKiB3aWxsIGJlIGRlbGV0ZWQuIFRoaXMgaXMgZHVlIHRvIHRoZSBkaWZmZXJlbmNlcyBpbiB0aGUgYmFjay1lbmRcbiAgICAgICAgICAgICAqIGVkaXRvciBvYmplY3QgYW5kIHRoZSBiYWNrLWVuZCBwbGF5ZXIgb2JqZWN0LiBBcyBpdCBzdGFuZHMgbm93LFxuICAgICAgICAgICAgICogd2UgYXJlIHVuYWJsZSB0byBjYWNoZSBhbnkgRXhwbG9yYXRpb24gb2JqZWN0IG9idGFpbmVkIGZyb20gdGhlXG4gICAgICAgICAgICAgKiBlZGl0b3IgYmVhY2tlbmQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHVwZGF0ZUV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgZXhwbG9yYXRpb25WZXJzaW9uLCBjb21taXRNZXNzYWdlLCBjaGFuZ2VMaXN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX3VwZGF0ZUV4cGxvcmF0aW9uKGV4cGxvcmF0aW9uSWQsIGV4cGxvcmF0aW9uVmVyc2lvbiwgY29tbWl0TWVzc2FnZSwgY2hhbmdlTGlzdCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIERlbGV0ZXMgYW4gZXhwbG9yYXRpb24gaW4gdGhlIGJhY2tlbmQgd2l0aCB0aGUgcHJvdmlkZWQgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAqIElELiBJZiBzdWNjZXNzZnVsLCB0aGUgZXhwbG9yYXRpb24gd2lsbCBhbHNvIGJlIGRlbGV0ZWQgZnJvbSB0aGVcbiAgICAgICAgICAgICAqIFJlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZSBjYWNoZSBhcyB3ZWxsLlxuICAgICAgICAgICAgICogRXJyb3JzIGFyZSBwYXNzZWQgdG8gdGhlIGVycm9yIGNhbGxiYWNrLCBpZiBvbmUgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGRlbGV0ZUV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIF9kZWxldGVFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIEhpbnRcbiAqIGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ0hpbnRPYmplY3RGYWN0b3J5JywgW1xuICAgICdTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHZhciBIaW50ID0gZnVuY3Rpb24gKGhpbnRDb250ZW50KSB7XG4gICAgICAgICAgICB0aGlzLmhpbnRDb250ZW50ID0gaGludENvbnRlbnQ7XG4gICAgICAgIH07XG4gICAgICAgIEhpbnQucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGhpbnRfY29udGVudDogdGhpcy5oaW50Q29udGVudC50b0JhY2tlbmREaWN0KClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEhpbnRbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKGhpbnRCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgSGludChTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoaGludEJhY2tlbmREaWN0LmhpbnRfY29udGVudCkpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBIaW50WydjcmVhdGVOZXcnXSA9IGZ1bmN0aW9uIChoaW50Q29udGVudElkLCBoaW50Q29udGVudCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgSGludChTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVEZWZhdWx0KGhpbnRDb250ZW50LCBoaW50Q29udGVudElkKSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBIaW50O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIEludGVyYWN0aW9uXG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL0Fuc3dlckdyb3VwT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL0hpbnRPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vT3V0Y29tZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9Tb2x1dGlvbk9iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ0ludGVyYWN0aW9uT2JqZWN0RmFjdG9yeScsIFtcbiAgICAnQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5JywgJ0hpbnRPYmplY3RGYWN0b3J5JywgJ091dGNvbWVPYmplY3RGYWN0b3J5JyxcbiAgICAnU29sdXRpb25PYmplY3RGYWN0b3J5JyxcbiAgICBmdW5jdGlvbiAoQW5zd2VyR3JvdXBPYmplY3RGYWN0b3J5LCBIaW50T2JqZWN0RmFjdG9yeSwgT3V0Y29tZU9iamVjdEZhY3RvcnksIFNvbHV0aW9uT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB2YXIgSW50ZXJhY3Rpb24gPSBmdW5jdGlvbiAoYW5zd2VyR3JvdXBzLCBjb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzLCBjdXN0b21pemF0aW9uQXJncywgZGVmYXVsdE91dGNvbWUsIGhpbnRzLCBpZCwgc29sdXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuYW5zd2VyR3JvdXBzID0gYW5zd2VyR3JvdXBzO1xuICAgICAgICAgICAgdGhpcy5jb25maXJtZWRVbmNsYXNzaWZpZWRBbnN3ZXJzID0gY29uZmlybWVkVW5jbGFzc2lmaWVkQW5zd2VycztcbiAgICAgICAgICAgIHRoaXMuY3VzdG9taXphdGlvbkFyZ3MgPSBjdXN0b21pemF0aW9uQXJncztcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdE91dGNvbWUgPSBkZWZhdWx0T3V0Y29tZTtcbiAgICAgICAgICAgIHRoaXMuaGludHMgPSBoaW50cztcbiAgICAgICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgICAgIHRoaXMuc29sdXRpb24gPSBzb2x1dGlvbjtcbiAgICAgICAgfTtcbiAgICAgICAgSW50ZXJhY3Rpb24ucHJvdG90eXBlLnNldElkID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbmV3VmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIEludGVyYWN0aW9uLnByb3RvdHlwZS5zZXRBbnN3ZXJHcm91cHMgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuYW5zd2VyR3JvdXBzID0gbmV3VmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIEludGVyYWN0aW9uLnByb3RvdHlwZS5zZXREZWZhdWx0T3V0Y29tZSA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0T3V0Y29tZSA9IG5ld1ZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICBJbnRlcmFjdGlvbi5wcm90b3R5cGUuc2V0Q3VzdG9taXphdGlvbkFyZ3MgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuY3VzdG9taXphdGlvbkFyZ3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgSW50ZXJhY3Rpb24ucHJvdG90eXBlLnNldFNvbHV0aW9uID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnNvbHV0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIEludGVyYWN0aW9uLnByb3RvdHlwZS5zZXRIaW50cyA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5oaW50cyA9IG5ld1ZhbHVlO1xuICAgICAgICB9O1xuICAgICAgICBJbnRlcmFjdGlvbi5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChvdGhlckludGVyYWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmFuc3dlckdyb3VwcyA9IGFuZ3VsYXIuY29weShvdGhlckludGVyYWN0aW9uLmFuc3dlckdyb3Vwcyk7XG4gICAgICAgICAgICB0aGlzLmNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMgPVxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShvdGhlckludGVyYWN0aW9uLmNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMpO1xuICAgICAgICAgICAgdGhpcy5jdXN0b21pemF0aW9uQXJncyA9IGFuZ3VsYXIuY29weShvdGhlckludGVyYWN0aW9uLmN1c3RvbWl6YXRpb25BcmdzKTtcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdE91dGNvbWUgPSBhbmd1bGFyLmNvcHkob3RoZXJJbnRlcmFjdGlvbi5kZWZhdWx0T3V0Y29tZSk7XG4gICAgICAgICAgICB0aGlzLmhpbnRzID0gYW5ndWxhci5jb3B5KG90aGVySW50ZXJhY3Rpb24uaGludHMpO1xuICAgICAgICAgICAgdGhpcy5pZCA9IGFuZ3VsYXIuY29weShvdGhlckludGVyYWN0aW9uLmlkKTtcbiAgICAgICAgICAgIHRoaXMuc29sdXRpb24gPSBhbmd1bGFyLmNvcHkob3RoZXJJbnRlcmFjdGlvbi5zb2x1dGlvbik7XG4gICAgICAgIH07XG4gICAgICAgIEludGVyYWN0aW9uLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJfZ3JvdXBzOiB0aGlzLmFuc3dlckdyb3Vwcy5tYXAoZnVuY3Rpb24gKGFuc3dlckdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbnN3ZXJHcm91cC50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgY29uZmlybWVkX3VuY2xhc3NpZmllZF9hbnN3ZXJzOiB0aGlzLmNvbmZpcm1lZFVuY2xhc3NpZmllZEFuc3dlcnMsXG4gICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbl9hcmdzOiB0aGlzLmN1c3RvbWl6YXRpb25BcmdzLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRfb3V0Y29tZTogdGhpcy5kZWZhdWx0T3V0Y29tZSA/IHRoaXMuZGVmYXVsdE91dGNvbWUudG9CYWNrZW5kRGljdCgpIDogbnVsbCxcbiAgICAgICAgICAgICAgICBoaW50czogdGhpcy5oaW50cy5tYXAoZnVuY3Rpb24gKGhpbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhpbnQudG9CYWNrZW5kRGljdCgpO1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgICAgIHNvbHV0aW9uOiB0aGlzLnNvbHV0aW9uID8gdGhpcy5zb2x1dGlvbi50b0JhY2tlbmREaWN0KCkgOiBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBJbnRlcmFjdGlvblsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoaW50ZXJhY3Rpb25EaWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRPdXRjb21lO1xuICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uRGljdC5kZWZhdWx0X291dGNvbWUpIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0T3V0Y29tZSA9IE91dGNvbWVPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChpbnRlcmFjdGlvbkRpY3QuZGVmYXVsdF9vdXRjb21lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlZmF1bHRPdXRjb21lID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgSW50ZXJhY3Rpb24oZ2VuZXJhdGVBbnN3ZXJHcm91cHNGcm9tQmFja2VuZChpbnRlcmFjdGlvbkRpY3QuYW5zd2VyX2dyb3VwcyksIGludGVyYWN0aW9uRGljdC5jb25maXJtZWRfdW5jbGFzc2lmaWVkX2Fuc3dlcnMsIGludGVyYWN0aW9uRGljdC5jdXN0b21pemF0aW9uX2FyZ3MsIGRlZmF1bHRPdXRjb21lLCBnZW5lcmF0ZUhpbnRzRnJvbUJhY2tlbmQoaW50ZXJhY3Rpb25EaWN0LmhpbnRzKSwgaW50ZXJhY3Rpb25EaWN0LmlkLCBpbnRlcmFjdGlvbkRpY3Quc29sdXRpb24gPyAoZ2VuZXJhdGVTb2x1dGlvbkZyb21CYWNrZW5kKGludGVyYWN0aW9uRGljdC5zb2x1dGlvbikpIDogbnVsbCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBnZW5lcmF0ZUFuc3dlckdyb3Vwc0Zyb21CYWNrZW5kID0gZnVuY3Rpb24gKGFuc3dlckdyb3VwQmFja2VuZERpY3RzKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5zd2VyR3JvdXBCYWNrZW5kRGljdHMubWFwKGZ1bmN0aW9uIChhbnN3ZXJHcm91cEJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFuc3dlckdyb3VwT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoYW5zd2VyR3JvdXBCYWNrZW5kRGljdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGdlbmVyYXRlSGludHNGcm9tQmFja2VuZCA9IGZ1bmN0aW9uIChoaW50QmFja2VuZERpY3RzKSB7XG4gICAgICAgICAgICByZXR1cm4gaGludEJhY2tlbmREaWN0cy5tYXAoZnVuY3Rpb24gKGhpbnRCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBIaW50T2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QoaGludEJhY2tlbmREaWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZ2VuZXJhdGVTb2x1dGlvbkZyb21CYWNrZW5kID0gZnVuY3Rpb24gKHNvbHV0aW9uQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBTb2x1dGlvbk9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHNvbHV0aW9uQmFja2VuZERpY3QpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gSW50ZXJhY3Rpb247XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgT3V0Y29tZVxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9TdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS50cycpO1xub3BwaWEuZmFjdG9yeSgnT3V0Y29tZU9iamVjdEZhY3RvcnknLCBbXG4gICAgJ1N1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5JyxcbiAgICBmdW5jdGlvbiAoU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdmFyIE91dGNvbWUgPSBmdW5jdGlvbiAoZGVzdCwgZmVlZGJhY2ssIGxhYmVsbGVkQXNDb3JyZWN0LCBwYXJhbUNoYW5nZXMsIHJlZnJlc2hlckV4cGxvcmF0aW9uSWQsIG1pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkKSB7XG4gICAgICAgICAgICB0aGlzLmRlc3QgPSBkZXN0O1xuICAgICAgICAgICAgdGhpcy5mZWVkYmFjayA9IGZlZWRiYWNrO1xuICAgICAgICAgICAgdGhpcy5sYWJlbGxlZEFzQ29ycmVjdCA9IGxhYmVsbGVkQXNDb3JyZWN0O1xuICAgICAgICAgICAgdGhpcy5wYXJhbUNoYW5nZXMgPSBwYXJhbUNoYW5nZXM7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQgPSByZWZyZXNoZXJFeHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgdGhpcy5taXNzaW5nUHJlcmVxdWlzaXRlU2tpbGxJZCA9IG1pc3NpbmdQcmVyZXF1aXNpdGVTa2lsbElkO1xuICAgICAgICB9O1xuICAgICAgICBPdXRjb21lLnByb3RvdHlwZS5zZXREZXN0aW5hdGlvbiA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5kZXN0ID0gbmV3VmFsdWU7XG4gICAgICAgIH07XG4gICAgICAgIE91dGNvbWUucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGRlc3Q6IHRoaXMuZGVzdCxcbiAgICAgICAgICAgICAgICBmZWVkYmFjazogdGhpcy5mZWVkYmFjay50b0JhY2tlbmREaWN0KCksXG4gICAgICAgICAgICAgICAgbGFiZWxsZWRfYXNfY29ycmVjdDogdGhpcy5sYWJlbGxlZEFzQ29ycmVjdCxcbiAgICAgICAgICAgICAgICBwYXJhbV9jaGFuZ2VzOiB0aGlzLnBhcmFtQ2hhbmdlcyxcbiAgICAgICAgICAgICAgICByZWZyZXNoZXJfZXhwbG9yYXRpb25faWQ6IHRoaXMucmVmcmVzaGVyRXhwbG9yYXRpb25JZCxcbiAgICAgICAgICAgICAgICBtaXNzaW5nX3ByZXJlcXVpc2l0ZV9za2lsbF9pZDogdGhpcy5taXNzaW5nUHJlcmVxdWlzaXRlU2tpbGxJZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdHJ1ZSBpZmYgYW4gb3V0Y29tZSBoYXMgYSBzZWxmLWxvb3AsIG5vIGZlZWRiYWNrLCBhbmQgbm9cbiAgICAgICAgICogcmVmcmVzaGVyIGV4cGxvcmF0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgT3V0Y29tZS5wcm90b3R5cGUuaXNDb25mdXNpbmcgPSBmdW5jdGlvbiAoY3VycmVudFN0YXRlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLmRlc3QgPT09IGN1cnJlbnRTdGF0ZU5hbWUgJiZcbiAgICAgICAgICAgICAgICAhdGhpcy5oYXNOb25lbXB0eUZlZWRiYWNrKCkgJiZcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hlckV4cGxvcmF0aW9uSWQgPT09IG51bGwpO1xuICAgICAgICB9O1xuICAgICAgICBPdXRjb21lLnByb3RvdHlwZS5oYXNOb25lbXB0eUZlZWRiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmVlZGJhY2suZ2V0SHRtbCgpLnRyaW0oKSAhPT0gJyc7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIE91dGNvbWVbJ2NyZWF0ZU5ldyddID0gZnVuY3Rpb24gKGRlc3QsIGZlZWRiYWNrVGV4dElkLCBmZWVkYmFja1RleHQsIFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBwYXJhbUNoYW5nZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgT3V0Y29tZShkZXN0LCBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVEZWZhdWx0KGZlZWRiYWNrVGV4dCwgZmVlZGJhY2tUZXh0SWQpLCBmYWxzZSwgcGFyYW1DaGFuZ2VzLCBudWxsLCBudWxsKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgT3V0Y29tZVsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAob3V0Y29tZURpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IE91dGNvbWUob3V0Y29tZURpY3QuZGVzdCwgU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KG91dGNvbWVEaWN0LmZlZWRiYWNrKSwgb3V0Y29tZURpY3QubGFiZWxsZWRfYXNfY29ycmVjdCwgb3V0Y29tZURpY3QucGFyYW1fY2hhbmdlcywgb3V0Y29tZURpY3QucmVmcmVzaGVyX2V4cGxvcmF0aW9uX2lkLCBvdXRjb21lRGljdC5taXNzaW5nX3ByZXJlcXVpc2l0ZV9za2lsbF9pZCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBPdXRjb21lO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIFBhcmFtQ2hhbmdlXG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnUGFyYW1DaGFuZ2VPYmplY3RGYWN0b3J5JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFBhcmFtQ2hhbmdlID0gZnVuY3Rpb24gKGN1c3RvbWl6YXRpb25BcmdzLCBnZW5lcmF0b3JJZCwgbmFtZSkge1xuICAgICAgICAgICAgdGhpcy5jdXN0b21pemF0aW9uQXJncyA9IGN1c3RvbWl6YXRpb25BcmdzO1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0b3JJZCA9IGdlbmVyYXRvcklkO1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIERFRkFVTFRfQ1VTVE9NSVpBVElPTl9BUkdTID0ge1xuICAgICAgICAgICAgQ29waWVyOiB7XG4gICAgICAgICAgICAgICAgcGFyc2Vfd2l0aF9qaW5qYTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgUmFuZG9tU2VsZWN0b3I6IHtcbiAgICAgICAgICAgICAgICBsaXN0X29mX3ZhbHVlczogWydzYW1wbGUgdmFsdWUnXVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBQYXJhbUNoYW5nZS5wcm90b3R5cGUudG9CYWNrZW5kRGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbl9hcmdzOiB0aGlzLmN1c3RvbWl6YXRpb25BcmdzLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRvcl9pZDogdGhpcy5nZW5lcmF0b3JJZCxcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIFBhcmFtQ2hhbmdlLnByb3RvdHlwZS5yZXNldEN1c3RvbWl6YXRpb25BcmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jdXN0b21pemF0aW9uQXJncyA9IGFuZ3VsYXIuY29weShERUZBVUxUX0NVU1RPTUlaQVRJT05fQVJHU1t0aGlzLmdlbmVyYXRvcklkXSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFBhcmFtQ2hhbmdlWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChwYXJhbUNoYW5nZUJhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQYXJhbUNoYW5nZShwYXJhbUNoYW5nZUJhY2tlbmREaWN0LmN1c3RvbWl6YXRpb25fYXJncywgcGFyYW1DaGFuZ2VCYWNrZW5kRGljdC5nZW5lcmF0b3JfaWQsIHBhcmFtQ2hhbmdlQmFja2VuZERpY3QubmFtZSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFBhcmFtQ2hhbmdlWydjcmVhdGVFbXB0eSddID0gZnVuY3Rpb24gKHBhcmFtTmFtZSkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgUGFyYW1DaGFuZ2Uoe1xuICAgICAgICAgICAgICAgIHBhcnNlX3dpdGhfamluamE6IHRydWUsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICcnXG4gICAgICAgICAgICB9LCAnQ29waWVyJywgcGFyYW1OYW1lKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgUGFyYW1DaGFuZ2VbJ2NyZWF0ZURlZmF1bHQnXSA9IGZ1bmN0aW9uIChwYXJhbU5hbWUpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhcmFtQ2hhbmdlKGFuZ3VsYXIuY29weShERUZBVUxUX0NVU1RPTUlaQVRJT05fQVJHUy5Db3BpZXIpLCAnQ29waWVyJywgcGFyYW1OYW1lKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFBhcmFtQ2hhbmdlO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGFycmF5cyBvZiBQYXJhbUNoYW5nZVxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9QYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1BhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnknLCBbXG4gICAgJ1BhcmFtQ2hhbmdlT2JqZWN0RmFjdG9yeScsXG4gICAgZnVuY3Rpb24gKFBhcmFtQ2hhbmdlT2JqZWN0RmFjdG9yeSkge1xuICAgICAgICB2YXIgY3JlYXRlRnJvbUJhY2tlbmRMaXN0ID0gZnVuY3Rpb24gKHBhcmFtQ2hhbmdlQmFja2VuZExpc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJhbUNoYW5nZUJhY2tlbmRMaXN0Lm1hcChmdW5jdGlvbiAocGFyYW1DaGFuZ2VCYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBQYXJhbUNoYW5nZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHBhcmFtQ2hhbmdlQmFja2VuZERpY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVGcm9tQmFja2VuZExpc3Q6IGNyZWF0ZUZyb21CYWNrZW5kTGlzdFxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIHJldHJpZXZlIHJlYWQgb25seSBpbmZvcm1hdGlvblxuICogYWJvdXQgZXhwbG9yYXRpb25zIGZyb20gdGhlIGJhY2tlbmQuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uX3BsYXllci9QbGF5ZXJDb25zdGFudHMudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1JlYWRPbmx5RXhwbG9yYXRpb25CYWNrZW5kQXBpU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgICdFWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURScsICdFWFBMT1JBVElPTl9WRVJTSU9OX0RBVEFfVVJMX1RFTVBMQVRFJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSwgRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUsIEVYUExPUkFUSU9OX1ZFUlNJT05fREFUQV9VUkxfVEVNUExBVEUpIHtcbiAgICAgICAgLy8gTWFwcyBwcmV2aW91c2x5IGxvYWRlZCBleHBsb3JhdGlvbnMgdG8gdGhlaXIgSURzLlxuICAgICAgICB2YXIgX2V4cGxvcmF0aW9uQ2FjaGUgPSBbXTtcbiAgICAgICAgdmFyIF9mZXRjaEV4cGxvcmF0aW9uID0gZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIHZlcnNpb24sIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uRGF0YVVybCA9IF9nZXRFeHBsb3JhdGlvblVybChleHBsb3JhdGlvbklkLCB2ZXJzaW9uKTtcbiAgICAgICAgICAgICRodHRwLmdldChleHBsb3JhdGlvbkRhdGFVcmwpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGxvcmF0aW9uID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGV4cGxvcmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3JSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soZXJyb3JSZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9pc0NhY2hlZCA9IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICByZXR1cm4gX2V4cGxvcmF0aW9uQ2FjaGUuaGFzT3duUHJvcGVydHkoZXhwbG9yYXRpb25JZCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBfZ2V0RXhwbG9yYXRpb25VcmwgPSBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgdmVyc2lvbikge1xuICAgICAgICAgICAgaWYgKHZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRVhQTE9SQVRJT05fVkVSU0lPTl9EQVRBX1VSTF9URU1QTEFURSwge1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogU3RyaW5nKHZlcnNpb24pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHJpZXZlcyBhbiBleHBsb3JhdGlvbiBmcm9tIHRoZSBiYWNrZW5kIGdpdmVuIGFuIGV4cGxvcmF0aW9uIElEXG4gICAgICAgICAgICAgKiBhbmQgdmVyc2lvbiBudW1iZXIgKG9yIG5vbmUpLiBUaGlzIHJldHVybnMgYSBwcm9taXNlIG9iamVjdCB0aGF0XG4gICAgICAgICAgICAgKiBhbGxvd3Mgc3VjY2VzcyBhbmQgcmVqZWN0aW9uIGNhbGxiYWNrcyB0byBiZSByZWdpc3RlcmVkLiBJZiB0aGVcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIGlzIHN1Y2Nlc3NmdWxseSBsb2FkZWQgYW5kIGEgc3VjY2VzcyBjYWxsYmFjayBmdW5jdGlvblxuICAgICAgICAgICAgICogaXMgcHJvdmlkZWQgdG8gdGhlIHByb21pc2Ugb2JqZWN0LCB0aGUgc3VjY2VzcyBjYWxsYmFjayBpcyBjYWxsZWRcbiAgICAgICAgICAgICAqIHdpdGggdGhlIGV4cGxvcmF0aW9uIHBhc3NlZCBpbiBhcyBhIHBhcmFtZXRlci4gSWYgc29tZXRoaW5nIGdvZXNcbiAgICAgICAgICAgICAqIHdyb25nIHdoaWxlIHRyeWluZyB0byBmZXRjaCB0aGUgZXhwbG9yYXRpb24sIHRoZSByZWplY3Rpb24gY2FsbGJhY2tcbiAgICAgICAgICAgICAqIGlzIGNhbGxlZCBpbnN0ZWFkLCBpZiBwcmVzZW50LiBUaGUgcmVqZWN0aW9uIGNhbGxiYWNrIGZ1bmN0aW9uIGlzXG4gICAgICAgICAgICAgKiBwYXNzZWQgYW55IGRhdGEgcmV0dXJuZWQgYnkgdGhlIGJhY2tlbmQgaW4gdGhlIGNhc2Ugb2YgYW4gZXJyb3IuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZldGNoRXhwbG9yYXRpb246IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkLCB2ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZldGNoRXhwbG9yYXRpb24oZXhwbG9yYXRpb25JZCwgdmVyc2lvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEJlaGF2ZXMgaW4gdGhlIGV4YWN0IHNhbWUgd2F5IGFzIGZldGNoRXhwbG9yYXRpb24gKGluY2x1ZGluZ1xuICAgICAgICAgICAgICogY2FsbGJhY2sgYmVoYXZpb3IgYW5kIHJldHVybmluZyBhIHByb21pc2Ugb2JqZWN0KSxcbiAgICAgICAgICAgICAqIGV4Y2VwdCB0aGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byBzZWUgd2hldGhlciB0aGUgbGF0ZXN0IHZlcnNpb25cbiAgICAgICAgICAgICAqIG9mIHRoZSBnaXZlbiBleHBsb3JhdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGxvYWRlZC4gSWYgaXQgaGFzIG5vdCB5ZXRcbiAgICAgICAgICAgICAqIGJlZW4gbG9hZGVkLCBpdCB3aWxsIGZldGNoIHRoZSBleHBsb3JhdGlvbiBmcm9tIHRoZSBiYWNrZW5kLiBJZiBpdFxuICAgICAgICAgICAgICogc3VjY2Vzc2Z1bGx5IHJldHJpZXZlcyB0aGUgZXhwbG9yYXRpb24gZnJvbSB0aGUgYmFja2VuZCwgdGhpcyBtZXRob2RcbiAgICAgICAgICAgICAqIHdpbGwgc3RvcmUgdGhlIGV4cGxvcmF0aW9uIGluIHRoZSBjYWNoZSB0byBhdm9pZCByZXF1ZXN0cyBmcm9tIHRoZVxuICAgICAgICAgICAgICogYmFja2VuZCBpbiBmdXJ0aGVyIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBsb2FkTGF0ZXN0RXhwbG9yYXRpb246IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pc0NhY2hlZChleHBsb3JhdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGFuZ3VsYXIuY29weShfZXhwbG9yYXRpb25DYWNoZVtleHBsb3JhdGlvbklkXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2ZldGNoRXhwbG9yYXRpb24oZXhwbG9yYXRpb25JZCwgbnVsbCwgZnVuY3Rpb24gKGV4cGxvcmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgZmV0Y2hlZCBleHBsb3JhdGlvbiB0byBhdm9pZCBmdXR1cmUgZmV0Y2hlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZXhwbG9yYXRpb25DYWNoZVtleHBsb3JhdGlvbklkXSA9IGV4cGxvcmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYW5ndWxhci5jb3B5KGV4cGxvcmF0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0cmlldmVzIGFuIGV4cGxvcmF0aW9uIGZyb20gdGhlIGJhY2tlbmQgZ2l2ZW4gYW4gZXhwbG9yYXRpb24gSURcbiAgICAgICAgICAgICAqIGFuZCB2ZXJzaW9uIG51bWJlci4gVGhpcyBtZXRob2QgZG9lcyBub3QgaW50ZXJhY3Qgd2l0aCBhbnkgY2FjaGVcbiAgICAgICAgICAgICAqIGFuZCB1c2luZyB0aGlzIG1ldGhvZCB3aWxsIG5vdCBvdmVyd3JpdGUgb3IgdG91Y2ggdGhlIHN0YXRlIG9mIHRoZVxuICAgICAgICAgICAgICogY2FjaGUuIEFsbCBwcmV2aW91cyBkYXRhIGluIHRoZSBjYWNoZSB3aWxsIHN0aWxsIGJlIHJldGFpbmVkIGFmdGVyXG4gICAgICAgICAgICAgKiB0aGlzIGNhbGwuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvYWRFeHBsb3JhdGlvbjogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQsIHZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICBfZmV0Y2hFeHBsb3JhdGlvbihleHBsb3JhdGlvbklkLCB2ZXJzaW9uLCBmdW5jdGlvbiAoZXhwbG9yYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhbmd1bGFyLmNvcHkoZXhwbG9yYXRpb24pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gZXhwbG9yYXRpb24gaXMgc3RvcmVkIHdpdGhpbiB0aGUgbG9jYWxcbiAgICAgICAgICAgICAqIGRhdGEgY2FjaGUgb3IgaWYgaXQgbmVlZHMgdG8gYmUgcmV0cmlldmVkIGZyb20gdGhlIGJhY2tlbmQgdXBvbiBhXG4gICAgICAgICAgICAgKiBsb2FkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpc0NhY2hlZDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2lzQ2FjaGVkKGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVwbGFjZXMgdGhlIGN1cnJlbnQgZXhwbG9yYXRpb24gaW4gdGhlIGNhY2hlIGdpdmVuIGJ5IHRoZSBzcGVjaWZpZWRcbiAgICAgICAgICAgICAqIGV4cGxvcmF0aW9uIElEIHdpdGggYSBuZXcgZXhwbG9yYXRpb24gb2JqZWN0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjYWNoZUV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCwgZXhwbG9yYXRpb24pIHtcbiAgICAgICAgICAgICAgICBfZXhwbG9yYXRpb25DYWNoZVtleHBsb3JhdGlvbklkXSA9IGFuZ3VsYXIuY29weShleHBsb3JhdGlvbik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBDbGVhcnMgdGhlIGxvY2FsIGV4cGxvcmF0aW9uIGRhdGEgY2FjaGUsIGZvcmNpbmcgYWxsIGZ1dHVyZSBsb2FkcyB0b1xuICAgICAgICAgICAgICogcmUtcmVxdWVzdCB0aGUgcHJldmlvdXNseSBsb2FkZWQgZXhwbG9yYXRpb25zIGZyb20gdGhlIGJhY2tlbmQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNsZWFyRXhwbG9yYXRpb25DYWNoZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9leHBsb3JhdGlvbkNhY2hlID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBEZWxldGVzIGEgc3BlY2lmaWMgZXhwbG9yYXRpb24gZnJvbSB0aGUgbG9jYWwgY2FjaGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZGVsZXRlRXhwbG9yYXRpb25Gcm9tQ2FjaGU6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9pc0NhY2hlZChleHBsb3JhdGlvbklkKSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgX2V4cGxvcmF0aW9uQ2FjaGVbZXhwbG9yYXRpb25JZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mXG4gKiBSZWNvcmRlZFZvaWNlb3ZlcnMgZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9Wb2ljZW92ZXJPYmplY3RGYWN0b3J5LnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdSZWNvcmRlZFZvaWNlb3ZlcnNPYmplY3RGYWN0b3J5JywgW1xuICAgICdWb2ljZW92ZXJPYmplY3RGYWN0b3J5JywgJ0NPTVBPTkVOVF9OQU1FX0ZFRURCQUNLJyxcbiAgICBmdW5jdGlvbiAoVm9pY2VvdmVyT2JqZWN0RmFjdG9yeSwgQ09NUE9ORU5UX05BTUVfRkVFREJBQ0spIHtcbiAgICAgICAgdmFyIFJlY29yZGVkVm9pY2VvdmVycyA9IGZ1bmN0aW9uICh2b2ljZW92ZXJzTWFwcGluZykge1xuICAgICAgICAgICAgdGhpcy52b2ljZW92ZXJzTWFwcGluZyA9IHZvaWNlb3ZlcnNNYXBwaW5nO1xuICAgICAgICB9O1xuICAgICAgICBSZWNvcmRlZFZvaWNlb3ZlcnMucHJvdG90eXBlLmdldEFsbENvbnRlbnRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnZvaWNlb3ZlcnNNYXBwaW5nKTtcbiAgICAgICAgfTtcbiAgICAgICAgUmVjb3JkZWRWb2ljZW92ZXJzLnByb3RvdHlwZS5nZXRCaW5kYWJsZVZvaWNlb3ZlcnMgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52b2ljZW92ZXJzTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICB9O1xuICAgICAgICBSZWNvcmRlZFZvaWNlb3ZlcnMucHJvdG90eXBlLmdldFZvaWNlb3ZlciA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmdDb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52b2ljZW92ZXJzTWFwcGluZ1tjb250ZW50SWRdW2xhbmdDb2RlXTtcbiAgICAgICAgfTtcbiAgICAgICAgUmVjb3JkZWRWb2ljZW92ZXJzLnByb3RvdHlwZS5tYXJrQWxsVm9pY2VvdmVyc0FzTmVlZGluZ1VwZGF0ZSA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlciA9IHRoaXMudm9pY2VvdmVyc01hcHBpbmdbY29udGVudElkXTtcbiAgICAgICAgICAgIGZvciAodmFyIGxhbmd1YWdlQ29kZSBpbiBsYW5ndWFnZUNvZGVUb1ZvaWNlb3Zlcikge1xuICAgICAgICAgICAgICAgIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyW2xhbmd1YWdlQ29kZV0ubWFya0FzTmVlZGluZ1VwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBSZWNvcmRlZFZvaWNlb3ZlcnMucHJvdG90eXBlLmdldFZvaWNlb3Zlckxhbmd1YWdlQ29kZXMgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy52b2ljZW92ZXJzTWFwcGluZ1tjb250ZW50SWRdKTtcbiAgICAgICAgfTtcbiAgICAgICAgUmVjb3JkZWRWb2ljZW92ZXJzLnByb3RvdHlwZS5oYXNWb2ljZW92ZXJzID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Vm9pY2VvdmVyTGFuZ3VhZ2VDb2Rlcyhjb250ZW50SWQpLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG4gICAgICAgIFJlY29yZGVkVm9pY2VvdmVycy5wcm90b3R5cGUuaGFzVW5mbGFnZ2VkVm9pY2VvdmVycyA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlciA9IHRoaXMudm9pY2VvdmVyc01hcHBpbmdbY29udGVudElkXTtcbiAgICAgICAgICAgIGZvciAodmFyIGxhbmd1YWdlQ29kZSBpbiBsYW5ndWFnZUNvZGVUb1ZvaWNlb3Zlcikge1xuICAgICAgICAgICAgICAgIGlmICghbGFuZ3VhZ2VDb2RlVG9Wb2ljZW92ZXJbbGFuZ3VhZ2VDb2RlXS5uZWVkc1VwZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIFJlY29yZGVkVm9pY2VvdmVycy5wcm90b3R5cGUuYWRkQ29udGVudElkID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudm9pY2VvdmVyc01hcHBpbmcuaGFzT3duUHJvcGVydHkoY29udGVudElkKSkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdUcnlpbmcgdG8gYWRkIGR1cGxpY2F0ZSBjb250ZW50IGlkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy52b2ljZW92ZXJzTWFwcGluZ1tjb250ZW50SWRdID0ge307XG4gICAgICAgIH07XG4gICAgICAgIFJlY29yZGVkVm9pY2VvdmVycy5wcm90b3R5cGUuZGVsZXRlQ29udGVudElkID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnZvaWNlb3ZlcnNNYXBwaW5nLmhhc093blByb3BlcnR5KGNvbnRlbnRJZCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVW5hYmxlIHRvIGZpbmQgdGhlIGdpdmVuIGNvbnRlbnQgaWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy52b2ljZW92ZXJzTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICB9O1xuICAgICAgICBSZWNvcmRlZFZvaWNlb3ZlcnMucHJvdG90eXBlLmFkZFZvaWNlb3ZlciA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmd1YWdlQ29kZSwgZmlsZW5hbWUsIGZpbGVTaXplQnl0ZXMpIHtcbiAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlciA9IHRoaXMudm9pY2VvdmVyc01hcHBpbmdbY29udGVudElkXTtcbiAgICAgICAgICAgIGlmIChsYW5ndWFnZUNvZGVUb1ZvaWNlb3Zlci5oYXNPd25Qcm9wZXJ0eShsYW5ndWFnZUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RyeWluZyB0byBhZGQgZHVwbGljYXRlIGxhbmd1YWdlIGNvZGUuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlcltsYW5ndWFnZUNvZGVdID0gVm9pY2VvdmVyT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoZmlsZW5hbWUsIGZpbGVTaXplQnl0ZXMpO1xuICAgICAgICB9O1xuICAgICAgICBSZWNvcmRlZFZvaWNlb3ZlcnMucHJvdG90eXBlLmRlbGV0ZVZvaWNlb3ZlciA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgdmFyIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyID0gdGhpcy52b2ljZW92ZXJzTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICAgICAgaWYgKCFsYW5ndWFnZUNvZGVUb1ZvaWNlb3Zlci5oYXNPd25Qcm9wZXJ0eShsYW5ndWFnZUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RyeWluZyB0byByZW1vdmUgbm9uLWV4aXN0aW5nIHRyYW5zbGF0aW9uIGZvciBsYW5ndWFnZSBjb2RlICcgK1xuICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyW2xhbmd1YWdlQ29kZV07XG4gICAgICAgIH07XG4gICAgICAgIFJlY29yZGVkVm9pY2VvdmVycy5wcm90b3R5cGUudG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoY29udGVudElkLCBsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlciA9IHRoaXMudm9pY2VvdmVyc01hcHBpbmdbY29udGVudElkXTtcbiAgICAgICAgICAgIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyW2xhbmd1YWdlQ29kZV0udG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgUmVjb3JkZWRWb2ljZW92ZXJzLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHZvaWNlb3ZlcnNNYXBwaW5nRGljdCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgY29udGVudElkIGluIHRoaXMudm9pY2VvdmVyc01hcHBpbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFuZ3VhZ2VDb2RlVG9Wb2ljZW92ZXIgPSB0aGlzLnZvaWNlb3ZlcnNNYXBwaW5nW2NvbnRlbnRJZF07XG4gICAgICAgICAgICAgICAgdmFyIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyRGljdCA9IHt9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyKS5mb3JFYWNoKGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyRGljdFtsYW5nXSA9IChsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlcltsYW5nXS50b0JhY2tlbmREaWN0KCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZvaWNlb3ZlcnNNYXBwaW5nRGljdFtjb250ZW50SWRdID0gbGFuZ3VhZ2VDb2RlVG9Wb2ljZW92ZXJEaWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB2b2ljZW92ZXJzX21hcHBpbmc6IHZvaWNlb3ZlcnNNYXBwaW5nRGljdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgUmVjb3JkZWRWb2ljZW92ZXJzWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgcmVjb3JkZWRWb2ljZW92ZXJzRGljdCkge1xuICAgICAgICAgICAgdmFyIHZvaWNlb3ZlcnNNYXBwaW5nID0ge307XG4gICAgICAgICAgICB2YXIgdm9pY2VvdmVyc01hcHBpbmdEaWN0ID0gcmVjb3JkZWRWb2ljZW92ZXJzRGljdC52b2ljZW92ZXJzX21hcHBpbmc7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyh2b2ljZW92ZXJzTWFwcGluZ0RpY3QpLmZvckVhY2goZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlckRpY3QgPSB2b2ljZW92ZXJzTWFwcGluZ0RpY3RbY29udGVudElkXTtcbiAgICAgICAgICAgICAgICB2YXIgbGFuZ3VhZ2VDb2RlVG9Wb2ljZW92ZXIgPSB7fTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlckRpY3QpLmZvckVhY2goZnVuY3Rpb24gKGxhbmdDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyW2xhbmdDb2RlXSA9IChWb2ljZW92ZXJPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChsYW5ndWFnZUNvZGVUb1ZvaWNlb3ZlckRpY3RbbGFuZ0NvZGVdKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdm9pY2VvdmVyc01hcHBpbmdbY29udGVudElkXSA9IGxhbmd1YWdlQ29kZVRvVm9pY2VvdmVyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlY29yZGVkVm9pY2VvdmVycyh2b2ljZW92ZXJzTWFwcGluZyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFJlY29yZGVkVm9pY2VvdmVyc1snY3JlYXRlRW1wdHknXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlY29yZGVkVm9pY2VvdmVycyh7fSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBSZWNvcmRlZFZvaWNlb3ZlcnM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgUnVsZVxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1J1bGVPYmplY3RGYWN0b3J5JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFJ1bGUgPSBmdW5jdGlvbiAodHlwZSwgaW5wdXRzKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICAgICAgdGhpcy5pbnB1dHMgPSBpbnB1dHM7XG4gICAgICAgIH07XG4gICAgICAgIFJ1bGUucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHJ1bGVfdHlwZTogdGhpcy50eXBlLFxuICAgICAgICAgICAgICAgIGlucHV0czogdGhpcy5pbnB1dHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFJ1bGVbJ2NyZWF0ZU5ldyddID0gZnVuY3Rpb24gKHR5cGUsIGlucHV0cykge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgUnVsZSh0eXBlLCBpbnB1dHMpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBSdWxlWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChydWxlRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgUnVsZShydWxlRGljdC5ydWxlX3R5cGUsIHJ1bGVEaWN0LmlucHV0cyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBSdWxlO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZiBTb2x1dGlvblxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9TdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL29iamVjdHMvRnJhY3Rpb25PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vb2JqZWN0cy9OdW1iZXJXaXRoVW5pdHNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdmaWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRXhwbG9yYXRpb25IdG1sRm9ybWF0dGVyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvSHRtbEVzY2FwZXJTZXJ2aWNlLnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdTb2x1dGlvbk9iamVjdEZhY3RvcnknLCBbXG4gICAgJyRmaWx0ZXInLCAnRXhwbG9yYXRpb25IdG1sRm9ybWF0dGVyU2VydmljZScsICdGcmFjdGlvbk9iamVjdEZhY3RvcnknLFxuICAgICdIdG1sRXNjYXBlclNlcnZpY2UnLCAnTnVtYmVyV2l0aFVuaXRzT2JqZWN0RmFjdG9yeScsXG4gICAgJ1N1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5JyxcbiAgICBmdW5jdGlvbiAoJGZpbHRlciwgRXhwbG9yYXRpb25IdG1sRm9ybWF0dGVyU2VydmljZSwgRnJhY3Rpb25PYmplY3RGYWN0b3J5LCBIdG1sRXNjYXBlclNlcnZpY2UsIE51bWJlcldpdGhVbml0c09iamVjdEZhY3RvcnksIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHZhciBTb2x1dGlvbiA9IGZ1bmN0aW9uIChhbnN3ZXJJc0V4Y2x1c2l2ZSwgY29ycmVjdEFuc3dlciwgZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuYW5zd2VySXNFeGNsdXNpdmUgPSBhbnN3ZXJJc0V4Y2x1c2l2ZTtcbiAgICAgICAgICAgIHRoaXMuY29ycmVjdEFuc3dlciA9IGNvcnJlY3RBbnN3ZXI7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gZXhwbGFuYXRpb247XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhbnN3ZXJfaXNfZXhjbHVzaXZlOiB0aGlzLmFuc3dlcklzRXhjbHVzaXZlLFxuICAgICAgICAgICAgICAgIGNvcnJlY3RfYW5zd2VyOiB0aGlzLmNvcnJlY3RBbnN3ZXIsXG4gICAgICAgICAgICAgICAgZXhwbGFuYXRpb246IHRoaXMuZXhwbGFuYXRpb24udG9CYWNrZW5kRGljdCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTb2x1dGlvblsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc29sdXRpb25CYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgU29sdXRpb24oc29sdXRpb25CYWNrZW5kRGljdC5hbnN3ZXJfaXNfZXhjbHVzaXZlLCBzb2x1dGlvbkJhY2tlbmREaWN0LmNvcnJlY3RfYW5zd2VyLCBTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc29sdXRpb25CYWNrZW5kRGljdC5leHBsYW5hdGlvbikpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTb2x1dGlvblsnY3JlYXRlTmV3J10gPSBmdW5jdGlvbiAoXG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIGFuc3dlcklzRXhjbHVzaXZlLCBjb3JyZWN0QW5zd2VyLCBleHBsYW5hdGlvbkh0bWwsIGV4cGxhbmF0aW9uSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU29sdXRpb24oYW5zd2VySXNFeGNsdXNpdmUsIGNvcnJlY3RBbnN3ZXIsIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5LmNyZWF0ZURlZmF1bHQoZXhwbGFuYXRpb25IdG1sLCBleHBsYW5hdGlvbklkKSk7XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS5nZXRTdW1tYXJ5ID0gZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgIHZhciBzb2x1dGlvblR5cGUgPSAodGhpcy5hbnN3ZXJJc0V4Y2x1c2l2ZSA/ICdUaGUgb25seScgOiAnT25lJyk7XG4gICAgICAgICAgICB2YXIgY29ycmVjdEFuc3dlciA9IG51bGw7XG4gICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ0dyYXBoSW5wdXQnKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9ICdbR3JhcGhdJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGludGVyYWN0aW9uSWQgPT09ICdNYXRoRXhwcmVzc2lvbklucHV0Jykge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RBbnN3ZXIgPSB0aGlzLmNvcnJlY3RBbnN3ZXIubGF0ZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbklkID09PSAnQ29kZVJlcGwnIHx8XG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb25JZCA9PT0gJ1BlbmNpbENvZGVFZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9IHRoaXMuY29ycmVjdEFuc3dlci5jb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ011c2ljTm90ZXNJbnB1dCcpIHtcbiAgICAgICAgICAgICAgICBjb3JyZWN0QW5zd2VyID0gJ1tNdXNpYyBOb3Rlc10nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ0xvZ2ljUHJvb2YnKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9IHRoaXMuY29ycmVjdEFuc3dlci5jb3JyZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb25JZCA9PT0gJ0ZyYWN0aW9uSW5wdXQnKSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdEFuc3dlciA9IEZyYWN0aW9uT2JqZWN0RmFjdG9yeS5mcm9tRGljdCh0aGlzLmNvcnJlY3RBbnN3ZXIpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbklkID09PSAnTnVtYmVyV2l0aFVuaXRzJykge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RBbnN3ZXIgPSBOdW1iZXJXaXRoVW5pdHNPYmplY3RGYWN0b3J5LmZyb21EaWN0KHRoaXMuY29ycmVjdEFuc3dlcikudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcnJlY3RBbnN3ZXIgPSAoSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24odGhpcy5jb3JyZWN0QW5zd2VyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZXhwbGFuYXRpb24gPSAoJGZpbHRlcignY29udmVydFRvUGxhaW5UZXh0JykodGhpcy5leHBsYW5hdGlvbi5nZXRIdG1sKCkpKTtcbiAgICAgICAgICAgIHJldHVybiAoc29sdXRpb25UeXBlICsgJyBzb2x1dGlvbiBpcyBcIicgKyBjb3JyZWN0QW5zd2VyICtcbiAgICAgICAgICAgICAgICAnXCIuICcgKyBleHBsYW5hdGlvbiArICcuJyk7XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS5zZXRDb3JyZWN0QW5zd2VyID0gZnVuY3Rpb24gKGNvcnJlY3RBbnN3ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuY29ycmVjdEFuc3dlciA9IGNvcnJlY3RBbnN3ZXI7XG4gICAgICAgIH07XG4gICAgICAgIFNvbHV0aW9uLnByb3RvdHlwZS5zZXRFeHBsYW5hdGlvbiA9IGZ1bmN0aW9uIChleHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IGV4cGxhbmF0aW9uO1xuICAgICAgICB9O1xuICAgICAgICBTb2x1dGlvbi5wcm90b3R5cGUuZ2V0T3BwaWFTaG9ydEFuc3dlclJlc3BvbnNlSHRtbCA9IGZ1bmN0aW9uIChpbnRlcmFjdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwcmVmaXg6ICh0aGlzLmFuc3dlcklzRXhjbHVzaXZlID8gJ1RoZSBvbmx5JyA6ICdPbmUnKSxcbiAgICAgICAgICAgICAgICBhbnN3ZXI6IEV4cGxvcmF0aW9uSHRtbEZvcm1hdHRlclNlcnZpY2UuZ2V0U2hvcnRBbnN3ZXJIdG1sKHRoaXMuY29ycmVjdEFuc3dlciwgaW50ZXJhY3Rpb24uaWQsIGludGVyYWN0aW9uLmN1c3RvbWl6YXRpb25BcmdzKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgU29sdXRpb24ucHJvdG90eXBlLmdldE9wcGlhU29sdXRpb25FeHBsYW5hdGlvblJlc3BvbnNlSHRtbCA9XG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwbGFuYXRpb24uZ2V0SHRtbCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mIFN0YXRlXG4gKiBkb21haW4gb2JqZWN0cyBnaXZlbiBhIGxpc3Qgb2YgYmFja2VuZCBzdGF0ZSBkaWN0aW9uYXJpZXMuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi9zdGF0ZS9TdGF0ZU9iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1N0YXRlc09iamVjdEZhY3RvcnknLCBbXG4gICAgJ1N0YXRlT2JqZWN0RmFjdG9yeScsICdJTlRFUkFDVElPTl9TUEVDUycsXG4gICAgZnVuY3Rpb24gKFN0YXRlT2JqZWN0RmFjdG9yeSwgSU5URVJBQ1RJT05fU1BFQ1MpIHtcbiAgICAgICAgdmFyIFN0YXRlcyA9IGZ1bmN0aW9uIChzdGF0ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlcyA9IHN0YXRlcztcbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGVzLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkodGhpcy5fc3RhdGVzW3N0YXRlTmFtZV0pO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPKHRqaWFuZzExKTogUmVtb3ZlIGdldFN0YXRlT2JqZWN0cygpIGFuZCByZXBsYWNlIGNhbGxzXG4gICAgICAgIC8vIHdpdGggYW4gb2JqZWN0IHRvIHJlcHJlc2VudCBkYXRhIHRvIGJlIG1hbmlwdWxhdGVkIGluc2lkZVxuICAgICAgICAvLyBFeHBsb3JhdGlvbkRpZmZTZXJ2aWNlLlxuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmdldFN0YXRlT2JqZWN0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkodGhpcy5fc3RhdGVzKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGVzLnByb3RvdHlwZS5hZGRTdGF0ZSA9IGZ1bmN0aW9uIChuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlc1tuZXdTdGF0ZU5hbWVdID0gU3RhdGVPYmplY3RGYWN0b3J5LmNyZWF0ZURlZmF1bHRTdGF0ZShuZXdTdGF0ZU5hbWUpO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLnNldFN0YXRlID0gZnVuY3Rpb24gKHN0YXRlTmFtZSwgc3RhdGVEYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZXNbc3RhdGVOYW1lXSA9IGFuZ3VsYXIuY29weShzdGF0ZURhdGEpO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmhhc1N0YXRlID0gZnVuY3Rpb24gKHN0YXRlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlcy5oYXNPd25Qcm9wZXJ0eShzdGF0ZU5hbWUpO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmRlbGV0ZVN0YXRlID0gZnVuY3Rpb24gKGRlbGV0ZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3N0YXRlc1tkZWxldGVTdGF0ZU5hbWVdO1xuICAgICAgICAgICAgZm9yICh2YXIgb3RoZXJTdGF0ZU5hbWUgaW4gdGhpcy5fc3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uID0gdGhpcy5fc3RhdGVzW290aGVyU3RhdGVOYW1lXS5pbnRlcmFjdGlvbjtcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXBzID0gaW50ZXJhY3Rpb24uYW5zd2VyR3JvdXBzO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChncm91cHNbaV0ub3V0Y29tZS5kZXN0ID09PSBkZWxldGVTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1tpXS5vdXRjb21lLmRlc3QgPSBvdGhlclN0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lLmRlc3QgPT09IGRlbGV0ZVN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUuZGVzdCA9IG90aGVyU3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLnJlbmFtZVN0YXRlID0gZnVuY3Rpb24gKG9sZFN0YXRlTmFtZSwgbmV3U3RhdGVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZXNbbmV3U3RhdGVOYW1lXSA9IGFuZ3VsYXIuY29weSh0aGlzLl9zdGF0ZXNbb2xkU3RhdGVOYW1lXSk7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZXNbbmV3U3RhdGVOYW1lXS5zZXROYW1lKG5ld1N0YXRlTmFtZSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc3RhdGVzW29sZFN0YXRlTmFtZV07XG4gICAgICAgICAgICBmb3IgKHZhciBvdGhlclN0YXRlTmFtZSBpbiB0aGlzLl9zdGF0ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb24gPSB0aGlzLl9zdGF0ZXNbb3RoZXJTdGF0ZU5hbWVdLmludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgIHZhciBncm91cHMgPSBpbnRlcmFjdGlvbi5hbnN3ZXJHcm91cHM7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3Vwc1tpXS5vdXRjb21lLmRlc3QgPT09IG9sZFN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzW2ldLm91dGNvbWUuZGVzdCA9IG5ld1N0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uLmRlZmF1bHRPdXRjb21lLmRlc3QgPT09IG9sZFN0YXRlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3Rpb24uZGVmYXVsdE91dGNvbWUuZGVzdCA9IG5ld1N0YXRlTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgU3RhdGVzLnByb3RvdHlwZS5nZXRTdGF0ZU5hbWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3N0YXRlcyk7XG4gICAgICAgIH07XG4gICAgICAgIFN0YXRlcy5wcm90b3R5cGUuZ2V0RmluYWxTdGF0ZU5hbWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpbmFsU3RhdGVOYW1lcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHRoaXMuX3N0YXRlcykge1xuICAgICAgICAgICAgICAgIHZhciBpbnRlcmFjdGlvbiA9IHRoaXMuX3N0YXRlc1tzdGF0ZU5hbWVdLmludGVyYWN0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbi5pZCAmJiBJTlRFUkFDVElPTl9TUEVDU1tpbnRlcmFjdGlvbi5pZF0uaXNfdGVybWluYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgZmluYWxTdGF0ZU5hbWVzLnB1c2goc3RhdGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmluYWxTdGF0ZU5hbWVzO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZXMucHJvdG90eXBlLmdldEFsbFZvaWNlb3Zlckxhbmd1YWdlQ29kZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYWxsQXVkaW9MYW5ndWFnZUNvZGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBzdGF0ZU5hbWUgaW4gdGhpcy5fc3RhdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5fc3RhdGVzW3N0YXRlTmFtZV07XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZHNMaXN0ID0gc3RhdGUucmVjb3JkZWRWb2ljZW92ZXJzLmdldEFsbENvbnRlbnRJZCgpO1xuICAgICAgICAgICAgICAgIGNvbnRlbnRJZHNMaXN0LmZvckVhY2goZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXVkaW9MYW5ndWFnZUNvZGVzID0gKHN0YXRlLnJlY29yZGVkVm9pY2VvdmVycy5nZXRWb2ljZW92ZXJMYW5ndWFnZUNvZGVzKGNvbnRlbnRJZCkpO1xuICAgICAgICAgICAgICAgICAgICBhdWRpb0xhbmd1YWdlQ29kZXMuZm9yRWFjaChmdW5jdGlvbiAobGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQXVkaW9MYW5ndWFnZUNvZGVzLmluZGV4T2YobGFuZ3VhZ2VDb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxBdWRpb0xhbmd1YWdlQ29kZXMucHVzaChsYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhbGxBdWRpb0xhbmd1YWdlQ29kZXM7XG4gICAgICAgIH07XG4gICAgICAgIFN0YXRlcy5wcm90b3R5cGUuZ2V0QWxsVm9pY2VvdmVycyA9IGZ1bmN0aW9uIChsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBhbGxBdWRpb1RyYW5zbGF0aW9ucyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHRoaXMuX3N0YXRlcykge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuX3N0YXRlc1tzdGF0ZU5hbWVdO1xuICAgICAgICAgICAgICAgIGFsbEF1ZGlvVHJhbnNsYXRpb25zW3N0YXRlTmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudElkc0xpc3QgPSBzdGF0ZS5yZWNvcmRlZFZvaWNlb3ZlcnMuZ2V0QWxsQ29udGVudElkKCk7XG4gICAgICAgICAgICAgICAgY29udGVudElkc0xpc3QuZm9yRWFjaChmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdWRpb1RyYW5zbGF0aW9ucyA9IChzdGF0ZS5yZWNvcmRlZFZvaWNlb3ZlcnMuZ2V0QmluZGFibGVWb2ljZW92ZXJzKGNvbnRlbnRJZCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXVkaW9UcmFuc2xhdGlvbnMuaGFzT3duUHJvcGVydHkobGFuZ3VhZ2VDb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxsQXVkaW9UcmFuc2xhdGlvbnNbc3RhdGVOYW1lXS5wdXNoKGF1ZGlvVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWxsQXVkaW9UcmFuc2xhdGlvbnM7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFN0YXRlc1snY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc3RhdGVzQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgc3RhdGVPYmplY3RzRGljdCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgc3RhdGVOYW1lIGluIHN0YXRlc0JhY2tlbmREaWN0KSB7XG4gICAgICAgICAgICAgICAgc3RhdGVPYmplY3RzRGljdFtzdGF0ZU5hbWVdID0gU3RhdGVPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzdGF0ZU5hbWUsIHN0YXRlc0JhY2tlbmREaWN0W3N0YXRlTmFtZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZXMoc3RhdGVPYmplY3RzRGljdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdGF0ZXM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgU3VidGl0bGVkSHRtbFxuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1N1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFN1YnRpdGxlZEh0bWwgPSBmdW5jdGlvbiAoaHRtbCwgY29udGVudElkKSB7XG4gICAgICAgICAgICB0aGlzLl9odG1sID0gaHRtbDtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRlbnRJZCA9IGNvbnRlbnRJZDtcbiAgICAgICAgfTtcbiAgICAgICAgU3VidGl0bGVkSHRtbC5wcm90b3R5cGUuZ2V0SHRtbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9odG1sO1xuICAgICAgICB9O1xuICAgICAgICBTdWJ0aXRsZWRIdG1sLnByb3RvdHlwZS5nZXRDb250ZW50SWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGVudElkO1xuICAgICAgICB9O1xuICAgICAgICBTdWJ0aXRsZWRIdG1sLnByb3RvdHlwZS5zZXRIdG1sID0gZnVuY3Rpb24gKG5ld0h0bWwpIHtcbiAgICAgICAgICAgIHRoaXMuX2h0bWwgPSBuZXdIdG1sO1xuICAgICAgICB9O1xuICAgICAgICBTdWJ0aXRsZWRIdG1sLnByb3RvdHlwZS5oYXNOb0h0bWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuX2h0bWw7XG4gICAgICAgIH07XG4gICAgICAgIFN1YnRpdGxlZEh0bWwucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWw6IHRoaXMuX2h0bWwsXG4gICAgICAgICAgICAgICAgY29udGVudF9pZDogdGhpcy5fY29udGVudElkXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBTdWJ0aXRsZWRIdG1sLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGFzTm9IdG1sKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFN1YnRpdGxlZEh0bWxbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBzdWJ0aXRsZWRIdG1sQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3VidGl0bGVkSHRtbChzdWJ0aXRsZWRIdG1sQmFja2VuZERpY3QuaHRtbCwgc3VidGl0bGVkSHRtbEJhY2tlbmREaWN0LmNvbnRlbnRfaWQpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTdWJ0aXRsZWRIdG1sWydjcmVhdGVEZWZhdWx0J10gPSBmdW5jdGlvbiAoaHRtbCwgY29udGVudElkKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWJ0aXRsZWRIdG1sKGh0bWwsIGNvbnRlbnRJZCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdWJ0aXRsZWRIdG1sO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mXG4gKiBWb2ljZW92ZXIgZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1ZvaWNlb3Zlck9iamVjdEZhY3RvcnknLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgVm9pY2VvdmVyID0gZnVuY3Rpb24gKGZpbGVuYW1lLCBmaWxlU2l6ZUJ5dGVzLCBuZWVkc1VwZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgdGhpcy5maWxlU2l6ZUJ5dGVzID0gZmlsZVNpemVCeXRlcztcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBuZWVkc1VwZGF0ZTtcbiAgICAgICAgfTtcbiAgICAgICAgVm9pY2VvdmVyLnByb3RvdHlwZS5tYXJrQXNOZWVkaW5nVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIFZvaWNlb3Zlci5wcm90b3R5cGUudG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gIXRoaXMubmVlZHNVcGRhdGU7XG4gICAgICAgIH07XG4gICAgICAgIFZvaWNlb3Zlci5wcm90b3R5cGUuZ2V0RmlsZVNpemVNQiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBOVU1fQllURVNfSU5fTUIgPSAxIDw8IDIwO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZVNpemVCeXRlcyAvIE5VTV9CWVRFU19JTl9NQjtcbiAgICAgICAgfTtcbiAgICAgICAgVm9pY2VvdmVyLnByb3RvdHlwZS50b0JhY2tlbmREaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogdGhpcy5maWxlbmFtZSxcbiAgICAgICAgICAgICAgICBmaWxlX3NpemVfYnl0ZXM6IHRoaXMuZmlsZVNpemVCeXRlcyxcbiAgICAgICAgICAgICAgICBuZWVkc191cGRhdGU6IHRoaXMubmVlZHNVcGRhdGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFZvaWNlb3ZlclsnY3JlYXRlTmV3J10gPSBmdW5jdGlvbiAoZmlsZW5hbWUsIGZpbGVTaXplQnl0ZXMpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZvaWNlb3ZlcihmaWxlbmFtZSwgZmlsZVNpemVCeXRlcywgZmFsc2UpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBWb2ljZW92ZXJbJ2NyZWF0ZUZyb21CYWNrZW5kRGljdCddID0gZnVuY3Rpb24gKHRyYW5zbGF0aW9uQmFja2VuZERpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZvaWNlb3Zlcih0cmFuc2xhdGlvbkJhY2tlbmREaWN0LmZpbGVuYW1lLCB0cmFuc2xhdGlvbkJhY2tlbmREaWN0LmZpbGVfc2l6ZV9ieXRlcywgdHJhbnNsYXRpb25CYWNrZW5kRGljdC5uZWVkc191cGRhdGUpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gVm9pY2VvdmVyO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRmFjdG9yeSBmb3IgY3JlYXRpbmcgbmV3IGZyb250ZW5kIGluc3RhbmNlcyBvZlxuICogV3JpdHRlblRyYW5zbGF0aW9uIGRvbWFpbiBvYmplY3RzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdXcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5JywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFdyaXR0ZW5UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChodG1sLCBuZWVkc1VwZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5odG1sID0gaHRtbDtcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBuZWVkc1VwZGF0ZTtcbiAgICAgICAgfTtcbiAgICAgICAgV3JpdHRlblRyYW5zbGF0aW9uLnByb3RvdHlwZS5nZXRIdG1sID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaHRtbDtcbiAgICAgICAgfTtcbiAgICAgICAgV3JpdHRlblRyYW5zbGF0aW9uLnByb3RvdHlwZS5zZXRIdG1sID0gZnVuY3Rpb24gKGh0bWwpIHtcbiAgICAgICAgICAgIHRoaXMuaHRtbCA9IGh0bWw7XG4gICAgICAgIH07XG4gICAgICAgIFdyaXR0ZW5UcmFuc2xhdGlvbi5wcm90b3R5cGUubWFya0FzTmVlZGluZ1VwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb24ucHJvdG90eXBlLnRvZ2dsZU5lZWRzVXBkYXRlQXR0cmlidXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9ICF0aGlzLm5lZWRzVXBkYXRlO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb24ucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWw6IHRoaXMuaHRtbCxcbiAgICAgICAgICAgICAgICBuZWVkc191cGRhdGU6IHRoaXMubmVlZHNVcGRhdGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFdyaXR0ZW5UcmFuc2xhdGlvblsnY3JlYXRlTmV3J10gPSBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgV3JpdHRlblRyYW5zbGF0aW9uKGh0bWwsIGZhbHNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgV3JpdHRlblRyYW5zbGF0aW9uWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgdHJhbnNsYXRpb25CYWNrZW5kRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBXcml0dGVuVHJhbnNsYXRpb24odHJhbnNsYXRpb25CYWNrZW5kRGljdC5odG1sLCB0cmFuc2xhdGlvbkJhY2tlbmREaWN0Lm5lZWRzX3VwZGF0ZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBXcml0dGVuVHJhbnNsYXRpb247XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBuZXcgZnJvbnRlbmQgaW5zdGFuY2VzIG9mXG4gKiBXcml0dGVuVHJhbnNsYXRpb25zIGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vQXVkaW9UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9Xcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0xhbmd1YWdlVXRpbFNlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5JywgW1xuICAgICdXcml0dGVuVHJhbnNsYXRpb25PYmplY3RGYWN0b3J5JywgZnVuY3Rpb24gKFdyaXR0ZW5UcmFuc2xhdGlvbk9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgdmFyIFdyaXR0ZW5UcmFuc2xhdGlvbnMgPSBmdW5jdGlvbiAodHJhbnNsYXRpb25zTWFwcGluZykge1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nID0gdHJhbnNsYXRpb25zTWFwcGluZztcbiAgICAgICAgfTtcbiAgICAgICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUuZ2V0QWxsQ29udGVudElkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudHJhbnNsYXRpb25zTWFwcGluZyk7XG4gICAgICAgIH07XG4gICAgICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLmdldFdyaXR0ZW5UcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIChjb250ZW50SWQsIGxhbmdDb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF1bbGFuZ0NvZGVdO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5tYXJrQWxsVHJhbnNsYXRpb25zQXNOZWVkaW5nVXBkYXRlID0gKGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgIHZhciBsYW5ndWFnZUNvZGVUb1dyaXR0ZW5UcmFuc2xhdGlvbiA9ICh0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXSk7XG4gICAgICAgICAgICBmb3IgKHZhciBsYW5ndWFnZUNvZGUgaW4gbGFuZ3VhZ2VDb2RlVG9Xcml0dGVuVHJhbnNsYXRpb24pIHtcbiAgICAgICAgICAgICAgICBsYW5ndWFnZUNvZGVUb1dyaXR0ZW5UcmFuc2xhdGlvbltsYW5ndWFnZUNvZGVdLm1hcmtBc05lZWRpbmdVcGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLmdldFRyYW5zbGF0aW9uc0xhbmd1YWdlQ29kZXMgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF0pO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5oYXNXcml0dGVuVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAoY29udGVudElkLCBsYW5nYXVnZUNvZGUpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nLmhhc093blByb3BlcnR5KGNvbnRlbnRJZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2xhdGlvbnNMYW5ndWFnZUNvZGVzKGNvbnRlbnRJZCkuaW5kZXhPZihsYW5nYXVnZUNvZGUpICE9PSAtMTtcbiAgICAgICAgfTtcbiAgICAgICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUuaGFzVW5mbGFnZ2VkV3JpdHRlblRyYW5zbGF0aW9ucyA9IGZ1bmN0aW9uIChjb250ZW50SWQpIHtcbiAgICAgICAgICAgIHZhciB3cml0dGVuVHJhbnNsYXRpb25zID0gdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBmb3IgKHZhciBsYW5ndWFnZUNvZGUgaW4gd3JpdHRlblRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmICghd3JpdHRlblRyYW5zbGF0aW9uc1tsYW5ndWFnZUNvZGVdLm5lZWRzVXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgV3JpdHRlblRyYW5zbGF0aW9ucy5wcm90b3R5cGUuYWRkQ29udGVudElkID0gZnVuY3Rpb24gKGNvbnRlbnRJZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNsYXRpb25zTWFwcGluZy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RyeWluZyB0byBhZGQgZHVwbGljYXRlIGNvbnRlbnQgaWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXSA9IHt9O1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5kZWxldGVDb250ZW50SWQgPSBmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudHJhbnNsYXRpb25zTWFwcGluZy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIHRoZSBnaXZlbiBjb250ZW50IGlkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS5hZGRXcml0dGVuVHJhbnNsYXRpb24gPSBmdW5jdGlvbiAoY29udGVudElkLCBsYW5ndWFnZUNvZGUsIGh0bWwpIHtcbiAgICAgICAgICAgIHZhciB3cml0dGVuVHJhbnNsYXRpb25zID0gdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAod3JpdHRlblRyYW5zbGF0aW9ucy5oYXNPd25Qcm9wZXJ0eShsYW5ndWFnZUNvZGUpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RyeWluZyB0byBhZGQgZHVwbGljYXRlIGxhbmd1YWdlIGNvZGUuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3cml0dGVuVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0gPSAoV3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVOZXcoaHRtbCkpO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS51cGRhdGVXcml0dGVuVHJhbnNsYXRpb25IdG1sID0gZnVuY3Rpb24gKGNvbnRlbnRJZCwgbGFuZ3VhZ2VDb2RlLCBodG1sKSB7XG4gICAgICAgICAgICB2YXIgd3JpdHRlblRyYW5zbGF0aW9ucyA9IHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICAgICAgaWYgKCF3cml0dGVuVHJhbnNsYXRpb25zLmhhc093blByb3BlcnR5KGxhbmd1YWdlQ29kZSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignVW5hYmxlIHRvIGZpbmQgdGhlIGdpdmVuIGxhbmd1YWdlIGNvZGUuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3cml0dGVuVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0uc2V0SHRtbChodG1sKTtcbiAgICAgICAgICAgIC8vIE1hcmtpbmcgdHJhbnNsYXRpb24gdXBkYXRlZC5cbiAgICAgICAgICAgIHdyaXR0ZW5UcmFuc2xhdGlvbnNbbGFuZ3VhZ2VDb2RlXS5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zLnByb3RvdHlwZS50b2dnbGVOZWVkc1VwZGF0ZUF0dHJpYnV0ZSA9IChmdW5jdGlvbiAoY29udGVudElkLCBsYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgIHZhciB3cml0dGVuVHJhbnNsYXRpb25zID0gdGhpcy50cmFuc2xhdGlvbnNNYXBwaW5nW2NvbnRlbnRJZF07XG4gICAgICAgICAgICB3cml0dGVuVHJhbnNsYXRpb25zW2xhbmd1YWdlQ29kZV0udG9nZ2xlTmVlZHNVcGRhdGVBdHRyaWJ1dGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnMucHJvdG90eXBlLnRvQmFja2VuZERpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdHJhbnNsYXRpb25zTWFwcGluZ0RpY3QgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGNvbnRlbnRJZCBpbiB0aGlzLnRyYW5zbGF0aW9uc01hcHBpbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFuZ2F1Z2VUb1dyaXR0ZW5UcmFuc2xhdGlvbiA9IHRoaXMudHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdO1xuICAgICAgICAgICAgICAgIHZhciBsYW5nYXVnZVRvV3JpdHRlblRyYW5zbGF0aW9uRGljdCA9IHt9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGxhbmdhdWdlVG9Xcml0dGVuVHJhbnNsYXRpb24pLmZvckVhY2goZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFuZ2F1Z2VUb1dyaXR0ZW5UcmFuc2xhdGlvbkRpY3RbbGFuZ10gPSAobGFuZ2F1Z2VUb1dyaXR0ZW5UcmFuc2xhdGlvbltsYW5nXS50b0JhY2tlbmREaWN0KCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uc01hcHBpbmdEaWN0W2NvbnRlbnRJZF0gPSBsYW5nYXVnZVRvV3JpdHRlblRyYW5zbGF0aW9uRGljdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHRyYW5zbGF0aW9uc19tYXBwaW5nOiB0cmFuc2xhdGlvbnNNYXBwaW5nRGljdCB9O1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBXcml0dGVuVHJhbnNsYXRpb25zWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgd3JpdHRlblRyYW5zbGF0aW9uc0RpY3QpIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2xhdGlvbnNNYXBwaW5nID0ge307XG4gICAgICAgICAgICBPYmplY3Qua2V5cyh3cml0dGVuVHJhbnNsYXRpb25zRGljdC50cmFuc2xhdGlvbnNfbWFwcGluZykuZm9yRWFjaChmdW5jdGlvbiAoY29udGVudElkKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNsYXRpb25zTWFwcGluZ1tjb250ZW50SWRdID0ge307XG4gICAgICAgICAgICAgICAgdmFyIGxhbmd1YWdlQ29kZVRvV3JpdHRlblRyYW5zbGF0aW9uRGljdCA9ICh3cml0dGVuVHJhbnNsYXRpb25zRGljdC50cmFuc2xhdGlvbnNfbWFwcGluZ1tjb250ZW50SWRdKTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhsYW5ndWFnZUNvZGVUb1dyaXR0ZW5UcmFuc2xhdGlvbkRpY3QpLmZvckVhY2goZnVuY3Rpb24gKGxhbmdDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uc01hcHBpbmdbY29udGVudElkXVtsYW5nQ29kZV0gPSAoV3JpdHRlblRyYW5zbGF0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3QobGFuZ3VhZ2VDb2RlVG9Xcml0dGVuVHJhbnNsYXRpb25EaWN0W2xhbmdDb2RlXSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFdyaXR0ZW5UcmFuc2xhdGlvbnModHJhbnNsYXRpb25zTWFwcGluZyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFdyaXR0ZW5UcmFuc2xhdGlvbnNbJ2NyZWF0ZUVtcHR5J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBXcml0dGVuVHJhbnNsYXRpb25zKHt9KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFdyaXR0ZW5UcmFuc2xhdGlvbnM7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBmcm9udGVuZCBpbnN0YW5jZXMgb2YgU3RhdGVcbiAqIGRvbWFpbiBvYmplY3RzLlxuICovXG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vQ29udGVudElkc1RvQXVkaW9UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vZXhwbG9yYXRpb24vUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL0ludGVyYWN0aW9uT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL1BhcmFtQ2hhbmdlc09iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi9leHBsb3JhdGlvbi9TdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL2V4cGxvcmF0aW9uL1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdTdGF0ZU9iamVjdEZhY3RvcnknLCBbXG4gICAgJ0ludGVyYWN0aW9uT2JqZWN0RmFjdG9yeScsICdQYXJhbUNoYW5nZXNPYmplY3RGYWN0b3J5JyxcbiAgICAnUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeScsICdTdWJ0aXRsZWRIdG1sT2JqZWN0RmFjdG9yeScsXG4gICAgJ1dyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5JywgZnVuY3Rpb24gKEludGVyYWN0aW9uT2JqZWN0RmFjdG9yeSwgUGFyYW1DaGFuZ2VzT2JqZWN0RmFjdG9yeSwgUmVjb3JkZWRWb2ljZW92ZXJzT2JqZWN0RmFjdG9yeSwgU3VidGl0bGVkSHRtbE9iamVjdEZhY3RvcnksIFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5KSB7XG4gICAgICAgIHZhciBTdGF0ZSA9IGZ1bmN0aW9uIChuYW1lLCBjbGFzc2lmaWVyTW9kZWxJZCwgY29udGVudCwgaW50ZXJhY3Rpb24sIHBhcmFtQ2hhbmdlcywgcmVjb3JkZWRWb2ljZW92ZXJzLCB3cml0dGVuVHJhbnNsYXRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgdGhpcy5jbGFzc2lmaWVyTW9kZWxJZCA9IGNsYXNzaWZpZXJNb2RlbElkO1xuICAgICAgICAgICAgdGhpcy5jb250ZW50ID0gY29udGVudDtcbiAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSBpbnRlcmFjdGlvbjtcbiAgICAgICAgICAgIHRoaXMucGFyYW1DaGFuZ2VzID0gcGFyYW1DaGFuZ2VzO1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRlZFZvaWNlb3ZlcnMgPSByZWNvcmRlZFZvaWNlb3ZlcnM7XG4gICAgICAgICAgICB0aGlzLndyaXR0ZW5UcmFuc2xhdGlvbnMgPSB3cml0dGVuVHJhbnNsYXRpb25zO1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuc2V0TmFtZSA9IGZ1bmN0aW9uIChuZXdOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBuZXdOYW1lO1xuICAgICAgICB9O1xuICAgICAgICAvLyBJbnN0YW5jZSBtZXRob2RzLlxuICAgICAgICBTdGF0ZS5wcm90b3R5cGUudG9CYWNrZW5kRGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY29udGVudDogdGhpcy5jb250ZW50LnRvQmFja2VuZERpY3QoKSxcbiAgICAgICAgICAgICAgICBjbGFzc2lmaWVyX21vZGVsX2lkOiB0aGlzLmNsYXNzaWZpZXJNb2RlbElkLFxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uOiB0aGlzLmludGVyYWN0aW9uLnRvQmFja2VuZERpY3QoKSxcbiAgICAgICAgICAgICAgICBwYXJhbV9jaGFuZ2VzOiB0aGlzLnBhcmFtQ2hhbmdlcy5tYXAoZnVuY3Rpb24gKHBhcmFtQ2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbUNoYW5nZS50b0JhY2tlbmREaWN0KCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgcmVjb3JkZWRfdm9pY2VvdmVyczogdGhpcy5yZWNvcmRlZFZvaWNlb3ZlcnMudG9CYWNrZW5kRGljdCgpLFxuICAgICAgICAgICAgICAgIHdyaXR0ZW5fdHJhbnNsYXRpb25zOiB0aGlzLndyaXR0ZW5UcmFuc2xhdGlvbnMudG9CYWNrZW5kRGljdCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBTdGF0ZS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIChvdGhlclN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBvdGhlclN0YXRlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmNsYXNzaWZpZXJNb2RlbElkID0gb3RoZXJTdGF0ZS5jbGFzc2lmaWVyTW9kZWxJZDtcbiAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGFuZ3VsYXIuY29weShvdGhlclN0YXRlLmNvbnRlbnQpO1xuICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5jb3B5KG90aGVyU3RhdGUuaW50ZXJhY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy5wYXJhbUNoYW5nZXMgPSBhbmd1bGFyLmNvcHkob3RoZXJTdGF0ZS5wYXJhbUNoYW5nZXMpO1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRlZFZvaWNlb3ZlcnMgPSBhbmd1bGFyLmNvcHkob3RoZXJTdGF0ZS5yZWNvcmRlZFZvaWNlb3ZlcnMpO1xuICAgICAgICAgICAgdGhpcy53cml0dGVuVHJhbnNsYXRpb25zID0gYW5ndWxhci5jb3B5KG90aGVyU3RhdGUud3JpdHRlblRyYW5zbGF0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFN0YXRlWydjcmVhdGVEZWZhdWx0U3RhdGUnXSA9IGZ1bmN0aW9uIChuZXdTdGF0ZU5hbWUpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgbmV3U3RhdGVUZW1wbGF0ZSA9IGFuZ3VsYXIuY29weShjb25zdGFudHMuTkVXX1NUQVRFX1RFTVBMQVRFKTtcbiAgICAgICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMuY3JlYXRlRnJvbUJhY2tlbmREaWN0KG5ld1N0YXRlTmFtZSwge1xuICAgICAgICAgICAgICAgIGNsYXNzaWZpZXJfbW9kZWxfaWQ6IG5ld1N0YXRlVGVtcGxhdGUuY2xhc3NpZmllcl9tb2RlbF9pZCxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBuZXdTdGF0ZVRlbXBsYXRlLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgaW50ZXJhY3Rpb246IG5ld1N0YXRlVGVtcGxhdGUuaW50ZXJhY3Rpb24sXG4gICAgICAgICAgICAgICAgcGFyYW1fY2hhbmdlczogbmV3U3RhdGVUZW1wbGF0ZS5wYXJhbV9jaGFuZ2VzLFxuICAgICAgICAgICAgICAgIHJlY29yZGVkX3ZvaWNlb3ZlcnM6IG5ld1N0YXRlVGVtcGxhdGUucmVjb3JkZWRfdm9pY2VvdmVycyxcbiAgICAgICAgICAgICAgICB3cml0dGVuX3RyYW5zbGF0aW9uczogbmV3U3RhdGVUZW1wbGF0ZS53cml0dGVuX3RyYW5zbGF0aW9uc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXdTdGF0ZS5pbnRlcmFjdGlvbi5kZWZhdWx0T3V0Y29tZS5kZXN0ID0gbmV3U3RhdGVOYW1lO1xuICAgICAgICAgICAgcmV0dXJuIG5ld1N0YXRlO1xuICAgICAgICB9O1xuICAgICAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW5cbiAgICAgICAgLy8gc3RhdGljIGNvbnRleHRzLlxuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBTdGF0ZVsnY3JlYXRlRnJvbUJhY2tlbmREaWN0J10gPSBmdW5jdGlvbiAoc3RhdGVOYW1lLCBzdGF0ZURpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN0YXRlKHN0YXRlTmFtZSwgc3RhdGVEaWN0LmNsYXNzaWZpZXJfbW9kZWxfaWQsIFN1YnRpdGxlZEh0bWxPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzdGF0ZURpY3QuY29udGVudCksIEludGVyYWN0aW9uT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZERpY3Qoc3RhdGVEaWN0LmludGVyYWN0aW9uKSwgUGFyYW1DaGFuZ2VzT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tQmFja2VuZExpc3Qoc3RhdGVEaWN0LnBhcmFtX2NoYW5nZXMpLCBSZWNvcmRlZFZvaWNlb3ZlcnNPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzdGF0ZURpY3QucmVjb3JkZWRfdm9pY2VvdmVycyksIFdyaXR0ZW5UcmFuc2xhdGlvbnNPYmplY3RGYWN0b3J5LmNyZWF0ZUZyb21CYWNrZW5kRGljdChzdGF0ZURpY3Qud3JpdHRlbl90cmFuc2xhdGlvbnMpKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFN0YXRlO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBPYmplY3QgZmFjdG9yeSBmb3IgY3JlYXRpbmcgYXVkaW8gbGFuZ3VhZ2VzLlxuICovXG5vcHBpYS5mYWN0b3J5KCdBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeScsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBBdWRpb0xhbmd1YWdlID0gZnVuY3Rpb24gKGlkLCBkZXNjcmlwdGlvbiwgcmVsYXRlZExhbmd1YWdlcykge1xuICAgICAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgdGhpcy5yZWxhdGVkTGFuZ3VhZ2VzID0gcmVsYXRlZExhbmd1YWdlcztcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQXVkaW9MYW5ndWFnZVsnY3JlYXRlRnJvbURpY3QnXSA9IGZ1bmN0aW9uIChhdWRpb0xhbmd1YWdlRGljdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgQXVkaW9MYW5ndWFnZShhdWRpb0xhbmd1YWdlRGljdC5pZCwgYXVkaW9MYW5ndWFnZURpY3QuZGVzY3JpcHRpb24sIGF1ZGlvTGFuZ3VhZ2VEaWN0LnJlbGF0ZWRfbGFuZ3VhZ2VzKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEF1ZGlvTGFuZ3VhZ2U7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE9iamVjdCBmYWN0b3J5IGZvciBjcmVhdGluZyBhdXRvZ2VuZXJhdGVkIGF1ZGlvIGxhbmd1YWdlcy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5JywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIEF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlID0gZnVuY3Rpb24gKGlkLCBkZXNjcmlwdGlvbiwgZXhwbG9yYXRpb25MYW5ndWFnZSwgc3BlZWNoU3ludGhlc2lzQ29kZSwgc3BlZWNoU3ludGhlc2lzQ29kZU1vYmlsZSkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgdGhpcy5leHBsb3JhdGlvbkxhbmd1YWdlID0gZXhwbG9yYXRpb25MYW5ndWFnZTtcbiAgICAgICAgICAgIHRoaXMuc3BlZWNoU3ludGhlc2lzQ29kZSA9IHNwZWVjaFN5bnRoZXNpc0NvZGU7XG4gICAgICAgICAgICB0aGlzLnNwZWVjaFN5bnRoZXNpc0NvZGVNb2JpbGUgPSBzcGVlY2hTeW50aGVzaXNDb2RlTW9iaWxlO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZVsnY3JlYXRlRnJvbURpY3QnXSA9IChcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgZnVuY3Rpb24gKGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZShhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZURpY3QuaWQsIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlRGljdC5kZXNjcmlwdGlvbiwgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0LmV4cGxvcmF0aW9uX2xhbmd1YWdlLCBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZURpY3Quc3BlZWNoX3N5bnRoZXNpc19jb2RlLCBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZURpY3Quc3BlZWNoX3N5bnRoZXNpc19jb2RlX21vYmlsZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gQXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2U7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxpdHkgc2VydmljZSBmb3IgbGFuZ3VhZ2Ugb3BlcmF0aW9ucy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9BdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9BdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvQnJvd3NlckNoZWNrZXJTZXJ2aWNlLnRzJyk7XG5vcHBpYS5mYWN0b3J5KCdMYW5ndWFnZVV0aWxTZXJ2aWNlJywgW1xuICAgICdBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeScsICdBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnknLFxuICAgICdCcm93c2VyQ2hlY2tlclNlcnZpY2UnLCAnQUxMX0xBTkdVQUdFX0NPREVTJyxcbiAgICAnQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVMnLCAnU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUycsXG4gICAgZnVuY3Rpb24gKEF1ZGlvTGFuZ3VhZ2VPYmplY3RGYWN0b3J5LCBBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnksIEJyb3dzZXJDaGVja2VyU2VydmljZSwgQUxMX0xBTkdVQUdFX0NPREVTLCBBVVRPR0VORVJBVEVEX0FVRElPX0xBTkdVQUdFUywgU1VQUE9SVEVEX0FVRElPX0xBTkdVQUdFUykge1xuICAgICAgICB2YXIgc3VwcG9ydGVkQXVkaW9MYW5ndWFnZUxpc3QgPSBTVVBQT1JURURfQVVESU9fTEFOR1VBR0VTO1xuICAgICAgICB2YXIgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VMaXN0ID0gQVVUT0dFTkVSQVRFRF9BVURJT19MQU5HVUFHRVM7XG4gICAgICAgIHZhciBzdXBwb3J0ZWRBdWRpb0xhbmd1YWdlcyA9IHt9O1xuICAgICAgICB2YXIgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VzQnlFeHBsb3JhdGlvbkxhbmd1YWdlQ29kZSA9IHt9O1xuICAgICAgICB2YXIgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VzQnlBdXRvZ2VuZXJhdGVkTGFuZ3VhZ2VDb2RlID0ge307XG4gICAgICAgIHZhciBnZXRTaG9ydExhbmd1YWdlRGVzY3JpcHRpb24gPSBmdW5jdGlvbiAoZnVsbExhbmd1YWdlRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHZhciBpbmQgPSBmdWxsTGFuZ3VhZ2VEZXNjcmlwdGlvbi5pbmRleE9mKCcgKCcpO1xuICAgICAgICAgICAgaWYgKGluZCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVsbExhbmd1YWdlRGVzY3JpcHRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVsbExhbmd1YWdlRGVzY3JpcHRpb24uc3Vic3RyaW5nKDAsIGluZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBsYW5ndWFnZUlkc0FuZFRleHRzID0gQUxMX0xBTkdVQUdFX0NPREVTLm1hcChmdW5jdGlvbiAobGFuZ3VhZ2VJdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlkOiBsYW5ndWFnZUl0ZW0uY29kZSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBnZXRTaG9ydExhbmd1YWdlRGVzY3JpcHRpb24obGFuZ3VhZ2VJdGVtLmRlc2NyaXB0aW9uKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBhbGxBdWRpb0xhbmd1YWdlQ29kZXMgPSAoc3VwcG9ydGVkQXVkaW9MYW5ndWFnZUxpc3QubWFwKGZ1bmN0aW9uIChhdWRpb0xhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXVkaW9MYW5ndWFnZS5pZDtcbiAgICAgICAgfSkpO1xuICAgICAgICBzdXBwb3J0ZWRBdWRpb0xhbmd1YWdlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChhdWRpb0xhbmd1YWdlRGljdCkge1xuICAgICAgICAgICAgc3VwcG9ydGVkQXVkaW9MYW5ndWFnZXNbYXVkaW9MYW5ndWFnZURpY3QuaWRdID1cbiAgICAgICAgICAgICAgICBBdWRpb0xhbmd1YWdlT2JqZWN0RmFjdG9yeS5jcmVhdGVGcm9tRGljdChhdWRpb0xhbmd1YWdlRGljdCk7XG4gICAgICAgIH0pO1xuICAgICAgICBhdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0KSB7XG4gICAgICAgICAgICB2YXIgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2UgPSBBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZU9iamVjdEZhY3RvcnkuY3JlYXRlRnJvbURpY3QoYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VEaWN0KTtcbiAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5RXhwbG9yYXRpb25MYW5ndWFnZUNvZGVbYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2UuZXhwbG9yYXRpb25MYW5ndWFnZV0gPVxuICAgICAgICAgICAgICAgIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlO1xuICAgICAgICAgICAgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VzQnlBdXRvZ2VuZXJhdGVkTGFuZ3VhZ2VDb2RlW2F1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlLmlkXSA9XG4gICAgICAgICAgICAgICAgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2U7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgYXVkaW9MYW5ndWFnZXNDb3VudCA9IGFsbEF1ZGlvTGFuZ3VhZ2VDb2Rlcy5sZW5ndGg7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRMYW5ndWFnZUlkc0FuZFRleHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlSWRzQW5kVGV4dHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QXVkaW9MYW5ndWFnZXNDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhdWRpb0xhbmd1YWdlc0NvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFsbFZvaWNlb3Zlckxhbmd1YWdlQ29kZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KGFsbEF1ZGlvTGFuZ3VhZ2VDb2Rlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QXVkaW9MYW5ndWFnZURlc2NyaXB0aW9uOiBmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VwcG9ydGVkQXVkaW9MYW5ndWFnZXNbYXVkaW9MYW5ndWFnZUNvZGVdLmRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEdpdmVuIGEgbGlzdCBvZiBhdWRpbyBsYW5ndWFnZSBjb2RlcywgcmV0dXJucyB0aGUgY29tcGxlbWVudCBsaXN0LCBpLmUuXG4gICAgICAgICAgICAvLyB0aGUgbGlzdCBvZiBhdWRpbyBsYW5ndWFnZSBjb2RlcyBub3QgaW4gdGhlIGlucHV0IGxpc3QuXG4gICAgICAgICAgICBnZXRDb21wbGVtZW50QXVkaW9MYW5ndWFnZUNvZGVzOiBmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZUNvZGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsbEF1ZGlvTGFuZ3VhZ2VDb2Rlcy5maWx0ZXIoZnVuY3Rpb24gKGxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXVkaW9MYW5ndWFnZUNvZGVzLmluZGV4T2YobGFuZ3VhZ2VDb2RlKSA9PT0gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TGFuZ3VhZ2VDb2Rlc1JlbGF0ZWRUb0F1ZGlvTGFuZ3VhZ2VDb2RlOiBmdW5jdGlvbiAoYXVkaW9MYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VwcG9ydGVkQXVkaW9MYW5ndWFnZXNbYXVkaW9MYW5ndWFnZUNvZGVdLnJlbGF0ZWRMYW5ndWFnZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3VwcG9ydHNBdXRvZ2VuZXJhdGVkQXVkaW86IGZ1bmN0aW9uIChleHBsb3JhdGlvbkxhbmd1YWdlQ29kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoQnJvd3NlckNoZWNrZXJTZXJ2aWNlLnN1cHBvcnRzU3BlZWNoU3ludGhlc2lzKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VzQnlFeHBsb3JhdGlvbkxhbmd1YWdlQ29kZVxuICAgICAgICAgICAgICAgICAgICAgICAgLmhhc093blByb3BlcnR5KGV4cGxvcmF0aW9uTGFuZ3VhZ2VDb2RlKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNBdXRvZ2VuZXJhdGVkQXVkaW9MYW5ndWFnZTogZnVuY3Rpb24gKGF1ZGlvTGFuZ3VhZ2VDb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlc0J5QXV0b2dlbmVyYXRlZExhbmd1YWdlQ29kZVxuICAgICAgICAgICAgICAgICAgICAuaGFzT3duUHJvcGVydHkoYXVkaW9MYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEF1dG9nZW5lcmF0ZWRBdWRpb0xhbmd1YWdlOiBmdW5jdGlvbiAoZXhwbG9yYXRpb25MYW5ndWFnZUNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXV0b2dlbmVyYXRlZEF1ZGlvTGFuZ3VhZ2VzQnlFeHBsb3JhdGlvbkxhbmd1YWdlQ29kZVtleHBsb3JhdGlvbkxhbmd1YWdlQ29kZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENhbWVsQ2FzZVRvSHlwaGVucyBmaWx0ZXIgZm9yIE9wcGlhLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RyaW5nVXRpbGl0eUZpbHRlcnNNb2R1bGUnKS5maWx0ZXIoJ2NhbWVsQ2FzZVRvSHlwaGVucycsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBpbnB1dC5yZXBsYWNlKC8oW2Etel0pPyhbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHRbMF0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBOb3JtYWxpemVXaGl0ZXNwYWNlIGZpbHRlciBmb3IgT3BwaWEuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL1V0aWxzU2VydmljZS50cycpO1xuLy8gRmlsdGVyIHRoYXQgcmVtb3ZlcyB3aGl0ZXNwYWNlIGZyb20gdGhlIGJlZ2lubmluZyBhbmQgZW5kIG9mIGEgc3RyaW5nLCBhbmRcbi8vIHJlcGxhY2VzIGludGVyaW9yIHdoaXRlc3BhY2Ugd2l0aCBhIHNpbmdsZSBzcGFjZSBjaGFyYWN0ZXIuXG5hbmd1bGFyLm1vZHVsZSgnc3RyaW5nVXRpbGl0eUZpbHRlcnNNb2R1bGUnKS5maWx0ZXIoJ25vcm1hbGl6ZVdoaXRlc3BhY2UnLCBbJ1V0aWxzU2VydmljZScsIGZ1bmN0aW9uIChVdGlsc1NlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgaWYgKFV0aWxzU2VydmljZS5pc1N0cmluZyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgd2hpdGVzcGFjZSBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIGVuZCBvZiB0aGUgc3RyaW5nLCBhbmRcbiAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGludGVyaW9yIHdoaXRlc3BhY2Ugd2l0aCBhIHNpbmdsZSBzcGFjZSBjaGFyYWN0ZXIuXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC50cmltKCk7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC9cXHN7Mix9L2csICcgJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250c3RhbnMgdG8gYmUgdXNlZCBpbiB0aGUgbGVhcm5lciB2aWV3LlxuICovXG5vcHBpYS5jb25zdGFudCgnQ09OVEVOVF9GT0NVU19MQUJFTF9QUkVGSVgnLCAnY29udGVudC1mb2N1cy1sYWJlbC0nKTtcbm9wcGlhLmNvbnN0YW50KCdUV09fQ0FSRF9USFJFU0hPTERfUFgnLCA5NjApO1xub3BwaWEuY29uc3RhbnQoJ0NPTlRJTlVFX0JVVFRPTl9GT0NVU19MQUJFTCcsICdjb250aW51ZUJ1dHRvbicpO1xuLyogTmV3IGNhcmQgaXMgYXZhaWxhYmxlIGJ1dCB1c2VyIGhhc24ndCBnb25lIHRvIGl0IHlldCAod2hlbiBvcHBpYVxuICAgZ2l2ZXMgYSBmZWVkYmFjayBhbmQgd2FpdHMgZm9yIHVzZXIgdG8gcHJlc3MgJ2NvbnRpbnVlJykuXG4gICBOb3QgY2FsbGVkIHdoZW4gYSBjYXJkIGlzIHNlbGVjdGVkIGJ5IGNsaWNraW5nIHByb2dyZXNzIGRvdHMgKi9cbm9wcGlhLmNvbnN0YW50KCdFVkVOVF9ORVdfQ0FSRF9BVkFJTEFCTEUnLCAnbmV3Q2FyZEF2YWlsYWJsZScpO1xuLyogQ2FsbGVkIHdoZW4gdGhlIGxlYXJuZXIgbW92ZXMgdG8gYSBuZXcgY2FyZCB0aGF0IHRoZXkgaGF2ZW4ndCBzZWVuIGJlZm9yZS4gKi9cbm9wcGlhLmNvbnN0YW50KCdFVkVOVF9ORVdfQ0FSRF9PUEVORUQnLCAnbmV3Q2FyZE9wZW5lZCcpO1xuLyogQ2FsbGVkIGFsd2F5cyB3aGVuIGxlYXJuZXIgbW92ZXMgdG8gYSBuZXcgY2FyZC5cbiAgIEFsc28gY2FsbGVkIHdoZW4gY2FyZCBpcyBzZWxlY3RlZCBieSBjbGlja2luZyBvbiBwcm9ncmVzcyBkb3RzICovXG5vcHBpYS5jb25zdGFudCgnRVZFTlRfQUNUSVZFX0NBUkRfQ0hBTkdFRCcsICdhY3RpdmVDYXJkQ2hhbmdlZCcpO1xuLyogQ2FsbGVkIHdoZW4gYSBuZXcgYXVkaW8tZXF1aXBwYWJsZSBjb21wb25lbnQgaXMgbG9hZGVkIGFuZCBkaXNwbGF5ZWRcbiAgIHRvIHRoZSB1c2VyLCBhbGxvd2luZyBmb3IgdGhlIGF1dG9tYXRpYyBwbGF5aW5nIG9mIGF1ZGlvIGlmIG5lY2Vzc2FyeS4gKi9cbm9wcGlhLmNvbnN0YW50KCdFVkVOVF9BVVRPUExBWV9BVURJTycsICdhdXRvUGxheUF1ZGlvJyk7XG4vLyBUaGUgZW5mb3JjZWQgd2FpdGluZyBwZXJpb2QgYmVmb3JlIHRoZSBmaXJzdCBoaW50IHJlcXVlc3QuXG5vcHBpYS5jb25zdGFudCgnV0FJVF9GT1JfRklSU1RfSElOVF9NU0VDJywgNjAwMDApO1xuLy8gVGhlIGVuZm9yY2VkIHdhaXRpbmcgcGVyaW9kIGJlZm9yZSBlYWNoIG9mIHRoZSBzdWJzZXF1ZW50IGhpbnQgcmVxdWVzdHMuXG5vcHBpYS5jb25zdGFudCgnV0FJVF9GT1JfU1VCU0VRVUVOVF9ISU5UU19NU0VDJywgMzAwMDApO1xuLy8gVGhlIHRpbWUgZGVsYXkgYmV0d2VlbiB0aGUgbGVhcm5lciBjbGlja2luZyB0aGUgaGludCBidXR0b25cbi8vIGFuZCB0aGUgYXBwZWFyYW5jZSBvZiB0aGUgaGludC5cbm9wcGlhLmNvbnN0YW50KCdERUxBWV9GT1JfSElOVF9GRUVEQkFDS19NU0VDJywgMTAwKTtcbi8vIEFycmF5IG9mIGkxOG4gSURzIGZvciB0aGUgcG9zc2libGUgaGludCByZXF1ZXN0IHN0cmluZ3MuXG5vcHBpYS5jb25zdGFudCgnSElOVF9SRVFVRVNUX1NUUklOR19JMThOX0lEUycsIFtcbiAgICAnSTE4Tl9QTEFZRVJfSElOVF9SRVFVRVNUX1NUUklOR18xJyxcbiAgICAnSTE4Tl9QTEFZRVJfSElOVF9SRVFVRVNUX1NUUklOR18yJyxcbiAgICAnSTE4Tl9QTEFZRVJfSElOVF9SRVFVRVNUX1NUUklOR18zJ1xuXSk7XG5vcHBpYS5jb25zdGFudCgnRVhQTE9SQVRJT05fREFUQV9VUkxfVEVNUExBVEUnLCAnL2V4cGxvcmVoYW5kbGVyL2luaXQvPGV4cGxvcmF0aW9uX2lkPicpO1xub3BwaWEuY29uc3RhbnQoJ0VYUExPUkFUSU9OX1ZFUlNJT05fREFUQV9VUkxfVEVNUExBVEUnLCAnL2V4cGxvcmVoYW5kbGVyL2luaXQvPGV4cGxvcmF0aW9uX2lkPj92PTx2ZXJzaW9uPicpO1xub3BwaWEuY29uc3RhbnQoJ0VESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFJywgJy9jcmVhdGVoYW5kbGVyL2RhdGEvPGV4cGxvcmF0aW9uX2lkPicpO1xub3BwaWEuY29uc3RhbnQoJ0VESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfRFJBRlRfVVJMX1RFTVBMQVRFJywgJy9jcmVhdGVoYW5kbGVyL2RhdGEvPGV4cGxvcmF0aW9uX2lkPj9hcHBseV9kcmFmdD08YXBwbHlfZHJhZnQ+Jyk7XG5vcHBpYS5jb25zdGFudCgnVFJBTlNMQVRFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFJywgJy9jcmVhdGVoYW5kbGVyL3RyYW5zbGF0ZS88ZXhwbG9yYXRpb25faWQ+Jyk7XG4vKiBUaGlzIHNob3VsZCBtYXRjaCB0aGUgQ1NTIGNsYXNzIGRlZmluZWQgaW4gdGhlIHR1dG9yIGNhcmQgZGlyZWN0aXZlLiAqL1xub3BwaWEuY29uc3RhbnQoJ0FVRElPX0hJR0hMSUdIVF9DU1NfQ0xBU1MnLCAnY29udmVyc2F0aW9uLXNraW4tYXVkaW8taGlnaGxpZ2h0Jyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFV0aWxpdHkgc2VydmljZXMgZm9yIGV4cGxvcmF0aW9ucyB3aGljaCBtYXkgYmUgc2hhcmVkIGJ5IGJvdGhcbiAqIHRoZSBsZWFybmVyIGFuZCBlZGl0b3Igdmlld3MuXG4gKi9cbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9jYW1lbC1jYXNlLXRvLWh5cGhlbnMuZmlsdGVyLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9FeHRlbnNpb25UYWdBc3NlbWJsZXJTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMnKTtcbi8vIEEgc2VydmljZSB0aGF0IHByb3ZpZGVzIGEgbnVtYmVyIG9mIHV0aWxpdHkgZnVuY3Rpb25zIHVzZWZ1bCB0byBib3RoIHRoZVxuLy8gZWRpdG9yIGFuZCBwbGF5ZXIuXG5vcHBpYS5mYWN0b3J5KCdFeHBsb3JhdGlvbkh0bWxGb3JtYXR0ZXJTZXJ2aWNlJywgW1xuICAgICckZmlsdGVyJywgJ0V4dGVuc2lvblRhZ0Fzc2VtYmxlclNlcnZpY2UnLCAnSHRtbEVzY2FwZXJTZXJ2aWNlJyxcbiAgICAnSU5URVJBQ1RJT05fU1BFQ1MnLFxuICAgIGZ1bmN0aW9uICgkZmlsdGVyLCBFeHRlbnNpb25UYWdBc3NlbWJsZXJTZXJ2aWNlLCBIdG1sRXNjYXBlclNlcnZpY2UsIElOVEVSQUNUSU9OX1NQRUNTKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnRlcmFjdGlvbklkIC0gVGhlIGludGVyYWN0aW9uIGlkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ1NwZWNzIC0gVGhlIHZhcmlvdXNcbiAgICAgICAgICAgICAqICAgYXR0cmlidXRlcyB0aGF0IHRoZSBpbnRlcmFjdGlvbiBkZXBlbmRzIG9uLlxuICAgICAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBwYXJlbnRIYXNMYXN0QW5zd2VyUHJvcGVydHkgLSBJZiB0aGlzIGZ1bmN0aW9uIGlzXG4gICAgICAgICAgICAgKiAgIGNhbGxlZCBpbiB0aGUgZXhwbG9yYXRpb25fcGxheWVyIHZpZXcgKGluY2x1ZGluZyB0aGUgcHJldmlldyBtb2RlKSxcbiAgICAgICAgICAgICAqICAgY2FsbGVycyBzaG91bGQgZW5zdXJlIHRoYXQgcGFyZW50SGFzTGFzdEFuc3dlclByb3BlcnR5IGlzIHNldCB0b1xuICAgICAgICAgICAgICogICB0cnVlIGFuZCAkc2NvcGUubGFzdEFuc3dlciA9XG4gICAgICAgICAgICAgKiAgIFBsYXllclRyYW5zY3JpcHRTZXJ2aWNlLmdldExhc3RBbnN3ZXJPbkRpc3BsYXllZENhcmQoaW5kZXgpIGlzIHNldCBvblxuICAgICAgICAgICAgICogICB0aGUgcGFyZW50IGNvbnRyb2xsZXIgb2YgdGhlIHJldHVybmVkIHRhZy5cbiAgICAgICAgICAgICAqICAgT3RoZXJ3aXNlLCBwYXJlbnRIYXNMYXN0QW5zd2VyUHJvcGVydHkgc2hvdWxkIGJlIHNldCB0byBmYWxzZS5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbEZvckZvY3VzVGFyZ2V0IC0gVGhlIGxhYmVsIGZvciBzZXR0aW5nIGZvY3VzIG9uXG4gICAgICAgICAgICAgKiAgIHRoZSBpbnRlcmFjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0SW50ZXJhY3Rpb25IdG1sOiBmdW5jdGlvbiAoaW50ZXJhY3Rpb25JZCwgaW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJnU3BlY3MsIHBhcmVudEhhc0xhc3RBbnN3ZXJQcm9wZXJ0eSwgbGFiZWxGb3JGb2N1c1RhcmdldCkge1xuICAgICAgICAgICAgICAgIHZhciBodG1sSW50ZXJhY3Rpb25JZCA9ICRmaWx0ZXIoJ2NhbWVsQ2FzZVRvSHlwaGVucycpKGludGVyYWN0aW9uSWQpO1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gJCgnPG9wcGlhLWludGVyYWN0aXZlLScgKyBodG1sSW50ZXJhY3Rpb25JZCArICc+Jyk7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IChFeHRlbnNpb25UYWdBc3NlbWJsZXJTZXJ2aWNlLmZvcm1hdEN1c3RvbWl6YXRpb25BcmdBdHRycyhlbGVtZW50LCBpbnRlcmFjdGlvbkN1c3RvbWl6YXRpb25BcmdTcGVjcykpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXR0cignbGFzdC1hbnN3ZXInLCBwYXJlbnRIYXNMYXN0QW5zd2VyUHJvcGVydHkgP1xuICAgICAgICAgICAgICAgICAgICAnbGFzdEFuc3dlcicgOiAnbnVsbCcpO1xuICAgICAgICAgICAgICAgIGlmIChsYWJlbEZvckZvY3VzVGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXR0cignbGFiZWwtZm9yLWZvY3VzLXRhcmdldCcsIGxhYmVsRm9yRm9jdXNUYXJnZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5nZXQoMCkub3V0ZXJIVE1MO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFuc3dlckh0bWw6IGZ1bmN0aW9uIChhbnN3ZXIsIGludGVyYWN0aW9uSWQsIGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3MpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPKHNsbCk6IEdldCByaWQgb2YgdGhpcyBzcGVjaWFsIGNhc2UgZm9yIG11bHRpcGxlIGNob2ljZS5cbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJhY3Rpb25DaG9pY2VzID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJhY3Rpb25DdXN0b21pemF0aW9uQXJncy5jaG9pY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uQ2hvaWNlcyA9IGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3MuY2hvaWNlcy52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGVsID0gJCgnPG9wcGlhLXJlc3BvbnNlLScgKyAkZmlsdGVyKCdjYW1lbENhc2VUb0h5cGhlbnMnKShpbnRlcmFjdGlvbklkKSArICc+Jyk7XG4gICAgICAgICAgICAgICAgZWwuYXR0cignYW5zd2VyJywgSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24oYW5zd2VyKSk7XG4gICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uQ2hvaWNlcykge1xuICAgICAgICAgICAgICAgICAgICBlbC5hdHRyKCdjaG9pY2VzJywgSHRtbEVzY2FwZXJTZXJ2aWNlLm9ialRvRXNjYXBlZEpzb24oaW50ZXJhY3Rpb25DaG9pY2VzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAoJCgnPGRpdj4nKS5hcHBlbmQoZWwpKS5odG1sKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U2hvcnRBbnN3ZXJIdG1sOiBmdW5jdGlvbiAoYW5zd2VyLCBpbnRlcmFjdGlvbklkLCBpbnRlcmFjdGlvbkN1c3RvbWl6YXRpb25BcmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBHZXQgcmlkIG9mIHRoaXMgc3BlY2lhbCBjYXNlIGZvciBtdWx0aXBsZSBjaG9pY2UuXG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uQ2hvaWNlcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGludGVyYWN0aW9uQ3VzdG9taXphdGlvbkFyZ3MuY2hvaWNlcykge1xuICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbkNob2ljZXMgPSBpbnRlcmFjdGlvbkN1c3RvbWl6YXRpb25BcmdzLmNob2ljZXMudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBlbCA9ICQoJzxvcHBpYS1zaG9ydC1yZXNwb25zZS0nICsgJGZpbHRlcignY2FtZWxDYXNlVG9IeXBoZW5zJykoaW50ZXJhY3Rpb25JZCkgKyAnPicpO1xuICAgICAgICAgICAgICAgIGVsLmF0dHIoJ2Fuc3dlcicsIEh0bWxFc2NhcGVyU2VydmljZS5vYmpUb0VzY2FwZWRKc29uKGFuc3dlcikpO1xuICAgICAgICAgICAgICAgIGlmIChpbnRlcmFjdGlvbkNob2ljZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZWwuYXR0cignY2hvaWNlcycsIEh0bWxFc2NhcGVyU2VydmljZS5vYmpUb0VzY2FwZWRKc29uKGludGVyYWN0aW9uQ2hvaWNlcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gKCQoJzxzcGFuPicpLmFwcGVuZChlbCkpLmh0bWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xucmVxdWlyZSgnZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzL2NhbWVsLWNhc2UtdG8taHlwaGVucy5maWx0ZXIudHMnKTtcbi8vIFNlcnZpY2UgZm9yIGFzc2VtYmxpbmcgZXh0ZW5zaW9uIHRhZ3MgKGZvciBpbnRlcmFjdGlvbnMpLlxub3BwaWEuZmFjdG9yeSgnRXh0ZW5zaW9uVGFnQXNzZW1ibGVyU2VydmljZScsIFtcbiAgICAnJGZpbHRlcicsICdIdG1sRXNjYXBlclNlcnZpY2UnLCBmdW5jdGlvbiAoJGZpbHRlciwgSHRtbEVzY2FwZXJTZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmb3JtYXRDdXN0b21pemF0aW9uQXJnQXR0cnM6IGZ1bmN0aW9uIChlbGVtZW50LCBjdXN0b21pemF0aW9uQXJnU3BlY3MpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjYVNwZWNOYW1lIGluIGN1c3RvbWl6YXRpb25BcmdTcGVjcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FTcGVjVmFsdWUgPSBjdXN0b21pemF0aW9uQXJnU3BlY3NbY2FTcGVjTmFtZV0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYXR0cigkZmlsdGVyKCdjYW1lbENhc2VUb0h5cGhlbnMnKShjYVNwZWNOYW1lKSArICctd2l0aC12YWx1ZScsIEh0bWxFc2NhcGVyU2VydmljZS5vYmpUb0VzY2FwZWRKc29uKGNhU3BlY1ZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciB2YWxpZGF0aW5nIHRoaW5ncyBhbmQgKG9wdGlvbmFsbHkpIGRpc3BsYXlpbmdcbiAqIHdhcm5pbmcgbWVzc2FnZXMgaWYgdGhlIHZhbGlkYXRpb24gZmFpbHMuXG4gKi9cbnJlcXVpcmUoJ2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9ub3JtYWxpemUtd2hpdGVzcGFjZS5maWx0ZXIudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1ZhbGlkYXRvcnNTZXJ2aWNlJywgW1xuICAgICckZmlsdGVyJywgJ0FsZXJ0c1NlcnZpY2UnLCAnSU5WQUxJRF9OQU1FX0NIQVJTJyxcbiAgICBmdW5jdGlvbiAoJGZpbHRlciwgQWxlcnRzU2VydmljZSwgSU5WQUxJRF9OQU1FX0NIQVJTKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENoZWNrcyB3aGV0aGVyIGFuIGVudGl0eSBuYW1lIGlzIHZhbGlkLCBhbmQgZGlzcGxheXMgYSB3YXJuaW5nIG1lc3NhZ2VcbiAgICAgICAgICAgICAqIGlmIGl0IGlzbid0LlxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGlucHV0IC0gVGhlIGlucHV0IHRvIGJlIGNoZWNrZWQuXG4gICAgICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNob3dXYXJuaW5ncyAtIFdoZXRoZXIgdG8gc2hvdyB3YXJuaW5ncyBpbiB0aGVcbiAgICAgICAgICAgICAqICAgYnV0dGVyYmFyLlxuICAgICAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgZW50aXR5IG5hbWUgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaXNWYWxpZEVudGl0eU5hbWU6IGZ1bmN0aW9uIChpbnB1dCwgc2hvd1dhcm5pbmdzLCBhbGxvd0VtcHR5KSB7XG4gICAgICAgICAgICAgICAgaW5wdXQgPSAkZmlsdGVyKCdub3JtYWxpemVXaGl0ZXNwYWNlJykoaW5wdXQpO1xuICAgICAgICAgICAgICAgIGlmICghaW5wdXQgJiYgIWFsbG93RW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2UgZW50ZXIgYSBub24tZW1wdHkgbmFtZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgSU5WQUxJRF9OQU1FX0NIQVJTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dC5pbmRleE9mKElOVkFMSURfTkFNRV9DSEFSU1tpXSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdJbnZhbGlkIGlucHV0LiBQbGVhc2UgdXNlIGEgbm9uLWVtcHR5IGRlc2NyaXB0aW9uICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29uc2lzdGluZyBvZiBhbHBoYW51bWVyaWMgY2hhcmFjdGVycywgc3BhY2VzIGFuZC9vciBoeXBoZW5zLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzVmFsaWRFeHBsb3JhdGlvblRpdGxlOiBmdW5jdGlvbiAoaW5wdXQsIHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1ZhbGlkRW50aXR5TmFtZShpbnB1dCwgc2hvd1dhcm5pbmdzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5sZW5ndGggPiA0MCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcoJ0V4cGxvcmF0aW9uIHRpdGxlcyBzaG91bGQgYmUgYXQgbW9zdCA0MCBjaGFyYWN0ZXJzIGxvbmcuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBOQjogdGhpcyBkb2VzIG5vdCBjaGVjayB3aGV0aGVyIHRoZSBjYXJkIG5hbWUgYWxyZWFkeSBleGlzdHMgaW4gdGhlXG4gICAgICAgICAgICAvLyBzdGF0ZXMgZGljdC5cbiAgICAgICAgICAgIGlzVmFsaWRTdGF0ZU5hbWU6IGZ1bmN0aW9uIChpbnB1dCwgc2hvd1dhcm5pbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRFbnRpdHlOYW1lKGlucHV0LCBzaG93V2FybmluZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA+IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG93V2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnQ2FyZCBuYW1lcyBzaG91bGQgYmUgYXQgbW9zdCA1MCBjaGFyYWN0ZXJzIGxvbmcuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc05vbmVtcHR5OiBmdW5jdGlvbiAoaW5wdXQsIHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3dXYXJuaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBBbGxvdyB0aGlzIHdhcm5pbmcgdG8gYmUgbW9yZSBzcGVjaWZpYyBpbiB0ZXJtcyBvZlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2hhdCBuZWVkcyB0byBiZSBlbnRlcmVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nKCdQbGVhc2UgZW50ZXIgYSBub24tZW1wdHkgdmFsdWUuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1ZhbGlkRXhwbG9yYXRpb25JZDogZnVuY3Rpb24gKGlucHV0LCBzaG93V2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHBsb3JhdGlvbiBJRHMgYXJlIHVybHNhZmUgYmFzZTY0LWVuY29kZWQuXG4gICAgICAgICAgICAgICAgdmFyIFZBTElEX0lEX0NIQVJTX1JFR0VYID0gL15bYS16QS1aMC05X1xcLV0rJC9nO1xuICAgICAgICAgICAgICAgIGlmICghaW5wdXQgfHwgIVZBTElEX0lEX0NIQVJTX1JFR0VYLnRlc3QoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG93V2FybmluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnUGxlYXNlIGVudGVyIGEgdmFsaWQgZXhwbG9yYXRpb24gSUQuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=