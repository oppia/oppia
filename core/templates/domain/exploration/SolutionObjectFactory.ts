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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { ExplorationHtmlFormatterService } from
  'services/exploration-html-formatter.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import {
  ISubtitledHtmlBackendDict, SubtitledHtml, SubtitledHtmlObjectFactory
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory.ts';

export interface ISolutionBackendDict {
  /* eslint-disable camelcase */
  answer_is_exclusive: boolean;
  correct_answer;
  explanation: ISubtitledHtmlBackendDict;
  /* eslint-enable camelcase */
}

export class Solution {
  constructor(
      private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
      public answerIsExclusive: boolean,
      public correctAnswer,
      public explanation: SubtitledHtml) {}

  toBackendDict(): ISolutionBackendDict {
    return {
      answer_is_exclusive: this.answerIsExclusive,
      correct_answer: this.correctAnswer,
      explanation: this.explanation.toBackendDict()
    };
  }

  getSummary(interactionId: string): string {
    var solutionType = (
      this.answerIsExclusive ? 'The only' : 'One');
    var correctAnswer = null;
    if (interactionId === 'GraphInput') {
      correctAnswer = '[Graph]';
    } else if (interactionId === 'MathExpressionInput') {
      correctAnswer = this.correctAnswer.latex;
    } else if (interactionId === 'CodeRepl' ||
      interactionId === 'PencilCodeEditor') {
      correctAnswer = this.correctAnswer.code;
    } else if (interactionId === 'MusicNotesInput') {
      correctAnswer = '[Music Notes]';
    } else if (interactionId === 'LogicProof') {
      correctAnswer = this.correctAnswer.correct;
    } else if (interactionId === 'FractionInput') {
      correctAnswer = (new FractionObjectFactory()).fromDict(
        this.correctAnswer).toString();
    } else if (interactionId === 'NumberWithUnits') {
      correctAnswer = (new NumberWithUnitsObjectFactory(
        new UnitsObjectFactory(), new FractionObjectFactory())).fromDict(
        this.correctAnswer).toString();
    } else {
      correctAnswer = (
        (new HtmlEscaperService(new LoggerService())).objToEscapedJson(
          this.correctAnswer));
    }
    var explanation = (
      (new ConvertToPlainTextPipe()).transform(this.explanation.getHtml()));
    return (
      solutionType + ' solution is "' + correctAnswer +
      '". ' + explanation + '.');
  }

  setCorrectAnswer(correctAnswer): void {
    this.correctAnswer = correctAnswer;
  }

  setExplanation(explanation: SubtitledHtml): void {
    this.explanation = explanation;
  }

  getOppiaShortAnswerResponseHtml(interaction: Interaction) {
    return {
      prefix: (this.answerIsExclusive ? 'The only' : 'One'),
      answer: this.explorationHtmlFormatterService.getShortAnswerHtml(
        this.correctAnswer, interaction.id, interaction.customizationArgs)};
  }

  getOppiaSolutionExplanationResponseHtml(): string {
    return this.explanation.getHtml();
  }
}

@Injectable({
  providedIn: 'root'
})
export class SolutionObjectFactory {
  constructor(
    private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService) {}

  createFromBackendDict(solutionBackendDict: ISolutionBackendDict): Solution {
    return new Solution(
      this.explorationHtmlFormatterService,
      solutionBackendDict.answer_is_exclusive,
      solutionBackendDict.correct_answer,
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        solutionBackendDict.explanation));
  }

  createNew(
      answerIsExclusive: boolean, correctAnswer, explanationHtml: string,
      explanationId: string): Solution {
    return new Solution(
      this.explorationHtmlFormatterService, answerIsExclusive, correctAnswer,
      this.subtitledHtmlObjectFactory.createDefault(
        explanationHtml, explanationId));
  }
}

angular.module('oppia').factory(
  'SolutionObjectFactory',
  downgradeInjectable(SolutionObjectFactory));
