"use strict";
// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
exports.__esModule = true;
/**
 * @fileoverview Domain object for a ineffective feedback loop improvements
 *    task.
 */
var static_1 = require("@angular/upgrade/static");
var core_1 = require("@angular/core");
var TaskEntryObjectFactory_1 = require("domain/improvements/TaskEntryObjectFactory");
var improvements_constants_1 = require("domain/improvements/improvements.constants");
var IneffectiveFeedbackLoopTask = /** @class */ (function (_super) {
    __extends(IneffectiveFeedbackLoopTask, _super);
    function IneffectiveFeedbackLoopTask(backendDict) {
        var _this = this;
        if (backendDict.entity_type !==
            improvements_constants_1.ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION) {
            throw new Error("backend dict has entity_type \"" + backendDict.entity_type + "\" " +
                ("but expected \"" + improvements_constants_1.ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION + "\""));
        }
        if (backendDict.task_type !==
            improvements_constants_1.ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP) {
            throw new Error("backend dict has task_type \"" + backendDict.task_type + "\" but expected " +
                ("\"" + improvements_constants_1.ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP + "\""));
        }
        if (backendDict.target_type !==
            improvements_constants_1.ImprovementsConstants.TASK_TARGET_TYPE_STATE) {
            throw new Error("backend dict has target_type \"" + backendDict.target_type + "\" " +
                ("but expected \"" + improvements_constants_1.ImprovementsConstants.TASK_TARGET_TYPE_STATE + "\""));
        }
        _this = _super.call(this, backendDict) || this;
        return _this;
    }
    IneffectiveFeedbackLoopTask.prototype.resolve = function () {
        this.markAsResolved();
    };
    IneffectiveFeedbackLoopTask.prototype.refreshStatus = function (numCyclicStateTransitionsPlaythroughs) {
        if (this.isObsolete() && numCyclicStateTransitionsPlaythroughs > 0) {
            this.generateIssueDescription(numCyclicStateTransitionsPlaythroughs);
            this.markAsOpen();
        }
    };
    IneffectiveFeedbackLoopTask.prototype.generateIssueDescription = function (numCyclicStateTransitionsPlaythroughs) {
        this.issueDescription = ("At least " + numCyclicStateTransitionsPlaythroughs + " learners had quit " +
            'after revisiting this card several times.');
    };
    return IneffectiveFeedbackLoopTask;
}(TaskEntryObjectFactory_1.TaskEntry));
exports.IneffectiveFeedbackLoopTask = IneffectiveFeedbackLoopTask;
var IneffectiveFeedbackLoopTaskObjectFactory = /** @class */ (function () {
    function IneffectiveFeedbackLoopTaskObjectFactory() {
    }
    IneffectiveFeedbackLoopTaskObjectFactory.prototype.createNewObsoleteTask = function (expId, expVersion, stateName) {
        return new IneffectiveFeedbackLoopTask({
            entity_type: improvements_constants_1.ImprovementsConstants.TASK_ENTITY_TYPE_EXPLORATION,
            entity_id: expId,
            entity_version: expVersion,
            task_type: improvements_constants_1.ImprovementsConstants.TASK_TYPE_INEFFECTIVE_FEEDBACK_LOOP,
            target_type: improvements_constants_1.ImprovementsConstants.TASK_TARGET_TYPE_STATE,
            target_id: stateName,
            issue_description: null,
            status: improvements_constants_1.ImprovementsConstants.TASK_STATUS_OBSOLETE,
            resolver_username: null,
            resolver_profile_picture_data_url: null,
            resolved_on_msecs: null
        });
    };
    IneffectiveFeedbackLoopTaskObjectFactory.prototype.createNew = function (expId, expVersion, stateName, numCyclicStateTransitionsPlaythroughs) {
        var task = this.createNewObsoleteTask(expId, expVersion, stateName);
        task.refreshStatus(numCyclicStateTransitionsPlaythroughs);
        return task;
    };
    IneffectiveFeedbackLoopTaskObjectFactory.prototype.createFromBackendDict = function (backendDict) {
        return new IneffectiveFeedbackLoopTask(backendDict);
    };
    IneffectiveFeedbackLoopTaskObjectFactory = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], IneffectiveFeedbackLoopTaskObjectFactory);
    return IneffectiveFeedbackLoopTaskObjectFactory;
}());
exports.IneffectiveFeedbackLoopTaskObjectFactory = IneffectiveFeedbackLoopTaskObjectFactory;
angular.module('oppia').factory('IneffectiveFeedbackLoopTaskObjectFactory', static_1.downgradeInjectable(IneffectiveFeedbackLoopTaskObjectFactory));
