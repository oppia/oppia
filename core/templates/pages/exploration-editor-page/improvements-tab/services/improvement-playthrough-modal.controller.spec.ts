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

/**
 * @fileoverview Unit tests for ImprovementPlaythoughModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

import { AlertsService } from 'services/alerts.service';
import { Playthrough, PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { LearnerAction, LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';

describe('Improvement Playthough Modal Controller', function() {
  var $controller = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModalInstance = null;
  var alertsService: AlertsService = null;
  var learnerActionObjectFactory: LearnerActionObjectFactory = null;
  var playthroughObjectFactory: PlaythroughObjectFactory = null;
  var playthrough: Playthrough = null;
  var playthoughActions: LearnerAction[] = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
    $provide.value('ExplorationStatesService', {
      getState: () => ({ interaction: null })
    });
  }));

  beforeEach(angular.mock.inject(function($injector, _$controller_) {
    $controller = _$controller_;
    $rootScope = $injector.get('$rootScope');
    alertsService = $injector.get('AlertsService');
    learnerActionObjectFactory = $injector.get('LearnerActionObjectFactory');
    playthroughObjectFactory = $injector.get('PlaythroughObjectFactory');
  }));

  describe('when playthough actions is less than max unrelated actions ' +
    'per block', function() {
    beforeEach(() => {
      playthoughActions = [
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name1'}
        }),
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name2'}
        }),
      ];

      playthrough = playthroughObjectFactory.
        createNewMultipleIncorrectSubmissionsPlaythrough(
          '1', 1, {
            state_name: {
              value: 'state_name1'
            },
            num_times_answered_incorrectly: {
              value: 200
            }
          }, playthoughActions
        );

      $uibModalInstance = (
        jasmine.createSpyObj('$uibModalInstance', ['close', 'dismiss']));

      $scope = $rootScope.$new();
      $controller('ImprovementPlaythoughModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        playthrough: playthrough,
        playthroughIndex: 0
      });
    });

    it('should call init when controller is initialized', function() {
      expect($scope.playthroughIndex).toEqual(0);
      expect($scope.issueIsMultipleIncorrectSubmissions).toBeTrue();
      // After running $scope.expandActionsToRender.
      expect($scope.canExpandActions()).toBeFalse();

      // Run $scope.expandActionsToRender because canExpandActions is false.
      $scope.expandActionsToRender();
      expect($scope.canExpandActions()).toBeFalse();
    });

    it('should render issue table', function() {
      expect($scope.renderIssueTable()).toMatch(
        /<multiple-incorrect-submissions-issue final-block=".*"/,
        / action-start-index="1"><\/multiple-incorrect-submissions-issue>/);
    });

    it('should get actions to render', function() {
      expect($scope.getActionsToRender()).toEqual([]);
    });

    it('should evaluate if learner action needs to be highlighted', function() {
      expect($scope.isActionHighlighted(0)).toBeTrue();
      expect($scope.isActionHighlighted(1)).toBeTrue();
    });

    it('should render learner action', function() {
      expect($scope.renderLearnerAction(playthoughActions[0], 0)).toEqual(
        '0. Started exploration at card "state_name1".');
      expect($scope.renderLearnerAction(playthoughActions[1], 1)).toEqual(
        '1. Started exploration at card "state_name2".');
    });

    it('should dismiss modal', function() {
      var clearWarningsSpy = spyOn(
        alertsService, 'clearWarnings').and.callThrough();
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      expect(clearWarningsSpy).toHaveBeenCalled();
    });
  });

  describe('when playthough actions is greater than max unrelated actions ' +
  'per block', function() {
    beforeEach(function() {
      playthoughActions = [
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name1'}
        }),
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name2'}
        }),
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name3'}
        }),
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name4'}
        }),
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name5'}
        }),
        learnerActionObjectFactory.createNewExplorationStartAction({
          state_name: {value: 'state_name6'}
        }),
      ];

      playthrough = playthroughObjectFactory.createNewEarlyQuitPlaythrough(
        '1', 1, {
          state_name: {
            value: 'state_name1'
          },
          time_spent_in_exp_in_msecs: {
            value: 200
          }
        }, playthoughActions
      );

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      $scope = $rootScope.$new();
      $controller('ImprovementPlaythoughModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        playthrough: playthrough,
        playthroughIndex: 0
      });
    });

    it('should call init when controller is initialized', function() {
      expect($scope.playthroughIndex).toEqual(0);
      expect($scope.issueIsMultipleIncorrectSubmissions).toBeFalse();
      expect($scope.canExpandActions()).toBeTrue();
    });

    it('should render issue table', function() {
      expect($scope.renderIssueTable()).toMatch(
        /<multiple-incorrect-submissions-issue final-block=".*"/,
        /action-start-index="3"><\/multiple-incorrect-submissions-issue>/);
    });

    it('should get actions to render', function() {
      expect($scope.getActionsToRender()).toEqual([
        playthoughActions[2], playthoughActions[3],
        playthoughActions[4], playthoughActions[5]]);
    });

    it('should evaluate if learner action needs to be highlighted',
      function() {
        expect($scope.isActionHighlighted(0)).toBeTrue();
        expect($scope.isActionHighlighted(2)).toBeTrue();
        expect($scope.isActionHighlighted(3)).toBeTrue();
        expect($scope.isActionHighlighted(4)).toBeTrue();
        expect($scope.isActionHighlighted(5)).toBeTrue();
      });

    it('should render learner action', function() {
      expect($scope.renderLearnerAction(playthoughActions[0], 0)).toEqual(
        '0. Started exploration at card "state_name1".');
      expect($scope.renderLearnerAction(playthoughActions[1], 1)).toEqual(
        '1. Started exploration at card "state_name2".');
      expect($scope.renderLearnerAction(playthoughActions[2], 2)).toEqual(
        '2. Started exploration at card "state_name3".');
      expect($scope.renderLearnerAction(playthoughActions[3], 3)).toEqual(
        '3. Started exploration at card "state_name4".');
      expect($scope.renderLearnerAction(playthoughActions[4], 4)).toEqual(
        '4. Started exploration at card "state_name5".');
      expect($scope.renderLearnerAction(playthoughActions[5], 5)).toEqual(
        '5. Started exploration at card "state_name6".');
    });

    it('should dismiss modal', function() {
      var clearWarningsSpy = spyOn(
        alertsService, 'clearWarnings').and.callThrough();
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      expect(clearWarningsSpy).toHaveBeenCalled();
    });
  });
});
