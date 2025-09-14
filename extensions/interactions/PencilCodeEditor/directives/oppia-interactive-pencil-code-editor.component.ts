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

import {Component, Input, OnDestroy, OnInit, ElementRef} from '@angular/core';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {PencilCodeEditorCustomizationArgs} from 'interactions/customization-args-defs';
import {PencilCodeEditorRulesService} from './pencil-code-editor-rules.service';
import {PencilCodeResetConfirmation} from './pencil-code-reset-confirmation.component';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'oppia-interactive-pencil-code-editor',
  templateUrl: './pencil-code-editor-interaction.component.html',
})
export class PencilCodeEditor implements OnInit, OnDestroy {
  // `lastAnswer` stores the last submitted code and is always `{code: string} | null`. It is `null` if no previous answer exists.
  @Input() lastAnswer: {code: string} | null = null;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() initialCodeWithValue!: string;
  iframeDiv!: HTMLElement;
  pce!: PencilCodeEmbed;
  someInitialCode!: string;
  interactionIsActive: boolean = false;
  directiveSubscriptions = new Subscription();
  pencilCodeEditorIsLoaded: boolean = false;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private elementRef: ElementRef,
    private focusManagerService: FocusManagerService,
    private interactionAttributesExtractorService: InteractionAttributesExtractorService,
    private ngbModal: NgbModal,
    private playerPositionService: PlayerPositionService,
    private pencilCodeEditorRulesService: PencilCodeEditorRulesService
  ) {}

  private _getAttributes() {
    return {
      initialCodeWithValue: this.initialCodeWithValue,
    };
  }

  reset(): void {
    this.ngbModal
      .open(PencilCodeResetConfirmation, {
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        () => {
          this.pce.setCode(this.someInitialCode);
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  getNormalizedCode(): string {
    // Converts tabs to spaces.
    return this.pce.getCode().replace(/\t/g, '  ');
  }

  ngOnInit(): void {
    // Ensure lastAnswer is never undefined.
    this.lastAnswer = this.lastAnswer ?? null;
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(() => {
        this.interactionIsActive = false;
        this.pce.hideMiddleButton();
        this.pce.hideToggleButton();
        this.pce.setReadOnly();
      })
    );

    // The iframe may not be immediately available due to asynchronous rendering.
    // To handle this, we retry checking for its presence up to `maxRetries` times.
    // If the iframe does not appear within the retry limit, we display an error message.

    const maxRetries = 10;
    let retryCount = 0;

    const checkIframe = () => {
      let iframeElements = this.elementRef.nativeElement.querySelectorAll(
        '.pencil-code-editor-iframe'
      );

      if (iframeElements.length > 0) {
        this.iframeDiv = iframeElements[0] as HTMLElement;
        this.pce = new PencilCodeEmbed(this.iframeDiv);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkIframe, 200);
      } else {
        this.pencilCodeEditorIsLoaded = true;
      }
    };

    checkIframe();

    this.interactionIsActive = this.lastAnswer === null;

    const {initialCode} =
      this.interactionAttributesExtractorService.getValuesFromAttributes(
        'PencilCodeEditor',
        this._getAttributes()
      ) as PencilCodeEditorCustomizationArgs;
    this.someInitialCode = this.interactionIsActive
      ? initialCode.value
      : this.lastAnswer?.code || '';

    this.pce.beginLoad(this.someInitialCode);
    this.pce.on('load', () => {
      // Hides the error console at the bottom right, and prevents it
      // from showing up even if the code has an error. Also, hides the
      // turtle, and redefines say() to also write the text on the
      // screen.
      this.pce.setupScript([
        {
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
            '};',
          ].join('\n'),
          type: 'text/javascript',
        },
      ]);

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

    // Handles submission of the user's code execution result.
    // Used in both 'execute' and 'registerCurrentInteraction()' to ensure consistency.
    let submitInteractionAnswer = () => {
      // Prevents submission if an error has occurred or an answer has already been submitted.
      if (errorIsHappening || hasSubmittedAnswer) {
        return;
      }

      // Evaluates the code inside the Pencil Code iframe's context.
      // The first argument 'document.body.innerHTML' retrieves the current
      // HTML output generated by the user's code execution.
      // PencilCode sanitizes user input, ensuring security.
      this.pce.eval(
        'document.body.innerHTML', // disable-bad-pattern-check
        (pencilCodeHtml: string) => {
          // Normalize the user's inputted code (e.g., replace tabs with spaces).
          let normalizedCode = this.getNormalizedCode();

          // Extract all div elements from the executed output to get the textual content.
          let temp = document.createElement('div');

          // `pencilCodeHtml` is a string representing the raw HTML content inside
          // the output frame. We convert it into an element to access and extract
          // textual content from all the `div` elements present.
          // eslint-disable-next-line oppia/no-inner-html
          temp.innerHTML = pencilCodeHtml;

          let output: string = '';
          let htmlObject = temp.querySelectorAll('div');

          // Loop through each div element to extract its inner text.
          for (let i = 0; i < htmlObject.length; i++) {
            // eslint-disable-next-line oppia/no-inner-html
            output += htmlObject[i].innerHTML + '\n';
          }

          // Mark the answer as submitted to prevent duplicate submissions.
          hasSubmittedAnswer = true;

          // Submit the extracted code and its output to the current interaction service,
          // which handles storing the response and validating it against rules.
          this.currentInteractionService.onSubmit(
            {
              code: normalizedCode,
              output: output || '',
              evaluation: '',
              error: '',
            },
            this.pencilCodeEditorRulesService
          );
        },
        // Execute evaluation within the iframe context.
        true
      );
    };

    this.pce.on('execute', submitInteractionAnswer);

    this.pce.on('error', (error: {message: string}) => {
      if (hasSubmittedAnswer) {
        return;
      }
      let normalizedCode = this.getNormalizedCode();

      errorIsHappening = true;
      hasSubmittedAnswer = true;

      this.currentInteractionService.onSubmit(
        {
          code: normalizedCode,
          output: '',
          evaluation: '',
          error: error.message,
        },
        this.pencilCodeEditorRulesService
      );

      setTimeout(() => {
        errorIsHappening = false;
      }, 1000);
    });

    this.currentInteractionService.registerCurrentInteraction(
      submitInteractionAnswer,
      null
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
