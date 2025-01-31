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
 * @fileoverview Unit tests for ExplorationPropertyService.
 */

import {TestBed, waitForAsync} from '@angular/core/testing';

import {ExplorationPropertyService} from 'pages/exploration-editor-page/services/exploration-property.service';
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';

import {ParamChangesObjectFactory} from 'domain/exploration/ParamChangesObjectFactory';
import {
  ParamSpecs,
  ParamSpecsObjectFactory,
} from 'domain/exploration/ParamSpecsObjectFactory';
import {ParamSpecObjectFactory} from 'domain/exploration/ParamSpecObjectFactory';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ParamChange} from 'domain/exploration/ParamChangeObjectFactory';

describe('Exploration Property Service', () => {
  let explorationPropertyService: ExplorationPropertyService;
  let paramChangesObjectFactory: ParamChangesObjectFactory;
  let paramSpecsObjectFactory: ParamSpecsObjectFactory;
  let paramSpecObjectFactory: ParamSpecObjectFactory;
  let changeListService: ChangeListService;
  let editExplorationPropertySpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    explorationPropertyService = TestBed.inject(ExplorationPropertyService);
    changeListService = TestBed.inject(ChangeListService);
    paramChangesObjectFactory = TestBed.inject(ParamChangesObjectFactory);
    paramSpecsObjectFactory = TestBed.inject(ParamSpecsObjectFactory);
    paramSpecObjectFactory = TestBed.inject(ParamSpecObjectFactory);

    editExplorationPropertySpy = spyOn(
      changeListService,
      'editExplorationProperty'
    ).and.returnValue();
  });

  it('should create a new exploration properties object', function () {
    expect(function () {
      explorationPropertyService.init('initial value');
    }).toThrowError('Exploration property name cannot be null.');

    explorationPropertyService.propertyName = 'property_1';
    explorationPropertyService.init('initial value');

    expect(explorationPropertyService.hasChanged()).toBe(false);
  });

  it('should overrides _normalize and _isValid methods', function () {
    let childToOverride = Object.create(explorationPropertyService);

    childToOverride._isValid = function (value: string) {
      return !!value;
    };

    childToOverride._normalize = function (value: string) {
      return value;
    };

    let overrideIsValidSpy = spyOn(
      childToOverride,
      '_isValid'
    ).and.callThrough();
    let overrideNormalizeSpy = spyOn(
      childToOverride,
      '_normalize'
    ).and.callThrough();

    childToOverride.propertyName = 'property_1';
    childToOverride.saveDisplayedValue();

    expect(overrideIsValidSpy).toHaveBeenCalled();
    expect(overrideNormalizeSpy).toHaveBeenCalled();
  });

  it('should save the displayed value when init is not called', () => {
    explorationPropertyService.propertyName = null;

    expect(() => {
      explorationPropertyService.saveDisplayedValue();
    }).toThrowError('Exploration property name cannot be null.');

    explorationPropertyService.propertyName = 'property_1';
    explorationPropertyService.saveDisplayedValue();

    explorationPropertyService.hasChanged();
  });

  it("should not save the displayed value when it's empty", function () {
    let child = Object.create(explorationPropertyService);
    child.propertyName = 'property_1';

    child._isValid = function (value: string) {
      if (!value) {
        throw new Error('this.displayed should have a valid value.');
      }
      return Boolean(value);
    };

    child.init();
    expect(function () {
      child.saveDisplayedValue();
    }).toThrowError('this.displayed should have a valid value.');

    // Then init with a value.
    child.init('initial value');
    child.saveDisplayedValue();
    expect(child.hasChanged()).toBe(false);
  });

  it('should save displayed value when is ParamChanges object', function () {
    let child = Object.create(explorationPropertyService);
    child.propertyName = 'param_changes';
    child._normalize = function (paramChanges: ParamChange[]) {
      // Changing paramChanges so hasChanged() turns to be true on line 87.
      paramChanges.forEach(function (paramChange: ParamChange) {
        paramChange.resetCustomizationArgs();
      });
      return paramChanges;
    };

    let normalizeSpy = spyOn(child, '_normalize').and.callThrough();

    child.init(
      paramChangesObjectFactory.createFromBackendList([
        {
          customization_args: {
            parse_with_jinja: true,
            value: '',
          },
          generator_id: 'Copier',
          name: 'Param change 1',
        },
        {
          customization_args: {
            parse_with_jinja: true,
            value: '',
          },
          generator_id: 'RandomSelector',
          name: 'Param change 2',
        },
      ])
    );
    child.saveDisplayedValue();

    expect(normalizeSpy).toHaveBeenCalled();
    expect(editExplorationPropertySpy).toHaveBeenCalled();
    expect(child.hasChanged()).toBe(false);
  });

  it('should save displayed value when is ParamSpecs object', function () {
    let child = Object.create(explorationPropertyService);
    child.propertyName = 'param_specs';
    child._normalize = function (paramSpecs: ParamSpecs) {
      // Changing paramSpecs so hasChanged() turns to be true on line 87.
      let paramSpec = paramSpecObjectFactory.createDefault();
      paramSpecs.addParamIfNew('z', paramSpec);
      return paramSpecs;
    };

    let normalizeSpy = spyOn(child, '_normalize').and.callThrough();

    child.init(
      paramSpecsObjectFactory.createFromBackendDict({
        x: {
          obj_type: 'UnicodeString',
        },
        y: {
          obj_type: 'UnicodeString',
        },
      })
    );
    child.saveDisplayedValue();

    expect(normalizeSpy).toHaveBeenCalled();
    expect(editExplorationPropertySpy).toHaveBeenCalled();
    expect(child.hasChanged()).toBe(false);
  });

  it(
    'should return stream of observables when exploration' +
      ' property is changed',
    () => {
      let count = 0;
      let subscription =
        explorationPropertyService.onExplorationPropertyChanged;
      subscription.subscribe(event => {
        expect(event).toBe(null);
        count++;
      });

      explorationPropertyService._explorationPropertyChangedEventEmitter.emit(
        null
      );
      explorationPropertyService._explorationPropertyChangedEventEmitter.emit(
        null
      );
      explorationPropertyService._explorationPropertyChangedEventEmitter.emit(
        null
      );

      waitForAsync(() => {
        expect(count).toBe(3);
      });
    }
  );
});
