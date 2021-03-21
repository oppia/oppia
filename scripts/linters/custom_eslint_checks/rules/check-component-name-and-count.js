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
 * @fileoverview Lint check to ensure that all the JS/TS file
 * have exactly one component and name of the componenet
 * matches the file name.
 */

'use strict';

module.exports ={
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to ensure that all the JS/TS file have exactly one' +
        ' component and name of the component matches the file name'),
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      multipleComponents: (
        '{{fileName}} -> Please ensure that there is exactly one' +
        'component in the file.')
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();
    const fileName = context.getFilename();
    const componentsToCheck = ['controller', 'directive', 'factory', 'filter']

    var reportMultipleComponentsError = function(file) {
      context.report({
        file,
        messageId: 'multipleComponents',
        data: {
          fileName: fileName,
        }
      });
    };

    var countComponent = function(){
      var numOfComponents = 0;

      for (component in componentsToCheck) {
        if (numOfComponents > 1) {
          break;
        }
      }
    };

  }


};