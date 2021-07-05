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

fdescribe('QuestionPlayerComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $location = null;
  let $q = null;

  let PlayerPositionService = null;
  let ExplorationPlayerStateService = null;
  let QuestionPlayerStateService = null;
  let UserService = null;

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

  beforeEach(() => {
    // TestBed
  });

  beforeEach(angular.mock.inject(
    function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $location = $injector.get('$location');
      $q = $injector.get('$q');

      PlayerPositionService = $injector.get('PlayerPositionService');
      ExplorationPlayerStateService = $injector.get(
        'ExplorationPlayerStateService');
      QuestionPlayerStateService = $injector.get('QuestionPlayerStateService');
      UserService = $injector.get('UserService');


      ctrl = $componentController('questionPlayer', {
        $scope: $scope
      }, {
        getQuestionPlayerConfig: () => {}
      });
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

  it('should get the outer class name for action button', () => {
    expect(ctrl.getActionButtonOuterClass('BOOST_SCORE'))
      .toBe('boost-score-outer');
    expect(ctrl.getActionButtonOuterClass('RETRY_SESSION'))
      .toBe('new-session-outer');
    expect(ctrl.getActionButtonOuterClass('DASHBOARD'))
      .toBe('my-dashboard-outer');
    expect(ctrl.getActionButtonOuterClass('INVALID_TYPE'))
      .toBe('');
  });

  it('should get the inner class name for action button', () => {
    expect(ctrl.getActionButtonInnerClass('BOOST_SCORE'))
      .toBe('boost-score-inner');
    expect(ctrl.getActionButtonInnerClass('RETRY_SESSION'))
      .toBe('new-session-inner');
    expect(ctrl.getActionButtonInnerClass('DASHBOARD'))
      .toBe('my-dashboard-inner');
    expect(ctrl.getActionButtonInnerClass('INVALID_TYPE'))
      .toBe('');
  });

  it('should get html for action button icon', () => {
    expect(ctrl.getActionButtonIconHtml('BOOST_SCORE').toString())
      .toBe('&#10;          &#10;          &#10;          <img alt="" ' +
        'class="action-button-icon" src="/assets/images/icons/' +
        'rocket@2x.png">&#10;          ');
    expect(ctrl.getActionButtonIconHtml('RETRY_SESSION').toString())
      .toBe('<i class="material-icons md-36 action-button-icon">&#58837;</i>');
    expect(ctrl.getActionButtonIconHtml('DASHBOARD').toString())
      .toBe('<i class="material-icons md-36 action-button-icon">&#59530;</i>');
  });
});