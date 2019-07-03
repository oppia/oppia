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
 * @fileoverview Module for the Oppia pages.
 */

import { NgModule } from '@angular/core';

import { AboutPageModule } from 'pages/about-page/about-page.module.ts';
import { AdminPageModule } from 'pages/admin-page/admin-page.module.ts';
import { CreatorDashboardPageModule } from
  'pages/creator-dashboard-page/creator-dashboard-page.module.ts';
import { DonatePageModule } from 'pages/donate-page/donate-page.module.ts';
import { EmailDashboardPagesModule } from
  'pages/email-dashboard-pages/email-dashboard-pages.module.ts';
import { ErrorPageModule } from 'pages/error-pages/error-page.module.ts';
import { LearnerDashboardPageModule } from
  'pages/learner-dashboard-page/learner-dashboard-page.module.ts';
import { LibraryPageModule } from 'pages/library-page/library-page.module.ts';
import { ModeratorPageModule } from
  'pages/moderator-page/moderator-page.module.ts';
import { NotificationsDashboardPageModule } from
  'pages/notifications-dashboard-page/notifications-dashboard-page.module.ts';
import { PracticeSessionPageModule } from
  'pages/practice-session-page/practice-session-page.module.ts';
import { PreferencesPageModule } from
  'pages/preferences-page/preferences-page.module.ts';
import { ProfilePageModule } from 'pages/profile-page/profile-page.module.ts';
import { ReviewTestPageModule } from
  'pages/review-test-page/review-test-page.module.ts';
import { SignupPageModule } from 'pages/signup-page/signup-page.module.ts'
import { SkillEditorPageModule } from
  'pages/skill-editor-page/skill-editor-page.module.ts';
import { StewardsLandingPageModule } from
  'pages/landing-pages/stewards-landing-page/stewards-landing-page.module.ts';
import { TopicLandingPageModule } from
  'pages/landing-pages/topic-landing-page/topic-landing-page.module.ts';

@NgModule({
  imports: [
    AboutPageModule,
    AdminPageModule,
    CreatorDashboardPageModule,
    DonatePageModule,
    EmailDashboardPagesModule,
    ErrorPageModule,
    LearnerDashboardPageModule,
    LibraryPageModule,
    ModeratorPageModule,
    NotificationsDashboardPageModule,
    PracticeSessionPageModule,
    PreferencesPageModule,
    ProfilePageModule,
    ReviewTestPageModule,
    SignupPageModule,
    SkillEditorPageModule,
    StewardsLandingPageModule,
    TopicLandingPageModule
  ]
})
export class PagesModule {}

require('pages/about-page/about-page.module.ts');
require('pages/admin-page/admin-page.module.ts');
require('pages/creator-dashboard-page/creator-dashboard-page.module.ts');
require('pages/donate-page/donate-page.module.ts');
require('pages/email-dashboard-pages/email-dashboard-pages.module.ts');
require('pages/error-pages/error-page.module.ts');
require(
  'pages/landing-pages/stewards-landing-page/stewards-landing-page.module.ts');
require('pages/moderator-page/moderator-page.module.ts');
require('pages/landing-pages/topic-landing-page/topic-landing-page.module.ts');
require('pages/learner-dashboard-page/learner-dashboard-page.module.ts');
require('pages/landing-pages/topic-landing-page/topic-landing-page.module.ts');
require('pages/library-page/library-page.module.ts');
require('pages/practice-session-page/practice-session-page.module.ts');
require('pages/preferences-page/preferences-page.module.ts');
require('pages/profile-page/profile-page.module.ts');
require('pages/review-test-page/review-test-page.module.ts');
require('pages/signup-page/signup-page.module.ts');
require('pages/skill-editor-page/skill-editor-page.module.ts');

angular.module('pages', [
  'aboutPageModule',
  'adminPageModule',
  'creatorDashboardPageModule',
  'donatePageModule',
  'emailDashboardPagesModule',
  'errorPageModule',
  'learnerDashboardPageModule',
  'libraryPageModule',
  'moderatorPageModule',
  'notificationsDashboardPageModule',
  'practiceSessionPageModule',
  'preferencesPageModule',
  'profilePageModule',
  'reviewTestPageModule',
  'signupPageModule',
  'skillEditorPageModule',
  'stewardsLandingPageModule',
  'topicLandingPageModule'
]);
