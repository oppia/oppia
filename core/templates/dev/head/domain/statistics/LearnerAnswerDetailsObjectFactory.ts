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

angular.module('oppia').factory('LearnerAnswerDetailsObjectFactory', [
  function() {
    var LearnerAnswerDetails = function(
        expId, stateName, interactionId, customizationArgs,
        learnerAnswerInfoData) {
      this.expId = expId;
      this.stateName = stateName;
      this.interactionId = interactionId;
      this.customizationArgs = customizationArgs;
      this.learnerAnswerInfoData = learnerAnswerInfoData;
    };

    LearnerAnswerDetails.prototype.getExpId = function() {
      return this.expId;
    };

    LearnerAnswerDetails.prototype.getStateName = function() {
      return this.stateName;
    };

    LearnerAnswerDetails.prototype.getLearnerAnswerInfoData = function() {
      return this.learnerAnswerInfoData;
    };

    /* eslint-disable dot-notation */
    LearnerAnswerDetails['createDefaultLearnerAnswerDetails'] = function(expId,
        stateName, interactionId, customizationArgs, learnerAnswerInfoData) {
    /* eslint-enable dot-notation */
      return new LearnerAnswerDetails(expId, stateName, interactionId,
        customizationArgs, learnerAnswerInfoData);
    };

    return LearnerAnswerDetails;
  }
]);
