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

import { CreatorDashboardConstants } from 'pages/creator-dashboard-page/creator-dashboard-page.constants.ts';
import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants.ts';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants.ts';

import { ClassifiersExtensionConstants } from 'classifiers/classifiers-extension.constants.ts';

import { SkillDomainConstants } from 'domain/skill/skill-domain.constants.ts';
import { StoryDomainConstants } from 'domain/story/story-domain.constants.ts';
import { TopicDomainConstants } from 'domain/topic/topic-domain.constants.ts';

import { ServicesConstants } from 'services/services.constants.ts';

@NgModule({
  imports: [
    BrowserModule
  ],
  providers: [
    AppConstants,
    CreatorDashboardConstants,
    ExplorationPlayerConstants,
    ServicesConstants,
    ClassifiersExtensionConstants,
    SkillDomainConstants,
    StoryDomainConstants,
    TopicDomainConstants,
    InteractionSpecsConstants
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

exports.moduleName = oppia;
