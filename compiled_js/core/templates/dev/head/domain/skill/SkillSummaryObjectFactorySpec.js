"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Tests for SkillSummaryObjectFactory.
 */
var angular = require("angular");
require("angular-mocks");
describe('Skill summary object factory', function () {
    var SkillSummaryObjectFactory = null;
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.inject(function ($injector) {
        SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
    }));
    it('should be able to create a skill summary object', function () {
        var skillSummary = SkillSummaryObjectFactory.create('skill_1', 'Description 1');
        expect(skillSummary.getId()).toBe('skill_1');
        expect(skillSummary.getDescription()).toBe('Description 1');
    });
});
