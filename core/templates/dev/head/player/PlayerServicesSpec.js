// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for services for the exploration player page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Learner parameters service', function() {
  beforeEach(module('oppia'));

  describe('learner params service', function() {
    var learnerParamsService = null;

    beforeEach(inject(function($injector) {
      learnerParamsService = $injector.get('learnerParamsService');
    }));

    it('should correctly initialize parameters', function() {
      expect(learnerParamsService.getAllParams()).toEqual({});
      learnerParamsService.init({
        a: 'b'
      });
      expect(learnerParamsService.getAllParams()).toEqual({
        a: 'b'
      });
    });

    it('should correctly get and set parameters', function() {
      learnerParamsService.init({
        a: 'b'
      });
      expect(learnerParamsService.getValue('a')).toEqual('b');
      learnerParamsService.setValue('a', 'c');
      expect(learnerParamsService.getValue('a')).toEqual('c');
    });

    it('should not get an invalid parameter', function() {
      learnerParamsService.init({
        a: 'b'
      });
      expect(function() {
        learnerParamsService.getValue('b');
      }).toThrow(new Error('Invalid parameter name: b'));
    });

    it('should not set an invalid parameter', function() {
      learnerParamsService.init({
        a: 'b'
      });
      expect(function() {
        learnerParamsService.setValue('b', 'c');
      }).toThrow(new Error('Cannot set unknown parameter: b'));
    });
  });
});
