// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a schema-based editor for expressions.
 */

// angular.module('oppia').directive('schemaBasedExpressionEditor', [
//   function() {
//     return {
//       scope: {
//         localValue: '=',
//         isDisabled: '&',
//         // TODO(sll): Currently only takes a string which is either 'bool',
//         // 'int' or 'float'. May need to generalize.
//         outputType: '&',
//         labelForFocusTarget: '&'
//       },
//       template: require('./schema-based-expression-editor.directive.html'),
//       restrict: 'E'
//     };
//   }]);

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { easeBackInOut } from 'd3';

@Component({
  selector: 'schema-based-expression-editor',
  templateUrl: './schema-based-expression-editor.directive.html',
  styleUrls: []
})
export class SchemaBasedExpressionEditorComponent {
  @Input() localValue: string;
  @Input() isDisabled: boolean;
  // TODO(sll): Currently only takes a string which is either 'bool',
  // 'int' or 'float'. May need to generalize.
  @Input() outputType: string;
  @Input() labelForFocusTarget: string;
  constructor() {}
}

angular.module('oppia').directive(
  'schemaBasedExpressionEditor', downgradeComponent(
    {component: SchemaBasedExpressionEditorComponent}));
