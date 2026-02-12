import testConstants from '../../utilities/common/test-constants';
import { UserFactory } from '../../utilities/common/user-factory';
import { ExplorationEditor } from '../../utilities/user/exploration-editor';
import { LoggedInUser } from '../../utilities/user/logged-in-user';

const DEFAULT_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

enum INTERACTION_TYPES {
  END_EXPLORATION = 'End Exploration',
}

describe('Exploration Learner Flow', function () {
  let explorationEditor: ExplorationEditor & LoggedInUser;
  let learner: LoggedInUser;
  let explorationId1: string | null;
  let explorationId2: string | null;

  

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'editor@example.com'
    );

    learner = await UserFactory.createNewUser(
      'learnerUser',
      'learner@example.com'
    );
  }, DEFAULT_TIMEOUT);

  async function createAndPublishMinimalExploration(): Promise<void> {
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
  
      await explorationEditor.createMinimalExploration(
        'Positive Numbers' ,
        INTERACTION_TYPES.END_EXPLORATION
      );
  
      await explorationEditor.saveExplorationDraft();
      explorationId1= await explorationEditor.publishExplorationWithMetadata(
        'Positive Numbers',
        'This is the goal of exploration.',
        'Math'
      );
  
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();

      // second exploration
      
      await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
      await explorationEditor.dismissWelcomeModal();
  
      await explorationEditor.createMinimalExploration(
        'Negative Numbers',
        INTERACTION_TYPES.END_EXPLORATION
      );
  
      await explorationEditor.saveExplorationDraft();
      explorationId2= await explorationEditor.publishExplorationWithMetadata(
        'Negative Numbers',
        'This is the goal of exploration.',
        'Math'
      );
  
      await explorationEditor.navigateToCreatorDashboardUsingProfileDropdown();

    }
  
    it(
      'should create and publish two minimal explorations',
      async function () {
          await createAndPublishMinimalExploration();
      },
      DEFAULT_TIMEOUT
    );

  it('should allow learner to play, rate, and subscribe', async function () {
    await learner.navigateToCommunityLibrary();
    await learner.playExploration(explorationId2);
    await learner.starRateExploration(5);
    await learner.giveFeedback('Super ,fantastic,explorations!!! I loves them',false);
    await learner.submitFeedback();
    await learner.navigateToCommunityLibrary();
    await learner.playExploration(explorationId1);
    await learner.starRateExploration(3);
    await learner.subscribeToCreator('explorationEditor');
    await explorationEditor.reloadPage();
    await explorationEditor.waitForPageToFullyLoad();
    await explorationEditor.switchToListView();
    await explorationEditor.waitForPageToFullyLoad();
  }, DEFAULT_TIMEOUT);

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
