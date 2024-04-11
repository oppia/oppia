// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the background banner component.
 */

import {NgModule} from '@angular/core';

import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {ConvertToPlainTextPipe} from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import {FilterForMatchingSubstringPipe} from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import {GetAbbreviatedTextPipe} from 'filters/string-utility-filters/get-abbreviated-text.pipe';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {NormalizeWhitespacePunctuationAndCasePipe} from 'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';
import {ReplaceInputsWithEllipsesPipe} from 'filters/string-utility-filters/replace-inputs-with-ellipses.pipe';
import {SortByPipe} from 'filters/string-utility-filters/sort-by.pipe';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {TruncateAndCapitalizePipe} from 'filters/string-utility-filters/truncate-and-capitalize.pipe';
import {TruncateAtFirstEllipsisPipe} from 'filters/string-utility-filters/truncate-at-first-ellipsis.pipe';
import {TruncateAtFirstLinePipe} from 'filters/string-utility-filters/truncate-at-first-line.pipe';
import {UnderscoresToCamelCasePipe} from 'filters/string-utility-filters/underscores-to-camel-case.pipe';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import {TruncateInputBasedOnInteractionAnswerTypePipe} from 'filters/truncate-input-based-on-interaction-answer-type.pipe';
import {ParameterizeRuleDescriptionPipe} from 'filters/parameterize-rule-description.pipe';
import {ConvertUnicodeToHtml} from 'filters/convert-unicode-to-html.pipe';

@NgModule({
  declarations: [
    CamelCaseToHyphensPipe,
    CapitalizePipe,
    ConvertToPlainTextPipe,
    FilterForMatchingSubstringPipe,
    GetAbbreviatedTextPipe,
    NormalizeWhitespacePipe,
    NormalizeWhitespacePunctuationAndCasePipe,
    ReplaceInputsWithEllipsesPipe,
    SortByPipe,
    TruncatePipe,
    TruncateAndCapitalizePipe,
    TruncateAtFirstEllipsisPipe,
    TruncateAtFirstLinePipe,
    UnderscoresToCamelCasePipe,
    WrapTextWithEllipsisPipe,
    TruncateInputBasedOnInteractionAnswerTypePipe,
    ParameterizeRuleDescriptionPipe,
    ConvertUnicodeToHtml,
  ],
  exports: [
    CamelCaseToHyphensPipe,
    CapitalizePipe,
    ConvertToPlainTextPipe,
    FilterForMatchingSubstringPipe,
    GetAbbreviatedTextPipe,
    NormalizeWhitespacePipe,
    NormalizeWhitespacePunctuationAndCasePipe,
    ReplaceInputsWithEllipsesPipe,
    SortByPipe,
    TruncatePipe,
    TruncateAndCapitalizePipe,
    TruncateAtFirstEllipsisPipe,
    TruncateAtFirstLinePipe,
    UnderscoresToCamelCasePipe,
    WrapTextWithEllipsisPipe,
    TruncateInputBasedOnInteractionAnswerTypePipe,
    ParameterizeRuleDescriptionPipe,
    ConvertUnicodeToHtml,
  ],
})
export class StringUtilityPipesModule {}
