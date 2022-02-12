// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CodeNormalizerService } from 'services/code-normalizer.service';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { NormalizeWhitespacePunctuationAndCasePipe } from 'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';
import { PencilCodeEditorAnswer } from 'interactions/answer-defs';
import { PencilCodeEditorRuleInputs } from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class PencilCodeEditorRulesService {
  constructor(
    private nwp: NormalizeWhitespacePipe,
    private nwpac: NormalizeWhitespacePunctuationAndCasePipe,
    private cn: CodeNormalizerService) {}

  CodeEquals(
      answer: PencilCodeEditorAnswer,
      inputs: PencilCodeEditorRuleInputs): boolean {
    var normalizedCode =
      this.cn.getNormalizedCode(answer.code);
    var normalizedExpectedCode =
      this.cn.getNormalizedCode(inputs.x);
    return normalizedCode === normalizedExpectedCode;
  }

  CodeContains(
      answer: PencilCodeEditorAnswer,
      inputs: PencilCodeEditorRuleInputs): boolean {
    var normalizedCode =
      this.cn.getNormalizedCode(answer.code);
    var normalizedSnippet =
      this.cn.getNormalizedCode(inputs.x);
    return normalizedCode.indexOf(normalizedSnippet) !== -1;
  }

  CodeDoesNotContain(
      answer: PencilCodeEditorAnswer,
      inputs: PencilCodeEditorRuleInputs): boolean {
    var normalizedCode =
      this.cn.getNormalizedCode(answer.code);
    var normalizedSnippet =
      this.cn.getNormalizedCode(inputs.x);
    return normalizedCode.indexOf(normalizedSnippet) === -1;
  }

  OutputEquals(
      answer: PencilCodeEditorAnswer,
      inputs: PencilCodeEditorRuleInputs): boolean {
    var normalizedOutput = this.nwp.transform(answer.output);
    var normalizedExpectedOutput =
      this.nwp.transform(inputs.x);
    return normalizedOutput === normalizedExpectedOutput;
  }

  OutputRoughlyEquals(
      answer: PencilCodeEditorAnswer,
      inputs: PencilCodeEditorRuleInputs): boolean {
    var normalizedOutput = this.nwpac.transform(answer.output);
    var normalizedExpectedOutput = this.nwpac.transform(inputs.x);
    return normalizedOutput === normalizedExpectedOutput;
  }

  ResultsInError(answer: PencilCodeEditorAnswer): boolean {
    return !!(answer.error.trim());
  }

  ErrorContains(
      answer: PencilCodeEditorAnswer,
      inputs: PencilCodeEditorRuleInputs): boolean {
    var normalizedError = this.nwp.transform(answer.error);
    var normalizedSnippet = this.nwp.transform(inputs.x);
    return normalizedError.indexOf(normalizedSnippet) !== -1;
  }
}

angular.module('oppia').factory(
  'PencilCodeEditorRulesService', downgradeInjectable(
    PencilCodeEditorRulesService));
