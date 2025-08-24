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
import {TranslationAdminFactory} from '../user/translation-admin';
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
  QuestionSubmitter,
  QuestionSubmitterFactory,
} from '../user/question-submitter';
import {TopicManager, TopicManagerFactory} from '../user/topic-manager';
import {LoggedInUserFactory, LoggedInUser} from '../user/logged-in-user';
import {ModeratorFactory} from '../user/moderator';
import {ReleaseCoordinatorFactory} from '../user/release-coordinator';
import testConstants, {BLOG_RIGHTS} from './test-constants';
import {showMessage} from './show-message';
import {VoiceoverSubmitterFactory} from '../user/voiceover-submitter';

const ROLES = testConstants.Roles;
const cookieBannerAcceptButton =
  'button.e2e-test-oppia-cookie-banner-accept-button';

/**
 * Mapping of user roles to their respective function class.
 */
const USER_ROLE_MAPPING = {
  [ROLES.TRANSLATION_ADMIN]: TranslationAdminFactory,
  [ROLES.BLOG_ADMIN]: BlogAdminFactory,
  [ROLES.BLOG_POST_EDITOR]: BlogPostEditorFactory,
  [ROLES.CURRICULUM_ADMIN]: CurriculumAdminFactory,
  [ROLES.QUESTION_ADMIN]: QuestionAdminFactory,
  [ROLES.VOICEOVER_ADMIN]: VoiceoverAdminFactory,
  [ROLES.TOPIC_MANAGER]: TopicManagerFactory,
  [ROLES.MODERATOR]: ModeratorFactory,
  [ROLES.RELEASE_COORDINATOR]: ReleaseCoordinatorFactory,
  [ROLES.VOICEOVER_SUBMITTER]: VoiceoverSubmitterFactory,
} as const;

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

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: (SuperAdmin & BlogAdmin & VoiceoverAdmin) | null = null;
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
   */
  static assignRolesToUser = async function <
    TUser extends BaseUser,
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[],
  >(
    user: TUser,
    roles: TRoles,
    topic: string = '',
    explorationId: string | null = null
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
          await superAdminInstance.assignRoleToUser(
            user.username,
            ROLES.TOPIC_MANAGER,
            topic
          );
          break;
        case ROLES.VOICEOVER_SUBMITTER:
          if (!explorationId) {
            throw new Error(
              'Exploration ID is required to assign a voiceover submitter.'
            );
          }
          await superAdminInstance.addVoiceoverArtistToExplorationWithID(
            explorationId,
            user.username
          );
          break;
        default:
          await superAdminInstance.assignRoleToUser(user.username, role);
          break;
      }

      if (role !== ROLES.VOICEOVER_SUBMITTER) {
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

  static createNewUser = async function <
    TRoles extends (keyof typeof USER_ROLE_MAPPING)[] = never[],
  >(
    username: string,
    email: string,
    roles: OptionalRoles<TRoles> = [] as OptionalRoles<TRoles>,
    topic: string | null = null,
    explorationId: string | null = null
  ): Promise<
    LoggedOutUser &
      LoggedInUser &
      ExplorationEditor &
      QuestionSubmitter &
      TopicManager &
      CurriculumAdmin &
      MultipleRoleIntersection<TRoles>
  > {
    let user = UserFactory.composeUserWithRoles(BaseUserFactory(), [
      LoggedOutUserFactory(),
      LoggedInUserFactory(),
      ExplorationEditorFactory(),
      QuestionSubmitterFactory(),
      TopicManagerFactory(),
      CurriculumAdminFactory(),
      VoiceoverSubmitterFactory(),
    ]);

    user.username = username;
    user.email = email;

    await user.openBrowser();
    await user.signUpNewUser(username, email);
    activeUsers.push(user);

    return await UserFactory.assignRolesToUser(
      user,
      roles,
      topic ?? '',
      explorationId
    );
  };

  /**
   * The function creates a new super admin user and returns the instance
   * of that user.
   */
  static createNewSuperAdmin = async function (
    username: string
  ): Promise<SuperAdmin & BlogAdmin & VoiceoverAdmin> {
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
    await superAdmin.assignRoleToUser(username, ROLES.VOICEOVER_ADMIN);
    await superAdmin.expectUserToHaveRole(username, ROLES.BLOG_ADMIN);
    superAdminInstance = UserFactory.composeUserWithRoles(superAdmin, [
      BlogAdminFactory(),
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
