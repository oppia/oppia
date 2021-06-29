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
 * @fileoverview Component for the MathEquationInput response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, OnInit, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';

@Component({
  selector: 'oppia-response-math-equation-input',
  templateUrl: './math-equation-input-response.component.html'
})
export class ResponseMathEquationInput implements OnInit {
  @Input() answer: string;
  displayAnswer: Object;

  constructor(
    private htmlEscaperService: HtmlEscaperService
  ) {}

  ngOnInit(): void {
    this.displayAnswer = this.htmlEscaperService.escapedJsonToObj(this.answer);
  }
}

angular.module('oppia').directive(
  'oppiaResponseMathEquationInput', downgradeComponent({
    component: ResponseMathEquationInput
  }) as angular.IDirectiveFactory
);
