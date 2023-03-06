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
 * @fileoverview Component for the pencil code editor interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { downgradeComponent } from '@angular/upgrade/static';
import { Component, Input, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PencilCodeEditorCustomizationArgs } from 'interactions/customization-args-defs';
import { PencilCodeEditorRulesService } from './pencil-code-editor-rules.service';
import { PencilCodeResetConfirmation } from './pencil-code-reset-confirmation.component';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'oppia-interactive-pencil-code-editor',
  templateUrl: './pencil-code-editor-interaction.component.html'
})
export class PencilCodeEditor implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() lastAnswer!: { code: string };
  @Input() initialCodeWithValue!: string;
  iframeDiv!: NodeListOf<Element>;
  pce!: PencilCodeEmbed;
  someInitialCode!: string;
  interactionIsActive: boolean = false;
  directiveSubscriptions = new Subscription();

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private elementRef: ElementRef,
    private focusManagerService: FocusManagerService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private ngbModal: NgbModal,
    private playerPositionService: PlayerPositionService,
    private pencilCodeEditorRulesService: PencilCodeEditorRulesService
  ) {}

  private _getAttributes() {
    return {
      initialCodeWithValue: this.initialCodeWithValue
    };
  }

  reset(): void {
    this.ngbModal.open(PencilCodeResetConfirmation, {
      backdrop: 'static',
      keyboard: false,
    }).result.then(() => {
      this.pce.setCode(this.someInitialCode);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  getNormalizedCode(): string {
    // Converts tabs to spaces.
    return this.pce.getCode().replace(/\t/g, '  ');
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => {
          this.interactionIsActive = false;
          this.pce.hideMiddleButton();
          this.pce.hideToggleButton();
          this.pce.setReadOnly();
        }
      )
    );

    this.iframeDiv = this.elementRef.nativeElement.querySelectorAll(
      '.pencil-code-editor-iframe')[0];
    this.pce = new PencilCodeEmbed(this.iframeDiv);
    this.interactionIsActive = (this.lastAnswer === null);

    const { initialCode } = (
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'PencilCodeEditor',
        this._getAttributes()
      ) as PencilCodeEditorCustomizationArgs);
    this.someInitialCode = (
      this.interactionIsActive ? initialCode.value : this.lastAnswer.code);

    this.pce.beginLoad(this.someInitialCode);
    this.pce.on('load', () => {
      // Hides the error console at the bottom right, and prevents it
      // from showing up even if the code has an error. Also, hides the
      // turtle, and redefines say() to also write the text on the
      // screen.
      this.pce.setupScript([{
        code: [
          'window.onerror = function() {',
          '  return true;',
          '};',
          'debug.hide();',
          'window.removeEventListener("error", debug)',
          '',
          'ht();',
          '',
          'oldsay = window.say',
          'say = function(x) {',
          '  write(x);',
          '  oldsay(x);',
          '};'
        ].join('\n'),
        type: 'text/javascript'
      }]);

      this.pce.showEditor();
      this.pce.hideToggleButton();
      if (this.interactionIsActive) {
        this.pce.setEditable();
      } else {
        this.pce.hideMiddleButton();
        this.pce.setReadOnly();
      }

      // Pencil Code automatically takes the focus on load, so we clear
      // it.
      this.focusManagerService.clearFocus();
    });

    let errorIsHappening = false;
    let hasSubmittedAnswer = false;

    this.pce.on('startExecute', () => {
      hasSubmittedAnswer = false;
    });

    this.pce.on('execute', () => {
      if (errorIsHappening || hasSubmittedAnswer) {
        return;
      }
      // The first argument in the method below gets executed in the
      // pencilcode output-frame iframe context. The code input by the
      // user is sanitized by pencilcode so there is no security
      // issue in this case.
      this.pce.eval(
        'document.body.innerHTML', // disable-bad-pattern-check
        (pencilCodeHtml: string) => {
          let normalizedCode = this.getNormalizedCode();

          // Get all the divs, and extract their textual content.
          let temp = document.createElement('div');
          // 'pencilCodeHtml' here is a string of raw code for div of
          // 'pencil-code-editor-iframe' in template. In order to extract all
          // divs from raw code we are converting it first into an element
          // thereby selecting all the divs inside it and then extracting all
          // the content inside them for which 'innerHTML' is used.
          // eslint-disable-next-line oppia/no-inner-html
          temp.innerHTML = pencilCodeHtml;
          let output: string = '';
          let htmlObject = temp.querySelectorAll('div');
          for (let i = 0; i < htmlObject.length; i++) {
            // eslint-disable-next-line oppia/no-inner-html
            output += htmlObject[i].innerHTML + '\n';
          }

          hasSubmittedAnswer = true;
          this.currentInteractionService.onSubmit({
            code: normalizedCode,
            output: output || '',
            evaluation: '',
            error: ''
          }, this.pencilCodeEditorRulesService);
        }, true);
    });

    this.pce.on('error', (error: { message: string }) => {
      if (hasSubmittedAnswer) {
        return;
      }
      let normalizedCode = this.getNormalizedCode();

      errorIsHappening = true;
      hasSubmittedAnswer = true;

      this.currentInteractionService.onSubmit({
        code: normalizedCode,
        output: '',
        evaluation: '',
        error: error.message
      }, this.pencilCodeEditorRulesService);

      setTimeout(() => {
        errorIsHappening = false;
      }, 1000);
    });

    this.currentInteractionService.registerCurrentInteraction(null, null);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaInteractivePencilCodeEditor', downgradeComponent(
    {component: PencilCodeEditor}
  ) as angular.IDirectiveFactory);
