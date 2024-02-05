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
 * @fileoverview Logged-in users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

const homeUrl = testConstants.URLs.home;
const aboutUrl = testConstants.URLs.About;
const mathClassroomUrl = testConstants.URLs.MathClassroom;
const androidUrl = testConstants.URLs.Android;
const communityLibraryUrl = testConstants.URLs.CommunityLibrary;
const creatorDashboardCreateModeUrl =
  testConstants.URLs.CreatorDashboardCreateMode;
const aboutFoundationUrl = testConstants.URLs.AboutFoundation;
const blogUrl = testConstants.URLs.Blog;
const partnershipsUrl = testConstants.URLs.Partnerships;
const volunteerUrl = testConstants.URLs.Volunteer;
const donateUrl = testConstants.URLs.Donate;
const contactUrl = testConstants.URLs.Contact;
const _61MillionChildrenUrl = testConstants.URLs._61MillionChildren;
const sourceUnescoUrl = testConstants.URLs.SourceUnesco;
const evenThoseWhoAreInSchoolUrl = testConstants.URLs.EvenThoseWhoAreInSchool;
const _420MillionUrl = testConstants.URLs._61MillionChildren;
const thanksForDonatingUrl = testConstants.URLs.ThanksForDonating;
const watchAVideoUrl = testConstants.URLs.WatchAVideo;
const blogWebUrl = testConstants.URLs.BlogWeb;

const navbarAboutTab = 'a#navbar-about-menu';
const navbarAboutTabAboutButton = 'a#navbar-about-menu-about-button';
const navbarAboutTabAboutFoundationButton =
  'a#navbar-about-menu-about-foundation-button';
const navbarAboutTabBlogButton = 'a#navbar-about-menu-blog-button';
const navbarGetInvolvedTab = 'a#navbar-get-involved-menu';
const navbarGetInvolvedTabSchoolAndOrganizationsButton =
  'a#navbar-get-involved-menu-school-and-organizations-button';
const navbarGetInvolvedTabVolunteerButton =
  'a#navbar-get-involved-menu-volunteer-button';
const navbarGetInvolvedTabDonateButton =
  'a#navbar-get-involved-menu-donate-button';
const navbarGetInvolvedTabContactUsButton =
  'a#navbar-get-involved-menu-contact-us-button';
const navbarDonateButton = 'a#navbar-donate-button';

const browseOurLessonsButton = '#about-page-browse-our-lessons-button';
const accessAndroidAppButton = '#about-page-access-android-app-button';
const visitClassroomButton = '#about-page-visit-classroom-button';
const browseLibraryButton = '#about-page-browse-library-button';
const createLessonsButton = '#about-page-create-lessons-button';
const exploreLessonsButton = '#about-page-explore-lessons-button';

const aboutFoundationClass = '.oppia-about-foundation-hero-content h1';
const millionsOfContentId = '#about-foundation-page-millions-of-content';
const weCannotContentId = '#about-foundation-page-we-cannot-content';
const sourceUnescoButtion = 'a#about-foundation-page-source-unesco-button';
const learnMoreAboutOppiaButton =
  '#about-foundation-page-learn-more-about-oppia-button';
const becomeAVolunteerButton =
  '#about-foundation-page-become-a-volunteer-button';
const sectionSixPart1 = '#about-foundation-page-section-six-part-1';
const sectionSixPart2 = '#about-foundation-page-section-six-part-2';
const sectionSixPart3 = '#about-foundation-page-section-six-part-3';

const watchAVideoButton = 'a#thanks-for-donating-page-watch-a-video-button';
const readOurBlogButton = 'a#thanks-for-donating-page-read-our-blog-button';
const dismissButton = 'i#thanks-for-donating-page-dismiss-button';
const thanksForDonatingClass = '.modal-open';
const donatePage = '.modal-backdrop.fade';
const thanksForDonatingPage = '.modal-backdrop.fade.show';

module.exports = class LoggedInUsers extends baseUser {
  /**
   * Function for navigating to the home page.
   */
  async navigateToHome() {
    await this.goto(homeUrl);
  }

  /**
   * Function for navigating to the about page.
   */
  async navigateToAboutPage() {
    await this.goto(aboutUrl);
  }

  /**
   * Function for navigating to the about foundation page.
   */
  async navigateToAboutFoundationPage() {
    await this.goto(aboutFoundationUrl);
  }

  /**
   * Function for navigating to the Thanks for Donating page.
   */
  async navigateToThanksForDonatingPage() {
    await this.page.goto(thanksForDonatingUrl, {
      waitUntil: 'load',
      timeout: 0
    });
  }

  /**
   * Function to click the About button in the About Menu on navbar
   * and check if it opens the About page.
   */
  async clickAboutInAboutMenuOnNavbar() {
    await this.clickOn(navbarAboutTab);
    await this.clickOn(navbarAboutTabAboutButton);
    if (this.page.url() !== aboutUrl) {
      throw new Error (
        'The About Oppia button in About Menu on navbar ' +
        'does not open the About page!');
    } else {
      showMessage(
        'The About Oppia button in About Menu on navbar ' +
        'opens the About page.');
    }
  }

  /**
   * Function for click the Browse Our Lessons button in the About page
   * and check if it opens the Math Classroom page.
   */
  async clickBrowseOurLessonsButtonInAbout() {
    await this.clickOn(browseOurLessonsButton);
    if (this.page.url() !== mathClassroomUrl) {
      throw new Error (
        'The Browse our lesson button does not open the Math Classroom page!');
    } else {
      showMessage(
        'The Browse our lesson button opens the Math Classroom page.');
    }
  }

  /**
   * Function for click the Access Android App button in the About page
   * and check if it opens the Android page.
   */
  async clickAccessAndroidAppButtonInAbout() {
    await this.clickOn(accessAndroidAppButton);
    if (this.page.url() !== androidUrl) {
      throw new Error (
        'The Access the Android App button does not open the Android page!');
    } else {
      showMessage(
        'The Access the Android App button opens the Android page.');
    }
  }

  /**
   * Function for click the Visit Classroom button in the About page
   * and check if it opens the Math Classroom page.
   */
  async clickVisitClassroomButtonInAbout() {
    await this.clickOn(visitClassroomButton);
    if (this.page.url() !== mathClassroomUrl) {
      throw new Error (
        'The Visit Classroom button does not open the Math Classroom page!');
    } else {
      showMessage(
        'The Visit Classroom button opens the Math Classroom page.');
    }
  }

  /**
   * Function for click the Browse Our Lessons button in the About page
   * and check if it opens the Community Library page.
   */
  async clickBrowseLibraryButtonInAbout() {
    await this.clickOn(browseLibraryButton);
    if (this.page.url() !== communityLibraryUrl) {
      throw new Error (
        'The Browse Library button does not open the Community Library page!');
    } else {
      showMessage(
        'The Browse Library button opens the Community Library page.');
    }
  }

  /**
   * Function for click the Browse Our Lessons button in the About page
   * and check if it opens the Creator Dashboard page in Create Mode.
   */
  async clickCreateLessonsButtonInAbout() {
    await this.clickOn(createLessonsButton);
    if (this.page.url() !== creatorDashboardCreateModeUrl) {
      throw new Error (
        'The Create Lessons button does not open the Creator Dashboard ' +
        'in Create Mode!');
    } else {
      showMessage(
        'The Create Lessons button opens the Creator Dashboard ' +
        'in Create Mode.');
    }
    await this.page.waitForNavigation();
    const urlRegex = /http:\/\/localhost:8181\/create\/\w*(\/\w*\/?\w*)?/;
    if (this.page.url().match(urlRegex) === null) {
      throw new Error (
        'The Create Lessons button does not display ' +
        'the Exploration Editor page!');
    } else {
      showMessage(
        'The Create Lessons button displays the Exploration Editor page.');
    }
  }

  /**
   * Function for click the Browse Our Lessons button in the About page
   * and check if it opens the Math Classroom page.
   */
  async clickExploreLessonsButtonInAbout() {
    await this.clickOn(exploreLessonsButton);
    if (this.page.url() !== mathClassroomUrl) {
      throw new Error (
        'The Explore Lessons button does not open the Math Classroom page!');
    } else {
      showMessage(
        'The Explore Lessons button opens the Math Classroom page.');
    }
  }

  /**
   * Function to click the The Oppia Foundation button in the About Menu
   * on navbar and check if it opens The About Foundation page.
   */
  async clickAboutFoundationInAboutMenuOnNavbar() {
    await this.clickOn(navbarAboutTab);
    await this.clickOn(navbarAboutTabAboutFoundationButton);
    await this.page.waitForSelector(aboutFoundationClass);
    const displayedh1 = await this.page.$eval(
      aboutFoundationClass,
      element => element.innerText
    );
    if ((this.page.url() !== aboutFoundationUrl) &&
      (displayedh1 !== 'THE OPPIA FOUNDATION')) {
      throw new Error (
        'The Oppia Foundation button in About Menu on navbar ' +
        'does not open the About Foundation page!');
    } else {
      showMessage(
        'The Oppia Foundation button in About Menu on navbar ' +
        'opens the About Foundation page.');
    }
  }

  /**
   * Function for click the 61 million children button
   * in the About Foundation page and check if it opens the right page.
   */
  async click61MillionChildrenButtonInAboutFoundation() {
    await this.page.waitForSelector(millionsOfContentId);
    const buttonText = await this.page.$eval(
      millionsOfContentId,
      element => element.getElementsByTagName('a')[0].textContent
    );

    if (buttonText !== '61 million children') {
      throw new Error (
        'The 61 Million Children button does not exist!');
    } else {
      await this.page.$eval(
        millionsOfContentId,
        element => element.getElementsByTagName('a')[0].click()
      );
      if (this.page.url() !== _61MillionChildrenUrl) {
        throw new Error (
          'The 61 Million Children button does not open the right page!');
      } else {
        showMessage(
          'The 61 Million Children button opens the right page.');
      }
    }
  }

  /**
   * Function for click the even those who are in school button
   * in the About Foundation page and check if it opens the right page.
   */
  async clickEvenThoseWhoAreInSchoolButtonInAboutFoundation() {
    await this.page.waitForSelector(millionsOfContentId);
    const buttonText = await this.page.$eval(
      millionsOfContentId,
      element => element.getElementsByTagName('a')[1].textContent
    );
    if (buttonText !== 'even those who are in school') {
      throw new Error (
        'The Even Those Who Are In School button does not exist!');
    } else {
      await this.page.$eval(
        millionsOfContentId,
        element => element.getElementsByTagName('a')[1].click()
      );
      if (this.page.url() !== evenThoseWhoAreInSchoolUrl) {
        throw new Error (
          'The Even Those Who Are In School button does not open ' +
          'the right page!');
      } else {
        showMessage(
          'The Even Those Who Are In School button opens the right page.');
      }
    }
  }

  /**
   * Function for click the 420 million button
   * in the About Foundation page and check if it opens the right page.
   */
  async click420MillionButtonInAboutFoundation() {
    await this.page.waitForSelector(weCannotContentId);
    const buttonText = await this.page.$eval(
      weCannotContentId,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== '420 million') {
      throw new Error (
        'The 420 Million button does not exist!');
    } else {
      await this.page.$eval(
        weCannotContentId,
        element => element.getElementsByTagName('a')[0].click()
      );
      if (this.page.url() !== _420MillionUrl) {
        throw new Error (
          'The 420 Million button does not open the right page!');
      } else {
        showMessage(
          'The 420 Million button opens the right page.');
      }
    }
  }

  /**
   * Function to click the Source: UNESCO button in the About Foundation page
   * and check if it opens the right page.
   */
  async clickSourceUnescoButtonInAboutFoundation() {
    await this.clickOn(sourceUnescoButtion);
    if (this.page.url() !== sourceUnescoUrl) {
      throw new Error (
        'The Source: UNESCO button in the About Foundation page ' +
        'does not open the right page!');
    } else {
      showMessage(
        'The Source: UNESCO button in the About Foundation page ' +
        'opens the right page.');
    }
  }

  /**
   * Function to click the Learn More About Oppia button
   * in the About Foundation page and check if it opens the About page.
   */
  async clickLearnMoreAboutOppiaButtonInAboutFoundation() {
    await this.clickOn(learnMoreAboutOppiaButton);
    const newTab = await this.browserObject.waitForTarget(
      target => target.url() === aboutUrl
    );
    if (newTab.url() !== aboutUrl) {
      throw new Error (
        'The Learn More About Oppia button does not open the About page!');
    } else {
      showMessage(
        'The Learn More About Oppia button opens the About page.');
      const newPage = await newTab.page();
      await newPage.close();
    }
  }

  /**
   * Function to click the Become A Volunteer button
   * in the About Foundation page and check if it opens the Volunteer page.
   */
  async clickBecomeAVolunteerButtonInAboutFoundation() {
    await this.clickOn(becomeAVolunteerButton);
    const newTab = await this.browserObject.waitForTarget(
      target => target.url() === volunteerUrl
    );
    if (newTab.url() !== volunteerUrl) {
      throw new Error (
        'The Become A Volunteer button does not open the Volunteer page!');
    } else {
      showMessage(
        'The Become A Volunteer button opens the Volunteer page.');
    }
  }

  /**
   * Function for click the Consider Becoming A Partner Today! button
   * in the About Foundation page and check if it opens the Partnerships page.
   */
  async clickConsiderBecomingAPartnerTodayButtonInAboutFoundation() {
    await this.page.waitForSelector(sectionSixPart1);
    const buttonText = await this.page.$eval(
      sectionSixPart1,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== 'Consider becoming a partner today!') {
      throw new Error (
        'The Consider becoming a partner today! button does not exist!');
    } else {
      await this.page.$eval(
        sectionSixPart1,
        element => element.getElementsByTagName('a')[0].click()
      );
      if (this.page.url() !== partnershipsUrl) {
        throw new Error (
          'The Consider becoming a partner today! button does not open ' +
          'the Partnerships page!');
      } else {
        showMessage(
          'The Consider becoming a partner today! button opens ' +
          'the Partnerships page.');
      }
    }
  }

  /**
   * Function for click the Join our large volunteer community! button
   * in the About Foundation page and check if it opens the Volunteer page.
   */
  async clickJoinOurLargeVolunteerCommunityButtonInAboutFoundation() {
    await this.page.waitForSelector(sectionSixPart2);
    const buttonText = await this.page.$eval(
      sectionSixPart2,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== 'Join our large volunteer community!') {
      throw new Error (
        'The Join our large volunteer community! button does not exist!');
    } else {
      await this.page.$eval(
        sectionSixPart2,
        element => element.getElementsByTagName('a')[0].click()
      );
      if (this.page.url() !== volunteerUrl) {
        throw new Error (
          'The Join our large volunteer community! button does not open ' +
          'the Volunteer page!');
      } else {
        showMessage(
          'The Join our large volunteer community! button opens ' +
          'the Volunteer page.');
      }
    }
  }

  /**
   * Function for click the donations button
   * in the About Foundation page and check if it opens the Donate page.
   */
  async clickDonationsButtonInAboutFoundation() {
    await this.page.waitForSelector(sectionSixPart3);
    const buttonText = await this.page.$eval(
      sectionSixPart3,
      element => element.getElementsByTagName('a')[0].textContent
    );
    if (buttonText !== 'donations') {
      throw new Error (
        'The donations button does not exist!');
    } else {
      await this.page.$eval(
        sectionSixPart3,
        element => element.getElementsByTagName('a')[0].click()
      );
      if (this.page.url() !== donateUrl) {
        throw new Error (
          'The donations button does not open the Donate page!');
      } else {
        showMessage(
          'The donations button opens the Donate page.');
      }
    }
  }

  /**
   * Function to click the Blog button in the About Menu on navbar
   * and check if it opens the Blog page.
   */
  async clickBlogInAboutMenuOnNavbar() {
    await this.clickOn(navbarAboutTab);
    await this.clickOn(navbarAboutTabBlogButton);
    if (this.page.url() !== blogUrl) {
      throw new Error (
        'The Blog button in About Menu on navbar does not open ' +
        'the Blog page!');
    } else {
      showMessage(
        'The Blog button in About Menu on navbar opens the Blog page.');
    }
  }

  /**
   * Function to click the School and Organizations button in the
   * Get Involved Menu on navbar and check if it opens the Partnerships page.
   */
  async clickPartnershipsInGetInvolvedMenuOnNavbar() {
    await this.clickOn(navbarGetInvolvedTab);
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn(navbarGetInvolvedTabSchoolAndOrganizationsButton),
    ]);
    if (this.page.url() !== partnershipsUrl) {
      throw new Error (
        'The School and Organizations button in Get Involved Menu on navbar ' +
        'does not open the Partnerships page!');
    } else {
      showMessage(
        'The School and Organizations button in Get Involved Menu on navbar ' +
        'opens the Partnerships page.');
    }
  }

  /**
   * Function to click the Volunteer button in the Get Involved Menu
   * on navbar and check if it opens the Volunteer page.
   */
  async clickVolunteerInGetInvolvedMenuOnNavbar() {
    await this.clickOn(navbarGetInvolvedTab);
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn(navbarGetInvolvedTabVolunteerButton),
    ]);
    if (this.page.url() !== volunteerUrl) {
      throw new Error (
        'The Volunteer button in Get Involved Menu on navbar does not open ' +
        'the Volunteer page!');
    } else {
      showMessage(
        'The Volunteer button in Get Involved Menu on navbar opens ' +
        'the Volunteer page.');
    }
  }

  /**
   * Function to click the Donate button in the Get Involved Menu
   * on navbar and check if it opens the Donate page.
   */
  async clickDonateInGetInvolvedMenuOnNavbar() {
    await this.clickOn(navbarGetInvolvedTab);
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn(navbarGetInvolvedTabDonateButton),
    ]);
    if (this.page.url() !== donateUrl) {
      throw new Error (
        'The Donate button in Get Involved Menu on navbar does not open ' +
        'the Donate page!');
    } else {
      showMessage(
        'The Donate button in Get Involved Menu on navbar opens ' +
        'the Donate page.');
    }
  }

  /**
   * Function to click the Contact Us button in the Get Involved Menu
   * on navbar and check if it opens the Partnerships page.
   */
  async clickContactUsInGetInvolvedMenuOnNavbar() {
    await this.clickOn(navbarGetInvolvedTab);
    await Promise.all([
      this.page.waitForNavigation(),
      this.clickOn(navbarGetInvolvedTabContactUsButton),
    ]);
    if (this.page.url() !== contactUrl) {
      throw new Error (
        'The Contact Us button in Get Involved Menu on navbar does not open ' +
        'the Contact page!');
    } else {
      showMessage(
        'The Contact Us button in Get Involved Menu on navbar opens ' +
        'the Contact page.');
    }
  }

  /**
   * Function to click the Donate button on navbar
   * and check if it opens the Donate page.
   */
  async clickDonateOnNavbar() {
    await this.clickOn(navbarDonateButton);
    if (this.page.url() !== donateUrl) {
      throw new Error (
        'The Donate button on navbar does not open the Donate page!');
    } else {
      showMessage(
        'The Donate button on navbar opens the Donate page.');
    }
  }

  /**
   * Function for click the Watch A Video button
   * in the Thanks for Donating page and check if it opens the right page.
   */
  async clickWatchAVideoButtonInThanksForDonatingPage() {
    await this.page.waitForSelector(watchAVideoButton);
    const buttonText = await this.page.$eval(
      watchAVideoButton,
      element => element.innerText
    );
    if (buttonText !== 'Watch a video') {
      throw new Error (
        'The Watch A Video button does not exist!');
    } else {
      await Promise.all([
        this.page.waitForNavigation(),
        this.clickOn(watchAVideoButton),
      ]);
      if (this.page.url() !== watchAVideoUrl) {
        throw new Error (
          'The Watch A Video button does not open the right page!');
      } else {
        showMessage(
          'The Watch A Video button opens the right page.');
      }
    }
  }

  /**
   * Function for click the Read Our Blog button
   * in the Thanks for Donating page and check if it opens the Blog page.
   */
  async clickReadOurBlogButtonInThanksForDonatingPage() {
    await this.page.waitForSelector(readOurBlogButton);
    const buttonText = await this.page.$eval(
      readOurBlogButton,
      element => element.innerText
    );
    if (buttonText !== 'Read our blog') {
      throw new Error (
        'The Read Our Blog button does not exist!');
    } else {
      await Promise.all([
        this.page.waitForNavigation(),
        this.clickOn(readOurBlogButton),
      ]);
      if (this.page.url() !== blogWebUrl) {
        throw new Error (
          'The Read Our Blog button does not open the Blog page!');
      } else {
        showMessage(
          'The Read Our Blog button opens the Blog page.');
      }
    }
  }

  /**
   * Function to click the dismiss button in the Thanks for Donating page and
   * check if the Thanks for Donating popup disappear and show the Donate page
   */
  async clickDismissButtonInThanksForDonatingPage() {
    await this.clickOn(dismissButton);
    const thanksForDonatingHeader = await this.page.$(thanksForDonatingClass);
    if (thanksForDonatingHeader !== null) {
      throw new Error (
        'The dismiss button does not close the Thanks for Donating popup!');
    } else {
      const donatePageShowed = await this.page.$(donatePage);
      const thanksForDonatingPageShowed =
        await this.page.$(thanksForDonatingPage);
      if ((donatePageShowed === null) ||
        (thanksForDonatingPageShowed !== null)) {
        throw new Error (
          'The dismiss button does not open the Donate page!');
      } else {
        showMessage(
          'The dismiss button closes the Thanks for Donating popup ' +
          'and opens the Donate page.');
      }
    }
  }
};
