// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for interpolating expressions.
 */

import {Injectable} from '@angular/core';

import {convertHtmlToUnicode} from 'filters/convert-html-to-unicode.filter';
import {ExpressionEvaluatorService} from 'expressions/expression-evaluator.service';
import {ExpressionParserService} from 'expressions/expression-parser.service';
import {ExpressionSyntaxTreeService} from 'expressions/expression-syntax-tree.service';
import {HtmlEscaperService} from 'services/html-escaper.service';

@Injectable({
  providedIn: 'root',
})
export class ExpressionInterpolationService {
  constructor(
    private expressionEvaluatorService: ExpressionEvaluatorService,
    private expressionParserService: ExpressionParserService,
    private expressionSyntaxTreeService: ExpressionSyntaxTreeService,
    private htmlEscaperService: HtmlEscaperService
  ) {}

  processHtml(sourceHtml: string, envs: Record<string, string>[]): string {
    return sourceHtml.replace(/{{([^}]*)}}/g, (match, p1) => {
      try {
        // TODO(sll): Remove the call to $filter once we have a
        // custom UI for entering expressions. It is only needed because
        // expressions are currently input inline via the RTE.
        return this.htmlEscaperService.unescapedStrToEscapedStr(
          this.expressionEvaluatorService.evaluateExpression(
            convertHtmlToUnicode(p1),
            envs
          ) as string
        );
      } catch (e) {
        const EXPRESSION_ERROR_TAG =
          '<oppia-expression-error-tag></oppia-expression-error-tag>';
        if (
          e instanceof this.expressionParserService.SyntaxError ||
          e instanceof this.expressionSyntaxTreeService.ExpressionError
        ) {
          return EXPRESSION_ERROR_TAG;
        }
        throw e;
      }
    });
  }

  // Function returns null if there is some error in the expression or syntax.
  processUnicode(
    sourceUnicode: string,
    envs: Record<string, string>[]
  ): string | null {
    try {
      return sourceUnicode.replace(/{{([^}]*)}}/g, (match, p1) => {
        // TODO(sll): Remove the call to $filter once we have a
        // custom UI for entering expressions. It is only needed because
        // expressions are currently input inline via the RTE.
        return this.expressionEvaluatorService.evaluateExpression(
          convertHtmlToUnicode(p1),
          envs
        ) as string;
      });
    } catch (e) {
      if (
        e instanceof this.expressionParserService.SyntaxError ||
        e instanceof this.expressionSyntaxTreeService.ExpressionError
      ) {
        return null;
      }
      throw e;
    }
  }

  getParamsFromString(sourceString: string): string[] {
    let matches = sourceString.match(/{{([^}]*)}}/g) || [];

    let allParams = [];
    for (let i = 0; i < matches.length; i++) {
      // Trim the '{{' and '}}'.
      matches[i] = matches[i].substring(2, matches[i].length - 2);

      let params = this.expressionSyntaxTreeService.getParamsUsedInExpression(
        convertHtmlToUnicode(matches[i])
      );

      for (let j = 0; j < params.length; j++) {
        if (allParams.indexOf(params[j]) === -1) {
          allParams.push(params[j]);
        }
      }
    }

    return allParams.sort();
  }
}
