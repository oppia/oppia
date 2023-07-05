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
 * @fileoverview Directive for the CodeRepl interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { Subscription } from 'rxjs';

import { CodeReplCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { CodeReplRulesService } from './code-repl-rules.service';

@Component({
  selector: 'oppia-interactive-code-repl',
  templateUrl: './code-repl-interaction.component.html',
  styleUrls: []
})
export class InteractiveCodeReplComponent implements
    OnInit, AfterViewInit, OnDestroy {
  @Input() lastAnswer;
  @Input() languageWithValue;
  @Input() placeholderWithValue;
  @Input() preCodeWithValue;
  @Input() postCodeWithValue;
  @ViewChild(CodemirrorComponent) codeMirrorComponent: CodemirrorComponent;
  componentSubscriptions = new Subscription();
  hasLoaded: boolean = true;
  code: string;
  evaluation: string;
  fullError: string;
  output: string;
  interactionIsActive: boolean;
  language: string;
  placeholder: string;
  preCode: string;
  postCode: string;

  editorOptions = {
    lineNumbers: true,
    indentWithTabs: true,
    indentUnit: 4,
    mode: 'python',
    extraKeys: {
      Tab: (cm: CodeMirror.Editor): void => {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
        // Move the cursor to the end of the selection.
        var endSelectionPos = cm.getDoc().getCursor('head');
        cm.getDoc().setCursor(endSelectionPos);
      }
    },
    theme: 'preview default'
  };

  constructor(
    private changeDetectionRef: ChangeDetectorRef,
    private currentInteractionService: CurrentInteractionService,
    private codeReplRulesService: CodeReplRulesService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private playerPositionService: PlayerPositionService
  ) { }

  ngOnInit(): void {
    this.componentSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => this.interactionIsActive = false
      )
    );
    const {
      language,
      placeholder,
      preCode,
      postCode
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'CodeRepl',
      {
        languageWithValue: this.languageWithValue,
        placeholderWithValue: this.placeholderWithValue,
        preCodeWithValue: this.preCodeWithValue,
        postCodeWithValue: this.postCodeWithValue,
      }
    ) as CodeReplCustomizationArgs;

    this.interactionIsActive = (this.lastAnswer === null);
    this.language = language.value;
    this.placeholder = placeholder.value;
    this.preCode = preCode.value;
    this.postCode = postCode.value;

    // Make sure this.preCode ends with a newline.
    if (this.preCode.trim().length === 0) {
      this.preCode = '';
    } else if (this.preCode.slice(-1) !== '\n') {
      this.preCode += '\n';
    }

    // Make sure this.placeholder ends with a newline.
    if (this.placeholder.slice(-1) !== '\n') {
      this.placeholder += '\n';
    }

    this.hasLoaded = false;

    // Keep the code string given by the user and the stdout from the
    // evaluation until sending them back to the server.
    if (this.interactionIsActive) {
      this.code = (
        this.preCode + this.placeholder + this.postCode);
      this.output = '';
    } else {
      this.code = this.lastAnswer.code;
      this.output = this.lastAnswer.output;
    }

    // Configure Skulpt.
    Sk.configure({
      output: (out) => {
        // This output function is called continuously throughout the
        // runtime of the script.
        this.output += out;
      },
      read: (name) => {
        // This function is called when a builtin module is imported.
        if (Sk.builtinFiles.files[name] === undefined) {
          // If corresponding module is not present then,
          // removal of this block also results in failure of import.
          throw new Error('module ' + name + ' not found');
        }
        return Sk.builtinFiles.files[name];
      },
      timeoutMsg: () => {
        this.sendResponse('', 'timeout');
      },
      execLimit: 10000
    });

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitAnswer(), null);
  }

  ngAfterViewInit(): void {
    const runAfterTimeout = () => {
      this.initMarkers(this.codeMirrorComponent.codeMirror);
      this.hasLoaded = true;
      this.changeDetectionRef.detectChanges();
    };
    setTimeout(() => {
      runAfterTimeout();
    }, 0);
  }

  runAndSubmitCode(codeInput: string): void {
    this.runCode(codeInput, (evaluation, err) => {
      this.sendResponse(evaluation, err);
    });
  }

  private submitAnswer() {
    this.runAndSubmitCode(this.code);
  }

  onEditorChange(code: string): void {
    this.code = code;
  }

  runCode(
      codeInput: string,
      onFinishRunCallback?: (x: string, error: string) => void
  ): void {
    this.code = codeInput;
    this.output = '';

    // Evaluate the program asynchronously using Skulpt.
    Sk.misceval.asyncToPromise(() => {
      Sk.importMainWithBody('<stdin>', false, codeInput, true);
    }).then(() => {
      // Finished evaluating.
      this.evaluation = '';
      this.fullError = '';

      if (onFinishRunCallback) {
        onFinishRunCallback('', '');
      }
    }, (err) => {
      if (!(err instanceof Sk.builtin.TimeLimitError)) {
        this.evaluation = '';
        this.fullError = String(err);

        if (onFinishRunCallback) {
          onFinishRunCallback('', String(err));
        }
      }
    });
  }

  private initMarkers(editor) {
    var doc = editor.getDoc();

    // The -1 here is because prepended code ends with a newline.
    var preCodeNumLines = this.preCode.split('\n').length - 1;
    var postCodeNumLines = this.postCode.split('\n').length;
    var fullCodeNumLines = this.code.split('\n').length;
    var userCodeNumLines = (
      fullCodeNumLines - preCodeNumLines - postCodeNumLines);

    // Mark pre- and post- code as uneditable, and give it some styling.
    var markOptions = {
      atomic: false,
      readOnly: true,
      inclusiveLeft: true,
      inclusiveRight: true
    };

    if (this.preCode.length !== 0) {
      doc.markText(
        {
          line: 0,
          ch: 0
        },
        {
          line: preCodeNumLines,
          ch: 0
        },
        angular.extend({}, markOptions, {
          inclusiveRight: false
        }));

      for (var i = 0; i < preCodeNumLines; i++) {
        editor.addLineClass(i, 'text', 'code-repl-noneditable-line');
      }
    }

    if (this.postCode.length !== 0) {
      doc.markText(
        {
          line: preCodeNumLines + userCodeNumLines,
          ch: 0
        },
        {
          line: fullCodeNumLines,
          ch: 0
        },
        markOptions);

      for (var i = 0; i < postCodeNumLines; i++) {
        editor.addLineClass(
          preCodeNumLines + userCodeNumLines + i,
          'text', 'code-repl-noneditable-line');
      }
    }
  }

  sendResponse(evaluation: string, err: string): void {
    this.currentInteractionService.onSubmit({
      // Replace tabs with 2 spaces.
      // TODO(#12712): (1) CodeRepl interaction.
      code: this.code.replace(/\t/g, '  ') || '',
      output: this.output,
      evaluation: this.evaluation,
      error: (err || '')
    },
    this.codeReplRulesService);
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveCodeRepl', downgradeComponent({
    component: InteractiveCodeReplComponent
  }) as angular.IDirectiveFactory);
