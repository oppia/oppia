// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Root routing module.
 */

import {APP_BASE_HREF} from '@angular/common';
import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {AppConstants} from 'app.constants';
import {IsLoggedInGuard} from 'pages/lightweight-oppia-root/routing/guards/is-logged-in.guard';
import {IsNewLessonPlayerGuard} from 'pages/exploration-player-page/new-lesson-player/lesson-player-flag.guard';

// All paths must be defined in constants.ts file.
// Otherwise pages will have false 404 status code.
const routes: Route[] = [
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.MAINTENANCE.ROUTE,
    loadChildren: () =>
      import('pages/maintenance-page/maintenance-page.module').then(
        m => m.MaintenancePageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.SUBTOPIC_VIEWER.ROUTE,
    loadChildren: () =>
      import('pages/subtopic-viewer-page/subtopic-viewer-page.module').then(
        m => m.SubtopicViewerPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ADMIN.ROUTE,
    loadChildren: () =>
      import('pages/admin-page/admin-page.module').then(m => m.AdminPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.COLLECTION_EDITOR.ROUTE,
    loadChildren: () =>
      import('pages/collection-editor-page/collection-editor-page.module').then(
        m => m.CollectionEditorPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.EXPLORATION_EDITOR.ROUTE,
    loadChildren: () =>
      import(
        'pages/exploration-editor-page/exploration-editor-page.module'
      ).then(m => m.ExplorationEditorPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.STORY_EDITOR.ROUTE,
    loadChildren: () =>
      import('pages/story-editor-page/story-editor-page.module').then(
        m => m.StoryEditorPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CONTRIBUTOR_DASHBOARD
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/contributor-dashboard-page/contributor-dashboard-page.module'
      ).then(m => m.ContributorDashboardPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.MODERATOR.ROUTE,
    loadChildren: () =>
      import('pages/moderator-page/moderator-page.module').then(
        m => m.ModeratorPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_DASHBOARD.ROUTE,
    loadChildren: () =>
      import('pages/blog-dashboard-page/blog-dashboard-page.module').then(
        m => m.BlogDashboardPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_ADMIN.ROUTE,
    loadChildren: () =>
      import('pages/blog-admin-page/blog-admin-page.module').then(
        m => m.BlogAdminPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CREATOR_DASHBOARD.ROUTE,
    loadChildren: () =>
      import('pages/creator-dashboard-page/creator-dashboard-page.module').then(
        m => m.CreatorDashboardPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TOPIC_VIEWER.ROUTE,
    loadChildren: () =>
      import('pages/topic-viewer-page/topic-viewer-page.module').then(
        m => m.TopicViewerPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PRACTICE_SESSION.ROUTE,
    loadChildren: () =>
      import('pages/practice-session-page/practice-session-page.module').then(
        m => m.PracticeSessionPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.EMAIL_DASHBOARD.ROUTE,
    loadChildren: () =>
      import('pages/email-dashboard-pages/email-dashboard-page.module').then(
        m => m.EmailDashboardPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DIAGNOSTIC_TEST_PLAYER
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/diagnostic-test-player-page/diagnostic-test-player-page.module'
      ).then(m => m.DiagnosticTestPlayerPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CLASSROOM.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/classroom-page/classroom-page.module').then(
        m => m.ClassroomPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TOPIC_EDITOR.ROUTE,
    loadChildren: () =>
      import('pages/topic-editor-page/topic-editor-page.module').then(
        m => m.TopicEditorPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CLASSROOMS.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/classrooms-page/classrooms-page.module').then(
        m => m.ClassroomsPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CURRICULUM_ADMIN.ROUTE,
    loadChildren: () =>
      import('pages/classroom-admin-page/classroom-admin-page.module').then(
        m => m.ClassroomAdminPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_DASHBOARD.ROUTE,
    loadChildren: () =>
      import('pages/learner-dashboard-page/learner-dashboard-page.module').then(
        m => m.LearnerDashboardPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_GROUP_EDITOR
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/learner-group-pages/edit-group/edit-learner-group-page.module'
      ).then(m => m.EditLearnerGroupPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.FACILITATOR_DASHBOARD
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/facilitator-dashboard-page/facilitator-dashboard-page.module'
      ).then(m => m.FacilitatorDashboardPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_GROUP_CREATOR
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/learner-group-pages/create-group/create-learner-group-page.module'
      ).then(m => m.CreateLearnerGroupPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ABOUT.ROUTE,
    loadChildren: () =>
      import('pages/about-page/about-page.module').then(m => m.AboutPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND
      .CONTRIBUTOR_DASHBOARD_ADMIN.ROUTE,
    loadChildren: () =>
      import(
        'pages/contributor-dashboard-admin-page' +
          '/contributor-dashboard-admin-page.module'
      ).then(m => m.ContributorDashboardAdminPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.EXPLORATION_PLAYER.ROUTE,
    loadChildren: () =>
      import(
        'pages/exploration-player-page/exploration-player-page.module'
      ).then(m => m.ExplorationPlayerPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.EXPLORATION_PLAYER_EMBED
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/exploration-player-page/exploration-player-page.module'
      ).then(m => m.ExplorationPlayerPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.NEW_LESSON_PLAYER.ROUTE,
    loadChildren: () =>
      import(
        'pages/exploration-player-page/new-lesson-player' +
          '/lesson-player-page.module'
      ).then(m => m.NewLessonPlayerPageModule),
    canActivate: [IsNewLessonPlayerGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ANDROID.ROUTE,
    loadChildren: () =>
      import('pages/android-page/android-page.module').then(
        m => m.AndroidPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DELETE_ACCOUNT.ROUTE,
    pathMatch: 'full',
    canActivate: [IsLoggedInGuard],
    loadChildren: () =>
      import('pages/delete-account-page/delete-account-page.module').then(
        m => m.DeleteAccountPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PENDING_ACCOUNT_DELETION
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/pending-account-deletion-page/' +
          'pending-account-deletion-page.module'
      ).then(m => m.PendingAccountDeletionPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PREFERENCES.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/preferences-page/preferences-page.module').then(
        m => m.PreferencesPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.FEEDBACK_UPDATES.ROUTE,
    pathMatch: 'full',
    canActivate: [IsLoggedInGuard],
    loadChildren: () =>
      import('pages/feedback-updates-page/feedback-updates-page.module').then(
        m => m.FeedbackUpdatesPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PROFILE.ROUTE,
    loadChildren: () =>
      import('pages/profile-page/profile-page.module').then(
        m => m.ProfilePageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.RELEASE_COORDINATOR_PAGE
      .ROUTE,
    loadChildren: () =>
      import(
        'pages/release-coordinator-page/release-coordinator-page.module'
      ).then(m => m.ReleaseCoordinatorPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_INDEX.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/library-page/library-page.module').then(
        m => m.LibraryPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_SEARCH.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/library-page/library-page.module').then(
        m => m.LibraryPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_RECENTLY_PUBLISHED
      .ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/library-page/library-page.module').then(
        m => m.LibraryPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LIBRARY_TOP_RATED.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/library-page/library-page.module').then(
        m => m.LibraryPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.STORY_VIEWER.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/story-viewer-page/story-viewer-page.module').then(
        m => m.StoryViewerPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.CONTACT.ROUTE,
    loadChildren: () =>
      import('pages/contact-page/contact-page.module').then(
        m => m.ContactPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.DONATE.ROUTE,
    loadChildren: () =>
      import('pages/donate-page/donate-page.module').then(
        m => m.DonatePageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.GET_STARTED.ROUTE,
    loadChildren: () =>
      import('pages/get-started-page/get-started-page.module').then(
        m => m.GetStartedPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LICENSE.ROUTE,
    loadChildren: () =>
      import('pages/license-page/license.module').then(
        m => m.LicensePageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGIN.ROUTE,
    loadChildren: () =>
      import('pages/login-page/login-page.module').then(m => m.LoginPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGOUT.ROUTE,
    loadChildren: () =>
      import('pages/logout-page/logout-page.module').then(
        m => m.LogoutPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PARTNERSHIPS.ROUTE,
    loadChildren: () =>
      import('pages/partnerships-page/partnerships-page.module').then(
        m => m.PartnershipsPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PLAYBOOK.ROUTE,
    loadChildren: () =>
      import('pages/participation-playbook/playbook.module').then(
        m => m.PlaybookPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PRIVACY.ROUTE,
    loadChildren: () =>
      import('pages/privacy-page/privacy-page.module').then(
        m => m.PrivacyPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.SIGNUP.ROUTE,
    loadChildren: () =>
      import('pages/signup-page/signup-page.module').then(
        m => m.SignupPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TEACH.ROUTE,
    loadChildren: () =>
      import('pages/teach-page/teach-page.module').then(m => m.TeachPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.TERMS.ROUTE,
    loadChildren: () =>
      import('pages/terms-page/terms-page.module').then(m => m.TermsPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.THANKS.ROUTE,
    loadChildren: () =>
      import('pages/thanks-page/thanks-page.module').then(
        m => m.ThanksPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.VOLUNTEER.ROUTE,
    loadChildren: () =>
      import('pages/volunteer-page/volunteer-page.module').then(
        m => m.VolunteerPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_GROUP_VIEWER
      .ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import(
        'pages/learner-group-pages/view-group/view-learner-group-page.module'
      ).then(m => m.ViewLearnerGroupPageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_HOMEPAGE.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/blog-home-page/blog-home-page.module').then(
        m => m.BlogHomePageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_HOMEPAGE_SEARCH
      .ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/blog-home-page/blog-home-page.module').then(
        m => m.BlogHomePageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_AUTHOR_PROFILE_PAGE
      .ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import(
        'pages/blog-author-profile-page/blog-author-profile-page.module'
      ).then(m => m.BlogAuthorProfilePageModule),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_POST_PAGE.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/blog-post-page/blog-post-page.module').then(
        m => m.BlogPostPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND
      .TOPICS_AND_SKILLS_DASHBOARD.ROUTE,
    loadChildren: () =>
      import(
        // eslint-disable-next-line max-len
        'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module'
      ).then(m => m.TopicsAndSkillsDashboardPageModule),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.VOICEOVER_ADMIN.ROUTE,
    loadChildren: () =>
      import('pages/voiceover-admin-page/voiceover-admin-page.module').then(
        m => m.VoiceoverAdminPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.COLLECTION_PLAYER.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/collection-player-page/collection-player-page.module').then(
        m => m.CollectionPlayerPageModule
      ),
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.SKILL_EDITOR.ROUTE,
    loadChildren: () =>
      import('pages/skill-editor-page/skill-editor-page.module').then(
        m => m.SkillEditorPageModule
      ),
    canActivate: [IsLoggedInGuard],
  },
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.REVIEW_TEST.ROUTE,
    pathMatch: 'full',
    loadChildren: () =>
      import('pages/review-test-page/review-test-page.module').then(
        m => m.ReviewTestPageModule
      ),
  },
];

// Register stewards landing pages.
for (let i = 0; i < AppConstants.STEWARDS_LANDING_PAGE.ROUTES.length; i++) {
  // Redirect old stewards landing pages to volunteer page.
  routes.push({
    path: AppConstants.STEWARDS_LANDING_PAGE.ROUTES[i],
    loadChildren: () =>
      import('pages/volunteer-page/volunteer-page.module').then(
        m => m.VolunteerPageModule
      ),
  });
}

// Register all routes for topic landing page.
for (let key in AppConstants.AVAILABLE_LANDING_PAGES) {
  for (let i = 0; i < AppConstants.AVAILABLE_LANDING_PAGES[key].length; i++) {
    routes.push({
      path: key + '/' + AppConstants.AVAILABLE_LANDING_PAGES[key][i],
      loadChildren: () =>
        import(
          'pages/landing-pages/topic-landing-page/topic-landing-page.module'
        ).then(m => m.TopicLandingPageModule),
    });
  }
}

// Error routes.
routes.push(
  {
    path: AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR_IFRAMED.ROUTE,
    loadChildren: () =>
      import(
        'pages/error-pages/error-iframed-page/error-iframed-page.module'
      ).then(m => m.ErrorIframedPageModule),
  },
  // Route to register all the custom error pages on oppia.
  {
    path: `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/:status_code`,
    loadChildren: () =>
      import('pages/error-pages/error-page.module').then(
        m => m.ErrorPageModule
      ),
  },
  // '**' wildcard route must be kept at the end,as it can override all other
  // routes.
  // Add error page for not found routes.
  {
    path: '**',
    loadChildren: () =>
      import('pages/error-pages/error-page.module').then(
        m => m.ErrorPageModule
      ),
  }
);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/',
    },
  ],
})
export class AppRoutingModule {}
