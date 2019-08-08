// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for objects domain.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants.ts';

angular.module('oppia').constant(
  'FRACTION_PARSING_ERRORS', ObjectsDomainConstants.FRACTION_PARSING_ERRORS);

angular.module('oppia').constant(
  'NUMBER_WITH_UNITS_PARSING_ERRORS',
  ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERRORS);

angular.module('oppia').constant(
  'CURRENCY_UNITS', ObjectsDomainConstants.CURRENCY_UNITS);
