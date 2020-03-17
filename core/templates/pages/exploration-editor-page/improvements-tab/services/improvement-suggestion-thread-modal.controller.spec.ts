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
 * @fileoverview Unit tests for ImprovementSuggestionThreadModalController.
 */

describe('Improvement Suggestion Thread Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $httpBackend = null;
  var $q;
  var expId = 'exp1';
  var AlertsService = null;
  var ThreadDataService = null;
  var CsrfService = null;
  var ContextService = null;
  var SuggestionModalForExplorationEditorService = null;
  var thread = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(function($provide) {
    $provide.value('ExplorationDataService', {
      explorationId: expId
    });
    $provide.value('ExplorationStatesService', {
      hasState: () => true,
      getState: stateName => {}
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  beforeEach(angular.mock.inject(function($injector, $controller) {
    AlertsService = $injector.get('AlertsService');
    ThreadDataService = $injector.get('ThreadDataService');
    CsrfService = $injector.get('CsrfTokenService');
    ContextService = $injector.get('ContextService');
    SuggestionModalForExplorationEditorService = $injector.get(
      'SuggestionModalForExplorationEditorService');
    $httpBackend = $injector.get('$httpBackend');
    $q = $injector.get('$q');

    spyOn(CsrfService, 'getTokenAsync').and.returnValue(
      $q.resolve('sample-csrf-token'));
    spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');

    var mockSuggestionThreads = [{
      description: 'Suggestion',
      last_updated: 1441870501231.642,
      original_author_username: 'test_learner',
      state_name: null,
      status: 'open',
      subject: 'Suggestion from a learner',
      summary: null,
      thread_id: 'exp1.thread1'
    }];
    var mockSuggestions = [{
      assigned_reviewer_id: null,
      author_name: 'author_1',
      change: {
        new_value: {
          html: 'new content html',
          audio_translation: {}
        },
        old_value: null,
        cmd: 'edit_state_property',
        state_name: 'state_1',
        property_name: 'content'
      },
      final_reviewer_id: null,
      last_updated: 1528564605944.896,
      score_category: 'content.Algebra',
      status: 'received',
      suggestion_id: 'exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_id: 'exp_1',
      target_type: 'exploration',
      target_version_at_submission: 1,
    }];

    $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      feedback_thread_dicts: [],
      suggestion_thread_dicts: mockSuggestionThreads
    });
    $httpBackend.whenGET(
      '/suggestionlisthandler?target_type=exploration&target_id=' + expId
    ).respond({suggestions: mockSuggestions});
    ThreadDataService.getThreadsAsync().then(function(threads) {
      thread = threads.suggestionThreads[0];
    });
    $httpBackend.flush();

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $controller('ImprovementSuggestionThreadModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      isUserLoggedIn: true,
      thread: thread
    });
  }));

  it('should evalute scope variables value correctly', function() {
    expect($scope.isUserLoggedIn).toBe(true);
    expect($scope.activeThread).toEqual(thread);
    expect($scope.STATUS_CHOICES).toEqual([{
      id: 'open',
      text: 'Open'
    }, {
      id: 'fixed',
      text: 'Fixed'
    }, {
      id: 'ignored',
      text: 'Ignored'
    }, {
      id: 'compliment',
      text: 'Compliment'
    }, {
      id: 'not_actionable',
      text: 'Not Actionable'
    }]);
    expect($scope.tmpMessage).toEqual({
      status: 'open',
      text: ''
    });
    expect($scope.getTitle()).toBe('Suggestion for the card "state_1"');
  });

  it('should not add new message when message status is falsy', function() {
    var addWarningSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
    $scope.addNewMessage('temporary text', null);
    expect(addWarningSpy).toHaveBeenCalledWith(
      'Invalid message status: null');
  });

  it('should add new message', function() {
    $httpBackend.expectPOST('/threadhandler/exp1.thread1').respond(200);
    $httpBackend.expect('GET', '/threadhandler/exp1.thread1').respond({
      messages: [{
        text: 'temporary text'
      }]
    });
    $scope.addNewMessage('temporary text', 'newStatus');

    expect($scope.messageSendingInProgress).toBe(true);
    $httpBackend.flush(2);

    expect($scope.messageSendingInProgress).toBe(false);
    expect($scope.tmpMessage.status).toBe('newStatus');
    expect($uibModalInstance.close).toHaveBeenCalled();
  });

  it('should use reject handler when adding new message fails', function() {
    $httpBackend.expectPOST('/threadhandler/exp1.thread1').respond(500);
    $scope.addNewMessage('temporary text', 'status message');

    expect($scope.messageSendingInProgress).toBe(true);
    $httpBackend.flush();

    expect($scope.messageSendingInProgress).toBe(false);
    expect($scope.tmpMessage.status).toBe('open');
    expect($uibModalInstance.close).toHaveBeenCalled();
  });

  it('should open suggestion review modal', function() {
    var suggestionModalSpy = spyOn(
      SuggestionModalForExplorationEditorService, 'showSuggestionModal').and
      .callThrough();
    $scope.onClickReviewSuggestion();
    expect(suggestionModalSpy).toHaveBeenCalled();
  });

  it('should close modal', function() {
    $scope.close();
    expect($uibModalInstance.close).toHaveBeenCalled();
  });
});
