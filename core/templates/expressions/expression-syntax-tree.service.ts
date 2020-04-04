// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Expression syntax tree service.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { ExpressionParserService } from
  'expressions/expression-parser.service.ts';

export class ExpressionError extends Error {
  constructor() {
    super();
    // NOTE TO DEVELOPERS: As per recommendation of TypeScript
    // extending Error would need to adjust the protoype manually
    // This code below would restore the protoype chain
    // Source: https://stackoverflow.com/a/58417721/4859885
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}

export class ExprUndefinedVarError extends ExpressionError {
  constructor(public varname: string, public envs: any[]) {
    super();
  }

  public toString(): string {
    return this.name + ': ' + this.varname + ' not found in ' + this.envs;
  }
}

export class ExprWrongNumArgsError extends ExpressionError {
  constructor(public args: Array<number|string>, public expectedMin: number,
      public expectedMax: number) {
    super();
  }

  public toString(): string {
    return this.name + ': {' + this.args + '} not in range [' +
    this.expectedMin + ',' + this.expectedMax + ']';
  }
}

export class ExprWrongArgTypeError extends ExpressionError {
  constructor(public arg: number|string, public actualType: string,
    public expectedType: string) {
    super();
  }

  public toString(): string {
    if (this.arg === null) {
      return this.name + ': Type ' + this.actualType +
        ' does not match expected type ' + this.expectedType;
    }
    return this.name + ': ' + this.arg + ' has type ' + this.actualType +
        ' which does not match expected type ' + this.expectedType;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExpressionSyntaxTreeService {
  constructor(private expressionParserService: ExpressionParserService) {}

  public getParamsUsedInExpression(expression: string): string[] {
    let parsed = this.expressionParserService.parse(expression);

    return [...this.findParams(parsed)].sort();
  }

  // TODO(8966): Using Set causes unexpected results during the test:
  // "Expression evaluator service should get params used in expressions"
  // When expressions are parsed it's not returning the expectedParams.
  // Example: "log(9,3)" should return [] but gets ["log", 9, 3].
  // And you get TypeError: .forEach not found on undefined.
  private findParams(parseTree: string[]|string): string[] {
    let paramsFound = [];
    if (parseTree instanceof Array) {
      if (parseTree[0] === '#') {
        paramsFound.push(parseTree[1]);
      } else {
        for (let i = 1; i < parseTree.length; i++) {
          paramsFound = paramsFound.concat(this.findParams(parseTree[i]));
        }
      }
    }

    let uniqueParams = [];
    for (let i = 0; i < paramsFound.length; i++) {
      if (uniqueParams.indexOf(paramsFound[i]) === -1) {
        uniqueParams.push(paramsFound[i]);
      }
    }

    return uniqueParams;
  }

  // Checks if the args array has the expectedNum number of elements and
  // throws an error if not. If optional expectedMax is specified, it
  // verifies the number of args is in [expectedNum, expectedMax] range
  // inclusive.
  private verifyNumArgs(args: string[], expectedNum: number,
      expectedMax: number = expectedNum): void {
    if (expectedMax === undefined) {
      expectedMax = expectedNum;
    }
    if (args.length < expectedNum || args.length > expectedMax) {
      throw new ExprWrongNumArgsError(args, expectedNum, expectedMax);
    }
  }

  private verifyArgTypesMatchExpectedType(argTypes: string[],
      expectedType: string): boolean {
    for (var i = 0; i < argTypes.length; i++) {
      if (argTypes[i] !== expectedType) {
        throw new ExprWrongArgTypeError(null, argTypes[i], expectedType);
      }
    }
    return true;
  }

  private verifyArgTypesMatch(argType1: string, argType2: string): boolean {
    if (argType1 !== argType2) {
      throw new ExprWrongArgTypeError(null, argType1, argType2);
    }
    return true;
  }

  public applyFunctionToParseTree(parsed: string, envs: any[],
      func: (parsed: string, envs: any[]) => string) {
    return func(parsed, envs.concat(this.system));
  }

  // Looks up a variable of the given name in the env. Here the variable
  // can be system or user defined functions and parameters, as well as
  // system operators.
  public lookupEnvs(name: string, envs: any[]): string {
    for (const env of envs) {
      if (env.hasOwnProperty(name)) {
        return env[name];
      }
    }

    throw new ExprUndefinedVarError(name, envs);
  }

  // Coerces the argument to a Number, and throws an error if the result
  // is NaN.
  private coerceToNumber(originalValue: string): number {
    var coercedValue = +originalValue;
    if (!isNaN(coercedValue)) {
      return coercedValue;
    }
    throw new ExprWrongArgTypeError(originalValue, typeof originalValue,
      'Number');
  }

  // Setting args to Array<number|string> throws this error
  // (Type '<string | number>' is not assignable to type 'number[]'.
  // Type 'string | number' is not assignable to type 'number'.
  // Type 'string' is not assignable to type 'number'.)
  // and this.coerceToNumber(args[i]) since coerceToNumber expect args
  // to be just strings.
  private coerceAllArgsToNumber(args: any[]): number[] {
    for (var i = 0; i < args.length; i++) {
      args[i] = this.coerceToNumber(args[i]);
    }

    return args;
  }

  // NOTE TO DEVELOPERS: When adding a new reserved word to this object,
  //   please first ensure that existing explorations do not use this
  //   parameter name. Also, to prevent future explorations using it,
  //   modify constants.INVALID_PARAMETER_NAMES accordingly.
  // TODO(kashida): Document all operators input and output contracts.
  // Arguments:
  // args: for eval(): list of values of the evaluated sub-expression
  //       for getType(): list of types of the evaluated sub-expression
  private system = {
    '+': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs.length === 1 ?
          numericArgs[0] :
          numericArgs[0] + numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 1, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    '-': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs.length === 1 ?
          -numericArgs[0] :
          numericArgs[0] - numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 1, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    '*': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] * numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    '/': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] / numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    '%': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] % numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    '<=': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] <= numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '>=': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] >= numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '<': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] < numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '>': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] > numericArgs[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '!': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 1);
        return !args[0];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 1);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.UNICODE_STRING);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '==': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return args[0] === args[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '!=': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return args[0] !== args[1];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '&&': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return Boolean(args[0] && args[1]);
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.UNICODE_STRING);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    '||': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return Boolean(args[0] || args[1]);
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.UNICODE_STRING);
        return AppConstants.PARAMETER_TYPES.UNICODE_STRING;
      }
    },
    // Note that removing quotation marks from this key causes issues with
    // minification (when running the deployment scripts).
    /* eslint-disable quote-props */
    'if': {
      eval: (args: string[]): string => {
        this.verifyNumArgs(args, 3);
        return args[0] ? args[1] : args[2];
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 3);
        this.verifyArgTypesMatchExpectedType([args[0]],
          AppConstants.PARAMETER_TYPES.UNICODE_STRING);
        this.verifyArgTypesMatch(args[1], args[2]);
        return args[1];
      }
    },
    'floor': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return Math.floor(numericArgs[0]);
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 1);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    'pow': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return Math.pow(numericArgs[0], numericArgs[1]);
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    'log': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        var numericArgs = this.coerceAllArgsToNumber(args);
        var preciseAns = Math.log(numericArgs[0]) / Math.log(numericArgs[1]);
        // We round answers to 9 decimal places, so that we don't run into
        // issues like log(9, 3) = 2.0000000000004.
        return Math.round(preciseAns * Math.pow(10, 9)) / Math.pow(10, 9);
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 2);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    },
    'abs': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1);
        var numericArgs = this.coerceAllArgsToNumber(args);
        return Math.abs(numericArgs[0]);
      },
      getType: (args: string[]): string => {
        this.verifyNumArgs(args, 1);
        this.verifyArgTypesMatchExpectedType(args,
          AppConstants.PARAMETER_TYPES.REAL);
        return AppConstants.PARAMETER_TYPES.REAL;
      }
    }
    /* eslint-enable quote-props */
  };

  public ExpressionError = ExpressionError;

  public ExprUndefinedVarError = ExprUndefinedVarError;

  public ExprWrongNumArgsError = ExprWrongNumArgsError;

  public ExprWrongArgTypeError = ExprWrongArgTypeError;
}

angular.module('oppia').factory('ExpressionSyntaxTreeService',
  downgradeInjectable(ExpressionSyntaxTreeService));
