"use strict";
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
exports.__esModule = true;
/**
 * @fileoverview Factory for creating new frontend instances of Exploration
 * domain objects.
 */
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
var app_constants_1 = require("app.constants");
var cloneDeep_1 = require("lodash/cloneDeep");
var INTERACTION_SPECS = require('interactions/interaction_specs.json');
var Exploration = /** @class */ (function () {
    function Exploration(loggerService, urlInterpolationService, initStateName, paramChanges, paramSpecs, states, title, languageCode) {
        this.loggerService = loggerService;
        this.urlInterpolationService = urlInterpolationService;
        this.initStateName = initStateName;
        this.paramChanges = paramChanges;
        this.paramSpecs = paramSpecs;
        this.states = states;
        this.title = title;
        this.languageCode = languageCode;
    }
    // Instance methods
    Exploration.prototype.isStateTerminal = function (stateName) {
        return (stateName && this.getInteractionId(stateName) &&
            INTERACTION_SPECS[this.getInteractionId(stateName)].is_terminal);
    };
    // TODO(#7165): Replace any with exact type
    Exploration.prototype.getAuthorRecommendedExpIds = function (stateName) {
        if (!this.isStateTerminal(stateName)) {
            throw new Error('Tried to get recommendations for a non-terminal state: ' +
                stateName);
        }
        var customizationArgs = this.getInteractionCustomizationArgs(stateName);
        return customizationArgs && customizationArgs.recommendedExplorationIds ?
            customizationArgs.recommendedExplorationIds.value : null;
    };
    Exploration.prototype.getInteraction = function (stateName) {
        var state = this.states.getState(stateName);
        if (!state) {
            this.loggerService.error('Invalid state name: ' + stateName);
            return null;
        }
        return state.interaction;
    };
    Exploration.prototype.getInteractionId = function (stateName) {
        var interaction = this.getInteraction(stateName);
        if (interaction === null) {
            return null;
        }
        return interaction.id;
    };
    Exploration.prototype.getInteractionCustomizationArgs = function (stateName) {
        var interaction = this.getInteraction(stateName);
        if (interaction === null) {
            return null;
        }
        return interaction.customizationArgs;
    };
    Exploration.prototype.getInteractionInstructions = function (stateName) {
        var interactionId = this.getInteractionId(stateName);
        return interactionId ? INTERACTION_SPECS[interactionId].instructions : '';
    };
    Exploration.prototype.getNarrowInstructions = function (stateName) {
        var interactionId = this.getInteractionId(stateName);
        return (interactionId ?
            INTERACTION_SPECS[interactionId].narrow_instructions : '');
    };
    Exploration.prototype.getInteractionThumbnailSrc = function (stateName) {
        // TODO(sll): unify this with the 'choose interaction' modal in
        // state_editor_interaction.html.
        var interactionId = this.getInteractionId(stateName);
        return interactionId ? (this.urlInterpolationService
            .getInteractionThumbnailImageUrl(interactionId)) : '';
    };
    Exploration.prototype.isInteractionInline = function (stateName) {
        var interactionId = this.getInteractionId(stateName);
        // Note that we treat a null interaction as an inline one, so that the
        // error message associated with it is displayed in the most compact way
        // possible in the learner view.
        return (!interactionId ||
            INTERACTION_SPECS[interactionId].display_mode ===
                app_constants_1.AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
    };
    Exploration.prototype.getStates = function () {
        return cloneDeep_1["default"](this.states);
    };
    Exploration.prototype.getState = function (stateName) {
        return this.states.getState(stateName);
    };
    Exploration.prototype.getInitialState = function () {
        return this.getState(this.initStateName);
    };
    Exploration.prototype.setInitialStateName = function (stateName) {
        this.initStateName = stateName;
    };
    Exploration.prototype.getUninterpolatedContentHtml = function (stateName) {
        return this.getState(stateName).content.getHtml();
    };
    Exploration.prototype.getVoiceovers = function (stateName) {
        var state = this.getState(stateName);
        if (!state) {
            this.loggerService.error('Invalid state name: ' + stateName);
            return null;
        }
        var recordedVoiceovers = state.recordedVoiceovers;
        var contentId = state.content.getContentId();
        return recordedVoiceovers.getBindableVoiceovers(contentId);
    };
    Exploration.prototype.getVoiceover = function (stateName, languageCode) {
        var state = this.getState(stateName);
        if (!state) {
            this.loggerService.error('Invalid state name: ' + stateName);
            return null;
        }
        var recordedVoiceovers = state.recordedVoiceovers;
        var contentId = state.content.getContentId();
        var voiceovers = recordedVoiceovers.getVoiceover(contentId, languageCode);
        return voiceovers || null;
    };
    Exploration.prototype.getAllVoiceovers = function (languageCode) {
        return this.states.getAllVoiceovers(languageCode);
    };
    Exploration.prototype.getLanguageCode = function () {
        return this.languageCode;
    };
    Exploration.prototype.getAllVoiceoverLanguageCodes = function () {
        return this.states.getAllVoiceoverLanguageCodes();
    };
    return Exploration;
}());
exports.Exploration = Exploration;
var ExplorationObjectFactory = /** @class */ (function () {
    function ExplorationObjectFactory(loggerService, paramChangesObjectFactory, paramSpecsObjectFactory, statesObjectFactory, urlInterpolationService) {
        this.loggerService = loggerService;
        this.paramChangesObjectFactory = paramChangesObjectFactory;
        this.paramSpecsObjectFactory = paramSpecsObjectFactory;
        this.statesObjectFactory = statesObjectFactory;
        this.urlInterpolationService = urlInterpolationService;
    }
    ExplorationObjectFactory.prototype.createFromBackendDict = function (explorationBackendDict) {
        return new Exploration(this.loggerService, this.urlInterpolationService, explorationBackendDict.init_state_name, this.paramChangesObjectFactory.createFromBackendList(explorationBackendDict.param_changes), this.paramSpecsObjectFactory.createFromBackendDict(explorationBackendDict.param_specs), this.statesObjectFactory.createFromBackendDict(explorationBackendDict.states), explorationBackendDict.title, explorationBackendDict.language_code);
    };
    ExplorationObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], ExplorationObjectFactory);
    return ExplorationObjectFactory;
}());
exports.ExplorationObjectFactory = ExplorationObjectFactory;
angular.module('oppia').factory('ExplorationObjectFactory', static_1.downgradeInjectable(ExplorationObjectFactory));
