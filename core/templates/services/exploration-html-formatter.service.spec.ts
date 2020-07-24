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
import { InteractionCustomizationArg } from
  'domain/exploration/interaction-customization-arg-object.factory';

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
      placeholder: new InteractionCustomizationArg(
        new SubtitledUnicode('enter here', '')),
      rows: new InteractionCustomizationArg(1)
    };
    var expectedHtmlTag = '<oppia-interactive-text-input ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
      'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
      'quot;}" rows-with-value="1" last-answer="lastAnswer">' +
      '</oppia-interactive-text-input>';
    expect(ehfs.getInteractionHtml(interactionId, custArgs, true, null))
      .toBe(expectedHtmlTag);
  });

  it('should correctly set interaction HTML when it is in player mode',
    () => {
      var interactionId = 'TextInput';
      var focusLabel = 'sampleLabel';
      var expectedHtmlTag = '<oppia-interactive-text-input ' +
        'last-answer="null" label-for-focus-target="' + focusLabel + '">' +
        '</oppia-interactive-text-input>';
      expect(ehfs.getInteractionHtml(interactionId, {}, false, focusLabel)
      ).toBe(expectedHtmlTag);
    });

  it('should set answer HTML correctly', () => {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {
      choices: {
        value: [new SubtitledHtml('sampleChoice', '')]
      }
    };
    var expectedHtmlTag = '<oppia-response-sample-id ' +
      'answer="&amp;quot;' + answer + '&amp;quot;" ' +
      'choices="[&amp;quot;sampleChoice' +
      '&amp;quot;]"></oppia-response-sample-id>';
    expect(ehfs.getAnswerHtml(answer, interactionId,
      interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });

  it('should set short answer HTML correctly', () => {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {
      choices: {
        value: [new SubtitledHtml('sampleChoice', '')]
      }
    };
    var expectedHtmlTag = '<oppia-short-response-sample-id ' +
      'answer="&amp;quot;' + answer + '&amp;quot;" ' +
      'choices="[&amp;quot;sampleChoice' +
      '&amp;quot;]"></oppia-short-response-sample-id>';
    expect(ehfs.getShortAnswerHtml(answer, interactionId,
      interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });
});
