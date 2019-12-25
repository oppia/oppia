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
from core.domain import user_services
from core.domain import user_domain
from core.platform import models
import feconf

(suggestion_models, user_models) = models.Registry.import_models(
    [models.NAMES.suggestion, models.NAMES.user])


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
        user_domain.Voiceover_APPLICATION_TARGET_TYPE_TO_DOMAIN_CLASSES)
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


def _get_voiceover_claimed_task_model(voiceover_claimed_task):
    """Return the VoiceoverClaimedTaskModel object for the given voiceover
    claimed task domain object.

    Args:
        voiceover_claimed_task: VoiceoverClaimedTask. The voiceover claimed task
        domain object.

    Returns:
        VoiceoverClaimedTaskModel. The model object for the given voiceover
        claimed task domain object.
    """
    return user_models.VoiceoverClaimedTaskModel(
        id=voiceover_claimed_task.id,
        target_type=voiceover_claimed_task.target_type,
        target_id=voiceover_claimed_task.target_id,
        user_id=voiceover_claimed_task.user_id,
        language_code=voiceover_claimed_task.language_code,
        content_count=voiceover_claimed_task.content_count,
        voiceover_count=voiceover_claimed_task.voiceover_count,
        voiceover_needs_update_count=(
            voiceover_claimed_task.voiceover_needs_update_count),
        completed=voiceover_claimed_task.completed)


def _get_voiceover_claimed_task_from_model(task_model):
    """Returns VoiceoverClaimedTask for the given VoiceoverClaimedTaskModel
    object.

    Args:
        task_model: VoiceoverClaimedTaskModel. The voiceover claimed task model
            object.

    Returns:
        VoiceoverClaimedTask. The VoiceoverClaimedTask domain object
        corresponding to the given voiceover claimed task model.
    """
    return user_domain.VoiceoverClaimedTask(
        task_model.id, task_model.target_type, task_model.target_id,
        task_model.user_id, task_model.language_code,
        task_model.content_count, task_model.voicoever_availability_count,
        task_model.voiceover_needs_update_count, task_model.completed)


def _save_voiceover_claimed_task(voiceover_claimed_task):
    """Save the given VoiceoverClaimedTask object as a VoiceoverClaimedTaskModel
    in the datastore.

    Args:
        voiceover_claimed_task: VoiceoverClaimedTask. The voiceover claimed task
            object which need to be saved.
    """
    voiceover_claimed_task.validate()
    voiceover_claimed_task_model = _get_voiceover_claimed_task_model(
        voiceover_claimed_task)
    voiceover_claimed_task_model.put()


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
    voiceover_application_to_accept = get_voiceover_application_by_id(
        voiceover_application_id)
    if reviewer_id == voiceover_application_to_accept.author_id:
        raise Exception(
            'Applicants are not allowed to review their own '
            'voiceover application.')

    voiceover_application_to_accept.accept(reviewer_id)

    if voiceover_application_to_accept.target_type == (
            feconf.ENTITY_TYPE_EXPLORATION):
        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids([
                voiceover_application_to_accept.target_id]))
        email_manager.send_accepted_voiceover_application_email(
            voiceover_application_to_accept.author_id,
            opportunities[0].chapter_title,
            voiceover_application_to_accept.language_code)
    # TODO(#7969): Add notification to the user's dashboard for the accepted
    # voiceover application.

    voiceover_applications = [voiceover_application_to_accept]
    voiceover_application_models = (
        suggestion_models.GeneralVoiceoverApplicationModel
        .get_voiceover_applications(
            voiceover_application_to_accept.target_type,
            voiceover_application_to_accept.target_id,
            voiceover_application_to_accept.language_code))

    for model in voiceover_application_models:
        if model.id != voiceover_application_id:
            voiceover_application = _get_voiceover_application_from_model(
                model)
            voiceover_application.targeted_opportunity_available = False
            voiceover_applications.append(voiceover_application)

    _save_voiceover_applications(voiceover_applications)


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

    voiceover_application.reject(reviewer_id, rejection_message)
    _save_voiceover_applications([voiceover_application])

    if voiceover_application.target_type == feconf.ENTITY_TYPE_EXPLORATION:
        opportunities = (
            opportunity_services.get_exploration_opportunity_summaries_by_ids([
                voiceover_application.target_id]))
        email_manager.send_rejected_voiceover_application_email(
            voiceover_application.author_id,
            opportunities[0].chapter_title,
            voiceover_application.language_code, rejection_message)
    # TODO(#7969): Add notification to the user's dashboard for the rejected
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


def get_user_claimed_voiceover_tasks(user_id):
    """Returns a list of voiceover task claimed by the user with the given
    user_id.

    Args:
        user_id: str. The ID of the user.

    Returns:
        list(VoiceoverClaimedTask). A list of VoiceoverClaimedTask objects.
    """
    claimed_task_models = (
        user_models.VoiceoverClaimedTaskModel
        .get_all_tasks_claimed_by_user(user_id))

    claimed_tasks = [
        _get_voiceover_claimed_task_from_model(model)
        for model in claimed_task_models]

    return claimed_tasks


def update_voiceover_claimed_tasks(target_type, target_id):
    """Updates the voiceover claimed task model with the updated targeted
    entity.

    Args:
        target_type: str. The type of the targeted entity.
        target_id: str. The ID of the target entity.

    Raises:
        Exception: The given target_type is invalid for voiceover claimed task.
    """
    if target_type == feconf.ENTITY_TYPE_EXPLORATION:
        claimed_task_models = (
            suggestion_models
            .VoiceoverClaimedTaskModel.get_targeted_task_models(
                target_type, target_id))
        if claimed_task_models:
            exploration = exp_fetchers.get_exploration_by_id(target_id)
            content_count = exploration.get_content_count()
            updated_voiceover_claimed_task_models = []
            for task_model in claimed_task_models:
                voiceover_claimed_task = _get_voiceover_application_from_model(
                    task_model)
                voiceover_claimed_task.content_count = content_count
                language_code = voiceover_claimed_task.language_code
                voiceover_claimed_task.voiceover_count = (
                    exploration.get_voiceover_availability_count_in_language(
                        language_code))
                voiceover_claimed_task.voiceover_needs_update_count = (
                    exploration.get_voiceover_needs_update_count_in_language(
                        language_code))

                if not voiceover_claimed_task.completed:
                    if voiceover_claimed_task.can_mark_task_completed():
                        voiceover_claimed_task.completed = True
                voiceover_claimed_task.validate()
                updated_voiceover_claimed_task_models.append(
                    _get_voiceover_claimed_task_model(voiceover_claimed_task))
        user_models.VoiceoverClaimedTaskModel.put_multi(
            updated_voiceover_claimed_task_models)
    else:
        raise Exception(
            'Invalid target_type for claimed voiceover tasks: %s' % target_type)


def claim_voiceover_task(user_id, target_type, target_id, language_code):
    """Marks a user claimed a voiceover task for corresponding to the entity
    represented by the give target_type and target_id in the give language.

    Args:
        user_id: str. The ID of the user who has claimed the task.
        target_type: str. The type of the targeted entity.
        target_id: str. The ID of the target entity.
        language_code: str. The language code for the voiceover task
            claimed.

    Raises:
        Exception: The given target_type is invalid for claiming voiceover task.
    """
    if target_type == feconf.ENTITY_TYPE_EXPLORATION:
        exploration = exp_fetchers.get_exploration_by_id(target_id)
        content_count = exploration.get_content_count()
        voicoever_availability_count = (
            exploration.get_voiceover_availability_count_in_language(
                language_code))
        voiceover_needs_update_count = (
            exploration.get_voiceover_needs_update_count_in_language(
                language_code))
        new_model_id = (
            user_models.VoiceoverClaimedTaskModel.get_new_id_for_task(
                target_type, target_id, language_code, user_id))
        voiceover_claimed_task = user_domain.VoiceoverClaimedTask(
            new_model_id, target_type, target_id, user_id, language_code,
            content_count, voicoever_availability_count,
            voiceover_needs_update_count, False)
        voiceover_claimed_task.validate()

        task_assignor_bot = user_services.UserActionsInfo(
            user_id=feconf.VOICEOVER_TASK_ASSIGNOR_BOT_USER_ID)

        rights_manager.assign_role_for_exploration(
            task_assignor_bot, target_id, user_id,
            rights_manager.ROLE_VOICE_ARTIST)
        opportunity_services.update_exploration_voiceover_opportunities(
            target_id, language_code)

        _save_voiceover_claimed_task(voiceover_claimed_task)
    else:
        raise Exception(
            'Invalid target_type for claiming voiceover task: %s' % target_type)


def acknowledge_voiceover_application_acceptance(voiceover_application_id):
    """Marks the voiceover application corresponding to the given
    voiceover_application_id has be acknowledged by the user.

    Args:
        voiceover_application_id: str. The Id of the voiceover application.
    """
    voiceover_application = get_voiceover_application_by_id(
        voiceover_application_id)

    voiceover_application.acknowledged_acceptance = True
    _save_voiceover_applications([voiceover_application])
