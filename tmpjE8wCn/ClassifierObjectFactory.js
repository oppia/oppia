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
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
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
var oppia = require('AppInit.ts').module;
oppia.factory('ClassifierObjectFactory', static_1.downgradeInjectable(ClassifierObjectFactory));
