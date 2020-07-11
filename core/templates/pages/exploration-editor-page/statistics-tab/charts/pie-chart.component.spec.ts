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
 * @fileoverview Unit tests for pieChart.
 */

describe('Pie Chart directive', function() {
  var $scope = null;

  var mockedChart = {
    draw: () => {}
  };

  beforeEach(angular.mock.module('oppia'));

  describe('when $scope data is not an array', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $rootScope = $injector.get('$rootScope');

      $scope = $rootScope.$new();
      $scope.data = () => ({});
      var ctrl = $componentController('pieChart', {
        $scope: $scope,
        $element: []
      });
      ctrl.$onInit();
    }));

    it('should not redraw chart', function() {
      const drawSpy = spyOn(mockedChart, 'draw');
      window.dispatchEvent(new Event('resize'));
      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  describe('when chart is not defined', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $rootScope = $injector.get('$rootScope');

      Object.defineProperty(window, 'google', {
        get: () => undefined
      });
      spyOnProperty(window, 'google').and.returnValue({
        charts: {
          setOnLoadCallback: callback => {}
        }
      });

      $scope = $rootScope.$new();
      $scope.data = () => [];
      $scope.options = () => ({});
      var ctrl = $componentController('pieChart', {
        $scope: $scope,
        $element: []
      });
      ctrl.$onInit();
    }));

    it('should not redraw chart', function() {
      const drawSpy = spyOn(mockedChart, 'draw');
      window.dispatchEvent(new Event('resize'));
      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  describe('when chart is defined and $scope data is an array', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $rootScope = $injector.get('$rootScope');

      Object.defineProperty(window, 'google', {
        get: () => undefined
      });
      spyOnProperty(window, 'google').and.returnValue({
        visualization: {
          arrayToDataTable: () => {},
          PieChart: () => mockedChart
        },
        charts: {
          setOnLoadCallback: callback => callback()
        },
      });

      $scope = $rootScope.$new();
      $scope.data = () => [];
      $scope.options = () => ({
        title: 'Pie title',
        pieHole: null,
        pieSliceTextStyleColor: '#fff',
        pieSliceBorderColor: '#fff',
        left: 0,
        chartAreaWidth: 0,
        colors: [],
        height: 0,
        width: 0
      });
      var ctrl = $componentController('pieChart', {
        $scope: $scope,
        $element: []
      });
      ctrl.$onInit();
    }));

    it('should redraw chart', function() {
      const drawSpy = spyOn(mockedChart, 'draw');
      window.dispatchEvent(new Event('resize'));
      expect(drawSpy).toHaveBeenCalledWith(undefined, {
        title: 'Pie title',
        pieHole: null,
        pieSliceTextStyle: {
          color: '#fff',
        },
        pieSliceBorderColor: '#fff',
        pieSliceText: 'none',
        chartArea: {
          left: 0,
          width: 0,
        },
        colors: [],
        height: 0,
        legend: {
          position: 'none',
        },
        width: 0,
      });
    });
  });
});
