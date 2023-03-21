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

import { ChangeDetectorRef, Component, ComponentFactoryResolver, Input,
  SimpleChange,
  ViewChild, ViewContainerRef }
  from '@angular/core';
import camelCaseFromHyphen from 'utility/string-utility';

import { TAG_TO_INTERACTION_MAPPING } from 'interactions/tag-to-interaction-mapping';

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
  // TODO(#13015): Remove use of unknown as a type.
  // The passed htmlData sometimes accesses property from parent scope.
  @Input() parentScope!: unknown;

  @ViewChild('interactionContainer', {
    read: ViewContainerRef}) viewContainerRef!: ViewContainerRef;

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

      if (dom.body.firstElementChild &&
        TAG_TO_INTERACTION_MAPPING[
          dom.body.firstElementChild.tagName]) {
        let interaction = TAG_TO_INTERACTION_MAPPING[
          dom.body.firstElementChild.tagName];

        const componentFactory = this.componentFactoryResolver
          .resolveComponentFactory(interaction);
        const componentRef = this.viewContainerRef.createComponent(
          componentFactory);

        let attributes = dom.body.firstElementChild.attributes;

        Array.from(attributes).forEach(attribute => {
          let attributeNameInCamelCase = camelCaseFromHyphen(
            attribute.name);

          let attributeValue = attribute.value;

          // Properties enclosed with [] needs to be resolved from parent scope.
          // NOTE TO DEVELOPERS: The variables in this case are keyed by the
          // attribute name and not the attribute value, so when passing down
          // scoped variables (eg in codebase: lastAnswer, savedSolution) make
          // sure the name of the attribute is the same as the local variable
          // that it should be bound to and not the value (seems like the value
          // is irrelevant for this usecase).
          if (/[\])}[{(]/g.test(attribute.name)) {
            if (this.parentScope) {
              attributeValue = this.parentScope[attributeNameInCamelCase];
            } else {
              attributeValue = null;
            }
          } else {
            componentRef.location.nativeElement.setAttribute(
              attribute.name, attributeValue);
          }

          componentRef.instance[attributeNameInCamelCase] = attributeValue;
        });

        componentRef.changeDetectorRef.detectChanges();
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  ngOnChanges(changes: { htmlData: SimpleChange }): void {
    if (changes.htmlData.currentValue !== changes.htmlData.previousValue &&
      this.viewContainerRef) {
      this.viewContainerRef.clear();
      this.buildInteraction();
    }
  }
}
