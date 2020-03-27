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
 * @fileoverview Unit tests for ImprovementFeedbackThreadModalController.
 */

describe('Improvement Feedback Thread Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var $httpBackend = null;
  var $q;
  var expId = 'exp1';
  var AlertsService = null;
  var ThreadDataService = null;
  var CsrfService = null;
  var ContextService = null;
  var thread = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(function($provide) {
    $provide.value('ExplorationDataService', {
      explorationId: expId
    });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  describe('when thread id is provided', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      AlertsService = $injector.get('AlertsService');
      ThreadDataService = $injector.get('ThreadDataService');
      CsrfService = $injector.get('CsrfTokenService');
      ContextService = $injector.get('ContextService');
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');

      spyOn(CsrfService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));
      spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');

      var mockFeedbackThreads = [{
        last_updated: 1000,
        original_author_username: 'author',
        status: 'accepted',
        subject: 'sample subject',
        summary: 'sample summary',
        message_count: 10,
        state_name: 'state 1',
        thread_id: 'exp1.thread1'
      }];

      $httpBackend.whenGET('/threadlisthandler/' + expId).respond({
        feedback_thread_dicts: mockFeedbackThreads,
        suggestion_thread_dicts: []
      });
      $httpBackend.whenGET(
        '/suggestionlisthandler?target_type=exploration&target_id=' + expId
      ).respond({ suggestions: [] });
      ThreadDataService.getThreadsAsync().then(function(threads) {
        thread = threads.feedbackThreads[0];
      });
      $httpBackend.flush();

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      var $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $controller('ImprovementFeedbackThreadModalController', {
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
        status: 'accepted',
        text: ''
      });
      expect($scope.getTitle()).toBe('sample subject');
    });

    it('should not add new message when message status is false', function() {
      var addWarningSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
      $scope.addNewMessage('temporary text', null);
      expect(addWarningSpy).toHaveBeenCalledWith(
        'Invalid message status: null');
    });

    it('should add new message', function() {
      $httpBackend.expect('POST', '/threadhandler/exp1.thread1').respond(200);
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
      expect($scope.tmpMessage.status).toBe('accepted');
      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should close modal', function() {
      $scope.close();
      expect($uibModalInstance.close).toHaveBeenCalled();
    });
  });

  describe('when thread id is not provided', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      AlertsService = $injector.get('AlertsService');
      ThreadDataService = $injector.get('ThreadDataService');
      CsrfService = $injector.get('CsrfTokenService');
      ContextService = $injector.get('ContextService');
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');

      spyOn(CsrfService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));
      spyOn(ContextService, 'getExplorationId').and.returnValue('exp1');

      var mockFeedbackThreads = [{
        last_updated: 1000,
        original_author_username: 'author',
        status: 'accepted',
        subject: 'sample subject',
        summary: 'sample summary',
        message_count: 10,
        state_name: 'state 1',
        thread_id: null
      }];

      $httpBackend.whenGET('/threadlisthandler/' + expId)
        .respond({
          feedback_thread_dicts: mockFeedbackThreads,
          suggestion_thread_dicts: []
        });
      $httpBackend.whenGET(
        '/suggestionlisthandler?target_type=exploration&target_id=' + expId
      ).respond({ suggestions: [] });
      ThreadDataService.getThreadsAsync().then(function(threads) {
        thread = threads.feedbackThreads[0];
      });
      $httpBackend.flush();

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      var $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $controller(
        'ImprovementFeedbackThreadModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          isUserLoggedIn: true,
          thread: thread
        });
    }));

    it('should not add new message when thread id is not valid', function() {
      var addWarningSpy = spyOn(AlertsService, 'addWarning').and.callThrough();
      $scope.addNewMessage('text', 'status message');
      expect(addWarningSpy).toHaveBeenCalledWith(
        'Cannot add message to thread with ID: null.');
    });
  });
});
