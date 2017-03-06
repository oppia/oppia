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
 * @fileoverview Unit tests for the QuestionIdService.
 */

 describe('QuestionId Service ', function() {
  var QuestionIdService;
  var stubs;

  beforeEach(function() {
    stubs = {
      questionId: 'Introduction',
      label: 'Hints',
      subfieldId: 'Introduction:Hints'
    };

    module('oppia');
  });

  beforeEach(inject(function($injector) {
    questionIdService = $injector.get('QuestionIdService');
  }));

  it('should return an Id used to identify a question subfield', function() {
    expect(questionIdService.getSubfieldId(stubs.questionId, stubs.label))
      .toEqual(true);
  });

  it('should return an Id used to identify a sidebar item', function() {
    expect(questionIdService.getSidebarItemId(stubs.questionId, stubs.label))
      .toEqual(true);
  });

  it('should Extract the questionId from a subfieldId', function() {
    expect(questionIdService.getParentQuestionId(stubs.subfieldId))
      .toEqual(true);
  });
});
