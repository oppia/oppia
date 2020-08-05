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

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
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

  it('should clear form when resetting form', function() {
    // Mock some values.
    ctrl.hasNotLoggedInForNDays = true;
    ctrl.inactiveInLastNDays = true;
    ctrl.createdAtLeastNExps = true;
    ctrl.createdFewerThanNExps = false;
    ctrl.editedAtLeastNExps = true;
    ctrl.editedFewerThanNExps = false;

    ctrl.resetForm();

    expect(ctrl.hasNotLoggedInForNDays).toBe(null);
    expect(ctrl.inactiveInLastNDays).toBe(null);
    expect(ctrl.createdAtLeastNExps).toBe(null);
    expect(ctrl.createdFewerThanNExps).toBe(null);
    expect(ctrl.editedAtLeastNExps).toBe(null);
    expect(ctrl.editedFewerThanNExps).toBe(null);
  });

  it('should submit query when submitting form', function() {
    // Mock some values.
    ctrl.hasNotLoggedInForNDays = true;
    ctrl.inactiveInLastNDays = true;
    ctrl.createdAtLeastNExps = true;
    ctrl.createdFewerThanNExps = false;
    ctrl.editedAtLeastNExps = true;
    ctrl.editedFewerThanNExps = false;

    spyOn(EmailDashboardDataService, 'submitQuery').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve(firstPageQueries);
      return deferred.promise;
    });

    ctrl.submitQuery();
    $scope.$apply();

    expect(ctrl.currentPageOfQueries).toEqual(firstPageQueries);
    expect(ctrl.showSuccessMessage).toBe(true);

    expect(ctrl.hasNotLoggedInForNDays).toBe(null);
    expect(ctrl.inactiveInLastNDays).toBe(null);
    expect(ctrl.createdAtLeastNExps).toBe(null);
    expect(ctrl.createdFewerThanNExps).toBe(null);
    expect(ctrl.editedAtLeastNExps).toBe(null);
    expect(ctrl.editedFewerThanNExps).toBe(null);
  });

  it('should get next page of queries when going to next page', function() {
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

  it('should get previous page of queries when going to previous page',
    function() {
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
    it('should reckeck status when getting next page of queries',
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

  it('should get user info and next queries after controller initialization',
    function() {
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
