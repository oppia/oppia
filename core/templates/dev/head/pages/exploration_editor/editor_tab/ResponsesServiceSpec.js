// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Responses Service.
 */

describe('Responses Service', function() {
  describe('ResponsesService', function() {
    beforeEach(function() {
      module('oppia');
    });

    let scope;
    let rs;

    beforeEach(inject(function($injector, $rootScope) {
      rs = $injector.get('ResponsesService');
      scope = $rootScope.$new();
    }));

    beforeEach(function() {
      rs.init({
        interactionId: 1,
        answerGroups: 'some value',
        defaultOutcome: 'some default outcome',
        confirmedUnclassifiedAnswers: 'some value'
      })
    });

    it('should return -1 if no answer group is active', function() {
      expect(rs.getActiveAnswerGroupIndex()).toEqual(-1);
    });

    it('should be able to change answer group index', function() {
      rs.changeActiveAnswerGroupIndex(5);
      expect(rs.getActiveAnswerGroupIndex()).toEqual(5);
    })
  })
})
