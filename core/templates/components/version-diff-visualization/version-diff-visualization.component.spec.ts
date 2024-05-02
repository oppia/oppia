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

import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {VersionDiffVisualizationComponent} from './version-diff-visualization.component';
import {State} from 'domain/state/StateObjectFactory';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

describe('Version Diff Visualization Component', () => {
  let component: VersionDiffVisualizationComponent;
  let fixture: ComponentFixture<VersionDiffVisualizationComponent>;
  let ngbModal: NgbModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [VersionDiffVisualizationComponent],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionDiffVisualizationComponent);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);

    component.diffData = {
      v1InitStateId: 0,
      v2InitStateId: 1,
      links: [],
      finalStateIds: ['C', 'D'],
      nodes: {
        1: {
          newestStateName: 'A',
          stateProperty: 'changed',
          originalStateName: 'A',
        },
        2: {
          newestStateName: 'B',
          stateProperty: 'added',
          originalStateName: 'A',
        },
        3: {
          newestStateName: 'C',
          stateProperty: 'deleted',
          originalStateName: 'B',
        },
        4: {
          newestStateName: 'D',
          stateProperty: 'unchanged',
          originalStateName: 'B',
        },
        5: {
          newestStateName: 'E',
          stateProperty: 'changed',
          originalStateName: 'B',
        },
        6: {
          newestStateName: 'F',
          stateProperty: 'unchanged',
          originalStateName: 'F',
        },
      },
      v2States: {
        C: {} as State,
        D: {} as State,
      },
      v1States: {
        A: {} as State,
        B: {} as State,
      },
    };
  });

  it('should set component properties on initialization', () => {
    expect(component.diffGraphSecondaryLabels).toEqual(undefined);
    expect(component.diffGraphNodeColors).toEqual(undefined);
    expect(component.v1InitStateId).toBeUndefined();
    expect(component.diffGraphData).toEqual(undefined);
    expect(component.legendGraph).toEqual(undefined);

    component.ngOnInit();

    expect(component.diffGraphSecondaryLabels).toEqual({
      4: '(was: B)',
      5: '(was: B)',
    });
    expect(component.diffGraphNodeColors).toEqual({
      1: '#1E90FF',
      2: '#4EA24E',
      3: '#DC143C',
      4: '#FFD700',
      5: '#1E90FF',
      6: 'beige',
    });
    expect(component.v1InitStateId).toEqual(0);
    expect(component.diffGraphData).toEqual({
      nodes: {1: 'A', 2: 'B', 3: 'B', 4: 'D', 5: 'E', 6: 'F'},
      links: [],
      initStateId: 1,
      finalStateIds: ['C', 'D'],
    });
    expect(component.legendGraph).toEqual({
      nodes: {
        Added: 'Added',
        Deleted: 'Deleted',
        Changed: 'Changed',
        Unchanged: 'Unchanged',
        Renamed: 'Renamed',
        'Changed/renamed': 'Changed/renamed',
      },
      links: [
        {
          source: 'Added',
          target: 'Deleted',
          linkProperty: 'hidden',
        },
        {
          source: 'Deleted',
          target: 'Changed',
          linkProperty: 'hidden',
        },
        {
          source: 'Changed',
          target: 'Unchanged',
          linkProperty: 'hidden',
        },
        {
          source: 'Unchanged',
          target: 'Renamed',
          linkProperty: 'hidden',
        },
        {
          source: 'Renamed',
          target: 'Changed/renamed',
          linkProperty: 'hidden',
        },
      ],
      initStateId: 'Changed/renamed',
      finalStateIds: ['Changed/renamed'],
    });
  });

  it('should throw error if state property is invalid', () => {
    component.diffData = {
      nodes: {
        1: {
          newestStateName: 'A',
          stateProperty: 'invalid',
          originalStateName: 'A',
        },
      },
      v2States: {},
      v1States: {},
      finalStateIds: [],
      v2InitStateId: 0,
      links: [],
      v1InitStateId: 0,
    };

    expect(() => component.ngOnInit()).toThrowError('Invalid state property.');
  });

  it(
    'should open state diff modal when user clicks on a state in' +
      ' difference graph',
    () => {
      class MockComponentInstance {
        compoenentInstance!: {
          newState: null;
          newStateName: 'A';
          oldState: null;
          oldStateName: 'B';
          headers: {
            leftPane: undefined;
            rightPane: undefined;
          };
        };
      }

      let spyObj = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockComponentInstance,
          result: Promise.resolve(),
        } as NgbModalRef;
      });

      component.ngOnInit();
      component.onClickStateInDiffGraph('2');

      expect(spyObj).toHaveBeenCalled();
    }
  );

  it(
    'should open state diff modal and return old and new states when' +
      ' when user clicks on a state in difference graph',
    () => {
      component.diffData = {
        nodes: {
          1: {
            newestStateName: 'A',
            stateProperty: 'changed',
            originalStateName: 'B',
          },
        },
        v2States: {
          A: {} as State,
          B: {} as State,
        },
        v1States: {
          A: {} as State,
          B: {} as State,
        },
        finalStateIds: [],
        v2InitStateId: 0,
        links: [],
        v1InitStateId: 0,
      };

      class MockComponentInstance {
        compoenentInstance!: {
          newState: {};
          newStateName: 'A';
          oldState: {};
          oldStateName: 'B';
          headers: {
            leftPane: undefined;
            rightPane: undefined;
          };
        };
      }

      let spyObj = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockComponentInstance,
          result: Promise.resolve(),
        } as NgbModalRef;
      });

      component.ngOnInit();
      component.onClickStateInDiffGraph('1');

      expect(spyObj).toHaveBeenCalled();
    }
  );

  it('should close state diff modal when user clicks cancel', () => {
    let spyObj = spyOn(ngbModal, 'open').and.callFake(() => {
      return {
        componentInstance: {},
        result: Promise.reject(),
      } as NgbModalRef;
    });

    component.ngOnInit();
    component.onClickStateInDiffGraph('2');

    expect(spyObj).toHaveBeenCalled();
  });
});
