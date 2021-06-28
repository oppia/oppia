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

// TODO(#7222): Remove the following block of unnnecessary imports once
// undo-redo.service.ts is upgraded to Angular 8.
import { Change } from 'domain/editor/undo_redo/change.model';
import { UpgradedServices } from 'services/UpgradedServices';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

describe('Undo/Redo Service', function() {
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    UndoRedoService = $injector.get('UndoRedoService');
  }));

  var _createBackendChangeObject = function(value) {
    return {
      roperty_name: value
    };
  };

  var _createChangeDomainObject = function(
      backendObj, applyFunc = function() {}, reverseFunc = function() {}) {
    return new Change(backendObj, applyFunc, reverseFunc);
  };

  var _createNoOpChangeDomainObject = function(value) {
    var backendObject = _createBackendChangeObject(value);
    return _createChangeDomainObject(backendObject);
  };

  it('should apply a single change', function() {
    var applyFunc = jasmine.createSpy('applyChange');

    expect(UndoRedoService.hasChanges()).toBeFalsy();

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, function() {});
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(UndoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
  });

  it('should be able to undo an applied change', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    expect(UndoRedoService.hasChanges()).toBeFalsy();

    // Apply the initial change.
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc);
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(UndoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);

    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
  });

  it('should be able to redo an undone change', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    expect(UndoRedoService.hasChanges()).toBeFalsy();

    // Apply the initial change.
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc);
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(UndoRedoService.hasChanges()).toBeFalsy();

    expect(UndoRedoService.redoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);

    // Apply must be called twice (once for the first apply and once for redo).
    expect(applyFunc.calls.count()).toEqual(2);
  });

  it('should not undo anything if no changes are applied', function() {
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };

    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeFalsy();
  });

  it('should not redo anything if no changes are undone', function() {
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };

    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(UndoRedoService.redoChange(fakeDomainObject)).toBeFalsy();

    var changeDomainObject = _createNoOpChangeDomainObject('value');
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.redoChange(fakeDomainObject)).toBeFalsy();
  });

  it('should only clear the list on clear and not undo changes', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc);

    expect(UndoRedoService.getChangeCount()).toEqual(0);

    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.getChangeCount()).toEqual(1);

    UndoRedoService.clearChanges();
    expect(UndoRedoService.getChangeCount()).toEqual(0);

    expect(applyFunc).toHaveBeenCalled();
    expect(reverseFunc).not.toHaveBeenCalled();
    expect(applyFunc.calls.count()).toEqual(1);
  });

  it('should undo changes in the reverse order of applying', function() {
    var appliedChanges = [];
    var reversedChanges = [];

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject1 = _createBackendChangeObject('value1');
    var changeDomainObject1 = _createChangeDomainObject(
      backendChangeObject1, function() {
        appliedChanges.push('change1');
      }, function() {
        reversedChanges.push('change1');
      });

    var backendChangeObject2 = _createBackendChangeObject('value2');
    var changeDomainObject2 = _createChangeDomainObject(
      backendChangeObject2, function() {
        appliedChanges.push('change2');
      }, function() {
        reversedChanges.push('change2');
      });

    var backendChangeObject3 = _createBackendChangeObject('value3');
    var changeDomainObject3 = _createChangeDomainObject(
      backendChangeObject3, function() {
        appliedChanges.push('change3');
      }, function() {
        reversedChanges.push('change3');
      });

    expect(appliedChanges).toEqual([]);
    expect(reversedChanges).toEqual([]);

    UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
    UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
    UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);

    expect(appliedChanges).toEqual(['change1', 'change2', 'change3']);
    expect(reversedChanges).toEqual([]);
    expect(UndoRedoService.getChangeCount()).toEqual(3);

    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    expect(appliedChanges).toEqual(['change1', 'change2', 'change3']);
    expect(reversedChanges).toEqual(['change3', 'change2', 'change1']);
    expect(UndoRedoService.getChangeCount()).toEqual(0);
  });

  it('should not be able to redo after applying a new change after undo',
    function() {
      expect(UndoRedoService.getChangeCount()).toEqual(0);

      var fakeDomainObject = {
        domain_property_name: 'fake value'
      };
      var changeDomainObject1 = _createNoOpChangeDomainObject('value1');
      var changeDomainObject2 = _createNoOpChangeDomainObject('value2');
      var changeDomainObject3 = _createNoOpChangeDomainObject('value3');

      UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
      expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

      UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);
      expect(UndoRedoService.redoChange(fakeDomainObject)).toBeFalsy();

      expect(UndoRedoService.getChangeCount()).toEqual(2);
    }
  );

  it('should have an empty change list with no changes', function() {
    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(UndoRedoService.getChangeList()).toEqual([]);
  });

  it('should build a change list from only applied changes', function() {
    expect(UndoRedoService.getChangeCount()).toEqual(0);

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var changeDomainObject1 = _createNoOpChangeDomainObject('value1');
    var changeDomainObject2 = _createNoOpChangeDomainObject('value2');
    var changeDomainObject3 = _createNoOpChangeDomainObject('value3');

    UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
    UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
    expect(UndoRedoService.getChangeCount()).toEqual(2);

    var changeList = UndoRedoService.getChangeList();
    expect(changeList).toEqual([changeDomainObject2, changeDomainObject1]);
  });

  it('should return a change list whose mutations do not change the service',
    function() {
      var fakeDomainObject = {
        domain_property_name: 'fake value'
      };
      var changeDomainObject1 = _createNoOpChangeDomainObject('value1');
      var changeDomainObject2 = _createNoOpChangeDomainObject('value2');

      UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);

      var changeList = UndoRedoService.getChangeList();
      expect(changeList).toEqual([changeDomainObject1, changeDomainObject2]);
      expect(UndoRedoService.getChangeCount()).toEqual(2);

      // Change the returned change list, which should be a copy.
      changeList.splice(0, 1);
      expect(UndoRedoService.getChangeCount()).toEqual(2);

      var origChangeList = UndoRedoService.getChangeList();
      expect(origChangeList)
        .toEqual([changeDomainObject1, changeDomainObject2]);
    }
  );

  it('should build a committable change list with one change', function() {
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(backendChangeObject);

    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);

    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([
      backendChangeObject
    ]);
  });

  it('should build a committable change list in the order of applied changes',
    function() {
      // Perform a series of complex operations to build the committable change
      // list. Apply 3 changes, undo two, redo one, and apply one.
      var fakeDomainObject = {
        domain_property_name: 'fake value'
      };
      var backendChangeObject1 = _createBackendChangeObject('value1');
      var backendChangeObject2 = _createBackendChangeObject('value2');
      var backendChangeObject3 = _createBackendChangeObject('value3');
      var backendChangeObject4 = _createBackendChangeObject('value4');
      var changeDomainObject1 = _createChangeDomainObject(backendChangeObject1);
      var changeDomainObject2 = _createChangeDomainObject(backendChangeObject2);
      var changeDomainObject3 = _createChangeDomainObject(backendChangeObject3);
      var changeDomainObject4 = _createChangeDomainObject(backendChangeObject4);

      expect(UndoRedoService.getChangeCount()).toEqual(0);

      UndoRedoService.applyChange(changeDomainObject4, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);

      expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
      expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
      expect(UndoRedoService.redoChange(fakeDomainObject)).toBeTruthy();

      UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      expect(UndoRedoService.getChangeCount()).toEqual(3);

      expect(UndoRedoService.getCommittableChangeList()).toEqual([
        backendChangeObject4, backendChangeObject2, backendChangeObject1
      ]);
    }
  );
});
