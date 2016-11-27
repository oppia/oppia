oppia.controller('ExplorationSaveAndPublishButtons', [
  '$scope', 'changeListService', 'editabilityService',
  'explorationRightsService', 'explorationWarningsService',
  'explorationSaveService',
  function(
      $scope, changeListService, editabilityService,
      explorationRightsService, explorationWarningsService,
      explorationSaveService) {
    $scope.isSaveInProgress = false;

    $scope.isPrivate = function() {
      return explorationRightsService.isPrivate();
    };

    $scope.isExplorationLockedForEditing = function() {
      return changeListService.isExplorationLockedForEditing();
    };

    $scope.isEditableOutsideTutorialMode = function() {
      return editabilityService.isEditableOutsideTutorialMode();
    };

    $scope.countWarnings = function() {
      return explorationWarningsService.countWarnings();
    };

    $scope.discardChanges = function() {
      explorationSaveService.discardChanges();
    };

    $scope.getChangeListLength = function() {
      return changeListService.getChangeList().length;
    };

    $scope.isExplorationSaveable = function() {
      return explorationSaveService.isExplorationSaveable();
    };

    $scope.isPublishModalOpening = function() {
      return explorationSaveService.isPublishModalOpening();
    };

    $scope.showPublishExplorationModal = function() {
      explorationSaveService.showPublishExplorationModal();
    };

    $scope.getPublishExplorationButtonTooltip = function() {
      return explorationSaveService.getPublishExplorationButtonTooltip();
    };

    $scope.getSaveButtonTooltip = function() {
      return explorationSaveService.getSaveButtonTooltip();
    };

    $scope.isSaveModalOpening = function() {
      return explorationSaveService.isSaveModalOpening();
    };

    $scope.saveChanges = function() {
      $scope.isSaveInProgress = true;

      explorationSaveService.saveChanges().then(function() {
        $scope.isSaveInProgress = false;
      });
    };
  }
]);
