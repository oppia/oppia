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
 * @fileoverview Service for initializing Guppy instances.
 */

import {Injectable} from '@angular/core';

const SYMBOLS_TO_REMOVE = [
  'norm',
  'utf8',
  'text',
  'sym_name',
  'eval',
  'floor',
  'factorial',
  'sub',
  'int',
  'defi',
  'deriv',
  'sum',
  'prod',
  'root',
  'vec',
  'point',
  'infinity',
  'leq',
  'less',
  'geq',
  'greater',
  'neq',
];

const MULTIPLICATION_SYMBOL_DICT = {
  output: {
    latex: '\\times',
    asciimath: '*',
  },
  keys: ['*'],
  attrs: {
    group: 'operations',
    type: '*',
  },
  ast: {
    type: 'operator',
  },
};

const FRACTION_SYMBOL_DICT = {
  output: {
    latex: '\\frac{{$1}}{{$2}}',
    small_latex: '\\frac{{$1}}{{$2}}',
    asciimath: '/',
    text: '({$1})/({$2})',
  },
  input: 1,
  keys: ['/'],
  attrs: {
    type: 'fraction',
    group: 'functions',
  },
  args: [
    {
      up: '1',
      down: '2',
      name: 'numerator',
      small: 'yes',
    },
    {
      up: '1',
      down: '2',
      delete: '1',
      name: 'denominator',
      small: 'yes',
    },
  ],
};

const DIVISION_SYMBOL_DICT = {
  output: {
    latex: '\\div',
    asciimath: '/',
    text: '/',
  },
  keys: ['/'],
  attrs: {
    group: 'operations',
    type: '/',
  },
  ast: {
    type: 'operator',
  },
};

@Injectable({
  providedIn: 'root',
})
export class GuppyConfigurationService {
  static serviceIsInitialized = false;

  constructor() {}

  init(): void {
    if (GuppyConfigurationService.serviceIsInitialized) {
      return;
    }

    Guppy.remove_global_symbol('*');
    Guppy.add_global_symbol('*', MULTIPLICATION_SYMBOL_DICT);

    // Remove symbols since they are not supported.
    for (let symbol of SYMBOLS_TO_REMOVE) {
      Guppy.remove_global_symbol(symbol);
    }
    Guppy.configure('buttons', ['controls']);
    Guppy.configure(
      'empty_content',
      '\\color{grey}{\\text{\\small{Type a formula here.}}}'
    );
    GuppyConfigurationService.serviceIsInitialized = true;
  }

  changeDivSymbol(useFraction: boolean | {value: boolean} = false): void {
    Guppy.add_global_symbol(
      '/',
      useFraction ? FRACTION_SYMBOL_DICT : DIVISION_SYMBOL_DICT
    );
  }
}
