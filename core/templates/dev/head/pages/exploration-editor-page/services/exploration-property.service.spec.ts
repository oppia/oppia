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

import { UpgradedServices } from 'services/UpgradedServices';

require('pages/exploration-editor-page/services/exploration-property.service');
require('pages/exploration-editor-page/services/change-list.service');
require('domain/exploration/ParamChangesObjectFactory');
require('domain/exploration/ParamSpecsObjectFactory');
require('domain/exploration/ParamSpecObjectFactory');


describe('Exploration Property Service', function() {
  var ExplorationPropertyService;
  var ParamChangesObjectFactory;
  var ParamSpecsObjectFactory;
  var ParamSpecObjectFactory;
  var ChangeListService;
  var editExplorationPropertySpy;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(function() {
    angular.mock.module('oppia', function($provide) {
      $provide.value('ExplorationDataService', {
        autosaveChangeList: function() {}
      });
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    ExplorationPropertyService = $injector.get('ExplorationPropertyService');
    ParamChangesObjectFactory = $injector.get('ParamChangesObjectFactory');
    ParamSpecsObjectFactory = $injector.get('ParamSpecsObjectFactory');
    ParamSpecObjectFactory = $injector.get('ParamSpecObjectFactory');
    ChangeListService = $injector.get('ChangeListService');

    editExplorationPropertySpy = spyOn(
      ChangeListService, 'editExplorationProperty').and.callThrough();
  }));

  it('should create a new exploration properties object', function() {
    expect(function() {
      ExplorationPropertyService.init('initial value');
    }).toThrow('Exploration property name cannot be null.');

    ExplorationPropertyService.propertyName = 'property_1';
    ExplorationPropertyService.init('initial value');

    expect(ExplorationPropertyService.hasChanged()).toBe(false);
  });

  it('should overrides _normalize and _isValid methods', function() {
    var childToOverride = Object.create(ExplorationPropertyService);

    childToOverride._isValid = function(value) {
      return !!value;
    };

    childToOverride._normalize = function(value) {
      return value;
    };

    var overrideIsValidSpy = spyOn(childToOverride, '_isValid').and
      .callThrough();
    var overrideNormalizeSpy = spyOn(childToOverride, '_normalize').and
      .callThrough();

    childToOverride.propertyName = 'property_1';
    childToOverride.saveDisplayedValue();

    expect(overrideIsValidSpy).toHaveBeenCalled();
    expect(overrideNormalizeSpy).toHaveBeenCalled();
  });

  it('should save the displayed value when init is not called', function() {
    expect(function() {
      ExplorationPropertyService.saveDisplayedValue();
    }).toThrow('Exploration property name cannot be null.');

    ExplorationPropertyService.propertyName = 'property_1';
    ExplorationPropertyService.saveDisplayedValue();

    ExplorationPropertyService.hasChanged(false);
  });

  it('should not save the displayed value when it\'s empty', function() {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'property_1';

    child._isValid = function(value) {
      if (!value) {
        throw Error('this.displayed should have a valid value.');
      }
      return Boolean(value);
    };

    child.init();
    expect(function() {
      child.saveDisplayedValue();
    }).toThrow(Error('this.displayed should have a valid value.'));

    // Then init with a value
    child.init('initial value');
    child.saveDisplayedValue();
    expect(child.hasChanged()).toBe(false);
  });

  it('should save displayed value when is ParamChanges object', function() {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'param_changes';
    child._normalize = function(paramChanges) {
      // Changing paramChanges so hasChanged() turns to be true on line 87.
      paramChanges.forEach(function(paramChange) {
        paramChange.resetCustomizationArgs();
      });
      return paramChanges;
    };

    var normalizeSpy = spyOn(child, '_normalize').and
      .callThrough();

    child.init(ParamChangesObjectFactory.createFromBackendList([{
      customization_args: {
        parse_with_jinja: true,
        value: ''
      },
      generator_id: 'Copier',
      name: 'Param change 1'
    }, {
      customization_args: {
        parse_with_jinja: true,
        value: ''
      },
      generator_id: 'RandomSelector',
      name: 'Param change 2'
    }]));
    child.saveDisplayedValue();

    expect(normalizeSpy).toHaveBeenCalled();
    expect(editExplorationPropertySpy).toHaveBeenCalled();
    expect(child.hasChanged()).toBe(false);
  });

  it('should save displayed value when is ParamSpecs object', function() {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'param_specs';
    child._normalize = function(paramSpecs) {
      // Changing paramSpecs so hasChanged() turns to be true on line 87.
      var paramSpec = ParamSpecObjectFactory.createDefault();
      paramSpecs.addParamIfNew('z', paramSpec);
      return paramSpecs;
    };

    var normalizeSpy = spyOn(child, '_normalize').and
      .callThrough();

    child.init(ParamSpecsObjectFactory.createFromBackendDict({
      x: {
        obj_type: 'UnicodeString'
      },
      y: {
        obj_type: 'UnicodeString'
      }
    }));
    child.saveDisplayedValue();

    expect(normalizeSpy).toHaveBeenCalled();
    expect(editExplorationPropertySpy).toHaveBeenCalled();
    expect(child.hasChanged()).toBe(false);
  });
});
