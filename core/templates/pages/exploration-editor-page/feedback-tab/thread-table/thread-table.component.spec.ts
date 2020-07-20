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
 * @fileoverview Unit tests for threadTable.
 */

describe('Thread table directive', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var DateTimeFormatService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    DateTimeFormatService = $injector.get('DateTimeFormatService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $componentController('threadTable', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
  }));

  it('should get css classes based on status', function() {
    expect($scope.getLabelClass('open')).toBe('badge badge-info');
    expect($scope.getLabelClass('compliment')).toBe('badge badge-success');
    expect($scope.getLabelClass('other')).toBe('badge badge-secondary');
  });

  it('should get human readable status from provided status', function() {
    expect($scope.getHumanReadableStatus('open')).toBe('Open');
    expect($scope.getHumanReadableStatus('compliment')).toBe('Compliment');
    expect($scope.getHumanReadableStatus('not_actionable')).toBe(
      'Not Actionable');
  });

  it('should get locate abbreviated date time string', function() {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    var NOW_MILLIS = 1416563100000;
    spyOn(DateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .withArgs(NOW_MILLIS).and.returnValue('11/21/2014');
    expect($scope.getLocaleAbbreviatedDatetimeString(NOW_MILLIS)).toBe(
      '11/21/2014');
  });
});
