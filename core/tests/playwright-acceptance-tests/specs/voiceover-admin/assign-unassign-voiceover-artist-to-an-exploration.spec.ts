import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {VoiceoverAdmin} from '../../utilities/user/voiceover-admin';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
// import {ConsoleReporter} from '../../utilities/common/console-reporter';

const ROLES = testConstants.Roles;
const invalidIdErrorToastMessage =
  'Sorry, we could not find the specified user.';
enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

// ConsoleReporter.setConsoleErrorsToIgnore([
//   new RegExp(
//     'http://localhost:8181/voice_artist_management_handler/exploration/.*Failed to load resource: the server responded with a status of 400'
//   ),
//   new RegExp('Sorry, we could not find the specified user.'),
// ]);

test.describe.configure({mode: 'serial'});

test.describe('Voiceover Admin', function () {
  let voiceoverAdmin: VoiceoverAdmin;
  let explorationEditor: ExplorationEditor;
  let explorationId: string | null;

  test.beforeAll(async function ({browser}) {
    voiceoverAdmin = await UserFactory.createNewUser(
      'voiceoverAdm',
      'voiceover_admin@example.com',
      browser,
      [ROLES.VOICEOVER_ADMIN]
    );

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    await explorationEditor.createMinimalExploration(
      'Exploration one',
      INTERACTION_TYPES.END_EXPLORATION
    );
    await explorationEditor.saveExplorationDraft();
    explorationId = await explorationEditor.publishExplorationWithMetadata(
      'Exploration one',
      'Exploration one',
      'Algebra'
    );

    await UserFactory.createNewUser(
      'voiceoverartist',
      'voiceoverartist@example.com',
      browser
    );
  });

  test('should be able to add voiceover artist to an exploration', async function () {
    await voiceoverAdmin.navigateToExplorationEditor(explorationId);
    await voiceoverAdmin.dismissWelcomeModal();
    await voiceoverAdmin.navigateToExplorationSettingsTab();
    await voiceoverAdmin.expectVoiceoverArtistsListToBeEmpty();

    // Add invalid user as a voiceover artist.
    await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
      'invalidUserId'
    );
    await voiceoverAdmin.addVoiceoverArtistsToExploration(
      ['invalidUserId'],
      false
    );

    await voiceoverAdmin.expectErrorModalToBeVisible();
    await voiceoverAdmin.expectErrorModalMessageToBe(
      invalidIdErrorToastMessage
    );
    await voiceoverAdmin.closeErrorModal();
    // await voiceoverAdmin.expectToSeeErrorToastMessage(
    //   invalidIdErrorToastMessage
    // );
    // await voiceoverAdmin.closeToastMessage();
    await voiceoverAdmin.verifyVoiceoverArtistStillOmitted('invalidUserId');

    // Add a valid user as a voiceover artist.
    await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
      'voiceoverartist'
    );
    await voiceoverAdmin.addVoiceoverArtistsToExploration(['voiceoverartist']);

    await voiceoverAdmin.expectVoiceoverArtistsListContains('voiceoverartist');
  });

  test('should be able to remove voiceover artist from an exploration', async function () {
    await voiceoverAdmin.removeVoiceoverArtist('voiceoverartist');
    await voiceoverAdmin.expectVoiceoverArtistsListDoesNotContain(
      'voiceoverartist'
    );
  });

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
