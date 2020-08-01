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

import { of } from 'rxjs';

describe('Pie Chart component', function() {
  var ctrl = null;
  var $flushPendingTasks = null;
  var $scope = null;

  var mockedChart = null;
  var resizeEvent = new Event('resize');

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowDimensionsService', {
      getResizeEvent: () => of(resizeEvent)
    });
  }));

  afterEach(function() {
    // Resetting google global property.
    window.google = undefined;
    Object.defineProperty(window, 'google', {
      get: () => undefined
    });
    ctrl.$onDestroy();
  });

  describe('when $scope data is not an array', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      var $rootScope = $injector.get('$rootScope');

      mockedChart = {
        draw: () => {}
      };

      // This throws "Type '{}' is missing the following properties from type
      // 'typeof google': load, setOnLoadCallback, charts, visualization".
      // This is because it expect properties matching actual window.google.
      // We are suppressing this error because we don't need those properties
      // for testing purposes.
      // @ts-expect-error
      window.google = {};
      // This approach was choosen because spyOnProperty() doesn't work on
      // properties that doesn't have a get access type.
      // Without this approach the test will fail because it'll throw
      // 'Property google does not have access type get' error.
      // eslint-disable-next-line max-len
      // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
      // ref: https://github.com/jasmine/jasmine/issues/1415
      Object.defineProperty(window, 'google', {
        get: () => ({})
      });
      spyOnProperty(window, 'google').and.returnValue({
        visualization: {
          arrayToDataTable: () => {},
          PieChart: () => mockedChart
        },
        charts: {
          setOnLoadCallback: callback => {}
        }
      });

      $scope = $rootScope.$new();
      ctrl = $componentController('pieChart', {
        $scope: $scope,
        $element: []
      }, {
        data: () => ({})
      });
      ctrl.$onInit();
    }));

    it('should not redraw chart', function() {
      const drawSpy = spyOn(mockedChart, 'draw');
      angular.element(window).triggerHandler('resize');

      // Waiting for $applyAsync be called, which can take ~10 miliseconds
      // according to this ref: https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$applyAsync
      $flushPendingTasks();
      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  describe('when chart is not defined', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      var $rootScope = $injector.get('$rootScope');

      mockedChart = {
        draw: () => {}
      };

      // This throws "Type '{}' is missing the following properties from type
      // 'typeof google': load, setOnLoadCallback, charts, visualization".
      // This is because it expect properties matching actual window.google.
      // We are suppressing this error because we don't need those properties
      // for testing purposes.
      // @ts-expect-error
      window.google = {};
      // This approach was choosen because spyOnProperty() doesn't work on
      // properties that doesn't have a get access type.
      // Without this approach the test will fail because it'll throw
      // 'Property google does not have access type get' error.
      // eslint-disable-next-line max-len
      // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
      // ref: https://github.com/jasmine/jasmine/issues/1415
      Object.defineProperty(window, 'google', {
        get: () => ({})
      });
      spyOnProperty(window, 'google').and.returnValue({
        visualization: {
          arrayToDataTable: () => {},
          PieChart: () => jasmine.createSpy('chart')
        },
        charts: {
          setOnLoadCallback: callback => {}
        }
      });

      $scope = $rootScope.$new();
      ctrl = $componentController('pieChart', {
        $scope: $scope,
        $element: []
      }, {
        data: () => [],
        options: () => ({})
      });
      ctrl.$onInit();
    }));

    it('should not redraw chart', function() {
      const pieChartSpy = spyOn(window.google.visualization, 'PieChart');
      angular.element(window).triggerHandler('resize');

      // Waiting for $applyAsync be called, which can take ~10 miliseconds
      // according to this ref: https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$applyAsync
      $flushPendingTasks();
      expect(pieChartSpy).not.toHaveBeenCalled();
    });
  });

  describe('when chart is defined and $scope data is an array', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      var $rootScope = $injector.get('$rootScope');

      mockedChart = {
        draw: () => {}
      };

      // This throws "Type '{}' is missing the following properties from type
      // 'typeof google': load, setOnLoadCallback, charts, visualization".
      // This is because it expect properties matching actual window.google.
      // We are suppressing this error because we don't need those properties
      // for testing purposes.
      // @ts-expect-error
      window.google = {};
      // This approach was choosen because spyOnProperty() doesn't work on
      // properties that doesn't have a get access type.
      // Without this approach the test will fail because it'll throw
      // 'Property google does not have access type get' error.
      // eslint-disable-next-line max-len
      // ref: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
      // ref: https://github.com/jasmine/jasmine/issues/1415
      Object.defineProperty(window, 'google', {
        get: () => ({})
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
      ctrl = $componentController('pieChart', {
        $scope: $scope,
        $element: []
      }, {
        data: () => [],
        options: () => ({
          title: 'Pie title',
          pieHole: null,
          pieSliceTextStyleColor: '#fff',
          pieSliceBorderColor: '#fff',
          left: 0,
          chartAreaWidth: 0,
          colors: [],
          height: 0,
          width: 0
        })
      });
      ctrl.$onInit();
    }));

    it('should redraw chart', function() {
      const drawSpy = spyOn(mockedChart, 'draw');
      angular.element(window).triggerHandler('resize');

      // Waiting for $applyAsync be called, which can take ~10 miliseconds
      // according to this ref: https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$applyAsync
      $flushPendingTasks();
      expect(drawSpy).toHaveBeenCalled();
    });
  });
});
