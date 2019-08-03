// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of ParamChange
 * domain objects.
 */

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

var DEFAULT_CUSTOMIZATION_ARGS = {
  Copier: {
    parse_with_jinja: true,
    value: '5'
  },
  RandomSelector: {
    list_of_values: ['sample value']
  }
};

export class ParamChange {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with possible underscore_cased
  // keys which give tslint errors against underscore_casing in favor of \
  // camelCasing.
  customizationArgs: any;
  generatorId: string;
  name: string;

  constructor(customizationArgs: any, generatorId: string, name: string) {
    this.customizationArgs = customizationArgs;
    this.generatorId = generatorId;
    this.name = name;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased keys which
  // give tslint errors against underscore_casing in favor of camelCasing.
  toBackendDict(): any {
    return {
      customization_args: this.customizationArgs,
      generator_id: this.generatorId,
      name: this.name
    };
  }
  resetCustomizationArgs(): void {
    this.customizationArgs = cloneDeep(
      DEFAULT_CUSTOMIZATION_ARGS[this.generatorId]);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ParamChangeObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'paramChangeBackendDict' is a dict with underscore_cased keys
  // which give tslint errors against underscore_casing in favor of camelCasing.
  createFromBackendDict(
      paramChangeBackendDict: any): ParamChange {
    return new ParamChange(
      paramChangeBackendDict.customization_args,
      paramChangeBackendDict.generator_id,
      paramChangeBackendDict.name);
  }
  createEmpty(paramName: string): ParamChange {
    return new ParamChange({
      parse_with_jinja: true,
      value: ''
    }, 'Copier', paramName);
  }
  createDefault(paramName: string): ParamChange {
    return new ParamChange(
      cloneDeep(DEFAULT_CUSTOMIZATION_ARGS.Copier), 'Copier', paramName);
  }
}

angular.module('oppia').factory(
  'ParamChangeObjectFactory', downgradeInjectable(ParamChangeObjectFactory));
