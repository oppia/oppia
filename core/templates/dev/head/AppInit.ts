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
 * @fileoverview File for initializing the main oppia module.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { StaticProvider } from '@angular/core';

import { AppConstants } from 'app.constants.ts';

import { ClassifiersExtensionConstants } from
  'classifiers/classifiers-extension.constants.ts';

import { CollectionSummaryTileConstants } from
  'components/summary-tile/collection-summary-tile.constants.ts';
import { StateEditorConstants } from
  'components/state-editor/state-editor.constants.ts';

import { CollectionDomainConstants } from
  'domain/collection/collection-domain.constants.ts';
import { EditorDomainConstants } from
  'domain/editor/editor-domain.constants.ts';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants.ts';
import { QuestionDomainConstants } from
  'domain/question/question-domain.constants.ts';
import { SkillDomainConstants } from 'domain/skill/skill-domain.constants.ts';
import { StatisticsDomainConstants } from
  'domain/statistics/statistics-domain.constants.ts';
import { StoryDomainConstants } from 'domain/story/story-domain.constants.ts';
import { StoryViewerDomainConstants } from
  'domain/story_viewer/story-viewer-domain.constants.ts';
import { TopicDomainConstants } from 'domain/topic/topic-domain.constants.ts';
import { TopicViewerDomainConstants } from
  'domain/topic_viewer/topic-viewer-domain.constants.ts';
import { TopicsAndSkillsDashboardDomainConstants } from
  ('domain/topics_and_skills_dashboard/' +
  'topics-and-skills-dashboard-domain.constants.ts');

import { InteractionsExtensionsConstants } from
  'interactions/interactions-extension.constants.ts';

import { AdminPageConstants } from 'pages/admin-page/admin-page.constants.ts';
import { CollectionEditorPageConstants } from
  'pages/collection-editor-page/collection-editor-page.constants.ts';
import { CreatorDashboardConstants } from
  'pages/creator-dashboard-page/creator-dashboard-page.constants.ts';
import { ExplorationEditorPageConstants } from
  'pages/exploration-editor-page/exploration-editor-page.constants.ts';
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants.ts';
import { LearnerDashboardPageConstants } from
  'pages/learner-dashboard-page/learner-dashboard-page.constants.ts';
import { LibraryPageConstants } from
  'pages/library-page/library-page.constants.ts';
import { PracticeSessionPageConstants } from
  'pages/practice-session-page/practice-session-page.constants.ts';
import { ReviewTestPageConstants } from
  'pages/review-test-page/review-test-page.constants.ts';
import { SkillEditorPageConstants } from
  'pages/skill-editor-page/skill-editor-page.constants.ts';
import { StoryEditorPageConstants } from
  'pages/story-editor-page/story-editor-page.constants.ts';
import { TopicEditorPageConstants } from
  'pages/topic-editor-page/topic-editor-page.constants.ts';
import { TopicLandingPageConstants } from
  'pages/landing-pages/topic-landing-page/topic-landing-page.constants.ts';
import { TopicsAndSkillsDashboardPageConstants } from
  ('pages/topics-and-skills-dashboard-page/' +
  'topics-and-skills-dashboard-page.constants.ts');

import { ServicesConstants } from 'services/services.constants.ts';

@NgModule({
  imports: [
    BrowserModule
  ],
  providers: [
    AppConstants,
    ClassifiersExtensionConstants,
    CollectionSummaryTileConstants,
    StateEditorConstants,
    CollectionDomainConstants,
    EditorDomainConstants,
    ObjectsDomainConstants,
    QuestionDomainConstants,
    SkillDomainConstants,
    StatisticsDomainConstants,
    StoryDomainConstants,
    StoryViewerDomainConstants,
    TopicDomainConstants,
    TopicViewerDomainConstants,
    TopicsAndSkillsDashboardDomainConstants,
    InteractionsExtensionsConstants,
    AdminPageConstants,
    CollectionEditorPageConstants,
    CreatorDashboardConstants,
    ExplorationEditorPageConstants,
    ExplorationPlayerConstants,
    LearnerDashboardPageConstants,
    LibraryPageConstants,
    PracticeSessionPageConstants,
    ReviewTestPageConstants,
    SkillEditorPageConstants,
    StoryEditorPageConstants,
    TopicEditorPageConstants,
    TopicLandingPageConstants,
    TopicsAndSkillsDashboardPageConstants,
    ServicesConstants
  ]
})
class MainAngularModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(MainAngularModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: any;

var oppia = angular.module(
  'oppia', [
    'dndLists', 'headroom', 'infinite-scroll', 'ngAnimate',
    'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
    'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate',
    'toastr', 'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate',
    downgradedModule
  ].concat(
  window.GLOBALS ? (window.GLOBALS.ADDITIONAL_ANGULAR_MODULES || []) : []));

exports.module = oppia;
