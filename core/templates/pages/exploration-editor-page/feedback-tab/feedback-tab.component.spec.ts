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
 * @fileoverview Unit tests for feedbackTab.
 */

import { TestBed } from '@angular/core/testing';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { AlertsService } from 'services/alerts.service';
import { SuggestionThreadObjectFactory } from
  'domain/suggestion/SuggestionThreadObjectFactory';
import { DateTimeFormatService } from 'services/date-time-format.service';

describe('Feedback Tab Component', function() {
  var ctrl = null;
  var $q = null;
  var $scope = null;
  var $uibModal = null;
  var alertsService = null;
  var changeListService = null;
  var dateTimeFormatService = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var suggestionModalForExplorationEditorService = null;
  var suggestionThreadObjectFactory = null;
  var threadDataService = null;
  var userService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    alertsService = TestBed.get(AlertsService);
    dateTimeFormatService = TestBed.get(DateTimeFormatService);
    suggestionThreadObjectFactory = TestBed.get(SuggestionThreadObjectFactory);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('StateObjectFactory', TestBed.get(StateObjectFactory));
    $provide.value(
      'SuggestionModalService', TestBed.get(SuggestionModalService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    changeListService = $injector.get('ChangeListService');
    editabilityService = $injector.get('EditabilityService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    suggestionModalForExplorationEditorService = $injector.get(
      'SuggestionModalForExplorationEditorService');
    threadDataService = $injector.get('ThreadDataService');
    userService = $injector.get('UserService');

    spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
      isLoggedIn: () => true
    }));
    spyOn(threadDataService, 'getThreadsAsync').and.returnValue(
      $q.resolve({}));

    $scope = $rootScope.$new();
    ctrl = $componentController('feedbackTab', {
      $scope: $scope,
      AlertsService: alertsService
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  it('should throw an error when trying to active a non-existent thread',
    function() {
      expect(function() {
        ctrl.setActiveThread('0');
      }).toThrowError('Trying to display a non-existent thread');
    });

  it('should set active thread successfully', function() {
    var thread = suggestionThreadObjectFactory.createFromBackendDicts({
      status: 'review',
      subject: '',
      summary: '',
      original_author_username: 'Username1',
      last_updated_msecs: 0,
      message_count: 1,
      thread_id: '1',
    }, {
      suggestion_type: 'edit_exploration_state_content',
      suggestion_id: '1',
      target_type: '',
      target_id: '',
      status: '',
      author_name: '',
      change: {
        state_name: '',
        new_value: '',
        old_value: '',
      },
      last_updated_msecs: 0
    });
    spyOn(threadDataService, 'getThread').and.returnValue(thread);
    spyOn(threadDataService, 'getMessagesAsync').and.returnValue($q.resolve());

    ctrl.setActiveThread('1');
    $scope.$apply();

    expect(ctrl.activeThread).toEqual(thread);
    expect(ctrl.tmpMessage.status).toBe('review');
  });

  it('should add warning when trying to add a message in a thread with id' +
    ' null', function() {
    var addWarningSpy = spyOn(alertsService, 'addWarning').and.callThrough();
    ctrl.addNewMessage(null, 'Text', 'Open');
    expect(addWarningSpy).toHaveBeenCalledWith(
      'Cannot add message to thread with ID: null.');
  });

  it('should add warning when trying to add a invalid message in a thread',
    function() {
      var addWarningSpy = spyOn(alertsService, 'addWarning').and.callThrough();
      ctrl.addNewMessage('0', 'Text', null);
      expect(addWarningSpy).toHaveBeenCalledWith(
        'Invalid message status: null');
    });

  it('should throw error when trying to add a message in an invalid thread',
    function() {
      expect(function() {
        ctrl.addNewMessage('0', 'Text', 'Open');
      }).toThrowError('Trying to add message to a non-existent thread.');
      expect(ctrl.threadIsStale).toBe(true);
      expect(ctrl.messageSendingInProgress).toBe(true);
    });

  it('should add new message to a thread successfully and then go back',
    function() {
      spyOn(threadDataService, 'getThread').and.returnValue(
        suggestionThreadObjectFactory.createFromBackendDicts({
          status: 'Open',
          subject: '',
          summary: '',
          original_author_username: 'Username1',
          last_updated_msecs: 0,
          message_count: 1,
          thread_id: '1',
        }, {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: '1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: '',
            old_value: '',
          },
          last_updated_msecs: 0
        }));
      spyOn(threadDataService, 'getMessagesAsync').and.returnValue(
        $q.resolve());

      ctrl.setActiveThread('1');
      $scope.$apply();

      spyOn(threadDataService, 'addNewMessageAsync').and.returnValue(
        $q.resolve());
      ctrl.addNewMessage('1', 'Text', 'Open');

      expect(ctrl.messageSendingInProgress).toBe(true);
      $scope.$apply();

      expect(ctrl.messageSendingInProgress).toBe(false);
      expect(ctrl.tmpMessage.status).toBe('Open');
      expect(ctrl.tmpMessage.text).toBe('');

      ctrl.onBackButtonClicked();
      $scope.$apply();

      expect(threadDataService.getThread).toHaveBeenCalledWith('1');
    });

  it('should use reject handler when trying to add a message in a thread fails',
    function() {
      spyOn(threadDataService, 'getThread').and.returnValue(
        suggestionThreadObjectFactory.createFromBackendDicts({
          status: 'Open',
          subject: '',
          summary: '',
          original_author_username: 'Username1',
          last_updated_msecs: 0,
          message_count: 1,
          thread_id: '1',
        }, {
          suggestion_type: 'edit_exploration_state_content',
          suggestion_id: '1',
          target_type: '',
          target_id: '',
          status: '',
          author_name: '',
          change: {
            state_name: '',
            new_value: '',
            old_value: '',
          },
          last_updated_msecs: 0
        }));
      spyOn(threadDataService, 'getMessagesAsync').and.returnValue(
        $q.resolve());
      ctrl.setActiveThread('1');
      $scope.$apply();

      spyOn(threadDataService, 'addNewMessageAsync').and.returnValue(
        $q.reject());
      ctrl.addNewMessage('1', 'Text', 'Open');

      expect(ctrl.messageSendingInProgress).toBe(true);
      $scope.$apply();

      expect(ctrl.messageSendingInProgress).toBe(false);
    });

  it('should evaluate suggestion button type to be default', function() {
    var thread = suggestionThreadObjectFactory.createFromBackendDicts({
      status: 'open',
      subject: '',
      summary: '',
      original_author_username: 'Username1',
      last_updated_msecs: 0,
      message_count: 1,
      thread_id: '1',
    }, {
      suggestion_type: 'edit_exploration_state_content',
      suggestion_id: '1',
      target_type: '',
      target_id: '',
      status: 'open',
      author_name: '',
      change: {
        state_name: '',
        new_value: '',
        old_value: '',
      },
      last_updated_msecs: 0
    });
    spyOn(threadDataService, 'getThread').and.returnValue(thread);
    spyOn(threadDataService, 'getMessagesAsync').and.returnValue($q.resolve());

    ctrl.setActiveThread('1');
    $scope.$apply();

    expect(ctrl.getSuggestionButtonType()).toBe('default');
  });

  it('should evaluate suggestion button type to be primary', function() {
    var thread = suggestionThreadObjectFactory.createFromBackendDicts({
      status: 'review',
      subject: '',
      summary: '',
      original_author_username: 'Username1',
      last_updated_msecs: 0,
      message_count: 1,
      thread_id: '1',
    }, {
      suggestion_type: 'edit_exploration_state_content',
      suggestion_id: '1',
      target_type: '',
      target_id: '',
      status: 'review',
      author_name: '',
      change: {
        state_name: '',
        new_value: '',
        old_value: '',
      },
      last_updated_msecs: 0
    });
    spyOn(threadDataService, 'getThread').and.returnValue(thread);
    spyOn(threadDataService, 'getMessagesAsync').and.returnValue($q.resolve());

    ctrl.setActiveThread('1');
    $scope.$apply();

    spyOn(explorationStatesService, 'hasState').and.returnValue(true);
    spyOn(changeListService, 'getChangeList').and.returnValue([]);

    expect(ctrl.getSuggestionButtonType()).toBe('primary');
  });

  it('should not open show suggestion modal when active thread is null',
    function() {
      expect(function() {
        ctrl.showSuggestionModal();
      }).toThrowError('Trying to show suggestion of a non-existent thread');
    });

  it('should open show suggestion modal', function() {
    var getThreadSpy = spyOn(threadDataService, 'getThread');
    getThreadSpy.and.returnValue(
      suggestionThreadObjectFactory.createFromBackendDicts({
        status: 'Open',
        subject: '',
        summary: '',
        original_author_username: 'Username1',
        last_updated_msecs: 0,
        message_count: 1,
        thread_id: '1',
        last_nonempty_message_author: 'Message 1',
        last_nonempty_message_text: 'Message 2'
      }, {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: '1',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change: {
          state_name: '',
          new_value: '',
          old_value: '',
        },
        last_updated_msecs: 0
      }));
    spyOn(threadDataService, 'getMessagesAsync').and.returnValue(
      $q.resolve());
    ctrl.setActiveThread('1');
    $scope.$apply();

    spyOn(suggestionModalForExplorationEditorService, 'showSuggestionModal')
      .and.callFake(function(suggestionType, obj) {
        obj.setActiveThread('0');
      });

    getThreadSpy.and.returnValue(
      suggestionThreadObjectFactory.createFromBackendDicts({
        status: 'Review',
        subject: '',
        summary: '',
        original_author_username: 'Username1',
        last_updated_msecs: 0,
        message_count: 1,
        thread_id: '2',
        last_nonempty_message_author: 'Message 1',
        last_nonempty_message_text: 'Message 2'
      }, {
        suggestion_type: 'edit_exploration_state_content',
        suggestion_id: '2',
        target_type: '',
        target_id: '',
        status: '',
        author_name: '',
        change: {
          state_name: '',
          new_value: '',
          old_value: '',
        },
        last_updated_msecs: 0
      }));
    ctrl.showSuggestionModal();
    $scope.$apply();

    expect(
      suggestionModalForExplorationEditorService.showSuggestionModal)
      .toHaveBeenCalled();
    expect(ctrl.tmpMessage.status).toBe('Review');
    expect(ctrl.tmpMessage.text).toBe('');
  });

  it('should create a new thread when closing create new thread modal',
    function() {
      spyOn(alertsService, 'addSuccessMessage').and.callThrough();
      spyOn(threadDataService, 'createNewThreadAsync').and.returnValue(
        $q.resolve());
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          newThreadSubject: 'New subject',
          newThreadText: 'New text'
        })
      });
      ctrl.showCreateThreadModal();
      $scope.$apply();
      $scope.$apply();

      expect(threadDataService.createNewThreadAsync)
        .toHaveBeenCalledWith('New subject', 'New text');
      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Feedback thread created.');
      expect(ctrl.tmpMessage.status).toBe(null);
      expect(ctrl.tmpMessage.text).toBe('');
    });

  it('should not create a new thread when dismissing create new thread modal',
    function() {
      spyOn(threadDataService, 'createNewThreadAsync');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      ctrl.showCreateThreadModal();
      $scope.$apply();

      expect(threadDataService.createNewThreadAsync).not.toHaveBeenCalled();
    });

  it('should get css classes based on status', function() {
    expect(ctrl.getLabelClass('open')).toBe('badge badge-info');
    expect(ctrl.getLabelClass('compliment')).toBe('badge badge-success');
    expect(ctrl.getLabelClass('another')).toBe('badge badge-secondary');
  });

  it('should get human readable status from provided status', function() {
    expect(ctrl.getHumanReadableStatus('open')).toBe('Open');
    expect(ctrl.getHumanReadableStatus('compliment')).toBe('Compliment');
    expect(ctrl.getHumanReadableStatus('not_actionable')).toBe(
      'Not Actionable');
  });

  it('shoud get locale date time string', function() {
    // This method is being spied to avoid any timezone issues.
    spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString').and
      .returnValue('11/21/14');
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    var NOW_MILLIS = 1416563100000;
    expect(ctrl.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
      '11/21/14');
  });

  it('should evaluate when exploration is editable', function() {
    var isEditableSpy = spyOn(editabilityService, 'isEditable');

    isEditableSpy.and.returnValue(true);
    expect(ctrl.isExplorationEditable()).toBe(true);

    isEditableSpy.and.returnValue(false);
    expect(ctrl.isExplorationEditable()).toBe(false);
  });
});
