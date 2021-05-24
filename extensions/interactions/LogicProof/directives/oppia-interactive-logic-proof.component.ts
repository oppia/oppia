// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the LogicProof Interaction.
 */
import { Component, Input, NgZone, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import 'components/code-mirror/codemirror.component';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import logicProofShared from 'interactions/LogicProof/static/js/shared';
import logicProofStudent from 'interactions/LogicProof/static/js/student';
import logicProofData from 'interactions/LogicProof/static/js/data';
import logicProofConversion from
  'interactions/LogicProof/static/js/conversion';
import LOGIC_PROOF_DEFAULT_QUESTION_DATA from
  'interactions/LogicProof/static/js/generatedDefaultData';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService, InteractionRulesService } from 'pages/exploration-player-page/services/current-interaction.service';
import { LogicProofRulesService } from './logic-proof-rules.service';
import CodeMirror from 'codemirror';
import { LogicProofCustomizationArgs } from 'interactions/customization-args-defs';
import cloneDeep from 'lodash/cloneDeep';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-interactive-logic-proof',
  templateUrl: './logic-proof-interaction.component.html'
})
export class InteractiveLogicProofComponent implements OnInit {
  interactionIsActive: boolean;
  @Input() lastAnswer;
  @Input() questionWithValue;
  proofString: string;
  editor: CodeMirror.Editor;
  localQuestionData;
  questionData;
  messageIsSticky: boolean;
  errorMessage: string;
  errorMark: CodeMirror.TextMarker;
  questionInstance;
  directiveSubscriptions: Subscription = new Subscription();
  expressions: string[];
  topTypes: string[];
  typing;
  assumptionsString: string;
  targetString: string;
  questionString: string;
  questionStringData: { target: string; assumptions: string; };

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private logicProofRulesService: LogicProofRulesService,
    private playerPositionService: PlayerPositionService,
    private ngbModal: NgbModal,
    private ngZone: NgZone
  ) { }

  private _getAttrs() {
    return {
      questionWithValue: this.questionWithValue
    };
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => this.interactionIsActive = false
      )
    );
    const {
      question
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'LogicProof',
      this._getAttrs()
    ) as LogicProofCustomizationArgs;
    this.localQuestionData = question.value;

    // This is the information about how to mark a question (e.g. the
    // permitted line templates) that is stored in defaultData.js within
    // the dependencies.
    this.questionData = cloneDeep(LOGIC_PROOF_DEFAULT_QUESTION_DATA);

    this.interactionIsActive = (this.lastAnswer === null);
    this.questionData.assumptions =
      this.localQuestionData.assumptions;
    this.questionData.results = this.localQuestionData.results;

    // Deduce the new operators, as in
    // logicProofTeacher.buildQuestion(),
    // since these are not currently stored separately for each
    // question.
    this.expressions = [] as string[];
    this.topTypes = [] as string[];
    for (var i = 0; i < this.questionData.assumptions.length; i++) {
      this.expressions.push(this.questionData.assumptions[i]);
      this.topTypes.push('boolean');
    }
    this.expressions.push(this.questionData.results[0]);
    this.topTypes.push('boolean');
    this.typing = logicProofShared.assignTypesToExpressionArray(
      this.expressions, this.topTypes,
      logicProofData.BASE_STUDENT_LANGUAGE,
      ['variable', 'constant', 'prefix_function']
    );

    this.questionData.language.operators = this.typing[0].operators;

    if (this.questionData.assumptions.length <= 1) {
      this.assumptionsString = logicProofShared.displayExpressionArray(
        this.questionData.assumptions,
        this.questionData.language.operators);
    } else {
      this.assumptionsString = logicProofShared.displayExpressionArray(
        this.questionData.assumptions.slice(
          0, this.questionData.assumptions.length - 1
        ), this.questionData.language.operators
      ) + ' and ' + logicProofShared.displayExpression(
        this.questionData.assumptions[
          this.questionData.assumptions.length - 1],
        this.questionData.language.operators);
    }
    this.targetString = logicProofShared.displayExpression(
      this.questionData.results[0],
      this.questionData.language.operators);
    this.questionString = (
      this.assumptionsString === '' ?
        'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_NO_ASSUMPTION' :
        'I18N_INTERACTIONS_LOGIC_PROOF_QUESTION_STR_ASSUMPTIONS');
    this.questionStringData = {
      target: this.targetString,
      assumptions: this.assumptionsString
    };

    this.questionInstance = logicProofStudent.buildInstance(
      this.questionData);
    // Denotes whether messages are in response to a submission, in
    // which
    // case they persist for longer.
    this.messageIsSticky = false;

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitProof(), null);
  }

  codeEditor(editor: CodeMirror.Editor): void {
    var proofString = (
      this.interactionIsActive ?
      this.localQuestionData.default_proof_string :
        this.lastAnswer.proof_string);
    editor.setValue(proofString);
    this.proofString = editor.getValue();
    var cursorPosition = (
      editor as unknown as {doc: CodeMirror.Doc}).doc.getCursor();

    editor.setOption('lineNumbers', true);
    editor.setOption('lineWrapping', true);

    // NOTE: this is necessary to avoid the textarea being greyed-out.
    // See: http://stackoverflow.com/questions/8349571 for discussion.
    setTimeout(() => {
      editor.refresh();
    }, 500);

    this.ngZone.runOutsideAngular(() => {
    // NOTE: we must use beforeChange rather than change here to avoid
    // an infinite loop (which code-mirror will not catch).
      editor.on('beforeChange', (instance, change) => {
        var convertedText =
      logicProofConversion.convertToLogicCharacters(
        change.text.join('\n'));
        if (convertedText !== change.text.join('\n')) {
        // We update using the converted text, then cancel its being
        // overwritten by the original text.
          (editor as unknown as {doc: CodeMirror.Doc}).doc.replaceRange(
            convertedText, change.from, change.to);
          change.cancel();
        }
      });

      editor.on('cursorActivity', () => {
        if ((
        editor as unknown as {
          doc: CodeMirror.Doc}).doc.getCursor().line !== cursorPosition.line) {
          this.ngZone.run(() => {
            this.checkForBasicErrors();
            cursorPosition = (
            editor as unknown as {doc: CodeMirror.Doc}).doc.getCursor();
          });
        }
      });

      // NOTE: we use change rather than beforeChange here so that
      // checking for mistakes is done with respect to the updated text.
      editor.on('change', (instance, change) => {
        this.ngZone.run(() => {
          this.proofString = editor.getValue();
          // We update the message only if the user has added or removed a
          // line break, so that it remains while they work on a single
          // line.
          if (change.text.length > 1 || change.removed.length > 1) {
            this.checkForBasicErrors();
          }
        });
      });
    });

    this.editor = editor;
  }

  checkForBasicErrors(): void {
    if (!this.messageIsSticky) {
      this.clearMessage();
    }
    try {
      logicProofStudent.validateProof(
        this.proofString, this.questionInstance);
    } catch (err) {
      this.clearMessage();
      this.showMessage(err.message, err.line);
      this.messageIsSticky = false;
    }
  }

  clearMessage(): void {
    if (this.errorMark) {
      this.errorMark.clear();
    }
    this.errorMessage = '';
  }

  showMessage(message: string, lineNum: number): void {
    this.errorMessage = this.constructDisplayedMessage(
      message, lineNum);
    this.errorMark = (
      this.editor as unknown as {doc: CodeMirror.Doc}).doc.markText({
      line: lineNum,
      ch: 0
    }, {
      line: lineNum,
      ch: 100
    }, {
      className: 'logic-proof-erroneous-line'
    });
  }

  constructDisplayedMessage(message: string, lineNum: number): string {
    return 'line ' + (lineNum + 1) + ': ' + message;
  }

  displayProof(proofString: string, errorLineNum?: number): string[] {
    var proofLines = proofString.split('\n');
    var numberedLines = [];
    for (var i = 0; i < proofLines.length; i++) {
      numberedLines.push((i + 1) + '  ' + proofLines[i]);
    }
    // We split incorrect proofs into three parts so that response.html
    // can make the invalid line bold.
    return (errorLineNum === undefined) ?
      [numberedLines.join('\n')] :
      [
        numberedLines.slice(0, errorLineNum).join('\n'),
        numberedLines[errorLineNum],
        numberedLines.slice(
          errorLineNum + 1, numberedLines.length).join('\n')
      ];
  }

  // NOTE: proof_num_lines, displayed_question and displayed_proof are
  // only computed here because response.html needs them and does not
  // have its own javascript.
  submitProof(): void {
    this.clearMessage();
    var submission = {
      assumptions_string: this.assumptionsString,
      target_string: this.targetString,
      proof_string: this.proofString,
      proof_num_lines: this.proofString.split('\n').length,
      displayed_question: this.questionString,
      correct: null,
      error_category: null,
      error_code: null,
      error_message: null,
      error_line_number: null,
      displayed_message: null,
      displayed_proof: null
    };
    try {
      var proof = logicProofStudent.buildProof(
        this.proofString, this.questionInstance);
      logicProofStudent.checkProof(proof, this.questionInstance);
      submission.correct = true;
    } catch (err) {
      submission.correct = false;
      submission.error_category = err.category;
      submission.error_code = err.code;
      submission.error_message = err.message;
      submission.error_line_number = err.line;
      submission.displayed_message =
        this.constructDisplayedMessage(err.message, err.line);
      submission.displayed_proof =
        this.displayProof(this.proofString, err.line);

      this.showMessage(err.message, err.line);
      this.messageIsSticky = true;
    }
    if (submission.correct) {
      submission.displayed_message = '';
      submission.displayed_proof = this.displayProof(this.proofString);
    }
    this.currentInteractionService.onSubmit(
      submission as unknown as string,
      this.logicProofRulesService as unknown as InteractionRulesService);
  }

  showHelp(content: TemplateRef<unknown>): void {
    this.ngbModal.open(content, {backdrop: true}).result.then(
      function() {}, function() {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
      }
    );
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveLogicProof', downgradeComponent({
    component: InteractiveLogicProofComponent
  }));
