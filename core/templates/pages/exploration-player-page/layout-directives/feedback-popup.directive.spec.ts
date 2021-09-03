// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Feedback popup directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { PlayerPositionService } from '../services/player-position.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';

describe('Feedback popup directive', function() {
  let $scope = null;
  let ctrl = null;
  let $element: JQLite = null;
  let $log = null;
  let $http = null;
  let $httpBackend = null;
  let CsrfService = null;
  let $rootScope = null;
  let $timeout = null;
  let directive = null;
  let userService = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let playerPositionService: PlayerPositionService = null;
  let backgroundMaskService: BackgroundMaskService = null;
  let explorationEngineService: ExplorationEngineService = null;

  let userInfoForCollectionCreator = {
    _role: 'USER_ROLE',
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
    isTranslationAdmin: () => false,
    isQuestionAdmin: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector, $q) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');
    directive = $injector.get('feedbackPopupDirective')[0];
    userService = $injector.get('UserService');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    playerPositionService = $injector.get('PlayerPositionService');
    backgroundMaskService = $injector.get('BackgroundMaskService');
    explorationEngineService = $injector.get('ExplorationEngineService');
    $log = $injector.get('$log');

    $element = angular.element(
      '<feedback-popup></feedback-popup>');

    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
      'stateName');
    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope,
      $http: $http,
      $element: $element
    });
  }));

  it('should set properties when initialized', fakeAsync(function() {
    expect($scope.feedbackText).toBe(undefined);
    expect($scope.isSubmitterAnonymized).toBe(undefined);
    expect($scope.feedbackTitle).toBe(undefined);

    ctrl.$onInit();
    tick();

    expect($scope.feedbackText).toBe('');
    expect($scope.isSubmitterAnonymized).toBe(false);
    expect($scope.feedbackTitle).toBe(
      'Feedback when the user was at card "stateName"');
  }));

  it('should deactivate mask when popover is closed', function() {
    $element.wrap('<div uib-popover-template></div>');
    $element.wrap(
      '<div uib-popover-template uib-popover-template-popup></div>');

    let deactivateMaskSpy = spyOn(backgroundMaskService, 'deactivateMask')
      .and.returnValue(null);

    $scope.closePopover();
    $timeout.flush();

    expect(deactivateMaskSpy).toHaveBeenCalled();
  });

  it('should save feedback successfully when ' +
    'clicking on save button', fakeAsync(function() {
    expect($scope.feedbackSubmitted).toBe(undefined);

    $scope.feedbackText = 'feedback';
    $element.wrap('<div uib-popover-template></div>');
    $element.wrap(
      '<div uib-popover-template="test"' +
      'uib-popover-template-popup></div>');

    spyOn(backgroundMaskService, 'deactivateMask')
      .and.returnValue(null);
    spyOn(explorationEngineService, 'getExplorationId')
      .and.returnValue('test_id');
    $httpBackend.expect('POST', '/explorehandler/give_feedback/test_id')
      .respond(200);

    $scope.saveFeedback();
    $httpBackend.flush();
    tick();
    $timeout.flush();

    expect($scope.feedbackSubmitted).toBe(true);
  }));

  it('should show error message when there ' +
    'is no popover child element', function() {
    spyOn(backgroundMaskService, 'deactivateMask')
      .and.returnValue(null);
    let loggerSpy = spyOn($log, 'error')
      .and.returnValue(null);

    $scope.closePopover();
    $timeout.flush();

    expect(loggerSpy).toHaveBeenCalledWith(
      'Could not close popover element.');
  });
});
