// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview FocusOn Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 *
 * NOTE TO DEVELOPERS: Please make sure that any code changes are done for BOTH
 * the directives in this file.
 * There are two attribute directives in this file. One for AngularJS code and
 * the other for Angular code.
 * Attribute directives can't be shared at between AngularJS and Angular
 * (similar to how pipes/filters can't be). The best that can be done in this
 * situation is shifting common code in a function and reusing those functions
 * or just keeping the repeated code in the file.
 * The old code can be safely removed when the directive is no longer used in
 * AngularJS codebase.
 */

import {Directive, ElementRef, Input, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {AppConstants} from 'app.constants';
import {FocusManagerService} from 'services/stateful/focus-manager.service';

@Directive({
  selector: '[oppiaFocusOn]',
})
export class FocusOnDirective implements OnDestroy {
  // This property is initialized using component interactions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input('oppiaFocusOn') focusOn!: string;
  directiveSubscriptions = new Subscription();
  constructor(
    private el: ElementRef,
    private focusManagerService: FocusManagerService
  ) {
    this.directiveSubscriptions.add(
      this.focusManagerService.onFocus.subscribe((name: string) => {
        if (name === this.focusOn) {
          this.el.nativeElement.focus();
        }

        // If the purpose of the focus switch was to clear focus, blur the
        // element.
        if (name === AppConstants.LABEL_FOR_CLEARING_FOCUS) {
          this.el.nativeElement.blur();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
