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
 * @fileoverview Factory for creating new frontend instances of Solution
 * domain objects.
 */

import {} from '@angular/upgrade/static';
import {Injectable} from '@angular/core';

import {ConvertToPlainTextPipe} from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {Fraction} from 'domain/objects/fraction.model';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {LoggerService} from 'services/contextual/logger.service';
import {NumberWithUnitsObjectFactory} from 'domain/objects/NumberWithUnitsObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {UnitsObjectFactory} from 'domain/objects/UnitsObjectFactory';
import {
  DragAndDropAnswer,
  FractionAnswer,
  InteractionAnswer,
  NumberWithUnitsAnswer,
  PencilCodeEditorAnswer,
} from 'interactions/answer-defs';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {BaseTranslatableObject} from 'domain/objects/BaseTranslatableObject.model';
import {
  InteractionCustomizationArgs,
  DragAndDropSortInputCustomizationArgs,
} from 'interactions/customization-args-defs';

export interface ExplanationBackendDict {
  // A null 'content_id' indicates that the 'Solution' has been created
  // but not saved. Before the 'Solution' object is saved into a State,
  // the 'content_id' should be set to a string.
  content_id: string | null;
  html: string;
}

export interface SolutionBackendDict {
  answer_is_exclusive: boolean;
  correct_answer: InteractionAnswer;
  explanation: ExplanationBackendDict;
}

export interface ShortAnswerResponse {
  prefix: string;
  answer: string;
}

export class Solution extends BaseTranslatableObject {
  ehfs: ExplorationHtmlFormatterService;
  answerIsExclusive: boolean;
  correctAnswer: InteractionAnswer;
  explanation: SubtitledHtml;
  constructor(
    ehfs: ExplorationHtmlFormatterService,
    answerIsExclusive: boolean,
    correctAnswer: InteractionAnswer,
    explanation: SubtitledHtml
  ) {
    super();

    this.ehfs = ehfs;
    this.answerIsExclusive = answerIsExclusive;
    this.correctAnswer = correctAnswer;
    this.explanation = explanation;
  }

  getTranslatableFields(): SubtitledHtml[] {
    return [this.explanation];
  }

  toBackendDict(): SolutionBackendDict {
    return {
      answer_is_exclusive: this.answerIsExclusive,
      correct_answer: this.correctAnswer,
      explanation: this.explanation.toBackendDict(),
    };
  }

  getSummary(
    interactionId: string,
    customizationArgs: InteractionCustomizationArgs
  ): string {
    const solutionType = this.answerIsExclusive ? 'The only' : 'One';
    let correctAnswer = null;
    if (interactionId === 'GraphInput') {
      correctAnswer = '[Graph]';
    } else if (
      interactionId === 'CodeRepl' ||
      interactionId === 'PencilCodeEditor'
    ) {
      correctAnswer = (this.correctAnswer as PencilCodeEditorAnswer).code;
    } else if (interactionId === 'MusicNotesInput') {
      correctAnswer = '[Music Notes]';
    } else if (interactionId === 'FractionInput') {
      correctAnswer = Fraction.fromDict(
        this.correctAnswer as FractionAnswer
      ).toString();
    } else if (interactionId === 'NumberWithUnits') {
      correctAnswer = new NumberWithUnitsObjectFactory(new UnitsObjectFactory())
        .fromDict(this.correctAnswer as NumberWithUnitsAnswer)
        .toString();
    } else if (interactionId === 'DragAndDropSortInput') {
      correctAnswer = [];
      const subtitledHtmlChoices = (
        customizationArgs as DragAndDropSortInputCustomizationArgs
      ).choices.value;
      const subtitledHtmlChoicesContentIds = subtitledHtmlChoices.map(
        choice => choice.contentId
      );
      for (const arr of this.correctAnswer as DragAndDropAnswer) {
        const transformedArray = [];
        for (const elem of arr) {
          const choiceIndex = subtitledHtmlChoicesContentIds.indexOf(elem);
          transformedArray.push(subtitledHtmlChoices[choiceIndex].html);
        }
        correctAnswer.push(transformedArray);
      }
      correctAnswer = JSON.stringify(correctAnswer);
      correctAnswer = correctAnswer.replace(/"/g, '');
    } else {
      correctAnswer = new HtmlEscaperService(
        new LoggerService()
      ).objToEscapedJson(this.correctAnswer);
    }
    const explanation = new ConvertToPlainTextPipe().transform(
      this.explanation.html
    );
    return (
      solutionType +
      ' solution is "' +
      correctAnswer +
      '". ' +
      explanation +
      '.'
    );
  }

  setCorrectAnswer(correctAnswer: InteractionAnswer): void {
    this.correctAnswer = correctAnswer;
  }

  setExplanation(explanation: SubtitledHtml): void {
    this.explanation = explanation;
  }

  getOppiaShortAnswerResponseHtml(
    interaction: Interaction
  ): ShortAnswerResponse {
    if (interaction.id === null) {
      throw new Error('Interaction id is possibly null.');
    }
    return {
      prefix: this.answerIsExclusive ? 'The only' : 'One',
      answer: this.ehfs.getShortAnswerHtml(
        this.correctAnswer,
        interaction.id,
        interaction.customizationArgs
      ),
    };
  }

  getOppiaSolutionExplanationResponseHtml(): string {
    return this.explanation.html;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SolutionObjectFactory {
  constructor(private ehfs: ExplorationHtmlFormatterService) {}

  createFromBackendDict(solutionBackendDict: SolutionBackendDict): Solution {
    return new Solution(
      this.ehfs,
      solutionBackendDict.answer_is_exclusive,
      solutionBackendDict.correct_answer,
      SubtitledHtml.createFromBackendDict(solutionBackendDict.explanation)
    );
  }

  createNew(
    answerIsExclusive: boolean,
    correctAnswer: InteractionAnswer,
    explanationHtml: string,
    explanationId: string
  ): Solution {
    return new Solution(
      this.ehfs,
      answerIsExclusive,
      correctAnswer,
      SubtitledHtml.createDefault(explanationHtml, explanationId)
    );
  }
}
