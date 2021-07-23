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

import { ExpressionParserService } from 'expressions/expression-parser.service';

export type Expr = string | number | boolean;

export interface SystemEnv {
  eval: (args: string[]) => Expr;
}

export type Env = SystemEnv | Expr;

export interface EnvDict {
  [param: string]: Env;
}

export class ExpressionError extends Error {
  // 'message' is optional beacuse it is optional in the actual 'Error'
  // constructor object. Also, we may not want a custom error message
  // while throwing 'ExpressionError'.
  constructor(message?: string) {
    super(message);
    // NOTE TO DEVELOPERS: In order to properly extend Error, we must manually
    // rebuild the prototype chain because it is broken by the call to `super`.
    // For details, please see: https://stackoverflow.com/a/58417721/4859885.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}

export class ExprUndefinedVarError extends ExpressionError {
  constructor(public varname: string, public envs: EnvDict[]) {
    super(varname + ' not found in ' + angular.toJson(envs));
  }
}

export class ExprWrongNumArgsError extends ExpressionError {
  constructor(
      public args: (number|string)[],
      public expectedMin: number, public expectedMax: number) {
    super(
      '{' + args + '} not in range [' + expectedMin + ', ' + expectedMax + ']');
  }
}

export class ExprWrongArgTypeError extends ExpressionError {
  constructor(
      public arg: number|string,
      public actualType: string, public expectedType: string) {
    super(
      (
        arg !== null ?
        (arg + ' has type ' + actualType + ' which') : ('Type ' + actualType)) +
      ' does not match expected type ' + expectedType);
  }
}

@Injectable({ providedIn: 'root' })
export class ExpressionSyntaxTreeService {
  constructor(private expressionParserService: ExpressionParserService) {}

  public ExpressionError = ExpressionError;
  public ExprUndefinedVarError = ExprUndefinedVarError;
  public ExprWrongNumArgsError = ExprWrongNumArgsError;
  public ExprWrongArgTypeError = ExprWrongArgTypeError;

  public getParamsUsedInExpression(expression: string): string[] {
    const parsedExpression = this.expressionParserService.parse(expression);
    return [...this.findParams(parsedExpression)].sort();
  }

  public applyFunctionToParseTree(
      parsed: Expr | Expr[], envs: EnvDict[],
      func: (parsed: Expr | Expr[], envs: EnvDict[]) => Expr): Expr {
    return func(parsed, envs.concat(this.system));
  }

  // Looks up a variable of the given name in the env. Here the variable can be
  // system or user-defined functions or parameters, including system operators.
  public lookupEnvs(name: string, envs: EnvDict[]): Env {
    for (const env of envs) {
      if (env.hasOwnProperty(name)) {
        return env[name];
      }
    }
    throw new ExprUndefinedVarError(name, envs);
  }

  private findParams(parseTree: string | string[]): Set<string> {
    const paramsFound = new Set<string>();
    if (parseTree instanceof Array) {
      if (parseTree[0] === '#') {
        paramsFound.add(parseTree[1]);
      } else {
        for (let i = 1; i < parseTree.length; ++i) {
          this.findParams(parseTree[i]).forEach(p => paramsFound.add(p));
        }
      }
    }
    return paramsFound;
  }

  // Checks if the args array has the expectedMin number of elements and throws
  // an error if not. If optional expectedMax is specified, it verifies the
  // number of args is in the inclusive range: [expectedMin, expectedMax].
  private verifyNumArgs(
      args: string[],
      expectedMin: number, expectedMax: number = expectedMin): void {
    if (args.length < expectedMin || args.length > expectedMax) {
      throw new ExprWrongNumArgsError(args, expectedMin, expectedMax);
    }
  }

  // Coerces the argument to a Number, and throws an error if the result is NaN.
  private coerceToNumber(originalValue: string|number): number {
    const coercedValue = +originalValue;
    if (isNaN(coercedValue)) {
      throw new ExprWrongArgTypeError(
        originalValue, typeof originalValue, 'Number');
    }
    return coercedValue;
  }

  private coerceAllArgsToNumber(args: (number|string)[]): number[] {
    return args.map(this.coerceToNumber);
  }

  // NOTE TO DEVELOPERS: When adding a new reserved word to this object, please
  // first ensure that existing explorations do not use this parameter name.
  // Also, to prevent future explorations using it, modify
  // constants.INVALID_PARAMETER_NAMES accordingly.
  //
  // TODO(kashida): Document each operator's input and output contracts.
  //
  // Arguments:
  //    for eval(): list of values of the evaluated sub-expression.
  private system: {[name: string]: SystemEnv} = {
    '+': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs.length === 1 ?
          numericArgs[0] :
          numericArgs[0] + numericArgs[1];
      }
    },

    '-': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs.length === 1 ?
          -numericArgs[0] :
          numericArgs[0] - numericArgs[1];
      }
    },

    '*': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] * numericArgs[1];
      }
    },

    '/': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] / numericArgs[1];
      }
    },

    '%': {
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] % numericArgs[1];
      }
    },

    '<=': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] <= numericArgs[1];
      }
    },

    '>=': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] >= numericArgs[1];
      }
    },

    '<': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] < numericArgs[1];
      }
    },

    '>': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return numericArgs[0] > numericArgs[1];
      }
    },

    '!': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 1);
        return !args[0];
      }
    },

    '==': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return args[0] === args[1];
      }
    },

    '!=': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return args[0] !== args[1];
      }
    },

    '&&': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return Boolean(args[0] && args[1]);
      }
    },

    '||': {
      eval: (args: string[]): boolean => {
        this.verifyNumArgs(args, 2);
        return Boolean(args[0] || args[1]);
      }
    },

    // NOTE TO DEVELOPERS: Removing the quotation marks from the following keys
    // causes issues with minification when running the deployment scripts.
    'if': { // eslint-disable-line quote-props
      eval: (args: string[]): string => {
        this.verifyNumArgs(args, 3);
        return args[0] ? args[1] : args[2];
      }
    },

    'floor': { // eslint-disable-line quote-props
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return Math.floor(numericArgs[0]);
      }
    },

    'pow': { // eslint-disable-line quote-props
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return Math.pow(numericArgs[0], numericArgs[1]);
      }
    },

    'log': { // eslint-disable-line quote-props
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 2);
        const numericArgs = this.coerceAllArgsToNumber(args);
        const preciseAns = Math.log(numericArgs[0]) / Math.log(numericArgs[1]);
        // We round answers to 9 decimal places, so that we don't run into
        // issues like log(9, 3) = 2.0000000000004.
        return Math.round(preciseAns * Math.pow(10, 9)) / Math.pow(10, 9);
      }
    },

    'abs': { // eslint-disable-line quote-props
      eval: (args: string[]): number => {
        this.verifyNumArgs(args, 1);
        const numericArgs = this.coerceAllArgsToNumber(args);
        return Math.abs(numericArgs[0]);
      }
    }
  };
}

angular.module('oppia').factory(
  'ExpressionSyntaxTreeService',
  downgradeInjectable(ExpressionSyntaxTreeService));
