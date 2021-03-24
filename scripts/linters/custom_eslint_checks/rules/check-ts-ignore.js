// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Lint check to ensure that comments follow correct style.
 */

 'use strict';

 const fs = require('fs');
 const path  = require('path')
 const filePath = path.resolve('scripts/linters/ts_ignore_exceptions.json');
 var filedata = JSON.parse(fs.readFileSync(filePath));
 var tsignoreFilepath = Object.keys(filedata);

 module.exports = {
   meta: {
     type: 'layout',
     docs: {
       description: (
         'To check whether we added proper comments before using ts-ignore or not'),
       category: 'Stylistic Issues',
       recommended: true
     },
     fixable: null,
     schema: [],
     messages: {
       expectedNature: 'Expected comment above ts-ignore'
     }
   },
   create :function(context) {
       const sourceCode = context.getSourceCode();
       const tsIgnorePattern = "@ts-ignore";
       var code = sourceCode.text.split('\n');
       function raiseWarning(node) {
        context.report({
          node: node,
          messageId:'expectedNature'
        });
       }
       return {
           Program: function(node){
             let currentComment = '';
             let previousComment = '';
             let i = 0;
             code.forEach((code)=>{
               i++;
               if(i === 1) {
                 previousComment = code;
                 currentComment = code;
               } else {
                 currentComment = code;
               }
               if(currentComment.includes(tsIgnorePattern)) {
                   if(!previousComment.includes('//')) {
                     raiseWarning(node);
                   }
               }
               previousComment = currentComment; 
             })
           }
        };
   }
};

