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
 * @fileoverview Service for consolidating and accessing the types of
 * improvement tasks that can be rendered in the Improvements Tab.
 *
 * All Improvement Tasks should provide the following functions:
 *   - Task.fetchTasks() -> Promise<Task[]>
 *       A "static" function that can be called on the factory itself. It should
 *       return a Promise of an array of tasks associated to the current
 *       exploration.
 *   - Task.prototype.isOpen() -> boolean
 *       A "member" function which returns whether the improvement which the
 *       task suggests is open, i.e., still relevant and actionable.
 *   - Task.prototype.getTitle() -> string
 *   - Task.prototype.getDirectiveType() -> string
 *   - Task.prototype.getDirectiveData() -> *
 *   - Task.prototype.getActionButtons() -> ImprovementActionButton[]
 */

require('domain/statistics/AnswerDetailsImprovementTaskObjectFactory.ts');
require('domain/statistics/FeedbackImprovementTaskObjectFactory.ts');
require('domain/statistics/PlaythroughImprovementTaskObjectFactory.ts');
require('domain/statistics/SuggestionImprovementTaskObjectFactory.ts');

angular.module('oppia').factory('ImprovementTaskService', [
  '$q', 'AnswerDetailsImprovementTaskObjectFactory',
  'FeedbackImprovementTaskObjectFactory',
  'PlaythroughImprovementTaskObjectFactory',
  'SuggestionImprovementTaskObjectFactory',
  function(
      $q, AnswerDetailsImprovementTaskObjectFactory,
      FeedbackImprovementTaskObjectFactory,
      PlaythroughImprovementTaskObjectFactory,
      SuggestionImprovementTaskObjectFactory) {
    /** @type {Object[]} */
    var improvementTaskObjectFactoryRegistry = Object.freeze([
      AnswerDetailsImprovementTaskObjectFactory,
      FeedbackImprovementTaskObjectFactory,
      PlaythroughImprovementTaskObjectFactory,
      SuggestionImprovementTaskObjectFactory,
    ]);

    return {
      /** @returns {Object[]} */
      getImprovementTaskObjectFactoryRegistry: function() {
        return improvementTaskObjectFactoryRegistry;
      },

      /**
       * @returns {Promise<Object[]>} - An array of improvement tasks related to
       * the current exploration.
       *
       * IMPORTANT: DO NOT DEPEND ON THE ORDER OF TASKS RETURNED!!
       * When ordering matters, then *explicitly* sort the returned array.
       * Following this contract will make it easier to optimize the service in
       * the future.
       */
      fetchTasks: function() {
        return $q.all(
          improvementTaskObjectFactoryRegistry.map(function(taskFactory) {
            return taskFactory.fetchTasks();
          })
        ).then(function(tasksFromFactories) {
          // Flatten the tasks into a single array before returning.
          return [].concat.apply([], tasksFromFactories);
        });
      },
    };
  }
]);
