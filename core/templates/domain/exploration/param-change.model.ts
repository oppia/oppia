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
import cloneDeep from 'lodash/cloneDeep';

interface ParamChangeCustomizationArgs {
  parse_with_jinja?: boolean;
  value?: string;
  list_of_values?: string[];
}

interface CustomizationArgs {
  [generatorId: string]: ParamChangeCustomizationArgs;
}

const DEFAULT_CUSTOMIZATION_ARGS: CustomizationArgs = {
  Copier: {
    parse_with_jinja: true,
    value: '5',
  },
  RandomSelector: {
    list_of_values: ['sample value'],
  },
};

export interface ParamChangeBackendDict {
  customization_args: ParamChangeCustomizationArgs;
  generator_id: string;
  name: string;
}

export class ParamChange {
  customizationArgs: ParamChangeCustomizationArgs;
  generatorId: string;
  name: string;

  constructor(
    customizationArgs: ParamChangeCustomizationArgs,
    generatorId: string,
    name: string
  ) {
    this.customizationArgs = customizationArgs;
    this.generatorId = generatorId;
    this.name = name;
  }

  toBackendDict(): ParamChangeBackendDict {
    return {
      customization_args: this.customizationArgs,
      generator_id: this.generatorId,
      name: this.name,
    };
  }

  resetCustomizationArgs(): void {
    this.customizationArgs = cloneDeep(
      DEFAULT_CUSTOMIZATION_ARGS[this.generatorId]
    );
  }

  static createFromBackendDict(
    paramChangeBackendDict: ParamChangeBackendDict
  ): ParamChange {
    return new ParamChange(
      paramChangeBackendDict.customization_args,
      paramChangeBackendDict.generator_id,
      paramChangeBackendDict.name
    );
  }

  static createEmpty(paramName: string): ParamChange {
    return new ParamChange(
      {
        parse_with_jinja: true,
        value: '',
      },
      'Copier',
      paramName
    );
  }

  static createDefault(paramName: string): ParamChange {
    return new ParamChange(
      cloneDeep(DEFAULT_CUSTOMIZATION_ARGS.Copier),
      'Copier',
      paramName
    );
  }
}
