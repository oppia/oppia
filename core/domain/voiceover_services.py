# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Functions to perform actions related to voiceover application."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import email_manager
from core.domain import exp_fetchers
from core.domain import opportunity_services
from core.domain import rights_manager
from core.domain import suggestion_registry
from core.domain import user_services
from core.platform import models
import feconf

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])


def _get_voiceover_application_class(target_type):
    """Returns the voiceover application class for a given target type.

    Args:
        target_type: str. The target type of the voiceover application.

    Returns:
        class. The voiceover application class for the given target type.

    Raises:
        Exception: The voiceover application target type is invalid.
    """
    target_type_to_classes = (
        suggestion_registry.VOICEOVER_APPLICATION_TARGET_TYPE_TO_DOMAIN_CLASSES)
    if target_type in target_type_to_classes:
        return target_type_to_classes[target_type]
    else:
        raise Exception(
            'Invalid target type for voiceover application: %s' % target_type)


def _get_voiceover_application_model(voiceover_application):
    """Returns the GeneralVoiceoverApplicationModel object for the give
    voiceover application object.

    Args:
        voiceover_application: BaseVoiceoverApplication. The voiceover
            application object.

    Returns:
        GeneralVoiceoverApplicationModel. The model object out of the given
        application object.
    """
    return suggestion_models.GeneralVoiceoverApplicationModel(
        id=voiceover_application.voiceover_application_id,
        target_type=voiceover_application.target_type,
        target_id=voiceover_application.target_id,
        status=voiceover_application.status,
        author_id=voiceover_application.author_id,
        final_reviewer_id=voiceover_application.final_reviewer_id,
        language_code=voiceover_application.language_code,
        filename=voiceover_application.filename,
        content=voiceover_application.content,
        rejection_message=voiceover_application.rejection_message)


def _get_voiceover_application_from_model(voiceover_application_model):
    """Returns the BaseVoiceoverApplication object for the give
    voiceover application model object.

    Args:
        voiceover_application_model: GeneralVoiceoverApplicationModel. The
            voiceover application model object.

    Returns:
        BaseVoiceoverApplication. The domain object out of the given voiceover
        application model object.
    """
    voiceover_application_class = _get_voiceover_application_class(
        voiceover_application_model.target_type)
    return voiceover_application_class(
        voiceover_application_model.id,
        voiceover_application_model.target_id,
        voiceover_application_model.status,
        voiceover_application_model.author_id,
        voiceover_application_model.final_reviewer_id,
        voiceover_application_model.language_code,
        voiceover_application_model.filename,
        voiceover_application_model.content,
        voiceover_application_model.rejection_message)


def _save_voiceover_applications(voiceover_applications):
    """Saves a list of given voiceover application object in datastore.

    Args:
        voiceover_applications: list(BaseVoiceoverApplication). The list of
            voiceover application objects.
    """
    voiceover_application_models = []
    for voiceover_application in voiceover_applications:
        voiceover_application.validate()
        voiceover_application_model = _get_voiceover_application_model(
            voiceover_application)
        voiceover_application_models.append(voiceover_application_model)

    suggestion_models.GeneralVoiceoverApplicationModel.put_multi(
        voiceover_application_models)


def get_voiceover_application_by_id(voiceover_application_id):
    """Returns voiceover application model corresponding to give id.

    Args:
        voiceover_application_id: str. The voiceover application id.

    Returns:
        BaseVoiceoverApplication. The voiceover application object for the give
        application id.
    """
    voiceover_application_model = (
        suggestion_models.GeneralVoiceoverApplicationModel.get_by_id(
            voiceover_application_id))
    return _get_voiceover_application_from_model(voiceover_application_model)


def get_reviewable_voiceover_applications(user_id):
    """Returns a list of voiceover applications which the given user can review.

    Args:
        user_id: str. The user ID of the reviewer.

    Returns:
        list(BaseVoiceoverApplication). A list of voiceover application which
        the given user can review.
    """
    voiceover_application_models = (
        suggestion_models.GeneralVoiceoverApplicationModel
        .get_reviewable_voiceover_applications(user_id))

    return [
        _get_voiceover_application_from_model(model) for model in (
            voiceover_application_models)]


def get_user_submitted_voiceover_applications(user_id, status=None):
    """Returns a list of voiceover application submitted by the given user which
    are currently in the given status.

    Args:
        user_id: str. The id of the user.
        status: str|None. The status of the voiceover application.

    Returns:
        BaseVoiceoverApplication). A list of voiceover application which are
        submitted by the given user.
    """
    voiceover_application_models = (
        suggestion_models.GeneralVoiceoverApplicationModel
        .get_user_voiceover_applications(user_id, status))

    return [
        _get_voiceover_application_from_model(model) for model in (
            voiceover_application_models)]


def accept_voiceover_application(voiceover_application_id, reviewer_id):
    """Accept the voiceover application of given voiceover application id.

    Args:
        voiceover_application_id: str. The id of the voiceover application which
            need to be accepted.
        reviewer_id: str. The user ID of the reviewer.
    """
    voiceover_application = get_voiceover_application_by_id(
        voiceover_application_id)
    if reviewer_id == voiceover_application.author_id:
        raise Exception(
            'Applicants are not allowed to review their own '
            'voiceover application.')

    reviewer = user_services.UserActionsInfo(user_id=reviewer_id)

    voiceover_application.accept(reviewer_id)

    _save_voiceover_applications([voiceover_application])

    if voiceover_application.target_type == feconf.ENTITY_TYPE_EXPLORATION:
        rights_manager.assign_role_for_exploration(
            reviewer, voiceover_application.target_id,
            voiceover_application.author_id, rights_manager.ROLE_VOICE_ARTIST)
        opportunity_services.update_exploration_voiceover_opportunities(
            voiceover_application.target_id,
            voiceover_application.language_code)
        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids([
                voiceover_application.target_id]))
        email_manager.send_accepted_voiceover_application_email(
            voiceover_application.author_id,
            opportunities[0].chapter_title,
            voiceover_application.language_code)
    # TODO(#7969): Add notification to the user's dashboard for the accepted
    # voiceover application.

    voiceover_application_models = (
        suggestion_models.GeneralVoiceoverApplicationModel
        .get_voiceover_applications(
            voiceover_application.target_type, voiceover_application.target_id,
            voiceover_application.language_code))
    rejected_voiceover_applications = []
    for model in voiceover_application_models:
        voiceover_application = _get_voiceover_application_from_model(
            model)
        if not voiceover_application.is_handled:
            voiceover_application.reject(
                reviewer_id, 'We have to reject your application as another '
                'application for the same opportunity got accepted.')
            rejected_voiceover_applications.append(voiceover_application)

    _save_voiceover_applications(rejected_voiceover_applications)


def reject_voiceover_application(
        voiceover_application_id, reviewer_id, rejection_message):
    """Rejects the voiceover application of given voiceover application id.

    Args:
        voiceover_application_id: str. The is of the voiceover application which
            need to be rejected.
        reviewer_id: str. The user ID of the reviewer.
        rejection_message: str. The plain text message submitted by the
            reviewer while rejecting the application.
    """
    voiceover_application = get_voiceover_application_by_id(
        voiceover_application_id)
    if reviewer_id == voiceover_application.author_id:
        raise Exception(
            'Applicants are not allowed to review their own '
            'voiceover application.')

    reviewer = user_services.UserActionsInfo(user_id=reviewer_id)

    voiceover_application.reject(reviewer.user_id, rejection_message)
    _save_voiceover_applications([voiceover_application])

    if voiceover_application.target_type == feconf.ENTITY_TYPE_EXPLORATION:
        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids([
                voiceover_application.target_id]))
        email_manager.send_rejected_voiceover_application_email(
            voiceover_application.author_id,
            opportunities[0].chapter_title,
            voiceover_application.language_code, rejection_message)
    # TODO(#7969): Add notification to the user's dashboard for the accepted
    # voiceover application.


def create_new_voiceover_application(
        target_type, target_id, language_code, content, filename, author_id):
    """Creates a new voiceover application withe the given data.

    Args:
        target_type: str. The string representing the type of the target entity.
        target_id: str. The ID of the target entity.
        language_code: str. The language code for the voiceover application.
        content: str. The html content which is voiceover in the
            application.
        filename: str. The filename of the voiceover audio.
        author_id: str. The ID of the user who submitted the voiceover
            application.
    """
    voiceover_application_class = _get_voiceover_application_class(target_type)
    voiceover_application_id = (
        suggestion_models.GeneralVoiceoverApplicationModel.get_new_id(''))
    voiceover_application = voiceover_application_class(
        voiceover_application_id, target_id, suggestion_models.STATUS_IN_REVIEW,
        author_id, None, language_code, filename, content, None)

    _save_voiceover_applications([voiceover_application])


def get_text_to_create_voiceover_application(
        target_type, target_id, language_code):
    """Returns a text to voiceover for a voiceover application.

    Args:
        target_type: str. The string representing the type of the target entity.
        target_id: str. The ID of the target entity.
        language_code: str. The language code for the content.

    Returns:
        str. The text which can be voiceover for a voiceover application.
    """
    if target_type == feconf.ENTITY_TYPE_EXPLORATION:
        exploration = exp_fetchers.get_exploration_by_id(target_id)
        init_state_name = exploration.init_state_name
        state = exploration.states[init_state_name]
        if exploration.language_code == language_code:
            return state.content.html
        else:
            return state.written_translations.get_translated_content(
                state.content.content_id, language_code)
    else:
        raise Exception('Invalid target type: %s' % target_type)
