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
 * @fileoverview Component for the LogicProof short response.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';

@Component({
  selector: 'oppia-short-response-logic-proof',
  templateUrl: './logic-proof-short-response.component.html'
})
export class ShortResponseLogicProofComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input('answer') answerWithValue!: string;
  answer!: string;

  constructor(private htmlEscaperService: HtmlEscaperService) { }

  ngOnInit(): void {
    this.answer = this.htmlEscaperService.escapedJsonToObj(
      this.answerWithValue) as string;
  }
}

angular.module('oppia').directive(
  'oppiaShortResponseLogicProof', downgradeComponent({
    component: ShortResponseLogicProofComponent
  })
);
