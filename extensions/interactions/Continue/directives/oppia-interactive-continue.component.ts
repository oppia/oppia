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
 * @fileoverview Component for the Continue button interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ContinueCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ContextService } from 'services/context.service';
import { ContinueRulesService } from './continue-rules.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-interactive-continue',
  templateUrl: './continue-interaction.component.html',
  styleUrls: []
})
export class OppiaInteractiveContinue implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() buttonTextWithValue!: string;
  buttonText: string = '';
  isInEditorMode: boolean = false;
  readonly DEFAULT_BUTTON_TEXT: string = 'Continue';
  readonly DEFAULT_HUMAN_READABLE_ANSWER: string = (
    'Please continue.');

  constructor(
    private continueRulesService: ContinueRulesService,
    private contextService: ContextService,
    private currentInteractionService: CurrentInteractionService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService) {}

  ngOnInit(): void {
    this.isInEditorMode = this.contextService.isInExplorationEditorMode();
    const { buttonText } = (
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'Continue',
        {
          buttonTextWithValue: this.buttonTextWithValue
        }) as ContinueCustomizationArgs);
    this.buttonText = buttonText.value.unicode;
    const submitAnswer = () => {
      // We used to show "(Continue)" to indicate a 'continue' action when
      // the learner browses through the history of the exploration, but
      // this apparently can be mistaken for a button/control. The
      // following makes the learner's "answer" a bit more conversational,
      // as if they were chatting with Oppia.
      let humanReadableAnswer = this.DEFAULT_HUMAN_READABLE_ANSWER;
      if (this.buttonText !== this.DEFAULT_BUTTON_TEXT) {
        humanReadableAnswer = this.buttonText;
      }
      this.currentInteractionService.onSubmit(
        humanReadableAnswer, this.continueRulesService);
    };
    this.currentInteractionService.registerCurrentInteraction(
      submitAnswer, null);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}
angular.module('oppia').directive(
  'oppiaInteractiveContinue', downgradeComponent(
    {component: OppiaInteractiveContinue}) as angular.IDirectiveFactory);
