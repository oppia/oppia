// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for applying validation.
 */

import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { UnderscoresToCamelCasePipe } from 'filters/string-utility-filters/underscores-to-camel-case.pipe';
import { Validator as OppiaValidator } from 'interactions/TextInput/directives/text-input-validation.service';
import cloneDeep from 'lodash/cloneDeep';
import { SchemaValidators } from '../validators/schema-validators';

@Directive({
  selector: '[applyValidation]',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: ApplyValidationDirective,
    multi: true
  }]
})
export class ApplyValidationDirective implements Validator {
  @Input() validators: OppiaValidator[];
  underscoresToCamelCasePipe = new UnderscoresToCamelCasePipe();
  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.validators || this.validators.length === 0) {
      return null;
    }
    let errorsPresent = false;
    let allValidationErrors: ValidationErrors = {};
    for (const validatorSpec of this.validators) {
      const validatorName = this.underscoresToCamelCasePipe.transform(
        validatorSpec.id
      );
      const filterArgs = {};
      for (let key in validatorSpec) {
        if (key !== 'id') {
          filterArgs[this.underscoresToCamelCasePipe.transform(key)] = (
            cloneDeep(validatorSpec[key]));
        }
      }
      if (SchemaValidators[validatorName]) {
        const error = SchemaValidators[validatorName](filterArgs)(control);
        if (error !== null) {
          errorsPresent = true;
          allValidationErrors = {...allValidationErrors, ...error};
        }
      } else {
        // TODO(#15190): Throw an error if validator not found.
      }
    }
    if (!errorsPresent) {
      return null;
    }
    return allValidationErrors;
  }
}
