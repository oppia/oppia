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
 * @fileoverview Directive for general schema-based editors.
 */

require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-bool-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-choices-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-custom-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-dict-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-float-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-html-editor.directive.ts');
require(
  'components/forms/schema-based-editors/schema-based-int-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-list-editor.directive.ts');
require(
  'components/forms/schema-based-editors/' +
  'schema-based-unicode-editor.directive.ts');
require('components/forms/validators/has-length-at-least.filter.ts');
require('components/forms/validators/has-length-at-most.filter.ts');
require('components/forms/validators/is-at-least.filter.ts');
require('components/forms/validators/is-at-most.filter.ts');
require('components/forms/validators/is-float.filter.ts');
require('components/forms/validators/is-integer.filter.ts');
require('components/forms/validators/is-nonempty.filter.ts');
require('components/forms/validators/is-url-fragment.filter.ts');
require('components/forms/validators/is-regex-matched.filter.ts');

angular.module('oppia').directive('schemaBasedEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        schema: '&',
        isDisabled: '&',
        notRequired: '&',
        localValue: '=',
        labelForFocusTarget: '&',
        onInputBlur: '=',
        onInputFocus: '=',
        headersEnabled: '&',
      },
      template: require('./schema-based-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$rootScope', function($rootScope) {
          let ctrl = this; 
          /* @ts-expect-error here at " let ctrl = this;" since there is it doesn't have a class defined to initialize ctlr
          */
          ctrl.$onInit = function() {
            /**
             * $rootScope.$applyAsync() is called here to fix the change
             * detection issue with moderator page. Please refer #12602.
             * If you are using this directive as an example for the
             * usage of UpgradeComponent. This call is not mandatory.
             */
            $rootScope.$applyAsync();
          };
        }]
    };
  }]);

import { Directive, ElementRef, Injector, Input, Output, EventEmitter } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';
import { Schema } from 'services/schema-default-value.service';
// Allow $scope to be provided to parent Component.
export const ScopeProvider = {
  deps: ['$injector'],
  provide: '$scope',
  useFactory: (injector: Injector): void => injector.get('$rootScope').$new(),
};
@Directive({
  selector: 'schema-based-editor',
  providers: [ScopeProvider]
})
export class SchemaBasedEditorDirective extends UpgradeComponent {
  @Input() schema!: () => Schema;
  @Input() isDisabled!: () => boolean;
  @Input() localValue!: () => string;
  @Output() localValueChange: EventEmitter<unknown> = new EventEmitter();
  @Input() labelForFocusTarget!: () => string;
  @Input() onInputBlur!: () => void;
  @Input() onInputFocus!: () => void;
  @Input() headersEnabled!: () => boolean;
  @Input() notRequired!: () => boolean;

  constructor(
      elementRef: ElementRef,
      injector: Injector) {
    super('schemaBasedEditor', elementRef, injector);
  }
}
