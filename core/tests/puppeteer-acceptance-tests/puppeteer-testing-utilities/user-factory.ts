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

import { e2eSuperAdmin } from '../user-utilities/super-admin-utils';
import { e2eBlogPostAdmin } from '../user-utilities/blog-post-admin-utils';

/**
 * Global user instances that are created and can be reused again.
 */
let e2eBlogAdmin = e2eBlogPostAdmin;
let e2eBlogPostEditor = e2eBlogPostAdmin;
let e2eGuestUser = e2eBlogPostAdmin;
// eslint-disable-next-line oppia/disallow-flags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeUsers: any[] = [];
let superAdminInstance: Promise<e2eSuperAdmin> = (async function() {
  let instance;
  if (!instance) {
    const superAdmin: e2eSuperAdmin = new e2eSuperAdmin();
    await superAdmin.openBrowser();
    await superAdmin.signUpNewUser('superAdm', 'testadmin@example.com');
    activeUsers.push(superAdmin);
    instance = superAdmin;
  }

  return instance;
})();

const ROLE_BLOG_ADMIN = 'blog admin';
const ROLE_BLOG_POST_EDITOR = 'blog post editor';

class userFactory {
  /**
   * The function creates a new super admin user and returns the instance
   * of that user.
   * @returns The super admin instance created.
   */
  static async createNewSuperAdmin(): Promise<e2eSuperAdmin> {
    // if (superAdminInstance !== null) {
    //   return superAdminInstance;
    // }

    // const superAdmin = new e2eSuperAdmin();
    // await superAdmin.openBrowser();
    // await superAdmin.signUpNewUser(username, 'testadmin@example.com');

    // activeUsers.push(superAdmin);
    // superAdminInstance = superAdmin;
    // return superAdmin;
    return (await superAdminInstance);
  }

  /**
   * The function creates a new blog admin user and returns the instance
   * of that user.
   * @param {string} username - The username of the blog admin.
   * @returns The blog admin instance created.
   */
  static async createNewBlogAdmin(username: string): Promise<e2eBlogPostAdmin> {
    // if (superAdminInstance === null) {
    //   superAdminInstance = await createNewSuperAdmin('superAdm');
    // }

    const blogAdmin = new e2eBlogAdmin();
    await blogAdmin.openBrowser();
    await blogAdmin.signUpNewUser(username, 'blog_admin@example.com');

    await (await superAdminInstance).assignRoleToUser(  // TODO: check if this extra await works fine in the tests. most probably yes! as this seems logical!
      username, ROLE_BLOG_ADMIN);
    await (await superAdminInstance).expectUserToHaveRole(
      username, ROLE_BLOG_ADMIN);

    activeUsers.push(blogAdmin);
    return blogAdmin;
  }

  /**
   * The function creates a new blog post editor user and returns the
   * instance of that user.
   * @param {string} username - The username of the blog post editor.
   * @returns The blog post editor instance created.
   */
  static async createNewBlogPostEditor(
      username: string): Promise<e2eBlogPostAdmin> {
    const blogAdmin = await this.createNewBlogAdmin('blogAdm');

    const blogPostEditor = new e2eBlogPostEditor();
    await blogPostEditor.openBrowser();
    await blogPostEditor.signUpNewUser(
      username, 'blog_post_editor@example.com');

    await blogAdmin.assignUserToRoleFromBlogAdminPage(
      username, 'BLOG_POST_EDITOR');
    await (await superAdminInstance).expectUserToHaveRole(
      username, ROLE_BLOG_POST_EDITOR);

    activeUsers.push(blogPostEditor);
    return blogPostEditor;
  }

  /**
   * The function creates a new guest user and returns the instance of that user
   * @param {string} username - The username of the guest user.
   * @param {string} email - The email of the guest user.
   * @returns The guest user instance created.
   */
  static async createNewGuestUser(
      username: string, email: string): Promise<e2eBlogPostAdmin> {
    const guestUser = new e2eGuestUser();
    await guestUser.openBrowser();
    await guestUser.signUpNewUser(username, email);

    activeUsers.push(guestUser);
    return guestUser;
  }

  /**
   * The function closes all the browsers opened by different users.
   */
  static async closeAllBrowsers(): Promise<void> {
    for (let i = 0; i < activeUsers.length; i++) {
      await activeUsers[i].closeBrowser();
    }
  }
}

export { userFactory };
