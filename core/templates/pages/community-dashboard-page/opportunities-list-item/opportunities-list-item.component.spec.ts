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
 * @fileoverview Unit tests for opportunitiesListItem.
 */

describe('Opportunities List Item Component', function() {
  var ctrl = null;
  var $scope = null;

  beforeEach(angular.mock.module('oppia'));

  describe('when opportunity is provided', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $rootScope = $injector.get('$rootScope');

      $scope = $rootScope.$new();
      ctrl = $componentController('opportunitiesListItem', {
        $scope: $scope,
      }, {
        getOpportunity: () => ({
          labelText: 'Label text',
          labelColor: '#fff',
          progressPercentage: 50
        }),
        onClickActionButton: () => jasmine.createSpy('click', () => {}),
        isLabelRequired: () => true,
        isProgressBarRequired: () => true,
        getOpportunityHeadingTruncationLength: () => null
      });
      ctrl.$onInit();
    }));

    it('should close modal with the correct value', function() {
      expect(ctrl.opportunityDataIsLoading).toBe(false);
      expect(ctrl.labelText).toBe('Label text');
      expect(ctrl.labelStyle).toEqual({
        'background-color': '#fff'
      });
      expect(ctrl.opportunityHeadingTruncationLength).toBe(35);
      expect(ctrl.progressPercentage).toBe('50%');
      expect(ctrl.progressBarStyle).toEqual({
        width: '50%'
      });
    });
  });

  describe('when opportunity is not provided', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $rootScope = $injector.get('$rootScope');

      $scope = $rootScope.$new();
      ctrl = $componentController('opportunitiesListItem', {
        $scope: $scope,
      }, {
        getOpportunity: () => null,
        onClickActionButton: () => jasmine.createSpy('click', () => {}),
        isLabelRequired: () => true,
        isProgressBarRequired: () => true,
        getOpportunityHeadingTruncationLength: () => null
      });
      ctrl.$onInit();
    }));

    it('should close modal with the correct value', function() {
      expect(ctrl.opportunityDataIsLoading).toBe(true);
      expect(ctrl.labelText).toBe(undefined);
      expect(ctrl.labelStyle).toBe(undefined);
      expect(ctrl.opportunityHeadingTruncationLength).toBe(35);
    });
  });
});
