// Copyright 2016 The Oppia Authors. All Rights Reserved.
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

import {TestBed} from '@angular/core/testing';
import {UndoRedoService} from './undo-redo.service';
import {
  Change,
  DomainObject as RealDomainObject,
} from 'domain/editor/undo_redo/change.model';

// Define test interfaces that satisfy the BackendChangeObject and DomainObject types.
// Using a simple collection change as it's one of the simplest change types.
interface BackendChangeObject {
  cmd: 'edit_collection_property';
  property_name: 'title';
  new_value: string;
  old_value: string;
}

// Using a minimal object that can pass as DomainObject for testing.
interface DomainObject {
  [key: string]: unknown;
}

describe('UndoRedoService', () => {
  let undoRedoService: UndoRedoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UndoRedoService],
    });
    undoRedoService = TestBed.inject(UndoRedoService);
  });

  const createBackendChangeObject = (value: string): BackendChangeObject => {
    return {
      cmd: 'edit_collection_property',
      property_name: 'title',
      new_value: value,
      old_value: 'old_' + value,
    };
  };

  const createChangeDomainObject = (
    backendObj: BackendChangeObject,
    applyFunc: () => void = () => {},
    reverseFunc: () => void = () => {}
  ) => {
    return new Change(backendObj, applyFunc, reverseFunc);
  };

  it('should apply a single change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    expect(undoRedoService.hasChanges()).toBeFalse();

    const fakeDomainObject: DomainObject = {domain_property_name: 'fake value'};
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc
    );

    undoRedoService.applyChange(
      changeDomainObject,
      fakeDomainObject as unknown as RealDomainObject
    );
    expect(undoRedoService.hasChanges()).toBeTrue();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
  });

  it('should be able to undo an applied change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');
    expect(undoRedoService.hasChanges()).toBeFalse();

    const fakeDomainObject: DomainObject = {domain_property_name: 'fake value'};
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );
    undoRedoService.applyChange(
      changeDomainObject,
      fakeDomainObject as unknown as RealDomainObject
    );

    expect(
      undoRedoService.undoChange(
        fakeDomainObject as unknown as RealDomainObject
      )
    ).toBeTrue();
    expect(undoRedoService.hasChanges()).toBeFalse();
    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
  });

  it('should be able to redo an undone change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');
    expect(undoRedoService.hasChanges()).toBeFalse();

    const fakeDomainObject: DomainObject = {domain_property_name: 'fake value'};
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );

    undoRedoService.applyChange(
      changeDomainObject,
      fakeDomainObject as unknown as RealDomainObject
    );
    undoRedoService.undoChange(fakeDomainObject as unknown as RealDomainObject);
    expect(
      undoRedoService.redoChange(
        fakeDomainObject as unknown as RealDomainObject
      )
    ).toBeTrue();
    expect(undoRedoService.hasChanges()).toBeTrue();
    expect(applyFunc.calls.count()).toEqual(2);
  });

  it('should not undo anything if no changes are applied', () => {
    const fakeDomainObject: DomainObject = {domain_property_name: 'fake value'};
    expect(
      undoRedoService.undoChange(
        fakeDomainObject as unknown as RealDomainObject
      )
    ).toBeFalse();
  });

  it('should not redo anything if no changes are undone', () => {
    const fakeDomainObject: DomainObject = {domain_property_name: 'fake value'};
    expect(
      undoRedoService.redoChange(
        fakeDomainObject as unknown as RealDomainObject
      )
    ).toBeFalse();
  });

  it('should clear changes without undoing them', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const fakeDomainObject: DomainObject = {domain_property_name: 'fake value'};
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc
    );

    undoRedoService.applyChange(
      changeDomainObject,
      fakeDomainObject as unknown as RealDomainObject
    );
    expect(undoRedoService.getChangeCount()).toEqual(1);

    undoRedoService.clearChanges();
    expect(undoRedoService.getChangeCount()).toEqual(0);
    expect(applyFunc.calls.count()).toEqual(1);
  });
});
