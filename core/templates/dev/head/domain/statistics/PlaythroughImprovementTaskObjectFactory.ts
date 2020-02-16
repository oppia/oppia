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
 * @fileoverview Factory for creating Playthrough Tasks in the Improvements Tab.
 */

require('domain/statistics/ImprovementActionButtonObjectFactory.ts');
require('domain/statistics/statistics-domain.constants.ajs.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/exploration-editor-page.constants.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvement-modal.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('services/exploration-features.service.ts');
require('services/playthrough-issues.service.ts');

angular.module('oppia').factory('PlaythroughImprovementTaskObjectFactory', [
  '$q', 'ExplorationFeaturesService', 'ImprovementActionButtonObjectFactory',
  'ImprovementModalService', 'PlaythroughIssuesService',
  'UserExplorationPermissionsService', 'PLAYTHROUGH_IMPROVEMENT_TASK_TYPE',
  'STATUS_NOT_ACTIONABLE', 'STATUS_OPEN',
  function(
      $q, ExplorationFeaturesService, ImprovementActionButtonObjectFactory,
      ImprovementModalService, PlaythroughIssuesService,
      UserExplorationPermissionsService, PLAYTHROUGH_IMPROVEMENT_TASK_TYPE,
      STATUS_NOT_ACTIONABLE, STATUS_OPEN) {
    /**
     * @constructor
     * @param {PlaythroughIssue} issue - The issue this task is referring to.
     */
    var PlaythroughImprovementTask = function(issue) {
      /** @type {string} */
      this._title = PlaythroughIssuesService.renderIssueStatement(issue);
      /** @type {ImprovementActionButton[]} */
      this._actionButtons = [];
      /** @type {boolean} */
      this._isObsolete = false;
      /** @type {Object} */
      this._directiveData = {
        title: this._title,
        suggestions: PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: issue.playthroughIds,
      };

      UserExplorationPermissionsService.getPermissionsAsync().then(perms => {
        if (!perms.can_edit) {
          return;
        }
        this._actionButtons.push(
          ImprovementActionButtonObjectFactory.createNew(
            'Mark as Resolved', 'btn-primary', () => {
              ImprovementModalService.openConfirmationModal(
                'Marking this action as resolved will discard the ' +
                'playthrough forever. Are you sure you want to proceed?',
                'Mark as Resolved', 'btn-danger')
                .result.then(() => PlaythroughIssuesService.resolveIssue(issue))
                .then(() => this._isObsolete = true);
            }));
      });
    };

    /** @returns {string} - The actionable status of this task. */
    PlaythroughImprovementTask.prototype.getStatus = function() {
      return this._isObsolete ? STATUS_NOT_ACTIONABLE : STATUS_OPEN;
    };

    /**
     * @returns {boolean} - Whether this task is no longer useful, and hence
     *    should be hidden.
     */
    PlaythroughImprovementTask.prototype.isObsolete = function() {
      return this._isObsolete;
    };

    /** @returns {string} - A simple summary of the Playthrough Issue. */
    PlaythroughImprovementTask.prototype.getTitle = function() {
      return this._title;
    };

    /**
     * @returns {string} - The directive task type used to render details about
     *    this task's data.
     */
    PlaythroughImprovementTask.prototype.getDirectiveType = function() {
      return PLAYTHROUGH_IMPROVEMENT_TASK_TYPE;
    };

    /**
     * @returns {string} - Data required by the associated directive for
     *    rendering.
     */
    PlaythroughImprovementTask.prototype.getDirectiveData = function() {
      return this._directiveData;
    };

    /**
     * @returns {ImprovementActionButton[]} - The list of action buttons
     *    displayed on the task.
     */
    PlaythroughImprovementTask.prototype.getActionButtons = function() {
      return this._actionButtons;
    };

    return {
      /**
       * @returns {PlaythroughImprovementTask}
       * @param {PlaythroughIssue} issue - The issue this task is referring to.
       */
      createNew: function(issue) {
        return new PlaythroughImprovementTask(issue);
      },
      /**
       * @returns {Promise<PlaythroughImprovementTask[]>} - The list of
       *    playthrough issues associated to the current exploration.
       */
      fetchTasks: function() {
        // TODO(#7816): Remove this branch once all explorations maintain an
        // ExplorationIssuesModel.
        if (!ExplorationFeaturesService.isPlaythroughRecordingEnabled()) {
          return $q.resolve([]);
        }
        return PlaythroughIssuesService.getIssues().then(function(issues) {
          return issues.map(function(issue) {
            return new PlaythroughImprovementTask(issue);
          });
        });
      },
    };
  }
]);
