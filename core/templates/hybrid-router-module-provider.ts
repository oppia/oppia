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
 * @fileoverview This provider enables us to use routerLink directive
 * in components which registered both on hybrid and angular pages.
 */

import { Directive, Input, ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { WindowRef } from 'services/contextual/window-ref.service';

// TODO(#13443): Remove hybrid router module provider once all pages are
// migrated to angular router.

/** Mock routerLink directive will be used in pages which are yet to be migrated
 *  to angular router.
 */
@Directive({
  selector: '[routerLink]'
})
export class MockRouterLink {
  @Input() routerLink!: string;
}

@NgModule({
  declarations: [
    MockRouterLink
  ],
  exports: [
    MockRouterLink
  ]
})
export class MockRouterModule {}

export class HybridRouterModuleProvider {
  static provide(): ModuleWithProviders<MockRouterModule | RouterModule> {
    let bodyContent = window.document.querySelector('body');

    // Checks whether the page is using angular router.
    if (bodyContent) {
      // eslint-disable-next-line oppia/no-inner-html
      if (bodyContent.innerHTML.indexOf(
        '<router-outlet></router-outlet>') > -1) {
        return {
          ngModule: RouterModule
        };
      }
    }

    return {
      ngModule: MockRouterModule,
    };
  }
}
