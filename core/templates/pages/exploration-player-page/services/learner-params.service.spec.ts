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

// TODO(#7222): Remove the following block of unnnecessary imports once
// learner-params.service.ts is upgraded to Angular 8.
import {LearnerParamsService} from 'pages/exploration-player-page/services/learner-params.service';
// ^^^ This block is to be removed.

describe('Learner parameters service', () => {
  describe('learner params service', () => {
    let learnerParamsService: LearnerParamsService;

    beforeEach(() => {
      learnerParamsService = new LearnerParamsService();
    });

    it('should correctly initialize parameters', () => {
      expect(learnerParamsService.getAllParams()).toEqual({});
      learnerParamsService.init({
        a: 'b',
      });
      expect(learnerParamsService.getAllParams()).toEqual({
        a: 'b',
      });
    });

    it('should correctly get and set parameters', () => {
      learnerParamsService.init({
        a: 'b',
      });
      expect(learnerParamsService.getValue('a')).toEqual('b');
      learnerParamsService.setValue('a', 'c');
      expect(learnerParamsService.getValue('a')).toEqual('c');
    });

    it('should not get an invalid parameter', () => {
      learnerParamsService.init({
        a: 'b',
      });
      expect(() => {
        learnerParamsService.getValue('b');
      }).toThrowError('Invalid parameter name: b');
    });

    it('should not set an invalid parameter', () => {
      learnerParamsService.init({
        a: 'b',
      });
      expect(() => {
        learnerParamsService.setValue('b', 'c');
      }).toThrowError('Cannot set unknown parameter: b');
    });
  });
});
