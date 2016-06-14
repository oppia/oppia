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

import jinja2

from core.controllers import base
from core.domain import config_domain
from core.domain import dependency_registry
from core.domain import email_manager
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import gadget_registry
from core.domain import interaction_registry
from core.domain import rights_manager
from core.domain import rte_component_registry
from core.domain import rule_domain
from core.domain import stats_services
from core.domain import user_services
from core.domain import value_generators_domain
from core.platform import models
import feconf
import utils

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])

# The frontend template for a new state. It is sent to the frontend when the
# exploration editor page is first loaded, so that new states can be
# added in a way that is completely client-side.
# IMPORTANT: Before adding this state to an existing exploration, the
# state name and the destination of the default rule should first be
# changed to the desired new state name.
NEW_STATE_TEMPLATE = {
    'content': [{
        'type': 'text',
        'value': ''
    }],
    'interaction': exp_domain.State.NULL_INTERACTION_DICT,
    'param_changes': [],
    'unresolved_answers': {},
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


def require_editor(handler):
    """Decorator that checks if the user can edit the given exploration."""
    def test_editor(self, exploration_id, escaped_state_name=None, **kwargs):
        """Gets the user and exploration id if the user can edit it.

        Args:
            self: the handler instance
            exploration_id: the exploration id
            escaped_state_name: the URL-escaped state name, if it exists
            **kwargs: any other arguments passed to the handler

        Returns:
            The relevant handler, if the user is authorized to edit this
            exploration.

        Raises:
            self.PageNotFoundException: if no such exploration or state exists.
            self.UnauthorizedUserException: if the user exists but does not
                have the right credentials.
        """
        if not self.user_id:
            self.redirect(current_user_services.create_login_url(
                self.request.uri))
            return

        if self.username in config_domain.BANNED_USERNAMES.value:
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        if not rights_manager.Actor(self.user_id).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to edit this exploration.',
                self.user_id)

        if not escaped_state_name:
            return handler(self, exploration_id, **kwargs)

        state_name = utils.unescape_encoded_uri_component(escaped_state_name)
        if state_name not in exploration.states:
            logging.error('Could not find state: %s' % state_name)
            logging.error('Available states: %s' % exploration.states.keys())
            raise self.PageNotFoundException

        return handler(self, exploration_id, state_name, **kwargs)

    return test_editor


class EditorHandler(base.BaseHandler):
    """Base class for all handlers for the editor page."""

    # The page name to use as a key for generating CSRF tokens.
    PAGE_NAME_FOR_CSRF = 'editor'


class ExplorationPage(EditorHandler):
    """The editor page for a single exploration."""

    EDITOR_PAGE_DEPENDENCY_IDS = ['codemirror']

    def get(self, exploration_id):
        """Handles GET requests."""
        if exploration_id in feconf.DISABLED_EXPLORATION_IDS:
            self.render_template(
                'error/disabled_exploration.html', iframe_restriction=None)
            return

        exploration = exp_services.get_exploration_by_id(
            exploration_id, strict=False)
        if (exploration is None or
                not rights_manager.Actor(self.user_id).can_view(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id)):
            self.redirect('/')
            return

        can_edit = (
            bool(self.user_id) and
            self.username not in config_domain.BANNED_USERNAMES.value and
            rights_manager.Actor(self.user_id).can_edit(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id))

        interaction_ids = (
            interaction_registry.Registry.get_all_interaction_ids())

        interaction_dependency_ids = (
            interaction_registry.Registry.get_deduplicated_dependency_ids(
                interaction_ids))
        dependencies_html, additional_angular_modules = (
            dependency_registry.Registry.get_deps_html_and_angular_modules(
                interaction_dependency_ids + self.EDITOR_PAGE_DEPENDENCY_IDS))

        interaction_templates = (
            rte_component_registry.Registry.get_html_for_all_components() +
            interaction_registry.Registry.get_interaction_html(
                interaction_ids))
        interaction_validators_html = (
            interaction_registry.Registry.get_validators_html(
                interaction_ids))

        gadget_types = gadget_registry.Registry.get_all_gadget_types()
        gadget_templates = (
            gadget_registry.Registry.get_gadget_html(gadget_types))

        self.values.update({
            'GADGET_SPECS': gadget_registry.Registry.get_all_specs(),
            'INTERACTION_SPECS': interaction_registry.Registry.get_all_specs(),
            'PANEL_SPECS': feconf.PANELS_PROPERTIES,
            'DEFAULT_OBJECT_VALUES': rule_domain.get_default_object_values(),
            'DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR': (
                DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR.value),
            'additional_angular_modules': additional_angular_modules,
            'can_delete': rights_manager.Actor(
                self.user_id).can_delete(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'can_edit': can_edit,
            'can_modify_roles': rights_manager.Actor(
                self.user_id).can_modify_roles(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'can_publicize': rights_manager.Actor(
                self.user_id).can_publicize(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'can_publish': rights_manager.Actor(
                self.user_id).can_publish(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'can_release_ownership': rights_manager.Actor(
                self.user_id).can_release_ownership(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'can_unpublicize': rights_manager.Actor(
                self.user_id).can_unpublicize(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'can_unpublish': rights_manager.Actor(
                self.user_id).can_unpublish(
                    rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id),
            'dependencies_html': jinja2.utils.Markup(dependencies_html),
            'gadget_templates': jinja2.utils.Markup(gadget_templates),
            'interaction_templates': jinja2.utils.Markup(
                interaction_templates),
            'interaction_validators_html': jinja2.utils.Markup(
                interaction_validators_html),
            'meta_description': feconf.CREATE_PAGE_DESCRIPTION,
            'nav_mode': feconf.NAV_MODE_CREATE,
            'value_generators_js': jinja2.utils.Markup(
                get_value_generators_js()),
            'title': exploration.title,
            'ALL_LANGUAGE_CODES': feconf.ALL_LANGUAGE_CODES,
            'ALLOWED_GADGETS': feconf.ALLOWED_GADGETS,
            'ALLOWED_INTERACTION_CATEGORIES': (
                feconf.ALLOWED_INTERACTION_CATEGORIES),
            'INVALID_PARAMETER_NAMES': feconf.INVALID_PARAMETER_NAMES,
            'NEW_STATE_TEMPLATE': NEW_STATE_TEMPLATE,
            'SHOW_TRAINABLE_UNRESOLVED_ANSWERS': (
                feconf.SHOW_TRAINABLE_UNRESOLVED_ANSWERS),
            'TAG_REGEX': feconf.TAG_REGEX,
        })

        self.render_template('exploration_editor/exploration_editor.html')


class ExplorationHandler(EditorHandler):
    """Page with editor data for a single exploration."""

    PAGE_NAME_FOR_CSRF = 'editor'

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
            state_dict['unresolved_answers'] = (
                stats_services.get_top_unresolved_answers_for_default_rule(
                    exploration_id, state_name))
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
        editor_dict = {
            'category': exploration.category,
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
            'skin_customizations': exploration.skin_instance.to_dict()[
                'skin_customizations'],
            'states': states,
            'tags': exploration.tags,
            'title': exploration.title,
            'version': exploration.version,
            'is_version_of_draft_valid': is_version_of_draft_valid,
            'draft_changes': draft_changes
        }

        return editor_dict

    def get(self, exploration_id):
        """Gets the data for the exploration overview page."""
        if not rights_manager.Actor(self.user_id).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            raise self.PageNotFoundException
        # 'apply_draft' and 'v'(version) are optional parameters because the
        # exploration history tab also uses this handler, and these parameters
        # are not used by that tab.
        version = self.request.get('v', default_value=None)
        apply_draft = self.request.get('apply_draft', default_value=False)
        self.values.update(
            self._get_exploration_data(
                exploration_id, apply_draft=apply_draft, version=version))
        self.render_json(self.values)

    @require_editor
    def put(self, exploration_id):
        """Updates properties of the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        commit_message = self.payload.get('commit_message')
        change_list = self.payload.get('change_list')

        try:
            exp_services.update_exploration(
                self.user_id, exploration_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        self.values.update(self._get_exploration_data(exploration_id))
        self.render_json(self.values)

    @require_editor
    def delete(self, exploration_id):
        """Deletes the given exploration."""
        role = self.request.get('role')
        if not role:
            role = None

        if role == rights_manager.ROLE_ADMIN:
            if not self.is_admin:
                logging.error(
                    '%s tried to delete an exploration, but is not an admin.'
                    % self.user_id)
                raise self.UnauthorizedUserException(
                    'User %s does not have permissions to delete exploration '
                    '%s' % (self.user_id, exploration_id))
        elif role == rights_manager.ROLE_MODERATOR:
            if not self.is_moderator:
                logging.error(
                    '%s tried to delete an exploration, but is not a '
                    'moderator.' % self.user_id)
                raise self.UnauthorizedUserException(
                    'User %s does not have permissions to delete exploration '
                    '%s' % (self.user_id, exploration_id))
        elif role is not None:
            raise self.InvalidInputException('Invalid role: %s' % role)

        logging.info(
            '%s %s tried to delete exploration %s' %
            (role, self.user_id, exploration_id))

        exploration = exp_services.get_exploration_by_id(exploration_id)
        can_delete = rights_manager.Actor(self.user_id).can_delete(
            rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration.id)
        if not can_delete:
            raise self.UnauthorizedUserException(
                'User %s does not have permissions to delete exploration %s' %
                (self.user_id, exploration_id))

        is_exploration_cloned = rights_manager.is_exploration_cloned(
            exploration_id)
        exp_services.delete_exploration(
            self.user_id, exploration_id, force_deletion=is_exploration_cloned)

        logging.info(
            '%s %s deleted exploration %s' %
            (role, self.user_id, exploration_id))


class ExplorationRightsHandler(EditorHandler):
    """Handles management of exploration editing rights."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @require_editor
    def put(self, exploration_id):
        """Updates the editing rights for the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        is_public = self.payload.get('is_public')
        is_publicized = self.payload.get('is_publicized')
        is_community_owned = self.payload.get('is_community_owned')
        new_member_username = self.payload.get('new_member_username')
        new_member_role = self.payload.get('new_member_role')
        viewable_if_private = self.payload.get('viewable_if_private')

        if new_member_username:
            if not rights_manager.Actor(
                    self.user_id).can_modify_roles(
                        rights_manager.ACTIVITY_TYPE_EXPLORATION,
                        exploration_id):
                raise self.UnauthorizedUserException(
                    'Only an owner of this exploration can add or change '
                    'roles.')

            new_member_id = user_services.get_user_id_from_username(
                new_member_username)
            if new_member_id is None:
                raise Exception(
                    'Sorry, we could not find the specified user.')

            rights_manager.assign_role_for_exploration(
                self.user_id, exploration_id, new_member_id, new_member_role)
            email_manager.send_role_notification_email(
                self.user_id, new_member_id, new_member_role, exploration_id,
                exploration.title)

        elif is_public is not None:
            exploration = exp_services.get_exploration_by_id(exploration_id)
            if is_public:
                try:
                    exploration.validate(strict=True)
                except utils.ValidationError as e:
                    raise self.InvalidInputException(e)

                exp_services.publish_exploration_and_update_user_profiles(
                    self.user_id, exploration_id)
                exp_services.index_explorations_given_ids([exploration_id])
            else:
                rights_manager.unpublish_exploration(
                    self.user_id, exploration_id)
                exp_services.delete_documents_from_search_index([
                    exploration_id])

        elif is_publicized is not None:
            exploration = exp_services.get_exploration_by_id(exploration_id)
            if is_publicized:
                try:
                    exploration.validate(strict=True)
                except utils.ValidationError as e:
                    raise self.InvalidInputException(e)

                rights_manager.publicize_exploration(
                    self.user_id, exploration_id)
            else:
                rights_manager.unpublicize_exploration(
                    self.user_id, exploration_id)

        elif is_community_owned:
            exploration = exp_services.get_exploration_by_id(exploration_id)
            try:
                exploration.validate(strict=True)
            except utils.ValidationError as e:
                raise self.InvalidInputException(e)

            rights_manager.release_ownership_of_exploration(
                self.user_id, exploration_id)

        elif viewable_if_private is not None:
            rights_manager.set_private_viewability_of_exploration(
                self.user_id, exploration_id, viewable_if_private)

        else:
            raise self.InvalidInputException(
                'No change was made to this exploration.')

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict()
        })


class ExplorationModeratorRightsHandler(EditorHandler):
    """Handles management of exploration rights by moderators."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_moderator
    def put(self, exploration_id):
        """Updates the publication status of the given exploration, and sends
        an email to all its owners.
        """
        exploration = exp_services.get_exploration_by_id(exploration_id)
        action = self.payload.get('action')
        email_body = self.payload.get('email_body')
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        if action not in feconf.VALID_MODERATOR_ACTIONS:
            raise self.InvalidInputException('Invalid moderator action.')

        # If moderator emails can be sent, check that all the prerequisites are
        # satisfied, otherwise do nothing.
        if feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
            if not email_body:
                raise self.InvalidInputException(
                    'Moderator actions should include an email to the '
                    'recipient.')
            email_manager.require_moderator_email_prereqs_are_satisfied()

        # Perform the moderator action.
        if action == 'unpublish_exploration':
            rights_manager.unpublish_exploration(
                self.user_id, exploration_id)
            exp_services.delete_documents_from_search_index([
                exploration_id])
        elif action == 'publicize_exploration':
            try:
                exploration.validate(strict=True)
            except utils.ValidationError as e:
                raise self.InvalidInputException(e)

            rights_manager.publicize_exploration(
                self.user_id, exploration_id)
        else:
            raise self.InvalidInputException(
                'No change was made to this exploration.')

        exp_rights = rights_manager.get_exploration_rights(exploration_id)

        # If moderator emails can be sent, send an email to the all owners of
        # the exploration notifying them of the change.
        if feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
            for owner_id in exp_rights.owner_ids:
                email_manager.send_moderator_action_email(
                    self.user_id, owner_id,
                    feconf.VALID_MODERATOR_ACTIONS[action]['email_intent'],
                    exploration.title, email_body)

        self.render_json({
            'rights': exp_rights.to_dict(),
        })


class ResolvedAnswersHandler(EditorHandler):
    """Allows learners' answers for a state to be marked as resolved."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @require_editor
    def put(self, exploration_id, state_name):
        """Marks learners' answers as resolved."""
        resolved_answers = self.payload.get('resolved_answers')

        if not isinstance(resolved_answers, list):
            raise self.InvalidInputException(
                'Expected a list of resolved answers; received %s.' %
                resolved_answers)

        if 'resolved_answers' in self.payload:
            event_services.DefaultRuleAnswerResolutionEventHandler.record(
                exploration_id, state_name, resolved_answers)

        self.render_json({})


class UntrainedAnswersHandler(EditorHandler):
    """Returns answers that learners have submitted, but that Oppia hasn't been
    explicitly trained to respond to be an exploration author.
    """
    NUMBER_OF_TOP_ANSWERS_PER_RULE = 50

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
        # matched to a fuzzy rule individually.
        answers = stats_services.get_top_state_rule_answers(
            exploration_id, state_name, [
                exp_domain.DEFAULT_RULESPEC_STR, rule_domain.FUZZY_RULE_TYPE],
            self.NUMBER_OF_TOP_ANSWERS_PER_RULE)

        interaction = state.interaction
        unhandled_answers = []
        if feconf.SHOW_TRAINABLE_UNRESOLVED_ANSWERS and interaction.id:
            interaction_instance = (
                interaction_registry.Registry.get_interaction_by_id(
                    interaction.id))

            try:
                # Normalize the answers.
                for answer in answers:
                    answer['value'] = interaction_instance.normalize_answer(
                        answer['value'])

                trained_answers = set()
                for answer_group in interaction.answer_groups:
                    for rule_spec in answer_group.rule_specs:
                        if rule_spec.rule_type == rule_domain.FUZZY_RULE_TYPE:
                            trained_answers.update(
                                interaction_instance.normalize_answer(trained)
                                for trained
                                in rule_spec.inputs['training_data'])

                # Include all the answers which have been confirmed to be
                # associated with the default outcome.
                trained_answers.update(set(
                    interaction_instance.normalize_answer(confirmed)
                    for confirmed
                    in interaction.confirmed_unclassified_answers))

                unhandled_answers = [
                    answer for answer in answers
                    if answer['value'] not in trained_answers
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
    def get(self, exploration_id):
        """Handles GET requests."""
        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        if not rights_manager.Actor(self.user_id).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            raise self.PageNotFoundException

        version = self.request.get('v', default_value=exploration.version)
        output_format = self.request.get('output_format', default_value='zip')
        width = int(self.request.get('width', default_value=80))

        # If the title of the exploration has changed, we use the new title
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


class StateDownloadHandler(EditorHandler):
    """Downloads a state as a YAML string."""

    def get(self, exploration_id):
        """Handles GET requests."""
        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        if not rights_manager.Actor(self.user_id).can_view(
                rights_manager.ACTIVITY_TYPE_EXPLORATION, exploration_id):
            raise self.PageNotFoundException

        version = self.request.get('v', default_value=exploration.version)
        width = int(self.request.get('width', default_value=80))

        try:
            state = self.request.get('state')
        except:
            raise self.InvalidInputException('State not found')

        exploration_dict = exp_services.export_states_to_yaml(
            exploration_id, version=version, width=width)
        if state not in exploration_dict:
            raise self.PageNotFoundException
        self.response.write(exploration_dict[state])


class ExplorationResourcesHandler(EditorHandler):
    """Manages assets associated with an exploration."""

    @require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')

        self.render_json({'filepaths': dir_list})


class ExplorationSnapshotsHandler(EditorHandler):
    """Returns the exploration snapshot history."""

    def get(self, exploration_id):
        """Handles GET requests."""

        try:
            snapshots = exp_services.get_exploration_snapshots_metadata(
                exploration_id)
        except:
            raise self.PageNotFoundException

        # Patch `snapshots` to use the editor's display name.
        for snapshot in snapshots:
            if snapshot['committer_id'] != feconf.SYSTEM_COMMITTER_ID:
                snapshot['committer_id'] = user_services.get_username(
                    snapshot['committer_id'])

        self.render_json({
            'snapshots': snapshots,
        })


class ExplorationRevertHandler(EditorHandler):
    """Reverts an exploration to an older version."""

    @require_editor
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
    """Returns statistics for an exploration."""

    def get(self, exploration_id, exploration_version):
        """Handles GET requests."""
        try:
            exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        self.render_json(stats_services.get_exploration_stats(
            exploration_id, exploration_version))


class ExplorationStatsVersionsHandler(EditorHandler):
    """Returns statistics versions for an exploration."""

    def get(self, exploration_id):
        """Handles GET requests."""
        try:
            exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        self.render_json({
            'versions': stats_services.get_versions_for_exploration_stats(
                exploration_id)})


class StateRulesStatsHandler(EditorHandler):
    """Returns detailed learner answer statistics for a state."""

    def get(self, exploration_id, escaped_state_name):
        """Handles GET requests."""
        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        state_name = utils.unescape_encoded_uri_component(escaped_state_name)
        if state_name not in exploration.states:
            logging.error('Could not find state: %s' % state_name)
            logging.error('Available states: %s' % exploration.states.keys())
            raise self.PageNotFoundException

        self.render_json({
            'rules_stats': stats_services.get_state_rules_stats(
                exploration_id, state_name)
        })


class ImageUploadHandler(EditorHandler):
    """Handles image uploads."""

    @require_editor
    def post(self, exploration_id):
        """Saves an image uploaded by a content creator."""

        raw = self.request.get('image')
        filename = self.payload.get('filename')
        if not raw:
            raise self.InvalidInputException('No image supplied')

        file_format = imghdr.what(None, h=raw)
        if file_format not in feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS:
            allowed_formats = ', '.join(
                feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.keys())
            raise Exception('Image file not recognized: it should be in '
                            'one of the following formats: %s.' %
                            allowed_formats)

        if not filename:
            raise self.InvalidInputException('No filename supplied')
        if '/' in filename or '..' in filename:
            raise self.InvalidInputException(
                'Filenames should not include slashes (/) or consecutive dot '
                'characters.')
        if '.' in filename:
            dot_index = filename.rfind('.')
            primary_name = filename[:dot_index]
            extension = filename[dot_index + 1:].lower()
            if (extension not in
                    feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS[file_format]):
                raise self.InvalidInputException(
                    'Expected a filename ending in .%s; received %s' %
                    (file_format, filename))
        else:
            primary_name = filename

        filepath = '%s.%s' % (primary_name, file_format)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        if fs.isfile(filepath):
            raise self.InvalidInputException(
                'A file with the name %s already exists. Please choose a '
                'different name.' % filepath)
        fs.commit(self.user_id, filepath, raw)

        self.render_json({'filepath': filepath})


class ChangeListSummaryHandler(EditorHandler):
    """Returns a summary of a changelist applied to a given exploration."""

    @require_editor
    def post(self, exploration_id):
        """Handles POST requests."""
        change_list = self.payload.get('change_list')
        version = self.payload.get('version')
        current_exploration = exp_services.get_exploration_by_id(
            exploration_id)

        if version != current_exploration.version:
            # TODO(sll): Improve the handling of merge conflicts.
            self.render_json({
                'is_version_of_draft_valid': False
            })
        else:
            utils.recursively_remove_key(change_list, '$$hashKey')

            summary = exp_services.get_summary_of_change_list(
                current_exploration, change_list)
            updated_exploration = exp_services.apply_change_list(
                exploration_id, change_list)
            warning_message = ''
            try:
                updated_exploration.validate(strict=True)
            except utils.ValidationError as e:
                warning_message = unicode(e)

            self.render_json({
                'summary': summary,
                'warning_message': warning_message
            })


class StartedTutorialEventHandler(EditorHandler):
    """Records that this user has started the state editor tutorial."""

    def post(self):
        """Handles GET requests."""
        user_services.record_user_started_state_editor_tutorial(self.user_id)


class EditorAutosaveHandler(ExplorationHandler):
    """Handles requests from the editor for draft autosave."""

    @require_editor
    def put(self, exploration_id):
        """Handles PUT requests for draft updation."""
        # Raise an Exception if the draft change list fails non-strict
        # validation.
        try:
            change_list = self.payload.get('change_list')
            version = self.payload.get('version')
            exp_services.create_or_update_draft(
                exploration_id, self.user_id, change_list, version,
                datetime.datetime.utcnow())
        except utils.ValidationError as e:
            # We leave any pre-existing draft changes in the datastore.
            raise self.InvalidInputException(e)

        # If the value passed here is False, have the user discard the draft
        # changes. We save the draft to the datastore even if the version is
        # invalid, so that it is available for recovery later.
        self.render_json({
            'is_version_of_draft_valid': exp_services.is_version_of_draft_valid(
                exploration_id, version)})

    @require_editor
    def post(self, exploration_id):
        """Handles POST request for discarding draft changes."""
        exp_services.discard_draft(exploration_id, self.user_id)
        self.render_json({})
