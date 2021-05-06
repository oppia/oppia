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
 * @fileoverview Component for logic question editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import logicProofShared from 'interactions/LogicProof/static/js/shared';
import logicProofTeacher from 'interactions/LogicProof/static/js/teacher';
import logicProofData from 'interactions/LogicProof/static/js/data';
import logicProofConversion from
  'interactions/LogicProof/static/js/conversion';
import LOGIC_PROOF_DEFAULT_QUESTION_DATA from
  'interactions/LogicProof/static/js/generatedDefaultData';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'logic-question-editor',
  templateUrl: './logic-question-editor.component.html'
})

export class LogicQuestionEditorComponent implements OnInit {
  @Input() modalId;
  @Input() value;
  @Output() valueChanged = new EventEmitter();
  localValue: {
    assumptionsString: string;
    targetString: string;
    errorMessage: string;
    proofString: string;
  };
  alwaysEditable: boolean = true;
  constructor() { }

  ngOnInit(): void {
    const assumptionsString = logicProofShared.displayExpressionArray(
      this.value.assumptions,
      logicProofData.BASE_STUDENT_LANGUAGE.operators);
    const targetString = logicProofShared.displayExpression(
      this.value.results[0],
      logicProofData.BASE_STUDENT_LANGUAGE.operators);
    this.localValue = {
      assumptionsString,
      targetString,
      errorMessage: '',
      proofString: this.value.default_proof_string
    };
  }

  changeAssumptions(): void {
    this.convertThenBuild(
      'logicQuestionAssumptions', 'assumptionsString');
  }

  changeTarget(): void {
    this.convertThenBuild('logicQuestionTarget', 'targetString');
  }

  changeProof(): void {
    this.convertThenBuild('logicQuestionProof', 'proofString');
  }

  convertThenBuild(elementID: string, nameOfString: string): void {
    const element = document.getElementById(elementID);
    const cursorPosition = (<HTMLInputElement>element).selectionEnd;
    this.localValue[nameOfString] =
      logicProofConversion.convertToLogicCharacters(
        this.localValue[nameOfString]);
    this.buildQuestion();
    // NOTE: Angular will reset the position of the cursor after this
    // function runs, so we need to delay our re-resetting.
    setTimeout(() => {
      (<HTMLInputElement>element).selectionEnd = cursorPosition;
    }, 2);
  }

  buildQuestion(): void {
    try {
      const builtQuestion = angular.copy(
        logicProofTeacher.buildQuestion(
          this.localValue.assumptionsString,
          this.localValue.targetString,
          LOGIC_PROOF_DEFAULT_QUESTION_DATA.vocabulary));
      this.value = {
        assumptions: builtQuestion.assumptions,
        results: builtQuestion.results,
        default_proof_string: this.localValue.proofString
      };
      this.valueChanged.emit(this.value);
      this.localValue.errorMessage = '';
    } catch (err) {
      this.localValue.errorMessage = err.message;
    }
  }
}

angular.module('oppia').directive(
  'logicQuestionEditor', downgradeComponent({
    component: LogicQuestionEditorComponent
  }) as angular.IDirectiveFactory);
