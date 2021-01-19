// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Angular services index file.
 */

import { Type } from '@angular/core';

import { ExternalRteSaveService } from './external-rte-save.service';
import { ExternalSaveService } from './external-save.service';
import { PlatformFeatureService } from './platform-feature.service';
import { MockCsrfTokenService, RequestInterceptor } from './request-interceptor.service';
import { CountVectorizerService } from 'classifiers/count-vectorizer.service';
import { PythonProgramTokenizer } from 'classifiers/python-program.tokenizer';
import { SVMPredictionService } from 'classifiers/svm-prediction.service';
import { TextInputTokenizer } from 'classifiers/text-input.tokenizer';
import { WinnowingPreprocessingService } from 'classifiers/winnowing-preprocessing.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service.ts';
import { CollectionCreationBackendService } from 'components/entity-creation-services/collection-creation-backend-api.service';
import { CollectionCreationService } from 'components/entity-creation-services/collection-creation.service';
import { StateGraphLayoutService } from 'components/graph-services/graph-layout.service';
import { ProfileLinkImageBackendApiService } from 'components/profile-link-directives/profile-link-image-backend-api.service';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { StateContentService } from 'components/state-editor/state-editor-properties-services/state-content.service';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateNameService } from 'components/state-editor/state-editor-properties-services/state-name.service';
import { StateNextContentIdIndexService } from 'components/state-editor/state-editor-properties-services/state-next-content-id-index.service';
import { StateParamChangesService } from 'components/state-editor/state-editor-properties-services/state-param-changes.service';
import { StatePropertyService } from 'components/state-editor/state-editor-properties-services/state-property.service';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateSolicitAnswerDetailsService } from 'components/state-editor/state-editor-properties-services/state-solicit-answer-details.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateWrittenTranslationsService } from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { AdminBackendApiService } from 'domain/admin/admin-backend-api.service';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { CollectionRightsBackendApiService } from 'domain/collection/collection-rights-backend-api.service';
import { CollectionValidationService } from 'domain/collection/collection-validation.service';
import { EditableCollectionBackendApiService } from 'domain/collection/editable-collection-backend-api.service';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { SearchExplorationsBackendApiService } from 'domain/collection/search-explorations-backend-api.service';
import { CreatorDashboardBackendApiService } from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EmailDashboardBackendApiService } from 'domain/email-dashboard/email-dashboard-backend-api.service';
import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { AnswerStatsObjectFactory } from 'domain/exploration/AnswerStatsObjectFactory';
import { ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { LostChangeObjectFactory } from 'domain/exploration/LostChangeObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from 'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from 'domain/exploration/ParamChangesObjectFactory';
import { ParamSpecObjectFactory } from 'domain/exploration/ParamSpecObjectFactory';
import { ParamSpecsObjectFactory } from 'domain/exploration/ParamSpecsObjectFactory';
import { ParamTypeObjectFactory } from 'domain/exploration/ParamTypeObjectFactory';
import { RecordedVoiceoversObjectFactory } from 'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { SubtitledHtmlObjectFactory } from 'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtitledUnicodeObjectFactory } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { VoiceoverObjectFactory } from 'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from 'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from 'domain/exploration/WrittenTranslationsObjectFactory';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ExplorationPermissionsBackendApiService } from 'domain/exploration/exploration-permissions-backend-api.service';
import { StateInteractionStatsBackendApiService } from 'domain/exploration/state-interaction-stats-backend-api.service';
import { StatsReportingBackendApiService } from 'domain/exploration/stats-reporting-backend-api.service';
import { ThreadMessageObjectFactory } from 'domain/feedback_message/ThreadMessageObjectFactory';
import { ThreadMessageSummaryObjectFactory } from 'domain/feedback_message/ThreadMessageSummaryObjectFactory';
import { FeedbackThreadObjectFactory } from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { LearnerDashboardIdsBackendApiService } from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { NumberWithUnitsObjectFactory } from 'domain/objects/NumberWithUnitsObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { PlatformFeatureAdminBackendApiService } from 'domain/platform_feature/platform-feature-admin-backend-api.service';
import { PlatformFeatureBackendApiService } from 'domain/platform_feature/platform-feature-backend-api.service';
import { PlatformFeatureDummyBackendApiService } from 'domain/platform_feature/platform-feature-dummy-backend-api.service';
import { EditableQuestionBackendApiService } from 'domain/question/editable-question-backend-api.service';
import { QuestionSummaryForOneSkillObjectFactory } from 'domain/question/QuestionSummaryForOneSkillObjectFactory';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { QuestionSummaryObjectFactory } from 'domain/question/QuestionSummaryObjectFactory';
import { PretestQuestionBackendApiService } from 'domain/question/pretest-question-backend-api.service';
import { QuestionBackendApiService } from 'domain/question/question-backend-api.service.ts';
import { ExplorationRecommendationsBackendApiService } from 'domain/recommendations/exploration-recommendations-backend-api.service';
import { ReviewTestBackendApiService } from 'domain/review_test/review-test-backend-api.service';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { ConceptCardObjectFactory } from 'domain/skill/ConceptCardObjectFactory';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { RubricObjectFactory } from 'domain/skill/RubricObjectFactory';
import { ShortSkillSummaryObjectFactory } from 'domain/skill/ShortSkillSummaryObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { WorkedExampleObjectFactory } from 'domain/skill/WorkedExampleObjectFactory';
import { ConceptCardBackendApiService } from 'domain/skill/concept-card-backend-api.service';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillCreationBackendApiService } from 'domain/skill/skill-creation-backend-api.service';
import { SkillMasteryBackendApiService } from 'domain/skill/skill-mastery-backend-api.service';
import { SkillRightsBackendApiService } from 'domain/skill/skill-rights-backend-api.service.ts';
import { SkillUpdateService } from 'domain/skill/skill-update.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
import { LearnerActionObjectFactory } from 'domain/statistics/LearnerActionObjectFactory';
import { PlaythroughIssueObjectFactory } from 'domain/statistics/PlaythroughIssueObjectFactory';
import { PlaythroughObjectFactory } from 'domain/statistics/PlaythroughObjectFactory';
import { LearnerAnswerDetailsBackendApiService } from 'domain/statistics/learner-answer-details-backend-api.service';
import { PlaythroughBackendApiService } from 'domain/statistics/playthrough-backend-api.service';
import { StateTopAnswersStatsObjectFactory } from 'domain/statistics/state-top-answers-stats-object.factory';
import { StoryContentsObjectFactory } from 'domain/story/StoryContentsObjectFactory';
import { StoryObjectFactory } from 'domain/story/StoryObjectFactory';
import { StoryValidationService } from 'domain/story/story-validation.service';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { ReadOnlySubtopicPageObjectFactory } from 'domain/subtopic_viewer/ReadOnlySubtopicPageObjectFactory';
import { SubtopicViewerBackendApiService } from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import { SuggestionObjectFactory } from 'domain/suggestion/SuggestionObjectFactory';
import { SuggestionThreadObjectFactory } from 'domain/suggestion/SuggestionThreadObjectFactory';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { ExplorationIdValidationService } from 'domain/exploration/exploration-id-validation.service';
import { StoryReferenceObjectFactory } from 'domain/topic/StoryReferenceObjectFactory';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';
import { SubtopicPageContentsObjectFactory } from 'domain/topic/SubtopicPageContentsObjectFactory';
import { SubtopicPageObjectFactory } from 'domain/topic/SubtopicPageObjectFactory';
import { TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { TopicRightsBackendApiService } from 'domain/topic/topic-rights-backend-api.service';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { TopicCreationBackendApiService } from 'domain/topic/topic-creation-backend-api.service.ts';
import { TopicUpdateService } from 'domain/topic/topic-update.service.ts';
import { ReadOnlyTopicObjectFactory } from 'domain/topic_viewer/read-only-topic-object.factory';
import { TopicViewerBackendApiService } from 'domain/topic_viewer/topic-viewer-backend-api.service';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';
import { PopulateRuleContentIdsService } from
  'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ExpressionEvaluatorService } from 'expressions/expression-evaluator.service';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { ExpressionParserService } from 'expressions/expression-parser.service';
import { ExpressionSyntaxTreeService } from 'expressions/expression-syntax-tree.service';
import { FormatTimePipe } from 'filters/format-timer.pipe';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe.ts';
import { CamelCaseToHyphensPipe } from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import { NormalizeWhitespacePunctuationAndCasePipe } from 'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { AlgebraicExpressionInputRulesService } from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-rules.service';
import { AlgebraicExpressionInputValidationService } from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-validation.service';
import { CodeReplPredictionService } from 'interactions/CodeRepl/code-repl-prediction.service';
import { CodeReplRulesService } from 'interactions/CodeRepl/directives/code-repl-rules.service';
import { CodeReplValidationService } from 'interactions/CodeRepl/directives/code-repl-validation.service';
import { ContinueRulesService } from 'interactions/Continue/directives/continue-rules.service';
import { ContinueValidationService } from 'interactions/Continue/directives/continue-validation.service';
import { DragAndDropSortInputRulesService } from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';
import { DragAndDropSortInputValidationService } from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-validation.service';
import { EndExplorationRulesService } from 'interactions/EndExploration/directives/end-exploration-rules.service';
import { EndExplorationValidationService } from 'interactions/EndExploration/directives/end-exploration-validation.service';
import { FractionInputRulesService } from 'interactions/FractionInput/directives/fraction-input-rules.service';
import { FractionInputValidationService } from 'interactions/FractionInput/directives/fraction-input-validation.service';
import { GraphDetailService } from 'interactions/GraphInput/directives/graph-detail.service';
import { GraphInputRulesService } from 'interactions/GraphInput/directives/graph-input-rules.service';
import { GraphInputValidationService } from 'interactions/GraphInput/directives/graph-input-validation.service';
import { GraphUtilsService } from 'interactions/GraphInput/directives/graph-utils.service';
import { ImageClickInputRulesService } from 'interactions/ImageClickInput/directives/image-click-input-rules.service';
import { ImageClickInputValidationService } from 'interactions/ImageClickInput/directives/image-click-input-validation.service';
import { InteractiveMapRulesService } from 'interactions/InteractiveMap/directives/interactive-map-rules.service';
import { InteractiveMapValidationService } from 'interactions/InteractiveMap/directives/interactive-map-validation.service';
import { ItemSelectionInputRulesService } from 'interactions/ItemSelectionInput/directives/item-selection-input-rules.service';
import { ItemSelectionInputValidationService } from 'interactions/ItemSelectionInput/directives/item-selection-input-validation.service';
import { LogicProofRulesService } from 'interactions/LogicProof/directives/logic-proof-rules.service';
import { LogicProofValidationService } from 'interactions/LogicProof/directives/logic-proof-validation.service';
import { MathEquationInputRulesService } from 'interactions/MathEquationInput/directives/math-equation-input-rules.service';
import { MathEquationInputValidationService } from 'interactions/MathEquationInput/directives/math-equation-input-validation.service';
import { MultipleChoiceInputRulesService } from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-rules.service';
import { MultipleChoiceInputValidationService } from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-validation.service';
import { MusicNotesInputRulesService } from 'interactions/MusicNotesInput/directives/music-notes-input-rules.service';
import { MusicNotesInputValidationService } from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import { MusicPhrasePlayerService } from 'interactions/MusicNotesInput/directives/music-phrase-player.service';
import { NumberWithUnitsRulesService } from 'interactions/NumberWithUnits/directives/number-with-units-rules.service';
import { NumberWithUnitsValidationService } from 'interactions/NumberWithUnits/directives/number-with-units-validation.service.ts';
import { NumericExpressionInputRulesService } from 'interactions/NumericExpressionInput/directives/numeric-expression-input-rules.service';
import { NumericExpressionInputValidationService } from 'interactions/NumericExpressionInput/directives/numeric-expression-input-validation.service';
import { NumericInputRulesService } from 'interactions/NumericInput/directives/numeric-input-rules.service';
import { NumericInputValidationService } from 'interactions/NumericInput/directives/numeric-input-validation.service';
import { PencilCodeEditorRulesService } from 'interactions/PencilCodeEditor/directives/pencil-code-editor-rules.service';
import { PencilCodeEditorValidationService } from 'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service';
import { RatioExpressionInputRulesService } from 'interactions/RatioExpressionInput/directives/ratio-expression-input-rules.service';
import { RatioExpressionInputValidationService } from 'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import { SetInputRulesService } from 'interactions/SetInput/directives/set-input-rules.service';
import { SetInputValidationService } from 'interactions/SetInput/directives/set-input-validation.service';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { TextInputValidationService } from 'interactions/TextInput/directives/text-input-validation.service';
import { TextInputPredictionService } from 'interactions/TextInput/text-input-prediction.service';
import { baseInteractionValidationService } from 'interactions/base-interaction-validation.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AdminRouterService } from 'pages/admin-page/services/admin-router.service.ts';
import { AdminTaskManagerService } from 'pages/admin-page/services/admin-task-manager.service';
import { ContributionOpportunitiesBackendApiService } from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { EmailDashboardDataService } from 'pages/email-dashboard-pages/email-dashboard-data.service';
import { InteractionDetailsCacheService } from 'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { ThreadDataBackendApiService } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { ThreadStatusDisplayService } from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import { VersionTreeService } from 'pages/exploration-editor-page/history-tab/services/version-tree.service';
import { AngularNameService } from 'pages/exploration-editor-page/services/angular-name.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ExplorationDiffService } from 'pages/exploration-editor-page/services/exploration-diff.service';
import { StateEditorRefreshService } from 'pages/exploration-editor-page/services/state-editor-refresh.service';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { AnswerClassificationService } from 'pages/exploration-player-page/services/answer-classification.service';
import { AudioPreloaderService } from 'pages/exploration-player-page/services/audio-preloader.service';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { AudioTranslationManagerService } from 'pages/exploration-player-page/services/audio-translation-manager.service';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { ExplorationRecommendationsService } from 'pages/exploration-player-page/services/exploration-recommendations.service';
import { ExtractImageFilenamesFromStateService } from 'pages/exploration-player-page/services/extract-image-filenames-from-state.service';
import { FatigueDetectionService } from 'pages/exploration-player-page/services/fatigue-detection.service';
import { HintsAndSolutionManagerService } from 'pages/exploration-player-page/services/hints-and-solution-manager.service';
import { LearnerParamsService } from 'pages/exploration-player-page/services/learner-params.service';
import { NumberAttemptsService } from 'pages/exploration-player-page/services/number-attempts.service';
import { PlayerCorrectnessFeedbackEnabledService } from 'pages/exploration-player-page/services/player-correctness-feedback-enabled.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { PredictionAlgorithmRegistryService } from 'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { QuestionPlayerEngineService } from 'pages/exploration-player-page/services/question-player-engine.service';
import { StateClassifierMappingService } from 'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StatsReportingService } from 'pages/exploration-player-page/services/stats-reporting.service';
import { ProfilePageBackendApiService } from 'pages/profile-page/profile-page-backend-api.service';
import { ReviewTestEngineService } from 'pages/review-test-page/review-test-engine.service.ts';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { StoryEditorNavigationService } from 'pages/story-editor-page/services/story-editor-navigation.service';
import { StoryEditorStateService } from 'pages/story-editor-page/services/story-editor-state.service';
import { TopicsAndSkillsDashboardPageService } from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.service';
import { AlertsService } from 'services/alerts.service';
import { AppService } from 'services/app.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AttributionService } from 'services/attribution.service';
import { AudioBarStatusService } from 'services/audio-bar-status.service';
import { AuthInterceptor } from 'services/auth-interceptor.service';
import { AuthService } from 'services/auth.service';
import { AutogeneratedAudioPlayerService } from 'services/autogenerated-audio-player.service';
import { AutoplayedVideosService } from 'services/autoplayed-videos.service';
import { BottomNavbarStatusService } from 'services/bottom-navbar-status.service';
import { CodeNormalizerService } from 'services/code-normalizer.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { ConstructTranslationIdsService } from 'services/construct-translation-ids.service';
import { ContentTranslationLanguageService } from 'pages/exploration-player-page/services/content-translation-language.service';
import { ContentTranslationManagerService } from 'pages/exploration-player-page/services/content-translation-manager.service';
import { ContextService } from 'services/context.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DocumentAttributeCustomizationService } from 'services/contextual/document-attribute-customization.service';
import { LoggerService } from 'services/contextual/logger.service';
import { MetaTagCustomizationService } from 'services/contextual/meta-tag-customization.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { DebouncerService } from 'services/debouncer.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationFeaturesBackendApiService } from 'services/exploration-features-backend-api.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { ExplorationImprovementsBackendApiService } from 'services/exploration-improvements-backend-api.service';
import { ExplorationImprovementsTaskRegistryService } from 'services/exploration-improvements-task-registry.service';
import { ExplorationStatsBackendApiService } from 'services/exploration-stats-backend-api.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { ExtensionTagAssemblerService } from 'services/extension-tag-assembler.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { GuppyConfigurationService } from 'services/guppy-configuration.service';
import { GuppyInitializationService } from 'services/guppy-initialization.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { IdGenerationService } from 'services/id-generation.service';
import { ImprovementsService } from 'services/improvements.service';
import { InteractionRulesRegistryService } from 'services/interaction-rules-registry.service';
import { InteractionSpecsService } from 'services/interaction-specs.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { LocalStorageService } from 'services/local-storage.service';
import { MathInteractionsService } from 'services/math-interactions.service';
import { MessengerService } from 'services/messenger.service';
import { PageTitleService } from 'services/page-title.service';
import { PlaythroughIssuesBackendApiService } from 'services/playthrough-issues-backend-api.service';
import { PlaythroughService } from 'services/playthrough.service';
import { QuestionsListService } from 'services/questions-list.service';
import { SchemaDefaultValueService } from 'services/schema-default-value.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { SchemaUndefinedLastElementService } from 'services/schema-undefined-last-element.service';
import { SearchBackendApiService } from 'services/search-backend-api.service';
import { SearchService } from 'services/search.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SolutionVerificationService } from 'pages/exploration-editor-page/editor-tab/services/solution-verification.service.ts';
import { SpeechSynthesisChunkerService } from 'services/speech-synthesis-chunker.service';
import { StateInteractionStatsService } from 'services/state-interaction-stats.service';
import { StateTopAnswersStatsBackendApiService } from 'services/state-top-answers-stats-backend-api.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { SuggestionsService } from 'services/suggestions.service';
import { TranslateService } from 'services/translate.service';
import { TranslationTabActiveModeService } from 'pages/exploration-editor-page/translation-tab/services/translation-tab-active-mode.service';
import { TranslationsBackendApiService } from 'services/translations-backend-api.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { UserBackendApiService } from 'services/user-backend-api.service.ts';
import { UserService } from 'services/user.service';
import { UtilsService } from 'services/utils.service';
import { ValidatorsService } from 'services/validators.service';
import { PromoBarBackendApiService } from 'services/promo-bar-backend-api.service';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { ExplorationDataBackendApiService } from 'pages/exploration-editor-page/services/exploration-data-backend-api.service';

export const angularServices: [string, Type<{}>][] = [
  ['AdminBackendApiService', AdminBackendApiService],
  ['AdminDataService', AdminDataService],
  ['AdminRouterService', AdminRouterService],
  ['AdminTaskManagerService', AdminTaskManagerService],
  ['AlertsService', AlertsService],
  ['AlgebraicExpressionInputRulesService',
    AlgebraicExpressionInputRulesService],
  ['AlgebraicExpressionInputValidationService',
    AlgebraicExpressionInputValidationService],
  ['AngularNameService', AngularNameService],
  ['AnswerClassificationService', AnswerClassificationService],
  ['AnswerGroupObjectFactory', AnswerGroupObjectFactory],
  ['AnswerStatsObjectFactory', AnswerStatsObjectFactory],
  ['AppService', AppService],
  ['AssetsBackendApiService', AssetsBackendApiService],
  ['AttributionService', AttributionService],
  ['AudioBarStatusService', AudioBarStatusService],
  ['AudioPreloaderService', AudioPreloaderService],
  ['AudioTranslationLanguageService', AudioTranslationLanguageService],
  ['AudioTranslationManagerService', AudioTranslationManagerService],
  ['AuthInterceptor', AuthInterceptor],
  ['AuthService', AuthService],
  ['AutogeneratedAudioPlayerService', AutogeneratedAudioPlayerService],
  ['AutoplayedVideosService', AutoplayedVideosService],
  ['BackgroundMaskService', BackgroundMaskService],
  ['BottomNavbarStatusService', BottomNavbarStatusService],
  ['BrowserCheckerService', BrowserCheckerService],
  ['CamelCaseToHyphensPipe', CamelCaseToHyphensPipe],
  ['CapitalizePipe', CapitalizePipe],
  ['CkEditorCopyContentService', CkEditorCopyContentService],
  ['ClassroomBackendApiService', ClassroomBackendApiService],
  ['CodeNormalizerService', CodeNormalizerService],
  ['CodeReplPredictionService', CodeReplPredictionService],
  ['CodeReplRulesService', CodeReplRulesService],
  ['CodeReplValidationService', CodeReplValidationService],
  ['CollectionCreationBackendService', CollectionCreationBackendService],
  ['CollectionCreationService', CollectionCreationService],
  ['CollectionRightsBackendApiService', CollectionRightsBackendApiService],
  ['CollectionValidationService', CollectionValidationService],
  ['ComputeGraphService', ComputeGraphService],
  ['ConceptCardBackendApiService', ConceptCardBackendApiService],
  ['ConceptCardObjectFactory', ConceptCardObjectFactory],
  ['ConstructTranslationIdsService', ConstructTranslationIdsService],
  ['ContentTranslationLanguageService', ContentTranslationLanguageService],
  ['ContentTranslationManagerService', ContentTranslationManagerService],
  ['ContextService', ContextService],
  ['ContinueRulesService', ContinueRulesService],
  ['ContinueValidationService', ContinueValidationService],
  ['ContributionOpportunitiesBackendApiService',
    ContributionOpportunitiesBackendApiService],
  ['ConvertToPlainTextPipe', ConvertToPlainTextPipe],
  ['CountVectorizerService', CountVectorizerService],
  ['CreatorDashboardBackendApiService', CreatorDashboardBackendApiService],
  ['CsrfTokenService', CsrfTokenService],
  ['CurrentInteractionService', CurrentInteractionService],
  ['DateTimeFormatService', DateTimeFormatService],
  ['DebouncerService', DebouncerService],
  ['DeviceInfoService', DeviceInfoService],
  ['DocumentAttributeCustomizationService',
    DocumentAttributeCustomizationService],
  ['DragAndDropSortInputRulesService', DragAndDropSortInputRulesService],
  ['DragAndDropSortInputValidationService',
    DragAndDropSortInputValidationService],
  ['EditabilityService', EditabilityService],
  ['EditableCollectionBackendApiService', EditableCollectionBackendApiService],
  ['EditableExplorationBackendApiService',
    EditableExplorationBackendApiService],
  ['EditableTopicBackendApiService', EditableTopicBackendApiService],
  ['EditableStoryBackendApiService', EditableStoryBackendApiService],
  ['EditorFirstTimeEventsService', EditorFirstTimeEventsService],
  ['EmailDashboardBackendApiService', EmailDashboardBackendApiService],
  ['EmailDashboardDataService', EmailDashboardDataService],
  ['EndExplorationRulesService', EndExplorationRulesService],
  ['EndExplorationValidationService', EndExplorationValidationService],
  ['ExplorationDataBackendApiService', ExplorationDataBackendApiService],
  ['ExplorationDataService', ExplorationDataService],
  ['ExplorationDiffService', ExplorationDiffService],
  ['ExplorationFeaturesBackendApiService',
    ExplorationFeaturesBackendApiService],
  ['ExplorationFeaturesService', ExplorationFeaturesService],
  ['ExplorationHtmlFormatterService', ExplorationHtmlFormatterService],
  ['ExplorationIdValidationService', ExplorationIdValidationService],
  ['ExplorationImprovementsBackendApiService',
    ExplorationImprovementsBackendApiService],
  ['ExplorationImprovementsTaskRegistryService',
    ExplorationImprovementsTaskRegistryService],
  ['ExplorationObjectFactory', ExplorationObjectFactory],
  ['ExplorationPermissionsBackendApiService',
    ExplorationPermissionsBackendApiService],
  ['ExplorationRecommendationsBackendApiService',
    ExplorationRecommendationsBackendApiService],
  ['ExplorationRecommendationsService', ExplorationRecommendationsService],
  ['ExplorationStatsBackendApiService', ExplorationStatsBackendApiService],
  ['ExplorationStatsService', ExplorationStatsService],
  ['ExplorationSummaryBackendApiService', ExplorationSummaryBackendApiService],
  ['ExpressionEvaluatorService', ExpressionEvaluatorService],
  ['ExpressionInterpolationService', ExpressionInterpolationService],
  ['ExpressionParserService', ExpressionParserService],
  ['ExpressionSyntaxTreeService', ExpressionSyntaxTreeService],
  ['ExtensionTagAssemblerService', ExtensionTagAssemblerService],
  ['ExternalRteSaveService', ExternalRteSaveService],
  ['ExternalSaveService', ExternalSaveService],
  ['ExtractImageFilenamesFromStateService',
    ExtractImageFilenamesFromStateService],
  ['FatigueDetectionService',
    FatigueDetectionService],
  ['FeedbackThreadObjectFactory', FeedbackThreadObjectFactory],
  ['FocusManagerService', FocusManagerService],
  ['FormatTimePipe', FormatTimePipe],
  ['FormatRtePreviewPipe', FormatRtePreviewPipe],
  ['FractionInputRulesService', FractionInputRulesService],
  ['FractionInputValidationService', FractionInputValidationService],
  ['FractionObjectFactory', FractionObjectFactory],
  ['GenerateContentIdService', GenerateContentIdService],
  ['GraphDetailService', GraphDetailService],
  ['GraphInputRulesService', GraphInputRulesService],
  ['GraphInputValidationService', GraphInputValidationService],
  ['GraphUtilsService', GraphUtilsService],
  ['GuestCollectionProgressService', GuestCollectionProgressService],
  ['GuppyConfigurationService', GuppyConfigurationService],
  ['GuppyInitializationService', GuppyInitializationService],
  ['HintsAndSolutionManagerService', HintsAndSolutionManagerService],
  ['HintObjectFactory', HintObjectFactory],
  ['HtmlEscaperService', HtmlEscaperService],
  ['I18nLanguageCodeService', I18nLanguageCodeService],
  ['IdGenerationService', IdGenerationService],
  ['ImageClickInputRulesService', ImageClickInputRulesService],
  ['ImageClickInputValidationService', ImageClickInputValidationService],
  ['ImagePreloaderService', ImagePreloaderService],
  ['ImprovementsService', ImprovementsService],
  ['InteractionAttributesExtractorService',
    InteractionAttributesExtractorService],
  ['InteractionDetailsCacheService', InteractionDetailsCacheService],
  ['InteractionObjectFactory', InteractionObjectFactory],
  ['InteractionRulesRegistryService', InteractionRulesRegistryService],
  ['InteractionSpecsService', InteractionSpecsService],
  ['InteractiveMapRulesService', InteractiveMapRulesService],
  ['InteractiveMapValidationService', InteractiveMapValidationService],
  ['ItemSelectionInputRulesService', ItemSelectionInputRulesService],
  ['ItemSelectionInputValidationService', ItemSelectionInputValidationService],
  ['KeyboardShortcutService', KeyboardShortcutService],
  ['LanguageUtilService', LanguageUtilService],
  ['LearnerActionObjectFactory', LearnerActionObjectFactory],
  ['LearnerAnswerDetailsBackendApiService',
    LearnerAnswerDetailsBackendApiService],
  ['LearnerDashboardBackendApiService', LearnerDashboardBackendApiService],
  ['LearnerDashboardIdsBackendApiService',
    LearnerDashboardIdsBackendApiService],
  ['LearnerParamsService', LearnerParamsService],
  ['LoaderService', LoaderService],
  ['LocalStorageService', LocalStorageService],
  ['LoggerService', LoggerService],
  ['LogicProofRulesService', LogicProofRulesService],
  ['LogicProofValidationService', LogicProofValidationService],
  ['LostChangeObjectFactory', LostChangeObjectFactory],
  ['MathEquationInputRulesService', MathEquationInputRulesService],
  ['MathEquationInputValidationService', MathEquationInputValidationService],
  ['MathInteractionsService', MathInteractionsService],
  ['MessengerService', MessengerService],
  ['MetaTagCustomizationService', MetaTagCustomizationService],
  ['MisconceptionObjectFactory', MisconceptionObjectFactory],
  ['MockCsrfTokenService', MockCsrfTokenService],
  ['MultipleChoiceInputRulesService', MultipleChoiceInputRulesService],
  ['MultipleChoiceInputValidationService',
    MultipleChoiceInputValidationService],
  ['MusicNotesInputRulesService', MusicNotesInputRulesService],
  ['MusicNotesInputValidationService', MusicNotesInputValidationService],
  ['MusicPhrasePlayerService', MusicPhrasePlayerService],
  ['NormalizeWhitespacePipe', NormalizeWhitespacePipe],
  ['NormalizeWhitespacePunctuationAndCasePipe',
    NormalizeWhitespacePunctuationAndCasePipe],
  ['NumberAttemptsService', NumberAttemptsService],
  ['NumberWithUnitsObjectFactory', NumberWithUnitsObjectFactory],
  ['NumberWithUnitsRulesService', NumberWithUnitsRulesService],
  ['NumberWithUnitsValidationService', NumberWithUnitsValidationService],
  ['NumericExpressionInputRulesService', NumericExpressionInputRulesService],
  ['NumericExpressionInputValidationService',
    NumericExpressionInputValidationService],
  ['NumericInputRulesService', NumericInputRulesService],
  ['NumericInputValidationService', NumericInputValidationService],
  ['OutcomeObjectFactory', OutcomeObjectFactory],
  ['PageTitleService', PageTitleService],
  ['ParamChangeObjectFactory', ParamChangeObjectFactory],
  ['ParamChangesObjectFactory', ParamChangesObjectFactory],
  ['ParamSpecObjectFactory', ParamSpecObjectFactory],
  ['ParamSpecsObjectFactory', ParamSpecsObjectFactory],
  ['ParamTypeObjectFactory', ParamTypeObjectFactory],
  ['PencilCodeEditorRulesService', PencilCodeEditorRulesService],
  ['PencilCodeEditorValidationService', PencilCodeEditorValidationService],
  ['PlatformFeatureAdminBackendApiService',
    PlatformFeatureAdminBackendApiService],
  ['PlatformFeatureBackendApiService', PlatformFeatureBackendApiService],
  ['PlatformFeatureDummyBackendApiService',
    PlatformFeatureDummyBackendApiService],
  ['PlatformFeatureService', PlatformFeatureService],
  ['PlayerCorrectnessFeedbackEnabledService',
    PlayerCorrectnessFeedbackEnabledService],
  ['PlayerPositionService', PlayerPositionService],
  ['PlayerTranscriptService', PlayerTranscriptService],
  ['PlaythroughBackendApiService', PlaythroughBackendApiService],
  ['PlaythroughIssueObjectFactory', PlaythroughIssueObjectFactory],
  ['PlaythroughIssuesBackendApiService', PlaythroughIssuesBackendApiService],
  ['PlaythroughObjectFactory', PlaythroughObjectFactory],
  ['PopulateRuleContentIdsService', PopulateRuleContentIdsService],
  ['PlaythroughService', PlaythroughService],
  ['PredictionAlgorithmRegistryService', PredictionAlgorithmRegistryService],
  ['PretestQuestionBackendApiService', PretestQuestionBackendApiService],
  ['ProfileLinkImageBackendApiService', ProfileLinkImageBackendApiService],
  ['ProfilePageBackendApiService', ProfilePageBackendApiService],
  ['PromoBarBackendApiService', PromoBarBackendApiService],
  ['PythonProgramTokenizer', PythonProgramTokenizer],
  ['EditableQuestionBackendApiService', EditableQuestionBackendApiService],
  ['QuestionObjectFactory', QuestionObjectFactory],
  ['QuestionBackendApiService', QuestionBackendApiService],
  ['QuestionsListService', QuestionsListService],
  ['QuestionPlayerEngineService', QuestionPlayerEngineService],
  ['QuestionSummaryForOneSkillObjectFactory',
    QuestionSummaryForOneSkillObjectFactory],
  ['QuestionSummaryObjectFactory', QuestionSummaryObjectFactory],
  ['RatingComputationService', RatingComputationService],
  ['RatioExpressionInputRulesService', RatioExpressionInputRulesService],
  ['RatioExpressionInputValidationService',
    RatioExpressionInputValidationService],
  ['ReadOnlyCollectionBackendApiService', ReadOnlyCollectionBackendApiService],
  ['ReadOnlyExplorationBackendApiService',
    ReadOnlyExplorationBackendApiService],
  ['ReadOnlySubtopicPageObjectFactory', ReadOnlySubtopicPageObjectFactory],
  ['ReadOnlyTopicObjectFactory', ReadOnlyTopicObjectFactory],
  ['RecordedVoiceoversObjectFactory', RecordedVoiceoversObjectFactory],
  ['RequestInterceptor', RequestInterceptor],
  ['ReviewTestBackendApiService', ReviewTestBackendApiService],
  ['ReviewTestEngineService', ReviewTestEngineService],
  ['ResponsesService', ResponsesService],
  ['RubricObjectFactory', RubricObjectFactory],
  ['RuleObjectFactory', RuleObjectFactory],
  ['SVMPredictionService', SVMPredictionService],
  ['SchemaDefaultValueService', SchemaDefaultValueService],
  ['SchemaFormSubmittedService', SchemaFormSubmittedService],
  ['SchemaUndefinedLastElementService', SchemaUndefinedLastElementService],
  ['SearchExplorationsBackendApiService', SearchExplorationsBackendApiService],
  ['SearchBackendApiService', SearchBackendApiService],
  ['SearchService', SearchService],
  ['SetInputRulesService', SetInputRulesService],
  ['SetInputValidationService', SetInputValidationService],
  ['ShortSkillSummaryObjectFactory', ShortSkillSummaryObjectFactory],
  ['SidebarStatusService', SidebarStatusService],
  ['SiteAnalyticsService', SiteAnalyticsService],
  ['SkillBackendApiService', SkillBackendApiService],
  ['SkillCreationBackendApiService', SkillCreationBackendApiService],
  ['SkillEditorStateService', SkillEditorStateService],
  ['SkillMasteryBackendApiService', SkillMasteryBackendApiService],
  ['SkillObjectFactory', SkillObjectFactory],
  ['SkillRightsBackendApiService', SkillRightsBackendApiService],
  ['SkillUpdateService', SkillUpdateService],
  ['SolutionObjectFactory', SolutionObjectFactory],
  ['SolutionValidityService', SolutionValidityService],
  ['SolutionVerificationService', SolutionVerificationService],
  ['SpeechSynthesisChunkerService', SpeechSynthesisChunkerService],
  ['StateCardObjectFactory', StateCardObjectFactory],
  ['StateClassifierMappingService', StateClassifierMappingService],
  ['StateContentService', StateContentService],
  ['StateCustomizationArgsService', StateCustomizationArgsService],
  ['StateEditorRefreshService', StateEditorRefreshService],
  ['StateEditorService', StateEditorService],
  ['StateGraphLayoutService', StateGraphLayoutService],
  ['StateHintsService', StateHintsService],
  ['StateInteractionIdService', StateInteractionIdService],
  ['StateInteractionStatsBackendApiService',
    StateInteractionStatsBackendApiService],
  ['StateInteractionStatsService', StateInteractionStatsService],
  ['StateNameService', StateNameService],
  ['StateNextContentIdIndexService', StateNextContentIdIndexService],
  ['StateObjectFactory', StateObjectFactory],
  ['StateParamChangesService', StateParamChangesService],
  ['StatePropertyService', StatePropertyService],
  ['StateRecordedVoiceoversService', StateRecordedVoiceoversService],
  ['StateSolicitAnswerDetailsService', StateSolicitAnswerDetailsService],
  ['StateSolutionService', StateSolutionService],
  ['StateTopAnswersStatsBackendApiService',
    StateTopAnswersStatsBackendApiService],
  ['StateTopAnswersStatsObjectFactory', StateTopAnswersStatsObjectFactory],
  ['StateTopAnswersStatsService', StateTopAnswersStatsService],
  ['StateWrittenTranslationsService', StateWrittenTranslationsService],
  ['StatesObjectFactory', StatesObjectFactory],
  ['StatsReportingBackendApiService', StatsReportingBackendApiService],
  ['StatsReportingService', StatsReportingService],
  ['StoryContentsObjectFactory', StoryContentsObjectFactory],
  ['StoryEditorNavigationService', StoryEditorNavigationService],
  ['StoryEditorStateService', StoryEditorStateService],
  ['StoryObjectFactory', StoryObjectFactory],
  ['StoryReferenceObjectFactory', StoryReferenceObjectFactory],
  ['StoryValidationService', StoryValidationService],
  ['StoryViewerBackendApiService', StoryViewerBackendApiService],
  ['SubtitledHtmlObjectFactory', SubtitledHtmlObjectFactory],
  ['SubtitledUnicodeObjectFactory', SubtitledUnicodeObjectFactory],
  ['SubtopicObjectFactory', SubtopicObjectFactory],
  ['SubtopicPageContentsObjectFactory', SubtopicPageContentsObjectFactory],
  ['SubtopicPageObjectFactory', SubtopicPageObjectFactory],
  ['SubtopicViewerBackendApiService', SubtopicViewerBackendApiService],
  ['SuggestionModalService', SuggestionModalService],
  ['SuggestionObjectFactory', SuggestionObjectFactory],
  ['SuggestionThreadObjectFactory', SuggestionThreadObjectFactory],
  ['SuggestionsService', SuggestionsService],
  ['TextInputPredictionService', TextInputPredictionService],
  ['TextInputRulesService', TextInputRulesService],
  ['TextInputTokenizer', TextInputTokenizer],
  ['TextInputValidationService', TextInputValidationService],
  ['ThreadDataBackendApiService', ThreadDataBackendApiService],
  ['ThreadMessageObjectFactory', ThreadMessageObjectFactory],
  ['ThreadMessageSummaryObjectFactory', ThreadMessageSummaryObjectFactory],
  ['ThreadStatusDisplayService', ThreadStatusDisplayService],
  ['TopicCreationBackendApiService', TopicCreationBackendApiService],
  ['TopicObjectFactory', TopicObjectFactory],
  ['TopicRightsBackendApiService', TopicRightsBackendApiService],
  ['TopicViewerBackendApiService', TopicViewerBackendApiService],
  ['TopicUpdateService', TopicUpdateService],
  ['TopicsAndSkillsDashboardBackendApiService',
    TopicsAndSkillsDashboardBackendApiService],
  ['TopicsAndSkillsDashboardPageService', TopicsAndSkillsDashboardPageService],
  ['TranslationLanguageService', TranslationLanguageService],
  ['TranslateService', TranslateService],
  ['TranslationsBackendApiService', TranslationsBackendApiService],
  ['TranslationTabActiveModeService', TranslationTabActiveModeService],
  ['TruncatePipe', TruncatePipe],
  ['UndoRedoService', UndoRedoService],
  ['UnitsObjectFactory', UnitsObjectFactory],
  ['UrlInterpolationService', UrlInterpolationService],
  ['UrlService', UrlService],
  ['UserBackendApiService', UserBackendApiService],
  ['UserService', UserService],
  ['UserExplorationPermissionsService', UserExplorationPermissionsService],
  ['UtilsService', UtilsService],
  ['ValidatorsService', ValidatorsService],
  ['VersionTreeService', VersionTreeService],
  ['VoiceoverObjectFactory', VoiceoverObjectFactory],
  ['WindowDimensionsService', WindowDimensionsService],
  ['WindowRef', WindowRef],
  ['WinnowingPreprocessingService', WinnowingPreprocessingService],
  ['WorkedExampleObjectFactory', WorkedExampleObjectFactory],
  ['WrittenTranslationObjectFactory', WrittenTranslationObjectFactory],
  ['WrittenTranslationsObjectFactory', WrittenTranslationsObjectFactory],
  ['baseInteractionValidationService', baseInteractionValidationService],
  ['UndoRedoService', UndoRedoService]
];
