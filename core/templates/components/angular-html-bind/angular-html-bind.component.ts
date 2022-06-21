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
 * @fileoverview AngularHtmlBind Component (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

// HTML bind component that trusts the value it is given and also evaluates
// custom component tags in the provided value.

import { ChangeDetectorRef, Component, ComponentFactoryResolver, Input,
  SimpleChanges, ViewChild, ViewContainerRef }
  from '@angular/core';

import { AlgebraicExpressionInputInteractionComponent } from 'interactions/AlgebraicExpressionInput/directives/oppia-interactive-algebraic-expression-input.component';
import { InteractiveCodeReplComponent } from 'interactions/CodeRepl/directives/oppia-interactive-code-repl.component';
import { OppiaInteractiveContinue } from 'interactions/Continue/directives/oppia-interactive-continue.component';
import { InteractiveDragAndDropSortInputComponent } from 'interactions/DragAndDropSortInput/directives/oppia-interactive-drag-and-drop-sort-input.component';
import { InteractiveEndExplorationComponent } from 'interactions/EndExploration/directives/oppia-interactive-end-exploration.component';
import { InteractiveFractionInputComponent } from 'interactions/FractionInput/directives/oppia-interactive-fraction-input.component';
import { InteractiveGraphInput } from 'interactions/GraphInput/directives/oppia-interactive-graph-input.component';
import { InteractiveImageClickInput } from 'interactions/ImageClickInput/directives/oppia-interactive-image-click-input.component';
import { InteractiveInteractiveMapComponent } from 'interactions/InteractiveMap/directives/oppia-interactive-interactive-map.component';
import { InteractiveItemSelectionInputComponent } from 'interactions/ItemSelectionInput/directives/oppia-interactive-item-selection-input.component';
import { InteractiveMathEquationInput } from 'interactions/MathEquationInput/directives/oppia-interactive-math-equation-input.component';
import { InteractiveMultipleChoiceInputComponent } from 'interactions/MultipleChoiceInput/directives/oppia-interactive-multiple-choice-input.component';
import { MusicNotesInputComponent } from 'interactions/MusicNotesInput/directives/oppia-interactive-music-notes-input.component';
import { InteractiveNumberWithUnitsComponent } from 'interactions/NumberWithUnits/directives/oppia-interactive-number-with-units.component';
import { InteractiveNumericExpressionInput } from 'interactions/NumericExpressionInput/directives/oppia-interactive-numeric-expression-input.component';
import { InteractiveNumericInput } from 'interactions/NumericInput/directives/oppia-interactive-numeric-input.component';
import { PencilCodeEditor } from 'interactions/PencilCodeEditor/directives/oppia-interactive-pencil-code-editor.component';
import { InteractiveRatioExpressionInputComponent } from 'interactions/RatioExpressionInput/directives/oppia-interactive-ratio-expression-input.component';
import { InteractiveSetInputComponent } from 'interactions/SetInput/directives/oppia-interactive-set-input.component';
import { InteractiveTextInputComponent } from 'interactions/TextInput/directives/oppia-interactive-text-input.component';

@Component({
  selector: 'angular-html-bind',
  templateUrl: './angular-html-bind.component.html',
})
export class AngularHtmlBindComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() htmlData!: string;
  @Input() classStr!: string;
  @Input() parentScope: unknown;
  htmlDataIsInteraction: boolean = false;

  @ViewChild('interactionContainer', {
    read: ViewContainerRef}) viewContainerRef!: ViewContainerRef;

  mapping = {
    'OPPIA-INTERACTIVE-CODE-REPL': InteractiveCodeReplComponent,
    'OPPIA-INTERACTIVE-END-EXPLORATION': InteractiveEndExplorationComponent,
    'OPPIA-INTERACTIVE-CONTINUE': OppiaInteractiveContinue,
    'OPPIA-INTERACTIVE-IMAGE-CLICK-INPUT': InteractiveImageClickInput,
    'OPPIA-INTERACTIVE-ITEM-SELECTION-INPUT':
    InteractiveItemSelectionInputComponent,
    'OPPIA-INTERACTIVE-MULTIPLE-CHOICE-INPUT':
    InteractiveMultipleChoiceInputComponent,
    'OPPIA-INTERACTIVE-NUMERIC-INPUT': InteractiveNumericInput,
    'OPPIA-INTERACTIVE-TEXT-INPUT': InteractiveTextInputComponent,
    'OPPIA-INTERACTIVE-DRAG-AND-DROP-SORT-INPUT':
    InteractiveDragAndDropSortInputComponent,
    'OPPIA-INTERACTIVE-FRACTION-INPUT': InteractiveFractionInputComponent,
    'OPPIA-INTERACTIVE-GRAPH-INPUT': InteractiveGraphInput,
    'OPPIA-INTERACTIVE-SET-INPUT': InteractiveSetInputComponent,
    'OPPIA-INTERACTIVE-NUMERIC-EXPRESSION-INPUT':
    InteractiveNumericExpressionInput,
    'OPPIA-INTERACTIVE-ALGEBRAIC-EXPRESSION-INPUT':
    AlgebraicExpressionInputInteractionComponent,
    'OPPIA-INTERACTIVE-MATH-EQUATION-INPUT': InteractiveMathEquationInput,
    'OPPIA-INTERACTIVE-NUMBER-WITH-UNITS': InteractiveNumberWithUnitsComponent,
    'OPPIA-INTERACTIVE-RATIO-EXPRESSION-INPUT':
    InteractiveRatioExpressionInputComponent,
    'OPPIA-INTERACTIVE-PENCIL-CODE-EDITOR': PencilCodeEditor,
    'OPPIA-INTERACTIVE-MUSIC-NOTES-INPUT': MusicNotesInputComponent,
    'OPPIA-INTERACTIVE-INTERACTIVE-MAP': InteractiveInteractiveMapComponent,
  };

  camelCaseFromHyphen(str: string): string {
    const newStr = str.replace(/[\])}[{(]/g, '');
    return newStr.replace(
      /-([a-z])/g,
      function(g) {
        return g[1].toUpperCase();
      });
  }

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    let domparser = new DOMParser();
    if (this.htmlData) {
      let dom = domparser.parseFromString(this.htmlData, 'text/html');
      if (dom.body.firstElementChild &&
        this.mapping[dom.body.firstElementChild.tagName]) {
        const componentFactory = this.componentFactoryResolver
          .resolveComponentFactory(
            this.mapping[dom.body.firstElementChild.tagName]);

        const componentRef = this.viewContainerRef.createComponent(
          componentFactory);
        let attributes = dom.body.firstElementChild.attributes;

        for (let i = 0; i < attributes.length; i++) {
          if (/[\])}[{(]/g.test(attributes[i].name)) {
            if (this.parentScope) {
              componentRef.instance[
                this.camelCaseFromHyphen(attributes[i].name)] =
              this.parentScope[this.camelCaseFromHyphen(attributes[i].name)];
            } else {
              componentRef.instance[
                this.camelCaseFromHyphen(attributes[i].name)] = null;
            }
          } else {
            componentRef.instance[
              this.camelCaseFromHyphen(attributes[i].name)] =
              attributes[i].value;

            componentRef.location.nativeElement.setAttribute(
              attributes[i].name, attributes[i].value);
          }
        }

        this.htmlDataIsInteraction = true;
        componentRef.changeDetectorRef.detectChanges();
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When there are trailing spaces in the HTML, CKEditor adds &nbsp;
    // to the HTML (eg: '<p> Text &nbsp; &nbsp; %nbsp;</p>'), which can
    // lead to UI issues when displaying it. Hence, the following block
    // replaces the trailing ' &nbsp; &nbsp; %nbsp;</p>' with just '</p>'.
    // We can't just find and replace '&nbsp;' here since, those in the
    // middle may actually be required. Only the trailing ones need to be
    // replaced.
    if (changes.htmlData) {
      this.htmlData = changes.htmlData.currentValue
        .replace(/^(<p>\&nbsp\;<\/p>\n\n)+/g, '');
      this.htmlData = this.htmlData.replace(/(&nbsp;(\s)?)*(<\/p>)/g, '</p>');
      // The following line is required since blank newlines in between
      // paragraphs are treated as <p>&nbsp;</p> by ckedior. So, these
      // have to be restored, as this will get reduced to <p></p> above.
      // There is no other via user input to get <p></p>, so this wouldn't
      // affect any other data.
      this.htmlData = this.htmlData.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
    }
  }
}
