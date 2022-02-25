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
 * @fileoverview Component for the Answer Submit Learner Action.
 */

import { Component, Input, OnInit } from '@angular/core';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAnswer } from 'interactions/answer-defs';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'answer-submit-action',
  templateUrl: './answer-submit-action.component.html'
})
export class AnswerSubmitAction implements OnInit {
  @Input() answer: any;
  @Input() destStateName: any;
  @Input() timeSpentInStateSecs: any;
  @Input() currentStateName: any;
  @Input() actionIndex: any;
  @Input() interactionId: any;
  @Input() interactionCustomizationArgs: any;

  _customizationArgs: InteractionCustomizationArgs;
  _answer: InteractionAnswer | object;

  constructor(
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private htmlEscaperService: HtmlEscaperService,
    private interactionObjectFactory: InteractionObjectFactory
  ) { }

  getShortAnswerHtml(): string {
    return this.explorationHtmlFormatterService.getShortAnswerHtml(
      this._answer as InteractionAnswer,
      this.interactionId, this._customizationArgs);
  }

  ngOnInit(): void {
    this._customizationArgs = (
      this.interactionObjectFactory.convertFromCustomizationArgsBackendDict(
        this.interactionId,
        this.htmlEscaperService.escapedJsonToObj(
          this.interactionCustomizationArgs)
      )
    );

    this._answer = this.htmlEscaperService.escapedJsonToObj(this.answer);
  }
}

angular.module('oppia').directive('answerSubmitAction',
  downgradeComponent({
    component: AnswerSubmitAction
  }) as angular.IDirectiveFactory);
