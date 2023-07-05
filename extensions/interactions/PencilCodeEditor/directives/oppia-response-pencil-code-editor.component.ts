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
 * @fileoverview Component for the pencil code editor response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { downgradeComponent } from '@angular/upgrade/static';
import { Component, Input, OnInit } from '@angular/core';
import { HtmlEscaperService } from 'services/html-escaper.service';

export interface Answer {
  code: string;
}

@Component({
  selector: 'oppia-response-pencil-code-editor',
  templateUrl: './pencil-code-editor-response.component.html'
})
export class ResponePencilCodeEditor implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  answerCode!: string;

  constructor(
    private htmlEscaperService: HtmlEscaperService
  ) {}

  ngOnInit(): void {
    this.answerCode = (
      (this.htmlEscaperService.escapedJsonToObj(this.answer) as Answer).code);
  }
}

angular.module('oppia').directive(
  'oppiaResponsePencilCodeEditor', downgradeComponent(
    {component: ResponePencilCodeEditor}
  ) as angular.IDirectiveFactory);
