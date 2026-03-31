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

import {Injectable} from '@angular/core';

import {CodeNormalizerService} from 'services/code-normalizer.service';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {CodeReplAnswer} from 'interactions/answer-defs';
import {CodeReplRuleInputs} from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root',
})
export class CodeReplRulesService {
  constructor(
    private normalizeWhitespace: NormalizeWhitespacePipe,
    private codeNormalizer: CodeNormalizerService
  ) {}

  CodeEquals(answer: CodeReplAnswer, inputs: CodeReplRuleInputs): boolean {
    var normalizedCode = this.codeNormalizer.getNormalizedCode(answer.code);
    var normalizedExpectedCode = this.codeNormalizer.getNormalizedCode(
      inputs.x
    );
    return normalizedCode === normalizedExpectedCode;
  }

  CodeContains(answer: CodeReplAnswer, inputs: CodeReplRuleInputs): boolean {
    var normalizedCode = this.codeNormalizer.getNormalizedCode(answer.code);
    var normalizedSnippet = this.codeNormalizer.getNormalizedCode(inputs.x);
    return normalizedCode.indexOf(normalizedSnippet) !== -1;
  }

  CodeDoesNotContain(
    answer: CodeReplAnswer,
    inputs: CodeReplRuleInputs
  ): boolean {
    var normalizedCode = this.codeNormalizer.getNormalizedCode(answer.code);
    var normalizedSnippet = this.codeNormalizer.getNormalizedCode(inputs.x);
    return normalizedCode.indexOf(normalizedSnippet) === -1;
  }

  OutputContains(answer: CodeReplAnswer, inputs: CodeReplRuleInputs): boolean {
    var normalizedOutput = this.normalizeWhitespace.transform(answer.output);
    var normalizedSnippet = this.normalizeWhitespace.transform(inputs.x);
    return normalizedOutput.indexOf(normalizedSnippet) !== -1;
  }

  OutputEquals(answer: CodeReplAnswer, inputs: CodeReplRuleInputs): boolean {
    var normalizedOutput = this.normalizeWhitespace.transform(answer.output);
    var normalizedExpectedOutput = this.normalizeWhitespace.transform(inputs.x);
    return normalizedOutput === normalizedExpectedOutput;
  }

  ResultsInError(answer: CodeReplAnswer): boolean {
    return !!answer.error.trim();
  }

  ErrorContains(answer: CodeReplAnswer, inputs: CodeReplRuleInputs): boolean {
    var normalizedError = this.normalizeWhitespace.transform(answer.error);
    var normalizedSnippet = this.normalizeWhitespace.transform(inputs.x);
    return normalizedError.indexOf(normalizedSnippet) !== -1;
  }
}
