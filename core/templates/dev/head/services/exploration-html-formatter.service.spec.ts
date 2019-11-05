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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('services/exploration-html-formatter.service.ts');

describe('Exploration Html Formatter Service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));
  var ehfs = null;

  beforeEach(angular.mock.module(function($provide) {
    $provide.constant('INTERACTION_SPECS', {
      sampleId: {
        show_generic_submit_button: true
      },
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
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
    var interactionCustomizationArgs = {
      choices: {
        value: 'sampleChoice'
      }
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
    var interactionCustomizationArgs = {
      choices: {
        value: 'sampleChoice'
      }
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
