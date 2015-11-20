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

oppia.factory('expressionTypeParserService', ['$log',
  'expressionSyntaxTreeService',
  function($log, expressionSyntaxTreeService) {
      var evaluateExpression = function(expression, envs) {
        return expressionSyntaxTreeService.evaluateExpression(expression, envs,
          evaluate);
      };

      /**
       * @param {*} parsed Parse output from the parser. See parser.pegjs for
       *     the data structure.
       * @param {!Array.<!Object>} envs Represents a nested name space
       *     environment to look up the name in. The first element is looked
       *     up first (i.e. has higher precedence).
       */
      var evaluate = function(parsed, envs) {
        // The intermediate nodes of the parse tree are arrays. The terminal
        // nodes are JavaScript primitives (as described in the "Parser output"
        // section of parser.pegjs).
        if (parsed instanceof Array) {
          if (parsed.length == 0) {
            throw 'Parser generated an intermediate node with zero children';
          }

          // Now the first element should be a function name.
          var op = expressionSyntaxTreeService.lookupEnvs(parsed[0], envs).type;

          if (parsed[0] == '#') {
            return op(parsed[1], envs);
          }

          // Evaluate rest of the elements, i.e. the arguments.
          var args = parsed.slice(1).map(function(item) {
            return evaluate(item, envs);
          });
          return op(args, envs);
        }

        // This should be a terminal node with the actual value.
        var coercedValue = (+parsed);
        if (!isNaN(coercedValue)) {
          return 'Real';
        }
        return 'UnicodeString';
      };

      return {
        evaluate: evaluate,
        evaluateExpression: evaluateExpression
      };
    }]);
