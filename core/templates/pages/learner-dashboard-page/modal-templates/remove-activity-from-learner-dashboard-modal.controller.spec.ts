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
 * @fileoverview Unit tests for
 * RemoveActivityFromLearnerDashboardModalController.
 */

describe('Remove Activity From Learner Dashboard Modal Controller',
  function() {
    var $httpBackend = null;
    var $scope = null;
    var $uibModalInstance = null;
    var CsrfTokenService = null;
    var activity = {
      title: 'Activity title',
      id: '1'
    };

    beforeEach(angular.mock.module('oppia'));

    describe('when section name is playlist and subsection name is' +
      ' exploration', function() {
      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      var subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      beforeEach(angular.mock.inject(function($injector, $controller) {
        $httpBackend = $injector.get('$httpBackend');
        var $rootScope = $injector.get('$rootScope');
        CsrfTokenService = $injector.get('CsrfTokenService');

        var $q = $injector.get('$q');

        spyOn(CsrfTokenService, 'getTokenAsync').and.returnValue(
          $q.resolve('sample-csrf-token'));

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        $scope = $rootScope.$new();
        $controller('RemoveActivityFromLearnerDashboardModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          activity: activity,
          sectionNameI18nId: sectionNameI18nId,
          subsectionName: subsectionName
        });
      }));

      it('should init the variables', function() {
        expect($scope.sectionNameI18nId).toEqual(sectionNameI18nId);
        expect($scope.subsectionName).toEqual(subsectionName);
        expect($scope.activityTitle).toEqual(activity.title);
      });

      it('should remove activity', function() {
        $httpBackend.expectDELETE(
          '/learnerplaylistactivityhandler/exploration/1').respond(200);
        $scope.remove();

        $httpBackend.flush();
        expect($uibModalInstance.close).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });
    });

    describe('when section name is incomplete and subsection name is' +
      ' collection', function() {
      var sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      var subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

      beforeEach(angular.mock.inject(function($injector, $controller) {
        $httpBackend = $injector.get('$httpBackend');
        var $rootScope = $injector.get('$rootScope');
        CsrfTokenService = $injector.get('CsrfTokenService');

        var $q = $injector.get('$q');

        spyOn(CsrfTokenService, 'getTokenAsync').and.returnValue(
          $q.resolve('sample-csrf-token'));

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        $scope = $rootScope.$new();
        $controller('RemoveActivityFromLearnerDashboardModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          activity: activity,
          sectionNameI18nId: sectionNameI18nId,
          subsectionName: subsectionName
        });
      }));

      it('should remove activity', function() {
        $httpBackend.expectDELETE(
          '/learnerincompleteactivityhandler/collection/1').respond(200);
        $scope.remove();

        $httpBackend.flush();
        expect($uibModalInstance.close).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });
    });

    describe('when sub section name is not valid', function() {
      var sectionNameI18nId = 'invalid section name';
      var subsectionName = 'invalid name';

      beforeEach(angular.mock.inject(function($injector, $controller) {
        var $rootScope = $injector.get('$rootScope');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        $scope = $rootScope.$new();
        $controller('RemoveActivityFromLearnerDashboardModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          activity: activity,
          sectionNameI18nId: sectionNameI18nId,
          subsectionName: subsectionName
        });
      }));

      it('should init the variables', function() {
        expect($scope.sectionNameI18nId).toEqual(sectionNameI18nId);
        expect($scope.subsectionName).toEqual(subsectionName);
        expect($scope.activityTitle).toEqual(activity.title);
      });

      it('should not remove activity', function() {
        expect(function() {
          $scope.remove();
        }).toThrowError('Subsection name is not valid.');

        expect($uibModalInstance.close).not.toHaveBeenCalled();
      });
    });

    describe('when section name is not valid', function() {
      var sectionNameI18nId = 'en';
      var subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      beforeEach(angular.mock.inject(function($injector, $controller) {
        var $rootScope = $injector.get('$rootScope');

        $uibModalInstance = jasmine.createSpyObj(
          '$uibModalInstance', ['close', 'dismiss']);

        $scope = $rootScope.$new();
        $controller('RemoveActivityFromLearnerDashboardModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          activity: activity,
          sectionNameI18nId: sectionNameI18nId,
          subsectionName: subsectionName
        });
      }));

      it('should remove activity', function() {
        expect(function() {
          $scope.remove();
        }).toThrowError('Section name is not valid.');

        expect($uibModalInstance.close).not.toHaveBeenCalled();
      });
    });
  });
