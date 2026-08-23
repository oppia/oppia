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
  BackendChangeObject,
  DomainObject,
} from 'domain/editor/undo_redo/change.model';

describe('UndoRedoService', () => {
  let undoRedoService: UndoRedoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UndoRedoService],
    });
    undoRedoService = TestBed.inject(UndoRedoService);
  });

  const createBackendChangeObject = (value: string): BackendChangeObject => {
    return {property_name: value} as BackendChangeObject;
  };

  const createChangeDomainObject = (
    backendObj: BackendChangeObject,
    applyFunc: (
      backendChangeObject: BackendChangeObject,
      domainObject: DomainObject
    ) => void = () => {},
    reverseFunc: (
      backendChangeObject: BackendChangeObject,
      domainObject: DomainObject
    ) => void = () => {}
  ) => {
    return new Change(backendObj, applyFunc, reverseFunc);
  };

  it('should apply a single change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    expect(undoRedoService.hasChanges()).toBe(false);

    const fakeDomainObject = {
      domain_property_name: 'fake value',
    } as unknown as DomainObject;
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc
    );

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.hasChanges()).toBe(true);
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
  });

  it('should be able to undo an applied change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');
    expect(undoRedoService.hasChanges()).toBe(false);

    const fakeDomainObject = {
      domain_property_name: 'fake value',
    } as unknown as DomainObject;
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );
    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(undoRedoService.undoChange(fakeDomainObject)).toBe(true);
    expect(undoRedoService.hasChanges()).toBe(false);
    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject,
      fakeDomainObject
    );
  });

  it('should be able to redo an undone change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');
    expect(undoRedoService.hasChanges()).toBe(false);

    const fakeDomainObject = {
      domain_property_name: 'fake value',
    } as unknown as DomainObject;
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc,
      reverseFunc
    );

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    undoRedoService.undoChange(fakeDomainObject);
    expect(undoRedoService.redoChange(fakeDomainObject)).toBe(true);
    expect(undoRedoService.hasChanges()).toBe(true);
    expect(applyFunc.calls.count()).toEqual(2);
  });

  it('should not undo anything if no changes are applied', () => {
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    } as unknown as DomainObject;
    expect(undoRedoService.undoChange(fakeDomainObject)).toBe(false);
  });

  it('should not redo anything if no changes are undone', () => {
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    } as unknown as DomainObject;
    expect(undoRedoService.redoChange(fakeDomainObject)).toBe(false);
  });

  it('should clear changes without undoing them', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const fakeDomainObject = {
      domain_property_name: 'fake value',
    } as unknown as DomainObject;
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject,
      applyFunc
    );

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.getChangeCount()).toEqual(1);

    undoRedoService.clearChanges();
    expect(undoRedoService.getChangeCount()).toEqual(0);
    expect(applyFunc.calls.count()).toEqual(1);
  });
});
