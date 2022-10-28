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
 * @fileoverview Headroom Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

import { Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import Headroom from 'headroom.js';

@Directive({
  selector: '[headroom]'
})
export class HeadroomDirective implements OnDestroy {
  @Input() tolerance?: Headroom.Tolerance;
  @Output() toleranceChange: EventEmitter<Headroom.Tolerance> = (
    new EventEmitter());

  @Input() offset?: number;
  @Output() offsetChange?: number;
  @Input() classes?: { [key: string]: string };
  @Output() classesChange: EventEmitter<{ [key: string]: string }> = (
    new EventEmitter());

  @Input() scroller?: ElementRef;
  headroom: Headroom;

  constructor(
    private el: ElementRef
  ) {
    let headroomOptions: Headroom.HeadroomOptions = {
      tolerance: this.tolerance ? this.tolerance : Headroom.options.tolerance,
      offset: this.offset ? this.offset : Headroom.options.offset,
      scroller: this.scroller ? document.querySelector(
        this.scroller.nativeElement) : Headroom.options.scroller,
      classes: this.classes ? this.classes : Headroom.options.classes,
    };

    this.headroom = new Headroom(this.el.nativeElement, headroomOptions);
    this.headroom.init();
  }

  ngOnDestroy(): void {
    this.headroom.destroy();
  }
}
