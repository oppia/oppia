// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Param Specs object factory.
 */

import { ParamTypeObjectFactory } from
  'domain/exploration/ParamTypeObjectFactory.ts';

require('domain/exploration/ParamSpecObjectFactory.ts');
require('domain/exploration/ParamSpecsObjectFactory.ts');

describe('ParamSpecs', function() {
  var ParamSpecsObjectFactory = null;
  var ParamSpecObjectFactory = null;
  var emptyParamSpecs = null;
  var paramName = 'x';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ParamTypeObjectFactory', new ParamTypeObjectFactory());
  }));
  beforeEach(angular.mock.inject(function($injector) {
    ParamSpecsObjectFactory = $injector.get('ParamSpecsObjectFactory');
    ParamSpecObjectFactory = $injector.get('ParamSpecObjectFactory');
    emptyParamSpecs = ParamSpecsObjectFactory.createFromBackendDict({});
  }));

  it('should be undefined for missing param names', function() {
    expect(emptyParamSpecs.getParamDict()[paramName]).not.toBeDefined();
  });

  it('should add param when missing', function() {
    var paramSpec = ParamSpecObjectFactory.createDefault();

    expect(emptyParamSpecs.addParamIfNew(paramName, paramSpec)).toBe(true);
    // No longer empty.
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(paramSpec);
  });

  it('should not overwrite existing params', function() {
    var oldParamSpec = ParamSpecObjectFactory.createDefault();
    expect(emptyParamSpecs.addParamIfNew(paramName, oldParamSpec)).toBe(true);
    // No longer empty.
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(oldParamSpec);

    var newParamSpec = ParamSpecObjectFactory.createDefault();
    expect(emptyParamSpecs.addParamIfNew(paramName, newParamSpec)).toBe(false);
    expect(emptyParamSpecs.getParamDict()[paramName]).not.toBe(newParamSpec);
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(oldParamSpec);
  });
});
