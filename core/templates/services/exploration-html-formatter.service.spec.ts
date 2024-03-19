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

import {TestBed} from '@angular/core/testing';

import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SubtitledUnicode} from 'domain/exploration/SubtitledUnicodeObjectFactory';

describe('Exploration Html Formatter Service', () => {
  let ehfs: ExplorationHtmlFormatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });
    ehfs = TestBed.inject(ExplorationHtmlFormatterService);
  });

  it(
    'should correctly set interaction HTML for a non migrated interaction ' +
      'when it is in editor mode',
    () => {
      var interactionId = 'EndExploration';
      let custArgs = {
        placeholder: {value: new SubtitledUnicode('enter here', '')},
        rows: {value: 1},
      };
      var expectedHtmlTag =
        '<oppia-interactive-end-exploration ' +
        'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
        'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
        'quot;}" rows-with-value="1" [last-answer]="lastAnswer">' +
        '</oppia-interactive-end-exploration>';
      expect(
        ehfs.getInteractionHtml(interactionId, custArgs, true, null, null)
      ).toBe(expectedHtmlTag);
    }
  );

  it('should fail for unknown interaction', () => {
    expect(() => {
      ehfs.getInteractionHtml('UnknownInteraction', {}, true, null, null);
    }).toThrowError('Invalid interaction id: UnknownInteraction.');
  });

  it('should fail for saved solution other than savedSolution', () => {
    expect(() => {
      // This throws "Argument of type '"other"' is not assignable to parameter
      // of type '"savedSolution"'.". We need to suppress this error because
      // we want to test if error is thrown.
      // @ts-expect-error
      ehfs.getInteractionHtml('GraphInput', {}, true, null, 'other');
    }).toThrowError('Unexpected saved solution: other.');
  });

  it('should fail for non-alphabetic label for focus target', () => {
    expect(() => {
      ehfs.getInteractionHtml(
        'GraphInput',
        {},
        true,
        '<tag></tag>',
        'savedSolution'
      );
    }).toThrowError('Unexpected label for focus target: <tag></tag>.');
  });

  it(
    'should correctly set [last-answer] for MigratedInteractions when it' +
      ' is in editor mode',
    () => {
      var interactionId = 'GraphInput';
      let custArgs = {
        placeholder: {value: new SubtitledUnicode('enter here', '')},
        rows: {value: 1},
      };
      var expectedHtmlTag =
        '<oppia-interactive-graph-input ' +
        'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
        'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
        'quot;}" rows-with-value="1" [last-answer]="lastAnswer">' +
        '</oppia-interactive-graph-input>';
      expect(
        ehfs.getInteractionHtml(interactionId, custArgs, true, null, null)
      ).toBe(expectedHtmlTag);
    }
  );

  it(
    'should correctly set [last-answer] for MigratedInteractions when it' +
      ' is in editor mode',
    () => {
      var interactionId = 'GraphInput';
      let custArgs = {
        placeholder: {value: new SubtitledUnicode('enter here', '')},
        rows: {value: 1},
      };
      var expectedHtmlTag =
        '<oppia-interactive-graph-input ' +
        'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
        'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
        'quot;}" rows-with-value="1" [last-answer]="lastAnswer">' +
        '</oppia-interactive-graph-input>';
      expect(
        ehfs.getInteractionHtml(interactionId, custArgs, true, null, null)
      ).toBe(expectedHtmlTag);
    }
  );

  it('should correctly set interaction HTML when it is in player mode', () => {
    var interactionId = 'EndExploration';
    var focusLabel = 'sampleLabel';
    var expectedHtmlTag =
      '<oppia-interactive-end-exploration ' +
      'label-for-focus-target="' +
      focusLabel +
      '" [last-answer]="null">' +
      '</oppia-interactive-end-exploration>';
    expect(
      ehfs.getInteractionHtml(interactionId, {}, false, focusLabel, null)
    ).toBe(expectedHtmlTag);
  });

  it('should correctly set interaction HTML when solution has been provided', () => {
    var interactionId = 'EndExploration';
    var focusLabel = 'sampleLabel';
    var expectedHtmlTag =
      '<oppia-interactive-end-exploration ' +
      'label-for-focus-target="' +
      focusLabel +
      '" ' +
      '[saved-solution]="savedSolution" [last-answer]="null">' +
      '</oppia-interactive-end-exploration>';
    expect(
      ehfs.getInteractionHtml(
        interactionId,
        {},
        false,
        focusLabel,
        'savedSolution'
      )
    ).toBe(expectedHtmlTag);
    interactionId = 'GraphInput';
    focusLabel = 'sampleLabel';
    expectedHtmlTag =
      '<oppia-interactive-graph-input ' +
      'label-for-focus-target="' +
      focusLabel +
      '" ' +
      '[saved-solution]="savedSolution" [last-answer]="null">' +
      '</oppia-interactive-graph-input>';
    expect(
      ehfs.getInteractionHtml(
        interactionId,
        {},
        false,
        focusLabel,
        'savedSolution'
      )
    ).toBe(expectedHtmlTag);
  });

  it('should set answer HTML correctly', () => {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {
      choices: {
        value: [new SubtitledHtml('sampleChoice', '')],
      },
    };
    var expectedHtmlTag =
      '<oppia-response-sample-id answer="&amp;quot;' +
      answer +
      '&amp;quot;" choices="[{&amp;quot;_html&amp;quot;:&amp;' +
      'quot;sampleChoice&amp;quot;,&amp;quot;_contentId&amp;quot;:&amp;' +
      'quot;&amp;quot;}]"></oppia-response-sample-id>';
    expect(
      ehfs.getAnswerHtml(answer, interactionId, interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });

  it('should throw error when interaction id is null', () => {
    expect(() => {
      ehfs.getAnswerHtml('sampleAnswer', null, {});
    }).toThrowError('InteractionId cannot be null');
  });

  it('should set short answer HTML correctly', () => {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {
      choices: {
        value: [new SubtitledHtml('sampleChoice', '')],
      },
    };
    var expectedHtmlTag =
      '<oppia-short-response-sample-id ' +
      'answer="&amp;quot;' +
      answer +
      '&amp;quot;" ' +
      'choices="[{&amp;quot;_html&amp;quot;:&amp;' +
      'quot;sampleChoice&amp;quot;,&amp;quot;_contentId&amp;quot;:&amp;' +
      'quot;&amp;quot;}]"></oppia-short-response-sample-id>';
    expect(
      ehfs.getShortAnswerHtml(
        answer,
        interactionId,
        interactionCustomizationArgs
      )
    ).toBe(expectedHtmlTag);
  });
});
