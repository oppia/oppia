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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Factory for creating and mutating instances of frontend
 * topic rights domain objects.
 */
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
var TopicRights = /** @class */ (function () {
    function TopicRights(published, canPublishTopic, canEditTopic) {
        this._published = published;
        this._canPublishTopic = canPublishTopic;
        this._canEditTopic = canEditTopic;
    }
    TopicRights.prototype.canEditTopic = function () {
        return this._canEditTopic;
    };
    TopicRights.prototype.isPublished = function () {
        return this._published;
    };
    TopicRights.prototype.canPublishTopic = function () {
        return this._canPublishTopic;
    };
    TopicRights.prototype.canEditName = function () {
        return this._canPublishTopic;
    };
    TopicRights.prototype.markTopicAsPublished = function () {
        if (this._canPublishTopic) {
            this._published = true;
        }
        else {
            throw new Error('User is not allowed to publish this topic.');
        }
    };
    TopicRights.prototype.markTopicAsUnpublished = function () {
        if (this._canPublishTopic) {
            this._published = false;
        }
        else {
            throw new Error('User is not allowed to unpublish this topic.');
        }
    };
    // Reassigns all values within this topic to match the existing
    // topic rights. This is performed as a deep copy such that none of the
    // internal, bindable objects are changed within this topic rights.
    TopicRights.prototype.copyFromTopicRights = function (otherTopicRights) {
        this._published = otherTopicRights.isPublished();
        this._canEditTopic = otherTopicRights.canEditTopic();
        this._canPublishTopic = otherTopicRights.canPublishTopic();
    };
    return TopicRights;
}());
exports.TopicRights = TopicRights;
var TopicRightsObjectFactory = /** @class */ (function () {
    function TopicRightsObjectFactory() {
    }
    // This function takes a JSON object which represents a backend
    // topic python dict.
    TopicRightsObjectFactory.prototype.createFromBackendDict = function (topicRightsBackendObject) {
        return new TopicRights(topicRightsBackendObject.published, topicRightsBackendObject.can_publish_topic, topicRightsBackendObject.can_edit_topic);
    };
    // This creates an interstitial topic rights object which acts as a
    // placeholder until the actual topic rights object is fetched from
    // the backend. Since it is acting as a placeholder, it should be valid and
    // hence the most restrictive rights are given to the object.
    TopicRightsObjectFactory.prototype.createInterstitialRights = function () {
        return new TopicRights(false, false, false);
    };
    TopicRightsObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], TopicRightsObjectFactory);
    return TopicRightsObjectFactory;
}());
exports.TopicRightsObjectFactory = TopicRightsObjectFactory;
var oppia = require('AppInit.ts').module;
oppia.factory('TopicRightsObjectFactory', static_1.downgradeInjectable(TopicRightsObjectFactory));
