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
 * @fileoverview Tests for StatusObjectFactory.
 */

describe('StatusObjectFactory', function() {
  beforeEach(module('oppia'));

  var status, StatusObjectFactory;

  beforeEach(inject(function($injector) {
    StatusObjectFactory = $injector.get('StatusObjectFactory');
  }));

  it('should create success status', function() {
    status = StatusObjectFactory.createSuccess('Success status test');
    expect(status.getValue()).toBe(true);
    expect(status.getReason()).toBe('Success status test');
  });

  it('should create failure status', function() {
    status = StatusObjectFactory.createFailure('Failure status test');
    expect(status.getValue()).toBe(false);
    expect(status.getReason()).toBe('Failure status test');
  });
});
