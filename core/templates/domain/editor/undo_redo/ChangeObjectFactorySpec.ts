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
 * @fileoverview Tests for ChangeObjectFactory.
 */

import { BackendChangeObject, ChangeObjectFactory } from
  'domain/editor/undo_redo/ChangeObjectFactory';

describe('Factory for Change domain objects', () => {
  let changeObjectFactory: ChangeObjectFactory = null;

  beforeEach(() => {
    changeObjectFactory = new ChangeObjectFactory();
  });

  it('should invoke no callbacks after creation', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    const backendChangeObject: BackendChangeObject = {
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    };
    changeObjectFactory.create(backendChangeObject, applyFunc, reverseFunc);

    expect(applyFunc).not.toHaveBeenCalled();
    expect(reverseFunc).not.toHaveBeenCalled();
  });

  it('should invoke the apply callback when applied', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    const backendChangeObject: BackendChangeObject = {
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    };
    const changeDomainObject = changeObjectFactory.create(
      backendChangeObject, applyFunc, reverseFunc);

    const fakeDomainObject: BackendChangeObject = {
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    };
    changeDomainObject.applyChange(fakeDomainObject);

    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(reverseFunc).not.toHaveBeenCalled();
  });

  it('should invoke the reverse callback when reversed', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');

    const backendChangeObject: BackendChangeObject = {
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    };
    const changeDomainObject = changeObjectFactory.create(
      backendChangeObject, applyFunc, reverseFunc);

    const fakeDomainObject: BackendChangeObject = {
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    };
    changeDomainObject.reverseChange(fakeDomainObject);

    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(applyFunc).not.toHaveBeenCalled();
  });

  it('should not receive changes to the provided change backend object',
    () => {
      const backendChangeObject: BackendChangeObject = {
        cmd: 'update_question_property',
        property_name: 'language_code',
        new_value: 'newVal',
        old_value: 'oldVal'
      };
      const changeDomainObject = changeObjectFactory.create(
        backendChangeObject, () => {}, () => {});

      const returnedBackendObject = changeDomainObject.getBackendChangeObject();
      (<typeof backendChangeObject> returnedBackendObject)
        .property_name = 'language_code';

      expect(changeDomainObject.getBackendChangeObject()).toEqual({
        cmd: 'update_question_property',
        property_name: 'language_code',
        new_value: 'newVal',
        old_value: 'oldVal'
      });
    });

  it('should set new backend change object when using specific method', () => {
    const changeDomainObject = changeObjectFactory.create({
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    }, () => {}, () => {});

    expect(changeDomainObject.getBackendChangeObject()).toEqual({
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    });

    changeDomainObject.setBackendChangeObject({
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    });

    expect(changeDomainObject.getBackendChangeObject()).toEqual({
      cmd: 'update_question_property',
      property_name: 'language_code',
      new_value: 'newVal',
      old_value: 'oldVal'
    });
  });
});
