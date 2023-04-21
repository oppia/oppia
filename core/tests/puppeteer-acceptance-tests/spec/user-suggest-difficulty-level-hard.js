const LABEL_FOR_CREATE_NEW_EXPLORATION_BUTTON = "+ Create Exploration"
const LABEL_FOR_PUBLISH_EXPLORATION = "Publish"
const LABEL_FOR_ADMIN_ROLES = "Roles"
const LABEL_FOR_CURRIC_ADMIN = "Curriculum Admin"
const LABEL_FOR_QUESTION_ADMIN = "Question admin"
const LABEL_TO_MAKE_NEW_TOPIC = "Create Topic"
const LABEL_FOR_NEW_TOPIC_NAME = "Name*"
const LABEL_TO_CREATE_NEW_TOPIC = "Create Topic"
const LABEL_TO_ADD_STORY_TO_TOPIC = "+ Add Story"
const LABEL_TO_CREATE_STORY = "Create story"
const LABEL_TO_ADD_CHAPTER = "+ Add Chapter"
const LABEL_FOR_ADMIN_CONFIG = "Config"
const LABEL_TO_SAVE = "Save"

const LABEL_FOR_SUGGEST_QUESTION = "Suggest Question"
const LABEL_FOR_CONTINUE_BUTTON = "Continue"
const LABEL_FOR_SAVE_QUESTION = "Save question"
const LABEL_FOR_ADD_INTERACTION = "Add interaction"
const LABEL_FOR_SAVE_INTERACTION = 'Save interaction'
const LABEL_FOR_SAVE_HINT = "Save Hint"
const LABEL_FOR_ADD_SOLUTION = "Add Solution"
const LABEL_FOR_CHECK_AND_SAVE_SOLUTION = "Check and Save Solution"
const LABEL_FOR_SAVE_FEEDBACK = "Save Feedback"
const LABEL_FOR_MISCONCEP_TAG = "Tag with misconception"
const LABEL_FOR_DONE = "Done"
const LABEL_FOR_SAVE_RESPONSE = "Save Response"
const LABEL_FOR_ADD_HINT = "Add Hint"

const localhost = "http://localhost:8181"

const baseUser = require(
    '../puppeteer-testing-utilities/puppeteer-utils.js');

//Users can suggest questions by selecting difficulty level as Hard to a lesson in a Topic

module.exports = class e2eBlogPostAdmin extends baseUser {
    async setUp(){
        loadedPage = await openBrowser()
        if (loadedPage != null){
            //Log in as testadmin@example.com and give yourself the curriculum admin and contributer ID
            await this.signInWithEmail("testadmin@example.com"); //will this handle the registration
            await this.createFirstExploration()
            await this.changeRolesToCurricAdmin()
            await this.createTestTopic()
            await this.createStoryAddFirstExploration()
            await this.goToMathClassroom()
            this.logout();
            
            //create new user for question submitter
            await this.signUpNewUser("questionsubmitter", "question.submitter@example.com")
    
        }
    }

    async createFirstExploration(){
        //Go to /creator-dashboard and create a new exploration titled "First Exploration"
        await this.goto(localhost + "/creator-dashboard"); 
        await this.clickOn(LABEL_FOR_CREATE_NEW_EXPLORATION_BUTTON);
        await this.clickOn(LABEL_FOR_PUBLISH_EXPLORATION)
        //click on says throw error is button is disconnected, banking on that
    }

    async changeRolesToCurricAdmin(){
        //To access adding to topics and skills dashboard, must log in as a 
        //super-admin and assign yourself the "Curriculum admin" role 
        await this.goto(localhost + "/admin") 
        await this.clickOn(LABEL_FOR_ADMIN_ROLES)
        await this.assignRoleToUser("testadmin@example.com", LABEL_FOR_CURRIC_ADMIN)
        //click on says throw error is button is disconnected, banking on that 
    }

    async createTestTopic(){
        //create a topic called "Test Topic
        //TODO:: it says create topic if never made before and create new topic if you have distinction
        await this.goto(localhost + "/topics-and-skills-dashboard");
        await this.clickOn(LABEL_TO_MAKE_NEW_TOPIC);
        await this.type(LABEL_FOR_NEW_TOPIC_NAME, "Test Topic"); //TODO::need to find CSS selector of first arg
        //TODO:: not letting me publlish with just one field filled out, will this override
        await this.clickOn(LABEL_TO_CREATE_NEW_TOPIC);
    }

    async createStoryAddFirstExploration(){
        //create a story in Test Topic, and add "First Exploration" as chapters to it. 
        await this.clickOn(LABEL_TO_ADD_STORY_TO_TOPIC);
        await this.clickOn(LABEL_TO_CREATE_STORY)
        //story created, redirect to add chapter page
        await this.clickOn(LABEL_TO_ADD_CHAPTER);
        //TODO:: HOW TF DO I ADD MY EXPLORATION AS A CHAPTER AAHSHHSHSH
        //TODO:: public story and topic if thats additional
    }

    async goToMathClassroom(){
        //TODO::In the /admin Config tab, create a classroom called "Math" and add "Test Topic" to it
        await this.goto(localhost + "/admin") 
        await this.clickOn(LABEL_FOR_ADMIN_CONFIG)
        await this.clickOn(LABEL_TO_SAVE)
    }

    async testSteps(){
        await this.submitQuestionOnContributorDashboard()
        await this.clickSuggestQuestionInTestTopic()
        await this.hardDifficultyAndContinue()
        await this.typeYourQuestion()
        await this.customizeInteractions()
        await this.selectLearnersResponse()
        await this.saveHintAndAddSolution()
        await this.solutionSubmit()
        await this.clickOnAnswers()
    }


    async submitQuestionOnContributorDashboard(){
        //go toe contribtor dashboard, click on submti question tab
        //login as super-admin and assign to your user the "Question admin" role.
        await this.signInWithEmail("testadmin@example.com");
        await this.goto("http://localhost:8181/contributor-dashboard-admin"); 
        await this.assignRoleToUser("testadmin@example.com", LABEL_FOR_QUESTION_ADMIN)
       
    }

    async clickSuggestQuestionInTestTopic(){
        //Click on Suggest Question button for First exploration in Test Topic
        await this.clickOn("First exploration") //TODO:: make label when I know the website format
        await this.clickOn(LABEL_FOR_SUGGEST_QUESTION);
    }

    async hardDifficultyAndContinue(){
        // Select difficulty level as Hard and click on Continue button
        //TODO:: Select difficulty level as Hard
        await this.clickOn(LABEL_FOR_CONTINUE_BUTTON);
    }

    async typeYourQuestion(){
        //4. In 'Type your question here' field enter 'Question 1: Enter fraction', click on Save Question button. Click on Add interaction 
        //   button and select Fraction Input
        await this.type(LABEL_FOR_NEW_TOPIC_NAME, "Question 1: Enter fraction"); //TODO::need to find CSS selector of question button
        await this.clickOn(LABEL_FOR_SAVE_QUESTION)
        await this.clickOn(LABEL_FOR_ADD_INTERACTION)
    }

    async customizeInteractions(){
        //5. In customize interaction(Fraction Input) dialogbox click on Save interaction
        await this.clickOn(LABEL_FOR_SAVE_INTERACTION)
    }

    async selectLearnersResponse(){
        //6. In the Add Response dialogbox, select If the learners response 'has no Fractional part' and enter "Incorrect" in the field. 
        //   Oppia tells the learner and click on 'Tag with misconception' and select the misconception and click on Done button. 
        //   Click on Save Response button. Click on Add Hint button
        //7. In Hint#1 enter 'Enter fraction'
        await this.clickOn(LABEL_FOR_MISCONCEP_TAG)
        await this.clickOn(LABEL_FOR_DONE)
        await this.clickOn(LABEL_FOR_SAVE_RESPONSE)
        await this.clickOn(LABEL_FOR_ADD_HINT)
    }

    async saveHintAndAddSolution(){
        //click on "Save Hint" button. Click on Add Solution button
        await this.clickOn(LABEL_FOR_SAVE_HINT)
        await this.clickOn(LABEL_FOR_ADD_SOLUTION)
    }

    async solutionSubmit(){
        //8. select 'The only' solution is.. '1/2' click on the Submit button. In the explanation dialogbox enter 'Solution' and 
        //click on 'Check and Save Solution'
        await this.clickOn(LABEL_FOR_CHECK_AND_SAVE_SOLUTION)
    }

    async clickOnAnswers(){
        //9. Click on All other answers 'wrong', enter 'Correct answer' in Oppia tells the learner, check the checkbox 'The answers in this 
        //   group are correct' and click on Save Feedback
        await this.clickOn(LABEL_FOR_SAVE_FEEDBACK)
    }


    
}




//Test Steps:
//1. Go to Contributor dashboard, click on Submit Question tab 
//2. Click on Suggest Question button for First exploration in Test Topic
//3. Select difficulty level as Hard and click on Continue button
//4. In 'Type your question here' field enter 'Question 1: Enter fraction', click on Save Question button. Click on Add interaction 
//   button and select Fraction Input
//5. In customize interaction(Fraction Input) dialogbox click on Save interaction
//6. In the Add Response dialogbox, select If the learners response 'has no Fractional part' and enter "Incorrect" in the field. 
//   Oppia tells the learner and click on 'Tag with misconception' and select the misconception and click on Done button. 
//   Click on Save Response button. Click on Add Hint button
//7. In Hint#1 enter 'Enter fraction' click on "Save Hint" button. Click on Add Solution button
//8. select 'The only' solution is.. '1/2' click on the Submit button. In the explanation dialogbox enter 'Solution' and click on 
//   'Check and Save Solution'
//9. Click on All other answers 'wrong', enter 'Correct answer' in Oppia tells the learner, check the checkbox 'The answers in this 
//   group are correct' and click on Save Feedback

//Test Expectations:
//1. Test Topic, First exploration must be shown with Suggest Question button
//2. Select the difficulty per skill according to the specified rubrics, Medium and Hard with Skill descriptions should be shown 
//3. Selected Difficulty, Notes from rubrics,Your Practice Question, Type your question here label with edit icon should be shown
//4. Question text must be added and Customize interaction(Fraction Input) dialogbox should open with checkbox options 
//   'Require the learner's answer to be in simplest form', 'Allow improper fractions in the learner's answer', 'Allow the answer 
//   to contain an integer part'
//5. Add Response dialog must open with rules and inputs 
//6. Response must be added. Add Hint dialogbox should open with Hint#1 textbox
//7. Warning message 'Please enter the solution for the state' should be seen in the Solution section.
//8. Solution must be saved and a tooltip and error message 'Please enter a feedback for the default outcome'
//9. Question must be submitted successfully and Question submitted for review tooltip should be seen, the progressbar in the 
//   dashboard should show