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
 * @fileoverview Factory for creating new frontend instances of ParamType
 * domain objects.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('ParamTypeObjectFactory', [function() {
  /**
   * @private @constructor
   * Defines a specific type that a parameter can take.
   *
   * IMPORTANT: All new types must be created in this file and registered in the
   * {@link ParamType.registry}. See {@link ParamType.registry.UnicodeString}
   * for an example.
   *
   * @param {Function.<?, Boolean>} validateFunction - Returns true when a value
   *    is valid.
   * @param {?} defaultValue - simple value any parameter of this type can take.
   */
  var ParamType = function(typeDefinitionObject) {
    if (!typeDefinitionObject.validate(typeDefinitionObject.default_value)) {
      throw new Error(
        'The default value is invalid according to validation function');
    }

    /** @member {String} */
    this._name = null;
    /** @member {Function.<?, Boolean>} */
    this.valueIsValid = typeDefinitionObject.validate;
    /** @member {?} */
    this.defaultValue = typeDefinitionObject.default_value;
  };


  // Instance methods.

  /** @returns {?} - A valid default value for this particular type. */
  ParamType.prototype.createDefaultValue = function() {
    return angular.copy(this.defaultValue);
  };

  /** @returns {String} - The display-name of this type. */
  ParamType.prototype.getName = function() {
    return this._name;
  };


  // Class methods.

  /**
   * @param {String} backendName - the name of the type to fetch.
   * @returns {ParamType} - The associated type, if any.
   * @throws {Error} - When the given type name isn't registered.
   */
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  ParamType['getTypeFromBackendName'] = function(backendName) {
  /* eslint-enable dot-notation */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    if (!ParamType['registry'].hasOwnProperty(backendName)) {
    /* eslint-enable dot-notation */
      throw new Error(backendName + ' is not a registered parameter type.');
    }
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    return ParamType['registry'][backendName];
    /* eslint-enable dot-notation */
  };

  /** @returns {ParamType} - Implementation-defined default parameter type. */
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  ParamType['getDefaultType'] = function() {
  /* eslint-enable dot-notation */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    return ParamType['registry'].UnicodeString;
    /* eslint-enable dot-notation */
  };


  // Type registration.

  /** @type {Object.<String, ParamType>} */
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  ParamType['registry'] = {
  /* eslint-enable dot-notation */
    UnicodeString: new ParamType({
      validate: function(value) {
        return (typeof value === 'string' || value instanceof String);
      },
      default_value: ''
    })
  };

  // To finalize type registration, we encode the name of each type into their
  // definition, then freeze them from modifications.
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  Object.keys(ParamType['registry']).forEach(function(paramTypeName) {
  /* eslint-enable dot-notation */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    var paramType = ParamType['registry'][paramTypeName];
    /* eslint-enable dot-notation */
    paramType._name = paramTypeName;
    Object.freeze(paramType);
  });
  // Finally, we freeze the registry itself.
  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  Object.freeze(ParamType['registry']);
  /* eslint-enable dot-notation */

  return ParamType;
}]);
