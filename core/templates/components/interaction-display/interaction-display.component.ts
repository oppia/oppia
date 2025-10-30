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
 * @fileoverview Component for dynamically building and showing interactions.
 */

import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  Input,
  SimpleChange,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import camelCaseFromHyphen from 'utility/string-utility';

import {TAG_TO_INTERACTION_MAPPING} from 'interactions/tag-to-interaction-mapping';
import {InteractionAnswer} from 'interactions/answer-defs';

// Scope type for bracketed bindings consumed by dynamically created
// interaction components (e.g., [last-answer], [saved-solution]).
export interface InteractionParentScope {
  lastAnswer: InteractionAnswer | null;
  savedSolution?: InteractionAnswer | null;
}

// Narrow helper types for bracketed bindings that some interactions expose.
type WithLastAnswer = {lastAnswer: InteractionAnswer | null};
type WithSavedSolution = {savedSolution: InteractionAnswer | null};

@Component({
  selector: 'oppia-interaction-display',
  templateUrl: './interaction-display.component.html',
})
export class InteractionDisplayComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() htmlData!: string;
  // This property contains the list of classes that needs to be applied to
  // parent container of the created interaction.
  @Input() classStr!: string;
  // The passed htmlData sometimes accesses properties from the parent scope.
  // These properties are injected into the dynamically created interaction via
  // bracketed attributes like [last-answer] and [saved-solution] that get
  // resolved against this scope.
  @Input() parentScope?: InteractionParentScope;

  @ViewChild('interactionContainer', {
    read: ViewContainerRef,
  })
  viewContainerRef!: ViewContainerRef;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.buildInteraction();
  }

  buildInteraction(): void {
    if (this.htmlData) {
      let domparser = new DOMParser();
      let dom = domparser.parseFromString(this.htmlData, 'text/html');

      const first = dom.body.firstElementChild;
      if (
        first &&
        Object.prototype.hasOwnProperty.call(
          TAG_TO_INTERACTION_MAPPING,
          first.tagName
        )
      ) {
        type TagKeys = keyof typeof TAG_TO_INTERACTION_MAPPING;
        const tag = first.tagName as TagKeys;
        const interaction = TAG_TO_INTERACTION_MAPPING[tag] as Type<unknown>;

        const componentFactory =
          this.componentFactoryResolver.resolveComponentFactory(interaction);
        const componentRef =
          this.viewContainerRef.createComponent(componentFactory);

        let attributes = dom.body.firstElementChild.attributes;

        Array.from(attributes).forEach(attribute => {
          const attributeNameInCamelCase = camelCaseFromHyphen(attribute.name);

          // Properties enclosed with [] need to be resolved from parent scope.
          // NOTE TO DEVELOPERS: The variables in this case are keyed by the
          // attribute name and not the attribute value, so when passing down
          // scoped variables (eg in codebase: lastAnswer, savedSolution) make
          // sure the name of the attribute is the same as the local variable
          // that it should be bound to and not the value (seems like the value
          // is irrelevant for this usecase).
          if (/[\])}[{(]/g.test(attribute.name)) {
            // Handle only known bracketed bindings explicitly.
            if (attributeNameInCamelCase === 'lastAnswer') {
              const value = this.parentScope?.lastAnswer ?? null;
              if ('lastAnswer' in (componentRef.instance as object)) {
                (componentRef.instance as WithLastAnswer).lastAnswer = value;
              }
            } else if (attributeNameInCamelCase === 'savedSolution') {
              const value =
                this.parentScope?.savedSolution !== undefined
                  ? this.parentScope?.savedSolution ?? null
                  : null;
              if ('savedSolution' in (componentRef.instance as object)) {
                (componentRef.instance as WithSavedSolution).savedSolution =
                  value;
              }
            }
          } else {
            componentRef.location.nativeElement.setAttribute(
              attribute.name,
              attribute.value
            );
          }
        });

        componentRef.changeDetectorRef.detectChanges();
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  ngOnChanges(changes: {htmlData: SimpleChange}): void {
    if (
      changes.htmlData.currentValue !== changes.htmlData.previousValue &&
      this.viewContainerRef
    ) {
      this.viewContainerRef.clear();
      this.buildInteraction();
    }
  }
}
