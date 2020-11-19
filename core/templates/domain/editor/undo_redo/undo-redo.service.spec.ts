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
 * @fileoverview Tests for UndoRedoService.
 */
import { TestBed } from '@angular/core/testing';

import { Change } from 'domain/editor/undo_redo/change.model';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';

describe('Undo/Redo Service', () => {
  let undoRedoService: UndoRedoService = null;

  beforeEach(() => {
    undoRedoService = TestBed.get(UndoRedoService);
  });

  const _createBackendChangeObject = (value) => {
    return {
      roperty_name: value,
    };
  };

  const _createChangeDomainObject = (
      backendObj,
      applyFunc = () => {},
      reverseFunc = () => {}
  ) => new Change(backendObj, applyFunc, reverseFunc);

  const _createNoOpChangeDomainObject = (value) => {
    const backendObject = _createBackendChangeObject(value);
    return _createChangeDomainObject(backendObject);
  };

  it('should apply a single change', () => {
    const applyFunc = jasmine.createSpy('applyChange');

    expect(undoRedoService.hasChanges()).toBeFalsy();

    const fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    const backendChangeObject = _createBackendChangeObject('value');
    const changeDomainObject = _createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      () => {}
    );
    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(undoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
  });

  it('should be able to undo an applied change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    expect(undoRedoService.hasChanges()).toBeFalsy();

    // Apply the initial change.
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };
    const backendChangeObject = _createBackendChangeObject('value');
    const changeDomainObject = _createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );
    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(undoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );

    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(undoRedoService.hasChanges()).toBeFalsy();
    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
  });

  it('should be able to redo an undone change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    expect(undoRedoService.hasChanges()).toBeFalsy();

    // Apply the initial change.
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };
    const backendChangeObject = _createBackendChangeObject('value');
    const changeDomainObject = _createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );
    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
    expect(undoRedoService.hasChanges()).toBeFalsy();

    expect(undoRedoService.redoChange(fakeDomainObject)).toBeTruthy();
    expect(undoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );

    // Apply must be called twice (once for the first apply and once for redo).
    expect(applyFunc.calls.count()).toEqual(2);
  });

  it('should not undo anything if no changes are applied', () => {
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };

    expect(undoRedoService.hasChanges()).toBeFalsy();
    expect(undoRedoService.undoChange(fakeDomainObject)).toBeFalsy();
  });

  it('should not redo anything if no changes are undone', () => {
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };

    expect(undoRedoService.hasChanges()).toBeFalsy();
    expect(undoRedoService.redoChange(fakeDomainObject)).toBeFalsy();

    const changeDomainObject = _createNoOpChangeDomainObject('value');
    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.redoChange(fakeDomainObject)).toBeFalsy();
  });

  it('should only clear the list on clear and not undo changes', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };
    const backendChangeObject = _createBackendChangeObject('value');
    const changeDomainObject = _createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );

    expect(undoRedoService.getChangeCount()).toEqual(0);

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.getChangeCount()).toEqual(1);

    undoRedoService.clearChanges();
    expect(undoRedoService.getChangeCount()).toEqual(0);

    expect(applyFunc).toHaveBeenCalled();
    expect(reverseFunc).not.toHaveBeenCalled();
    expect(applyFunc.calls.count()).toEqual(1);
  });

  it('should undo changes in the reverse order of applying', () => {
    const appliedChanges = [];
    const reversedChanges = [];

    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };
    const backendChangeObject1 = _createBackendChangeObject('value1');
    const changeDomainObject1 = _createChangeDomainObject(
      backendChangeObject1,
      () => {
        appliedChanges.push('change1');
      },
      () => {
        reversedChanges.push('change1');
      }
    );

    const backendChangeObject2 = _createBackendChangeObject('value2');
    const changeDomainObject2 = _createChangeDomainObject(
      backendChangeObject2,
      () => {
        appliedChanges.push('change2');
      },
      () => {
        reversedChanges.push('change2');
      }
    );

    const backendChangeObject3 = _createBackendChangeObject('value3');
    const changeDomainObject3 = _createChangeDomainObject(
      backendChangeObject3,
      () => {
        appliedChanges.push('change3');
      },
      () => {
        reversedChanges.push('change3');
      }
    );

    expect(appliedChanges).toEqual([]);
    expect(reversedChanges).toEqual([]);

    undoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
    undoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
    undoRedoService.applyChange(changeDomainObject3, fakeDomainObject);

    expect(appliedChanges).toEqual(['change1', 'change2', 'change3']);
    expect(reversedChanges).toEqual([]);
    expect(undoRedoService.getChangeCount()).toEqual(3);

    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    expect(appliedChanges).toEqual(['change1', 'change2', 'change3']);
    expect(reversedChanges).toEqual(['change3', 'change2', 'change1']);
    expect(undoRedoService.getChangeCount()).toEqual(0);
  });

  it('should not be able to redo after applying a new change after undo',
    () => {
      expect(undoRedoService.getChangeCount()).toEqual(0);

      const fakeDomainObject = {
        domain_property_name: 'fake value',
      };
      const changeDomainObject1 = _createNoOpChangeDomainObject('value1');
      const changeDomainObject2 = _createNoOpChangeDomainObject('value2');
      const changeDomainObject3 = _createNoOpChangeDomainObject('value3');

      undoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      undoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
      expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

      undoRedoService.applyChange(changeDomainObject3, fakeDomainObject);
      expect(undoRedoService.redoChange(fakeDomainObject)).toBeFalsy();

      expect(undoRedoService.getChangeCount()).toEqual(2);
    });

  it('should have an empty change list with no changes', () => {
    expect(undoRedoService.hasChanges()).toBeFalsy();
    expect(undoRedoService.getChangeList()).toEqual([]);
  });

  it('should build a change list from only applied changes', () => {
    expect(undoRedoService.getChangeCount()).toEqual(0);

    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };
    const changeDomainObject1 = _createNoOpChangeDomainObject('value1');
    const changeDomainObject2 = _createNoOpChangeDomainObject('value2');
    const changeDomainObject3 = _createNoOpChangeDomainObject('value3');

    undoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
    undoRedoService.applyChange(changeDomainObject3, fakeDomainObject);
    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    undoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
    expect(undoRedoService.getChangeCount()).toEqual(2);

    const changeList = undoRedoService.getChangeList();
    expect(changeList).toEqual([changeDomainObject2, changeDomainObject1]);
  });

  it('should return a change list whose mutations do not change the service',
    () => {
      const fakeDomainObject = {
        domain_property_name: 'fake value',
      };
      const changeDomainObject1 = _createNoOpChangeDomainObject('value1');
      const changeDomainObject2 = _createNoOpChangeDomainObject('value2');

      undoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      undoRedoService.applyChange(changeDomainObject2, fakeDomainObject);

      const changeList = undoRedoService.getChangeList();
      expect(changeList).toEqual([changeDomainObject1, changeDomainObject2]);
      expect(undoRedoService.getChangeCount()).toEqual(2);

      // Change the returned change list, which should be a copy.
      changeList.splice(0, 1);
      expect(undoRedoService.getChangeCount()).toEqual(2);

      const origChangeList = undoRedoService.getChangeList();
      expect(origChangeList).toEqual(
        [changeDomainObject1, changeDomainObject2]);
    });

  it('should build a committable change list with one change', () => {
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    };
    const backendChangeObject = _createBackendChangeObject('value');
    const changeDomainObject = _createChangeDomainObject(backendChangeObject);

    expect(undoRedoService.getCommittableChangeList()).toEqual([]);

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.getCommittableChangeList()).toEqual(
      [backendChangeObject,
      ]);
  });

  it('should build a committable change list in the order of applied changes',
    () => {
    // Perform a series of complex operations to build the committable change
    // list. Apply 3 changes, undo two, redo one, and apply one.
      const fakeDomainObject = {
        domain_property_name: 'fake value',
      };
      const backendChangeObject1 = _createBackendChangeObject('value1');
      const backendChangeObject2 = _createBackendChangeObject('value2');
      const backendChangeObject3 = _createBackendChangeObject('value3');
      const backendChangeObject4 = _createBackendChangeObject('value4');
      const changeDomainObject1 = _createChangeDomainObject(
        backendChangeObject1);
      const changeDomainObject2 = _createChangeDomainObject(
        backendChangeObject2);
      const changeDomainObject3 = _createChangeDomainObject(
        backendChangeObject3);
      const changeDomainObject4 = _createChangeDomainObject(
        backendChangeObject4);

      expect(undoRedoService.getChangeCount()).toEqual(0);

      undoRedoService.applyChange(changeDomainObject4, fakeDomainObject);
      undoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
      undoRedoService.applyChange(changeDomainObject3, fakeDomainObject);

      expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
      expect(undoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
      expect(undoRedoService.redoChange(fakeDomainObject)).toBeTruthy();

      undoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      expect(undoRedoService.getChangeCount()).toEqual(3);

      expect(undoRedoService.getCommittableChangeList()).toEqual([
        backendChangeObject4,
        backendChangeObject2,
        backendChangeObject1,
      ]);
    });
});
