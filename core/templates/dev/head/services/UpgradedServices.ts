// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for storing all upgraded services
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AlertsService } from 'services/alerts.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { BackgroundMaskService } from
  'services/stateful/background-mask.service';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ChangesInHumanReadableFormService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/changes-in-human-readable-form.service';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { ComputeGraphService } from 'services/compute-graph.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { DebouncerService } from 'services/debouncer.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DocumentAttributeCustomizationService } from
  'services/contextual/document-attribute-customization.service';
import { EditabilityService } from 'services/editability.service';
import { EditorFirstTimeEventsService } from
  'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ExplorationDiffService } from
  'pages/exploration-editor-page/services/exploration-diff.service';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { ExtensionTagAssemblerService } from
  'services/extension-tag-assembler.service';
import { FeedbackThreadObjectFactory } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { IdGenerationService } from 'services/id-generation.service';
import { ImprovementActionButtonObjectFactory } from
  'domain/statistics/ImprovementActionButtonObjectFactory';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { LearnerAnswerDetailsObjectFactory } from
  'domain/statistics/LearnerAnswerDetailsObjectFactory';
import { LearnerAnswerInfoObjectFactory } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { MetaTagCustomizationService } from
  'services/contextual/meta-tag-customization.service';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { PlaythroughIssueObjectFactory } from
  'domain/statistics/PlaythroughIssueObjectFactory';
import { PlaythroughObjectFactory } from
  'domain/statistics/PlaythroughObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { ThreadStatusDisplayService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { UrlService } from 'services/contextual/url.service';
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { UtilsService } from 'services/utils.service';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  getUpgradedServices() {
    var upgradedServices = {};
    /* eslint-disable dot-notation */

    // Group 1: Services without dependencies.
    upgradedServices['AngularNameService'] = new AngularNameService();
    upgradedServices['AnswerClassificationResultObjectFactory'] =
      new AnswerClassificationResultObjectFactory();
    upgradedServices['BackgroundMaskService'] = new BackgroundMaskService();
    upgradedServices['CamelCaseToHyphensPipe'] = new CamelCaseToHyphensPipe();
    upgradedServices['ClassifierObjectFactory'] = new ClassifierObjectFactory();
    upgradedServices['ComputeGraphService'] = new ComputeGraphService();
    upgradedServices['CsrfTokenService'] = new CsrfTokenService();
    upgradedServices['DebouncerService'] = new DebouncerService();
    upgradedServices['EditabilityService'] = new EditabilityService();
    upgradedServices['ExplorationDiffService'] = new ExplorationDiffService();
    upgradedServices['ExplorationDraftObjectFactory'] =
      new ExplorationDraftObjectFactory();
    upgradedServices['ExplorationFeaturesService'] =
      new ExplorationFeaturesService();
    upgradedServices['FeedbackThreadObjectFactory'] =
      new FeedbackThreadObjectFactory();
    upgradedServices['FractionObjectFactory'] = new FractionObjectFactory();
    upgradedServices['GenerateContentIdService'] =
      new GenerateContentIdService();
    upgradedServices['IdGenerationService'] = new IdGenerationService();
    upgradedServices['ImprovementActionButtonObjectFactory'] =
      new ImprovementActionButtonObjectFactory();
    upgradedServices['LearnerActionObjectFactory'] =
      new LearnerActionObjectFactory();
    upgradedServices['LearnerAnswerDetailsObjectFactory'] =
      new LearnerAnswerDetailsObjectFactory();
    upgradedServices['LearnerAnswerInfoObjectFactory'] =
      new LearnerAnswerInfoObjectFactory();
    upgradedServices['LoggerService'] = new LoggerService();
    upgradedServices['ParamChangeObjectFactory'] =
      new ParamChangeObjectFactory();
    upgradedServices['PlaythroughIssueObjectFactory'] =
      new PlaythroughIssueObjectFactory();
    upgradedServices['RuleObjectFactory'] = new RuleObjectFactory();
    upgradedServices['SolutionValidityService'] = new SolutionValidityService();
    upgradedServices['SubtitledHtmlObjectFactory'] =
      new SubtitledHtmlObjectFactory();
    upgradedServices['SuggestionModalService'] = new SuggestionModalService();
    upgradedServices['SuggestionObjectFactory'] = new SuggestionObjectFactory();
    upgradedServices['ThreadStatusDisplayService'] =
      new ThreadStatusDisplayService();
    upgradedServices['UnitsObjectFactory'] = new UnitsObjectFactory();
    upgradedServices['UserInfoObjectFactory'] = new UserInfoObjectFactory();
    upgradedServices['UtilsService'] = new UtilsService();
    upgradedServices['VoiceoverObjectFactory'] = new VoiceoverObjectFactory();
    upgradedServices['WindowDimensionsService'] = new WindowDimensionsService();
    upgradedServices['WindowRef'] = new WindowRef();
    upgradedServices['WrittenTranslationObjectFactory'] =
      new WrittenTranslationObjectFactory();

    // Group 2: Services depending only on group 1.
    upgradedServices['AlertsService'] =
      new AlertsService(upgradedServices['LoggerService']);
    upgradedServices['ChangesInHumanReadableFormService'] =
      new ChangesInHumanReadableFormService(
        upgradedServices['UtilsService'], document);
    upgradedServices['DateTimeFormatService'] = new DateTimeFormatService();
    upgradedServices['DeviceInfoService'] =
      new DeviceInfoService(upgradedServices['WindowRef']);
    upgradedServices['DocumentAttributeCustomizationService'] =
      new DocumentAttributeCustomizationService(upgradedServices['WindowRef']);
    upgradedServices['HintObjectFactory'] =
      new HintObjectFactory(upgradedServices['SubtitledHtmlObjectFactory']);
    upgradedServices['HtmlEscaperService'] =
      new HtmlEscaperService(upgradedServices['LoggerService']);
    upgradedServices['MetaTagCustomizationService'] =
      new MetaTagCustomizationService(upgradedServices['WindowRef']);
    upgradedServices['NumberWithUnitsObjectFactory'] =
      new NumberWithUnitsObjectFactory(
        upgradedServices['UnitsObjectFactory'],
        upgradedServices['FractionObjectFactory']);
    upgradedServices['OutcomeObjectFactory'] =
      new OutcomeObjectFactory(upgradedServices['SubtitledHtmlObjectFactory']);
    upgradedServices['ParamChangesObjectFactory'] =
      new ParamChangesObjectFactory(
        upgradedServices['ParamChangeObjectFactory']);
    upgradedServices['PlaythroughObjectFactory'] =
      new PlaythroughObjectFactory(
        upgradedServices['LearnerActionObjectFactory']);
    upgradedServices['RecordedVoiceoversObjectFactory'] =
      new RecordedVoiceoversObjectFactory(
        upgradedServices['VoiceoverObjectFactory']);
    upgradedServices['SidebarStatusService'] =
      new SidebarStatusService(upgradedServices['WindowDimensionsService']);
    upgradedServices['SiteAnalyticsService'] =
      new SiteAnalyticsService(upgradedServices['WindowRef']);
    upgradedServices['StateClassifierMappingService'] =
      new StateClassifierMappingService(
        upgradedServices['ClassifierObjectFactory']);
    upgradedServices['StateEditorService'] =
      new StateEditorService(upgradedServices['SolutionValidityService']);
    upgradedServices['UrlService'] =
      new UrlService(upgradedServices['WindowRef']);
    upgradedServices['WrittenTranslationsObjectFactory'] =
      new WrittenTranslationsObjectFactory(
        upgradedServices['WrittenTranslationObjectFactory']);

    // Group 3: Services depending only on groups 1-2.
    upgradedServices['AnswerGroupObjectFactory'] =
      new AnswerGroupObjectFactory(
        upgradedServices['OutcomeObjectFactory'],
        upgradedServices['RuleObjectFactory']);
    upgradedServices['EditorFirstTimeEventsService'] =
      new EditorFirstTimeEventsService(
        upgradedServices['SiteAnalyticsService']);
    upgradedServices['ExtensionTagAssemblerService'] =
      new ExtensionTagAssemblerService(
        upgradedServices['HtmlEscaperService'],
        upgradedServices['CamelCaseToHyphensPipe']);

    /* eslint-enable dot-notation */
    return upgradedServices;
  }
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
