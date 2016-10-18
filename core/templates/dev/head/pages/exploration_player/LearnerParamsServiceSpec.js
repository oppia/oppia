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
 * @fileoverview Unit tests for the learner parameters service.
 */

describe('Learner parameters service', function() {
  beforeEach(module('oppia'));

  describe('learner params service', function() {
    var LearnerParamsService = null;

    beforeEach(inject(function($injector) {
      LearnerParamsService = $injector.get('LearnerParamsService');
    }));

    it('should correctly initialize parameters', function() {
      expect(LearnerParamsService.getAllParams()).toEqual({});
      LearnerParamsService.init({
        a: 'b'
      });
      expect(LearnerParamsService.getAllParams()).toEqual({
        a: 'b'
      });
    });

    it('should correctly get and set parameters', function() {
      LearnerParamsService.init({
        a: 'b'
      });
      expect(LearnerParamsService.getValue('a')).toEqual('b');
      LearnerParamsService.setValue('a', 'c');
      expect(LearnerParamsService.getValue('a')).toEqual('c');
    });

    it('should not get an invalid parameter', function() {
      LearnerParamsService.init({
        a: 'b'
      });
      expect(function() {
        LearnerParamsService.getValue('b');
      }).toThrow(new Error('Invalid parameter name: b'));
    });

    it('should not set an invalid parameter', function() {
      LearnerParamsService.init({
        a: 'b'
      });
      expect(function() {
        LearnerParamsService.setValue('b', 'c');
      }).toThrow(new Error('Cannot set unknown parameter: b'));
    });
  });
});
