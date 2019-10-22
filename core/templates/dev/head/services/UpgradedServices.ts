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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { EditabilityService } from 'services/EditabilityService';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { ExplorationFeaturesService } from
  'services/ExplorationFeaturesService';
import { FeedbackThreadObjectFactory } from
  'domain/feedback_thread/FeedbackThreadObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { ImprovementActionButtonObjectFactory } from
  'domain/statistics/ImprovementActionButtonObjectFactory';
import { LearnerActionObjectFactory } from
  'domain/statistics/LearnerActionObjectFactory';
import { LearnerAnswerDetailsObjectFactory } from
  'domain/statistics/LearnerAnswerDetailsObjectFactory';
import { LearnerAnswerInfoObjectFactory } from
  'domain/statistics/LearnerAnswerInfoObjectFactory';
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
import { SidebarStatusService } from 'domain/sidebar/SidebarStatusService';
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateEditorService } from
/* eslint-disable max-len */
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SuggestionModalService } from 'services/SuggestionModalService';
import { SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { ThreadStatusDisplayService } from
/* eslint-disable max-len */
  'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
/* eslint-enable max-len */
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory';
import { UtilsService } from 'services/UtilsService';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WindowDimensionsService } from './contextual/WindowDimensionsService';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  /* eslint-disable quote-props */
  upgradedServices = {
    'AngularNameService': new AngularNameService(),
    'AnswerClassificationResultObjectFactory':
      new AnswerClassificationResultObjectFactory(),
    'AnswerGroupObjectFactory':
      new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()),
    'ClassifierObjectFactory': new ClassifierObjectFactory(),
    'EditabilityService': new EditabilityService(),
    'ExplorationDraftObjectFactory': new ExplorationDraftObjectFactory(),
    'ExplorationFeaturesService': new ExplorationFeaturesService(),
    'FeedbackThreadObjectFactory': new FeedbackThreadObjectFactory(),
    'FractionObjectFactory': new FractionObjectFactory(),
    'HintObjectFactory':
      new HintObjectFactory(new SubtitledHtmlObjectFactory()),
    'ImprovementActionButtonObjectFactory':
      new ImprovementActionButtonObjectFactory(),
    'LearnerActionObjectFactory': new LearnerActionObjectFactory(),
    'LearnerAnswerDetailsObjectFactory':
      new LearnerAnswerDetailsObjectFactory(),
    'LearnerAnswerInfoObjectFactory': new LearnerAnswerInfoObjectFactory(),
    'OutcomeObjectFactory':
      new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
    'ParamChangeObjectFactory': new ParamChangeObjectFactory(),
    'ParamChangesObjectFactory':
      new ParamChangesObjectFactory(new ParamChangeObjectFactory()),
    'PlaythroughIssueObjectFactory': new PlaythroughIssueObjectFactory(),
    'PlaythroughObjectFactory':
      new PlaythroughObjectFactory(new LearnerActionObjectFactory()),
    'RecordedVoiceoversObjectFactory':
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()),
    'RuleObjectFactory': new RuleObjectFactory(),
    'SidebarStatusService':
      new SidebarStatusService(new WindowDimensionsService()),
    'SolutionValidityService': new SolutionValidityService(),
    'StateClassifierMappingService':
      new StateClassifierMappingService(new ClassifierObjectFactory()),
    'StateEditorService': new StateEditorService(new SolutionValidityService()),
    'SubtitledHtmlObjectFactory': new SubtitledHtmlObjectFactory(),
    'SuggestionModalService': new SuggestionModalService(),
    'SuggestionObjectFactory': new SuggestionObjectFactory(),
    'ThreadStatusDisplayService': new ThreadStatusDisplayService(),
    'UnitsObjectFactory': new UnitsObjectFactory(),
    'UserInfoObjectFactory': new UserInfoObjectFactory(),
    'UtilsService': new UtilsService(),
    'VoiceoverObjectFactory': new VoiceoverObjectFactory(),
    'WrittenTranslationObjectFactory': new WrittenTranslationObjectFactory(),
    'WrittenTranslationsObjectFactory':
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()),
    'WindowDimensionsService': new WindowDimensionsService(),
  };
  /* eslint-enable quote-props */
}

angular.module('oppia').factory(
  'UpgradedServices', downgradeInjectable(UpgradedServices));
