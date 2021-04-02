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
 * @fileoverview Lint check to ensure that constant names are in all caps.
 */
 'use strict';
 
 
 module.exports = {
    meta: {
        type: "layout",

        docs: {
            description: "disallow more than one brace before opening brace of function",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: null,
        schema: [], // no options
        messages: {
            OnlyOneSpacebeforebrace: 'There should be only one space before opening brace of function'
          }
    },
    create: function(context) {
        const sourcecode = context.getSourceCode();
        return {
            "FunctionDeclaration": function(node) {
                const lines= sourcecode.getText(node);
                for(var i = 0; i < lines.length; i++) {
                    if(lines[i] == ')') {
                        if(lines[i+1] != ' ' || lines[i + 2] != '{'){
                            context.report({
                                node : node,
                                messageId: "OnlyOneSpacebeforebrace",
                              });
                        }
                        break;
                    }
                }
            }
        }
    }
};
