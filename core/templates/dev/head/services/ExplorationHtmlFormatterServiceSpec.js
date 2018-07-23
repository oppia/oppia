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
 * @fileoverview Unit tests for services for explorations which may be shared
 * by both the learner and editor views
 */

describe('Exploration Html Formatter Service', function() {
  beforeEach(module('oppia'));
  var ehfs = null;

  beforeEach(module(function($provide) {
    $provide.constant('INTERACTION_SPECS', {
      sampleId: {
        show_generic_submit_button: true
      },
    });
  }));

  beforeEach(inject(function($injector) {
    ehfs = $injector.get('ExplorationHtmlFormatterService');
  }));

  it('should correctly set interaction HTML when it is in editor mode',
    function() {
      var interactionId = 'sampleId';
      var expectedHtmlTag = '<oppia-interactive-sample-id ' +
        'last-answer="lastAnswer"' +
        '></oppia-interactive-sample-id>';
      expect(ehfs.getInteractionHtml(interactionId, null, true, null))
        .toBe(expectedHtmlTag);
    });

  it('should correctly set interaction HTML when it is in player mode',
    function() {
      var interactionId = 'sampleId';
      var focusLabel = 'sampleLabel';
      var expectedHtmlTag = '<oppia-interactive-sample-id ' +
        'last-answer="null" label-for-focus-target="' + focusLabel + '">' +
        '</oppia-interactive-sample-id>';
      expect(ehfs.getInteractionHtml(interactionId, null, false, focusLabel)
      ).toBe(expectedHtmlTag);
    });

  it('should set answer HTML correctly', function() {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {};
    interactionCustomizationArgs.choices = {
      value: 'sampleChoice'
    };
    var expectedHtmlTag = '<oppia-response-sample-id ' +
      'answer="&amp;quot;' + answer + '&amp;quot;" ' +
      'choices="&amp;quot;' + interactionCustomizationArgs.choices.value +
      '&amp;quot;"></oppia-response-sample-id>';
    expect(ehfs.getAnswerHtml(answer, interactionId,
      interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });

  it('should set short answer HTML correctly', function() {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {};
    interactionCustomizationArgs.choices = {
      value: 'sampleChoice'
    };
    var expectedHtmlTag = '<oppia-short-response-sample-id ' +
      'answer="&amp;quot;' + answer + '&amp;quot;" ' +
      'choices="&amp;quot;' + interactionCustomizationArgs.choices.value +
      '&amp;quot;"></oppia-short-response-sample-id>';
    expect(ehfs.getShortAnswerHtml(answer, interactionId,
      interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });
});
