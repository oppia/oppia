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
  validate: (arg0: Object) => boolean;

  // The default value is typed as Object because its type could be anything.
  // It depends on the arguments passed to the constructor.
  default_value: Object;
}

export class ParamType {
  _name: string;
  valueIsValid: (arg0: Object) => boolean;
  defaultValue: Object;

  // Type registration.
  /** @type {Object.<String, ParamType>} */
  private static registry: Record<string, ParamType> = ParamType.initRegistry();

  /**
   * @private @constructor
   * Defines a specific type that a parameter can take.
   *
   * IMPORTANT: All new types must be created in this file and registered in the
   * {@link ParamType.registry}. See {@link ParamType.registry.UnicodeString}
   * for an example.
   *
   * @param {Function.<?, Boolean>} validateFunction - Returns true when a value
   * is valid.
   * @param {Object} defaultValue - simple value any parameter of this type can
   * take.
   */

  constructor(typeDefinitionObject: TypeDefinitionObject) {
    if (!typeDefinitionObject.validate(typeDefinitionObject.default_value)) {
      throw new Error(
        'The default value is invalid according to validation function'
      );
    }

    /** @member {String} */
    this._name = '';
    /** @member {Function.<Object, Boolean>} */
    this.valueIsValid = typeDefinitionObject.validate;
    /** @member {Object} */
    this.defaultValue = typeDefinitionObject.default_value;
  }

  private static initRegistry(): Record<string, ParamType> {
    const definitions: Record<string, TypeDefinitionObject> = {
      UnicodeString: {
        validate: (value: Object) =>
          typeof value === 'string' || value instanceof String,
        default_value: '',
      },
    };

    const registry: Record<string, ParamType> = {};
    for (const [name, definition] of Object.entries(definitions)) {
      const paramType = new ParamType(definition);
      paramType._name = name;
      Object.freeze(paramType);
      registry[name] = paramType;
    }
    return Object.freeze(registry);
  }

  /** @returns {Object} - A valid default value for this particular type. */
  createDefaultValue(): Object {
    return cloneDeep(this.defaultValue);
  }

  /** @returns {String} - The display-name of this type. */
  getName(): string {
    return this._name;
  }

  /** @returns {ParamType} - Implementation-defined default parameter type. */
  static getDefaultType(): ParamType {
    return this.registry.UnicodeString;
  }

  /**
   * @param {String} backendName - the name of the type to fetch.
   * @returns {ParamType} - The associated type, if any.
   * @throws {Error} - When the given type name isn't registered.
   */
  static getTypeFromBackendName(backendName: string): ParamType {
    if (!this.registry.hasOwnProperty(backendName)) {
      throw new Error(backendName + ' is not a registered parameter type.');
    }
    return this.registry[backendName];
  }
}
