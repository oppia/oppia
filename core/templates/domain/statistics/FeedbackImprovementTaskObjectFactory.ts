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
 * @fileoverview Factory for creating Feedback Tasks in the Improvements Tab.
 */

require('domain/statistics/ImprovementActionButtonObjectFactory.ts');
require('domain/statistics/statistics-domain.constants.ajs.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');

angular.module('oppia').factory('FeedbackImprovementTaskObjectFactory', [
  'ImprovementActionButtonObjectFactory', 'ImprovementModalService',
  'ThreadDataService', 'FEEDBACK_IMPROVEMENT_TASK_TYPE',
  function(
      ImprovementActionButtonObjectFactory, ImprovementModalService,
      ThreadDataService, FEEDBACK_IMPROVEMENT_TASK_TYPE) {
    var FeedbackImprovementTask = function(feedbackThread) {
      this._thread = feedbackThread;
      this._actionButtons = [
        ImprovementActionButtonObjectFactory.createNew(
          'Review Thread', 'btn-primary',
          () => ImprovementModalService.openFeedbackThread(this._thread)),
      ];
    };

    /** @returns {string} - The actionable status of this task. */
    FeedbackImprovementTask.prototype.getStatus = function() {
      return this._thread.status;
    };

    /** @returns {string} - A simple summary of the feedback thread. */
    FeedbackImprovementTask.prototype.getTitle = function() {
      return this._thread.subject;
    };

    /**
     * @returns {boolean} - Whether this task is no longer useful, and hence
     *    should be hidden away.
     */
    FeedbackImprovementTask.prototype.isObsolete = function() {
      return false; // Feedback threads are always actionable.
    };

    /**
     * @returns {string} - The directive task type used to render details about
     *    this task's data.
     */
    FeedbackImprovementTask.prototype.getDirectiveType = function() {
      return FEEDBACK_IMPROVEMENT_TASK_TYPE;
    };

    /**
     * @returns {string} - Data required by the associated directive for
     *    rendering.
     */
    FeedbackImprovementTask.prototype.getDirectiveData = function() {
      return this._thread;
    };

    /**
     * @returns {ImprovementActionButton[]} - The array of action buttons
     *    displayed on the task.
     */
    FeedbackImprovementTask.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    /** @returns {number} - The time that the task was last updated. */
    FeedbackImprovementTask.prototype.getLastUpdatedTime = function() {
      return this._thread.lastUpdatedMsecs;
    };

    return {
      /**
       * @returns {FeedbackImprovementTask}
       * @param {FeedbackThread} thread - The thread this task is referring to.
       */
      createNew: function(thread) {
        return new FeedbackImprovementTask(thread);
      },

      /**
       * @returns {Promise<FeedbackImprovementTask[]>} - The array of feedback
       *    threads associated to the current exploration.
       */
      fetchTasks: function() {
        var createNew = this.createNew;
        return ThreadDataService.getThreadsAsync()
          .then(threadData => threadData.feedbackThreads.map(createNew));
      },
    };
  }
]);
