// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for UnderscoresToCamelCasePipe for Oppia.
 */

import { UnderscoresToCamelCasePipe } from
  'filters/string-utility-filters/underscores-to-camel-case.pipe';

describe('Testing filters', function() {
  let underscoresToCamelCase: UnderscoresToCamelCasePipe;
  beforeEach(() => {
    underscoresToCamelCase = new UnderscoresToCamelCasePipe();
  });

  it('should have all expected filters', () => {
    expect(underscoresToCamelCase).not.toEqual(null);
  });

  it('should convert underscores to camelCase properly', () => {
    expect(underscoresToCamelCase.transform('Test')).toEqual('Test');
    expect(underscoresToCamelCase.transform('test')).toEqual('test');
    expect(underscoresToCamelCase.transform('test_app')).toEqual('testApp');
    expect(underscoresToCamelCase.transform('Test_App_Two'))
      .toEqual('TestAppTwo');
    expect(underscoresToCamelCase.transform('test_App_Two'))
      .toEqual('testAppTwo');
    expect(underscoresToCamelCase.transform('test_app_two'))
      .toEqual('testAppTwo');
    expect(underscoresToCamelCase.transform('test__App')).toEqual('testApp');
    // Trailing underscores at the beginning and end should never happen --
    // they will give weird results.
    expect(underscoresToCamelCase.transform('_test_App')).toEqual('TestApp');
    expect(underscoresToCamelCase.transform('__Test_ App_'))
      .toEqual('Test App_');
  });
});
