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
 * @fileoverview Add lint check to ensure that all private functions
 *      /variables names
 *      start with _,and that all functions/variables that
 *      start with _ are tagged as private.
 */

'use strict';

const console = require("node:console");
const { isVariableDeclaration } = require("typescript");

// TODO(#10479): Implement this rule using the nodes instead of tokens.

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
          description: (
            'Add lint check to ensure that all private functions/' +
            'variables names start with _, and that all functions/variables' +
            'that start with _ are tagged as private'),
            category: "Possible Errors",
            recommended: true,
        },
        fixable: "code",
        schema: [], 
        messages: {
          expectedPriv: 'Functions/Variables starting with _ should be private',
          expected_ : 'Private functions/variables should start with _'
        }
    },
    create: function(context) {
        return {
          // get variables from the object
        Identifier(node)  // I don't know what this does,  
        //I referenced Eslint Rule writing Docs for most of it.
        // for your reference: https://eslint.org/docs/developer-guide/working-with-rules
        /*
        Content as Pseudocode 
        { list[] = getDeclaredVariables(node)  
          Variable =  List [0] (individual element of the list.
 
         // I assumed that the above function returns me a list of variables 
          if(list contains private variable && whitespaceafterscope(Variable))
          {  
            context.report({
               node: node,
              message: expectedPriv
              suggest : [ fix: function (fixer) {
                return insertTextAfterRange(range = length of scope type length, _)}]
            });
          }
        }*/
      };
    },
};

function whitespaceafterscope(Variable) {
  for(let i = 0; i < Variable.length(); i++)
  {
    if(Variable[i] == ' ' && Variable[i+1] == '_')
    {return true;}
    else
    {return false;}
  }
}
