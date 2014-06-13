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

function SchemaEditorTests($scope, parameterSpecsService) {
  parameterSpecsService.addParamSpec('paramBool1', 'bool');
  parameterSpecsService.addParamSpec('paramBool2', 'bool');
  parameterSpecsService.addParamSpec('paramInt1', 'int');
  parameterSpecsService.addParamSpec('paramFloat1', 'float');
  parameterSpecsService.addParamSpec('paramFloat2', 'float');

  $scope.unicodeForm = {
    schema: {
      type: 'unicode'
    },
    value: 'aab'
  };

  $scope.booleanForms = [{
    name: 'Boolean form',
    schema: {
      type: 'bool'
    },
    value: {
      type: 'raw',
      data: true
    }
  }, {
    name: 'Boolean form with parameters',
    schema: {
      type: 'bool',
      allow_parameters: true
    },
    value: {
      type: 'parameter',
      data: 'paramBool1'
    }
  }];

  $scope.intForms = [{
    name: 'Integer form (no parameters)',
    schema: {
      type: 'int'
    },
    value: {
      type: 'raw',
      data: 3
    }
  }, {
    // TODO(sll): Add test for bad initialization.
    name: 'Integer form with parameters',
    schema: {
      type: 'int',
      allow_parameters: true
    },
    value: {
      type: 'parameter',
      data: 'paramInt1'
    }
  }];

  $scope.floatForms = [{
    name: 'Float form (value must be between -3 and 6)',
    schema: {
      type: 'float',
      post_normalizers: [{
        id: 'require_at_least',
        min_value: -3.0
      }, {
        id: 'require_at_most',
        max_value: 6.0
      }]
    },
    value: {
      type: 'raw',
      data: 3.14
    }
  }, {
    name: 'Float form with parameters (value must be between -3 and 6)',
    schema: {
      type: 'float',
      allow_parameters: true,
      post_normalizers: [{
        id: 'require_at_least',
        min_value: -3.0
      }, {
        id: 'require_at_most',
        max_value: 6.0
      }]
    },
    value: {
      type: 'raw',
      data: 3.14
    }
  }];

  $scope.unicodeForms = [{
    name: 'Restricted unicode form; the value must be either a or b.',
    schema: {
      type: 'unicode',
      post_normalizers: [{
        id: 'require_is_one_of',
        choices: ['a', 'b']
      }]
    },
    value: 'a'
  }];

  $scope.htmlForms = [{
    name: 'HTML form',
    schema: {
      type: 'html'
    },
    value: 'Some <b>HTML</b>' 
  }];

  $scope.compositeForms = [{
    name: 'Dict with a bool, a unicode string and a list of ints. The string must be either \'abc\' or \'def\'.',
    schema: {
      type: 'dict',
      properties: {
        a_boolean: {
          type: 'bool'
        },
        a_unicode_string: {
          type: 'unicode',
          post_normalizers: [{
            id: 'require_is_one_of',
            choices: ['abc', 'def']
          }]
        },
        a_list: {
          type: 'list',
          items: {
            type: 'int'
          }
        }
      }
    },
    value: {
      a_boolean: {
        type: 'raw',
        data: false
      },
      a_unicode_string: 'abc',
      a_list: [{
        type: 'raw',
        data: 2
      }, {
        type: 'raw',
        data: 3
      }]
    }
  }, {
    name: 'List of unicode strings',
    schema: {
      type: 'list',
      items: {
        type: 'unicode'
      }
    },
    value: ['abc', 'def', 'ghi']
  }, {
    name: 'Nested lists',
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
  }];

  $scope.formsets = [{
    name: 'Boolean editors',
    forms: $scope.booleanForms
  }, {
    name: 'Integer editors',
    forms: $scope.intForms
  }, {
    name: 'Float editors',
    forms: $scope.floatForms
  }, {
    name: 'Unicode editors',
    forms: $scope.unicodeForms
  }, {
    name: 'HTML editors',
    forms: $scope.htmlForms
  }, {
    name: 'Composite editors',
    forms: $scope.compositeForms
  }];
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
SchemaEditorTests.$inject = ['$scope', 'parameterSpecsService'];
