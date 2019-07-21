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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating new frontend instances of Prediction
 *     result domain objects.
 */
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
var PredictionResult = /** @class */ (function () {
    function PredictionResult(label, confidence) {
        this.predictionLabel = label;
        this.predictionConfidence = confidence;
    }
    return PredictionResult;
}());
exports.PredictionResult = PredictionResult;
var PredictionResultObjectFactory = /** @class */ (function (_super) {
    __extends(PredictionResultObjectFactory, _super);
    function PredictionResultObjectFactory() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PredictionResultObjectFactory.prototype.createNew = function (label, confidence) {
        return new PredictionResult(label, confidence);
    };
    PredictionResultObjectFactory.prototype.getLabel = function () {
        return this.predictionLabel;
    };
    PredictionResultObjectFactory.prototype.getConfidence = function () {
        return this.predictionConfidence;
    };
    PredictionResultObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], PredictionResultObjectFactory);
    return PredictionResultObjectFactory;
}(PredictionResult));
exports.PredictionResultObjectFactory = PredictionResultObjectFactory;
var oppia = require('AppInit.ts').module;
oppia.factory('PredictionResultObjectFactory', static_1.downgradeInjectable(PredictionResultObjectFactory));
