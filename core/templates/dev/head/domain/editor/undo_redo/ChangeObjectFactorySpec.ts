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

import { ChangeObjectFactory } from
  'domain/editor/undo_redo/ChangeObjectFactory.ts';

describe('Factory for Change domain objects', function() {
  let changeObjectFactory: ChangeObjectFactory = null;

  beforeEach(() => {
    changeObjectFactory = new ChangeObjectFactory();
  });

  it('should invoke no callbacks after creation', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var backendChangeObject = {
      property_name: 'value'
    };
    changeObjectFactory.create(backendChangeObject, applyFunc, reverseFunc);

    expect(applyFunc).not.toHaveBeenCalled();
    expect(reverseFunc).not.toHaveBeenCalled();
  });

  it('should invoke the apply callback when applied', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var backendChangeObject = {
      property_name: 'value'
    };
    var changeDomainObject = changeObjectFactory.create(
      backendChangeObject, applyFunc, reverseFunc);

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    changeDomainObject.applyChange(fakeDomainObject);

    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(reverseFunc).not.toHaveBeenCalled();
  });

  it('should invoke the reverse callback when reversed', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var backendChangeObject = {
      property_name: 'value'
    };
    var changeDomainObject = changeObjectFactory.create(
      backendChangeObject, applyFunc, reverseFunc);

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    changeDomainObject.reverseChange(fakeDomainObject);

    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(applyFunc).not.toHaveBeenCalled();
  });

  it('should not receive changes to the provided change backend object',
    function() {
      var backendChangeObject = {
        property_name: 'value'
      };
      var changeDomainObject = changeObjectFactory.create(
        backendChangeObject, function() {}, function() {});

      var returnedBackendObject = changeDomainObject.getBackendChangeObject();
      returnedBackendObject.property_name = 'new value';

      expect(changeDomainObject.getBackendChangeObject()).toEqual({
        property_name: 'value'
      });
    }
  );
});
