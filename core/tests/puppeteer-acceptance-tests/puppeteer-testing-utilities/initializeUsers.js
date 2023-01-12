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

const e2eSuperAdmin = require('./blogPostAdminUtils.js');
const e2eBlogAdmin = require('./blogPostAdminUtils.js');
const e2eBlogPostEditor = require('./blogPostAdminUtils.js');

let superAdmin = async function(username, email, role = null) {
  const superAdmin = await new e2eSuperAdmin();
  await superAdmin.openBrowser();
  await superAdmin.signUpNewUserWithUsernameAndEmail(
    username, email);

  if (role) {
    await superAdmin.assignRoleToUser(username, role);
    await superAdmin.expectUserToHaveRole(username, role);
  }

  return superAdmin;
};

let blogAdmin = async function(username, email) {
  const blogAdmin = await new e2eBlogAdmin();
  await blogAdmin.openBrowser();
  await blogAdmin.signUpNewUserWithUsernameAndEmail(
    username, email);

  return blogAdmin;
};

let blogPostEditor = async function(username, email) {
  const blogPostEditor = await new e2eBlogPostEditor();
  await blogPostEditor.openBrowser();
  await blogPostEditor.signUpNewUserWithUsernameAndEmail(
    username, email);

  return blogPostEditor;
};

module.exports = { superAdmin, blogAdmin, blogPostEditor };
