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
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
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
    ExplorationDraftObjectFactory.prototype.toLocalStorageDict = function (changeList, draftChangeListId) {
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
var oppia = require('AppInit.ts').module;
oppia.factory('ExplorationDraftObjectFactory', static_1.downgradeInjectable(ExplorationDraftObjectFactory));
