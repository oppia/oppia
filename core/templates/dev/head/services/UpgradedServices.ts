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
 * @fileoverview Service for storing all upgraded services
 */

import { ErrorHandler, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { UtilsService } from 'services/UtilsService';
import { WindowDimensionsService } from './contextual/WindowDimensionsService';
import { LoggerService } from './LoggerService';
import { SearchService } from './SearchService';
import { EventService } from './EventService';
import { HttpClient, HttpEvent, HttpHandler,
  HttpRequest } from '@angular/common/http';
import {
  MissingTranslationHandler, MissingTranslationHandlerParams,
  TranslateCompiler,
  TranslateLoader,
  TranslateParser,
  TranslateService,
  TranslateStore
} from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  /* eslint-disable quote-props */
  upgradedServices = {
    'UtilsService': new UtilsService(),
    'WindowDimensionsService': new WindowDimensionsService(),
    'LoggerService': new LoggerService(new ErrorHandler()),
    'SearchService': new SearchService(new EventService(),
      new LoggerService(new ErrorHandler()),
      new HttpClient(new class extends HttpHandler {
        handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
          return undefined;
        }
      }), new TranslateService(new TranslateStore(),
        new class extends TranslateLoader {
          getTranslation(lang: string): Observable<any> {
            return undefined;
          }
        }, new class extends TranslateCompiler {
          compile(value: string, lang: string): string | Function {
            return undefined;
          }

          compileTranslations(translations: any, lang: string): any {
          }
        }, new class extends TranslateParser {
          getValue(target: any, key: string): any {
          }

          interpolate(expr: string | Function, params?: any): string {
            return '';
          }
        }, new class extends MissingTranslationHandler {
          handle(params: MissingTranslationHandlerParams): any {
          }
        }))
  };
  /* eslint-enable quote-props */
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
