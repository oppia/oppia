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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AngularFireAuth} from '@angular/fire/auth';
import {TranslateService} from '@ngx-translate/core';
import {CookieModule, CookieService} from 'ngx-cookie';
import {
  TranslateCacheService,
  TranslateCacheSettings,
} from 'ngx-translate-cache';
import {RouterTestingModule} from '@angular/router/testing';

import {angularServices} from 'services/angular-services.index';

declare var angular: ng.IAngularStatic;

export const importAllAngularServices = (): void => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        CookieModule.forRoot(),
        RouterTestingModule,
      ],
      providers: [
        CookieService,
        {
          provide: AngularFireAuth,
          useValue: null,
        },
        {
          provide: TranslateCacheService,
          useValue: null,
        },
        {
          provide: TranslateCacheSettings,
          useValue: null,
        },
        {
          provide: TranslateService,
          useValue: null,
        },
      ],
    });
  });
  beforeEach(
    angular.mock.module('oppia', function ($provide) {
      for (let [serviceName, serviceType] of angularServices) {
        $provide.value(serviceName, TestBed.inject(serviceType));
      }
    })
  );
};

/* This function overwrites the translationProvider for a dummy function
 * (customLoader). This is necessary to prevent the js test warnings about an
 * 'unexpected GET request' when the translationProvider tries to load the
 * translation files.
 * More info in the angular-translate documentation:
 *   http://angular-translate.github.io/docs/#/guide
 * (see the 'Unit Testing' section).
 */
export const TranslatorProviderForTests = function (
  $provide: ng.auto.IProvideService,
  $translateProvider: ng.translate.ITranslateProvider
): void {
  $provide.factory('customLoader', [
    '$q',
    function ($q) {
      return function () {
        return $q.resolve({});
      };
    },
  ]);
  $translateProvider.useLoader('customLoader');
};
