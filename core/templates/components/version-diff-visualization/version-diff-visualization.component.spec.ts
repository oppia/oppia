// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Version diff visualization component.
 */

describe('VersionDiffVisualizationComponent', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;
  let $uibModal = null;
  let $q = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(($injector, $componentController) => {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');

    ctrl = $componentController('versionDiffVisualization', {
      $scope: $scope,
    }, {
      getDiffData: () => {
        return {
          v1InitStateId: 'A',
          v2InitStateId: 'B',
          links: [],
          finalStateIds: ['C', 'D'],
          nodes: {
            1: {
              newestStateName: 'A',
              stateProperty: 'changed',
              originalStateName: 'A'
            },
            2: {
              newestStateName: 'B',
              stateProperty: 'added',
              originalStateName: 'A'
            },
            3: {
              newestStateName: 'C',
              stateProperty: 'deleted',
              originalStateName: 'B'
            },
            4: {
              newestStateName: 'D',
              stateProperty: 'unchanged',
              originalStateName: 'B'
            },
            5: {
              newestStateName: 'E',
              stateProperty: 'changed',
              originalStateName: 'B'
            },
            6: {
              newestStateName: 'F',
              stateProperty: 'unchanged',
              originalStateName: 'F'
            },
          },
          v2States: {
            C: {},
            D: {}
          },
          v1States: {
            A: {},
            B: {}
          }
        };
      },
      getEarlierVersionHeader: () => {},
      getLaterVersionHeader: () => {}
    });
  }));

  it('should set component properties on initialization', () => {
    expect(ctrl.diffGraphSecondaryLabels).toEqual(undefined);
    expect(ctrl.diffGraphNodeColors).toEqual(undefined);
    expect(ctrl.v1InitStateId).toEqual(undefined);
    expect(ctrl.diffGraphData).toEqual(undefined);
    expect(ctrl.legendGraph).toEqual(undefined);

    ctrl.$onInit();

    expect(ctrl.diffGraphSecondaryLabels).toEqual({
      4: '(was: B)',
      5: '(was: B)'
    });
    expect(ctrl.diffGraphNodeColors).toEqual({
      1: '#1E90FF',
      2: '#4EA24E',
      3: '#DC143C',
      4: '#FFD700',
      5: '#1E90FF',
      6: 'beige'
    });
    expect(ctrl.v1InitStateId).toEqual('A');
    expect(ctrl.diffGraphData).toEqual(
      {
        nodes: { 1: 'A', 2: 'B', 3: 'B', 4: 'D', 5: 'E', 6: 'F' },
        links: [], initStateId: 'B', finalStateIds: ['C', 'D']
      }
    );
    expect(ctrl.legendGraph).toEqual({
      nodes: {
        Added: 'Added',
        Deleted: 'Deleted',
        Changed: 'Changed',
        Unchanged: 'Unchanged',
        Renamed: 'Renamed',
        'Changed/renamed': 'Changed/renamed'
      },
      links: [{
        source: 'Added',
        target: 'Deleted',
        linkProperty: 'hidden'
      }, {
        source: 'Deleted',
        target: 'Changed',
        linkProperty: 'hidden'
      }, {
        source: 'Changed',
        target: 'Unchanged',
        linkProperty: 'hidden'
      }, {
        source: 'Unchanged',
        target: 'Renamed',
        linkProperty: 'hidden'
      }, {
        source: 'Renamed',
        target: 'Changed/renamed',
        linkProperty: 'hidden'
      }],
      initStateId: 'Added',
      finalStateIds: ['Changed/renamed']
    });
  });

  it('should throw error if state property is invalid', () => {
    spyOn(ctrl, 'getDiffData').and.returnValue(
      {
        nodes: {
          1: {
            newestStateName: 'A',
            stateProperty: 'invalid',
            originalStateName: 'A'
          }
        }
      }
    );

    expect(() => ctrl.$onInit()).toThrowError('Invalid state property.');
  });

  it('should open state diff modal when user clicks on a state in' +
    ' difference graph', () => {
    let newState, oldStateName, newStateName, oldState, headers;
    spyOn($uibModal, 'open').and.callFake((options) => {
      newState = options.resolve.newState();
      newStateName = options.resolve.newStateName();
      oldState = options.resolve.oldState();
      oldStateName = options.resolve.oldStateName();
      headers = options.resolve.headers();

      return {
        result: $q.resolve()
      };
    });

    ctrl.$onInit();
    ctrl.onClickStateInDiffGraph(2);
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
    expect(newState).toBe(null);
    expect(oldState).toBe(null);
    expect(newStateName).toBe('B');
    expect(oldStateName).toBe('A');
    expect(headers).toEqual({
      leftPane: undefined,
      rightPane: undefined
    });
  });

  it('should open state diff modal and return old and new states when' +
    ' when user clicks on a state in difference graph', () => {
    let newState, oldStateName, newStateName, oldState, headers;
    spyOn(ctrl, 'getDiffData').and.returnValue(
      {
        nodes: {
          1: {
            newestStateName: 'A',
            stateProperty: 'changed',
            originalStateName: 'B'
          }
        },
        v2States: {
          A: {},
          B: {}
        },
        v1States: {
          A: {},
          B: {}
        }
      }
    );
    spyOn($uibModal, 'open').and.callFake((options) => {
      newState = options.resolve.newState();
      newStateName = options.resolve.newStateName();
      oldState = options.resolve.oldState();
      oldStateName = options.resolve.oldStateName();
      headers = options.resolve.headers();

      return {
        result: $q.resolve()
      };
    });

    ctrl.$onInit();
    ctrl.onClickStateInDiffGraph(1);
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
    expect(newState).toEqual({});
    expect(oldState).toEqual({});
    expect(newStateName).toBe('A');
    expect(oldStateName).toBe('B');
    expect(headers).toEqual({
      leftPane: undefined,
      rightPane: undefined
    });
  });

  it('should close state diff modal when user clicks cancel', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    ctrl.$onInit();
    ctrl.onClickStateInDiffGraph(2);
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });
});
