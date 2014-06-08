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
 * @fileoverview Controllers for the schema editor test page.
 *
 * @author sll@google.com (Sean Lip)
 */

function SchemaEditorTests($scope) {
  $scope.unicodeForm = {
    schema: {
      type: 'unicode'
    },
    value: 'aab'
  };

  $scope.testForms = [{
    name: 'Boolean form',
    schema: {
      type: 'bool'
    },
    value: true
  }, {
    name: 'dictForm',
    schema: {
      type: 'dict',
      properties: {
        a_boolean: {
          type: 'bool'
        },
        a_unicode_string: {
          type: 'unicode'
        }
      }
    },
    value: {
      a_boolean: false,
      a_unicode_string: 'sample_value'
    }
  }, {
    name: 'listForm',
    schema: {
      type: 'list',
      items: {
        type: 'unicode'
      }
    },
    value: ['abc', 'def', 'ghi']
  }, {
    name: 'nestedListForm',
    schema: {
      type: 'list',
      items: {
        type: 'list',
        items: {
          type: 'unicode'
        }
      }
    },
    value: [['abc'], ['def', 'ghi']]
  }, {
    name: 'htmlForm',
    schema: {
      type: 'html'
    },
    value: 'Some <b>HTML</b>'
  }];
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
SchemaEditorTests.$inject = ['$scope'];
