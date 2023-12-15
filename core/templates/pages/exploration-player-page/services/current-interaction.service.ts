// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Facilitates communication between the current interaction
 * and the progress nav. The former holds data about the learner's answer,
 * while the latter contains the actual "Submit" button which triggers the
 * answer submission process.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ContextService } from 'services/context.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { Observable, Subject } from 'rxjs';
import { AlgebraicExpressionInputRulesService } from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import { CodeReplRulesService } from 'interactions/CodeRepl/directives/code-repl-rules.service';
import { ContinueRulesService } from 'interactions/Continue/directives/continue-rules.service';
import { FractionInputRulesService } from 'interactions/FractionInput/directives/fraction-input-rules.service';
import { ImageClickInputRulesService } from 'interactions/ImageClickInput/directives/image-click-input-rules.service';
import { InteractiveMapRulesService } from 'interactions/InteractiveMap/directives/interactive-map-rules.service';
import { MathEquationInputRulesService } from 'interactions/MathEquationInput/directives/math-equation-input-rules.service';
import { NumericExpressionInputRulesService } from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import { NumericInputRulesService } from 'interactions/NumericInput/directives/numeric-input-rules.service';
import { PencilCodeEditorRulesService } from 'interactions/PencilCodeEditor/directives/pencil-code-editor-rules.service';
import { GraphInputRulesService } from 'interactions/GraphInput/directives/graph-input-rules.service';
import { SetInputRulesService } from 'interactions/SetInput/directives/set-input-rules.service';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { StateCard } from 'domain/state_card/state-card.model';

type SubmitAnswerFn = () => void;

type InteractionRulesService = (
  AlgebraicExpressionInputRulesService |
  CodeReplRulesService |
  ContinueRulesService |
  FractionInputRulesService |
  ImageClickInputRulesService |
  InteractiveMapRulesService |
  MathEquationInputRulesService |
  NumericExpressionInputRulesService |
  NumericInputRulesService |
  PencilCodeEditorRulesService |
  GraphInputRulesService |
  SetInputRulesService |
  TextInputRulesService
);

export type OnSubmitFn = (
  answer: InteractionAnswer,
  interactionRulesService: InteractionRulesService
) => void;

export type ValidityCheckFn = () => boolean;

export type PresubmitHookFn = () => void;

@Injectable({
  providedIn: 'root'
})
export class CurrentInteractionService {
  constructor(
    private contextService: ContextService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService) {}

  // The 'submitAnswerFn' function should grab the learner's answer and pass
  // it to onSubmit. The interaction can pass in 'null' for this property if
  // it does not use the progress nav's submit button
  // (for example 'MultipleChoiceInput').
  private static submitAnswerFn: SubmitAnswerFn | null = null;
  // The 'validityCheckFn' function is used by the progress nav to decide
  // whether or not to disable the submit button. If the interaction passes
  // in 'null', the submit button will remain enabled (for the entire duration
  // of the current interaction).
  private static validityCheckFn: ValidityCheckFn | null = null;
  private static onSubmitFn: OnSubmitFn;
  private static presubmitHooks: PresubmitHookFn[] = [];
  private static answerChangedSubject: Subject<void> = new Subject<void>();

  setOnSubmitFn(onSubmit: OnSubmitFn): void {
    /**
     * The ConversationSkinDirective should register its onSubmit
     * callback here.
     *
     * @param {function(answer, interactionRulesService)} onSubmit
     */
    CurrentInteractionService.onSubmitFn = onSubmit;
  }

  registerCurrentInteraction(
      submitAnswerFn: SubmitAnswerFn | null,
      validityCheckFn: ValidityCheckFn | null
  ): void {
    /**
     * Each interaction directive should call registerCurrentInteraction
     * when the interaction directive is first created.
     *
     * @param {function|null} submitAnswerFn - Should grab the learner's
     *   answer and pass it to onSubmit. The interaction can pass in
     *   null if it does not use the progress nav's submit button
     *   (ex: MultipleChoiceInput).
     * @param {function|null} validityCheckFn - The progress nav will use this
     *   to decide whether or not to disable the submit button. If the
     *   interaction passes in null, the submit button will remain
     *   enabled (for the entire duration of the current interaction).
     */
    CurrentInteractionService.submitAnswerFn = submitAnswerFn || null;
    CurrentInteractionService.validityCheckFn = validityCheckFn || null;
  }

  registerPresubmitHook(hookFn: PresubmitHookFn): void {
    /* Register a hook that will be called right before onSubmit.
     * All hooks for the current interaction will be cleared right
     * before loading the next card.
     */
    CurrentInteractionService.presubmitHooks.push(hookFn);
  }

  clearPresubmitHooks(): void {
    /* Clear out all the hooks for the current interaction. Should
     * be called before loading the next card.
     */
    CurrentInteractionService.presubmitHooks = [];
  }

  onSubmit(
      answer: InteractionAnswer,
      interactionRulesService: InteractionRulesService
  ): void {
    for (
      let i = 0; i < CurrentInteractionService.presubmitHooks.length; i++) {
      CurrentInteractionService.presubmitHooks[i]();
    }
    CurrentInteractionService.onSubmitFn(answer, interactionRulesService);
  }

  getDisplayedCard(): StateCard {
    const index = this.playerPositionService.getDisplayedCardIndex();
    return this.playerTranscriptService.getCard(index);
  }

  updateCurrentAnswer(answer: InteractionAnswer | null): void {
    this.getDisplayedCard()?.updateCurrentAnswer(answer);
  }

  showNoResponseError(): boolean {
    return this.getDisplayedCard().showNoResponseError();
  }

  submitAnswer(): void {
    /* This starts the answer submit process, it should be called once the
     * learner presses the "Submit" button.
     */
    if (CurrentInteractionService.submitAnswerFn === null) {
      let index = this.playerPositionService.getDisplayedCardIndex();
      let displayedCard = this.playerTranscriptService.getCard(index);
      let additionalInfo = (
        '\nUndefined submit answer debug logs:' +
        '\nInteraction ID: ' + displayedCard.getInteractionId() +
        '\nExploration ID: ' + this.contextService.getExplorationId() +
        '\nState Name: ' + displayedCard.getStateName() +
        '\nContext: ' + this.contextService.getPageContext() +
        '\nErrored at index: ' + index);
      throw new Error(
        'The current interaction did not ' +
        'register a _submitAnswerFn.' + additionalInfo);
    } else {
      CurrentInteractionService.submitAnswerFn();
    }
  }

  isSubmitButtonDisabled(): boolean {
    /* The submit button should be disabled if the current interaction
     * did not register a _submitAnswerFn. This could occur in
     * low-bandwidth scenarios where the interaction has not finished
     * loading.
     */
    if (CurrentInteractionService.submitAnswerFn === null) {
      return true;
    }
    /* Returns whether or not the Submit button should be disabled based on
     * the validity of the current answer. If the interaction does not pass
     * in a _validityCheckFn, then _validityCheckFn will be null and by
     * default we assume the answer is valid, so the submit button should
     * not be disabled.
     */
    if (CurrentInteractionService.validityCheckFn === null) {
      return false;
    }
    return !CurrentInteractionService.validityCheckFn();
  }

  updateViewWithNewAnswer(): void {
    CurrentInteractionService.answerChangedSubject.next();
  }

  get onAnswerChanged$(): Observable<void> {
    return CurrentInteractionService.answerChangedSubject.asObservable();
  }
}
angular.module('oppia').factory('CurrentInteractionService',
  downgradeInjectable(CurrentInteractionService));
