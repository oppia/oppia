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
 * @fileoverview Directive for the PencilCodeEditor interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { PencilCodeEditorRulesService } from './pencil-code-editor-rules.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PencilCodeEditorCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-interactive-pencil-code-editor',
  templateUrl: './pencil-code-editor-interaction.component.html'
})
export class InteractivePencilCodeEditorComponent implements OnInit, OnDestroy {
  @Input() lastAnswer;
  @Input() initialCodeWithValue: string;
  directiveSubscriptions = new Subscription();
  initialCode;
  iframeDiv;
  pce;
  interactionIsActive: boolean;
  constructor(
    private currentInteractionService: CurrentInteractionService,
    private elementRef: ElementRef,
    private focusManagerService: FocusManagerService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private ngbModal: NgbModal,
    private pencilCodeEditorRulesService: PencilCodeEditorRulesService,
    private playerPositionService: PlayerPositionService,
  ) { }

  reset(content: TemplateRef<unknown>): void {
    this.ngbModal.open(content, {
      backdrop: 'static',
      keyboard: false
    }).result.then(() => {
      this.pce.setCode(this.initialCode);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  private getNormalizedCode() {
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
    this.iframeDiv = this.elementRef.nativeElement.getElementsByClassName(
      'pencil-code-editor-iframe')[0];
    this.pce = new PencilCodeEmbed(this.iframeDiv);
    this.interactionIsActive = (this.lastAnswer === null);

    const {
      initialCode
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'PencilCodeEditor',
      { initialCodeWithValue: this.initialCodeWithValue }
    ) as PencilCodeEditorCustomizationArgs;
    this.initialCode = this.interactionIsActive ?
      initialCode.value :
      this.lastAnswer.code;

    this.pce.beginLoad(this.initialCode);
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

    var errorIsHappening = false;
    var hasSubmittedAnswer = false;

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
          var normalizedCode = this.getNormalizedCode();

          // Get all the divs, and extract their textual content.
          var output = $.map(
            $(pencilCodeHtml).filter('div'), function(elem) {
              return $(elem).text();
            }).join('\n');

          hasSubmittedAnswer = true;
          this.currentInteractionService.onSubmit(
            {
              code: normalizedCode,
              output: output || '',
              evaluation: '',
              error: ''
            } as unknown as string,
            // eslint-disable-next-line max-len
            this.pencilCodeEditorRulesService as unknown as InteractionRulesService
          );
        }, true);
    });

    this.pce.on('error', (error) => {
      if (hasSubmittedAnswer) {
        return;
      }

      var normalizedCode = this.getNormalizedCode();

      errorIsHappening = true;
      hasSubmittedAnswer = true;

      this.currentInteractionService.onSubmit(
        {
          code: normalizedCode,
          output: '',
          evaluation: '',
          error: error.message
        } as unknown as string,
        this.pencilCodeEditorRulesService as unknown as InteractionRulesService
      );

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

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/PencilCodeEditor/directives/' +
  'pencil-code-editor-rules.service.ts');
require('services/contextual/window-dimensions.service.ts');
require(
  'interactions/interaction-attributes-extractor.service.ts');
require('services/stateful/focus-manager.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');

angular.module('oppia').directive(
  'oppiaInteractivePencilCodeEditor',
  downgradeComponent({
    component: InteractivePencilCodeEditorComponent
  }));
