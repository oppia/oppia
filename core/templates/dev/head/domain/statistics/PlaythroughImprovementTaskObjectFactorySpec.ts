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
 * @fileoverview Unit tests for the PlaythroughImprovementTaskObjectFactory.
 */

// TODO(#7222): Remove the following unnnecessary import once
// PlaythroughImprovementTaskObjectFactory.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

require('domain/statistics/PlaythroughImprovementTaskObjectFactory');

describe('PlaythroughImprovementTaskObjectFactory', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var PlaythroughImprovementTaskObjectFactory = null;
  var PlaythroughIssuesService = null;
  var UserService = null;
  var PLAYTHROUGH_IMPROVEMENT_TASK_TYPE = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var upgradedServices = new UpgradedServices().upgradedServices;
    for (let [name, service] of Object.entries(upgradedServices)) {
      $provide.value(name, service);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_,
      _PlaythroughImprovementTaskObjectFactory_, _PlaythroughIssuesService_,
      _UserService_, _PLAYTHROUGH_IMPROVEMENT_TASK_TYPE_,
      // TODO(#7222): Import these normally after
      // PlaythroughImprovementTaskObjectFactory is upgraded to Angular 8.
      ExplorationFeaturesService, PlaythroughIssueObjectFactory) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    PlaythroughImprovementTaskObjectFactory =
      _PlaythroughImprovementTaskObjectFactory_;
    PlaythroughIssuesService = _PlaythroughIssuesService_;
    UserService = _UserService_;
    PLAYTHROUGH_IMPROVEMENT_TASK_TYPE = _PLAYTHROUGH_IMPROVEMENT_TASK_TYPE_;

    // TODO(#7222): Use these normally after
    // PlaythroughImprovementTaskObjectFactory is upgraded to Angular 8.
    this.ExplorationFeaturesService = ExplorationFeaturesService;
    this.PlaythroughIssueObjectFactory = PlaythroughIssueObjectFactory;

    this.expId = '7';
    this.expVersion = 1;
    PlaythroughIssuesService.initSession(this.expId, this.expVersion);

    this.scope = $rootScope.$new();
  }));

  describe('.createNew', function() {
    it('retrieves data from passed issue', function() {
      var issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: ['1', '2'],
        schema_version: 1,
        is_valid: true,
      });

      var task = PlaythroughImprovementTaskObjectFactory.createNew(issue);

      expect(task.getTitle())
        .toEqual(PlaythroughIssuesService.renderIssueStatement(issue));
      expect(task.getDirectiveData()).toEqual({
        title: PlaythroughIssuesService.renderIssueStatement(issue),
        suggestions: PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: ['1', '2'],
      });
      expect(task.getDirectiveType())
        .toEqual(PLAYTHROUGH_IMPROVEMENT_TASK_TYPE);
    });
  });

  describe('.fetchTasks', function() {
    beforeEach(function() {
      this.earlyQuitIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'EarlyQuit',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            time_spent_in_exp_in_msecs: {value: 5000},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      this.multipleIncorrectSubmissionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'MultipleIncorrectSubmissions',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            num_times_answered_incorrectly: {value: 4},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      this.cyclicTransitionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'CyclicTransitions',
          issue_customization_args: {
            state_names: {value: ['Hola', 'Me Llamo', 'Hola']},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
    });

    it(
      'returns a task for each issue when playthrough recording is enabled',
      function(done) {
        spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
          .and.returnValue(true);

        spyOn(PlaythroughIssuesService, 'getIssues').and.returnValue(
          $q.resolve([
            this.earlyQuitIssue,
            this.multipleIncorrectSubmissionsIssue,
            this.cyclicTransitionsIssue,
          ]));

        PlaythroughImprovementTaskObjectFactory.fetchTasks()
          .then(allTasks => allTasks.map(task => task.getTitle()))
          .then(allTaskTitles => {
            expect(allTaskTitles).toEqual([
              PlaythroughIssuesService.renderIssueStatement(
                this.earlyQuitIssue),
              PlaythroughIssuesService.renderIssueStatement(
                this.multipleIncorrectSubmissionsIssue),
              PlaythroughIssuesService.renderIssueStatement(
                this.cyclicTransitionsIssue),
            ]);
          }).then(done, done.fail);

        // Force all pending promises to evaluate.
        this.scope.$digest();
      });

    it(
      'returns nothing when playthrough recording is disabled', function(done) {
        spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
          .and.returnValue(false);

        var getIssuesSpy =
          spyOn(PlaythroughIssuesService, 'getIssues').and.stub();

        PlaythroughImprovementTaskObjectFactory.fetchTasks()
          .then(allTasks => {
            expect(allTasks).toEqual([]);
            expect(getIssuesSpy).not.toHaveBeenCalled();
          }).then(done, done.fail);

        // Force all pending promises to evaluate.
        this.scope.$digest();
      });
  });

  describe('PlaythroughImprovementTask', function() {
    beforeEach(function() {
      this.issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: [],
        schema_version: 1,
        is_valid: true,
      });
    });

    describe('.getActionButtons', function() {
      it('contains a specific sequence of buttons', function() {
        var task = PlaythroughImprovementTaskObjectFactory.createNew(
          this.issue);

        expect(task.getActionButtons().map(button => button.getText()))
          .toEqual(['Mark as Resolved']);
      });
    });

    describe('Mark as Resolved Action Button', function() {
      it('is disabled when no user is logged in', function() {
        spyOn(UserService, 'getUserInfoAsync')
          .and.returnValue($q.resolve({isLoggedIn: () => false}));

        var task = PlaythroughImprovementTaskObjectFactory.createNew(
          this.issue);

        // Force all pending promises to evaluate.
        this.scope.$digest();

        expect(task.getActionButtons()[0].isEnabled()).toBe(false);
      });

      it('is enabled when a user is logged in', function() {
        spyOn(UserService, 'getUserInfoAsync')
          .and.returnValue($q.resolve({isLoggedIn: () => true}));

        var task = PlaythroughImprovementTaskObjectFactory.createNew(
          this.issue);

        // Force all pending promises to evaluate.
        this.scope.$digest();

        expect(task.getActionButtons()[0].isEnabled()).toBe(true);
      });

      it('marks the task as resolved after confirmation', function() {
        var task = PlaythroughImprovementTaskObjectFactory.createNew(
          this.issue);

        expect(task.getStatus()).toEqual('open');

        var resolveActionButton = task.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(PlaythroughIssuesService, 'resolveIssue').and.stub();

        // Mock confirmation by returning a resolved promise.
        spyOn($uibModal, 'open').and.returnValue({result: $q.resolve()});

        resolveActionButton.execute();

        // Force all pending promises to evaluate.
        this.scope.$digest();

        expect(resolveIssueSpy).toHaveBeenCalledWith(this.issue);
        expect(task.getStatus()).not.toEqual('open');
      });

      it('keeps the task after cancel', function() {
        var task = PlaythroughImprovementTaskObjectFactory.createNew(
          this.issue);

        expect(task.getStatus()).toEqual('open');

        var resolveActionButton = task.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(PlaythroughIssuesService, 'resolveIssue').and.stub();

        // Mock cancellation by returning a rejected promise.
        spyOn($uibModal, 'open').and.returnValue({result: $q.reject()});

        resolveActionButton.execute();

        // Force all pending promises to evaluate.
        this.scope.$digest();

        expect(resolveIssueSpy).not.toHaveBeenCalled();
        expect(task.getStatus()).toEqual('open');
      });
    });
  });
});
