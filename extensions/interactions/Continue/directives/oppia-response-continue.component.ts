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
 * @fileoverview Directive for the Continue button response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';

@Component({
  selector: 'oppia-response-continue',
  templateUrl: './continue-response.component.html',
  styleUrls: []
})
export class OppiaResponseContinueComponent implements OnInit {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  escapedAnswer: string = '';

  constructor(private readonly htmlEscaperService: HtmlEscaperService) {}

  ngOnInit(): void {
    this.escapedAnswer = (
      this.htmlEscaperService.escapedJsonToObj(this.answer) as string);
  }
}

angular.module('oppia').directive(
  'oppiaResponseContinue',
  downgradeComponent(
    {
      component: OppiaResponseContinueComponent
    }) as angular.IDirectiveFactory);
