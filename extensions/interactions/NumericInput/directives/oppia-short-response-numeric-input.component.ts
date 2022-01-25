// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the NumericInput short response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ContentTranslationLanguageService } from 'pages/exploration-player-page/services/content-translation-language.service';

@Component({
  selector: 'oppia-short-response-numeric-input',
  templateUrl: './numeric-input-short-response.component.html',
  styleUrls: []
})
export class ShortResponseNumericInput implements OnInit {
  @Input() answer: string;
  displayAnswer: Object;

  constructor(
    private htmlEscaperService: HtmlEscaperService,
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private contentTranslationLanguageService: ContentTranslationLanguageService
  ) {}

  ngOnInit(): void {
    this.displayAnswer = this.htmlEscaperService.escapedJsonToObj(this.answer);
    if ((this.displayAnswer as number) % 1 === 0) {
      let recievedAnswer = Math.round(this.displayAnswer as number);
      let finalAnswer: string;
      if (this.contextService.getPageContext() === 'learner') {
        finalAnswer = this.contentTranslationLanguageService
          .convertToLocalizedNumber(recievedAnswer);
      } else {
        finalAnswer = this.i18nLanguageCodeService
          .convertToLocalizedNumber(recievedAnswer);
      }
      this.displayAnswer = finalAnswer;
    }
  }
}

angular.module('oppia').directive(
  'oppiaShortResponseNumericInput', downgradeComponent(
    {component: ShortResponseNumericInput}
  ) as angular.IDirectiveFactory);
