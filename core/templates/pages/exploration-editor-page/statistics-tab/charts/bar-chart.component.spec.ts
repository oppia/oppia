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
 * @fileoverview Unit tests for barChart.
 */

describe('Bar Chart directive', function() {
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
      $componentController('barChart', {
        $scope: $scope,
        $element: [{}]
      });
    }));

    it('should not redraw chart', function() {
      const drawSpy = spyOn(mockedChart, 'draw');
      window.dispatchEvent(new Event('resize'));
      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  describe('when google.visualization is not defined', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $rootScope = $injector.get('$rootScope');

      Object.defineProperty(window, 'google', {
        get: () => undefined
      });
      spyOnProperty(window, 'google').and.returnValue(undefined);

      $scope = $rootScope.$new();
      $scope.data = () => [];
      $scope.options = () => ({});
      $componentController('barChart', {
        $scope: $scope,
        $element: [{}]
      });
    }));

    it('should not redraw chart', function() {
      window.dispatchEvent(new Event('resize'));
      expect(window.google).not.toBeDefined();
    });
  });

  describe('when google.visualization is defined and $scope data is an array',
    function() {
      beforeEach(angular.mock.inject(function($injector, $componentController) {
        var $rootScope = $injector.get('$rootScope');

        Object.defineProperty(window, 'google', {
          get: () => undefined
        });
        spyOnProperty(window, 'google').and.returnValue({
          visualization: {
            BarChart: () => mockedChart,
            arrayToDataTable: () => {}
          }
        });

        $scope = $rootScope.$new();
        $scope.data = () => [];
        $scope.options = () => ({
          chartAreaWidth: 0,
          colors: [],
          height: 0,
          width: 0
        });
        $componentController('barChart', {
          $scope: $scope,
          $element: [{}]
        });
      }));

      it('should redraw chart', function() {
        const drawSpy = spyOn(mockedChart, 'draw');
        window.dispatchEvent(new Event('resize'));
        expect(drawSpy).toHaveBeenCalledWith(undefined, {
          chartArea: {
            left: 0,
            width: 0
          },
          colors: [],
          hAxis: {
            gridlines: {
              color: 'transparent'
            }
          },
          height: 0,
          isStacked: true,
          legend: {
            position: 'none'
          },
          width: 0
        });
      });
    });
});
