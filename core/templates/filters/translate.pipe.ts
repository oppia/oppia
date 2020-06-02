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
 * @fileoverview Translate pipe for i18n translations
 */

import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform }
  from '@angular/core';
import { Subscription } from 'rxjs';
import { LangChangeEvent, TranslateService } from 'services/translate.service';
import { UtilsService } from 'services/utils.service';

@Pipe({
  name: 'translate',
  pure: false // required to update the value when the promise is resolved
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  value: string = '';
  lastKey: string;
  lastParams: Object | Array<Object>;
  onLangChange: Subscription;

  constructor(
    private translate: TranslateService,
    private _ref: ChangeDetectorRef,
    private utils: UtilsService
  ) {}

  updateValue(
      key: string,
      interpolateParams?: Object,
      translations?: Object | undefined
  ): void {
    let onTranslation = (res: string) => {
      this.value = res !== undefined ? res : key;
      this.lastKey = key;
      this._ref.markForCheck();
    };
    if (translations) {
      let res = this.translate.getParsedResult(
        translations, key, interpolateParams);
      onTranslation(res);
    }
    onTranslation(this.translate.get(key, interpolateParams));
  }

  // args[0] can be either object or string or empty. So type of args could be
  // Array<Object> or Array<string> or an empty array.
  transform(
      query: string,
      ...args: Array<Object> | Array<string> | []): string {
    if (!query || !query.length) {
      return query;
    }

    let interpolateParams: Object;
    if (this.utils.isDefined(args[0]) && args.length) {
      if (typeof args[0] === 'string' && args[0].length) {
        // We want to accept objects written in the template such as {n:1},
        // {'n':1}, {n:'v'}
        // which is why we might need to change it to real JSON
        // objects such as {"n":1} or {"n":"v"}
        let validArgs: string = args[0]
          .replace(/(\')?([a-zA-Z0-9_]+)(\')?(\s)?:/g, '"$2":')
          .replace(/:(\s)?(\')(.*?)(\')/g, ':"$3"');
        try {
          interpolateParams = JSON.parse(validArgs);
        } catch (e) {
          // eslint-disable-next-line max-len
          throw new SyntaxError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`);
        }
      } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
        interpolateParams = args[0];
      }
    }

    // store the query, in case it changes
    this.lastKey = query;

    // store the params, in case they change
    this.lastParams = args;

    // set the value
    this.updateValue(query, interpolateParams);

    // if there is a subscription to onLangChange, clean it
    this._dispose();
    // subscribe to onLangChange event, in case the language changes
    if (!this.onLangChange) {
      this.onLangChange = this.translate.onLangChange.subscribe(
        (event: LangChangeEvent) => {
          this.updateValue(query, interpolateParams, event.translations);
        }
      );
    }
    return this.value;
  }

  /**
   * Clean any existing subscription to change events
   */
  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }

  ngOnDestroy(): void {
    this._dispose();
  }
}
