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
 * @fileoverview Unit tests for the ImprovementActionObjectFactory.
 */

describe('ImprovementActionObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.ImprovementActionObjectFactory =
      $injector.get('ImprovementActionObjectFactory');
  }));

  describe('.createNew', function() {
    it('stores the name and action', function(done) {
      var testFlag = false;
      var action = function() {
        testFlag = true;
      };
      var onActionCompletion = function() {
        expect(testFlag).toBe(true);
        done();
      };

      var improvementAction =
        this.ImprovementActionObjectFactory.createNew('Test', action);

      expect(improvementAction.getName()).toEqual('Test');
      improvementAction.performAction().then(onActionCompletion, done.fail);
    });
  });
});
