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
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  OnChanges,
  Type,
} from '@angular/core';
import camelCaseFromHyphen from 'utility/string-utility';

import {TAG_TO_INTERACTION_MAPPING} from 'interactions/tag-to-interaction-mapping';

@Component({
  selector: 'oppia-interaction-display',
  template: '<div #interactionContainer></div>',
})
export class InteractionDisplayComponent implements AfterViewInit, OnChanges {
  @Input() htmlData!: string;
  @Input() classStr!: string;
  @Input() parentScope!: unknown;

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

      if (dom.body.firstElementChild) {
        const tagName = dom.body.firstElementChild.tagName;

        const interactionMapping = TAG_TO_INTERACTION_MAPPING as Record<
          string,
          Type<unknown>
        >;

        if (interactionMapping[tagName]) {
          let interaction = interactionMapping[tagName];

          const componentFactory =
            this.componentFactoryResolver.resolveComponentFactory(interaction);
          const componentRef =
            this.viewContainerRef.createComponent(componentFactory);

          let attributes = dom.body.firstElementChild.attributes;

          Array.from(attributes).forEach(attribute => {
            let attributeNameInCamelCase = camelCaseFromHyphen(attribute.name);
            let attributeValue: unknown = attribute.value;

            if (/[\])}[{(]/g.test(attribute.name)) {
              if (this.parentScope) {
                attributeValue = (this.parentScope as Record<string, unknown>)[
                  attributeNameInCamelCase
                ];
              } else {
                attributeValue = null;
              }
            } else {
              componentRef.location.nativeElement.setAttribute(
                attribute.name,
                attributeValue as string
              );
            }

            (componentRef.instance as Record<string, unknown>)[
              attributeNameInCamelCase
            ] = attributeValue;
          });

          componentRef.changeDetectorRef.detectChanges();
          this.changeDetectorRef.detectChanges();
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.htmlData &&
      changes.htmlData.currentValue !== changes.htmlData.previousValue &&
      this.viewContainerRef
    ) {
      this.viewContainerRef.clear();
      this.buildInteraction();
    }
  }
}
