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
  'domain/exploration/subtitled-html.model';
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

  it('should correctly set interaction HTML for a non migrated interaction ' +
     'when it is in editor mode', () => {
    var interactionId = 'nonMigratedInteraction';
    let custArgs = {
      placeholder: {value: new SubtitledUnicode('enter here', '')},
      rows: {value: 1}
    };
    var expectedHtmlTag = '<oppia-interactive-non-migrated-interaction ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
      'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
      'quot;}" rows-with-value="1" last-answer="lastAnswer">' +
      '</oppia-interactive-non-migrated-interaction>';
    expect(ehfs.getInteractionHtml(interactionId, custArgs, true, null, null))
      .toBe(expectedHtmlTag);
  });

  it('should correctly set [last-answer] for MigratedInteractions when it' +
  ' is in editor mode', () => {
    var interactionId = 'GraphInput';
    let custArgs = {
      placeholder: {value: new SubtitledUnicode('enter here', '')},
      rows: {value: 1}
    };
    var expectedHtmlTag = '<oppia-interactive-graph-input ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
      'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
      'quot;}" rows-with-value="1" [last-answer]="lastAnswer">' +
      '</oppia-interactive-graph-input>';
    expect(ehfs.getInteractionHtml(interactionId, custArgs, true, null, null))
      .toBe(expectedHtmlTag);
  });

  it('should correctly set [last-answer] for MigratedInteractions when it' +
  ' is in editor mode', () => {
    var interactionId = 'GraphInput';
    let custArgs = {
      placeholder: {value: new SubtitledUnicode('enter here', '')},
      rows: {value: 1}
    };
    var expectedHtmlTag = '<oppia-interactive-graph-input ' +
      'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
      'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
      'quot;}" rows-with-value="1" [last-answer]="lastAnswer">' +
      '</oppia-interactive-graph-input>';
    expect(ehfs.getInteractionHtml(
      interactionId, custArgs, true, null, null))
      .toBe(expectedHtmlTag);
  });

  it('should correctly set interaction HTML when it is in player mode',
    () => {
      var interactionId = 'nonMigratedInteraction';
      var focusLabel = 'sampleLabel';
      var expectedHtmlTag = '<oppia-interactive-non-migrated-interaction ' +
        'label-for-focus-target="' + focusLabel + '" last-answer="null">' +
        '</oppia-interactive-non-migrated-interaction>';
      expect(
        ehfs.getInteractionHtml(interactionId, {}, false, focusLabel, null)
      ).toBe(expectedHtmlTag);
    });

  it('should correctly set interaction HTML when solution has been provided',
    () => {
      var interactionId = 'nonMigratedInteraction';
      var focusLabel = 'sampleLabel';
      var expectedHtmlTag = '<oppia-interactive-non-migrated-interaction ' +
        'saved-solution="solution" ' +
        'label-for-focus-target="' + focusLabel + '" last-answer="null">' +
        '</oppia-interactive-non-migrated-interaction>';
      expect(
        ehfs.getInteractionHtml(
          interactionId, {}, false, focusLabel, 'solution')
      ).toBe(expectedHtmlTag);
      interactionId = 'GraphInput';
      focusLabel = 'sampleLabel';
      expectedHtmlTag = '<oppia-interactive-graph-input ' +
        '[saved-solution]="solution" ' +
        'label-for-focus-target="' + focusLabel + '" [last-answer]="null">' +
        '</oppia-interactive-graph-input>';
      expect(
        ehfs.getInteractionHtml(
          interactionId, {}, false, focusLabel, 'solution')
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
    var expectedHtmlTag = '<oppia-response-sample-id answer="&amp;quot;' +
      answer + '&amp;quot;" choices="[{&amp;quot;_html&amp;quot;:&amp;' +
      'quot;sampleChoice&amp;quot;,&amp;quot;_contentId&amp;quot;:&amp;' +
      'quot;&amp;quot;}]"></oppia-response-sample-id>';
    expect(ehfs.getAnswerHtml(
      answer, interactionId, interactionCustomizationArgs)
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
    expect(ehfs.getShortAnswerHtml(
      answer, interactionId, interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });
});
