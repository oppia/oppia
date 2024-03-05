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

import SuperAdmin from '../user-utilities/super-admin-utils';
import GuestUser from '../user-utilities/logged-in-users-utils';
import BlogAdmin from '../user-utilities/blog-post-admin-utils';
import TranslationAdmin from '../user-utilities/translation-admin-utils';
import QuestionAdmin from '../user-utilities/question-admin-utils';

type User =
  SuperAdmin | GuestUser | BlogAdmin | TranslationAdmin | QuestionAdmin;

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance: SuperAdmin | null = null;
let activeUsers: User[] = [];
const ROLE_BLOG_ADMIN = 'blog admin';
const ROLE_BLOG_POST_EDITOR = 'blog post editor';
const ROLE_TRANSLATION_ADMIN = 'translation admin';
const ROLE_QUESTION_ADMIN = 'question admin';

/**
 * The function creates a new super admin user and returns the instance
 * of that user.
 */
export let createNewSuperAdmin = async function(
    username: string
): Promise<SuperAdmin> {
  if (superAdminInstance !== null) {
    return superAdminInstance;
  }

  const superAdmin = new SuperAdmin();
  await superAdmin.openBrowser();
  await superAdmin.signUpNewUser(username, 'testadmin@example.com');

  activeUsers.push(superAdmin);
  superAdminInstance = superAdmin;
  return superAdmin;
};

/**
 * The function creates a new blog admin user and returns the instance
 * of that user.
 */
export let createNewBlogAdmin = async function(
    username: string
): Promise<BlogAdmin> {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const blogAdmin = new BlogAdmin();
  await blogAdmin.openBrowser();
  await blogAdmin.signUpNewUser(username, 'blog_admin@example.com');

  await superAdminInstance.assignRoleToUser(username, ROLE_BLOG_ADMIN);
  await superAdminInstance.expectUserToHaveRole(username, ROLE_BLOG_ADMIN);

  activeUsers.push(blogAdmin);
  return blogAdmin;
};

/**
 * The function creates a new blog post editor user and returns the
 * instance of that user.
 */
export let createNewBlogPostEditor = async function(
    username: string
): Promise<BlogAdmin> {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const blogAdmin = await createNewBlogAdmin('blogAdm');

  const blogPostEditor = new BlogAdmin();
  await blogPostEditor.openBrowser();
  await blogPostEditor.signUpNewUser(
    username, 'blog_post_editor@example.com');

  await blogAdmin.assignUserToRoleFromBlogAdminPage(
    username, 'BLOG_POST_EDITOR');
  await superAdminInstance.expectUserToHaveRole(
    username, ROLE_BLOG_POST_EDITOR);

  activeUsers.push(blogPostEditor);
  return blogPostEditor;
};

/**
 * The function creates a new guest user and returns the instance of that user.
 */
export let createNewGuestUser = async function(
    username: string,
    email: string
): Promise<GuestUser> {
  const guestUser = new GuestUser();
  await guestUser.openBrowser();
  await guestUser.signUpNewUser(username, email);

  activeUsers.push(guestUser);
  return guestUser;
};

/**
 * Function to create a user with the translation admin role.
 */
export let createNewTranslationAdmin = async function(
    username: string
): Promise<TranslationAdmin> {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const translationAdmin = new TranslationAdmin();
  await translationAdmin.openBrowser();
  await translationAdmin.signUpNewUser(
    username,
    'translation_admin@example.com');

  await superAdminInstance.assignRoleToUser(
    username, ROLE_TRANSLATION_ADMIN);
  await superAdminInstance.expectUserToHaveRole(
    username, ROLE_TRANSLATION_ADMIN);

  activeUsers.push(translationAdmin);
  return translationAdmin;
};

/**
 * Function to create a user with the question admin role.
 */
export let createNewQuestionAdmin = async function(
    username: string
): Promise<QuestionAdmin> {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const questionAdmin = new QuestionAdmin();
  await questionAdmin.openBrowser();
  await questionAdmin.signUpNewUser(
    username,
    'question_admin@example.com');

  await superAdminInstance.assignRoleToUser(
    username, ROLE_QUESTION_ADMIN);
  await superAdminInstance.expectUserToHaveRole(
    username, ROLE_QUESTION_ADMIN);

  activeUsers.push(questionAdmin);
  return questionAdmin;
};

/**
 * The function closes all the browsers opened by different users.
 */
export let closeAllBrowsers = async function(): Promise<void> {
  for (let i = 0; i < activeUsers.length; i++) {
    await activeUsers[i].closeBrowser();
  }
};

/**
 * Function to close the browser opened by the specified user
 * should be closed.
 */
export let closeBrowserForUser = async function(user: User): Promise<void> {
  const index = activeUsers.indexOf(user);
  activeUsers.splice(index, 1);
  await user.closeBrowser();
};
