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
 * @fileoverview Component for the ItemSelectionInput response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';

@Component({
  selector: 'oppia-response-item-selection-input',
  templateUrl: './item-selection-input-response.component.html',
  styleUrls: []
})
export class ResponseItemSelectionInputComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  @Input() choices!: string;
  responses!: string[];

  constructor(private htmlEscaperService: HtmlEscaperService) {}

  ngOnInit(): void {
    let answer = this.htmlEscaperService.escapedJsonToObj(
      this.answer
    ) as string[];
    if (!answer) {
      answer = [];
    }
    const choices = this.htmlEscaperService.escapedJsonToObj(
      this.choices
    ) as { _html: string; _contentId: string }[];

    const choicesContentIds = choices.map(choice => choice._contentId);
    this.responses = answer.map(
      contentId => choices[choicesContentIds.indexOf(contentId)]._html);
  }
}

angular.module('oppia').directive(
  'oppiaResponseItemSelectionInput', downgradeComponent({
    component: ResponseItemSelectionInputComponent
  }) as angular.IDirectiveFactory);
