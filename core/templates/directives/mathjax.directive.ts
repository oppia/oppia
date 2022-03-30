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
 * @fileoverview MathjaxBind Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

import {Directive, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';

@Directive({
  selector: '[oppiaMathJax]'
})
export class MathJaxDirective implements OnChanges {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1 .
  @Input('oppiaMathJax') texExpression!: string;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.texExpression &&
      changes.texExpression.currentValue !==
      changes.texExpression.previousValue) {
      let s = document.createElement('script');
      s.type = 'math/tex';
      s.text = this.texExpression === undefined ? '' : this.texExpression;
      this.el.nativeElement.innerHTML = s.outerHTML;
      MathJax.Hub.Queue(['Reprocess', MathJax.Hub, this.el.nativeElement]);
    }
  }
}
