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

import { Component, NgModule, destroyPlatform } from '@angular/core';
import { NgZone, PlatformRef, Type } from '@angular/core';
import { async } from '@angular/core/testing';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent, UpgradeModule } from '@angular/upgrade/static';

declare var angular: ng.IAngularStatic;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failHardModule: any = ($provide) => {
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
      element, [failHardModule, ng1Module.name]));

    return upgrade;
  });
};

/**
 * A utility function to get coverage of the upgraded component class.
 * @param {string} kebabCaseName - Name of the upgraded component in kebab-case.
 * @param {string} camelCaseName - Name of the upgraded component in camelCase.
 * @param {unkownn} upgradedComponentTypes - An array consisting of only
 *   one element. That element is the type of the upgraded component.
 * @param {boolean} focus - To run this test in fdescribe.
 */
export const testUpgradeComponent = (
    kebabCaseName: string,
    camelCaseName: string,
    upgradedComponentTypes: unknown,
    focus?: boolean): void => {
  let template = '<' + kebabCaseName + '></' + kebabCaseName + '>';
  @Component({
    selector: 'mock-comp',
    template: template
  })
  class MockComponent {}
  const test = () => {
    beforeEach(() => destroyPlatform());
    afterEach(() => destroyPlatform());
    it('should cover the lines', async(() => {
      const ng1Component = {template: 'Hello, Angular!'};
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
      bootstrap(
        platformBrowserDynamic(), Ng2Module, element, ng1Module).then(
        () => {
          expect(
            multiTrim(element.textContent)).toBe('Hello, Angular!');
        });
    }));
  };
  if (focus) {
    fdescribe('Upgraded component', () => {
      test();
    });
  } else {
    describe('Upgraded component', () => {
      test();
    });
  }
};
