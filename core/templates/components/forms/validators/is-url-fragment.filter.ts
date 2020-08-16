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
 * @fileoverview Validator to check if input is a valid URL fragment.
 */

import { AppConstants } from 'app.constants';

angular.module('oppia').filter('isUrlFragment', [function() {
  const VALID_URL_FRAGMENT_REGEX = new RegExp(
    // TODO(#7434): Use dot notation after we find a way to get
    // rid of the TS2339 error on AppConstants.
    // eslint-disable-next-line dot-notation
    AppConstants['VALID_URL_FRAGMENT_REGEX']);
  return function(input, args) {
    return (
      VALID_URL_FRAGMENT_REGEX.test(input) &&
      input.length <= args.charLimit);
  };
}]);
