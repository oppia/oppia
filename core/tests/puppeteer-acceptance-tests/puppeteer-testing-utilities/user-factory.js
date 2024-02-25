// Copyright 2023 The Oppia Authors. All Rights Reserved.
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

let e2eSuperAdmin = require('../user-utilities/super-admin-utils.js');
let e2eGuestUser = require('../user-utilities/logged-in-users-utils.js');
let e2eBlogAdmin = e2eBlogPostEditor = require(
  '../user-utilities/blog-post-admin-utils.js');
let e2eTranslationAdmin = require(
  '../user-utilities/translation-admin-utils.js');
let e2eQuestionAdmin = require(
  '../user-utilities/question-admin-utils.js');

/**
 * Global user instances that are created and can be reused again.
 */
let superAdminInstance = null;
let activeUsers = [];
const ROLE_BLOG_ADMIN = 'blog admin';
const ROLE_BLOG_POST_EDITOR = 'blog post editor';
const ROLE_TRANSLATION_ADMIN = 'translation admin';
const ROLE_QUESTION_ADMIN = 'question admin';

/**
 * The function creates a new super admin user and returns the instance
 * of that user.
 * @param {string} username - The username of the super admin.
 * @returns The super admin instance created.
 */
let createNewSuperAdmin = async function(username) {
  if (superAdminInstance !== null) {
    return superAdminInstance;
  }

  const superAdmin = new e2eSuperAdmin();
  await superAdmin.openBrowser();
  await superAdmin.signUpNewUser(username, 'testadmin@example.com');

  activeUsers.push(superAdmin);
  superAdminInstance = superAdmin;
  return superAdmin;
};

/**
 * The function creates a new blog admin user and returns the instance
 * of that user.
 * @param {string} username - The username of the blog admin.
 * @returns The blog admin instance created.
 */
let createNewBlogAdmin = async function(username) {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const blogAdmin = new e2eBlogAdmin();
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
 * @param {string} username - The username of the blog post editor.
 * @returns The blog post editor instance created.
 */
let createNewBlogPostEditor = async function(username) {
  const blogAdmin = await createNewBlogAdmin('blogAdm');

  const blogPostEditor = new e2eBlogPostEditor();
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
 * @param {string} username - The username of the guest user.
 * @param {string} email - The email of the guest user.
 * @returns The guest user instance created.
 */
let createNewGuestUser = async function(username, email) {
  const guestUser = new e2eGuestUser();
  await guestUser.openBrowser();
  await guestUser.signUpNewUser(username, email);

  activeUsers.push(guestUser);
  return guestUser;
};

/**
 * Function to create a user with the translation admin role.
 * @param {string} username - the username of the translation admin.
 * @param {string} email - the email of the user.
 * @returns the instance of the translation admin.
 */
let createNewTranslationAdmin = async function(username, email) {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const translationAdmin = new e2eTranslationAdmin();
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
 * @param {string} username - the username of the question admin.
 * @param {string} email - the email of the user.
 * @returns the instance of the question admin.
 */
let createNewQuestionAdmin = async function(username, email) {
  if (superAdminInstance === null) {
    superAdminInstance = await createNewSuperAdmin('superAdm');
  }

  const questionAdmin = new e2eQuestionAdmin();
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
let closeAllBrowsers = async function() {
  for (let i = 0; i < activeUsers.length; i++) {
    await activeUsers[i].closeBrowser();
  }
};

/**
 * Function to close the browser opened by the specified user
 * @param {baseUser} user - the user object of the user who's browser
 * should be closed.
 */
let closeBrowserForUser = async function(user) {
  const index = activeUsers.indexOf(user);
  activeUsers.splice(index, 1);
  await user.closeBrowser();
};

module.exports = {
  createNewSuperAdmin,
  createNewBlogAdmin,
  createNewBlogPostEditor,
  createNewGuestUser,
  createNewTranslationAdmin,
  createNewQuestionAdmin,
  closeAllBrowsers,
  closeBrowserForUser
};
