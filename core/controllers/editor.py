# coding: utf-8

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

"""Controllers for the editor view."""

import StringIO
import datetime
import imghdr
import logging
import re

from constants import constants
from core.controllers import base
from core.domain import acl_decorators
from core.domain import config_domain
from core.domain import dependency_registry
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import interaction_registry
from core.domain import obj_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import stats_services
from core.domain import user_services
from core.domain import value_generators_domain
from core.domain import visualization_registry
from core.platform import models
import feconf
import utils

import jinja2
import mutagen
from mutagen import mp3

app_identity_services = models.Registry.import_app_identity_services()
current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])

# The frontend template for a new state. It is sent to the frontend when the
# exploration editor page is first loaded, so that new states can be
# added in a way that is completely client-side.
# IMPORTANT: Before adding this state to an existing exploration, the
# state name and the destination of the default rule should first be
# changed to the desired new state name.
NEW_STATE_TEMPLATE = {
    'classifier_model_id': None,
    'content': {
        'html': '',
        'audio_translations': {},
    },
    'interaction': exp_domain.State.NULL_INTERACTION_DICT,
    'param_changes': [],
}

DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR = config_domain.ConfigProperty(
    'default_twitter_share_message_editor', {
        'type': 'unicode',
    },
    'Default text for the Twitter share message for the editor',
    default_value=(
        'Check out this interactive lesson I created on Oppia - a free '
        'platform for teaching and learning!'))


def get_value_generators_js():
    """Return a string that concatenates the JS for all value generators."""
    all_value_generators = (
        value_generators_domain.Registry.get_all_generator_classes())
    value_generators_js = ''
    for _, generator_cls in all_value_generators.iteritems():
        value_generators_js += generator_cls.get_js_template()
    return value_generators_js


def _require_valid_version(version_from_payload, exploration_version):
    """Check that the payload version matches the given exploration version."""
    if version_from_payload is None:
        raise base.BaseHandler.InvalidInputException(
            'Invalid POST request: a version must be specified.')

    if version_from_payload != exploration_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_version, version_from_payload))


class EditorLogoutHandler(base.BaseHandler):
    """Handles logout from editor page."""

    @acl_decorators.open_access
    def get(self):
        """Checks if exploration is published and redirects accordingly."""

        url_to_redirect_to = str(self.request.get('return_url'))
        url_to_redirect_to_regex = (
            r'%s/(?P<exploration_id>[\w-]+)$' % feconf.EDITOR_URL_PREFIX)
        is_valid_path = re.match(url_to_redirect_to_regex, url_to_redirect_to)

        if is_valid_path:
            exploration_id = is_valid_path.group(1)
            exploration_rights = rights_manager.get_exploration_rights(
                exploration_id, strict=False)

            if exploration_rights is None or exploration_rights.is_private():
                url_to_redirect_to = feconf.LIBRARY_INDEX_URL
        else:
            url_to_redirect_to = feconf.LIBRARY_INDEX_URL

        self.redirect(super(EditorLogoutHandler, self)._get_logout_url(
            url_to_redirect_to))


class EditorHandler(base.BaseHandler):
    """Base class for all handlers for the editor page."""

    def _get_logout_url(self, redirect_url_on_logout):
        """This overrides the method in base.BaseHandler.
        Returns logout url which will be handled by
        EditorLogoutHandler.

        Args:
            redirect_url_on_logout: str. URL to redirect to on logout.

        Returns:
            str. logout url.
        """
        logout_url = utils.set_url_query_parameter(
            '/exploration_editor_logout', 'return_url', redirect_url_on_logout)
        return logout_url


class ExplorationPage(EditorHandler):
    """The editor page for a single exploration."""

    EDITOR_PAGE_DEPENDENCY_IDS = ['codemirror']

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests."""
        if exploration_id in constants.DISABLED_EXPLORATION_IDS:
            self.render_template(
                'pages/error/disabled_exploration.html',
                iframe_restriction=None)
            return

        (exploration, exploration_rights) = (
            exp_services.get_exploration_and_exploration_rights_by_id(
                exploration_id))

        visualizations_html = visualization_registry.Registry.get_full_html()

        interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        interaction_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                interaction_dependency_ids + self.EDITOR_PAGE_DEPENDENCY_IDS))

        interaction_templates = (
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))

        self.values.update({
            'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
            'DEFAULT_OBJECT_VALUES': obj_services.get_default_object_values(),
            'DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR': (
                DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR.value),
            'additional_angular_modules': additional_angular_modules,
            'can_delete': rights_manager.check_can_delete_activity(
                self.user, exploration_rights),
            'can_edit': rights_manager.check_can_edit_activity(
                self.user, exploration_rights),
            'can_modify_roles': (
                rights_manager.check_can_modify_activity_roles(
                    self.user, exploration_rights)),
            'can_publish': rights_manager.check_can_publish_activity(
                self.user, exploration_rights),
            'can_release_ownership': (
                rights_manager.check_can_release_ownership(
                    self.user, exploration_rights)),
            'can_unpublish': rights_manager.check_can_unpublish_activity(
                self.user, exploration_rights),
            'dependencies_html': jinja2.utils.Markup(dependencies_html),
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
            'meta_description': feconf.CREATE_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_CREATE,
            'value_generators_js': jinja2.utils.Markup(
                get_value_generators_js()),
            'title': exploration.title,
            'visualizations_html': jinja2.utils.Markup(visualizations_html),
            'ALLOWED_INTERACTION_CATEGORIES': (
                feconf.ALLOWED_INTERACTION_CATEGORIES),
            'INVALID_PARAMETER_NAMES': feconf.INVALID_PARAMETER_NAMES,
            'NEW_STATE_TEMPLATE': NEW_STATE_TEMPLATE,
            'SHOW_TRAINABLE_UNRESOLVED_ANSWERS': (
                feconf.SHOW_TRAINABLE_UNRESOLVED_ANSWERS),
            'TAG_REGEX': feconf.TAG_REGEX,
        })

        self.render_template(
            'pages/exploration_editor/exploration_editor.html',
            redirect_url_on_logout=(
                '%s/%s' % (feconf.EDITOR_URL_PREFIX, exploration_id)))


class ExplorationHandler(EditorHandler):
    """Page with editor data for a single exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    def _get_exploration_data(
            self, exploration_id, apply_draft=False, version=None):
        """Returns a description of the given exploration."""
        try:
            if apply_draft:
                exploration = exp_services.get_exp_with_draft_applied(
                    exploration_id, self.user_id)
            else:
                exploration = exp_services.get_exploration_by_id(
                    exploration_id, version=version)
        except:
            raise self.PageNotFoundException

        states = {}
        for state_name in exploration.states:
            state_dict = exploration.states[state_name].to_dict()
            states[state_name] = state_dict
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.user_id, exploration_id)
        draft_changes = (exp_user_data.draft_change_list if exp_user_data
                         and exp_user_data.draft_change_list else None)
        is_version_of_draft_valid = (
            exp_services.is_version_of_draft_valid(
                exploration_id, exp_user_data.draft_change_list_exp_version)
            if exp_user_data and exp_user_data.draft_change_list_exp_version
            else None)
        draft_change_list_id = (exp_user_data.draft_change_list_id
                                if exp_user_data else 0)
        exploration_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.user_id, exploration_id))
        editor_dict = {
            'auto_tts_enabled': exploration.auto_tts_enabled,
            'category': exploration.category,
            'correctness_feedback_enabled': (
                exploration.correctness_feedback_enabled),
            'draft_change_list_id': draft_change_list_id,
            'exploration_id': exploration_id,
            'init_state_name': exploration.init_state_name,
            'language_code': exploration.language_code,
            'objective': exploration.objective,
            'param_changes': exploration.param_change_dicts,
            'param_specs': exploration.param_specs_dict,
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict(),
            'show_state_editor_tutorial_on_load': (
                self.user_id and not self.has_seen_editor_tutorial),
            'states': states,
            'tags': exploration.tags,
            'title': exploration.title,
            'version': exploration.version,
            'is_version_of_draft_valid': is_version_of_draft_valid,
            'draft_changes': draft_changes,
            'email_preferences': exploration_email_preferences.to_dict()
        }

        return editor_dict

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Gets the data for the exploration overview page."""
        # 'apply_draft' and 'v'(version) are optional parameters because the
        # exploration history tab also uses this handler, and these parameters
        # are not used by that tab.
        version = self.request.get('v', default_value=None)
        apply_draft = self.request.get('apply_draft', default_value=False)
        self.values.update(
            self._get_exploration_data(
                exploration_id, apply_draft=apply_draft, version=version))
        self.render_json(self.values)

    @acl_decorators.can_edit_exploration
    def put(self, exploration_id):
        """Updates properties of the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        commit_message = self.payload.get('commit_message')
        change_list_dict = self.payload.get('change_list')
        change_list = [
            exp_domain.ExplorationChange(change) for change in change_list_dict]
        try:
            exp_services.update_exploration(
                self.user_id, exploration_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        self.values.update(self._get_exploration_data(exploration_id))
        self.render_json(self.values)

    @acl_decorators.can_delete_exploration
    def delete(self, exploration_id):
        """Deletes the given exploration."""

        log_debug_string = '(%s) %s tried to delete exploration %s' % (
            self.role, self.user_id, exploration_id)
        logging.debug(log_debug_string)

        is_exploration_cloned = rights_manager.is_exploration_cloned(
            exploration_id)
        exp_services.delete_exploration(
            self.user_id, exploration_id, force_deletion=is_exploration_cloned)

        log_info_string = '(%s) %s deleted exploration %s' % (
            self.role, self.user_id, exploration_id)
        logging.info(log_info_string)


class ExplorationRightsHandler(EditorHandler):
    """Handles management of exploration editing rights."""

    @acl_decorators.can_modify_exploration_roles
    def put(self, exploration_id):
        """Updates the editing rights for the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        make_community_owned = self.payload.get('make_community_owned')
        new_member_username = self.payload.get('new_member_username')
        new_member_role = self.payload.get('new_member_role')
        viewable_if_private = self.payload.get('viewable_if_private')

        if new_member_username:
            new_member_id = user_services.get_user_id_from_username(
                new_member_username)
            if new_member_id is None:
                raise Exception(
                    'Sorry, we could not find the specified user.')

            rights_manager.assign_role_for_exploration(
                self.user, exploration_id, new_member_id, new_member_role)
            email_manager.send_role_notification_email(
                self.user_id, new_member_id, new_member_role, exploration_id,
                exploration.title)

        elif make_community_owned:
            exploration = exp_services.get_exploration_by_id(exploration_id)
            try:
                exploration.validate(strict=True)
            except utils.ValidationError as e:
                raise self.InvalidInputException(e)

            rights_manager.release_ownership_of_exploration(
                self.user, exploration_id)

        elif viewable_if_private is not None:
            rights_manager.set_private_viewability_of_exploration(
                self.user, exploration_id, viewable_if_private)

        else:
            raise self.InvalidInputException(
                'No change was made to this exploration.')

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict()
        })


class ExplorationStatusHandler(EditorHandler):
    """Handles publishing of an exploration."""

    def _publish_exploration(self, exploration_id):
        """Publish an exploration.

        Args:
            exploration_id: str. Id of the exploration.

        Raises:
            InvalidInputException: Given exploration is invalid.
        """
        exploration = exp_services.get_exploration_by_id(exploration_id)
        try:
            exploration.validate(strict=True)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        exp_services.publish_exploration_and_update_user_profiles(
            self.user, exploration_id)
        exp_services.index_explorations_given_ids([exploration_id])

    @acl_decorators.can_publish_exploration
    def put(self, exploration_id):
        make_public = self.payload.get('make_public')

        if make_public is not None:
            self._publish_exploration(exploration_id)

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict()
        })


class ExplorationModeratorRightsHandler(EditorHandler):
    """Handles management of exploration rights by moderators."""

    @acl_decorators.can_access_moderator_page
    def put(self, exploration_id):
        """Unpublishes the given exploration, and sends an email to all its
        owners.
        """
        exploration = exp_services.get_exploration_by_id(exploration_id)
        email_body = self.payload.get('email_body')
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        # If moderator emails can be sent, check that all the prerequisites are
        # satisfied, otherwise do nothing.
        if feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
            if not email_body:
                raise self.InvalidInputException(
                    'Moderator actions should include an email to the '
                    'recipient.')
            email_manager.require_moderator_email_prereqs_are_satisfied()

        # Unpublish exploration.
        rights_manager.unpublish_exploration(self.user, exploration_id)
        search_services.delete_explorations_from_search_index([exploration_id])
        exp_rights = rights_manager.get_exploration_rights(exploration_id)

        # If moderator emails can be sent, send an email to the all owners of
        # the exploration notifying them of the change.
        if feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
            for owner_id in exp_rights.owner_ids:
                email_manager.send_moderator_action_email(
                    self.user_id, owner_id, 'unpublish_exploration',
                    exploration.title, email_body)

        self.render_json({
            'rights': exp_rights.to_dict(),
        })


class UserExplorationEmailsHandler(EditorHandler):
    """Handles management of user email notification preferences for this
    exploration.
    """

    @acl_decorators.can_edit_exploration
    def put(self, exploration_id):
        """Updates the email notification preferences for the given exploration.

        Args:
            exploration_id: str. The exploration id.

        Raises:
            InvalidInputException: Invalid message type.
        """

        mute = self.payload.get('mute')
        message_type = self.payload.get('message_type')

        if message_type == feconf.MESSAGE_TYPE_FEEDBACK:
            user_services.set_email_preferences_for_exploration(
                self.user_id, exploration_id, mute_feedback_notifications=mute)
        elif message_type == feconf.MESSAGE_TYPE_SUGGESTION:
            user_services.set_email_preferences_for_exploration(
                self.user_id, exploration_id,
                mute_suggestion_notifications=mute)
        else:
            raise self.InvalidInputException(
                'Invalid message type.')

        exploration_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.user_id, exploration_id))
        self.render_json({
            'email_preferences': exploration_email_preferences.to_dict()
        })


class UntrainedAnswersHandler(EditorHandler):
    """Returns answers that learners have submitted, but that Oppia hasn't been
    explicitly trained to respond to by an exploration author.
    """
    NUMBER_OF_TOP_ANSWERS_PER_RULE = 50

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id, escaped_state_name):
        """Handles GET requests."""
        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        state_name = utils.unescape_encoded_uri_component(escaped_state_name)
        if state_name not in exploration.states:
            # If trying to access a non-existing state, there is no training
            # data associated with it.
            self.render_json({'unhandled_answers': []})
            return

        state = exploration.states[state_name]

        # TODO(bhenning): Answers should be bound to a particular exploration
        # version or interaction ID.

        # TODO(bhenning): If the top 100 answers have already been classified,
        # then this handler will always return an empty list.

        # TODO(bhenning): This entire function will not work as expected until
        # the answers storage backend stores answers in a non-lossy way.
        # Currently, answers are stored as HTML strings and they are not able
        # to be converted back to the original objects they started as, so the
        # normalization calls in this function will not work correctly on those
        # strings. Once this happens, this handler should also be tested.

        # The total number of possible answers is 100 because it requests the
        # top 50 answers matched to the default rule and the top 50 answers
        # matched to the classifier individually.

        # TODO(sll): Functionality for retrieving untrained answers was removed
        # in PR 3489 due to infeasibility of the calculation approach. It needs
        # to be reinstated in the future so that the training interface can
        # function.
        submitted_answers = []

        interaction = state.interaction
        unhandled_answers = []
        if feconf.SHOW_TRAINABLE_UNRESOLVED_ANSWERS and interaction.id:
            interaction_instance = (
                interaction_registry.Registry.get_interaction_by_id(
                    interaction.id))

            try:
                # Normalize the answers.
                for answer in submitted_answers:
                    answer['answer'] = interaction_instance.normalize_answer(
                        answer['answer'])

                trained_answers = set()
                for answer_group in interaction.answer_groups:
                    trained_answers.update(
                        interaction_instance.normalize_answer(trained)
                        for trained
                        in answer_group['training_data'])

                # Include all the answers which have been confirmed to be
                # associated with the default outcome.
                trained_answers.update(set(
                    interaction_instance.normalize_answer(confirmed)
                    for confirmed
                    in interaction.confirmed_unclassified_answers))

                unhandled_answers = [
                    answer for answer in submitted_answers
                    if answer['answer'] not in trained_answers
                ]
            except Exception as e:
                logging.warning(
                    'Error loading untrained answers for interaction %s: %s.' %
                    (interaction.id, e))

        self.render_json({
            'unhandled_answers': unhandled_answers
        })


class ExplorationDownloadHandler(EditorHandler):
    """Downloads an exploration as a zip file, or dict of YAML strings
    representing states.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_download_exploration
    def get(self, exploration_id):
        """Handles GET requests."""
        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        version = self.request.get('v', default_value=exploration.version)
        output_format = self.request.get('output_format', default_value='zip')
        width = int(self.request.get('width', default_value=80))

        # If the title of the exploration has changed, we use the new title.
        filename = 'oppia-%s-v%s' % (
            utils.to_ascii(exploration.title.replace(' ', '')), version)

        if output_format == feconf.OUTPUT_FORMAT_ZIP:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.headers['Content-Disposition'] = (
                'attachment; filename=%s.zip' % str(filename))
            self.response.write(
                exp_services.export_to_zip_file(exploration_id, version))
        elif output_format == feconf.OUTPUT_FORMAT_JSON:
            self.render_json(exp_services.export_states_to_yaml(
                exploration_id, version=version, width=width))
        else:
            raise self.InvalidInputException(
                'Unrecognized output format %s' % output_format)


class StateYamlHandler(EditorHandler):
    """Given a representation of a state, converts it to a YAML string.

    Note that this handler is stateless; it does not make use of the storage
    layer.
    """

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles POST requests."""
        try:
            state_dict = self.payload.get('state_dict')
            width = self.payload.get('width')
        except Exception:
            raise self.PageNotFoundException

        self.render_json({
            'yaml': exp_services.convert_state_dict_to_yaml(state_dict, width),
        })


class ExplorationResourcesHandler(EditorHandler):
    """Manages assets associated with an exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        """Handles GET requests."""
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')

        self.render_json({'filepaths': dir_list})


class ExplorationSnapshotsHandler(EditorHandler):
    """Returns the exploration snapshot history."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests."""

        try:
            snapshots = exp_services.get_exploration_snapshots_metadata(
                exploration_id)
        except:
            raise self.PageNotFoundException

        # Patch `snapshots` to use the editor's display name.
        snapshots_committer_ids = [
            snapshot['committer_id'] for snapshot in snapshots]
        committer_usernames = user_services.get_usernames(
            snapshots_committer_ids)
        for index, snapshot in enumerate(snapshots):
            snapshot['committer_id'] = committer_usernames[index]

        self.render_json({
            'snapshots': snapshots,
        })


class ExplorationRevertHandler(EditorHandler):
    """Reverts an exploration to an older version."""

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        """Handles POST requests."""
        current_version = self.payload.get('current_version')
        revert_to_version = self.payload.get('revert_to_version')

        if not isinstance(revert_to_version, int):
            raise self.InvalidInputException(
                'Expected an integer version to revert to; received %s.' %
                revert_to_version)
        if not isinstance(current_version, int):
            raise self.InvalidInputException(
                'Expected an integer current version; received %s.' %
                current_version)

        if revert_to_version < 1 or revert_to_version >= current_version:
            raise self.InvalidInputException(
                'Cannot revert to version %s from version %s.' %
                (revert_to_version, current_version))

        exp_services.discard_draft(exploration_id, self.user_id)
        exp_services.revert_exploration(
            self.user_id, exploration_id, current_version, revert_to_version)
        self.render_json({})


class ExplorationStatisticsHandler(EditorHandler):
    """Returns statistics for an exploration. This is the handler for the new
    statistics framework.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_exploration_stats
    def get(self, exploration_id):
        """Handles GET requests."""
        try:
            current_exploration = exp_services.get_exploration_by_id(
                exploration_id)
        except:
            raise self.PageNotFoundException

        self.render_json(stats_services.get_exploration_stats(
            exploration_id, current_exploration.version).to_frontend_dict())


class StateRulesStatsHandler(EditorHandler):
    """Returns detailed learner answer statistics for a state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_exploration_stats
    def get(self, exploration_id, escaped_state_name):
        """Handles GET requests."""
        try:
            current_exploration = exp_services.get_exploration_by_id(
                exploration_id)
        except:
            raise self.PageNotFoundException

        state_name = utils.unescape_encoded_uri_component(escaped_state_name)
        if state_name not in current_exploration.states:
            logging.error('Could not find state: %s' % state_name)
            logging.error('Available states: %s' % (
                current_exploration.states.keys()))
            raise self.PageNotFoundException

        self.render_json({
            'visualizations_info': stats_services.get_visualizations_info(
                current_exploration.id, state_name,
                current_exploration.states[state_name].interaction.id),
        })


class ImageUploadHandler(EditorHandler):
    """Handles image uploads."""

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        """Saves an image uploaded by a content creator."""

        raw = self.request.get('image')
        filename = self.payload.get('filename')
        if not raw:
            raise self.InvalidInputException('No image supplied')

        allowed_formats = ', '.join(
            feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.keys())

        # Verify that the data is recognized as an image.
        file_format = imghdr.what(None, h=raw)
        if file_format not in feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS:
            raise self.InvalidInputException('Image not recognized')

        # Verify that the file type matches the supplied extension.
        if not filename:
            raise self.InvalidInputException('No filename supplied')
        if '/' in filename or '..' in filename:
            raise self.InvalidInputException(
                'Filenames should not include slashes (/) or consecutive dot '
                'characters.')
        if '.' not in filename:
            raise self.InvalidInputException(
                'Image filename with no extension: it should have '
                'one of the following extensions: %s.' % allowed_formats)

        dot_index = filename.rfind('.')
        extension = filename[dot_index + 1:].lower()
        if (extension not in
                feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS[file_format]):
            raise self.InvalidInputException(
                'Expected a filename ending in .%s, received %s' %
                (file_format, filename))

        # Save the file.
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        if fs.isfile(filename):
            raise self.InvalidInputException(
                'A file with the name %s already exists. Please choose a '
                'different name.' % filename)
        fs.commit(self.user_id, filename, raw)

        self.render_json({'filepath': filename})


class AudioUploadHandler(EditorHandler):
    """Handles audio file uploads (to Google Cloud Storage in production, and
    to the local datastore in dev).
    """

    # The string to prefix to the filename (before tacking the whole thing on
    # to the end of 'assets/').
    _FILENAME_PREFIX = 'audio'

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        """Saves an audio file uploaded by a content creator."""

        raw_audio_file = self.request.get('raw_audio_file')
        filename = self.payload.get('filename')
        allowed_formats = feconf.ACCEPTED_AUDIO_EXTENSIONS.keys()

        if not raw_audio_file:
            raise self.InvalidInputException('No audio supplied')
        dot_index = filename.rfind('.')
        extension = filename[dot_index + 1:].lower()

        if dot_index == -1 or dot_index == 0:
            raise self.InvalidInputException(
                'No filename extension: it should have '
                'one of the following extensions: %s' % allowed_formats)
        if extension not in feconf.ACCEPTED_AUDIO_EXTENSIONS:
            raise self.InvalidInputException(
                'Invalid filename extension: it should have '
                'one of the following extensions: %s' % allowed_formats)

        tempbuffer = StringIO.StringIO()
        tempbuffer.write(raw_audio_file)
        tempbuffer.seek(0)
        try:
            # For every accepted extension, use the mutagen-specific
            # constructor for that type. This will catch mismatched audio
            # types e.g. uploading a flac file with an MP3 extension.
            if extension == 'mp3':
                audio = mp3.MP3(tempbuffer)
            else:
                audio = mutagen.File(tempbuffer)
        except mutagen.MutagenError:
            # The calls to mp3.MP3() versus mutagen.File() seem to behave
            # differently upon not being able to interpret the audio.
            # mp3.MP3() raises a MutagenError whereas mutagen.File()
            # seems to return None. It's not clear if this is always
            # the case. Occasionally, mutagen.File() also seems to
            # raise a MutagenError.
            raise self.InvalidInputException('Audio not recognized '
                                             'as a %s file' % extension)
        tempbuffer.close()

        if audio is None:
            raise self.InvalidInputException('Audio not recognized '
                                             'as a %s file' % extension)
        if audio.info.length > feconf.MAX_AUDIO_FILE_LENGTH_SEC:
            raise self.InvalidInputException(
                'Audio files must be under %s seconds in length. The uploaded '
                'file is %.2f seconds long.' % (
                    feconf.MAX_AUDIO_FILE_LENGTH_SEC, audio.info.length))
        if len(set(audio.mime).intersection(
                set(feconf.ACCEPTED_AUDIO_EXTENSIONS[extension]))) == 0:
            raise self.InvalidInputException(
                'Although the filename extension indicates the file '
                'is a %s file, it was not recognized as one. '
                'Found mime types: %s' % (extension, audio.mime))

        mimetype = audio.mime[0]

        # For a strange, unknown reason, the audio variable must be
        # deleted before opening cloud storage. If not, cloud storage
        # throws a very mysterious error that entails a mutagen
        # object being recursively passed around in app engine.
        del audio

        # Audio files are stored to the datastore in the dev env, and to GCS
        # in production.
        file_system_class = (
            fs_domain.ExplorationFileSystem if feconf.DEV_MODE
            else fs_domain.GcsFileSystem)
        fs = fs_domain.AbstractFileSystem(file_system_class(exploration_id))
        fs.commit(
            self.user_id, '%s/%s' % (self._FILENAME_PREFIX, filename),
            raw_audio_file, mimetype=mimetype)

        self.render_json({'filename': filename})


class StartedTutorialEventHandler(EditorHandler):
    """Records that this user has started the state editor tutorial."""

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles GET requests."""
        user_services.record_user_started_state_editor_tutorial(self.user_id)


class EditorAutosaveHandler(ExplorationHandler):
    """Handles requests from the editor for draft autosave."""

    @acl_decorators.can_edit_exploration
    def put(self, exploration_id):
        """Handles PUT requests for draft updation."""
        # Raise an Exception if the draft change list fails non-strict
        # validation.
        try:
            change_list_dict = self.payload.get('change_list')
            change_list = [
                exp_domain.ExplorationChange(change)
                for change in change_list_dict]
            version = self.payload.get('version')
            exp_services.create_or_update_draft(
                exploration_id, self.user_id, change_list, version,
                datetime.datetime.utcnow())
        except utils.ValidationError as e:
            # We leave any pre-existing draft changes in the datastore.
            raise self.InvalidInputException(e)
        exp_user_data = user_models.ExplorationUserDataModel.get(
            self.user_id, exploration_id)
        draft_change_list_id = exp_user_data.draft_change_list_id
        # If the draft_change_list_id is False, have the user discard the draft
        # changes. We save the draft to the datastore even if the version is
        # invalid, so that it is available for recovery later.
        self.render_json({
            'draft_change_list_id': draft_change_list_id,
            'is_version_of_draft_valid': exp_services.is_version_of_draft_valid(
                exploration_id, version)})

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        """Handles POST request for discarding draft changes."""
        exp_services.discard_draft(exploration_id, self.user_id)
        self.render_json({})
