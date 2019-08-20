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

import datetime
import imghdr
import logging

from constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import dependency_registry
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import interaction_registry
from core.domain import rights_manager
from core.domain import search_services
from core.domain import state_domain
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_services
from core.platform import models
import feconf
import utils

import jinja2

app_identity_services = models.Registry.import_app_identity_services()
current_user_services = models.Registry.import_current_user_services()
(stats_models, user_models) = models.Registry.import_models(
    [models.NAMES.statistics, models.NAMES.user])


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


class EditorHandler(base.BaseHandler):
    """Base class for all handlers for the editor page."""
    pass


class ExplorationPage(EditorHandler):
    """The editor page for a single exploration."""

    EDITOR_PAGE_DEPENDENCY_IDS = ['codemirror']

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests."""
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)

        interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        interaction_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                interaction_dependency_ids + self.EDITOR_PAGE_DEPENDENCY_IDS))

        self.values.update({
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
            'can_voiceover': (
                rights_manager.check_can_voiceover_activity(
                    self.user, exploration_rights)),
            'can_unpublish': rights_manager.check_can_unpublish_activity(
                self.user, exploration_rights),
            'dependencies_html': jinja2.utils.Markup(dependencies_html),
            'meta_description': feconf.CREATE_PAGE_DESCRIPTION,
        })

        self.render_template('dist/exploration-editor-page.mainpage.html')


class ExplorationHandler(EditorHandler):
    """Page with editor data for a single exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Gets the data for the exploration overview page."""
        # 'apply_draft' and 'v'(version) are optional parameters because the
        # exploration history tab also uses this handler, and these parameters
        # are not used by that tab.
        version = self.request.get('v', default_value=None)
        apply_draft = self.request.get('apply_draft', default_value=False)

        user_settings = user_services.get_user_settings(self.user_id)
        has_seen_editor_tutorial = False
        has_seen_translation_tutorial = False
        if user_settings is not None:
            if user_settings.last_started_state_editor_tutorial:
                has_seen_editor_tutorial = True
            if user_settings.last_started_state_translation_tutorial:
                has_seen_translation_tutorial = True

        try:
            exploration_data = exp_services.get_user_exploration_data(
                self.user_id, exploration_id, apply_draft=apply_draft,
                version=version)
            exploration_data['show_state_editor_tutorial_on_load'] = (
                self.user_id and not has_seen_editor_tutorial)
            exploration_data['show_state_translation_tutorial_on_load'] = (
                self.user_id and not has_seen_translation_tutorial)
        except:
            raise self.PageNotFoundException

        self.values.update(exploration_data)
        self.render_json(self.values)

    @acl_decorators.can_edit_exploration
    def put(self, exploration_id):
        """Updates properties of the given exploration."""
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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

        exploration_data = exp_services.get_user_exploration_data(
            self.user_id, exploration_id)

        self.values.update(exploration_data)
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
        self.render_json(self.values)


class ExplorationRightsHandler(EditorHandler):
    """Handles management of exploration editing rights."""

    @acl_decorators.can_modify_exploration_roles
    def put(self, exploration_id):
        """Updates the editing rights for the given exploration."""
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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
                raise self.InvalidInputException(
                    'Sorry, we could not find the specified user.')

            rights_manager.assign_role_for_exploration(
                self.user, exploration_id, new_member_id, new_member_role)
            email_manager.send_role_notification_email(
                self.user_id, new_member_id, new_member_role, exploration_id,
                exploration.title)

        elif make_community_owned:
            exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
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


class ExplorationFileDownloader(EditorHandler):
    """Downloads an exploration as a zip file, or dict of YAML strings
    representing states.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_DOWNLOADABLE

    @acl_decorators.can_download_exploration
    def get(self, exploration_id):
        """Handles GET requests."""
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        version_str = self.request.get('v', default_value=exploration.version)
        output_format = self.request.get('output_format', default_value='zip')

        try:
            version = int(version_str)
        except ValueError:
            version = exploration.version

        # If the title of the exploration has changed, we use the new title.
        filename = 'oppia-%s-v%s.zip' % (
            utils.to_ascii(exploration.title.replace(' ', '')), version)

        if output_format == feconf.OUTPUT_FORMAT_ZIP:
            self.render_downloadable_file(
                exp_services.export_to_zip_file(
                    exploration_id, version=version),
                filename, 'text/plain')
        elif output_format == feconf.OUTPUT_FORMAT_JSON:
            self.render_json(exp_services.export_states_to_yaml(
                exploration_id, version=version))
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
        state_dict = self.payload.get('state_dict')
        width = self.payload.get('width')

        if not width or not state_dict:
            raise self.PageNotFoundException

        self.render_json({
            'yaml': state_domain.State.convert_state_dict_to_yaml(
                state_dict, width),
        })


class ExplorationSnapshotsHandler(EditorHandler):
    """Returns the exploration snapshot history."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests."""

        snapshots = exp_services.get_exploration_snapshots_metadata(
            exploration_id)

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
        current_exploration = exp_fetchers.get_exploration_by_id(
            exploration_id)

        self.render_json(stats_services.get_exploration_stats(
            exploration_id, current_exploration.version).to_frontend_dict())


class StateRulesStatsHandler(EditorHandler):
    """Returns detailed learner answer statistics for a state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_exploration_stats
    def get(self, exploration_id, escaped_state_name):
        """Handles GET requests."""
        current_exploration = exp_fetchers.get_exploration_by_id(
            exploration_id)

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


class FetchIssuesHandler(EditorHandler):
    """Handler used for retrieving the list of unresolved issues in an
    exploration. This removes the invalid issues and returns the remaining
    unresolved ones.
    """
    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_exploration_stats
    def get(self, exp_id):
        """Handles GET requests."""
        exp_version = self.request.get('exp_version')
        exp_issues = stats_services.get_exp_issues(exp_id, exp_version)
        if exp_issues is None:
            raise self.PageNotFoundException(
                'Invalid version %s for exploration ID %s'
                % (exp_version, exp_id))
        unresolved_issues = []
        for issue in exp_issues.unresolved_issues:
            if issue.is_valid:
                unresolved_issues.append(issue)
        exp_issues.unresolved_issues = unresolved_issues
        exp_issues_dict = exp_issues.to_dict()
        self.render_json(exp_issues_dict['unresolved_issues'])


class FetchPlaythroughHandler(EditorHandler):
    """Handler used for retrieving a playthrough."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_exploration_stats
    def get(self, unused_exploration_id, playthrough_id):
        """Handles GET requests."""
        playthrough = stats_services.get_playthrough_by_id(playthrough_id)
        if playthrough is None:
            raise self.PageNotFoundException(
                'Invalid playthrough ID %s' % (playthrough_id))
        self.render_json(playthrough.to_dict())


class ResolveIssueHandler(EditorHandler):
    """Handler used for resolving an issue. Currently, when an issue is
    resolved, the issue is removed from the unresolved issues list in the
    ExplorationIssuesModel instance, and all corresponding playthrough
    instances are deleted.
    """

    @acl_decorators.can_view_exploration_stats
    def post(self, exp_id):
        """Handles POST requests."""
        exp_issue_dict = self.payload.get('exp_issue_dict')
        try:
            unused_exp_issue = stats_domain.ExplorationIssue.from_backend_dict(
                exp_issue_dict)
        except utils.ValidationError as e:
            raise self.PageNotFoundException(e)

        exp_version = self.payload.get('exp_version')

        exp_issues = stats_services.get_exp_issues(exp_id, exp_version)
        if exp_issues is None:
            raise self.PageNotFoundException(
                'Invalid exploration ID %s' % (exp_id))

        # Check that the passed in issue actually exists in the exploration
        # issues instance.
        issue_to_remove = None
        for issue in exp_issues.unresolved_issues:
            if issue.to_dict() == exp_issue_dict:
                issue_to_remove = issue
                break

        if not issue_to_remove:
            raise self.PageNotFoundException(
                'Exploration issue does not exist in the list of issues for '
                'the exploration with ID %s' % exp_id)

        # Remove the issue from the unresolved issues list.
        exp_issues.unresolved_issues.remove(issue_to_remove)

        # Update the exploration issues instance and delete the playthrough
        # instances.
        stats_services.delete_playthroughs_multi(
            issue_to_remove.playthrough_ids)
        stats_services.save_exp_issues_model_transactional(exp_issues)

        self.render_json({})


class ImageUploadHandler(EditorHandler):
    """Handles image uploads."""

    # The string to prefix to the filename (before tacking the whole thing on
    # to the end of 'assets/').
    _FILENAME_PREFIX = 'image'
    _decorator = None

    @acl_decorators.can_edit_entity
    def post(self, entity_type, entity_id):
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
        if filename.rfind('.') == 0:
            raise self.InvalidInputException('Invalid filename')
        if '/' in filename or '..' in filename:
            raise self.InvalidInputException(
                'Filenames should not include slashes (/) or consecutive '
                'dot characters.')
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

        file_system_class = fs_services.get_entity_file_system_class()
        fs = fs_domain.AbstractFileSystem(file_system_class(
            entity_type, entity_id))
        filepath = '%s/%s' % (self._FILENAME_PREFIX, filename)

        if fs.isfile(filepath):
            raise self.InvalidInputException(
                'A file with the name %s already exists. Please choose a '
                'different name.' % filename)

        fs_services.save_original_and_compressed_versions_of_image(
            self.user_id, filename, entity_type, entity_id, raw)

        self.render_json({'filename': filename})


class StartedTutorialEventHandler(EditorHandler):
    """Records that this user has started the state editor tutorial."""

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles GET requests."""
        user_services.record_user_started_state_editor_tutorial(self.user_id)
        self.render_json({})


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


class StateAnswerStatisticsHandler(EditorHandler):
    """Returns basic learner answer statistics for a state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_view_exploration_stats
    def get(self, exploration_id):
        """Handles GET requests."""
        current_exploration = exp_fetchers.get_exploration_by_id(exploration_id)

        top_state_answers = stats_services.get_top_state_answer_stats_multi(
            exploration_id, current_exploration.states)
        top_state_interaction_ids = {
            state_name: current_exploration.states[state_name].interaction.id
            for state_name in top_state_answers
        }
        self.render_json({
            'answers': top_state_answers,
            'interaction_ids': top_state_interaction_ids,
        })


class TopUnresolvedAnswersHandler(EditorHandler):
    """Returns a list of top N unresolved answers."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id):
        """Handles GET requests for unresolved answers."""
        state_name = self.request.get('state_name')
        if not state_name:
            raise self.PageNotFoundException

        unresolved_answers_with_frequency = (
            stats_services.get_top_state_unresolved_answers(
                exploration_id, state_name))

        self.render_json({
            'unresolved_answers': unresolved_answers_with_frequency
        })


class LearnerAnswerInfoHandler(EditorHandler):
    """Handles the learner answer info for an exploration state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_edit_entity
    def get(self, entity_type, entity_id):
        """Handles the GET requests for learner answer info for an
        exploration state.
        """
        if not constants.ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE:
            raise self.PageNotFoundException

        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            state_name = self.request.get('state_name')
            if not state_name:
                raise self.InvalidInputException
            state_reference = (
                stats_services.get_state_reference_for_exploration(
                    entity_id, state_name))
        elif entity_type == feconf.ENTITY_TYPE_QUESTION:
            state_reference = (
                stats_services.get_state_reference_for_question(
                    entity_id))

        learner_answer_details = stats_services.get_learner_answer_details(
            entity_type, state_reference)
        learner_answer_info_dict_list = []
        if learner_answer_details is not None:
            learner_answer_info_dict_list = [
                learner_answer_info.to_dict() for learner_answer_info in
                learner_answer_details.learner_answer_info_list]
        self.render_json({
            'learner_answer_info_dict_list': learner_answer_info_dict_list
        })

    @acl_decorators.can_edit_entity
    def delete(self, entity_type, entity_id):
        """Deletes the learner answer info by the given id."""

        if not constants.ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE:
            raise self.PageNotFoundException

        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            state_name = self.request.get('state_name')
            if not state_name:
                raise self.InvalidInputException
            state_reference = (
                stats_services.get_state_reference_for_exploration(
                    entity_id, state_name))
        elif entity_type == feconf.ENTITY_TYPE_QUESTION:
            state_reference = (
                stats_services.get_state_reference_for_question(
                    entity_id))
        learner_answer_info_id = self.request.get('learner_answer_info_id')
        if not learner_answer_info_id:
            raise self.PageNotFoundException
        stats_services.delete_learner_answer_info(
            entity_type, state_reference, learner_answer_info_id)
        self.render_json({})
