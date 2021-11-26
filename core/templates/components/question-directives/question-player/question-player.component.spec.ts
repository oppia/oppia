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

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for QuestionPlayerComponent.
 */

describe('QuestionPlayerComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $location = null;
  let $q = null;
  let $uibModal = null;

  let PlayerPositionService = null;
  let PreventPageUnloadEventService = null;
  let ExplorationPlayerStateService = null;
  let QuestionPlayerStateService = null;
  let UserService = null;
  let mockWindow = null;

  let userInfo = {
    _isModerator: true,
    _isAdmin: false,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    mockWindow = {
      location: {
        href: ''
      }
    };
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(
    function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $location = $injector.get('$location');
      $q = $injector.get('$q');
      $uibModal = $injector.get('$uibModal');

      PlayerPositionService = $injector.get('PlayerPositionService');
      PreventPageUnloadEventService = $injector.get(
        'PreventPageUnloadEventService');
      ExplorationPlayerStateService = $injector.get(
        'ExplorationPlayerStateService');
      QuestionPlayerStateService = $injector.get('QuestionPlayerStateService');
      UserService = $injector.get('UserService');


      ctrl = $componentController('questionPlayer', {
        $scope: $scope
      }, {
        getQuestionPlayerConfig: () => {}
      });

      spyOnProperty(
        QuestionPlayerStateService, 'resultsPageIsLoadedEventEmitter'
      ).and.returnValue(new EventEmitter<boolean>());
      spyOn(QuestionPlayerStateService.resultsPageIsLoadedEventEmitter, 'emit');
    }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    expect(ctrl.currentQuestion).toBe(undefined);
    expect(ctrl.totalQuestions).toBe(undefined);
    expect(ctrl.currentProgress).toBe(undefined);
    expect(ctrl.totalScore).toBe(undefined);
    expect(ctrl.scorePerSkillMapping).toBe(undefined);
    expect(ctrl.testIsPassed).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.currentQuestion).toBe(0);
    expect(ctrl.totalQuestions).toBe(0);
    expect(ctrl.currentProgress).toBe(0);
    expect(ctrl.totalScore).toBe(0.0);
    expect(ctrl.scorePerSkillMapping).toEqual({});
    expect(ctrl.testIsPassed).toBe(true);
    expect(QuestionPlayerStateService.resultsPageIsLoadedEventEmitter.emit)
      .toHaveBeenCalledWith(false);
  });

  it('should add subscriptions on initialization', () => {
    spyOn(PlayerPositionService.onCurrentQuestionChange, 'subscribe');
    spyOn(ExplorationPlayerStateService.onTotalQuestionsReceived, 'subscribe');
    spyOn(QuestionPlayerStateService.onQuestionSessionCompleted, 'subscribe');

    ctrl.$onInit();

    expect(PlayerPositionService.onCurrentQuestionChange.subscribe)
      .toHaveBeenCalled();
    expect(ExplorationPlayerStateService.onTotalQuestionsReceived.subscribe)
      .toHaveBeenCalled();
    expect(QuestionPlayerStateService.onQuestionSessionCompleted.subscribe)
      .toHaveBeenCalled();
  });

  it('should update current question when current question is changed', () => {
    spyOnProperty(PlayerPositionService, 'onCurrentQuestionChange')
      .and.returnValue(new EventEmitter());

    ctrl.$onInit();
    ctrl.totalQuestions = 5;

    expect(ctrl.currentQuestion).toBe(0);
    expect(ctrl.currentProgress).toBe(0);

    PlayerPositionService.onCurrentQuestionChange.emit(3);
    $scope.$apply();

    expect(ctrl.currentQuestion).toBe(4);
    expect(ctrl.currentProgress).toBe(80);
  });

  it('should update total number of questions when count is received', () => {
    spyOnProperty(ExplorationPlayerStateService, 'onTotalQuestionsReceived')
      .and.returnValue(new EventEmitter());

    ctrl.$onInit();

    expect(ctrl.totalQuestions).toBe(0);

    ExplorationPlayerStateService.onTotalQuestionsReceived.emit(3);
    $scope.$apply();

    expect(ctrl.totalQuestions).toBe(3);
  });

  it('should change location hash when question session is completed', () => {
    spyOnProperty(QuestionPlayerStateService, 'onQuestionSessionCompleted')
      .and.returnValue(new EventEmitter());
    spyOn($location, 'hash').and.stub();

    ctrl.$onInit();
    QuestionPlayerStateService.onQuestionSessionCompleted.emit('new uri');
    $scope.$apply();

    expect($location.hash).toHaveBeenCalledWith(
      'question-player-result=%22new%20uri%22');
  });

  it('should get user info on initialization', () => {
    spyOn(UserService, 'getUserInfoAsync').and.returnValue(
      $q.resolve(userInfo)
    );

    expect(ctrl.canCreateCollections).toBe(undefined);
    expect(ctrl.isLoggedIn).toBe(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.canCreateCollections).toBe(true);
    expect(ctrl.userIsLoggedIn).toBe(true);
  });

  it('should calculate scores, mastery degree and check if user' +
    ' has passed test', () => {
    spyOnProperty(PlayerPositionService, 'onCurrentQuestionChange')
      .and.returnValue(new EventEmitter());
    spyOn($location, 'hash').and.returnValue(
      'question-player-result=%22new%20uri%22');
    spyOn(ctrl, 'calculateScores').and.stub();
    spyOn(ctrl, 'calculateMasteryDegrees').and.stub();
    spyOn(ctrl, 'hasUserPassedTest').and.returnValue(true);

    expect(ctrl.testIsPassed).toBe(undefined);

    ctrl.$onInit();
    ctrl.userIsLoggedIn = true;

    PlayerPositionService.onCurrentQuestionChange.emit(3);
    $scope.$apply();

    expect(ctrl.calculateScores).toHaveBeenCalled();
    expect(ctrl.calculateMasteryDegrees).toHaveBeenCalled();
    expect(ctrl.testIsPassed).toBe(true);
  });

  it('should get the inner class name for action button', () => {
    expect(ctrl.getActionButtonInnerClass('REVIEW_LOWEST_SCORED_SKILL'))
      .toBe('review-lowest-scored-skill-inner');
    expect(ctrl.getActionButtonInnerClass('RETRY_SESSION'))
      .toBe('new-session-inner');
    expect(ctrl.getActionButtonInnerClass('DASHBOARD'))
      .toBe('my-dashboard-inner');
    expect(ctrl.getActionButtonInnerClass('INVALID_TYPE'))
      .toBe('');
  });

  it('should get html for action button icon', () => {
    expect(ctrl.getActionButtonIconHtml(
      'REVIEW_LOWEST_SCORED_SKILL').toString())
      .toBe('<i class="material-icons md-18 action-button-icon">&#59497;</i>');
    expect(ctrl.getActionButtonIconHtml('RETRY_SESSION').toString())
      .toBe('<i class="material-icons md-18 action-button-icon">&#58837;</i>');
    expect(ctrl.getActionButtonIconHtml('DASHBOARD').toString())
      .toBe('<i class="material-icons md-18 action-button-icon">&#59530;</i>');
  });

  it('should open review lowest scored skill modal when use clicks ' +
    'on action button with type REVIEW_LOWEST_SCORED_SKILL', () => {
    let skills, skillIds;
    spyOn($uibModal, 'open').and.callFake((options) => {
      skills = options.resolve.skills();
      skillIds = options.resolve.skillIds();
      return {
        result: $q.resolve()
      };
    });
    ctrl.scorePerSkillMapping = {
      skill1: {
        score: 5,
        total: 8,
        description: ''
      },
      skill2: {
        score: 8,
        total: 8,
        description: ''
      }
    };

    ctrl.performAction({
      type: 'REVIEW_LOWEST_SCORED_SKILL'
    });
    $scope.$apply();

    expect(skills).toEqual(['']);
    expect(skillIds).toEqual(['skill1']);
  });

  it('should close review lowest scored skill modal', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    ctrl.scorePerSkillMapping = {
      skill1: {
        score: 5,
        total: 8
      },
      skill2: {
        score: 8,
        total: 8
      }
    };

    ctrl.performAction({
      type: 'REVIEW_LOWEST_SCORED_SKILL'
    });
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should redirect user if action button has a URL', () => {
    expect(mockWindow.location.href).toBe('');

    ctrl.performAction({
      url: '/url'
    });

    expect(mockWindow.location.href).toBe('/url');
  });

  it('should check if action buttons footer is to be shown or not', () => {
    ctrl.questionPlayerConfig = {
      resultActionButtons: ['first']
    };

    expect(ctrl.showActionButtonsFooter()).toBe(true);

    ctrl.questionPlayerConfig = {
      resultActionButtons: []
    };
    expect(ctrl.showActionButtonsFooter()).toBe(false);
  });

  it('should check if the user has passed the test or not', () => {
    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    };
    ctrl.scorePerSkillMapping = {
      skill1: {
        score: 5,
        total: 8
      },
      skill2: {
        score: 8,
        total: 8
      }
    };

    expect(ctrl.hasUserPassedTest()).toBe(false);

    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    };

    expect(ctrl.hasUserPassedTest()).toBe(true);
  });

  it('should get score percentage to set score bar width', () => {
    expect(ctrl.getScorePercentage({
      score: 5,
      total: 10
    })).toBe(50);
    expect(ctrl.getScorePercentage({
      score: 3,
      total: 10
    })).toBe(30);
  });

  it('should calculate score based on question state data', () => {
    let questionStateData = {
      ques1: {
        answers: ['1'],
        usedHints: [],
        viewedSolution: false,
      },
      ques2: {
        answers: ['3', '4'],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: ['skillId1', 'skillId2']
      }
    };
    ctrl.questionPlayerConfig = {
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    };
    ctrl.totalScore = 0.0;

    ctrl.calculateScores(questionStateData);

    expect(ctrl.totalScore).toBe(50);
    expect(QuestionPlayerStateService.resultsPageIsLoadedEventEmitter.emit)
      .toHaveBeenCalledWith(true);
  });

  it('should calculate mastery degrees', () => {
    ctrl.questionPlayerConfig = {
      skillList: ['skillId1'],
      skillDescriptions: ['description1']
    };
    let questionStateData = {
      ques1: {
        answers: [],
        usedHints: ['hint1'],
        viewedSolution: false,
      },
      ques2: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        }, {
          isCorrect: true,
        }],
        usedHints: ['hint1'],
        viewedSolution: true,
        linkedSkillIds: ['skillId1', 'skillId2']
      },
      ques3: {
        answers: [{
          isCorrect: false,
          taggedSkillMisconceptionId: 'skillId1-misconception1'
        }],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: ['skillId1']
      },
      ques4: {
        answers: [{
          isCorrect: false,
        }],
        usedHints: ['hint1'],
        viewedSolution: false,
        linkedSkillIds: ['skillId1']
      }
    };

    expect(ctrl.masteryPerSkillMapping).toEqual(undefined);

    ctrl.calculateMasteryDegrees(questionStateData);

    expect(ctrl.masteryPerSkillMapping).toEqual({
      skillId1: -0.04000000000000001
    });
  });

  it('should open concept card modal when user clicks on review' +
    ' and retry', () => {
    spyOn(ctrl, 'openConceptCardModal').and.stub();
    ctrl.failedSkillIds = ['skillId1'];

    ctrl.reviewConceptCardAndRetryTest();

    expect(ctrl.openConceptCardModal).toHaveBeenCalled();
  });

  it('should throw error when user clicks on review and retry' +
    ' and there are no failed skills', () => {
    ctrl.failedSkillIds = [];

    expect(() => ctrl.reviewConceptCardAndRetryTest()).toThrowError(
      'No failed skills'
    );
  });

  it('should get color for score based on score per skill', () => {
    let scorePerSkill = {
      score: 5,
      total: 7
    };
    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'NOT_PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(ctrl.getColorForScore(scorePerSkill)).toBe('rgb(0, 150, 136)');

    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(ctrl.getColorForScore(scorePerSkill)).toBe('rgb(217, 92, 12)');

    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    };

    expect(ctrl.getColorForScore(scorePerSkill)).toBe('rgb(0, 150, 136)');
  });

  it('should get color for score bar based on score per skill', () => {
    let scorePerSkill = {
      score: 5,
      total: 7
    };
    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'NOT_PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(ctrl.getColorForScoreBar(scorePerSkill)).toBe('rgb(32, 93, 134)');

    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 1.5
      }
    };

    expect(ctrl.getColorForScoreBar(scorePerSkill)).toBe('rgb(217, 92, 12)');

    ctrl.questionPlayerConfig = {
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.5
      }
    };

    expect(ctrl.getColorForScoreBar(scorePerSkill)).toBe('rgb(32, 93, 134)');
  });

  it('should open skill mastery modal when user clicks on skill', () => {
    let masteryPerSkillMapping;
    let skillId;
    let openConceptCardModal;
    let userIsLoggedIn;

    ctrl.masteryPerSkillMapping = {
      skillId1: -0.1
    };
    ctrl.openConceptCardModal = false;
    ctrl.userIsLoggedIn = true;
    spyOn($uibModal, 'open').and.callFake((options) => {
      masteryPerSkillMapping = options.resolve.masteryPerSkillMapping();
      openConceptCardModal = options.resolve.openConceptCardModal();
      skillId = options.resolve.skillId();
      userIsLoggedIn = options.resolve.userIsLoggedIn();
      return {
        result: $q.resolve()
      };
    });

    ctrl.openSkillMasteryModal('skillId1');
    $scope.$apply();

    expect(masteryPerSkillMapping).toEqual({skillId1: -0.1});
    expect(skillId).toBe('skillId1');
    expect(openConceptCardModal).toBe(false);
    expect(userIsLoggedIn).toBe(true);
  });

  it('should close skill master modal when user clicks cancel', () => {
    ctrl.masteryPerSkillMapping = {
      skillId1: -0.1
    };

    spyOn($uibModal, 'open').and.callFake((options) => {
      return {
        result: $q.reject()
      };
    });

    ctrl.openSkillMasteryModal('skillId1');
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should prevent page reload or exit in between' +
  'practice session', function() {
    spyOn(PreventPageUnloadEventService, 'addListener').and
      .callFake((callback) => callback());

    ctrl.$onInit();

    expect(PreventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });
});
