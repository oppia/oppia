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
 * @fileoverview Unit tests for the email dashboard page.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';

require('pages/email-dashboard-pages/email-dashboard-page.component.ts');

describe('Email Dashboard Page', function() {
  var $scope = null;
  var ctrl = null;
  var $q = null;
  var EmailDashboardDataService = null;
  var UserService = null;
  var LoaderService = null;
  var loadingMessage = null;
  var subscriptions = [];
  var firstPageQueries = [
    {id: 1, status: 'completed'},
    {id: 2, status: 'completed'}
  ];
  var secondPageQueries = [
    {id: 3, status: 'processing'},
    {id: 4, status: 'processing'}
  ];
  var EMAIL_DASHBOARD_PREDICATE_DEFINITION = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    EmailDashboardDataService = $injector.get('EmailDashboardDataService');
    UserService = $injector.get('UserService');
    EMAIL_DASHBOARD_PREDICATE_DEFINITION = $injector.get(
      'EMAIL_DASHBOARD_PREDICATE_DEFINITION');
    loadingMessage = '';
    LoaderService = $injector.get('LoaderService');
    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));
    $q = $injector.get('$q');

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    ctrl = $componentController('emailDashboardPage', {
      $rootScope: $scope
    });

    spyOn(EmailDashboardDataService, 'isNextPageAvailable').and.returnValue(
      true);
    spyOn(EmailDashboardDataService, 'isPreviousPageAvailable').and.returnValue(
      true);

    spyOn(UserService, 'getUserInfoAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve({
        getUsername: function() {
          return 'username';
        }
      });
      return deferred.promise;
    });
  }));

  afterEach(function() {
    for (let subscription of subscriptions) {
      subscription.unsubscribe();
    }
  });

  it('should clear form when form is reset', function() {
    // Initialize ctrl.data.
    ctrl.resetForm();
    ctrl.data.edited_fewer_than_n_exps = 1;

    ctrl.resetForm();

    EMAIL_DASHBOARD_PREDICATE_DEFINITION.forEach(predicate => {
      expect(ctrl.data[predicate.backend_attr]).toBe(predicate.default_value);
    });
  });

  it('should check if all inputs are empty', function() {
    ctrl.resetForm();
    expect(ctrl.areAllInputsEmpty()).toBe(true);

    ctrl.data.edited_fewer_than_n_exps = 1;
    expect(ctrl.areAllInputsEmpty()).toBe(false);

    ctrl.resetForm();
    ctrl.data.created_collection = true;
    expect(ctrl.areAllInputsEmpty()).toBe(false);
  });

  it('should submit query when submitting form', function() {
    // Initialize ctrl.data.
    ctrl.resetForm();
    ctrl.data.edited_fewer_than_n_exps = 1;

    spyOn(EmailDashboardDataService, 'submitQueryAsync').and.callFake(
      function() {
        var deferred = $q.defer();
        deferred.resolve(firstPageQueries);
        return deferred.promise;
      });

    ctrl.submitQueryAsync();
    $scope.$apply();

    expect(ctrl.currentPageOfQueries).toEqual(firstPageQueries);
    expect(ctrl.showSuccessMessage).toBe(true);
  });

  it('should get next page of queries', function() {
    spyOn(EmailDashboardDataService, 'getNextQueriesAsync').and.callFake(
      function() {
        var deferred = $q.defer();
        deferred.resolve(secondPageQueries);
        return deferred.promise;
      });

    ctrl.getNextPageOfQueries();
    $scope.$apply();

    expect(ctrl.currentPageOfQueries).toEqual(secondPageQueries);
  });

  it('should get previous page of queries', function() {
    spyOn(EmailDashboardDataService, 'getPreviousQueries').and.returnValue(
      firstPageQueries);

    ctrl.getPreviousPageOfQueries();

    expect(ctrl.currentPageOfQueries).toEqual(firstPageQueries);
  });

  it('should evaluate when next button is displayed', function() {
    expect(ctrl.showNextButton()).toBe(true);
  });

  it('should evaluate when previous button is displayed', function() {
    expect(ctrl.showPreviousButton()).toBe(true);
  });

  describe('recheckStatus', function() {
    it('should fetch query page again when getting next page of queries',
      function() {
        spyOn(EmailDashboardDataService, 'getNextQueriesAsync').and.callFake(
          function() {
            var deferred = $q.defer();
            deferred.resolve(secondPageQueries);
            return deferred.promise;
          });

        ctrl.getNextPageOfQueries();
        $scope.$apply();

        expect(ctrl.currentPageOfQueries).toEqual(secondPageQueries);

        var updatedQuery = {id: 3, status: 'completed'};
        spyOn(EmailDashboardDataService, 'fetchQueryAsync').and.callFake(
          function() {
            var deferred = $q.defer();
            deferred.resolve(updatedQuery);
            return deferred.promise;
          });

        ctrl.recheckStatus(0);
        $scope.$apply();

        expect(ctrl.currentPageOfQueries[0]).toEqual(updatedQuery);
      });

    it('should not get query page again when it does not exist', function() {
      expect(ctrl.currentPageOfQueries).toBe(undefined);
      ctrl.recheckStatus(0);
      expect(ctrl.currentPageOfQueries).toBe(undefined);
    });
  });

  it('should get user info and next queries after controller initialization',
    function() {
      spyOn(EmailDashboardDataService, 'getNextQueriesAsync').and.callFake(
        function() {
          var deferred = $q.defer();
          deferred.resolve(secondPageQueries);
          return deferred.promise;
        });

      ctrl.$onInit();
      expect(loadingMessage).toBe('Loading');
      expect(ctrl.currentPageOfQueries).toEqual([]);
      // For UserService.
      $scope.$apply();
      // For EmailDashboardDataService.
      $scope.$apply();

      expect(ctrl.username).toBe('username');
      expect(loadingMessage).toBe('');
      expect(ctrl.currentPageOfQueries).toEqual(secondPageQueries);

      expect(ctrl.showLinkToResultPage('username', 'completed')).toBe(true);
    });
});
