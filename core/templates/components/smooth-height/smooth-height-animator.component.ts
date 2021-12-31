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
 * @fileoverview Component for the smooth height change animation.
 */

import { ElementRef, HostBinding, Component, Input, OnChanges } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'oppia-smooth-height-animator',
  template: `
    <ng-content></ng-content>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  animations: [
    trigger('grow', [
      transition('void <=> *', []),
      transition('* <=> *', [
        style({height: '{{startHeight}}px'}),
        animate('.5s ease'),
      ], {params: {startHeight: 0}})
    ])
  ]
})
export class SmoothHeightAnimatorComponent implements OnChanges {
  @Input() trigger;
  startHeight: number;
  @HostBinding('@grow') grow;

  constructor(private element: ElementRef) {}

  ngOnChanges(): void {
    this.startHeight = this.element.nativeElement.clientHeight;
    // Timeout delays the animation till the new content is rendered properly.
    this.grow = {
      value: this.trigger,
      params: {startHeight: this.startHeight}
    };
  }
}
