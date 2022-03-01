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
 * @fileoverview Utility functions for unit testing in AngularJS.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, NgModule, NgZone, PlatformRef, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeComponent, UpgradeModule } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { CookieModule, CookieService } from 'ngx-cookie';
import { TranslateCacheService, TranslateCacheSettings } from 'ngx-translate-cache';

import { angularServices } from 'services/angular-services.index';


declare var angular: ng.IAngularStatic;

export const importAllAngularServices = (): void => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        CookieModule.forRoot(),
      ],
      providers: [
        CookieService,
        {
          provide: AngularFireAuth,
          useValue: null
        },
        {
          provide: TranslateCacheService,
          useValue: null
        },
        {
          provide: TranslateCacheSettings,
          useValue: null
        },
        {
          provide: TranslateService,
          useValue: null
        }
      ],
    });
  });
  beforeEach(angular.mock.module('oppia', function(
      $provide: ng.auto.IProvideService) {
    for (let [serviceName, serviceType] of angularServices) {
      $provide.value(serviceName, TestBed.inject(serviceType));
    }
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
export const bootstrapAsync = async(
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
    const failHardModule = ($provide: ng.auto.IProvideService) => {
      $provide.value('$exceptionHandler', (err: unknown) => {
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
 * @param {never[]} upgradedComponentTypes - An array consisting of only
 *   one element. That element is the type of the upgraded component.
 */
export const setupAndGetUpgradedComponentAsync = async(
    kebabCaseName: string,
    camelCaseName: string,
    upgradedComponentTypes: never[]): Promise<string> => {
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
  return bootstrapAsync(
    platformBrowserDynamic(), Ng2Module, element, ng1Module).then(
    () => multiTrim(element.textContent));
};

/* This function overwrites the translationProvider for a dummy function
 * (customLoader). This is necessary to prevent the js test warnings about an
 * 'unexpected GET request' when the translationProvider tries to load the
 * translation files.
 * More info in the angular-translate documentation:
 *   http://angular-translate.github.io/docs/#/guide
 * (see the 'Unit Testing' section).
 */
export const TranslatorProviderForTests = function(
    $provide: ng.auto.IProvideService,
    $translateProvider: ng.translate.ITranslateProvider): void {
  $provide.factory(
    'customLoader', ['$q', function($q: { resolve: (arg0: {}) => {} }) {
      return function() {
        return $q.resolve({});
      };
    }]);
  $translateProvider.useLoader('customLoader');
};
