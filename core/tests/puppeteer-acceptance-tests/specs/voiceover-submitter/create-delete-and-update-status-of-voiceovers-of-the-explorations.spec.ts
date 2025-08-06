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
 * VS.EE. Create, delete, and update status of voiceovers of explorations.
 */

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {CurriculumAdmin} from '../../utilities/user/curriculum-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {VoiceoverSubmitter} from '../../utilities/user/voiceover-submitter';

const ROLES = testConstants.Roles;

describe('Voiceover Submitter', function () {
  let voiceoverSubmitter: VoiceoverSubmitter;
  let curriculumAdm: CurriculumAdmin & ExplorationEditor;
  let releaseCoordinator: ReleaseCoordinator;
  let explorationId: string;

  beforeAll(async function () {
    // Create users with the required roles.
    curriculumAdm = await UserFactory.createNewUser(
      'curriculumAdm',
      'curriculum_admin@example.com',
      [ROLES.CURRICULUM_ADMIN]
    );

    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'release_coordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );

    // Create an exploration for the voiceover submitter.
    explorationId = await curriculumAdm.createAndPublishExplorationWithCards(
      'Exploration for voiceover submitter'
    );

    // Create a voiceover submitter.
    voiceoverSubmitter = await UserFactory.createNewUser(
      'voiceoverSubmitter',
      'voiceover_submitter@example.com',
      [ROLES.VOICEOVER_SUBMITTER],
      null,
      explorationId
    );
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
