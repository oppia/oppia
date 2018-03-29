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

oppia.factory('ExpressionTypeParserService', [
  '$log', 'ExpressionParserService', 'ExpressionSyntaxTreeService',
  'PARAMETER_TYPES',
  function(
      $log, ExpressionParserService, ExpressionSyntaxTreeService,
      PARAMETER_TYPES) {
    var getExpressionOutputType = function(expression, envs) {
      return ExpressionSyntaxTreeService.applyFunctionToParseTree(
        ExpressionParserService.parse(expression), envs, getType);
    };

    /**
     * @param {*} parsed Parse output from the parser. See parser.pegjs for
     *     the data structure.
     * @param {!Array.<!Object>} envs Represents a nested name space
     *     environment to look up the name in. The first element is looked
     *     up first (i.e. has higher precedence). The values of each Object
     *     are strings representing a parameter type (i.e. they are equal to
     *     values in the PARAMETER_TYPES object).
     */
    var getType = function(parsed, envs) {
      // The intermediate nodes of the parse tree are arrays. The terminal
      // nodes are JavaScript primitives (as described in the "Parser output"
      // section of parser.pegjs).
      if (parsed instanceof Array) {
        if (parsed.length === 0) {
          throw 'Parser generated an intermediate node with zero children';
        }

        if (parsed[0] === '#') {
          return ExpressionSyntaxTreeService.lookupEnvs(parsed[1], envs);
        }

        // Get the types of the arguments.
        var args = parsed.slice(1).map(function(item) {
          return getType(item, envs);
        });

        // The first element should be a function name.
        return ExpressionSyntaxTreeService.lookupEnvs(
          parsed[0], envs).getType(args);
      }

      // If 'parsed' is not an array, it should be a terminal node with the
      // actual value.
      return (
        isNaN(+parsed) ?
          PARAMETER_TYPES.UNICODE_STRING :
          PARAMETER_TYPES.REAL);
    };

    return {
      getType: getType,
      getExpressionOutputType: getExpressionOutputType
    };
  }
]);
