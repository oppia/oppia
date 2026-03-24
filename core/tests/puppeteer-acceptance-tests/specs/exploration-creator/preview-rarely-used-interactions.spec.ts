// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * EC.EE. Preview rarely used interactions.
 *
 * NOTE: All interactions that were previously tested here
 * (PencilCodeEditor, MusicNotesInput, CodeRepl, GraphInput, InteractiveMap)
 * have been deprecated and hidden from the frontend as part of issue #24968.
 * This file is kept as a placeholder for future non-deprecated rare interactions.
 */

import {UserFactory} from '../../utilities/common/user-factory';

// TODO(#24968): Add tests for any new non-deprecated rare interactions here.
describe('Exploration Editor', function () {
  it('placeholder: no rare interactions are available', function () {
    // All previously tested interactions have been deprecated (#24968).
    // This placeholder keeps the test suite valid until new ones are added.
    expect(true).toBe(true);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
