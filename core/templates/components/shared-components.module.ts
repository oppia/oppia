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
 * @fileoverview Module for the shared components.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AlertMessageDirective } from
  './common-layout-directives/common-elements/alert-message.directive';
import { AnswerGroupEditorDirective } from
  './state-directives/answer-group-editor/answer-group-editor.directive';
import { ApplyValidationDirective } from
  './forms/custom-forms-directives/apply-validation.directive';
import { AttributionGuideDirective } from
  './common-layout-directives/common-elements/attribution-guide.directive';
import { AudioFileUploaderDirective } from
  './forms/custom-forms-directives/audio-file-uploader.directive';
import { BackgroundBannerDirective } from
  './common-layout-directives/common-elements/background-banner.directive';
import { CircularImageDirective } from
  './profile-link-directives/circular-image.directive';
import { CkEditor4RteDirective } from
  './ck-editor-helpers/ck-editor-4-rte.directive';
import { CodemirrorMergeviewDirective } from
  './version-diff-visualization/codemirror-mergeview.directive';
import { CollectionSummaryTileDirective }
  from './summary-tile/collection-summary-tile.directive';
import { ConceptCardDirective } from './concept-card/concept-card.directive';
import { CreateActivityButtonDirective } from
  './button-directives/create-activity-button.directive';
import { ExplorationSummaryTileDirective } from
  './summary-tile/exploration-summary-tile.directive';
import { HintAndSolutionButtonsDirective } from
  './button-directives/hint-and-solution-buttons.directive';
import { HintEditorDirective } from
  './state-directives/hint-editor/hint-editor.directive';
import { HtmlSelectDirective } from
  './forms/custom-forms-directives/html-select.directive';
import { ImageUploaderDirective } from
  './forms/custom-forms-directives/image-uploader.directive';
import { LazyLoadingDirective } from
  './common-layout-directives/common-elements/lazy-loading.directive';
import { LoadingDotsDirective } from
  './common-layout-directives/common-elements/loading-dots.directive';
import { ObjectEditorDirective } from
  './forms/custom-forms-directives/object-editor.directive';
import { OutcomeDestinationEditorDirective } from
  './state-directives/outcome-editor/outcome-destination-editor.directive';
import { OutcomeEditorDirective } from
  './state-directives/outcome-editor/outcome-editor.directive';
import { OutcomeFeedbackEditorDirective } from
  './state-directives/outcome-editor/outcome-feedback-editor.directive';
import { ProfileLinkImageDirective } from
  './profile-link-directives/profile-link-image.directive';
import { ProfileLinkTextDirective } from
  './profile-link-directives/profile-link-text.directive';
import { PromoBarDirective } from
  './common-layout-directives/common-elements/promo-bar.directive';
import { QuestionDifficultySelectorDirective } from
  './question-difficulty-selector/question-difficulty-selector.directive';
import { QuestionEditorDirective } from
  './question-directives/question-editor/question-editor.directive';
import { QuestionPlayerDirective } from
  './question-directives/question-player/question-player.directive';
import { QuestionsListDirective } from
  './question-directives/questions-list/questions-list.directive';
import { RatingDisplayDirective } from
  './ratings/rating-display/rating-display.directive';
import { RequireIsFloatDirective } from
  './forms/custom-forms-directives/require-is-float.directive';
import { ResponseHeaderDirective } from
  './state-directives/response-header/response-header.directive';
import { ReviewMaterialEditorDirective } from
  './review-material-editor/review-material-editor.directive';
import { RubricsEditorDirective } from
  './rubrics-editor/rubrics-editor.directive';
import { RuleEditorDirective } from
  './state-directives/rule-editor/rule-editor.directive';
import { RuleTypeSelectorDirective } from
  './state-directives/rule-editor/rule-type-selector.directive';
import { SchemaBasedBoolEditorDirective } from
  './forms/schema-based-editors/schema-based-bool-editor.directive';
import { SchemaBasedChoicesEditorDirective } from
  './forms/schema-based-editors/schema-based-choices-editor.directive';
import { SchemaBasedCustomEditorDirective } from
  './forms/schema-based-editors/schema-based-custom-editor.directive';
import { SchemaBasedCustomViewerDirective } from
  './forms/schema-viewers/schema-based-custom-viewer.directive';
import { SchemaBasedDictEditorDirective } from
  './forms/schema-based-editors/schema-based-dict-editor.directive';
import { SchemaBasedDictViewerDirective } from
  './forms/schema-viewers/schema-based-dict-viewer.directive';
import { SchemaBasedEditorDirective } from
  './forms/schema-based-editors/schema-based-editor.directive';
import { SchemaBasedExpressionEditorDirective } from
  './forms/schema-based-editors/schema-based-expression-editor.directive';
import { SchemaBasedFloatEditorDirective } from
  './forms/schema-based-editors/schema-based-float-editor.directive';
import { SchemaBasedHtmlEditorDirective } from
  './forms/schema-based-editors/schema-based-html-editor.directive';
import { SchemaBasedHtmlViewerDirective } from
  './forms/schema-viewers/schema-based-html-viewer.directive';
import { SchemaBasedIntEditorDirective } from
  './forms/schema-based-editors/schema-based-int-editor.directive';
import { SchemaBasedListEditorDirective } from
  './forms/schema-based-editors/schema-based-list-editor.directive';
import { SchemaBasedListViewerDirective } from
  './forms/schema-viewers/schema-based-list-viewer.directive';
import { SchemaBasedPrimitiveViewerDirective } from
  './forms/schema-viewers/schema-based-primitive-viewer.directive';
import { SchemaBasedUnicodeEditorDirective } from
  './forms/schema-based-editors/schema-based-unicode-editor.directive';
import { SchemaBasedUnicodeViewerDirective } from
  './forms/schema-viewers/schema-based-unicode-viewer.directive';
import { SchemaBasedViewerDirective } from
  './forms/schema-viewers/schema-based-viewer.directive';
import { ScoreRingDirective } from './score-ring/score-ring.directive';
import { Select2DropdownDirective } from
  './forms/custom-forms-directives/select2-dropdown.directive';
import { SelectSkillDirective } from
  './skill-selector/skill-selector.directive';
import { SharingLinksDirective } from
  './common-layout-directives/common-elements/sharing-links.directive';
import { SideNavigationBarDirective } from
  './common-layout-directives/navigation-bars/side-navigation-bar.directive';
import { SkillMasteryViewerDirective } from
  './skill-mastery/skill-mastery.directive';
import { SkillsMasteryListDirective } from
  './skills-mastery-list/skills-mastery-list.directive';
import { SocialButtonsDirective } from
  './button-directives/social-buttons.directive';
import { SolutionEditorDirective } from
  './state-directives/solution-editor/solution-editor.directive';
import { SolutionExplanationEditorDirective } from
  './state-directives/solution-editor/solution-explanation-editor.directive';
import { StateContentEditorDirective } from
  './state-editor/state-content-editor/state-content-editor.directive';
import { StateEditorDirective } from
  './state-editor/state-editor.directive';
import { StateHintsEditorDirective } from
  './state-editor/state-hints-editor/state-hints-editor.directive';
import { StateInteractionEditorDirective } from
  './state-editor/state-interaction-editor/state-interaction-editor.directive';
import { StateResponsesDirective } from
  './state-editor/state-responses-editor/state-responses.directive';
import { StateSolutionEditorDirective } from
  './state-editor/state-solution-editor/state-solution-editor.directive';
import { StorySummaryTileDirective } from
  './summary-tile/story-summary-tile.directive';
import { SubtopicSummaryTileDirective } from
  './summary-tile/subtopic-summary-tile.directive';
import { SummaryListHeaderDirective } from
  './state-directives/answer-group-editor/summary-list-header.directive';
import { ThumbnailUploaderDirective } from
  './forms/custom-forms-directives/thumbnail-uploader.directive';
import { TopNavigationBarDirective } from
  './common-layout-directives/navigation-bars/top-navigation-bar.directive';
import { TopicSummaryTileDirective } from
  './summary-tile/topic-summary-tile.directive';
import { VersionDiffVisualizationDirective } from
  './version-diff-visualization/version-diff-visualization.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [AlertMessageDirective, AnswerGroupEditorDirective,
    ApplyValidationDirective, AttributionGuideDirective,
    AudioFileUploaderDirective, BackgroundBannerDirective,
    CircularImageDirective, CkEditor4RteDirective, CodemirrorMergeviewDirective,
    CollectionSummaryTileDirective, ConceptCardDirective,
    CreateActivityButtonDirective, ExplorationSummaryTileDirective,
    HintAndSolutionButtonsDirective, HintEditorDirective, HtmlSelectDirective,
    ImageUploaderDirective, LazyLoadingDirective, LoadingDotsDirective,
    ObjectEditorDirective, OutcomeDestinationEditorDirective,
    OutcomeEditorDirective, OutcomeFeedbackEditorDirective,
    ProfileLinkImageDirective, ProfileLinkTextDirective, PromoBarDirective,
    QuestionDifficultySelectorDirective, QuestionEditorDirective,
    QuestionPlayerDirective, QuestionsListDirective, RatingDisplayDirective,
    RequireIsFloatDirective, ResponseHeaderDirective,
    ReviewMaterialEditorDirective, RubricsEditorDirective, RuleEditorDirective,
    RuleTypeSelectorDirective, SchemaBasedBoolEditorDirective,
    SchemaBasedChoicesEditorDirective, SchemaBasedCustomEditorDirective,
    SchemaBasedCustomViewerDirective, SchemaBasedDictEditorDirective,
    SchemaBasedDictViewerDirective, SchemaBasedEditorDirective,
    SchemaBasedExpressionEditorDirective, SchemaBasedFloatEditorDirective,
    SchemaBasedHtmlEditorDirective, SchemaBasedHtmlViewerDirective,
    SchemaBasedIntEditorDirective, SchemaBasedListEditorDirective,
    SchemaBasedListViewerDirective, SchemaBasedPrimitiveViewerDirective,
    SchemaBasedUnicodeEditorDirective, SchemaBasedUnicodeViewerDirective,
    SchemaBasedViewerDirective, ScoreRingDirective, Select2DropdownDirective,
    SelectSkillDirective, SharingLinksDirective, SideNavigationBarDirective,
    SkillMasteryViewerDirective, SkillsMasteryListDirective,
    SocialButtonsDirective, SolutionEditorDirective,
    SolutionExplanationEditorDirective, StateContentEditorDirective,
    StateEditorDirective, StateHintsEditorDirective,
    StateInteractionEditorDirective, StateResponsesDirective,
    StateSolutionEditorDirective, StorySummaryTileDirective,
    SubtopicSummaryTileDirective, SummaryListHeaderDirective,
    ThumbnailUploaderDirective, TopNavigationBarDirective,
    TopicSummaryTileDirective, VersionDiffVisualizationDirective],
  exports: [AlertMessageDirective, AnswerGroupEditorDirective,
    ApplyValidationDirective, AttributionGuideDirective,
    AudioFileUploaderDirective, BackgroundBannerDirective,
    CircularImageDirective, CkEditor4RteDirective, CodemirrorMergeviewDirective,
    CollectionSummaryTileDirective, ConceptCardDirective,
    CreateActivityButtonDirective, ExplorationSummaryTileDirective,
    HintAndSolutionButtonsDirective, HintEditorDirective, HtmlSelectDirective,
    ImageUploaderDirective, LazyLoadingDirective, LoadingDotsDirective,
    ObjectEditorDirective, OutcomeDestinationEditorDirective,
    OutcomeEditorDirective, OutcomeFeedbackEditorDirective,
    ProfileLinkImageDirective, ProfileLinkTextDirective, PromoBarDirective,
    QuestionDifficultySelectorDirective, QuestionEditorDirective,
    QuestionPlayerDirective, QuestionsListDirective, RatingDisplayDirective,
    RequireIsFloatDirective, ResponseHeaderDirective,
    ReviewMaterialEditorDirective, RubricsEditorDirective, RuleEditorDirective,
    RuleTypeSelectorDirective, SchemaBasedBoolEditorDirective,
    SchemaBasedChoicesEditorDirective, SchemaBasedCustomEditorDirective,
    SchemaBasedCustomViewerDirective, SchemaBasedDictEditorDirective,
    SchemaBasedDictViewerDirective, SchemaBasedEditorDirective,
    SchemaBasedExpressionEditorDirective, SchemaBasedFloatEditorDirective,
    SchemaBasedHtmlEditorDirective, SchemaBasedHtmlViewerDirective,
    SchemaBasedIntEditorDirective, SchemaBasedListEditorDirective,
    SchemaBasedListViewerDirective, SchemaBasedPrimitiveViewerDirective,
    SchemaBasedUnicodeEditorDirective, SchemaBasedUnicodeViewerDirective,
    SchemaBasedViewerDirective, ScoreRingDirective, Select2DropdownDirective,
    SelectSkillDirective, SharingLinksDirective, SideNavigationBarDirective,
    SkillMasteryViewerDirective, SkillsMasteryListDirective,
    SocialButtonsDirective, SolutionEditorDirective,
    SolutionExplanationEditorDirective, StateContentEditorDirective,
    StateEditorDirective, StateHintsEditorDirective,
    StateInteractionEditorDirective, StateResponsesDirective,
    StateSolutionEditorDirective, StorySummaryTileDirective,
    SubtopicSummaryTileDirective, SummaryListHeaderDirective,
    ThumbnailUploaderDirective, TopNavigationBarDirective,
    TopicSummaryTileDirective, VersionDiffVisualizationDirective]
})
export class SharedComponentsModule { }
