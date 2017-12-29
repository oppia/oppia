// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the exploration history tab.
 */

describe('HistoryTab controller', function() {
  beforeEach(module('oppia'));

  describe('HistoryTab', function() {
    var $scope, historyTabCtrl;

    beforeEach(inject(function($rootScope, $controller) {
      $scope = $rootScope.$new();
      historyTabCtrl = $controller('HistoryTab', {$scope: $scope});
    }));

    it('should get version number of revisions to be displayed',
    function() {
      $scope.currentPageDisplay = 1;
      $scope.versionsPerPage = 2;
      $scope.versionCheckboxArray = [
        {vnum: 5, selected: false},
        {vnum: 4, selected: true},
        {vnum: 3, selected: false},
        {vnum: 2, selected: false},
        {vnum: 1, selected: true}
      ];
      $scope.computeVersionsToDisplay();
      expect($scope.versionNumbersToDisplay).toEqual([5, 4]);
      $scope.currentPageDisplay = 2;
      $scope.computeVersionsToDisplay();
      expect($scope.versionNumbersToDisplay).toEqual([3, 2]);
      $scope.currentPageDisplay = 3;
      $scope.computeVersionsToDisplay();
      expect($scope.versionNumbersToDisplay).toEqual([1]);
    });
  });
});
