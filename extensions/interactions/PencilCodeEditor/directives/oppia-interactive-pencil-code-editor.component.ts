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
 * @fileoverview Component for the PencilCodeEditor interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService, InteractionRulesService } from 'pages/exploration-player-page/services/current-interaction.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { Subscription } from 'rxjs';
import { PencilCodeResetConfirmationComponent } from './pencil-code-reset-confirmation.component';
import { PencilCodeEditorCustomizationArgs } from 'interactions/customization-args-defs';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { PencilCodeEditorRulesService } from './pencil-code-editor-rules.service';

@Component({
  selector: 'oppia-interactive-pencil-code-editor',
  templateUrl: './pencil-code-editor-interaction.component.html'
})
export class PencilCodeEditorComponent implements OnInit, OnDestroy {
  constructor(
    private playerPositionService: PlayerPositionService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private currentInteractionService: CurrentInteractionService,
    private ngbModal: NgbModal,
    private focusManagerService: FocusManagerService,
    private pencilCodeEditorRulesService: PencilCodeEditorRulesService
  ) {}

  @Input() lastAnswer;
  directiveSubscriptions = new Subscription();
  iframeDiv: Object;
  pce: PencilCodeEmbed;
  interactionIsActive: boolean;
  @Input() initialCodeWithValue;
  initialCode;

  private _getAttributes() {
    return {
      initialCodeWithValue: this.initialCodeWithValue
    };
  }

  reset(): void {
    this.ngbModal.open(PencilCodeResetConfirmationComponent, {
      backdrop: 'static',
      keyboard: false,
    }).result.then(() => {
      this.pce.setCode(this.initialCode);
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
    this.iframeDiv = document.getElementById('codeEditorIframe');
    this.pce = new PencilCodeEmbed(this.iframeDiv);
    this.interactionIsActive = (this.lastAnswer === null);

    const { initialCode } = (
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'PencilCodeEditor',
        this._getAttributes()
      ) as PencilCodeEditorCustomizationArgs);
    this.initialCode = this.interactionIsActive ?
      initialCode :
      this.lastAnswer.code;

    this.pce.beginLoad(this.initialCode.value);
    this.pce.on('load', () => {
      // Hides the error console at the bottom right, and prevents it
      // from showing up even if the code has an error. Also, hides the
      // turtle, and redefines say() to also write the text on the
      // screen.
      this.pce.setupScript([{
        code: [
          'window.onerror() {',
          '  return true;',
          '};',
          'debug.hide();',
          'window.removeEventListener("error", debug)',
          '',
          'ht();',
          '',
          'oldsay = window.say',
          'say(x) {',
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
        (pencilCodeHtml) => {
          let normalizedCode = this.getNormalizedCode();

          // Get all the divs, and extract their textual content.
          let output = $.map(
            $(pencilCodeHtml).filter('div'), (elem) => {
              return $(elem).text();
            }).join('\n');

          hasSubmittedAnswer = true;
          this.currentInteractionService.onSubmit({
            code: normalizedCode,
            output: output || '',
            evaluation: '',
            error: ''
          } as unknown as string,
           this.pencilCodeEditorRulesService as
           unknown as InteractionRulesService);
        }, true);
    });

    this.pce.on('error', (error: { message }) => {
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
      } as unknown as string,
       this.pencilCodeEditorRulesService as unknown as InteractionRulesService);

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
    {component: PencilCodeEditorComponent}
  ) as angular.IDirectiveFactory);
