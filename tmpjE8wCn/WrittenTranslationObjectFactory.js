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
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
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
var oppia = require('AppInit.ts').module;
oppia.factory('WrittenTranslationObjectFactory', static_1.downgradeInjectable(WrittenTranslationObjectFactory));
