// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for checking if a moderator can edit the
 *  featured activities list
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import { Moderator } from '../../utilities/user/moderator';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;
const ROLES = testConstants.Roles;

let moderator: Moderator;

beforeAll(async function () {
    moderator = await UserFactory.createNewUser(
        'Moderator',
        'moderator@example.com',
        [ROLES.MODERATOR]
    );
}, DEFAULT_SPEC_TIMEOUT);


afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
