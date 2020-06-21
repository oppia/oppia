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
var _this = this;
exports.__esModule = true;
/**
 * @fileoverview Unit tests for the IneffectiveFeedbackLoopTask domain object.
 */
var testing_1 = require("@angular/core/testing");
var ExplorationTaskObjectFactory_1 = require("domain/improvements/ExplorationTaskObjectFactory");
var HighBounceRateTaskObjectFactory_1 = require("domain/improvements/HighBounceRateTaskObjectFactory");
var IneffectiveFeedbackLoopTaskObjectFactory_1 = require("domain/improvements/IneffectiveFeedbackLoopTaskObjectFactory");
var NeedsGuidingResponsesTaskObjectFactory_1 = require("domain/improvements/NeedsGuidingResponsesTaskObjectFactory");
var SuccessiveIncorrectAnswersTaskObjectFactory_1 = require("domain/improvements/SuccessiveIncorrectAnswersTaskObjectFactory");
describe('Exploration task object factory', function () {
    var expTaskObjectFactory;
    beforeEach(function () {
        expTaskObjectFactory = testing_1.TestBed.get(ExplorationTaskObjectFactory_1.ExplorationTaskObjectFactory);
    });
    beforeEach(function () {
        _this.newTaskEntryBackendDict = (function (taskType) { return ({
            entity_type: 'exploration',
            entity_id: 'eid',
            entity_version: 1,
            task_type: taskType,
            target_type: 'state',
            target_id: 'Introduction',
            issue_description: '20% of learners dropped at this state',
            status: 'resolved',
            resolver_username: 'test_user',
            resolver_profile_picture_data_url: './image.png',
            resolved_on_msecs: 123456789
        }); });
    });
    it('should return a high bounce rate task', function () {
        expect(expTaskObjectFactory.createFromBackendDict(_this.newTaskEntryBackendDict('high_bounce_rate'))).toBeInstanceOf(HighBounceRateTaskObjectFactory_1.HighBounceRateTask);
    });
    it('should return a ineffective feedback loop task', function () {
        expect(expTaskObjectFactory.createFromBackendDict(_this.newTaskEntryBackendDict('ineffective_feedback_loop'))).toBeInstanceOf(IneffectiveFeedbackLoopTaskObjectFactory_1.IneffectiveFeedbackLoopTask);
    });
    it('should return a needs guiding responses task', function () {
        expect(expTaskObjectFactory.createFromBackendDict(_this.newTaskEntryBackendDict('needs_guiding_responses'))).toBeInstanceOf(NeedsGuidingResponsesTaskObjectFactory_1.NeedsGuidingResponsesTask);
    });
    it('should return a successive incorrect answers task', function () {
        expect(expTaskObjectFactory.createFromBackendDict(_this.newTaskEntryBackendDict('successive_incorrect_answers'))).toBeInstanceOf(SuccessiveIncorrectAnswersTaskObjectFactory_1.SuccessiveIncorrectAnswersTask);
    });
    it('should throw an error if task type is unknown', function () {
        expect(function () { return expTaskObjectFactory.createFromBackendDict(_this.newTaskEntryBackendDict('unknown_task_type')); }).toThrowError(/Backend dict does not match any known task type/);
    });
});
