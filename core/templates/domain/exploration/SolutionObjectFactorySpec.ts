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
 * @fileoverview Unit tests for the Solution object factory.
 */

import { TestBed } from '@angular/core/testing';

import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {
  CapitalizePipe
} from 'filters/string-utility-filters/capitalize.pipe';
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { Solution, SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';
import { Interaction } from './InteractionObjectFactory';

describe('Solution object factory', () => {
  describe('SolutionObjectFactory', () => {
    let sof: SolutionObjectFactory, solution: Solution;
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          CamelCaseToHyphensPipe,
          CapitalizePipe,
          ConvertToPlainTextPipe,
          FormatRtePreviewPipe
        ]
      });
      sof = TestBed.inject(SolutionObjectFactory);
      solution = sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    });

    it('should get the backend dict from a solution', () => {
      const expectedSolution = {
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      };

      expect(solution.toBackendDict()).toEqual(expectedSolution);
    });

    it('should create a new solution from scratch', () => {
      const solutionFromScratch = sof.createNew(
        true,
        'This is the correct answer!',
        'This is the explanation to the answer',
        'solution');
      const expectedSolution = {
        answer_is_exclusive: true,
        correct_answer: 'This is the correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      };

      expect(solutionFromScratch.toBackendDict()).toEqual(expectedSolution);
    });

    it('should create summary correctly', () => {
      const graphInputCustomizationArgs = {
        graph: {
          value: { },
        },
        canAddVertex: {
          value: true,
        },
        canDeleteVertex: {
          value: true,
        },
        canEditVertexLabel: {
          value: true,
        },
        canMoveVertex: {
          value: true,
        },
        canAddEdge: {
          value: true,
        },
        canDeleteEdge: {
          value: true,
        },
        canEditEdgeWeight: {
          value: true,
        }
      };
      expect(solution.getSummary(
        'GraphInput', graphInputCustomizationArgs)).toEqual(
        'One solution is "[Graph]". This is the explanation to the answer.');
      const musicNotesInputCustomizationArgs = {
        sequenceToGuess: {
          value: [{
            readableNoteName: 'name',
            noteDuration: {
              num: 1,
              den: 1
            }}]
        },
        initialSequence: {
          value: [{
            readableNoteName: 'name',
            noteDuration: {
              num: 1,
              den: 1
            }}]
        }
      };
      expect(solution.getSummary(
        'MusicNotesInput', musicNotesInputCustomizationArgs)).toEqual(
        'One solution is "[Music Notes]". This is the explanation to the' +
        ' answer.');
      const textInputCustomizationArgs = {
        placeholder: {
          value: { }
        },
        rows: {
          value: 1
        }
      };
      expect(solution.getSummary(
        'TextInput', textInputCustomizationArgs)).toEqual(
        'One solution is "&quot;This is a correct answer!&quot;". ' +
        'This is the explanation to the answer.');

      solution.setCorrectAnswer({
        code: 'a=10',
        error: '',
        evaluation: '',
        output: ''
      });
      const codeReplCustomizationArgs = {
        language: {
          value: 'lang'
        },
        placeholder: {
          value: 'placeholder'
        },
        preCode: {
          value: 'preCode'
        },
        postCode: {
          value: 'postCode'
        }
      };
      expect(solution.getSummary(
        'CodeRepl', codeReplCustomizationArgs)).toEqual(
        'One solution is "a=10". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        isNegative: false,
        wholeNumber: 0,
        numerator: 1,
        denominator: 6
      });
      const fractionInputCustomizationArgs = {
        requireSimplestForm: {
          value: true
        },
        allowImproperFraction: {
          value: true
        },
        allowNonzeroIntegerPart: {
          value: true
        },
        customPlaceholder: {
          value: { }
        }
      };
      expect(solution.getSummary(
        'FractionInput', fractionInputCustomizationArgs)).toEqual(
        'One solution is "1/6". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        type: 'real',
        real: 1,
        fraction: {
          isNegative: false,
          wholeNumber: 0,
          numerator: 0,
          denominator: 1
        },
        units: []
      });
      const numberWithUnitsCustomizationArgs = { };
      expect(solution.getSummary(
        'NumberWithUnits', numberWithUnitsCustomizationArgs)).toEqual(
        'One solution is "1". This is the explanation to the answer.');

      solution.setCorrectAnswer([
        ['content_id_1', 'content_id_3'],
        ['content_id_2']
      ]);
      const dragAndDropCustomizationArgs = {
        choices: {
          value: [
            new SubtitledHtml('html_1', 'content_id_1'),
            new SubtitledHtml('html_2', 'content_id_2'),
            new SubtitledHtml('html_3', 'content_id_3')
          ]
        }
      };

      expect(
        solution.getSummary(
          'DragAndDropSortInput', dragAndDropCustomizationArgs)
      ).toEqual(
        'One solution is "[[html_1,html_3],[html_2]]". ' +
        'This is the explanation to the answer.');
    });

    it('should get oppia short answer', () => {
      const interaction = new Interaction([], [], {
        choices: {
          value: [new SubtitledHtml('This is a choice', 'id1')]
        }
      }, null, [], '0', null);
      const expectedShortAnswerHtml = {
        prefix: 'One',
        answer: '<oppia-short-response-0 answer="&amp;quot;' +
        'This is a correct answer!&amp;quot;" choices="' +
        '[{&amp;quot;_html&amp;quot;:&amp;quot;This is a choice' +
        '&amp;quot;,&amp;quot;_contentId&amp;quot;:' +
        '&amp;quot;id1&amp;quot;}]"></oppia-short-response-0>'
      };

      expect(solution.getOppiaShortAnswerResponseHtml(interaction)).toEqual(
        expectedShortAnswerHtml);
    });

    it('should throw an error if Interaction\'s id is null', () => {
      const interaction = new Interaction([], [], {
        choices: {
          value: [new SubtitledHtml('This is a choice', '')]
        }
      }, null, [], null, null);

      expect(() => {
        solution.getOppiaShortAnswerResponseHtml(interaction);
      }).toThrowError('Interaction id is possibly null.');
    });

    it('should handle when answer exclusivity is true', () => {
      const solution = sof.createFromBackendDict({
        answer_is_exclusive: true,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });

      expect(solution.answerIsExclusive).toBe(true);
      expect(solution.getSummary('TestInput', {})).toEqual(
        'The only solution is "&quot;This is a correct answer!&quot;". ' +
        'This is the explanation to the answer.');
    });

    it('should change the explanation correctly', () => {
      const newExplanation = new SubtitledHtml(
        'This is the new explanation to the answer',
        'solution'
      );
      solution.setExplanation(newExplanation);

      expect(solution.explanation).toBe(newExplanation);
      expect(solution.getOppiaSolutionExplanationResponseHtml()).toBe(
        newExplanation.html);
      expect(solution.getSummary('TestInput', {})).toEqual(
        'One solution is "&quot;This is a correct answer!&quot;". ' +
        'This is the new explanation to the answer.');
    });
  });
});
