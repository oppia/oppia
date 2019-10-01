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
 * @fileoverview Factory for creating Answer details Tasks in the Improvements
 * Tab.
 */

require('domain/statistics/ImprovementActionButtonObjectFactory.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');
require('pages/exploration-editor-page/services/' +
  'learner-answer-details-data.service.ts');

require('domain/statistics/statistics-domain.constants.ajs.ts');

angular.module('oppia').factory('AnswerDetailsImprovementTaskObjectFactory', [
  'ImprovementActionButtonObjectFactory', 'ImprovementModalService',
  'LearnerAnswerDetailsDataService', 'ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE',
  'STATUS_NOT_ACTIONABLE', 'STATUS_OPEN',
  function(
      ImprovementActionButtonObjectFactory, ImprovementModalService,
      LearnerAnswerDetailsDataService, ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE,
      STATUS_NOT_ACTIONABLE, STATUS_OPEN) {
    var AnswerDetailsImprovementTask = function(learnerAnswerDetails) {
      this._learnerAnswerDetails = learnerAnswerDetails;
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Answer Details', 'btn-primary',
          () => ImprovementModalService.openLearnerAnswerDetails(
            learnerAnswerDetails)),
      ];
    };


    AnswerDetailsImprovementTask.prototype.getStatus = function() {
      return this._learnerAnswerDetails.learnerAnswerInfoData.length !== 0 ?
          STATUS_OPEN : STATUS_NOT_ACTIONABLE;
    };

    AnswerDetailsImprovementTask.prototype.getDirectiveData = function() {
      return this._learnerAnswerDetails;
    };

    AnswerDetailsImprovementTask.prototype.getDirectiveType = function() {
      return ANSWER_DETAILS_IMPROVEMENT_TASK_TYPE;
    };

    AnswerDetailsImprovementTask.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    AnswerDetailsImprovementTask.prototype.getTitle = function() {
      return 'Answer details for the card "' +
        this._learnerAnswerDetails.stateName + '"';
    };

    AnswerDetailsImprovementTask.prototype.isObsolete = function() {
      return this._learnerAnswerDetails.learnerAnswerInfoData.length === 0;
    };

    return {
      createNew: function(learnerAnswerDetails) {
        return new AnswerDetailsImprovementTask(learnerAnswerDetails);
      },
      fetchTasks: function() {
        var createNew = this.createNew;
        return (
          LearnerAnswerDetailsDataService.fetchLearnerAnswerInfoData().then(
            function() {
              return LearnerAnswerDetailsDataService.getData().map(createNew);
            }));
      },
    };
  }
]);
