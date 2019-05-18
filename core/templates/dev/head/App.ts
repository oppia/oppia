// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Initialization and basic configuration for the Oppia module.
 */

require('components/button-directives/create-button/create-activity-button.module.ts');
require('components/button-directives/exploration-embed-modal/exploration-embed-button.module.ts');
require('components/button-directives/hint-and-solution-buttons/hint-and-solution-buttons.module.ts');
require('components/button-directives/social-buttons/social-buttons.module.ts');
require('components/button-directives/buttons-directives.module.ts');
require('components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.module.ts');
require('components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.module.ts');
require('components/ck-editor-helpers/ck-editor-helpers.module.ts');
require('components/codemirror-mergeview/codemirror-mergeview.module.ts');
require('components/common-layout-directives/alert-message/alert-message.module.ts');
require('components/common-layout-directives/attribution-guide/attribution-guide.module.ts');
require('components/common-layout-directives/background-banner/background-banner.module.ts');
require('components/common-layout-directives/loading-dots/loading-dots.module.ts');
require('components/common-layout-directives/promo-bar/promo-bar.module.ts');
require('components/common-layout-directives/sharing-links/sharing-links.module.ts');
require('components/common-layout-directives/side-navigation-bar/side-navigation-bar.module.ts');
require('components/common-layout-directives/top-navigation-bar/top-navigation-bar.module.ts');
require('components/common-layout-directives/common-layout-directives.module.ts');
require('components/entity-creation-services/entity-creation-services.module.ts');
require('components/forms/forms-directives/apply-validation/apply-validation.module.ts');
require('components/forms/forms-directives/audio-file-uploader/audio-file-uploader.module.ts');
require('components/forms/forms-directives/html-select/html-select.module.ts');
require('components/forms/forms-directives/image-uploader/image-uploader.module.ts');
require('components/forms/forms-directives/object-editor/object-editor.module.ts');
require('components/forms/forms-directives/require-is-float/require-is-float.module.ts');
require('components/forms/forms-directives/select2-dropdown/select2-dropdown.module.ts');
require('components/forms/forms-directives/forms-directives.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.module.ts');
require('components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.module.ts');
require('components/forms/forms-schema-editors/forms-schema-editors.module.ts');
require('components/forms/forms-unicode-filters/forms-unicode-filters.module.ts');
require('components/forms/forms-validators/forms-validators.module.ts');
require('components/forms/forms.module.ts');
require('components/profile-link-directives/circular-image/circular-image.module.ts');
require('components/profile-link-directives/profile-link-image/profile-link-image.module.ts');
require('components/profile-link-directives/profile-link-text/profile-link-text.module.ts');
require('components/profile-link-directives/profile-link-directives.module.ts');
require('components/ratings/rating-display/rating-display.module.ts');
require('components/ratings/ratings.module.ts');
require('components/state/answer-group-editor/answer-group-editor.module.ts');
require('components/state/hint-editor/hint-editor.module.ts');
require('components/state/outcome-editor/outcome-destination-editor/outcome-destination-editor.module.ts');
require('components/state/outcome-editor/outcome-feedback-editor/outcome-feedback-editor.module.ts');
require('components/state/outcome-editor/outcome-editor.module.ts');
require('components/state/response-header/response-header.module.ts');
require('components/state/rule-editor/rule-editor.module.ts');
require('components/state/rule-type-selector/rule-type-selector.module.ts');
require('components/state/solution-editor/solution-explanation-editor/solution-explanation-editor.module.ts');
require('components/state/solution-editor/solution-editor.module.ts');
require('components/state/state.module.ts');
require('components/summary-list-header/summary-list-header.module.ts');
require('components/summary-tile-directives/collection-summary-tile/collection-summary-tile.module.ts');
require('components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.module.ts');
require('components/summary-tile-directives/story-summary-tile/story-summary-tile.module.ts');
require('components/summary-tile-directives/summary-tile-directives.module.ts');
require('components/version-diff-visualization/version-diff-visualization.module.ts');
require('filters/string-utility-filters/string-utility-filters.module.ts');
require('filters/filters.module.ts');
require('pages/about-page/about-page.module.ts');
require('pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.module.ts');
require('pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.module.ts');
require('pages/admin-page/admin-navbar/admin-navbar.module.ts');
require('pages/admin-page/config-tab/admin-config-tab.module.ts');
require('pages/admin-page/jobs-tab/admin-jobs-tab.module.ts');
require('pages/admin-page/misc-tab/admin-misc-tab.module.ts');
require('pages/admin-page/roles-tab/roles-graph/role-graph.module.ts');
require('pages/admin-page/roles-tab/admin-roles-tab.module.ts');
require('pages/admin-page/admin-page.module.ts');
require('pages/collection-player-page/collection-footer/collection-footer.module.ts');
require('pages/collection-player-page/collection-local-nav/collection-local-nav.module.ts');
require('pages/collection-player-page/collection-node-list/collection-node-list.module.ts');
require('pages/collection-player-page/collection-player-page.module.ts');
require('pages/creator-dashboard-page/creator-dashboard-page.module.ts');
require('pages/donate-page/donate-page.module.ts');
require('pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.module.ts');
require('pages/email-dashboard-page/email-dashboard-page.module.ts');
require('pages/error-page/error-page.module.ts');
require('pages/exploration-editor-page/editor-navbar-breadcrumb/editor-navbar-breadcrumb.module.ts');
require('pages/exploration-editor-page/editor-navigation/editor-navigation.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/exploration-graph/exploration-graph.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/state-graph-visualization/state-graph-visualization.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/state-name-editor/state-name-editor.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/state-param-changes-editor/state-param-changes-editor.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/test-interaction-panel/test-interaction-panel.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/training-panel/training-panel.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/unresolved-answers-overview/unresolved-answers-overview.module.ts');
require('pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab.module.ts');
require('pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.module.ts');
require('pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.module.ts');
require('pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.module.ts');
require('pages/exploration-editor-page/feedback-tab/thread-table/thread-table.module.ts');
require('pages/exploration-editor-page/feedback-tab/feedback-tab.module.ts');
require('pages/exploration-editor-page/history-tab/history-tab.module.ts');
require('pages/exploration-editor-page/improvements-tab/playthrough-improvement-card/playthrough-improvement-card.module.ts');
require('pages/exploration-editor-page/improvements-tab/improvements-tab.module.ts');
require('pages/exploration-editor-page/mark-all-audio-and-translations-as-needing-update/mark-all-audio-and-translations-as-needing-update.module.ts');
require('pages/exploration-editor-page/param-changes-editor/param-changes-editor.module.ts');
require('pages/exploration-editor-page/preview-tab/preview-tab.module.ts');
require('pages/exploration-editor-page/settings-tab/settings-tab.module.ts');
require('pages/exploration-editor-page/statistics-tab/bar-chart/bar-chart.module.ts');
require('pages/exploration-editor-page/statistics-tab/cyclic-transitions-issue/cyclic-transitions-issue.module.ts');
require('pages/exploration-editor-page/statistics-tab/early-quit-issue/early-quit-issue.module.ts');
require('pages/exploration-editor-page/statistics-tab/multiple-incorrect-issue/multiple-incorrect-issue.module.ts');
require('pages/exploration-editor-page/statistics-tab/pie-chart/pie-chart.module.ts');
require('pages/exploration-editor-page/statistics-tab/playthrough-issues/playthrough-issues.module.ts');
require('pages/exploration-editor-page/statistics-tab/statistics-tab.module.ts');
require('pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.module.ts');
require('pages/exploration-editor-page/translation-tab/state-translation/state-translation.module.ts');
require('pages/exploration-editor-page/translation-tab/state-translation-editor/state-translation-editor.module.ts');
require('pages/exploration-editor-page/translation-tab/state-translation-status-graph/state-translation-status-graph.module.ts');
require('pages/exploration-editor-page/translation-tab/translator-overview/translator-overview.module.ts');
require('pages/exploration-editor-page/translation-tab/translation-tab.module.ts');
require('pages/exploration-editor-page/value-generator-editor/value-generator-editor.module.ts');
require('pages/exploration-editor-page/exploration-editor-page.module.ts');
require('pages/learner-dashboard-page/learner-dashboard-page.module.ts');
require('pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.module.ts');
require('pages/library-page/search-bar/search-bar.module.ts');
require('pages/library-page/search-results/search-results.module.ts');
require('pages/library-page/library-footer/library-footer.module.ts');
require('pages/library-page/library-page.module.ts');
require('pages/maintenance-page/maintenance-page.module.ts');
require('pages/moderator-page/moderator-page.module.ts');
require('pages/notifications-dashboard-page/notifications-dashboard-page.module.ts');
require('pages/practice-session-page/practice-session-page.module.ts');
require('pages/preferences-page/preferences-page.module.ts');
require('pages/profile-page/profile-page.module.ts');
require('pages/question-editor-page/question-editor-page.module.ts');
require('pages/question-player-page/question-player-page.module.ts');
require('pages/questions-list-page/questions-list-page.module.ts');
require('pages/show-suggestion-editor-pages/show-suggestion-modal-for-creator-view/show-suggestion-modal-for-creator-view.module.ts');
require('pages/show-suggestion-editor-pages/show-suggestion-modal-for-editor-view/show-suggestion-modal-for-editor-view.module.ts');
require('pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-local-view/show-suggestion-modal-for-learner-local-view.module.ts');
require('pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.module.ts');
require('pages/show-suggestion-editor-pages/suggestion-modal.module.ts');
require('pages/signup-page/signup-page.module.ts');
require('pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/worked-example-editor/worked-example-editor.module.ts');
require('pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/skill-concept-card-editor.module.ts');
require('pages/skill-editor-page/skill-editor-main-tab/skill-description-editor/skill-description-editor.module.ts');
require('pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/misconception-editor/misconception-editor.module.ts');
require('pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/skill-misconceptions-editor.module.ts');
require('pages/skill-editor-page/skill-editor-main-tab/skill-editor-main-tab.module.ts');
require('pages/skill-editor-page/skill-editor-navbar/skill-editor-navbar.module.ts');
require('pages/skill-editor-page/skill-editor-navbar-breadcrumb/skill-editor-navbar-breadcrumb.module.ts');
require('pages/skill-editor-page/skill-editor-questions-tab/skill-editor-questions-tab.module.ts');
require('pages/skill-editor-page/skill-editor-page.module.ts');
require('pages/splash-page/splash-page.module.ts');
require('pages/state-editor/state-content-editor/state-content-editor.module.ts');
require('pages/state-editor/state-hints-editor/state-hints-editor.module.ts');
require('pages/state-editor/state-interaction-editor/state-interaction-editor.module.ts');
require('pages/state-editor/state-responses/state-responses.module.ts');
require('pages/state-editor/state-solution-editor/state-solution-editor.module.ts');
require('pages/state-editor/state-editor.module.ts');
require('pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.module.ts');
require('pages/story-editor-page/main-story-editor/main-story-editor.module.ts');
require('pages/story-editor-page/story-editor-navbar/story-editor-navbar.module.ts');
require('pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.module.ts');
require('pages/story-editor-page/story-editor-page.module.ts');
require('pages/thanks-page/thanks-page.module.ts');
require('pages/teach-page/teach-page.module.ts');
require('pages/topic-editor-page/main-topic-editor/main-topic-editor-stories-list/main-topic-editor-stories-list.module.ts');
require('pages/topic-editor-page/main-topic-editor/main-topic-editor.module.ts');
require('pages/topic-editor-page/questions-tab/questions-tab.module.ts');
require('pages/topic-editor-page/subtopics-list-tab/subtopics-list-tab.module.ts');
require('pages/topic-editor-page/topic-editor-navbar/topic-editor-navbar.module.ts');
require('pages/topic-editor-page/topic-editor-navbar-breadcrumb/topic-editor-navbar-breadcrumb.module.ts');
require('pages/topic-editor-page/topic-editor-page.module.ts');
require('pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.module.ts');
require('pages/topic-landing-page/topic-landing-page.module.ts');
require('pages/topic-viewer-page/stories-list/stories-list.module.ts');
require('pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.module.ts');
require('pages/topic-viewer-page/topic-viewer-page.module.ts');
require('pages/topics-and-skills-dashboard-page/select-topics/select-topics.module.ts');
require('pages/topics-and-skills-dashboard-page/skills-list/skills-list.module.ts');
require('pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.module.ts');
require('pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.module.ts');
require('pages/topics-and-skills-dashboard-page/topics-list/topics-list.module.ts');
require('pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts');



require('I18nFooter.ts');
require('directives/FocusOnDirective.ts');

require('pages/Base.ts');

require('services/AlertsService.ts');
require('services/ContextService.ts');
require('services/NavigationService.ts');
require('services/UtilsService.ts');
require('services/DebouncerService.ts');
require('services/DateTimeFormatService.ts');
require('services/IdGenerationService.ts');
require('services/HtmlEscaperService.ts');
require('services/TranslationFileHashLoaderService.ts');
require('services/RteHelperService.ts');
require('services/StateRulesStatsService.ts');
require('services/ConstructTranslationIdsService.ts');
require('services/UserService.ts');
require('services/PromoBarService.ts');
require('services/contextual/DeviceInfoService.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');
require('services/stateful/BackgroundMaskService.ts');
require('services/stateful/FocusManagerService.ts');
require('services/SiteAnalyticsService.ts');

require(
  'components/common-layout-directives/alert-message/' +
  'alert-message.directive.ts');
require(
  'components/button-directives/create-button/' +
  'create-activity-button.directive.ts');

require(
  'components/forms/forms-directives/object-editor/object-editor.directive.ts');
require('components/common-layout-directives/promo-bar/promo-bar.directive.ts');
require(
  'components/common-layout-directives/side-navigation-bar/' +
  'side-navigation-bar.directive.ts');
require(
  'components/button-directives/social-buttons/social-buttons.directive.ts');
require(
  'components/common-layout-directives/top-navigation-bar/' +
  'top-navigation-bar.directive.ts');

require('domain/sidebar/SidebarStatusService.ts');
require('domain/user/UserInfoObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');

oppia.constant(
  'EXPLORATION_SUMMARY_DATA_URL_TEMPLATE', '/explorationsummarieshandler/data');

oppia.constant('EXPLORATION_AND_SKILL_ID_PATTERN', /^[a-zA-Z0-9_-]+$/);

// We use a slash because this character is forbidden in a state name.
oppia.constant('PLACEHOLDER_OUTCOME_DEST', '/');
oppia.constant('INTERACTION_DISPLAY_MODE_INLINE', 'inline');
oppia.constant('LOADING_INDICATOR_URL', '/activity/loadingIndicator.gif');
oppia.constant('OBJECT_EDITOR_URL_PREFIX', '/object_editor_template/');
// Feature still in development.
// NOTE TO DEVELOPERS: This should be synchronized with the value in feconf.
oppia.constant('ENABLE_ML_CLASSIFIERS', false);
// Feature still in development.
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
  'The current solution does not lead to another card.');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION',
  'The current solution does not correspond to a correct answer.');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_VALID',
  'The solution is now valid!');
oppia.constant('INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_CURRENT_RULE',
  'The current solution is no longer valid.');
oppia.constant('PARAMETER_TYPES', {
  REAL: 'Real',
  UNICODE_STRING: 'UnicodeString'
});
oppia.constant('ACTION_ACCEPT_SUGGESTION', 'accept');
oppia.constant('ACTION_REJECT_SUGGESTION', 'reject');

// The maximum number of nodes to show in a row of the state graph.
oppia.constant('MAX_NODES_PER_ROW', 4);
// The following variable must be at least 3. It represents the maximum length,
// in characters, for the name of each node label in the state graph.
oppia.constant('MAX_NODE_LABEL_LENGTH', 15);

// If an $http request fails with the following error codes, a warning is
// displayed.
oppia.constant('FATAL_ERROR_CODES', [400, 401, 404, 500]);

// Do not modify these, for backwards-compatibility reasons.
oppia.constant('COMPONENT_NAME_CONTENT', 'content');
oppia.constant('COMPONENT_NAME_HINT', 'hint');
oppia.constant('COMPONENT_NAME_SOLUTION', 'solution');
oppia.constant('COMPONENT_NAME_FEEDBACK', 'feedback');
oppia.constant('COMPONENT_NAME_DEFAULT_OUTCOME', 'default_outcome');
oppia.constant('COMPONENT_NAME_EXPLANATION', 'explanation');
oppia.constant('COMPONENT_NAME_WORKED_EXAMPLE', 'worked_example');

// Enables recording playthroughs from learner sessions.
oppia.constant('CURRENT_ACTION_SCHEMA_VERSION', 1);
oppia.constant('CURRENT_ISSUE_SCHEMA_VERSION', 1);
oppia.constant('EARLY_QUIT_THRESHOLD_IN_SECS', 45);
oppia.constant('NUM_INCORRECT_ANSWERS_THRESHOLD', 3);
oppia.constant('NUM_REPEATED_CYCLES_THRESHOLD', 3);
oppia.constant('MAX_PLAYTHROUGHS_FOR_ISSUE', 5);

oppia.constant('ACTION_TYPE_EXPLORATION_START', 'ExplorationStart');
oppia.constant('ACTION_TYPE_ANSWER_SUBMIT', 'AnswerSubmit');
oppia.constant('ACTION_TYPE_EXPLORATION_QUIT', 'ExplorationQuit');

oppia.constant('ISSUE_TYPE_EARLY_QUIT', 'EarlyQuit');
oppia.constant(
  'ISSUE_TYPE_MULTIPLE_INCORRECT_SUBMISSIONS', 'MultipleIncorrectSubmissions');
oppia.constant('ISSUE_TYPE_CYCLIC_STATE_TRANSITIONS', 'CyclicStateTransitions');
oppia.constant('SITE_NAME', 'Oppia.org');

oppia.constant('DEFAULT_PROFILE_IMAGE_PATH', '/avatar/user_blue_72px.png');
oppia.constant('FEEDBACK_POPOVER_PATH',
  '/pages/exploration_player/feedback_popup_container_directive.html');

oppia.constant('LOGOUT_URL', '/logout');

// Whether to enable the promo bar functionality. This does not actually turn on
// the promo bar, as that is gated by a config value (see config_domain). This
// merely avoids checking for whether the promo bar is enabled for every Oppia
// page visited.
oppia.constant('ENABLE_PROMO_BAR', true);

// TODO(vojtechjelinek): Move these to separate file later, after we establish
// process to follow for Angular constants (#6731).
oppia.constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
oppia.constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');
oppia.constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');
oppia.constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');

oppia.config([
  '$compileProvider', '$cookiesProvider', '$httpProvider',
  '$interpolateProvider', '$locationProvider',
  function(
      $compileProvider, $cookiesProvider, $httpProvider,
      $interpolateProvider, $locationProvider) {
    // This improves performance by disabling debug data. For more details,
    // see https://code.angularjs.org/1.5.5/docs/guide/production
    $compileProvider.debugInfoEnabled(false);

    // Set the AngularJS interpolators as <[ and ]>, to not conflict with
    // Jinja2 templates.
    $interpolateProvider.startSymbol('<[');
    $interpolateProvider.endSymbol(']>');

    // Prevent the search page from reloading if the search query is changed.
    $locationProvider.html5Mode(false);
    if (window.location.pathname === '/search/find') {
      $locationProvider.html5Mode(true);
    }

    // Prevent storing duplicate cookies for translation language.
    $cookiesProvider.defaults.path = '/';

    // Set default headers for POST and PUT requests.
    $httpProvider.defaults.headers.post = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    $httpProvider.defaults.headers.put = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add an interceptor to convert requests to strings and to log and show
    // warnings for error responses.
    $httpProvider.interceptors.push([
      '$q', '$log', 'AlertsService', function($q, $log, AlertsService) {
        return {
          request: function(config) {
            if (config.data) {
              config.data = $.param({
                csrf_token: GLOBALS.csrf_token,
                payload: JSON.stringify(config.data),
                source: document.URL
              }, true);
            }
            return config;
          },
          responseError: function(rejection) {
            // A rejection status of -1 seems to indicate (it's hard to find
            // documentation) that the response has not completed,
            // which can occur if the user navigates away from the page
            // while the response is pending, This should not be considered
            // an error.
            if (rejection.status !== -1) {
              $log.error(rejection.data);

              var warningMessage = 'Error communicating with server.';
              if (rejection.data && rejection.data.error) {
                warningMessage = rejection.data.error;
              }
              AlertsService.addWarning(warningMessage);
            }
            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);

oppia.config(['$provide', function($provide) {
  $provide.decorator('$log', ['$delegate', 'DEV_MODE',
    function($delegate, DEV_MODE) {
      var _originalError = $delegate.error;

      if (!DEV_MODE) {
        $delegate.log = function() {};
        $delegate.info = function() {};
        // TODO(sll): Send errors (and maybe warnings) to the backend.
        $delegate.warn = function() { };
        $delegate.error = function(message) {
          if (String(message).indexOf('$digest already in progress') === -1) {
            _originalError(message);
          }
        };
        // This keeps angular-mocks happy (in tests).
        $delegate.error.logs = [];
      }

      return $delegate;
    }
  ]);
}]);

oppia.config(['toastrConfig', function(toastrConfig) {
  angular.extend(toastrConfig, {
    allowHtml: false,
    iconClasses: {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    },
    positionClass: 'toast-bottom-right',
    messageClass: 'toast-message',
    progressBar: false,
    tapToDismiss: true,
    titleClass: 'toast-title'
  });
}]);

oppia.config(['recorderServiceProvider', function(recorderServiceProvider) {
  recorderServiceProvider.forceSwf(false);
  recorderServiceProvider.withMp3Conversion(true, {
    bitRate: 128
  });
}]);

// Overwrite the built-in exceptionHandler service to log errors to the backend
// (so that they can be fixed).
oppia.factory('$exceptionHandler', ['$log', function($log) {
  var MIN_TIME_BETWEEN_ERRORS_MSEC = 5000;
  var timeOfLastPostedError = Date.now() - MIN_TIME_BETWEEN_ERRORS_MSEC;

  return function(exception, cause) {
    var messageAndSourceAndStackTrace = [
      '',
      'Cause: ' + cause,
      exception.message,
      String(exception.stack),
      '    at URL: ' + window.location.href
    ].join('\n');

    // To prevent an overdose of errors, throttle to at most 1 error every
    // MIN_TIME_BETWEEN_ERRORS_MSEC.
    if (Date.now() - timeOfLastPostedError > MIN_TIME_BETWEEN_ERRORS_MSEC) {
      // Catch all errors, to guard against infinite recursive loops.
      try {
        // We use jQuery here instead of Angular's $http, since the latter
        // creates a circular dependency.
        $.ajax({
          type: 'POST',
          url: '/frontend_errors',
          data: $.param({
            csrf_token: GLOBALS.csrf_token,
            payload: JSON.stringify({
              error: messageAndSourceAndStackTrace
            }),
            source: document.URL
          }, true),
          contentType: 'application/x-www-form-urlencoded',
          dataType: 'text',
          async: true
        });

        timeOfLastPostedError = Date.now();
      } catch (loggingError) {
        $log.warn('Error logging failed.');
      }
    }

    $log.error.apply($log, arguments);
  };
}]);

oppia.constant('LABEL_FOR_CLEARING_FOCUS', 'labelForClearingFocus');

// Add a String.prototype.trim() polyfill for IE8.
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// Add an Object.create() polyfill for IE8.
if (typeof Object.create !== 'function') {
  (function() {
    var F = function() {};
    Object.create = function(o) {
      if (arguments.length > 1) {
        throw Error('Second argument for Object.create() is not supported');
      }
      if (o === null) {
        throw Error('Cannot set a null [[Prototype]]');
      }
      if (typeof o !== 'object') {
        throw TypeError('Argument must be an object');
      }
      F.prototype = o;
      return new F();
    };
  })();
}

// Add a Number.isInteger() polyfill for IE.
Number.isInteger = Number.isInteger || function(value) {
  return (
    typeof value === 'number' && isFinite(value) &&
    Math.floor(value) === value);
};
