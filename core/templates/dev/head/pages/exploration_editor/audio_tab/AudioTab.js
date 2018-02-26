oppia.controller('AudioTab', [
  '$scope', '$http', '$window', '$uibModal',
  '$rootScope', 'ExplorationDataService',
  'ExplorationTitleService', 'ExplorationCategoryService',
  'ExplorationObjectiveService', 'ExplorationLanguageCodeService',
  'ExplorationTagsService', 'ExplorationRightsService',
  'ExplorationInitStateNameService', 'ExplorationParamSpecsService',
  'ChangeListService', 'AlertsService', 'ExplorationStatesService',
  'ExplorationParamChangesService', 'ExplorationWarningsService',
  'ExplorationAdvancedFeaturesService', 'ALL_CATEGORIES',
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL', 'UserEmailPreferencesService',
  'EditableExplorationBackendApiService', 'UrlInterpolationService',
  'ExplorationAutomaticTextToSpeechService',
  'ExplorationCorrectnessFeedbackService',
  function(
      $scope, $http, $window, $uibModal,
      $rootScope, ExplorationDataService,
      ExplorationTitleService, ExplorationCategoryService,
      ExplorationObjectiveService, ExplorationLanguageCodeService,
      ExplorationTagsService, ExplorationRightsService,
      ExplorationInitStateNameService, ExplorationParamSpecsService,
      ChangeListService, AlertsService, ExplorationStatesService,
      ExplorationParamChangesService, ExplorationWarningsService,
      ExplorationAdvancedFeaturesService, ALL_CATEGORIES,
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL, UserEmailPreferencesService,
      EditableExplorationBackendApiService, UrlInterpolationService,
      ExplorationAutomaticTextToSpeechService,
      ExplorationCorrectnessFeedbackService){

    $scope.refreshSettingsTab = function() {

    }
    $scope.$on('refreshAudioTab', $scope.refreshSettingsTab);

  }
]);
