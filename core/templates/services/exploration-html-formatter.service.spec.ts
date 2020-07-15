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

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ExplorationHtmlFormatterService } from
  'services/exploration-html-formatter.service';
import { SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';

describe('Exploration Html Formatter Service', () => {
  let ehfs: ExplorationHtmlFormatterService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });
    ehfs = TestBed.get(ExplorationHtmlFormatterService);
  });

  it('should correctly set interaction HTML for TextInput when it is in' +
     ' editor mode', () => {
    var interactionId = 'TextInput';
    let custArgs = {
      placeholder: {
        value: new SubtitledUnicode('enter here', '')
      },
      rows: { value: 1 }
    };
    var expectedHtmlTag = '<oppia-interactive-text-input ' +
      'placeholder-with-value="&amp;quot;enter here&amp;quot;" ' +
      'rows-with-value="1" last-answer="lastAnswer">' +
      '</oppia-interactive-text-input>';
    expect(ehfs.getInteractionHtml(interactionId, custArgs, true, null))
      .toBe(expectedHtmlTag);
  });

  it('should correctly unwrap SubtitledUnicode and SubtitledHtml', () => {
    // No interactions currently have dictionaries in their customization
    // arguments, but we test here for coverage + future development.
    let unwrappedCustArgs = ehfs.unwrapInteractionCustArgsContent(
      {
        test: [
          {
            content: new SubtitledUnicode('first', ''),
            show: true
          },
          {
            content: new SubtitledUnicode('second', ''),
            show: true
          }
        ],
        test2: new SubtitledHtml('third', '')
      }
    );

    expect(unwrappedCustArgs)
      .toEqual({
        test: [
          {
            content: 'first',
            show: true
          },
          {
            content: 'second',
            show: true
          }
        ],
        test2: 'third'
      });
  });

  it('should correctly set interaction HTML when it is in player mode',
    () => {
      var interactionId = 'sampleId';
      var focusLabel = 'sampleLabel';
      var expectedHtmlTag = '<oppia-interactive-sample-id ' +
        'last-answer="null" label-for-focus-target="' + focusLabel + '">' +
        '</oppia-interactive-sample-id>';
      expect(ehfs.getInteractionHtml(interactionId, null, false, focusLabel)
      ).toBe(expectedHtmlTag);
    });

  it('should set answer HTML correctly', () => {
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

  it('should set short answer HTML correctly', () => {
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
