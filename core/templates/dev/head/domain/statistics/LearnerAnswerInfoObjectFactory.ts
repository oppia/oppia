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

/**
 * @fileoverview Factory for creating instances of frontend learner answer info
 * domain objects.
 */

angular.module('oppia').factory('LearnerAnswerInfoObjectFactory', [
  function() {
    var LearnerAnswerInfo = function(learnerAnswerInfoId, answer,
        answerDetails, createdOn) {
      this._id = learnerAnswerInfoId;
      this._answer = answer;
      this._answerDetails = answerDetails;
      this._createdOn = createdOn;
    };

    LearnerAnswerInfo.prototype.getId = function() {
      return this._id;
    };

    LearnerAnswerInfo.prototype.getAnswer = function() {
      return this._answer;
    };

    LearnerAnswerInfo.prototype.getAnswerDetails = function() {
      return this._answerDetails;
    };

    LearnerAnswerInfo.prototype.getCreatedOn = function() {
      return this._createdOn;
    };

    /* eslint-disable dot-notation */
    LearnerAnswerInfo['createDefaultLearnerAnswerInfo'] = function(answer,
        answerDetails) {
    /* eslint-enable dot-notation */
      return new LearnerAnswerInfo(null, answer, answerDetails,
        null);
    };

    /* eslint-disable dot-notation */
    LearnerAnswerInfo['createFromBackendDict'] = function(
        learnerAnswerInfoDict) {
    /* eslint-enable dot-notation */
      return new LearnerAnswerInfo(
        learnerAnswerInfoDict.id,
        learnerAnswerInfoDict.answer,
        learnerAnswerInfoDict.answer_details,
        learnerAnswerInfoDict.created_on
      );
    };

    return LearnerAnswerInfo;
  }
]);
