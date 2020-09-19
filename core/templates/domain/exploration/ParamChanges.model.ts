// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model for creating new frontend arrays of ParamChange
 * domain objects.
 */

import { ParamChangeBackendDict, ParamChange } from 'domain/exploration/ParamChange.model';

export class ParamChanges {
  static createFromBackendList(
      paramChangeBackendList: ParamChangeBackendDict[]): ParamChange[] {
    return paramChangeBackendList.map((paramChangeBackendDict) => {
      return ParamChange.createFromBackendDict(
        paramChangeBackendDict);
    });
  }
}
