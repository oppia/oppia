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

"""Controllers for the admin view."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import random

from constants import constants
from core import jobs
from core import jobs_registry
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import collection_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import role_services
from core.domain import search_services
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import stats_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

current_user_services = models.Registry.import_current_user_services()


class AdminPage(base.BaseHandler):
    """Admin page shown in the App Engine admin console."""
    @acl_decorators.can_access_admin_page
    def get(self):
        """Handles GET requests."""

        self.render_template('admin-page.mainpage.html')


class AdminHandler(base.BaseHandler):
    """Handler for the admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_admin_page
    def get(self):
        """Handles GET requests."""
        demo_exploration_ids = list(feconf.DEMO_EXPLORATIONS.keys())

        recent_job_data = jobs.get_data_for_recent_jobs()
        unfinished_job_data = jobs.get_data_for_unfinished_jobs()
        topic_summaries = topic_services.get_all_topic_summaries()
        topic_summary_dicts = [
            summary.to_dict() for summary in topic_summaries]
        for job in unfinished_job_data:
            job['can_be_canceled'] = job['is_cancelable'] and any([
                klass.__name__ == job['job_type']
                for klass in (
                    jobs_registry.ONE_OFF_JOB_MANAGERS + (
                        jobs_registry.AUDIT_JOB_MANAGERS))])

        queued_or_running_job_types = set([
            job['job_type'] for job in unfinished_job_data])
        one_off_job_specs = [{
            'job_type': klass.__name__,
            'is_queued_or_running': (
                klass.__name__ in queued_or_running_job_types)
        } for klass in jobs_registry.ONE_OFF_JOB_MANAGERS]
        audit_job_specs = [{
            'job_type': klass.__name__,
            'is_queued_or_running': (
                klass.__name__ in queued_or_running_job_types)
        } for klass in jobs_registry.AUDIT_JOB_MANAGERS]

        continuous_computations_data = jobs.get_continuous_computations_info(
            jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS)
        for computation in continuous_computations_data:
            if computation['last_started_msec']:
                computation['human_readable_last_started'] = (
                    utils.get_human_readable_time_string(
                        computation['last_started_msec']))
            if computation['last_stopped_msec']:
                computation['human_readable_last_stopped'] = (
                    utils.get_human_readable_time_string(
                        computation['last_stopped_msec']))
            if computation['last_finished_msec']:
                computation['human_readable_last_finished'] = (
                    utils.get_human_readable_time_string(
                        computation['last_finished_msec']))

        self.render_json({
            'config_properties': (
                config_domain.Registry.get_config_property_schemas()),
            'continuous_computations_data': continuous_computations_data,
            'demo_collections': sorted(feconf.DEMO_COLLECTIONS.items()),
            'demo_explorations': sorted(feconf.DEMO_EXPLORATIONS.items()),
            'demo_exploration_ids': demo_exploration_ids,
            'human_readable_current_time': (
                utils.get_human_readable_time_string(
                    utils.get_current_time_in_millisecs())),
            'one_off_job_specs': one_off_job_specs,
            'audit_job_specs': audit_job_specs,
            'recent_job_data': recent_job_data,
            'unfinished_job_data': unfinished_job_data,
            'updatable_roles': {
                role: role_services.HUMAN_READABLE_ROLES[role]
                for role in role_services.UPDATABLE_ROLES
            },
            'viewable_roles': {
                role: role_services.HUMAN_READABLE_ROLES[role]
                for role in role_services.VIEWABLE_ROLES
            },
            'topic_summaries': topic_summary_dicts,
            'role_graph_data': role_services.get_role_graph_data()
        })

    @acl_decorators.can_access_admin_page
    def post(self):
        """Handles POST requests."""
        try:
            result = {}
            if self.payload.get('action') == 'reload_exploration':
                exploration_id = self.payload.get('exploration_id')
                self._reload_exploration(exploration_id)
            elif self.payload.get('action') == 'reload_collection':
                collection_id = self.payload.get('collection_id')
                self._reload_collection(collection_id)
            elif self.payload.get('action') == 'generate_dummy_explorations':
                num_dummy_exps_to_generate = self.payload.get(
                    'num_dummy_exps_to_generate')
                num_dummy_exps_to_publish = self.payload.get(
                    'num_dummy_exps_to_publish')
                if not isinstance(num_dummy_exps_to_generate, int):
                    raise self.InvalidInputException(
                        '%s is not a number' % num_dummy_exps_to_generate)
                elif not isinstance(num_dummy_exps_to_publish, int):
                    raise self.InvalidInputException(
                        '%s is not a number' % num_dummy_exps_to_publish)
                elif num_dummy_exps_to_generate < num_dummy_exps_to_publish:
                    raise self.InvalidInputException(
                        'Generate count cannot be less than publish count')
                else:
                    self._generate_dummy_explorations(
                        num_dummy_exps_to_generate, num_dummy_exps_to_publish)
            elif self.payload.get('action') == 'clear_search_index':
                search_services.clear_collection_search_index()
                search_services.clear_exploration_search_index()
            elif (
                    self.payload.get('action') ==
                    'generate_dummy_new_structures_data'):
                self._load_dummy_new_structures_data()
            elif self.payload.get('action') == (
                    'flush_migration_bot_contribution_data'):
                user_services.flush_migration_bot_contributions_model()
            elif self.payload.get('action') == 'save_config_properties':
                new_config_property_values = self.payload.get(
                    'new_config_property_values')
                logging.info('[ADMIN] %s saved config property values: %s' %
                             (self.user_id, new_config_property_values))
                for (name, value) in new_config_property_values.items():
                    config_services.set_property(self.user_id, name, value)
            elif self.payload.get('action') == 'revert_config_property':
                config_property_id = self.payload.get('config_property_id')
                logging.info('[ADMIN] %s reverted config property: %s' %
                             (self.user_id, config_property_id))
                config_services.revert_property(
                    self.user_id, config_property_id)
            elif self.payload.get('action') == 'start_new_job':
                for klass in (
                        jobs_registry.ONE_OFF_JOB_MANAGERS + (
                            jobs_registry.AUDIT_JOB_MANAGERS)):
                    if klass.__name__ == self.payload.get('job_type'):
                        klass.enqueue(klass.create_new())
                        break
            elif self.payload.get('action') == 'cancel_job':
                job_id = self.payload.get('job_id')
                job_type = self.payload.get('job_type')
                for klass in (
                        jobs_registry.ONE_OFF_JOB_MANAGERS + (
                            jobs_registry.AUDIT_JOB_MANAGERS)):
                    if klass.__name__ == job_type:
                        klass.cancel(job_id, self.user_id)
                        break
            elif self.payload.get('action') == 'start_computation':
                computation_type = self.payload.get('computation_type')
                for klass in jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS:
                    if klass.__name__ == computation_type:
                        klass.start_computation()
                        break
            elif self.payload.get('action') == 'stop_computation':
                computation_type = self.payload.get('computation_type')
                for klass in jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS:
                    if klass.__name__ == computation_type:
                        klass.stop_computation(self.user_id)
                        break
            elif self.payload.get('action') == 'upload_topic_similarities':
                data = self.payload.get('data')
                recommendations_services.update_topic_similarities(data)
            elif self.payload.get('action') == (
                    'regenerate_topic_related_opportunities'):
                topic_id = self.payload.get('topic_id')
                opportunities_count = (
                    opportunity_services
                    .regenerate_opportunities_related_to_topic(
                        topic_id, delete_existing_opportunities=True))
                result = {
                    'opportunities_count': opportunities_count
                }
            self.render_json(result)
        except Exception as e:
            self.render_json({'error': python_utils.UNICODE(e)})
            raise

    def _reload_exploration(self, exploration_id):
        """Reloads the exploration in dev_mode corresponding to the given
        exploration id.

        Args:
            exploration_id: str. The exploration id.

        Raises:
            Exception: Cannot reload an exploration in production.
        """
        if constants.DEV_MODE:
            logging.info(
                '[ADMIN] %s reloaded exploration %s' %
                (self.user_id, exploration_id))
            exp_services.load_demo(python_utils.convert_to_bytes(
                exploration_id))
            rights_manager.release_ownership_of_exploration(
                user_services.get_system_user(), python_utils.convert_to_bytes(
                    exploration_id))
        else:
            raise Exception('Cannot reload an exploration in production.')

    def _create_dummy_question(
            self, question_id, question_content, linked_skill_ids):
        """Creates a dummy question object with the given question ID.

        Args:
            question_id: str. The ID of the question to be created.
            question_content: str. The question content.
            linked_skill_ids: list(str). The IDs of the skills to which the
                question is linked to.

        Returns:
            Question. The dummy question with given values.
        """
        state = state_domain.State.create_default_state(
            'ABC', is_initial_state=True)
        state.update_interaction_id('TextInput')
        state.update_content(state_domain.SubtitledHtml('1', question_content))
        recorded_voiceovers = state_domain.RecordedVoiceovers({})
        written_translations = state_domain.WrittenTranslations({})
        recorded_voiceovers.add_content_id_for_voiceover('1')
        recorded_voiceovers.add_content_id_for_voiceover('default_outcome')
        written_translations.add_content_id_for_translation('1')
        written_translations.add_content_id_for_translation('default_outcome')

        state.update_recorded_voiceovers(recorded_voiceovers)
        state.update_written_translations(written_translations)
        solution_dict = (
            state_domain.Solution(
                'TextInput', False, 'Solution', state_domain.SubtitledHtml(
                    'solution', '<p>This is a solution.</p>')).to_dict())
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml(
                    'hint_1', '<p>This is a hint.</p>')).to_dict()
        ]

        state.update_interaction_solution(solution_dict)
        state.update_interaction_hints(hints_list)
        state.update_interaction_customization_args({
            'placeholder': 'Enter text here',
            'rows': 1
        })
        state.update_interaction_default_outcome(
            state_domain.Outcome(
                None, state_domain.SubtitledHtml(
                    'feedback_id', '<p>Dummy Feedback</p>'),
                True, [], None, None).to_dict()
        )
        question = question_domain.Question(
            question_id, state,
            feconf.CURRENT_STATE_SCHEMA_VERSION,
            constants.DEFAULT_LANGUAGE_CODE, 0, linked_skill_ids)
        return question

    def _create_dummy_skill(self, skill_id, skill_description, explanation):
        """Creates a dummy skill object with the given values.

        Args:
            skill_id: str. The ID of the skill to be created.
            skill_description: str. The description of the skill.
            explanation: str. The review material for the skill.

        Returns:
            Skill. The dummy skill with given values.
        """
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], 'Explanation 1'),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], 'Explanation 2'),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], 'Explanation 3')]
        skill = skill_domain.Skill.create_default_skill(
            skill_id, skill_description, rubrics)
        skill.update_explanation(
            state_domain.SubtitledHtml('1', explanation).to_dict())
        return skill

    def _load_dummy_new_structures_data(self):
        """Loads the database with two topics (one of which is empty), a story
        and three skills in the topic (two of them in a subtopic) and a question
        attached to each skill.

        Raises:
            Exception: Cannot load new structures data in production mode.
            Exception: User does not have enough rights to generate data.
        """
        if constants.DEV_MODE:
            if self.user.role != feconf.ROLE_ID_ADMIN:
                raise Exception(
                    'User does not have enough rights to generate data.')
            topic_id_1 = topic_services.get_new_topic_id()
            topic_id_2 = topic_services.get_new_topic_id()
            story_id = story_services.get_new_story_id()
            skill_id_1 = skill_services.get_new_skill_id()
            skill_id_2 = skill_services.get_new_skill_id()
            skill_id_3 = skill_services.get_new_skill_id()
            question_id_1 = question_services.get_new_question_id()
            question_id_2 = question_services.get_new_question_id()
            question_id_3 = question_services.get_new_question_id()

            skill_1 = self._create_dummy_skill(
                skill_id_1, 'Dummy Skill 1', '<p>Dummy Explanation 1</p>')
            skill_2 = self._create_dummy_skill(
                skill_id_2, 'Dummy Skill 2', '<p>Dummy Explanation 2</p>')
            skill_3 = self._create_dummy_skill(
                skill_id_3, 'Dummy Skill 3', '<p>Dummy Explanation 3</p>')

            question_1 = self._create_dummy_question(
                question_id_1, 'Question 1', [skill_id_1])
            question_2 = self._create_dummy_question(
                question_id_2, 'Question 2', [skill_id_2])
            question_3 = self._create_dummy_question(
                question_id_3, 'Question 3', [skill_id_3])
            question_services.add_question(self.user_id, question_1)
            question_services.add_question(self.user_id, question_2)
            question_services.add_question(self.user_id, question_3)

            question_services.create_new_question_skill_link(
                self.user_id, question_id_1, skill_id_1, 0.3)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_2, skill_id_2, 0.5)
            question_services.create_new_question_skill_link(
                self.user_id, question_id_3, skill_id_3, 0.7)

            topic_1 = topic_domain.Topic.create_default_topic(
                topic_id_1, 'Dummy Topic 1')
            topic_2 = topic_domain.Topic.create_default_topic(
                topic_id_2, 'Empty Topic')

            topic_1.add_canonical_story(story_id)
            topic_1.add_uncategorized_skill_id(skill_id_1)
            topic_1.add_uncategorized_skill_id(skill_id_2)
            topic_1.add_uncategorized_skill_id(skill_id_3)
            topic_1.add_subtopic(1, 'Dummy Subtopic Title')
            topic_1.move_skill_id_to_subtopic(None, 1, skill_id_2)
            topic_1.move_skill_id_to_subtopic(None, 1, skill_id_3)

            subtopic_page = (
                subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                    1, topic_id_1))
            self._reload_exploration('0')
            self._reload_exploration('16')
            story = story_domain.Story.create_default_story(
                story_id, 'Dummy Story 1', topic_id_1)
            story.add_node(
                '%s%d' % (story_domain.NODE_ID_PREFIX, 1), 'Dummy Chapter 1')
            story.update_node_destination_node_ids(
                '%s%d' % (story_domain.NODE_ID_PREFIX, 1), [
                    '%s%d' % (story_domain.NODE_ID_PREFIX, 2)])
            story.update_node_exploration_id(
                '%s%d' % (story_domain.NODE_ID_PREFIX, 1), '0')

            story.add_node(
                '%s%d' % (story_domain.NODE_ID_PREFIX, 2), 'Dummy Chapter 2')
            story.update_node_exploration_id(
                '%s%d' % (story_domain.NODE_ID_PREFIX, 2), '16')

            skill_services.save_new_skill(self.user_id, skill_1)
            skill_services.save_new_skill(self.user_id, skill_2)
            skill_services.save_new_skill(self.user_id, skill_3)
            story_services.save_new_story(self.user_id, story)
            topic_services.save_new_topic(self.user_id, topic_1)
            topic_services.save_new_topic(self.user_id, topic_2)
            subtopic_page_services.save_subtopic_page(
                self.user_id, subtopic_page, 'Added subtopic',
                [topic_domain.TopicChange({
                    'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                    'subtopic_id': 1,
                    'title': 'Dummy Subtopic Title'
                })]
            )

            topic_services.publish_story(topic_id_1, story_id, self.user_id)
            topic_services.publish_topic(topic_id_1, self.user_id)
            skill_services.publish_skill(skill_id_1, self.user_id)
            skill_services.publish_skill(skill_id_2, self.user_id)
            skill_services.publish_skill(skill_id_3, self.user_id)
        else:
            raise Exception('Cannot load new structures data in production.')


    def _reload_collection(self, collection_id):
        """Reloads the collection in dev_mode corresponding to the given
        collection id.

        Args:
            collection_id: str. The collection id.

        Raises:
            Exception: Cannot reload a collection in production.
        """
        if constants.DEV_MODE:
            logging.info(
                '[ADMIN] %s reloaded collection %s' %
                (self.user_id, collection_id))
            collection_services.load_demo(
                python_utils.convert_to_bytes(collection_id))
            rights_manager.release_ownership_of_collection(
                user_services.get_system_user(), python_utils.convert_to_bytes(
                    collection_id))
        else:
            raise Exception('Cannot reload a collection in production.')

    def _generate_dummy_explorations(
            self, num_dummy_exps_to_generate, num_dummy_exps_to_publish):
        """Generates and publishes the given number of dummy explorations.

        Args:
            num_dummy_exps_to_generate: int. Count of dummy explorations to
                be generated.
            num_dummy_exps_to_publish: int. Count of explorations to
                be published.

        Raises:
            Exception: Environment is not DEVMODE.
        """

        if constants.DEV_MODE:
            logging.info(
                '[ADMIN] %s generated %s number of dummy explorations' %
                (self.user_id, num_dummy_exps_to_generate))
            possible_titles = ['Hulk Neuroscience', 'Quantum Starks',
                               'Wonder Anatomy',
                               'Elvish, language of "Lord of the Rings',
                               'The Science of Superheroes']
            exploration_ids_to_publish = []
            for i in python_utils.RANGE(num_dummy_exps_to_generate):
                title = random.choice(possible_titles)
                category = random.choice(constants.SEARCH_DROPDOWN_CATEGORIES)
                new_exploration_id = exp_fetchers.get_new_exploration_id()
                exploration = exp_domain.Exploration.create_default_exploration(
                    new_exploration_id, title=title, category=category,
                    objective='Dummy Objective')
                exp_services.save_new_exploration(self.user_id, exploration)
                if i <= num_dummy_exps_to_publish - 1:
                    exploration_ids_to_publish.append(new_exploration_id)
                    rights_manager.publish_exploration(
                        self.user, new_exploration_id)
            exp_services.index_explorations_given_ids(
                exploration_ids_to_publish)
        else:
            raise Exception('Cannot generate dummy explorations in production.')


class AdminRoleHandler(base.BaseHandler):
    """Handler for roles tab of admin page. Used to view and update roles."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_admin_page
    def get(self):
        view_method = self.request.get('method')

        if view_method == feconf.VIEW_METHOD_ROLE:
            role = self.request.get(feconf.VIEW_METHOD_ROLE)
            users_by_role = {
                username: role
                for username in user_services.get_usernames_by_role(role)
            }
            role_services.log_role_query(
                self.user_id, feconf.ROLE_ACTION_VIEW_BY_ROLE,
                role=role)
            self.render_json(users_by_role)
        elif view_method == feconf.VIEW_METHOD_USERNAME:
            username = self.request.get(feconf.VIEW_METHOD_USERNAME)
            user_id = user_services.get_user_id_from_username(username)
            role_services.log_role_query(
                self.user_id, feconf.ROLE_ACTION_VIEW_BY_USERNAME,
                username=username)
            if user_id is None:
                raise self.InvalidInputException(
                    'User with given username does not exist.')
            user_role_dict = {
                username: user_services.get_user_role_from_id(user_id)
            }
            self.render_json(user_role_dict)
        else:
            raise self.InvalidInputException('Invalid method to view roles.')

    @acl_decorators.can_access_admin_page
    def post(self):
        username = self.payload.get('username')
        role = self.payload.get('role')
        topic_id = self.payload.get('topic_id')
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'User with given username does not exist.')

        if (
                user_services.get_user_role_from_id(user_id) ==
                feconf.ROLE_ID_TOPIC_MANAGER):
            topic_services.deassign_user_from_all_topics(
                user_services.get_system_user(), user_id)

        user_services.update_user_role(user_id, role)
        role_services.log_role_query(
            self.user_id, feconf.ROLE_ACTION_UPDATE, role=role,
            username=username)

        if topic_id:
            user = user_services.UserActionsInfo(user_id)
            topic_services.assign_role(
                user_services.get_system_user(), user,
                topic_domain.ROLE_MANAGER, topic_id)

        self.render_json({})


class AdminJobOutputHandler(base.BaseHandler):
    """Retrieves job output to show on the admin page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_admin_page
    def get(self):
        """Handles GET requests."""
        job_id = self.request.get('job_id')
        self.render_json({
            'output': jobs.get_job_output(job_id)
        })


class AdminTopicsCsvFileDownloader(base.BaseHandler):
    """Retrieves topic similarity data for download."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_DOWNLOADABLE

    @acl_decorators.can_access_admin_page
    def get(self):
        self.render_downloadable_file(
            recommendations_services.get_topic_similarities_as_csv(),
            'topic_similarities.csv', 'text/csv')


class DataExtractionQueryHandler(base.BaseHandler):
    """Handler for data extraction query."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_access_admin_page
    def get(self):
        exp_id = self.request.get('exp_id')
        try:
            exp_version = int(self.request.get('exp_version'))
            exploration = exp_fetchers.get_exploration_by_id(
                exp_id, version=exp_version)
        except Exception:
            raise self.InvalidInputException(
                'Entity for exploration with id %s and version %s not found.'
                % (exp_id, self.request.get('exp_version')))

        state_name = self.request.get('state_name')
        num_answers = int(self.request.get('num_answers'))

        if state_name not in exploration.states:
            raise self.InvalidInputException(
                'Exploration \'%s\' does not have \'%s\' state.'
                % (exp_id, state_name))

        state_answers = stats_services.get_state_answers(
            exp_id, exp_version, state_name)
        extracted_answers = state_answers.get_submitted_answer_dict_list()

        if num_answers > 0:
            extracted_answers = extracted_answers[:num_answers]

        response = {
            'data': extracted_answers
        }
        self.render_json(response)
