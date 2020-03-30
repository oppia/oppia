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

describe('Improvement Playthough Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var AlertsService = null;
  var PlaythroughObjectFactory = null;
  var playthrough = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(function($provide) {
    $provide.value('ExplorationStatesService', {
      getState: () => ({ interaction: null })
    });
  }));

  describe('when playthough actions is less than max unrelated actions' +
    ' per block', function() {
    var playthoughActions = [{
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name1'
        }
      },
      schemaVersion: ''
    }, {
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name2'
        }
      },
      schemaVersion: ''
    }];

    beforeEach(angular.mock.inject(function($injector, $controller) {
      PlaythroughObjectFactory = $injector.get('PlaythroughObjectFactory');
      AlertsService = $injector.get('AlertsService');

      playthrough = PlaythroughObjectFactory.createNew(
        0, '1', 1, 'MultipleIncorrectSubmissions', {
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

      var $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $controller('ImprovementPlaythoughModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        playthrough: playthrough,
        playthroughIndex: 0
      });
    }));

    it('should call init when controller is initialized', function() {
      expect($scope.playthroughIndex).toBe(0);
      expect($scope.issueIsMultipleIncorrectSubmissions).toBe(true);
      // After running $scope.expandActionsToRender.
      expect($scope.canExpandActions()).toBe(false);

      // Run $scope.expandActionsToRender because canExpandActions is false.
      $scope.expandActionsToRender();
      expect($scope.canExpandActions()).toBe(false);
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
      expect($scope.isActionHighlighted(0)).toBe(true);
      expect($scope.isActionHighlighted(1)).toBe(true);
    });

    it('should render learner action', function() {
      expect($scope.renderLearnerAction(playthoughActions[0], 0)).toBe(
        '0. Started exploration at card "state_name1".');
      expect($scope.renderLearnerAction(playthoughActions[1], 1)).toBe(
        '1. Started exploration at card "state_name2".');
    });

    it('should dismiss modal', function() {
      var clearWarningsSpy = spyOn(
        AlertsService, 'clearWarnings').and.callThrough();
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      expect(clearWarningsSpy).toHaveBeenCalled();
    });
  });

  describe('when playthough actions is greather than max unrelated actions' +
  ' per block', function() {
    var playthoughActions = [{
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name1'
        }
      },
      schemaVersion: ''
    }, {
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name2'
        }
      },
      schemaVersion: ''
    }, {
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name3'
        }
      },
      schemaVersion: ''
    }, {
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name4'
        }
      },
      schemaVersion: ''
    }, {
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name5'
        }
      },
      schemaVersion: ''
    }, {
      actionType: 'ExplorationStart',
      actionCustomizationArgs: {
        state_name: {
          value: 'state_name6'
        }
      },
      schemaVersion: ''
    }];

    beforeEach(angular.mock.inject(function($injector, $controller) {
      PlaythroughObjectFactory = $injector.get('PlaythroughObjectFactory');
      AlertsService = $injector.get('AlertsService');

      playthrough = PlaythroughObjectFactory.createNew(
        0, '1', 1, 'EarlyQuit', {
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

      var $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $controller('ImprovementPlaythoughModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        playthrough: playthrough,
        playthroughIndex: 0
      });
    }));

    it('should call init when controller is initialized', function() {
      expect($scope.playthroughIndex).toBe(0);
      expect($scope.issueIsMultipleIncorrectSubmissions).toBe(false);
      expect($scope.canExpandActions()).toBe(true);
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
        expect($scope.isActionHighlighted(0)).toBe(true);
        expect($scope.isActionHighlighted(2)).toBe(true);
        expect($scope.isActionHighlighted(3)).toBe(true);
        expect($scope.isActionHighlighted(4)).toBe(true);
        expect($scope.isActionHighlighted(5)).toBe(true);
      });

    it('should render learner action', function() {
      expect($scope.renderLearnerAction(playthoughActions[0], 0)).toBe(
        '0. Started exploration at card "state_name1".');
      expect($scope.renderLearnerAction(playthoughActions[1], 1)).toBe(
        '1. Started exploration at card "state_name2".');
      expect($scope.renderLearnerAction(playthoughActions[2], 2)).toBe(
        '2. Started exploration at card "state_name3".');
      expect($scope.renderLearnerAction(playthoughActions[3], 3)).toBe(
        '3. Started exploration at card "state_name4".');
      expect($scope.renderLearnerAction(playthoughActions[4], 4)).toBe(
        '4. Started exploration at card "state_name5".');
      expect($scope.renderLearnerAction(playthoughActions[5], 5)).toBe(
        '5. Started exploration at card "state_name6".');
    });

    it('should dismiss modal', function() {
      var clearWarningsSpy = spyOn(
        AlertsService, 'clearWarnings').and.callThrough();
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
      expect(clearWarningsSpy).toHaveBeenCalled();
    });
  });
});
