// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model class for creating new frontend instances of ParamType
 * domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

interface TypeDefinitionObject {
  validate: (value: unknown) => boolean;
  default_value: unknown;
}

export class ParamType {
  private _name: string;
  valueIsValid: (value: unknown) => boolean;
  defaultValue: unknown;

  // Static registry for all available types.
  private static registry: Record<string, ParamType> = (() => {
    const unicodeString = new ParamType({
      validate: (value: unknown): boolean =>
        typeof value === 'string' || value instanceof String,
      default_value: '',
    });

    unicodeString._name = 'UnicodeString';

    // Freeze type to prevent mutation
    Object.freeze(unicodeString);

    const registry: Record<string, ParamType> = {
      UnicodeString: unicodeString,
    };

    // Freeze registry itself
    Object.freeze(registry);

    return registry;
  })();

  constructor(typeDefinitionObject: TypeDefinitionObject) {
    if (!typeDefinitionObject.validate(typeDefinitionObject.default_value)) {
      throw new Error(
        'The default value is invalid according to the validation function.'
      );
    }

    this._name = '';
    this.valueIsValid = typeDefinitionObject.validate;
    this.defaultValue = typeDefinitionObject.default_value;
  }

  createDefaultValue(): unknown {
    return cloneDeep(this.defaultValue);
  }

  getName(): string {
    return this._name;
  }

  static getDefaultType(): ParamType {
    return this.registry.UnicodeString;
  }

  static getTypeFromBackendName(backendName: string): ParamType {
    const type = this.registry[backendName];
    if (!type) {
      throw new Error(`${backendName} is not a registered parameter type.`);
    }
    return type;
  }
}
