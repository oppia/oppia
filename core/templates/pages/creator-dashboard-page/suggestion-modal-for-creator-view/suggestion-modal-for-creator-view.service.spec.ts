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
 * @fileoverview Unit tests for SuggestionModalForCreatorDashboardService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Suggestion Modal for Creator View Service', function() {
  var SuggestionModalForCreatorDashboardService = null;
  var CsrfService = null;
  var $rootScope = null;
  var $uibModal = null;
  var $q = null;
  var $log = null;
  var cleanActiveThreadSpy = null;
  var activeThread = null;
  var extraParams = null;
  var suggestionBackendDict = null;
  var SuggestionModalForCreatorDashboardBackendApiService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    SuggestionModalForCreatorDashboardService = $injector.get(
      'SuggestionModalForCreatorDashboardService');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    $log = $injector.get('$log');
    $q = $injector.get('$q');
    CsrfService = $injector.get('CsrfTokenService');
    SuggestionModalForCreatorDashboardBackendApiService =
      $injector.get('SuggestionModalForCreatorDashboardBackendApiService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    cleanActiveThreadSpy = jasmine.createSpy('cleanActiveThread');
    activeThread = {
      isSuggestionHandled: function() {},
      getSuggestionStatus: function() {},
      description: '',
      suggestion: {
        targetType: 'exploration',
        targetId: '0',
        oldValue: '',
        newValue: '',
        stateName: '',
        suggestionType: '',
        suggestionId: '0'
      }
    };
    extraParams = {
      activeThread: activeThread,
      suggestionsToReviewList: [activeThread],
      clearActiveThread: cleanActiveThreadSpy,
      canReviewActiveThread: true
    };
    suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change: {
        cmd: 'edit_state_property',
        property_name: 'content',
        state_name: 'state_1',
        new_value: {
          html: 'new suggestion content'
        },
        old_value: {
          html: 'old suggestion content'
        }
      },
      last_updated_msecs: 1000
    };
  }));

  it('should call $uibModal open when opening suggestion modal', function() {
    var uibModalSpy = spyOn($uibModal, 'open').and.callThrough();

    SuggestionModalForCreatorDashboardService.showSuggestionModal(
      'edit_exploration_state_content', extraParams);

    expect(uibModalSpy).toHaveBeenCalled();
  });

  it(
    'should open suggestion modal when suggestion has resubmit action',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          action: 'resubmit',
          suggestionType: 'edit_exploration_state_content'
        })
      });
      var suggBackendSpy = spyOn(
        SuggestionModalForCreatorDashboardBackendApiService, 'updateSuggestion')
        .and.callFake(function() {
          var deferred = $q.defer();
          deferred.resolve(suggestionBackendDict);
          return deferred.promise;
        });

      SuggestionModalForCreatorDashboardService.showSuggestionModal(
        'edit_exploration_state_content', extraParams);
      $rootScope.$apply();

      expect(suggBackendSpy).toHaveBeenCalled();
      expect(cleanActiveThreadSpy).toHaveBeenCalled();
      expect(extraParams.suggestionsToReviewList.length).toBe(0);
    });

  it(
    'should handle rejects when resolving suggestion with resubmit' +
    ' action fails', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          action: 'resubmit',
          suggestionType: 'edit_exploration_state_content'
        })
      });
      var logSpy = spyOn($log, 'error').and.callThrough();
      var suggBackendSpy = spyOn(
        SuggestionModalForCreatorDashboardBackendApiService, 'updateSuggestion')
        .and.callFake(function() {
          return $q.reject('error calling backend');
        });

      SuggestionModalForCreatorDashboardService.showSuggestionModal(
        'edit_exploration_state_content', extraParams);
      $rootScope.$apply();

      expect(suggBackendSpy).toHaveBeenCalled();
      expect(cleanActiveThreadSpy).not.toHaveBeenCalled();
      expect(extraParams.suggestionsToReviewList.length).toBe(1);
      expect(logSpy).toHaveBeenCalledWith('Error resolving suggestion');
    });

  it(
    'should open suggestion modal when suggestion has no resubmit action',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          action: 'accept',
          suggestionType: 'edit_exploration_state_content'
        })
      });
      var suggBackendSpy = spyOn(
        SuggestionModalForCreatorDashboardBackendApiService, 'updateSuggestion')
        .and.callFake(function() {
          var deferred = $q.defer();
          deferred.resolve(suggestionBackendDict);
          return deferred.promise;
        });

      SuggestionModalForCreatorDashboardService.showSuggestionModal(
        'edit_exploration_state_content', extraParams);
      $rootScope.$apply();

      expect(suggBackendSpy).toHaveBeenCalled();
      expect(suggBackendSpy).toHaveBeenCalled();
      expect(cleanActiveThreadSpy).toHaveBeenCalled();
      expect(extraParams.suggestionsToReviewList.length).toBe(0);
    });

  it(
    'should handle rejects when resolving suggestion with no resubmit' +
    ' action fails', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          action: 'accept',
          suggestionType: 'edit_exploration_state_content'
        })
      });
      var logSpy = spyOn($log, 'error').and.callThrough();
      var suggBackendSpy = spyOn(
        SuggestionModalForCreatorDashboardBackendApiService, 'updateSuggestion')
        .and.callFake(function() {
          return $q.reject('error calling backend');
        });

      SuggestionModalForCreatorDashboardService.showSuggestionModal(
        'edit_exploration_state_content', extraParams);
      $rootScope.$apply();

      expect(suggBackendSpy).toHaveBeenCalled();
      expect(cleanActiveThreadSpy).not.toHaveBeenCalled();
      expect(extraParams.suggestionsToReviewList.length).toBe(1);
      expect(logSpy).toHaveBeenCalledWith('Error resolving suggestion');
    });

  it('should not open suggestion modal', function() {
    var uibModalSpy = spyOn($uibModal, 'open').and.callThrough();

    SuggestionModalForCreatorDashboardService.showSuggestionModal(
      'invalid', extraParams);

    expect(uibModalSpy).not.toHaveBeenCalled();
  });
});
