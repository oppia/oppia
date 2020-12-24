// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility functions for unit testing.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, NgModule, NgZone, PlatformRef, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeComponent, UpgradeModule } from '@angular/upgrade/static';

import { Observable, of } from 'rxjs';
import { angularServices } from 'services/angular-services.index';


declare var angular: ng.IAngularStatic;

// AngularFireAuth is an Angular-only service (i.e., _not_ AngularJS) that Oppia
// depends on to provide authentication services.
//
// Since the library is not @Injectable, we mock an interface and value during
// unit tests to satisfy dependents.
export class MockAngularFireAuth {
  constructor(public idToken: Observable<string> = of(null)) {
  }
  signOut(): Promise<void> {
    return Promise.resolve();
  }
}

export const importAllAngularServices = (): void => {
  const mockAngularFireAuth = new MockAngularFireAuth();
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{provide: AngularFireAuth, useValue: mockAngularFireAuth}],
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    for (let [serviceName, serviceType] of angularServices) {
      $provide.value(serviceName, TestBed.inject(serviceType));
    }
    $provide.value('AngularFireAuth', mockAngularFireAuth);
  }));
};

/**
 * Returns a div containing the compiled html.
 * @param {string} html - The html to be compiled.
 */
export const html = (html: string): Element => {
  // Don't return `body` itself, because using it as a `$rootElement` for ng1
  // will attach `$injector` to it and that will affect subsequent tests.
  const body = document.body;
  body.innerHTML = `<div>${html.trim()}</div>`;
  const div = document.body.firstChild as Element;

  if (div.childNodes.length === 1 && div.firstChild instanceof HTMLElement) {
    return div.firstChild;
  }

  return div;
};

/**
 * Trims the text by removing new lines and extra white space.
 * @param {string | null | undefined} text - The text to be trimmed of spaces.
 * @param {bool} allSpace - A bool to define whether to replace new line
 *   with a space or empty string.
 */
export const multiTrim = (
    text: string | null | undefined, allSpace = false): string => {
  // eslint-disable-next-line eqeqeq
  if (typeof text == 'string') {
    const repl = allSpace ? '' : ' ';
    return text.replace(/\n/g, '').replace(/\s+/g, repl).trim();
  }
  throw new Error('Argument can not be undefined.');
};

/**
 * And upgraded angularjs module.
 * @param {PlatformRef} platform - The platform reference for bootstraping.
 * @param {Type<{}>} Ng2Module - Angular module to bootstrap.
 * @param {Element} element - An html element.
 * @param {angular.IModule} ng1Module - The angularjs module to be included
 *  in angular zone.
 */
export const bootstrap = (
    platform: PlatformRef,
    Ng2Module: Type<{}>,
    element: Element,
    ng1Module: angular.IModule
): Promise<UpgradeModule> => {
// We bootstrap the Angular module first; then when it is ready (async) we
// bootstrap the AngularJS module on the bootstrap element (also ensuring that
// AngularJS errors will fail the test).
  return platform.bootstrapModule(Ng2Module).then(ref => {
    const ngZone = ref.injector.get<NgZone>(NgZone);
    const upgrade = ref.injector.get(UpgradeModule);
    const failHardModule = ($provide) => {
      $provide.value('$exceptionHandler', (err) => {
        throw err;
      });
      return '';
    };

    // The `bootstrap()` helper is used for convenience in tests, so that we
    // don't have to inject and call `upgrade.bootstrap()` on every Angular
    // module. In order to closer emulate what happens in real application,
    // ensure AngularJS is bootstrapped inside the Angular zone.
    ngZone.run(() => upgrade.bootstrap(
      // This throws "Type '($provide) => string' is not assignable to
      // type 'string'". We need to suppress this error because typescript
      // expects the module name to be an string but a custom module is
      // needed here.
      // @ts-ignore
      element, [failHardModule, ng1Module.name]));

    return upgrade;
  });
};

/**
 * A utility function to get coverage of the upgraded component class.
 * @param {string} kebabCaseName - Name of the upgraded component in kebab-case.
 * @param {string} camelCaseName - Name of the upgraded component in camelCase.
 * @param {unknown} upgradedComponentTypes - An array consisting of only
 *   one element. That element is the type of the upgraded component.
 */
export const setupAndGetUpgradedComponent = (
    kebabCaseName: string,
    camelCaseName: string,
    upgradedComponentTypes: unknown): Promise<string> => {
  let template = '<' + kebabCaseName + '></' + kebabCaseName + '>';
  @Component({
    selector: 'mock-comp',
    template: template
  })
  class MockComponent {}
  // The template in the next line is what is rendered. The text of the rendered
  // component should contain "Hello Oppia!". This text context is return
  // value.
  const ng1Component = {template: 'Hello Oppia!'};
  const ng1Module = angular.module('ng1Module', [])
    .component(camelCaseName, ng1Component)
    .directive('mockComp', downgradeComponent({component: MockComponent}));
  @NgModule({
    declarations: [upgradedComponentTypes[0], MockComponent],
    entryComponents: [MockComponent],
    imports: [BrowserModule, UpgradeModule]
  })
  class Ng2Module {
    ngDoBootstrap() {}
  }

  // Bootstrap.
  const element = html('<mock-comp></mock-comp>');
  return bootstrap(
    platformBrowserDynamic(), Ng2Module, element, ng1Module).then(
    () => multiTrim(element.textContent));
};
