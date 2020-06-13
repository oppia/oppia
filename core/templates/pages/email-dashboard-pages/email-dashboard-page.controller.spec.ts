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
import { UpgradedServices } from 'services/UpgradedServices';

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

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    EmailDashboardDataService = $injector.get('EmailDashboardDataService');
    UserService = $injector.get('UserService');
    loadingMessage = '';
    LoaderService = $injector.get('LoaderService');
    subscriptions.push(LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    ));
    $q = $injector.get('$q');

    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    var directive = $injector.get('emailDashboardPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
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

  it('should reset form', function() {
    // Mock some values.
    ctrl.has_not_logged_in_for_n_days = true;
    ctrl.inactive_in_last_n_days = true;
    ctrl.created_at_least_n_exps = true;
    ctrl.created_fewer_than_n_exps = false;
    ctrl.edited_at_least_n_exps = true;
    ctrl.edited_fewer_than_n_exps = false;

    ctrl.resetForm();

    expect(ctrl.has_not_logged_in_for_n_days).toBe(null);
    expect(ctrl.inactive_in_last_n_days).toBe(null);
    expect(ctrl.created_at_least_n_exps).toBe(null);
    expect(ctrl.created_fewer_than_n_exps).toBe(null);
    expect(ctrl.edited_at_least_n_exps).toBe(null);
    expect(ctrl.edited_fewer_than_n_exps).toBe(null);
  });

  it('should submit query', function() {
    // Mock some values.
    ctrl.has_not_logged_in_for_n_days = true;
    ctrl.inactive_in_last_n_days = true;
    ctrl.created_at_least_n_exps = true;
    ctrl.created_fewer_than_n_exps = false;
    ctrl.edited_at_least_n_exps = true;
    ctrl.edited_fewer_than_n_exps = false;

    spyOn(EmailDashboardDataService, 'submitQuery').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve(firstPageQueries);
      return deferred.promise;
    });

    ctrl.submitQuery();
    $scope.$apply();

    expect(ctrl.currentPageOfQueries).toEqual(firstPageQueries);
    expect(ctrl.showSuccessMessage).toBe(true);

    expect(ctrl.has_not_logged_in_for_n_days).toBe(null);
    expect(ctrl.inactive_in_last_n_days).toBe(null);
    expect(ctrl.created_at_least_n_exps).toBe(null);
    expect(ctrl.created_fewer_than_n_exps).toBe(null);
    expect(ctrl.edited_at_least_n_exps).toBe(null);
    expect(ctrl.edited_fewer_than_n_exps).toBe(null);
  });

  it('should get next page of queries', function() {
    spyOn(EmailDashboardDataService, 'getNextQueries').and.callFake(
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
    it('should get existing query from backend to check its content',
      function() {
        spyOn(EmailDashboardDataService, 'getNextQueries').and.callFake(
          function() {
            var deferred = $q.defer();
            deferred.resolve(secondPageQueries);
            return deferred.promise;
          });

        ctrl.getNextPageOfQueries();
        $scope.$apply();

        expect(ctrl.currentPageOfQueries).toEqual(secondPageQueries);

        var updatedQuery = {id: 3, status: 'completed'};
        spyOn(EmailDashboardDataService, 'fetchQuery').and.callFake(
          function() {
            var deferred = $q.defer();
            deferred.resolve(updatedQuery);
            return deferred.promise;
          });

        ctrl.recheckStatus(0);
        $scope.$apply();

        expect(ctrl.currentPageOfQueries[0]).toEqual(updatedQuery);
      });

    it('should not get query backend for rechecking its content when' +
      ' it does not exist', function() {
      expect(ctrl.currentPageOfQueries).toBe(undefined);
      ctrl.recheckStatus(0);
      expect(ctrl.currentPageOfQueries).toBe(undefined);
    });
  });

  it('should show link to result page', function() {
    expect(ctrl.showLinkToResultPage('username', 'completed')).toBe(false);
    expect(ctrl.username).toBe(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.username).toBe('username');
    expect(ctrl.showLinkToResultPage('username', 'completed')).toBe(true);
  });

  it('should get user info and next queries', function() {
    spyOn(EmailDashboardDataService, 'getNextQueries').and.callFake(
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
