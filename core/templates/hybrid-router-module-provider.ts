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

import {Directive, HostListener, Input, NgModule} from '@angular/core';
import {LocationStrategy} from '@angular/common';
import {
  RouterModule,
  RouterLinkWithHref,
  Router,
  ActivatedRoute,
} from '@angular/router';

import {AppConstants} from 'app.constants';
import {WindowRef} from 'services/contextual/window-ref.service';

// TODO(#13443): Remove hybrid router module provider once all pages are
// migrated to angular router.

@Directive({
  selector: '[smartRouterLink]',
})
export class SmartRouterLink extends RouterLinkWithHref {
  constructor(
    router: Router,
    route: ActivatedRoute,
    locationStrategy: LocationStrategy,
    private windowRef: WindowRef
  ) {
    super(router, route, locationStrategy);
  }

  @Input()
  set smartRouterLink(commands: string[] | string) {
    this.routerLink = commands;
  }

  @HostListener('click', [
    '$event.button',
    '$event.ctrlKey',
    '$event.shiftKey',
    '$event.altKey',
    '$event.metaKey',
  ])
  onClick(
    button: number,
    ctrlKey: boolean,
    shiftKey: boolean,
    altKey: boolean,
    metaKey: boolean
  ): boolean {
    let bodyContent = window.document.querySelector('body');
    let currentPageIsInRouter =
      // eslint-disable-next-line oppia/no-inner-html
      bodyContent && bodyContent.innerHTML.includes('<router-outlet>');
    let currentPageIsInLightweightRouter =
      bodyContent &&
      // eslint-disable-next-line oppia/no-inner-html
      bodyContent.innerHTML.includes('<router-outlet custom="light">');
    if (!currentPageIsInRouter && !currentPageIsInLightweightRouter) {
      this.windowRef.nativeWindow.location.href = this.urlTree.toString();
      return false;
    }

    let lightweightRouterPagesRoutes = [];
    let routerPagesRoutes = [];
    for (let page of Object.values(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND
    )) {
      let routeRegex = '^';
      for (let partOfRoute of page.ROUTE.split('/')) {
        if (partOfRoute.startsWith(':')) {
          routeRegex += '/[a-zA-Z_:]*';
        } else {
          routeRegex += `/${partOfRoute}`;
        }
      }
      routeRegex += '$';
      if ('LIGHTWEIGHT' in page) {
        lightweightRouterPagesRoutes.push(routeRegex);
      } else {
        routerPagesRoutes.push(routeRegex);
      }
    }

    if (currentPageIsInRouter) {
      for (let route of lightweightRouterPagesRoutes) {
        if (this.urlTree.toString().match(route)) {
          this.windowRef.nativeWindow.location.href = this.urlTree.toString();
          return false;
        }
      }
    }

    if (currentPageIsInLightweightRouter) {
      for (let route of routerPagesRoutes) {
        if (this.urlTree.toString().match(route)) {
          this.windowRef.nativeWindow.location.href = this.urlTree.toString();
          return false;
        }
      }
    }

    return super.onClick(button, ctrlKey, shiftKey, altKey, metaKey);
  }
}

@NgModule({
  imports: [RouterModule],
  declarations: [SmartRouterLink],
  exports: [SmartRouterLink],
})
export class SmartRouterModule {}
