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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Unit tests for the AnswerClassificationResultObjectFactory.
 */
var AnswerClassificationResultObjectFactory_ts_1 = require("domain/classifier/AnswerClassificationResultObjectFactory.ts");
require('domain/exploration/OutcomeObjectFactory.ts');
require('pages/exploration-player-page/services/answer-classification.service.ts');
var MockSubtitledHtml = /** @class */ (function () {
    function MockSubtitledHtml(html, contentId) {
        this._html = html;
        this._contentId = contentId;
    }
    return MockSubtitledHtml;
}());
var MockOutcome = /** @class */ (function () {
    function MockOutcome(dest, feedback, labelledAsCorrect, paramChanges, refresherExplorationId, missingPrerequisiteSkillId) {
        this.dest = dest;
        this.feedback = feedback;
        this.labelledAsCorrect = labelledAsCorrect;
        this.paramChanges = paramChanges;
        this.refresherExplorationId = refresherExplorationId;
        this.missingPrerequisiteSkillId = missingPrerequisiteSkillId;
    }
    return MockOutcome;
}());
var MockOutcomeObjectFactory = /** @class */ (function () {
    function MockOutcomeObjectFactory() {
    }
    MockOutcomeObjectFactory.prototype.createNew = function (dest, feedbackTextId, feedbackText, paramChanges) {
        return new MockOutcome(dest, new MockSubtitledHtml(feedbackText, feedbackTextId), false, paramChanges, null, null);
    };
    return MockOutcomeObjectFactory;
}());
describe('Answer classification result object factory', function () {
    var acrof;
    var oof;
    var DEFAULT_OUTCOME_CLASSIFICATION;
    beforeEach(function () {
        acrof = new AnswerClassificationResultObjectFactory_ts_1.AnswerClassificationResultObjectFactory();
        oof = new MockOutcomeObjectFactory();
        DEFAULT_OUTCOME_CLASSIFICATION = 'default_outcome';
    });
    it('should create a new result', function () {
        var answerClassificationResult = acrof.createNew(oof.createNew('default', '', '', []), 1, 0, DEFAULT_OUTCOME_CLASSIFICATION);
        expect(answerClassificationResult.outcome).toEqual(oof.createNew('default', '', '', []));
        expect(answerClassificationResult.answerGroupIndex).toEqual(1);
        expect(answerClassificationResult.ruleIndex).toEqual(0);
        expect(answerClassificationResult.classificationCategorization).toEqual(DEFAULT_OUTCOME_CLASSIFICATION);
    });
});
