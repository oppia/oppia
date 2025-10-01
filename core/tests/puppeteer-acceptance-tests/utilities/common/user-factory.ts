// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility File for declaring and initializing users.
 */

import {SuperAdminFactory, SuperAdmin} from '../user/super-admin';
import {BaseUserFactory, BaseUser} from './puppeteer-utils';
import {
  TranslationAdmin,
  TranslationAdminFactory,
} from '../user/translation-admin';
import {LoggedOutUserFactory, LoggedOutUser} from '../user/logged-out-user';
import {BlogAdminFactory, BlogAdmin} from '../user/blog-admin';
import {QuestionAdminFactory} from '../user/question-admin';
import {BlogPostEditorFactory} from '../user/blog-post-editor';
import {VoiceoverAdmin, VoiceoverAdminFactory} from '../user/voiceover-admin';
import {
  ExplorationEditorFactory,
  ExplorationEditor,
} from '../user/exploration-editor';
import {
  CurriculumAdmin,
  CurriculumAdminFactory,
} from '../user/curriculum-admin';
import {
  PracticeQuestionSubmitter,
  QuestionSubmitterFactory,
} from '../user/practice-question-submitter';
import {TopicManager, TopicManagerFactory} from '../user/topic-manager';
import {LoggedInUserFactory, LoggedInUser} from '../user/logged-in-user';
import {ModeratorFactory} from '../user/moderator';
import {ReleaseCoordinatorFactory} from '../user/release-coordinator';
import testConstants, {BLOG_RIGHTS} from './test-constants';
import {showMessage} from './show-message';
import {
  TranslationSubmitter,
  TranslationSubmitterFactory,
} from '../user/translation-submitter';
import {TranslationReviewerFactory} from '../user/translation-reviewer';
import {Contributor, ContributorFactory} from '../user/contributor';
import {
  PracticeQuestionReviewer,
  PracticeQuestionReviewerFactory,
} from '../user/practice-question-reviewer';
import {
  VoiceoverSubmitter,
  VoiceoverSubmitterFactory,
} from '../user/voiceover-submitter';
import {
  ContributorAdmin,
  ContributorAdminFactory,
} from '../user/contributor-admin';
import {TranslationCoordinatorFactory} from '../user/translation-coordinator';
import {QuestionCoordinatorFactory} from '../user/practice-question-coordinator';

const ROLES = testConstants.Roles;
const cookieBannerAcceptButton =
  'button.e2e-test-oppia-cookie-banner-accept-button';

/**
 * Mapping of user roles to their respective function class.
 */
const USER_ROLE_MAPPING = {
  [ROLES.TRANSLATION_ADMIN]: TranslationAdminFactory,
  [ROLES.TRANSLATION_COORDINATOR]: TranslationCoordinatorFactory,
  [ROLES.BLOG_ADMIN]: BlogAdminFactory,
  [ROLES.BLOG_POST_EDITOR]: BlogPostEditorFactory,
  [ROLES.CURRICULUM_ADMIN]: CurriculumAdminFactory,
  [ROLES.QUESTION_ADMIN]: QuestionAdminFactory,
  [ROLES.QUESTION_COORDINATOR]: QuestionCoordinatorFactory,
  [ROLES.VOICEOVER_ADMIN]: VoiceoverAdminFactory,
  [ROLES.TOPIC_MANAGER]: TopicManagerFactory,
  [ROLES.MODERATOR]: ModeratorFactory,
  [ROLES.RELEASE_COORDINATOR]: ReleaseCoordinatorFactory,
  [ROLES.TRANSLATION_REVIEWER]: TranslationReviewerFactory,
  [ROLES.VOICEOVER_SUBMITTER]: VoiceoverSubmitterFactory,
} as const;

const USERS_ROLES_NOT_REFLECTED_IN_ADMIN_PAGE: string[] = [
  ROLES.TRANSLATION_REVIEWER,
  ROLES.VOICEOVER_SUBMITTER,
];

/**
 * These types are used to create a union of all the roles and then
 * create an intersection of all the roles. This is used to create a
 * composition of the user and the role for type inference.
 */
type UnionToIntersection<U> = (
  U extends BaseUser ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type MultipleRoleIntersection<T extends (keyof typeof USER_ROLE_MAPPING)[]> =
  UnionToIntersection<ReturnType<(typeof USER_ROLE_MAPPING)[T[number]]>>;

type OptionalRoles<TRoles extends (keyof typeof USER_ROLE_MAPPING)[]> =
  TRoles extends never[] ? [] : TRoles | [];

type BasicRolesUser = LoggedOutUser &
  LoggedInUser &
  ExplorationEditor &
  PracticeQuestionSubmitter &
  TopicManager &
  CurriculumAdmin &
  TranslationSubmitter &
  Contributor &
  ContributorAdmin &
  PracticeQuestionReviewer &
  VoiceoverSubmitter;

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance:
  | (SuperAdmin & BlogAdmin & TranslationAdmin & VoiceoverAdmin)
  | null = null;
let activeUsers: BaseUser[] = [];

export class UserFactory {
  /**
   * This function creates a composition of the user and the role
   * through object prototypes and returns the instance of that user.
   */
  private static composeUserWithRoles = function <
    TUser extends BaseUser,
    TRoles extends BaseUser[],
  >(user: TUser, roles: TRoles): TUser & UnionToIntersection<TRoles[number]> {
    for (const role of roles) {
      const userPrototype = Object.getPrototypeOf(user);
      const rolePrototype = Object.getPrototypeOf(role);

      Object.getOwnPropertyNames(rolePrototype).forEach((name: string) => {
        Object.defineProperty(
          userPrototype,
          name,
          Object.getOwnPropertyDescriptor(rolePrototype, name) ||
            Object.create(null)
        );
      });
    }

    return user as TUser & UnionToIntersection<TRoles[number]>;
  };

  /**
   * This function assigns roles to a user and returns the instance of
   * that user.
   * @param {TUser} user - The user to assign roles to.
   * @param {TRoles} roles - The roles to assign to the user.
   * @param {string | string[]} args - The arguments to pass to the role
   *     assignment function. For Topic Manager, it should be the topic
   *     name (as string). For Translation Coordinator, it should be the
   *     array of language code (as string[]). For Voiceover Submitter,
   *     it should be the exploration ID (as string).
   * @returns {TUser & MultipleRoleIntersection<TRoles>} - The user with
   *     the roles assigned.
   */
  static assignRolesToUser = async function <
    TUser extends BaseUser,
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[],
  >(
    user: TUser,
    roles: TRoles,
    args?: string | string[]
  ): Promise<TUser & MultipleRoleIntersection<TRoles>> {
    for (const role of roles) {
      if (superAdminInstance === null) {
        superAdminInstance = await UserFactory.createNewSuperAdmin('superAdm');
      }

      if (!user.username) {
        throw new Error('Username is null while adding roles');
      }

      switch (role) {
        case ROLES.BLOG_POST_EDITOR:
          await superAdminInstance.navigateToBlogAdminPage();
          await superAdminInstance.assignUserToRoleFromBlogAdminPage(
            user.username,
            BLOG_RIGHTS.BLOG_POST_EDITOR
          );
          break;
        case ROLES.TOPIC_MANAGER:
          if (typeof args !== 'string') {
            throw new Error('Expected additional argument to be string.');
          }
          await superAdminInstance.assignRoleToUser(
            user.username,
            ROLES.TOPIC_MANAGER,
            args as string
          );
          break;
        case ROLES.TRANSLATION_COORDINATOR:
          await superAdminInstance.assignRoleToUser(
            user.username,
            ROLES.TRANSLATION_COORDINATOR,
            args
          );
          break;
        case ROLES.TRANSLATION_REVIEWER:
          await superAdminInstance.navigateToContributorDashboardAdminPage();
          if (typeof args === 'string') {
            args = [args];
          }
          for (const language of args as string[]) {
            await superAdminInstance.addTranslationLanguageReviewRights(
              user.username,
              language
            );
          }
          break;
        case ROLES.VOICEOVER_SUBMITTER:
          if (typeof args !== 'string') {
            throw new Error(
              'Exploration ID is required to assign a voiceover submitter.'
            );
          }
          await superAdminInstance.addVoiceoverArtistToExplorationWithID(
            args as string,
            user.username
          );
          break;
        default:
          await superAdminInstance.assignRoleToUser(user.username, role);
          break;
      }

      if (!USERS_ROLES_NOT_REFLECTED_IN_ADMIN_PAGE.includes(role)) {
        await superAdminInstance.expectUserToHaveRole(user.username, role);
      }
      UserFactory.composeUserWithRoles(user, [USER_ROLE_MAPPING[role]()]);
    }

    return user as TUser & MultipleRoleIntersection<typeof roles>;
  };

  static enableVoiceoverAutogenerationUsingCloudService =
    async function (): Promise<void> {
      if (superAdminInstance === null) {
        superAdminInstance = await UserFactory.createNewSuperAdmin('superAdm');
      }
      await superAdminInstance.enableTextToSpeechSynthesisUsingCloudService();
      showMessage('Enabled text to speech synthesis using cloud service.');
    };

  /**
   * This function creates a new user with the specified roles and returns
   * the instance of that user.
   * @param {string} username - The username of the user.
   * @param {string} email - The email of the user.
   * @param {OptionalRoles<TRoles>} roles - The roles to assign to the user.
   * @param {string | string[]} args - The arguments to pass to the role
   *     assignment function. For Topic Manager, it should be the topic
   *     name. For Translation Coordinator, it should be the array of
   *     language code.
   * @returns {Promise<
   *     LoggedOutUser &
   *       LoggedInUser &
   *       ExplorationEditor &
   *       QuestionSubmitter &
   *       TopicManager &
   *       CurriculumAdmin &
   *       ContributorAdmin &
   *       MultipleRoleIntersection<TRoles>
   *   >} - The user with the roles assigned.
   */
  static createNewUser = async function <
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[] = never[],
  >(
    username: string,
    email: string,
    roles: OptionalRoles<TRoles> = [] as OptionalRoles<TRoles>,
    args?: string | string[]
  ): Promise<BasicRolesUser & MultipleRoleIntersection<TRoles>> {
    let user = UserFactory.composeUserWithRoles(BaseUserFactory(), [
      LoggedOutUserFactory(),
      LoggedInUserFactory(),
      ExplorationEditorFactory(),
      QuestionSubmitterFactory(),
      TopicManagerFactory(),
      CurriculumAdminFactory(),
      TranslationSubmitterFactory(),
      ContributorFactory(),
      ContributorAdminFactory(),
      PracticeQuestionReviewerFactory(),
      VoiceoverSubmitterFactory(),
    ]);

    user.username = username;
    user.email = email;

    await user.openBrowser();
    await user.signUpNewUser(username, email);
    activeUsers.push(user);

    return (await UserFactory.assignRolesToUser(
      user,
      roles,
      args
    )) as BasicRolesUser & MultipleRoleIntersection<TRoles>;
  };

  /**
   * The function creates a new super admin user and returns the instance
   * of that user.
   */
  static createNewSuperAdmin = async function (
    username: string
  ): Promise<SuperAdmin & BlogAdmin & TranslationAdmin & VoiceoverAdmin> {
    if (superAdminInstance !== null) {
      return superAdminInstance;
    }

    const user = await UserFactory.createNewUser(
      username,
      'testadmin@example.com'
    );
    const superAdmin = UserFactory.composeUserWithRoles(user, [
      SuperAdminFactory(),
    ]);
    await superAdmin.assignRoleToUser(username, ROLES.BLOG_ADMIN);
    await superAdmin.expectUserToHaveRole(username, ROLES.BLOG_ADMIN);
    await superAdmin.assignRoleToUser(username, ROLES.TRANSLATION_ADMIN);
    await superAdmin.expectUserToHaveRole(username, ROLES.TRANSLATION_ADMIN);
    await superAdmin.assignRoleToUser(username, ROLES.VOICEOVER_ADMIN);
    await superAdmin.expectUserToHaveRole(username, ROLES.VOICEOVER_ADMIN);
    superAdminInstance = UserFactory.composeUserWithRoles(superAdmin, [
      BlogAdminFactory(),
      TranslationAdminFactory(),
      VoiceoverAdminFactory(),
    ]);

    return superAdminInstance;
  };

  /**
   * This function creates a new instance of a LoggedOutUser, opens a browser for that user,
   * navigates to the home page, adds the user to the activeUsers array, and returns the user.
   */
  static createLoggedOutUser = async function (): Promise<LoggedOutUser> {
    let user = new LoggedOutUser();
    await user.openBrowser();
    await user.page.goto(testConstants.URLs.Home);
    await user.waitForPageToFullyLoad();
    await user.clickOn(cookieBannerAcceptButton);
    activeUsers.push(user);
    return user;
  };
  /**
   * This function closes all the browsers opened by different users.
   */
  static closeAllBrowsers = async function (): Promise<void> {
    showMessage(`Closing browsers for ${activeUsers.length} users.`);
    await Promise.all(
      activeUsers.map(async user => {
        await user.closeBrowser();
      })
    );

    showMessage('All browsers closed.');
  };

  /**
   * This function closes the browser for the provided user.
   */
  static closeBrowserForUser = async function (user: BaseUser): Promise<void> {
    const index = activeUsers.indexOf(user);
    activeUsers.splice(index, 1);
    await user.closeBrowser();
  };
}
