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
 * @fileoverview Factory for creating new frontend instances of
 * CustomizationArgs domain objects.
 */

export interface ICustomizationArg {
  value: object;
}

export interface ICustomizationArgs {
  [name: string]: ICustomizationArg
};

// TODO(brianrodri): Create a proper CustomizationArgs class. Currently, these
// instances have no type-info because their values depend on the interaction.
//
// We might be able to introduce type-info by making these types generic w/ an
// Interaction sub-class as a type argument, but that would take significant
// refactoring.
