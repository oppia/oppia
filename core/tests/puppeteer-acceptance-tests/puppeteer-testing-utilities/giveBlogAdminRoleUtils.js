const puppeteerUtilities = require("./puppeteer_utils.js");

const unauthErrorContainer = "div.e2e-test-error-container";
const roleEditorInputField = "input.e2e-test-username-for-role-editor"
const roleEditorButtonSelector = "e2e-test-role-edit-button";
const rolesSelectDropdown = "mat-select-trigger";
const blogdDashboardAuthorDetailsModal = "div.modal-dialog";

class e2eBlogAdmin extends puppeteerUtilities {

  async expectBlogDashboardAccessToBeUnauthorized() {
    try {
      await (this.page).waitForSelector(unauthErrorContainer);
      console.log("User unauthorized to access blog dashboard!");
    } catch(err) {
      throw new Error("No unauthorization error found for the blog dashboard page!");
    }
  }

  async expectBlogDashboardAccessToBeAuthorized() {
    /**Here we are trying to check if the blog dashboard is accessible to the 
     * guest user after giving the blog admin role to it. There is a modal dialog box 
     * asking for the user name and bio for the users given blog admin role 
     * as they first time opens the blog-dashboard. */
    await this.reloadPage();
    try {
      await this.waitForPageToLoad(blogdDashboardAuthorDetailsModal);
      console.log("User authorized to access blog dashboard!");
    } catch(err) {
      throw new Error("User unauthorized to access blog dashboard!");
    }
  }
  
};

class e2eSuperAdmin extends puppeteerUtilities {

  async assignBlogAdminRoleToUserWithUserName(userName) {
    await this.type(roleEditorInputField, userName);
    await this.clickOn("button", roleEditorButtonSelector);
    await this.clickOn("h4", "Add role");
    await this.clickOn("div", rolesSelectDropdown);
    await (this.page).evaluate(async() => {
      const allRoles = document.getElementsByClassName('mat-option-text');
      console.log(allRoles.length);
      for(let i = 0; i < allRoles.length; i++) {
        console.log(allRoles[i].innerText);
        if(allRoles[i].innerText === "blog admin") {
          allRoles[i].click({waitUntil: "networkidle0"});
          return;
        }
      }
    });
  }

  async expectUserToHaveBlogAdminRole() {
    await (this.page).evaluate(() => {
      const userRoles = document.getElementsByClassName('oppia-user-role-description');
      for(let i = 0; i < userRoles.length; i++) {
        console.log(userRoles[i].innerText);
        if(userRoles[i].innerText === "Blog Admin") {
          return;
        }
      }
      throw new Error("User does not have blog admin role!");
    });
    console.log("User given the blog admin role successfully!");
  }
};

module.exports = {
  e2eBlogAdmin,
  e2eSuperAdmin
}