# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for the page that allows learners to play through an exploration."""

__author__ = 'Sean Lip'

from core.controllers import reader
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import rights_manager
from core.domain import param_domain
from core.tests import test_utils
import feconf


class ReaderPermissionsTest(test_utils.GenericTestBase):
    """Test permissions for readers to view explorations."""

    EXP_ID = 'eid'

    def setUp(self):
        """Before each individual test, create a dummy exploration."""
        super(ReaderPermissionsTest, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.EDITOR_ID = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID, self.EDITOR_ID, title=self.UNICODE_TEST_STRING,
            category=self.UNICODE_TEST_STRING)

    def test_unpublished_explorations_are_invisible_to_logged_out_users(self):
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)

    def test_unpublished_explorations_are_invisible_to_unconnected_users(self):
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_explorations_are_invisible_to_other_editors(self):
        OTHER_EDITOR_EMAIL = 'another@example.com'
        self.signup(OTHER_EDITOR_EMAIL, 'othereditorusername')

        other_exploration = exp_domain.Exploration.create_default_exploration(
            'eid2', 'A title', 'A category')
        exp_services.save_new_exploration(
            OTHER_EDITOR_EMAIL, other_exploration)

        self.login(OTHER_EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 404)
        self.logout()

    def test_unpublished_explorations_are_visible_to_their_editors(self):
        self.login(self.EDITOR_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_unpublished_explorations_are_visible_to_admins(self):
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_EMAIL])
        self.login(self.ADMIN_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID))
        self.assertEqual(response.status_int, 200)
        self.logout()

    def test_published_explorations_are_visible_to_logged_out_users(self):
        rights_manager.publish_exploration(self.EDITOR_ID, self.EXP_ID)

        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)

    def test_published_explorations_are_visible_to_logged_in_users(self):
        rights_manager.publish_exploration(self.EDITOR_ID, self.EXP_ID)

        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.login(self.VIEWER_EMAIL)
        response = self.testapp.get(
            '%s/%s' % (feconf.EXPLORATION_URL_PREFIX, self.EXP_ID),
            expect_errors=True)
        self.assertEqual(response.status_int, 200)


class ReaderControllerEndToEndTests(test_utils.GenericTestBase):
    """Test the reader controller using the sample explorations."""

    def setUp(self):
        super(ReaderControllerEndToEndTests, self).setUp()

    def submit_and_compare(self, answer, expected_feedback, expected_question):
        """Submits an answer and compares the output to a regex.

        `expected_response` will be interpreted as a regex string.
        """
        reader_dict = self.submit_answer(
            self.EXP_ID, self.last_state_name, answer)
        self.last_state_name = reader_dict['state_name']
        self.assertRegexpMatches(
            reader_dict['feedback_html'], expected_feedback)
        self.assertRegexpMatches(
            reader_dict['question_html'], expected_question)
        return self

    def init_player(self, exploration_id, expected_title, expected_response):
        """Starts a reader session and gets the first state from the server.

        `expected_response` will be interpreted as a regex string.
        """
        exp_services.delete_demo(exploration_id)
        exp_services.load_demo(exploration_id)

        self.EXP_ID = exploration_id

        reader_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, self.EXP_ID))

        self.last_state_name = reader_dict['exploration']['init_state_name']
        init_state_data = (
            reader_dict['exploration']['states'][self.last_state_name])
        init_content = init_state_data['content'][0]['value']

        self.assertRegexpMatches(init_content, expected_response)
        self.assertEqual(reader_dict['exploration']['title'], expected_title)

    def test_welcome_exploration(self):
        """Test a reader's progression through the default exploration."""
        self.init_player(
            '0', 'Welcome to Oppia!', 'do you know where the name \'Oppia\'')
        self.submit_and_compare(
            '0', 'Yes!', 'In fact, the word Oppia means \'learn\'.')
        self.submit_and_compare('Finish', 'Check your spelling!', '')
        self.submit_and_compare(
            'Finnish', 'Yes! Oppia is the Finnish word for learn.',
            'What is the value of')

    def test_soft_classification(self):
        """Tests the string classifier exploration with responses that
        trigger soft rules.
        """
        self.init_player(
            '16', 'Testing String Classifier', 'do you think three things can')
        self.submit_and_compare('Because you can arrange each colour '
            'systematically and there are two permutations of each colour',
            'Detected permutation', 'do you think three things can')
        self.submit_and_compare('Because these are the number of '
            'combinations...', 'Detected combination',
            'do you think three things can')
        self.submit_and_compare('First ball can be of any color among three '
            '(for that we have three ways), after the first ball has been '
            'selected two balls are there of remaining two colors. Now second '
            'ball can be selected of any color among the remaining two (for '
            'that there are two ways), now the remaining ball is the last '
            'ball of remaining color (for that we have only one way). Now we '
            'have to multiply the ways because the events were independent. '
            'Eventually we get the answer as 3*2*1=6.',
            'Detected factorial', 'do you think three things can')
        self.submit_and_compare('Ryb rby etc',
            'Detected listing', 'do you think three things can')
        self.submit_and_compare('doont know',
            'Detected unsure', 'do you think three things can')

    def test_string_classifier_classification(self):
        """Tests the string classifier exploration with responses that
        trigger the string classifier.
        """
        self.init_player(
            '16', 'Testing String Classifier', 'do you think three things can')
        with self.swap(feconf, 'ENABLE_STRING_CLASSIFIER', True):
            self.submit_and_compare('it\'s a permutation of 3 elements',
                'Detected permutation', 'do you think three things can')
            self.submit_and_compare('There are 3 options for the first ball, '
                'and 2 for the remaining two. So 3*2=6.', 'Detected '
                'factorial', 'do you think three things can')
            self.submit_and_compare('abc acb bac bca cbb cba',
                'Detected listing', 'do you think three things can')
            self.submit_and_compare('dunno, just guessed',
                'Detected unsure', 'do you think three things can')

    def test_binary_search(self):
        """Test the binary search (lazy magician) exploration."""
        self.init_player(
            '2', 'The Lazy Magician', 'How does he do it?')
        self.submit_and_compare('Dont know', 'we should watch him first',
            'town square')
        self.submit_and_compare(0, '', 'Is it')
        self.submit_and_compare(2, '', 'Do you want to play again?')
        # TODO(sll): Redo all of the following as a JS test, since the
        # backend can no longer parse expressions:
        #
        # self.submit_and_compare(1, '', 'how do you think he does it?')
        # self.submit_and_compare('middle',
        #     'he\'s always picking a number in the middle',
        #     'what number the magician picked')
        # self.submit_and_compare(0, 'Exactly!', 'try it out')
        # self.submit_and_compare(10, '', 'best worst case')
        # self.submit_and_compare(
        #     0, '', 'to be sure our strategy works in all cases')
        # self.submit_and_compare(0, 'try to guess', '')

    def test_parametrized_adventure(self):
        """Test a reader's progression through the parametrized adventure."""
        self.init_player(
            '8', 'Parameterized Adventure', 'Hello, brave adventurer')
        self.submit_and_compare(
            'My Name', '', 'Hello, I\'m My Name!.*get a pretty red')
        self.submit_and_compare(0, '', 'fork in the road')
        # TODO(sll): Redo all of the following as a JS test, since the
        # backend can no longer parse expressions:
        #
        # self.submit_and_compare(
        #     'ne', '', 'Hello, My Name. You have to pay a toll')

    def test_huge_answers(self):
        """Test correct behavior if huge answers are submitted."""
        self.init_player(
            '0', 'Welcome to Oppia!', 'do you know where the name \'Oppia\'')
        self.submit_and_compare(
            '0', '', 'In fact, the word Oppia means \'learn\'.')
        # This could potentially cause errors in stats_models when the answer
        # is persisted to the backend.
        self.submit_and_compare(
            'a' * 1000500, 'Sorry, nope, we didn\'t get it', '')


class ReaderClassifyTests(test_utils.GenericTestBase):
    """Test reader.classify using the sample explorations.

    Since the end to end tests cover correct classification,
    ReaderClassifyTests is only checking which of the hard/soft/classifier
    rules triggered on an input.
    """

    def setUp(self):
        super(ReaderClassifyTests, self).setUp()
        self.init_classify_inputs('16')

    def init_classify_inputs(self, exploration_id):
        self.EXP_ID = exploration_id
        self.EXP_STATE = exp_domain.State.from_dict({'interaction': {'default_outcome': {'dest': u'Home', 'feedback': [u'<p>Did not detect. Try again?</p>'], 'param_changes': []}, 'answer_groups': [{'outcome': {'dest': u'End', 'feedback': [u'<p>Done.</p>'], 'param_changes': []}, 'rule_specs': [{'inputs': {u'x': u'exit'}, 'rule_type': u'Equals'}]}, {'outcome': {'dest': u'Home', 'feedback': [u'<p>Detected permutation.</p>'], 'param_changes': []}, 'rule_specs': [{'inputs': {u'training_data': [u'Permutation and combination', u'Permutations', u'Permutations of 3', u'Permutations.', u'The number of permutations is equal n!', u'google permutations of 3', u'6 possible permutations', u'IT IS BECAUSE IF WE APPLY PERMUTATION WE GET SIX', u'permutations rgb rbg gbr grb brg bgr', u'It is a simple permutation, the number of ways to arrange or rank three objects. The counting principal says we multiply the number of possible choices you have at each step, so 3 times 2 times 1.', u'Its a problem of permutation 3!/(3-3)!', u'permutation formula', u'number of permutations is 6', u'sets permutation', u'There are 6 different permutations of how they can be lined up.', u'there will be a 3 factorial permutations to choose', u'permutation of 3 is 6', u'Because of the permutation', u"because it's a permutation problem", u'permutations', u'There are 3! permutations of 3.', u'Permutations of 3 balls factorial', u'Coz you have to find how to arrange three different objects in a straight line that is permutation', u'Permutation of 6 elements', u'Permutations init', u'permutation 3 -\\u003e 3x2x1', u"It's a permutation. 3! = 6", u'bla bla bla permutation', u'Because you can arrange each colour systematically and there are two permutations of each colour', u'There are 3 possibilities for the first ball in line, and 2 for the second ball in line. There will only ever be one possibility for the last ball in line. Using the multiplication rule for permutations: 3*2=6 possibilities in all.', u'complete permutation', u'permutation combination', u'permutation knowledge', u'I used a permutation', u'there are 6 permutations of three things', u'different permutations', u'Permutation of 3 is 6.', u'for the permutations and combination possibilities', u'It is a permutation 3!', u'permutation of 3 items in a set of 3', u'Permutation of 3', u'permutation of color balls', u'permutation 3x2x1', u'Using permutation method the answer is factorial 3 and below is the method. Let us take red ball as R blue ball as B and green ball as G. So we can arrange them in following combination RGB GBR BGR BRG GRB RBG', u'permutation rules', u'because it is a permutation', u"It's a simple problem which i solved using permutation and combination theory", u'Because to figure out the permutations of a set of objects (N) the equation is n*n-1.', u'I think it is 6 because you can start with each of 3 balls and there are two permutations for each start colour.']}, 'rule_type': u'FuzzyMatches'}, {'inputs': {u'x': u'permutation'}, 'rule_type': u'StartsWith'}]}, {'outcome': {'dest': u'Home', 'feedback': [u'<p>Detected combination.</p>'], 'param_changes': []}, 'rule_specs': [{'inputs': {u'training_data': [u'Permutation and combination', u'its a combination', u'3x2 combination', u'It is combination', u'Combination 3 x 2 x 1', u'it have six combination', u'3! = 6 You can choose from 3 balls for the first ball in the line. That leaves two choices for the second, and one for the third. 3 possiblities x 2 possibilities x 1 possibility = 6 total combinations.', u'6 different combinations', u'Because each color ball has to different combinations of arrangments', u'Number of combinaisons', u'total combinations of 3 balls', u'permutation and combination', u'PURE COMBINATIONS', u'Because of 6 possible combintions.', u'permutation combination', u'C(3,2)', u'I know how to calculate combinations', u'for the permutations and combination possibilities', u'combination of tree balls of different colours', u'All combinations', u'Because these are the number of combinations...', u"It's a simple problem which i solved using permutation and combination theory", u'combination', u'Each ball can have two different color combinations', u'Each of the three balls can be the 1st ball. For each of those, there are two combinations for the 2nd and 3rd balls. 3*2=6', u'combinations of 3 taken by 3', u'using permutation and combination', u'3 x 2 x 1 combinations', u'combinations', u'Because of combination.', u'Combination', u'COMBINATION', u'Law of permutation and combination. 3x2x1=6', u'bcse combinations', u'3C3', u'It is a combination']}, 'rule_type': u'FuzzyMatches'}]}, {'outcome': {'dest': u'Home', 'feedback': [u'<p>Detected factorial.</p>'], 'param_changes': []}, 'rule_specs': [{'inputs': {u'training_data': [u'3 balls that can be first with 2 possible variations in position for the remainder. 3 x 2 = 6', u'Because 3 x 2 x 1', u'3 different objects can be placed in 3!(3 factorial) ways', u'you can start with each color and then there are 2 combinations you can make with the other colors', u'2 times 3 = 6', u'3 possibilities for the first ball, and for each of these possibilities two different positions for the remaining balls, hence 3*2=6', u'For every one ball that could be at the start the other two balls could have two orders, so three times two gives six.', u'3 ways for the first ball, 2 ways for the second ball and 1 way for the last ball.', u'because when order matters you take the factoral of number of objects', u'Because the answer is 3!', u'It should be 3 factorial?!? 3X2X1=6', u'three ways for the first 2 ways for second and 1 for the third', u"It's 3! = 6 possibilities", u'Factorial! .... es solo cuesti\\u00f3n de hacer un an\\u00e1lisis combinatorio de colores RBY RYB BRY BYR YBR YRB', u"It's a factorial so you can multiply 3 x 2 x 1.", u'Because for the first ball you have three choices, for the second ball you have two choices, and for the third ball you have one choice. 3 * 2 * 1 = 6', u'The first one on the left can be any one of the three balls, red, blue, or yellow. The middle one can be any one of the remaining two. The right most one must be the remaining one.', u'3 ways to place a first ball then rest two balss for the second place an d the last place is given. 3*2*1=6', u'first ball :3 choices, second ball: 2 choices, third ball: 1 choice', u'the problem can be solved by using Mathematical Law 1*2*3=6', u'3p1 first ball has 3 positions, second ball 2, last ball 1 so 3*2*1', u'3 x 2 x 1 or 3!', u'three options for the first, two options for the second, one for the last. three times two times one.', u'Because 3! = 6', u'first place can be filled in 3 ways ,, leaving us 2 more balls to be placed ,, so second place can be filled in 2 ways ,thus only one more ball to be placed , hence only one way ....thus total number of ways equals 3x2x1', u'It is 3 x 2 x 1', u'3 times 2times1', u'Each ball can start, the remainder can line up in two positions', u'since three balls. first ball has three possibilities, for second position two balls are remaining and for third position one ball is remaining. It results into 3*2*1 =\\u003e 6.', u'There are 3 options for the first ball, two for the second and one for the last.', u'There are three ways to choose which ball goes first. Then there are two balls left to put in the second spot, and only one left for the last spot. That gives 3*2 = 6 total ways to put them in a straight line, which are all different.', u'You can choose 3 balls for position 1, you only have 2 left for position 2 and only 1 ball for position 3. Multiplying 3 *2*1 gives you 6', u'3 choices for the first one, 2 choices for the 2 and 1 for the last position.', u'because 2 * 3 is 6', u'If first is red, then there are 2 possibilities in that line. Same case with yellow and blue. 2x3=6.', u'keeping one ball constant you can arrange the other two balls in 2 ways. So there will be three such instance where we keep one ball constant and arrange the other two ball.', u'Three positions choose one ball to put it first position,have three choices choose one ball to put it second postion\\uff0chave two choices. total ways equals 3*2', u'Because each ball can be first with only two balls after it in order.', u'if we chose the first between 3, we have 2 choices for the 2 and one choice for the last. 3 x 2 x 1 = 6', u'3 different starting balls, each with two possible sequences to follow.', u'3*2*1=3!=6', u'Three can be in the first position then two are left for second then one is leftfor third. 3*2*1=6', u'Factorial 3', u'Two combinations per ball', u'two combinations with each color first', u'there are 2 different ways staring with each different color', u'n=balls n.(n-2).(n-1)', u'after picking the first ball, there are 2 ways to arrange the other balls. so for all three balls, picking one and arranging the other 2 gives 2*3 ways to arrange all the balls.', u'red first with two options for the other balls blue first with two options for the other balls yellow first with two options for the other balls', u'One ball is static and the other two balls can rotate. Do this three times multiplied by two options.', u'starting with Red first there are only 2 ways to order the other 2 colors. with 3 colors to start with that makes 6 total orders', u'Number of ways to arrange 3 balls=3!=6', u'3 times 2 times 1 = 6', u"Each of the three balls can be the 1st ball. For every 1st ball, there's two arrangements of the 2nd and 3rd balls. 3*2=6", u'2 combination with each at first place means 3*2=6', u'3!/(3-3)!== 6', u'3 * 2 *1 / 1', u'y si contesto en espa\\u00f1ol? Porque tomando una posici\\u00f3n de referencia y situando sucesivamente cada una tenemos dos posibilidades por cada bola.', u'3 choices for the first one leaves 2 choices for the second one and then only one choice for the 3rd one. 3x2x1=6', u'for each colour there are two alternatives', u'3! is the right answer', u"It's 3!,3*2*1", u'Because for every one of the balls the other two can have two different positions. 3 balls times 2 different positions equals 6 total positions.', u'There are 3 first balls. Each first ball has 2 possibilities. 3x2=6', u'Since there are three colors, you can only have two possible color orders for each arrangement.', u'You can pick the first in three ways, then the second two ways and that forces the last choice.', u'3!=3x2x1=6', u'3 positions for first ball each with 2 positions for second ball.', u'each ball have 2 ways to be arranged .. so 2\\u00d73=6', u'Because starting with each color, there are 2 combinations', u'Two after each color as the first', u'red can finish in yellow or blue. so there are 2 lines that start with each color', u'the first ball has one of 3 colors the second ball has one of 2 remaining colors 3 x 2 is 6', u'1 by 2 by 3', u'3 options for the first ball, 2 options for the second', u'BEcause 3x2x1=6', u'Because 3 factorial', u'3*(3-1)*(3-2)', u'Because I think 3 . 2. 1', u'3 first balls, 2 combinations after each one. 3 x 2=6', u'because 3*2*1=6', u'Put each color at the beginning of the line and alternate the other two to get two arrangements for each color.', u'Three options for the first place, two options for the second and then one option for the last place. 3 x 2 x 1 = 6', u'(maximum - 1) * maximum', u'there are 3 balls. Anyone of them can be placed in the leftmost position, while there are 2 ways to place the other 2 balls.', u'2 options with each of 3 locations for the red ball', u'3 x 2 x 1 = 6', u'3 factorial combinations', u"Because it's the answer! If you put each color at the beginning of the line, there are only two variations of the line with that color if front you can make (by only switching the other two).", u'3 for the first color 2 for the secont color 1 for the last color', u'all are different and here we can use n! formula 3!=6', u'two can be interchanged while one is static; multiply that by the number of balls to get 6.', u'3 x 2 times', u'Two combinations if you fix the first position ball.', u'There are three balls that can go first, and two possible arrangements of the other two for each of those three.', u'3 possibilities for selecting 1st, 2 for 2nd so product = 6', u'Any of the three balls could be the first one. After that, the other two can be arranged in two ways each time and hence, 6 ways totally.', u'Because there are 3 balls and 2 possible arrangements for each one', u'Each line is composed of three balls. Each time one ball is in the first position there are only two possible ways to finish the line. So, for each color there are two possibilities.', u'Three options for the first ball and two options for the second', u'factorials', u'three choices for the ball on the left, leaves two choices for the ball in the middle, and the last one is fixed.', u'3 faqctorial', u'for first ball you have 3 options to select, for the second ball you have 2 options to select, then the one remaining sits on last. so it is 3 *2=6', u'BECAUSE I HAVE 3 CHOICES FOR THE FIRST AND 2 FOR THE SECOND', u'because you can arrange the colors in two different ways for each line', u'Each colour can be arranged two ways 2x3 =6', u'for each ball, the other two balls can only be arranged in two ways.', u'3 choices in the first position x 2 choices in the second position x one choice in the last position.', u'3 possibilities at the first place, 2 at the second place and 1 at the last place', u'1 x 2 x 3/ 1', u'Each color can be followed by either of the two remaining colors resulting in 6 possibilities.', u"It's a combinatorics problem, and the answer is 3! (three factorial).", u'two ways with red as first two ways with blue as first two ways with yellow as first', u'Because I have 3 options for the first spot, 2 for the second and 1 for the third. The fundamental principle of counting tells me I should multiply 3X2X1', u'for each colour there are 2 arrangements of the remaining balls, so 3 x 2 =6', u'BY USING PROBABILITIE 3*2', u'There are 3 choices for the first ball. Then there will be 2 choices for the second ball, and the last will be predetermined. Thus 3*2=6', u'Using permutation method the answer is factorial 3 and below is the method. Let us take red ball as R blue ball as B and green ball as G. So we can arrange them in following combination RGB GBR BGR BRG GRB RBG', u"it's 3 factorial", u'\\u0423 \\u043d\\u0430\\u0441 \\u0442\\u0440\\u0438 \\u043f\\u043e\\u0437\\u0438\\u0446\\u0438\\u0438, \\u043a\\u0443\\u0434\\u0430 \\u043c\\u043e\\u0436\\u043d\\u043e \\u043f\\u043e\\u043b\\u043e\\u0436\\u0438\\u0442\\u044c \\u043c\\u044f\\u0447\\u0438. \\u041d\\u0430 \\u043f\\u0435\\u0440\\u0432\\u0443\\u044e \\u043f\\u043e\\u0437\\u0438\\u0446\\u0438\\u044e \\u043c\\u043e\\u0433\\u0443\\u0442 \\u043f\\u0440\\u0435\\u0442\\u0435\\u043d\\u0434\\u043e\\u0432\\u0430\\u0442\\u044c \\u043a\\u0440\\u0430\\u0441\\u043d\\u044b\\u0439 \\u043c\\u044f\\u0447, \\u0436\\u0435\\u043b\\u0442\\u044b\\u0439 \\u043c\\u044f\\u0447 \\u0438\\u043b\\u0438 \\u0441\\u0438\\u043d\\u0438\\u0439, \\u0442\\u043e \\u0435\\u0441\\u0442\\u044c \\u0441\\u0443\\u0449\\u0435\\u0441\\u0442\\u0432\\u0443\\u0435\\u0442 \\u0442\\u0440\\u0438 \\u0432\\u0430\\u0440\\u0438\\u0430\\u043d\\u0442\\u0430. \\u041e\\u0434\\u0438\\u043d \\u043c\\u044f\\u0447 (\\u043b\\u044e\\u0431\\u043e\\u0439) \\u043c\\u044b \\u043f\\u043e\\u043b\\u043e\\u0436\\u0438\\u043c. \\u0423 \\u043d\\u0430\\u0441 \\u043e\\u0441\\u0442\\u0430\\u043d\\u0435\\u0442\\u0441\\u044f \\u0434\\u0432\\u0430 \\u0432\\u0430\\u0440\\u0438\\u0430\\u043d\\u0442\\u0430. \\u042d\\u0442\\u043e 3*2. \\u0418 \\u043f\\u043e\\u0441\\u043b\\u0435\\u0434\\u043d\\u0438\\u0439 \\u043c\\u044f\\u0447 - \\u044d\\u0442\\u043e 1 \\u0432\\u0430\\u0440\\u0438\\u0430\\u043d\\u0442. 3*2*1 = 6', u'There are 3 possible first balls. For each on, you have two possibilities to arrange the remaining balls.', u'3 choices for the left hand place, then 2 for the middle for each of these to fill out the possibilities.', u'3 times 2 times 1', u'3 choices for the first spot, 2 for the second spot, and 1 for the last spot', u'because 3*2*1', u'You have three options for the first ball, two for the second, and one for the third. 3 x 2 x 1', u'There are two ways to line up the balls after for each ball', u'2 combinations for each ball', u'Each ball can be combined with the other two in two different arranges.', u'3 multiplied by 2 by 1', u'3 for first 2 fr second and one for third', u'I will have three possibilities for the first row, two for second and one for third', u'for each color starting ball (3), there are two possible arrangements (x2)', u'son 3 y tienen dos opciones de cambio cada una', u'3 X 2 X 1 options.', u'choose first one in three way, second one in two way, so 3 times 2', u"it's 3 X 2 X 1", u'there are 3 ways fo arranging the first ball and then 2 ways of arranging the second', u'factorial 3', u"Because it's 3 factorial - i.e. 3+2+1", u"it's 6 because when you start with 1 colour there are 2 option after it and then repeat the pattern with the other two balls in 1st place", u'because there are two ways of each color', u'Every ball has 2 possibilities of combinations against the other balls', u'becasue there is two possibilities for each balls', u'3 options for the first ball in line, 2 options for each of the first 3 for the second position, 1 option for the remaining one for each. 3*2*1=6.', u'Two starting with red, two with yellow and two with blue', u'3*2*1 = 6 ways', u'i have learned that F3 =3*F2=3*2=6 AND WE CAN ARRANGE IT IN 6 WAYS 1-RBY 2-RYB 3-YRB 4-YBR 5-BRY 6-BYR', u'Each colour takes a turn at being in front of first one colour and then the other.', u'factorial', u'Starting with one color then changing the other two after it can be done 3 times. So, 3 starting colors times 2 variations each equals 6 arrangements.', u'there are 3 options for the first space then 2 then 1', u'I used the formula 3!', u'There are three options for the first ball in the row of three. There are two options for the second spot in the row. There is only one ball left for the last spot. So: 3*2*1 = 6', u'because to arrange n different object in a straight line is equals to factorial of n.', u'because n-faculty = 3 times 2 times 1 in this case and solves with 6', u'each color you put first has 2 ways to put the other colors, there are 3 colors and 2 ways to arrange the other balls 3 times 2 equals 6', u'because it is 3!', u'put the red ball first and then the other two balls plus put the blue ball first and then the other two balls plus put the yellow ball first and then the other two balls', u"Because it's really 6. The general case is 'n!'.", u'You can put any one of the three ball in the first position. Two balls will be left to put in the second position. That will leave one ball for the last position. Therefore the solution is 3!.', u'it is because there are 3 times f2 ways to do it and f2=2 times 1 so 3 times 2 times 1 is equal to 6.', u'If we start with the red one, there are two possible combinations. Multiply by three because there are three possible balls to start with.', u'3x2x1 = 6', u'the factorial of 3', u'Because each color can start two lines, and two times three is six', u'because each ball can only be at the front with two other combinations thereby totalling 6', u'3 times 2', u'there are 3! combinations possible.', u'keeping the same starting ball, there are 2 combinations of the remaining 2 (i.e. red - blue/yellow or yellow/blue). there are 3 starting balls, so 3*2=6', u'C3 pick 3 means 3!', u'Each color can be first in line which gives three option. Then with the same color first in line, the other two colors can be switched.', u'because per ball only two balls can come second', u'3 in the first place 2 in the second place 1 in the third place', u'you have 3 ways to place the first ball, 2 to place the second and 1 to place the third. 3 times 2 times 1 = 6', u'Because 3 times 2 Times 1 Equals 6', u'Pick the first color, then there a two ways to arrange the other balls. there are three choices for the first color. 3 * 2 = 6', u'3 possibilities for the 1st one and 2 possibilities for the 2nd one', u'3 colors and 2 different ways to arrange group starting with each of the colors', u'If you start with each of the three colors as the first ball in the line, then there are only two options for each starting color. 3 x 2 = 6', u'There ball can be arranged in 6 ways like 1 . Red-Blue-Yellow 2. Red-Yellow-Blue 3. Blue-Red-Yellow 4. Blue-Yellow-Red 5. Yellow-Red-Blue 6. Yellow-Blue-Red In mathematical formula its just 3 objects can be arranged by Factorial (3) = 3*2*1= 6', u'I thought about each of the positions that the red ball could have (3) and how the blue and yellow balls could be arranged for each of those three (2 per). 3x2=6', u"Because there are 3 balls, so there are 3 ways of selecting first ball. After selecting the first ball, there are 2 ways of selecting remaining 2 balls. So that's 3x2=6.", u'3 possible for first one, 2 possible left for second , 1 for last. 3x2x1 = 6', u'3 choices for first ball, 2 for second, 1 for third. 3*2*1=6', u'Each of the three colors has two different subsequent color options resulting in a total of six different ways', u'3 in the first position, then 2 in the second one and only 1 in the last', u'The first ball can be R, Y or B and in each case there are two ways to put the other two balls.', u'because there are 2 combinations for each color and there are 3 balls so 2 x 3 = 6', u'2 position can be taken 3x2', u'Three options for the first ball, two options for the second one and the third one is determined. Three times two times one equals six.', u'First move blue to red and yellow (2 moves). Then move red to yellow and blue (2 moves). Then yellow to blue and red (2 moves). As a result we have 6 moves.', u'each ball can be in one of 3 positions. The other balls can then be in one of 2 positions. 3 x 2 = 6', u'two way to arrange two remaining balls behind each one of the three colours', u'Three ways for first one, two for second, and one way for the remaining. Fundamental counting principle.', u'Because first you have 3 balls to choose from, for the second ball you have 2 options and for the last ball you have 1 3*2*1=6', u'3 x 2 x 1 (3 factorial) rby ryb yrb ybr byr bry', u'let the number of balls = n, then: y = n! so that in the case of 3 balls, we have 3 (the first ball can be one of three colors) x 2 (the second ball can be one of only two colors, since the remaining color was already used) x 1 (since only one possibility exists for the final color).', u'three possibility for the first ball, x two possibility for the second ball and then 1 possibility for the third, gives you 3x2x1=6', u'Factorial of 3', u'3 multipled by 2 muliplied by 1 because there are 3 possible options for the first spot, two for the second and one for the third', u'it is a factorial 3! = 3x2x1=6', u'Start each color once and rotate the other 2 balls in 2nd and 3rd position.', u'If each color is placed in the left hand spot, the other two can be in second or third spot, making two options. Two options times three balls equals six.', u'to arrange them in straight 3 balls are in line. therefore 1st one has 3 candidate, then 2nd one has 2 last one has 1 . then 3x2x1=6', u'Because 3!', u'2 combinations per colour', u'Putting each different color ball first would have two options left for the other two balls.', u'One ball starts line and the two left can only be in two positions. 3 x 2 = 6', u'factorials man', u'The first ball is one of three, the second ball is one of two and the last ball is determined by the previous choices. This makes 3 times 2 orders in which the balls may be placed in.', u'Because 3x2=6', u'Factorial', u'Each ball can be placed in any of three positions twice without duplicating the pattern. Two times three is six.', u'3! = 3 \\u00d7 2 \\u00d7 1 = 6', u'3 * 2 * 1 = 6', u'because 2 multiplied by 3 is 6', u'3! = 3x2x1', u'2 if the red is first, 2 if the blue is first and 2 if the yellow is first.', u'For each starting ball color, there are two ways to arrange the remaining balls.', u'each ball has two position for each other balls: 2 x 3balls = 6', u'3P3 = 3!/(3-3)! = 6', u'There are 3 ways of choosing the first ball, 2 balls left to choose for the second, and one left for the third. Three times two times one is six ways of arranging three balls.', u'three different colors, each color has twice the times to pair with the other color in a straight line.', u'First one, three selection, For each selection there are two arrangement for next two balls.', u'1 ball first has two possible arrangements after it 3 balls x 2 arrangements each = 6', u'Because starting with each color, each has two different sorting options.', u'three choices for the first ball, two choices for the second one, 3*2=6', u'assuming first ball is red, there are 2 ways in which you can arrange the remaining balls. same if the first ball was yellow or blue.', u'Because 2 x 3 = 6', u'_ _ _ Three locations to fill with 3 balls which are different from each other So the first position can be filled in 3 ways with 3 different colored balls Once the first position is filled there will be 2 balls left and 2 positions to be filled So the second position can be filled in 2 ways and in the same logic the final position can be filled in one way _ _ _ 3X2X1 = 6 Multiplication is used because its an AND condition', u"Let's choose the first one: say Red for instance. With that red first, there are only 2 solutions to arrange yellow and blue. It makes then 2 possibilities with red first. It works the same way if yellow or blue has been chosen first, with 2 possibilities for each. Finally, it makes 3 times 2 possibilities then 6. That's the answer", u'Because there are 3*2*1 possible arrangements', u'There are 3 possibilities for the first position, then 2 for the second, and 1 for the third. 3x2x1=6', u'It is 6 because 3 x 2=6', u'Each ball has two options with the other two balls - so 2 options per 3 balls - 2 x 3 = 6', u'Because Red, Blue or Yellow can be first in the line. Then that it followed by the other 2 balls in 2 possible combinations. so thats 3 for the first ball multiplied by two options for the last 2 balls, which equals 6', u'because every colour can be twice at a place', u'Three first ball options times 2 second and third ball options', u'I think it is 6 because 3x2=6.', u'When starting the line with one colour there is one other way you can arrange the line whilst keeping the first ball the same, multiply this by the 3 different balls gives you a total of 6 different options', u'Each ball can be connected only in 2 Ways each, since there are 3 balls then the answer is 6.', u'because i create 3 groups of 2', u'For every ball there are two ways to arrange it 2*3=6', u'3 * 2 * 1', u'There are 3 possibilities to select the first ball, 2 possibilities for the second and just one for the third. 3*2*1 = 3! = 6', u'each starting colour only has 2 variations. 3 colours times 2 variations equals 6 total ways to arrange them in a straight line.', u'each color can make with it two color arrange of the rest of the colors for example: R -\\u003e BY \\u0026 YB so, 3*2 = 6', u'3 options for the first, two for the second, and the third is determined.', u"Because it's 3! ways or permute 3 objects on a line", u'3 colors by 2 by 1', u'3 ways to choose the 1st, 2 for the second, then only one ball left!', u'Because 3x2x1 = 6', u"because it's 3 factorial", u'because there are two options with each ball in the first place', u'3 in first spot, 2 in second, 1 in last', u'each of them can have two other positions', u'each color have 2 ways to arrange the color. Since we have 3 colors x 2 colors...', u'Por qu\\u00e9 s\\u00f3lo existen dos maneras de colocar las pelotas por cada color', u'3! -- 3 choices for first position, 2 choices for second position, and 1 choice for the last position', u'You have three choices for the first place in line, then two for the second and one for the third. 3 x 2 x 1 = 6', u'3! = 3*2*1.', u'My teacher tolf me the anser was 3!', u'three in one place, 2 in other and one more. multiply', u'2 different orders with each of the 3 balls in front', u'For each color in the first position there is only 1 alternate arrangement. do 3 color times 2 arrangements equals 6 arrangements.', u'it\\u00b4s 3!', u'it three times two times one', u'each ball standing first place in the line has two different ways 3*2', u'the first ball is any of the 3, the 2nd ball is limited to the remaining two, and the last is determined by the first two choices. the equation for this is 3 * 2 * 1 = 6', u'Because 3 * 2 = 6.', u'Three choices, two choices, one choice.', u'Unique ways equals number of ways for ball one times the number of ways for ball two times the number of ways for ball three, ie. 3 * 2 * 1 = 6.', u'Each Ball can be the first : 3x The two other ones are then even first or second : 2x 3x2=6', u'3 factorial', u'factorial of 3', u'Three times two variations', u'3*2*1 faculty', u'We can pick the first ball in 3 ways. For each of those selections we can select the second ball in two ways which automatically selects the last ball. Hence total number of arrangements = 3 x 2 x 1 = 6', u'For each ball starting a line there are 2 remaining, which means they can be arranged 2 ways. This is multiplied by the total 3 balls and equals 6', u'Because 6! equals 1x2x3=6', u'3!=3*2*1=6', u'three factorial', u'3 choices for first, 2 for second, 1 for last, ergo 3 * 2 * 1 = 6', u'There are three ways to choose the first ball, two ways to choose the second ball, and one way to choose the last ball.', u'For first ball there are 3 choices. For second ball there are 2 choices. And third ball there is only one choice. So total = 3x2x1 = 6 choices', u'Starting with one colour there is two option. And there is three colour.', u'3 options for the first ball. For every first ball, 2 options for the 2 last balls. 3 x 2 = 6', u'3! = 3 * 2 * 1 = 6', u'3 options for the first spot, leaving 2 for the second and one for the third. you would then multiply all 3 to get the answer.', u'3! = 3*2*1 = 6', u'Because 3*2*1', u'Because 3x2x1=6', u'Three different starting colors. For each starting color, two ways to put the other two down.', u'3 factorial is 6', u'the first ball can be fixed using three colors and the rest two can be rearranged.', u'Because whatever ball we start with, there is always two possible orders to set the other two balls. Three times two equals six.', u'There are three balls and two variations on every sequence that begins with a different color.', u'Two ways with each colour first.', u'3 x 2 x 1 combinations', u'Because each ball has two configurations', u'3! = 6 or : you can choose 3 positions for the first (and leave the others as is), and 2 for the second and 1 for the last --\\u003e 6', u'3!=6 The order matters so no need to divide by n', u'3 x 2 = 6', u'3 times 2 times 1 is 6', u'3 ways for position 1, 2 for position 2 and 1 for the final position', u'three possibilities for the first, two possibilities for the second color', u'3 balls possibilities for the first position, 2 for the second and 1 for the third. 3 * 2 * 1 = 6', u'three possibilities for the first ball, times two possibilities for the second two balls.', u'Three factorial', u"It's the factorial", u'3 Times two Times one', u'3 ways to chose the first ball times 2 ways to chose the second', u'3 X 2 X 1 =6', u'3\\u00d72\\u00d71=6', u'3! = 3 + 2 + 1', u'I vaguely remembered that I should use the factorial equation.', u'There are three ways of selecting the colour of the first ball, then two ways of selecting the colour of the second ball and one way of selecting the colour of the last ball. So in effect it is 3x2x1 number of ways to arrange the 3 coloured balls in a line.', u'\\u4e09\\u4e2a\\u7403\\u6392\\u5217\\u7ec4\\u5408 3\\u00d72\\u00d71=6', u'First I hav 3 choices, then 2 then 1', u'because 3 ways to do the first one, 2 ways to pick the second one, and one way to pick the third', u'The first ball can go in 3 places, the second in 2 and the third ball goes in the space left.', u'The first can be chosen in three different ways, the second in two ways and the last one just in one way, consequently the product is 3*2*1 = 6.', u'Each ball can only start the line once, and each time it would have a different sequence of the 2 other balls.', u'Each ball in the first position has two combinations of lines 3x2', u'There are 2 ways to order the balls with a different color at the start of each line. Since there are 3 different colors and 2 ways to arrange each, 2x3=6.', u'Because three times two is six', u'There are three possibilities for the first location, two possibilities for the second location, and one possibility for the third location. 3 x 2 x 1 = 6', u'each ball has two option', u'Each of the 3 balls can be first. The remaining 2 balls can be arranged 2 ways. 3 times 2 is 6.', u'Each color can start the line will have two variations following 3 x2', u'Because 3*2*1 is 6', u'Because it is 3 times 2', u'J en zi fixe 1 puid 2 pisdibilites et cela 3 fois', u'3 X 2 X 1 = 6', u'Each ball can be a the start. Then two balls can be in the middle. So 3 x 2', u'for the first position, i have 3 possibilities, and for second at each of three, 2 and at last only one, and so, answer is 3 multiplied by 2 i.e., 6.', u'each ball can only lead two times', u'3! = 3 X 2 X 1 = 6', u'First ball can be of any color among three (for that we have three ways), after the first ball has been selected two balls are there of remaining two colors. Now second ball can be selected of any color among the remaining two (for that there are two ways), now the remaining ball is the last ball of remaining color (for that we have only one way). Now we have to multiply the ways because the events were independent. Eventually we get the answer as 3*2*1=6.', u'because 3 x 2 x 1', u'3 DIFFERENT COLOURS EACH HAVE 2 COMBINATIONS', u'Three colours, each ball can be the beginning of the line twice which equals six', u'red-blue-yellow(r-b-y) r-y-b b-r-y b-y-r y-r-b y-b-r and 3!', u'For one ball fixed, other two can arrange in two ways, the fixed ball can be in three places, so a total of six', u'because we have 3 colour and if we fix one, two place for each ball. Thus 3*2=6', u'Because there are three balls and each can be in each position twice', u'First three choices, than two and finally one', u'2 for each color', u'3 possible ways of placing the red ball. After that, 2 possible ways of placing the yellow ball. After that, only one place remains for the blue ball. 3*2*1=6', u'With red at front, we have two options for blue and yellow. With red in the middle, we have two options for blue and yellow. With red at back, we have two options for blue and yellow.', u'Well, any one of the balls could go at the start of the line. Then for each choice of the first ball there would be just two ways to choose the next one and then only one ball left to go at the end.', u'Because we have two possibilities for each ball', u'For each choice of the first ball, there are two possible orders for the remaining balls.', u"Because it's 3! = 1 * 2 * 3", u'because you can put each ball in the middle 2 times each', u'factorial of 3 is 6', u'We can choose 1 of 3 at first position of the line, 1 of 2 (the rest), at second position, and the final one at third position. This means that there are 3 by 2 by 1 = 6 patterns in the order.', u'Each ball must take the starting position once (3), then each of the other balls can only be arranged in two ways (2). 3x2 = 6', u'Three, where each one is in the center, and another three, where the ones on either side are swapped.', u'There are 3 possibile combinations for the first ball, then 2 for the second and only 1 for the third', u'You can arrange them directly using a table or you can see that this is a combinatorics problem and so 3!', u'You can put each colour to be the first in a line and then two ways to arrange the rest of the colours, hence 3x2.', u'Because you multiply 3 by 2', u'3x2 if i choose the color of the first ball i habe two choices To arrange the other two balls. And i habe three choices for the first ball.', u'The combination is 3 x 2 x 1 = 6', u'If I took one color then there is only two other options for the next two to follow in line.', u'for each color there are two possibilities.', u'2 possibilities for each 1st ball of each colour', u"Because it's 3!", u'n-factorial will find the number of ways you can arrange n things', u'I have 3 options to put one of this three balls first , then I have two options to place two balls and then one last option , so 3*2*1=6', u'3x2= 6 combinations', u'There is 3 ways to fix the first ball. And for each, there is 2 ways to arrange balls two and three.', u'There are 3 different positions for red. For each of these there are 2 positions of yellow and blue. 3*2=6', u'each of the 3 colours can be followed by the other 2 colours in either order = 3*2', u'The probability of the arrangements is 3 by 2', u'just as i stated, 3!', u"For the first ball it's 3 places For the second it's 2 places (Ball 1 already used it's place) For the third it's 1 place (Balls 1\\u00262 used it's places)", u'Because every ball can be first ball once. Then there are 2 ways of setting the other two balls. So 3 times 2 is 6.', u'Starting with every of the three colours you have to choices.', u'There are 3! ways to arrange them. Three choices for the first, two for the second, and only one left to place third.', u'Because 3! factorial is 6.', u'I have three choices for the first position, two for the second position and just one for the last position, so it is 3 times 2 times 1.', u"each color can be first, that's 3 choices... each of those has two possible arrangements of the other 2 balls", u'because each ball can be in one of three places (First,Second,and last) withe two arrangements to other 2 balls', u'Every color can be at every position while the other two get to swap the remaining positions.', u'3 possibilities for first slot, 2 for the next slot and 1 for the last slot', u'1 ball can be arranged on\\u200bly 1 way 2 balls can be arranged only 2 ways: 12 or 21 3 balls can be arranged just 2 balls but each time we take 1 ball away. We have 3 * 2 = 6.', u'Because I can start with one of the 3 balls, which leaves 2 for the second position. 3x2 = 6', u'each of the three colors defines two possible sets', u'All ball to be the first twice', u'each can be the lead with two combinations following it', u'each color can go first. That is 3. The second 2 balls can be switched for each first ball color.', u'3 choices for the first place at the left, 2 choices for the second place at the right of the first ball, and than you have to place the third ball.', u'Because the first ball has 3 options, then the next ball has 2 options, and last their is only one choice left.', u'red ball may be placed by 3 variants blue ball may be blaced by 2 remained variants yellow ball goes to remaining position 3*2*1 or 3!', u'Each position has three options (in terms of which coloured ball can be placed there), however once one ball has been placed, the next position is reduced to only two options, and the last position will be reduced to one option. 3 * 2 * 1 = 6', u'First three choices, then two, last one is clear', u'Porque es factorial de 3', u'The first position can be occupied by one of the three balls, so 3 possibilities, the second position can be occupied by one of the 2 balls, so 2 possibilities, and the last position..one ball...so 3X2=6', u'Each of 3 balls can be treated as the first ball, leaving two ball that can then only be arranged in 2 ways. Therefore there are 3 x 2 = 6 ways to arrange the balls.', u'three choices for the first one, two for the second and one for the third. Multiply them.', u'3 for first position, 2 for second position, 1 for last position 3*2*1=6', u'1 colour in front, 2 variations left (3*2)', u'because there are three options for which ball is first, and 2 options for each of those first balls as to which ball is second. And 3x2 is 6.', u'3*2*1 3 choices for the first ball, then 2 remain for the second, then only 1 choice remains for the third.', u'Three options for the first ball and two options for each of the remaining balls.', u'3 ways to start and then two ways for each to finish. 3 * 2 = 6', u'3 times 2 equal to 6', u'because I know factorials', u'each ball has 2 propable arangements with the other 2 balls .', u'It is 3! ways which I can arrange where as 3! means 3*2=6', u'if you choose one of then you only have another way to arrange the other two. this happens with the three colors as the first ball, then 3x2 is 6', u'cause it equals 3!', u'there will be a 3 factorial permutations to choose', u'3 choices for the first ball, 2 for the second. Factorials.', u'3 factoral', u'3 different starting colours then paired with the remaining colours in one of 2 configurations.', u'2 for each ball', u'3 Factorial', u'3 x 2 x 1', u'For each color ball in the first position there are two position variations for the other two balls.', u'three positions. choose one ball to put it first position. three choices. choose one ball to put it second position ,two choices 3*2', u'There are three possibilities for the first ball, two for the second once the first has been selected, which leaves one remaining. Hence 3x2x1 = 6', u'Because for the first place, I can choose three of them. For the second place, I can only choose two. And I have no options for the third place.', u'Three choices for the first on and two choices for the second one', u'three choices for the first ball; two choices for the second', u'Each of the three balls can be the 1st ball. For each of those, there are two combinations for the 2nd and 3rd balls. 3*2=6', u'3! = 1*2*3=6', u'Because every three color has two possibilities to be the first in row. So, 3*2=6', u'Assume there are three positions for ballis in a straight line. It is possible to put one of the three balls in first position. Hence, 3 ways to arrange. Let us assume we did it. It is then possible to put one of two remaining balls on the second position. It means that each of those three ways lead to two additional ways. Assume we arranged the balls on two positions. The ball color for third position is defined, because the first two positions are already occupied with certain balls. As far as there were three ways, that lead to two ways, every of which leads to only one way, the number of all possible ways is 3*2*1 = 6.', u'Because in the first position you can put each of the three balls, then in the 2nd you will only have 2 balls left and in the last you only have 1 ball to put.', u'3 factorician', u'3 balls have two ways each', u'given n balls and by taking any one as a starting ball, there are (n-1, two in this case) possibilities to line the remaining ones. So the total number of combinations is n * (n-1) = 3 * 2 = 6', u'Any of the 3 balls can go first then 2 and finally 1.', u'because 6 = 3!', u'Because 1 times 2 times 3 is 6.', u'!3 = 3*2*1 = 6.', u'3 times 2 is 6', u'3 choices, then 2, then one.', u'For each starting colour there are two possible options', u'3!X2!X1!=6', u"Because this is the second time I've done this, and I answered it right the last time, too! I even used factorial in the answer!", u'every ball has three possible positions. So for the first ball number of possible positions is 3. For the second ball only 2 possible positions left. Third ball has only 1. Therefore, number of total ways to arrange them in a line is 3*2*1=6', u'With each ball (3) placed first, the other two can be rearranged two ways (2). 3 * 2 = 6.', u"Because it's the factorial number of 3, due to the combination of 3 balls.", u'6 = 3 ! = 3 * 2 * 1', u'1 * 2 * 3', u'first ball is one of 3, second in one of others 2, last is fixed: 2 * 3', u'for each position of a ball, there are two different combinations for the balls either side', u'Permutations of 3 balls factorial', u'three times two ways. Every color as first (3) in two ways.', u'There are 3 balls but 2 ways for each ball to be at the front. 3x2 =6', u'3 FACTORIAL', u'Each color can be first with the second and third balls interchange', u'Lets, choose a color then there will be 2 cases of arrangements. this imolies on each color, total color=3, cases=2, so answer is 3*2=6.', u'For the first ball there are three choices. For the second only two choices left. Last ball adds no extra combinations hence 3 times 2 equals 6.', u'fisso un colore e ho due possibilit\\u00e0, fissando le altre colore succedo lo steso, quindi 3 fissi con due combinazioni, 3 x 2 = 6', u'First one of the colors and then the two that were left can be arranged in two ways. This can be done to other two colors as well. 3*2=6', u'3 balls time two time one', u'Red ball: three possible positions. Two positions for yellow and blue in every red ball possible position. Result: 3 times 2.', u'because you can have each colour first twice', u"It's 3! So 3x2x1", u'3 total balls times two possible orders for the remaining two balls.', u'3 choices for first place and 2 choices for second.', u'There are 3 different balls that can start your line, when you place the first one only 2 combinations are possible after, this makes the equation 3 x 2', u'3*(3-1)=6', u'3*2*1 = 6 three possibilities for the first position, 2 possibilities for the second position and 1 possibility for the last position, multiplied is equal to 6.', u'Because that is the outcome of 6!', u'there is 3 colours of balls. so i named them in letters abc. for every letter in first place other balls will be changing 2 times. so there is 3 letters, 2 x 3 is 6. even i practically thought about it. so it came correct.', u'Permutation', u'There are 3 choices for the first, and 2 choices for the second, and only 1 choice for the last. 3*2*1 = 6', u'3 different options for the first ball and after that there is 2 different options left per option: 3x2=6.', u'each ball can have 2 diff positions in relation to the others', u'3 possibilities for the first place, 2 for the second, 1 for the third 3*2*1 = 6', u'For each ball starting there are only two options for the rest of the balls. Three sets of two.', u'each color has two way to arrange the other color, for example: R -\\u003e BY \\u0026\\u0026 YB so, 3*2 = 6', u'first color can be placed in any 3 ways, second color can be placed in rest 2 ways. third color can be placed in only 1 way. Hence total 6 ways.', u'there are three colours; the first ball is constant and we have 2 options what we can change ex.: R B Y; R Y B; and we game with the 3 ball ; 3*2 is 6', u"If we are given 'n' things, then the ways in which these n things can be arranged in straight line is n! (I.e. n factorial). n! = n(n-1)(n-2)(n-3)..... (3 )(2)(1).", u'Because there are 2 iterations for each ball', u'On the first position you can choose from all three balls. Then for the second position there are only two balls left to choose from. The third position will leave you with the remaining ball. 3*2*1 = 6', u'Each ball can only appear once. There are 3 possible balls in the first position, 2 in the second, and 1 left in the third (based on the first 2). 3*2*1=6.', u'Each color can be in the first position exactly twice', u'6 = 3 * 2 * 1', u'Fix one and the two other balls can only be arranged toe ways', u'There are 3 options for the first ball, then two options anthem only one so you have 3*2*1', u'simple... its 3 factorial', u'Because 3*2*1=6', u'Because for each ball in the first position, there are two possible placements of the other two balls.', u'There are only one ball for each color. Put red in the first, there`s only two possibilities. The same occur to next two balls.', u'3 balls x 2 ways', u'For the first ball, you have 3 choices. For the second, you have 2. For the third, you have 1. 3*2*1 = 6', u'Each color first and the other two colors in second or third', u'porque la primera bola solo puede ponerse de 3 maneras, la segunda de dos y la tercera de una', u'3 possibilities for the first ball, 2 for the second, 1 for the third', u"For each staring couloue there's two combinations 3 x2 = 6", u'for each of the 3 balls, there are only 2 possible orders for the remaining balls', u'3 times 2 combinations', u'3 possibilities for the 1st place, 2 - for 2nd and 1 - for 3rd. Multiply.', u'Using the concept of factorials. The answer would be 3! Ie. 3x2x1', u'We can choose any of the 3 balls for the first spot. Once the first ball is chosen, we will have 2 ways to choose for second spot, and once we choose a ball for first and second, we have only one remaining to choose from. So it is 3 x 2 x 1 = 6', u'No of ways for arranging 3 balls= 3!', u'every ball will stay in its place twice while the other two changes its places', u'for arranging 3 balls , we find out this one by factorial of a number so factorial of 3 is 6 .', u'because I can put each of the balls in front (3 options), and then for each of the 3 options, and can rearrange which ball is first and second for each of the first three, which gives me a total of 6', u"The first one can be any one of the 3, then I have a choice of 2 for the second position, and then there's only one left. 3*2*1 = 6", u'3 times 2 time 1', u'Combination 3 x 2 x 1', u'I did a factorial of 3.', u'If each ball is the first in a straight line that leaves two possibilities for the order of the other two balls. So for each color there are two arrangements that will work without repetitions.', u'when i put each one first, i have 2 options', u"It's 3 choose 3 or 3!", u'There are 3 to choose from at the start, then there are 2 for the second position, leaving the last one for the last position.', u'There are three of them, suppose that anyone of them placed in a positions, there are two ways to place the other two.', u'the first position has 3 choices the second 2 the last one', u'the first ball you have 3 possibilities the second ball only 2 and the third ball only one 3x2x1 = 6', u'3! = 3 * 2 * 1', u'3 choices x 2 choices x 1 choice', u'3 options for first ball, 2 for second', u'Each color has two possibilitie to arrange the other colors. 3*2=6', u'3\\u00d72\\u00d71', u'There are three choices for the first ball, two for the second and one for the last.', u'BECAUSE EACH COLOUR HAS 2 WAYS', u'Each color can be the leader and then there are two ways for the other balls to be arranged. So that makes 2 ways to arrange with each ball being the leader 3 x 2', u'3 balls can be arranged in !3 ways in three places.', u'3 balls 3 colors= 6 ways', u'1\\u04252\\u04253=6', u'each color has two cominations.. 3*2', u'there are 3 choices for the first ball in the line, 2 choices for the second ball in the line, and then only 1 choice for the third ball in the line. 3x2x1 = 6', u'3 choices for the first ball x 2 choices for the second ball x 1 choice for the third ball', u'There are only 2 different options when each colored ball is first.', u'Any of the three balls can be first, and the other two balls can be arranged in 2 possible ways. 3 * 2 = 6.', u'3 factorial is 3*2*1=6', u'Two arrangements for each ball', u'because each color can only occupy each position twice', u'2 different ways per color', u'Three for two for one', u'With each color first ball there are 2 combinations', u'I know you do this by multiplying 1 x 2 x 3 because you have 3 balls', u'There are n x n-1 combinations']}, 'rule_type': u'FuzzyMatches'}]}, {'outcome': {'dest': u'Home', 'feedback': [u'<p>Detected listing.</p>'], 'param_changes': []}, 'rule_specs': [{'inputs': {u'training_data': [u'red blue yellow red yellow blue blue red yellow blue yellow red yellow blue red yellow red blue', u'red blue yellow red yellow blue blue red yellow blue yellow red yellow red yellow yellow yellow red', u'permutations rgb rbg gbr grb brg bgr', u'RBY RYB BRY BYR YBR YRB', u'RBY RYB YBR YRB BYR BRY', u'ryb, rby, bry, byr, ybr, yrb', u'red yellow blue, red blue yellow, blue yellow red, blue red yellow, yellow red blue, yellow blue red', u'Red, blue, yellow Red, Yellow, Blue Blue, Red, Yellow Blue, Yellow, Red Yellow, Red, Blue Yellow, Blue, Red', u'Factorial! .... es solo cuesti\\u00f3n de hacer un an\\u00e1lisis combinatorio de colores RBY RYB BRY BYR YBR YRB', u'red-blue-yellow, red-yellow-blue, blue-red-yellow, blue,yellow,red, yellow-red-blue, yellow-blue-red', u'i have learned that F3 =3*F2=3*2=6 AND WE CAN ARRANGE IT IN 6 WAYS 1-RBY 2-RYB 3-YRB 4-YBR 5-BRY 6-BYR', u'Two with red in front (YB, BY), 2 with Yellow in front, and 2 with blue in front', u'R Y B R B Y B Y R B R Y Y R B Y B R', u'ABC, ACB, BAC, BCA, CAB, CBA', u'because i arraged them in my mind', u'red yellow blue red blue yellow blue red yellow blue yellow red yellow blue red yellow red blue', u'Byr, bry, ryb, rby, yrb, ybr', u'rgy ryg bry byr ybr yrb', u'I made a list of all the different ways.', u'there are 6 different orders i.e. red blue yellow, red yellow blue, blue red yellow, blue yellow red, yellow red blue, yellow, blue, red', u'Red Yellow Blue Red Blue Yellow Yellow Red Blue Yellow Blue Red Blue Red Yellow Blue Yellow Red', u'R:Red B:Blue Y:Yellow RBY RYB BYR BRY YRB YBR', u'red first yellow second blue third red first blue second yellow third and so for the another two balls', u'there are 3 balls that can be arranged xyz,xzy,yxz,yzx,zxy, and zyx', u'red-blue-yellow red-yellow-blue blue-yellow-red blue-red-yellow yellow-red-blue yellow-blue-red', u'Using permutation method the answer is factorial 3 and below is the method. Let us take red ball as R blue ball as B and green ball as G. So we can arrange them in following combination RGB GBR BGR BRG GRB RBG', u'yellow red blue yellow blue and red blue yellow red blue red yellow red yellow blue red blue yellow', u'red blue yellow, red yellow blue, yellow red blue, yellow blue red, blue yellow red, blue red yellow', u'I visualized the problem and could only see 6 combinations', u'red blue yellow red yellow blue yellow blue red yellow red blue blue red yellow blue yellow red', u'R G B R B G G R B G B R B G R B R G', u'red blue yellow red yellow blue', u'RYB RBY RBY RYB YBR YRB', u'rgb rbg gbr grb bgr brg', u'123 132 213 231 312 321', u'R-G-B R-B-G G-R-B G-B-R B-R-G B-G-R', u'You give the balls numbers 1 2 3, so all the possibilities are: 1 2 3 1 3 2 2 1 3 2 3 1 3 1 2 3 2 1', u'RBY, RYB, BRY, BYR, YBR, YRB', u'There ball can be arranged in 6 ways like 1 . Red-Blue-Yellow 2. Red-Yellow-Blue 3. Blue-Red-Yellow 4. Blue-Yellow-Red 5. Yellow-Red-Blue 6. Yellow-Blue-Red In mathematical formula its just 3 objects can be arranged by Factorial (3) = 3*2*1= 6', u'1 red 2 - yellow 3 - blue 123 132 231 213 312 321', u'Red, blue, yellow Red, yellow, blue Blue, red, yellow Blue, yellow, red Yellow, red, blue Yellow, blue, red', u'rgb rbg grb gbr rgb rbg', u'123/132/213/231/312/321', u'123, 132, 213, 232, 312, 321', u'Red first followed by each of the others then flip. Repeat with all balls.', u'I went through the options in my head', u'Rby Ryb Bry Byr Yrb Ybr', u'Yellow blue red Red Yellow Blue Red Yellow Blue Red Blue Yellow Blue yellow red Blue red yellow', u'a diagram of the possibilities', u"Starting with Red, you can line up the following two in either blue/yellow or yellow/blue. That's two possibilities with red being first. The same would hold true if blue were first or if yellow were first. Since there are only three colors that could come first, then the answer is 2+2+2=6.", u'B Y R B R Y R B Y R Y B Y B R Y R B', u'try all possible combinations', u'red, blue, yellow; red, yellow, blue; blue, red yellow; blue yellow red, yellow blue red; yellow red blue', u'RBY RYB BYR BRY YRB YBR', u'3 x 2 x 1 (3 factorial) rby ryb yrb ybr byr bry', u'RBE, REB, ERB, EBR, RBE, REB', u'abc acb bac bca cab cba', u'ryb rby bry byr ybr yrb', u'RED, BLUE, YELLOW RED, YELLOW, BLUE BLUE, RED, YELLOW BLUE, YELLOW, RED YELLOW, RED, BLUE YELLOW, BLUE, RED', u'red blue yellow red yellow blue blue red yellow blue yellow red yellow red blue yellow blue red', u'blue red yellow blue yellow red red yellow blue red blue yellow yellow blue red yellow red blue', u'rbg rgb bgr brg grb gbr', u'red blue yellow blue yellow red yellow red blue blue red yellow red yellow blue yellow blue red', u'RBY YRB BYR YBR RYB BRY', u'For position #1, there are only 3 possiblities. One each for R,B and Y. For each possibility above, there are 2 possiblities, alternating the color in postion #2 and #3. For each of the 3 colors, 2 possible arragnements. 3 x2 = 6 possibilites. Position # 1 (2, 3) or (2, 3): R (B, Y) or (Y,B) B (R, Y) or (Y,R) Y (R,B) or (B, Y)', u'because you can have blue red yellow and blue yellow red so you repeat it with the other balls so you get three times two equals 6.', u'yellow red blue _yellow blue red red yellow blue _ red blue yellow blue yellow red _ blue red yellow', u'red blue yellow red yellow blue blue red yellow blue yellow red red blue yellow red yellow blue', u'r , b . y r , y ,b b , r ,y b , y , r y , b ,r y , r , b', u'red,blue,yellow red,yellow,blue yellow,blue,red yellow,red,blue blue,yellow,red blue,red,yellow', u'RYB RBY BYR BRY YRB YBR', u'bry, byr, yrb, ybr, rby, ryb', u'Bry byr yrb ybr rby ryb', u'Ryb rby etc', u'red-blue-yellow , red-yellow-blue , blue-red-yellow , blue-yellow-red , yellow-blue-red , yellow-red-blue', u'RBY,RYB, BYR, BRY, YRB, YBR are the possible arrangements', u'because these are the orders they can go in: 1.) red, blue, and yellow 2.) red, yellow, blue 3.) yellow, blue, red 4.) yellow, red, blue 5.) blue, red, yellow 6.) blue, yellow, red those are all of the possible answers', u'Because I wrote it out. RYB RBY BYR BRY YRB YBR', u'red,blue,yellow and red,yellow, blue and blue,red yellow', u'RBY, RYB, BRY, BYR, YRB, YBR', u'done manually', u'RBY, BYR, RYB, BRY, YRB, YBR', u'I beleave this because I wrote down the only six ways to combine them in order of a line.BRY, BYR, RBY, RYB, YBR, and YRB.', u'rby ryb byr bry yrb ybr', u'combinations are: red blue yellow, red yellow blue, blue red yellow, blue yellow red, yellow red blue, yellow blue red', u'vermelho azul verde vermelho verde azul azul vermelho verde azul verde vermelho verde vermelho azul verde azul vermelho', u'RYB BYR YBR BRY YRB RYB', u'red blue yellow red yellow blue blue yellow red blue red yellow yellow red blue yellow blue red', u'rgb, rbg brg,bgr gbr, grb', u'Because: 123 132 213 231 312 321 are six!', u'I got 3 balls and tried it.', u'red and yellow, yellow and blue, blue and red, red and yellow and blue, yellow and blue and red, blue and red and yellow', u'RBY RYB BYR BRY YBR YRB', u'1) red-blue-yellow 2) red-yellow-blue 3) blue-yellow-red 4) blue-red-yellow 5) yellow-red-blue 6) yellow-blue-red', u'redblueyellow redyellowblue blueredyellow blueyellowred yellowredblue yellowbluered', u'ABC ACB BCA BAC CAB CBA', u'red,blue,yellow. blue,red,yellow. yellow,blue,red. yellow,red,blue. blue, yellow,red. red,yellow,blue.', u'Started with one color, say red, to be first in the sequence. The two possible sequences would be RBY and RYB. Start with yellow, and two possible sequences are YRB and YMR. Start with blue, and you have BYR and BRY. Total of six possible sequences.', u'Yellow blue red Yellow Red Blue Red Yellow Blue Red Blue Yellow Blue yellow red Blue red yellow', u'I wrote out all of the possibilities', u'RYB , RBY , YRB , YBR , BRY , BYR', u'I was able to visualize the combinations in my head.', u'rby, ryb, bry, byr, ybr, yrb', u'red, blue, yellow red, yellow, blue yellow, red, blue yellow, blue, red blue, red, yellow blue, yellow, red', u'red, yellow , blue red , blue , yellow yellow , red , blue yellow , blue , red blue , red, yellow blue , yellow, red', u'Red, blue, green Red, green, blue Blue, green, red, blue, red, green green, red, blue, green, blue, red', u'yellow, red, blue yellow, blue, red red, yellow, blue red, blue, yellow blue, red, yellow blue, yellow, red', u'R,Y,B; R,B,Y; B,Y,R; B,R,Y; Y,B,R; Y,R,B', u"I do all the possibilities giving one letter to eich ball. Red=R, Yellow= Y and Blue=B. Then I write RYB, RBY,...carefully making sure you don't repeat the serie.", u'red-blue-yellow red-yellow-blue blue-red-yellow blue-yellow-red yellow-red-blue yellow-blue-red', u'red-blue-yellow(r-b-y) r-y-b b-r-y b-y-r y-r-b y-b-r and 3!', u'Yellow blue red Red Yellow Blue Red Yellow Blue Red Blue Yellow Blue yellow red', u'azul, amarela e vermelha; azul,vermelha e amarela; amarela, vermelha e azul; amarela, azul e vermelha; vermelha, azul e amarela; vermelha, amarela e azul.', u'vermelha, amarela e azul, vermelha, azul e amarela,', u'RBY, RYB, BRY, BYR, YBR,YRB', u"I've tried to write down all the variants", u'r,b,y r,y,b b,r,y b,y,r y,b,r y,r,b', u'I counted in my head', u'b-y-g b-g-y g-b-y g-y-b y-b-g y-g-b']}, 'rule_type': u'FuzzyMatches'}]}, {'outcome': {'dest': u'Home', 'feedback': [u'<p>Detected unsure.</p>'], 'param_changes': []}, 'rule_specs': [{'inputs': {u'training_data': [u'Guess', u"i don't know", u'i dont know', u'i guess', u'No idea', u'I dunno!', u'Dont know', u'I don` t know', u'I made an educated guess', u'I do not know', u'I don t know. Random', u'i just guessed', u'not sure', u"I don't know.I guess", u'quick guess', u'lucky guess', u'doont know', u"Don't know", u'guessed it :P', u"I don't know", u"i don't know i just did it.", u'i think there is a rule for it.', u'idk', u'realmente solo adivin\\u00e9', u'I guessed.', u"don't know"]}, 'rule_type': u'FuzzyMatches'}, {'inputs': {u'x': u'cheatcode'}, 'rule_type': u'StartsWith'}]}], 'fallbacks': [], 'confirmed_unclassified_answers': [u"What's the question?", u'because i did it!!', u'I do not know what the question is to give you an answer', u'trial and error', u'Because there are 3 colors and 3 positions', u'Because of bacon.', u"because it's the right answer", u'Because my sister said', u'Two times each colour', u'common sense', u'Choose one of three, then one of two.', u'yes that is what I was thinking.'], 'id': u'TextInput', 'customization_args': {u'rows': {u'value': 1}, u'placeholder': {u'value': u''}}}, 'content': [{'value': u'<p>Why do you think three things can be arranged 6 ways?</p>', 'type': u'text'}], 'param_changes': []})
        # self.EXP_STATE = exp_services.get_exploration_by_id(exploration_id)

    def determine_triggering_rule(self, answer):
        response = reader.classify(self.EXP_ID, self.EXP_STATE, answer,
            {'answer': answer})
        return response['matched_rule_type']

    def test_hard_triggers(self):
        """All these responses trigger the hard classifier.

        Note: Any response beginning with 'cheatcode' is a hard rule
        triggering.
        """
        self.assertEquals(
            self.determine_triggering_rule('permutations'),
            'hard')
        self.assertEquals(
            self.determine_triggering_rule('cheatcode0'),
            'hard')
        self.assertEquals(
            self.determine_triggering_rule('cheatcode3'),
            'hard')
        self.assertEquals(
            self.determine_triggering_rule('cheatcode1254'),
            'hard')
        self.assertEquals(
            self.determine_triggering_rule('exit'),
            'hard')

    def test_soft_triggers(self):
        """All these responses trigger the soft classifier."""
        self.assertEquals(
            self.determine_triggering_rule('Combination 3 x 2 x 1'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('bcse combinations'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('Because the answer is 3!'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('3 balls time two time one'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('try all possible combinations'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('rby, ryb, bry, byr, ybr, yrb'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('I dunno!'),
            'soft')
        self.assertEquals(
            self.determine_triggering_rule('I guessed.'),
            'soft')

    def test_classify_triggers(self):
        """All these responses trigger the string classifier."""
        with self.swap(feconf, 'ENABLE_STRING_CLASSIFIER', True):
            self.assertEquals(
                self.determine_triggering_rule('it\'s a permutation of 3 '
                    'elements'),
                'classifier'
                )
            self.assertEquals(
                self.determine_triggering_rule('There are 3 options for the '
                    'first ball, and 2 for the remaining two. So 3*2=6.'),
                'classifier'
                )
            self.assertEquals(
                self.determine_triggering_rule('abc acb bac bca cbb cba'),
                'classifier'
                )
            self.assertEquals(
                self.determine_triggering_rule('dunno, just guessed'),
                'classifier'
                )


class FeedbackIntegrationTest(test_utils.GenericTestBase):
    """Test the handler for giving feedback."""

    def test_give_feedback_handler(self):
        """Test giving feedback handler."""
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)

        # Load demo exploration
        EXP_ID = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

        # Viewer opens exploration
        self.login(self.VIEWER_EMAIL)
        exploration_dict = self.get_json(
            '%s/%s' % (feconf.EXPLORATION_INIT_URL_PREFIX, EXP_ID))
        state_name_1 = exploration_dict['exploration']['init_state_name']

        # Viewer gives 1st feedback
        self.post_json(
            '/explorehandler/give_feedback/%s' % EXP_ID,
            {
                'state_name': state_name_1,
                'feedback': 'This is a feedback message.',
            }
        )

        # Viewer submits answer '0'
        result_dict = self.submit_answer(EXP_ID, state_name_1, '0')
        state_name_2 = result_dict['state_name']

        # Viewer gives 2nd feedback
        self.post_json(
            '/explorehandler/give_feedback/%s' % EXP_ID,
            {
                'state_name': state_name_2,
                'feedback': 'This is a 2nd feedback message.',
            }
        )
        self.logout()


class ExplorationParametersUnitTests(test_utils.GenericTestBase):
    """Test methods relating to exploration parameters."""

    def test_get_init_params(self):
        """Test the get_init_params() method."""
        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exp_param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }
        new_params = self.get_updated_param_dict(
            {}, [independent_pc, dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        new_params = self.get_updated_param_dict(
            {}, [dependent_pc, independent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': ''})

    def test_update_learner_params(self):
        """Test the update_learner_params() method."""
        independent_pc = param_domain.ParamChange(
            'a', 'Copier', {'value': 'firstValue', 'parse_with_jinja': False})
        dependent_pc = param_domain.ParamChange(
            'b', 'Copier', {'value': '{{a}}', 'parse_with_jinja': True})

        exp_param_specs = {
            'a': param_domain.ParamSpec('UnicodeString'),
            'b': param_domain.ParamSpec('UnicodeString'),
        }

        old_params = {}
        new_params = self.get_updated_param_dict(
            old_params, [independent_pc, dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'firstValue', 'b': 'firstValue'})
        self.assertEqual(old_params, {})

        old_params = {'a': 'secondValue'}
        new_params = self.get_updated_param_dict(
            old_params, [dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'a': 'secondValue', 'b': 'secondValue'})
        self.assertEqual(old_params, {'a': 'secondValue'})

        # Jinja string evaluation fails gracefully on dependencies that do not
        # exist.
        old_params = {}
        new_params = self.get_updated_param_dict(
            old_params, [dependent_pc], exp_param_specs)
        self.assertEqual(new_params, {'b': ''})
        self.assertEqual(old_params, {})


class RatingsIntegrationTests(test_utils.GenericTestBase):
    """Integration tests of ratings recording and display."""

    def setUp(self):
        super(RatingsIntegrationTests, self).setUp()
        self.EXP_ID = '0'
        exp_services.delete_demo('0')
        exp_services.load_demo('0')

    def test_assign_and_read_ratings(self):
        """Test the PUT and GET methods for ratings."""

        self.signup('user@example.com', 'user')
        self.login('user@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))

        # User checks rating
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})

        # User rates and checks rating
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 2
            }, csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 2)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 1, '3': 0, '4': 0, '5': 0})

        # User re-rates and checks rating
        self.login('user@example.com')
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 5
            }, csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 5)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 1})

        self.logout()

    def test_non_logged_in_users_cannot_rate(self):
        """Check non logged-in users can view but not submit ratings."""

        self.signup('user@example.com', 'user')
        self.login('user@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        self.logout()

        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0})
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 1
            }, csrf_token, expected_status_int=401, expect_errors=True
        )

    def test_ratings_by_different_users(self):
        """Check that ratings by different users do not interfere."""

        self.signup('a@example.com', 'a')
        self.signup('b@example.com', 'b')

        self.login('a@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 4
            }, csrf_token
        )
        self.logout()

        self.login('b@example.com')
        csrf_token = self.get_csrf_token_from_response(
            self.testapp.get('/explore/%s' % self.EXP_ID))
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], None)
        self.put_json(
            '/explorehandler/rating/%s' % self.EXP_ID, {
                'user_rating': 4
            }, csrf_token
        )
        ratings = self.get_json('/explorehandler/rating/%s' % self.EXP_ID)
        self.assertEqual(ratings['user_rating'], 4)
        self.assertEqual(
            ratings['overall_ratings'],
            {'1': 0, '2': 0, '3': 0, '4': 2, '5': 0})
        self.logout()
