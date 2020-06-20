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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

const SYMBOLS_TO_REMOVE = [
  'norm', 'utf8', 'text', 'sym_name', 'eval', 'floor', 'factorial', 'sub',
  'int', 'defi', 'deriv', 'sum', 'prod', 'root', 'vec', 'point',
  'infinity', 'leq', 'less', 'geq', 'greater', 'neq'];

@Injectable({
  providedIn: 'root'
})
export class GuppyConfigurationService {
  static serviceIsInitialized = false;

  init(): void {
    if (GuppyConfigurationService.serviceIsInitialized) {
      return;
    }
    // Remove symbols since they are not supported.
    for (var symbol of SYMBOLS_TO_REMOVE) {
      Guppy.remove_global_symbol(symbol);
    }
    GuppyConfigurationService.serviceIsInitialized = true;
  }
}

angular.module('oppia').factory(
  'GuppyConfigurationService',
  downgradeInjectable(GuppyConfigurationService));
