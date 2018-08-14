# coding: utf-8
#
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

"""Tests for feedback-related jobs."""

import ast
import datetime

from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_jobs_one_off
from core.domain import feedback_services
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(suggestion_models, feedback_models, email_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.suggestion, models.NAMES.feedback, models.NAMES.email,
        models.NAMES.user]))
taskqueue_services = models.Registry.import_taskqueue_services()


class FeedbackThreadMessagesCountOneOffJobTest(test_utils.GenericTestBase):
    """Tests for the one-off feedback thread message counter job."""

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'

    EXPECTED_THREAD_DICT = {
        'status': u'open',
        'state_name': u'a_state_name',
        'summary': None,
        'original_author_username': None,
        'subject': u'a subject'
    }

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def setUp(self):
        super(FeedbackThreadMessagesCountOneOffJobTest, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id, title='Sillat Suomi',
            category='Architecture', language_code='fi')

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = feedback_jobs_one_off.FeedbackThreadMessagesCountOneOffJob.create_new() # pylint: disable=line-too-long
        feedback_jobs_one_off.FeedbackThreadMessagesCountOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            feedback_jobs_one_off.FeedbackThreadMessagesCountOneOffJob.get_output( # pylint: disable=line-too-long
                job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        return eval_output

    def test_message_count(self):
        """Test if the job returns the correct message count."""
        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1,
                self.EXPECTED_THREAD_DICT['state_name'], self.user_id,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')
            feedback_services.create_thread(
                'exploration', self.EXP_ID_2,
                self.EXPECTED_THREAD_DICT['state_name'], self.user_id,
                self.EXPECTED_THREAD_DICT['subject'], 'not used here')

            thread_ids = subscription_services.get_all_threads_subscribed_to(
                self.user_id)

            self._run_one_off_job()

            thread_summaries, _ = feedback_services.get_thread_summaries(
                self.user_id, thread_ids)

            # Check that the first message has only one message.
            self.assertEqual(thread_summaries[0]['total_message_count'], 1)
            # Check that the second message has only one message.
            self.assertEqual(thread_summaries[1]['total_message_count'], 1)

            feedback_services.create_message(
                thread_ids[0], self.user_id, None, None, 'editor message')

            self._run_one_off_job()

            thread_summaries, _ = feedback_services.get_thread_summaries(
                self.user_id, thread_ids)

            # Check that the first message has two messages.
            self.assertEqual(thread_summaries[0]['total_message_count'], 2)

            # Get the first message so that we can delete it and check the error
            # case.
            first_message_model = (
                feedback_models.FeedbackMessageModel.get(thread_ids[0], 0))

            first_message_model.delete()

            output = self._run_one_off_job()
            # Check if the quantities have the correct values.
            self.assertEqual(output[0][1]['message_count'], 1)
            self.assertEqual(output[0][1]['next_message_id'], 2)


class FeedbackSubjectOneOffJobTest(test_utils.GenericTestBase):
    """Tests for the one-off feedback subject update job."""
    EXP_ID_1 = 'eid1'

    EXPECTED_THREAD_DICT1 = {
        'text': u'a small summary',
        'subject': u'(Feedback from a learner)'
    }

    EXPECTED_THREAD_DICT2 = {
        'text': u'a small text',
        'subject': u'Some subject'
    }

    EXPECTED_THREAD_DICT3 = {
        'text': (
            u'It has to convert to a substring as it exceeds the '
            u'character limit.'),
        'subject': u'(Feedback from a learner)'
    }

    EXPECTED_THREAD_DICT4 = {
        'text': (
            u'Itisjustaverylongsinglewordfortestingget'
            u'AbbreviatedText.'),
        'subject': u'(Feedback from a learner)'
    }

    EXPECTED_THREAD_DICT5 = {
        'text': '',
        'subject': u'(Feedback from a learner)'
    }

    EXPECTED_THREAD_DICT6 = {
        'text': 'Itisjustaverylongsinglewordfortesting',
        'subject': u'(Feedback from a learner)'
    }

    EXPECTED_THREAD_DICT7 = {
        'text': (u'â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od; /⏬®;😁☕😁:☝)'
                 u'😁😁😍1!@#'),
        'subject': u'(Feedback from a learner)'
    }

    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def setUp(self):
        super(FeedbackSubjectOneOffJobTest, self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Bridges in England',
            category='Architecture', language_code='en')

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            feedback_jobs_one_off.FeedbackSubjectOneOffJob.create_new())
        feedback_jobs_one_off.FeedbackSubjectOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def test_that_job_returns_correct_feedback_subject(self):
        """Test if the job returns the correct feedback subject."""

        with self.swap(feconf, 'ENABLE_GENERALIZED_FEEDBACK_THREADS', False):
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT1['subject'],
                self.EXPECTED_THREAD_DICT1['text'])
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT2['subject'],
                self.EXPECTED_THREAD_DICT2['text'])
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT3['subject'],
                self.EXPECTED_THREAD_DICT3['text'])
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT4['subject'],
                self.EXPECTED_THREAD_DICT4['text'])
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT5['subject'],
                self.EXPECTED_THREAD_DICT5['text'])
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT6['subject'],
                self.EXPECTED_THREAD_DICT6['text'])
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, 'unused_state_name',
                self.user_id, self.EXPECTED_THREAD_DICT7['subject'],
                self.EXPECTED_THREAD_DICT7['text'])
            threads_old = feedback_services.get_threads(
                'exploration', self.EXP_ID_1)

            self._run_one_off_job()

            threads = feedback_services.get_threads(
                'exploration', self.EXP_ID_1)

        self.assertEqual(threads[6].subject, u'a small summary')
        self.assertEqual(threads[5].subject, u'Some subject')
        self.assertEqual(
            threads[4].subject,
            u'It has to convert to a substring as it exceeds...')
        self.assertEqual(
            threads[3].subject,
            u'ItisjustaverylongsinglewordfortestinggetAbbreviate...')
        self.assertEqual(threads[2].subject, u'(Feedback from a learner)')
        self.assertEqual(
            threads[1].subject,
            u'Itisjustaverylongsinglewordfortesting')
        self.assertEqual(
            threads[0].subject,
            u'â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od;...')

        self.assertEqual(threads[0].last_updated, threads_old[0].last_updated)
        self.assertEqual(threads[1].last_updated, threads_old[1].last_updated)
        self.assertEqual(threads[2].last_updated, threads_old[2].last_updated)
        self.assertEqual(threads[3].last_updated, threads_old[3].last_updated)
        self.assertEqual(threads[4].last_updated, threads_old[4].last_updated)
        self.assertEqual(threads[5].last_updated, threads_old[5].last_updated)


class SuggestionMigrationOneOffJobTest(test_utils.GenericTestBase):
    """Tests for the suggestion migration one-off job."""

    AUTHOR_EMAIL = 'author@example.com'

    EXP_ID = 'eid1'
    TRANSLATION_LANGUAGE_CODE = 'en'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            feedback_jobs_one_off.SuggestionMigrationOneOffJob.create_new())
        feedback_jobs_one_off.SuggestionMigrationOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def _run_validation_job(self):
        job_id = (
            feedback_jobs_one_off.SuggestionMigrationValdiationOneOffJob
            .create_new())
        feedback_jobs_one_off.SuggestionMigrationValdiationOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()
        stringified_output = (
            feedback_jobs_one_off.SuggestionMigrationValdiationOneOffJob
            .get_output(job_id))

        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        super(SuggestionMigrationOneOffJobTest, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(self.AUTHOR_EMAIL, 'author')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.author_id = self.get_user_id_from_email(self.AUTHOR_EMAIL)

        self.editor = user_services.UserActionsInfo(self.editor_id)

        # Login and create exploration and suggestions.
        self.login(self.EDITOR_EMAIL)

        # Create exploration.
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id,
            title='Exploration for suggestions',
            category='Algebra', objective='Test a suggestion.')

        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        init_state = exploration.states[exploration.init_state_name]
        init_interaction = init_state.interaction
        init_interaction.default_outcome.dest = exploration.init_state_name
        exploration.add_states(['State 1'])

        self.old_content = exp_domain.SubtitledHtml(
            'content', 'old content').to_dict()

        # Create content in State A with a single audio subtitle.
        exploration.states['State 1'].update_content(self.old_content)
        exp_services._save_exploration(self.editor_id, exploration, '', [])  # pylint: disable=protected-access
        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        rights_manager.assign_role_for_exploration(
            self.editor, self.EXP_ID, self.owner_id,
            rights_manager.ROLE_EDITOR)

    def test_suggestion_migration_one_off_job(self):
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        feedback_services.create_suggestion(
            self.EXP_ID, self.author_id, exploration.version, 'State 1',
            'description', 'new_value')

        self._run_one_off_job()
        queries = [
            ('target_type', suggestion_models.TARGET_TYPE_EXPLORATION),
            ('target_id', self.EXP_ID)
        ]
        suggestion = suggestion_models.GeneralSuggestionModel.query_suggestions(
            queries)[0]

        expected_change_cmd = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'State 1',
            'new_value': {
                'html': 'new_value',
                'content_id': 'content'
            }
        }

        self.assertEqual(suggestion.id.split('.')[0], 'exploration')
        self.assertEqual(suggestion.id.split('.')[1], self.EXP_ID)
        self.assertEqual(
            suggestion.suggestion_type,
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT)
        self.assertEqual(
            suggestion.target_type, suggestion_models.TARGET_TYPE_EXPLORATION)
        self.assertEqual(suggestion.target_id, self.EXP_ID)
        self.assertEqual(
            suggestion.target_version_at_submission, exploration.version)
        self.assertEqual(suggestion.status, suggestion_models.STATUS_IN_REVIEW)
        self.assertEqual(suggestion.author_id, self.author_id)
        self.assertEqual(suggestion.final_reviewer_id, None)
        self.assertDictEqual(
            suggestion.change_cmd, expected_change_cmd)
        self.assertEqual(
            suggestion.score_category, 'content.' + exploration.category)

    def test_suggestion_migration_validation_one_off_job(self):
        exploration = exp_services.get_exploration_by_id(self.EXP_ID)
        for _ in range(10):
            feedback_services.create_suggestion(
                self.EXP_ID, self.author_id, exploration.version, 'State 1',
                'description', 'new_value')
        self._run_one_off_job()

        output = self._run_validation_job()
        self.assertEqual(output[0][1], output[1][1])
        self.assertEqual(output[0][1], 10)


class FeedbackThreadIdMigrationOneOffJobTest(test_utils.GenericTestBase):
    """Tests for FeedbackThreadIdMigrationOneOffJob class."""
    def setUp(self):
        super(FeedbackThreadIdMigrationOneOffJobTest, self).setUp()
        feedback_models.FeedbackThreadModel(
            id='exp1.thread1', exploration_id='exp1', state_name='state1',
            original_author_id='author',
            status=feedback_models.STATUS_CHOICES_OPEN,
            subject='subject', summary='summary', has_suggestion=False,
            last_updated=datetime.datetime.utcnow()).put()
        feedback_models.FeedbackMessageModel(
            id='exp1.thread1.1', thread_id='exp1.thread1', message_id=1,
            author_id='author', text='message text').put()
        feedback_models.FeedbackThreadUserModel(
            id='author.exp1.thread1', message_ids_read_by_user=[1]).put()
        email_models.FeedbackEmailReplyToIdModel(
            id='author.exp1.thread1', reply_to_id='1234').put()
        user_models.UserSubscriptionsModel(
            id='author', feedback_thread_ids=['exp1.thread1', 'exp2.thread2']
        ).put()


    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            feedback_jobs_one_off
            .FeedbackThreadIdMigrationOneOffJob.create_new())
        feedback_jobs_one_off.FeedbackThreadIdMigrationOneOffJob.enqueue(
            job_id)
        self.assertEqual(
            self.count_jobs_in_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_tasks()

    def test_migration_function(self):
        self._run_one_off_job()
        new_thread_model = feedback_models.GeneralFeedbackThreadModel.get_by_id(
            'exploration.exp1.thread1')
        old_thread_model = feedback_models.FeedbackThreadModel.get_by_id(
            'exp1.thread1')
        self.assertEqual(new_thread_model.entity_type, 'exploration')
        self.assertEqual(new_thread_model.entity_id, 'exp1')
        self.assertEqual(new_thread_model.original_author_id, 'author')
        self.assertEqual(
            new_thread_model.status, feedback_models.STATUS_CHOICES_OPEN)
        self.assertEqual(new_thread_model.subject, 'subject')
        self.assertEqual(new_thread_model.summary, 'summary')
        self.assertEqual(new_thread_model.has_suggestion, False)
        self.assertEqual(
            new_thread_model.last_updated, old_thread_model.last_updated)

        new_message_model = (
            feedback_models.GeneralFeedbackMessageModel.get_by_id(
                'exploration.exp1.thread1.1'))
        old_message_model = feedback_models.FeedbackMessageModel.get_by_id(
            'exp1.thread1.1')
        self.assertEqual(
            new_message_model.thread_id, 'exploration.exp1.thread1')
        self.assertEqual(new_message_model.message_id, 1)
        self.assertEqual(new_message_model.author_id, 'author')
        self.assertEqual(new_message_model.text, 'message text')
        self.assertEqual(
            new_message_model.last_updated, old_message_model.last_updated)

        new_thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get_by_id(
                'author.exploration.exp1.thread1'))
        old_thread_user_model = (
            feedback_models.FeedbackThreadUserModel.get_by_id(
                'author.exp1.thread1'))
        self.assertEqual(new_thread_user_model.message_ids_read_by_user, [1])
        self.assertEqual(
            new_thread_user_model.last_updated,
            old_thread_user_model.last_updated)

        new_reply_to_id_model = (
            email_models.GeneralFeedbackEmailReplyToIdModel.get_by_id(
                'author.exploration.exp1.thread1'))
        old_reply_to_id_model = (
            email_models.FeedbackEmailReplyToIdModel.get_by_id(
                'author.exp1.thread1'))
        self.assertEqual(new_reply_to_id_model.reply_to_id, '1234')
        self.assertEqual(
            new_reply_to_id_model.last_updated,
            old_reply_to_id_model.last_updated)

        new_user_subscription_model = (
            user_models.UserSubscriptionsModel.get_by_id('author'))

        self.assertEqual(
            new_user_subscription_model.feedback_thread_ids,
            ['exp1.thread1', 'exp2.thread2'])
        self.assertEqual(
            new_user_subscription_model.general_feedback_thread_ids,
            ['exploration.exp1.thread1', 'exploration.exp2.thread2'])
