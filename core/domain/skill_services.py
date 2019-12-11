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

"""Commands that can be used to operate on skills."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import logging

from core.domain import opportunity_services
from core.domain import role_services
from core.domain import skill_domain
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
import feconf
import python_utils

(skill_models, user_models, question_models) = models.Registry.import_models(
    [models.NAMES.skill, models.NAMES.user, models.NAMES.question])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()


def _migrate_skill_contents_to_latest_schema(versioned_skill_contents):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the skill contents structure based on the schema version of the input
    skill contents dictionary. If the current skill_contents schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_skill_contents: A dict with two keys:
          - schema_version: int. The schema version for the skill_contents dict.
          - skill_contents: dict. The dict comprising the skill contents.

    Raises:
        Exception: The schema version of the skill_contents is outside of what
            is supported at present.
    """
    skill_contents_schema_version = versioned_skill_contents['schema_version']
    if not (1 <= skill_contents_schema_version
            <= feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d skill schemas at '
            'present.' % feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION)

    while (skill_contents_schema_version <
           feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        skill_domain.Skill.update_skill_contents_from_model(
            versioned_skill_contents, skill_contents_schema_version)
        skill_contents_schema_version += 1


def _migrate_misconceptions_to_latest_schema(versioned_misconceptions):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the misconceptions structure based on the schema version of the input
    misconceptions dictionary. If the current misconceptions schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_misconceptions: dict. A dict with two keys:
          - schema_version: int. The schema version for the misconceptions dict.
          - misconceptions: list(dict). The list of dicts comprising the skill
              misconceptions.

    Raises:
        Exception: The schema version of misconceptions is outside of what
            is supported at present.
    """
    misconception_schema_version = versioned_misconceptions['schema_version']
    if not (1 <= misconception_schema_version
            <= feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d misconception schemas at '
            'present.' % feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION)

    while (misconception_schema_version <
           feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        skill_domain.Skill.update_misconceptions_from_model(
            versioned_misconceptions, misconception_schema_version)
        misconception_schema_version += 1


def _migrate_rubrics_to_latest_schema(versioned_rubrics):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the rubrics structure based on the schema version of the input
    rubrics dictionary. If the current rubrics schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_rubrics: dict. A dict with two keys:
          - schema_version: int. The schema version for the rubrics dict.
          - rubrics: list(dict). The list of dicts comprising the skill
              rubrics.

    Raises:
        Exception: The schema version of rubrics is outside of what
            is supported at present.
    """
    rubric_schema_version = versioned_rubrics['schema_version']
    if not (1 <= rubric_schema_version
            <= feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d rubric schemas at '
            'present.' % feconf.CURRENT_RUBRIC_SCHEMA_VERSION)

    while (rubric_schema_version <
           feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
        skill_domain.Skill.update_rubrics_from_model(
            versioned_rubrics, rubric_schema_version)
        rubric_schema_version += 1


# Repository GET methods.
def _get_skill_memcache_key(skill_id, version=None):
    """Returns a memcache key for the skill.

    Args:
        skill_id: str. ID of the skill.
        version: int or None. Schema version of the skill.

    Returns:
        str. The memcache key of the skill.
    """
    if version:
        return 'skill-version:%s:%s' % (skill_id, version)
    else:
        return 'skill:%s' % skill_id


def get_merged_skill_ids():
    """Returns the skill IDs of skills that have been merged.

    Returns:
        list(str). List of skill IDs of merged skills.
    """
    return [skill.id for skill in skill_models.SkillModel.get_merged_skills()]


def get_skill_from_model(skill_model):
    """Returns a skill domain object given a skill model loaded
    from the datastore.

    Args:
        skill_model: SkillModel. The skill model loaded from the
            datastore.

    Returns:
        skill. A Skill domain object corresponding to the given
        skill model.
    """

    # Ensure the original skill model does not get altered.
    versioned_skill_contents = {
        'schema_version': skill_model.skill_contents_schema_version,
        'skill_contents': copy.deepcopy(skill_model.skill_contents)
    }

    versioned_misconceptions = {
        'schema_version': skill_model.misconceptions_schema_version,
        'misconceptions': copy.deepcopy(skill_model.misconceptions)
    }

    versioned_rubrics = {
        'schema_version': skill_model.rubric_schema_version,
        'rubrics': copy.deepcopy(skill_model.rubrics)
    }

    # Migrate the skill if it is not using the latest schema version.
    if (skill_model.skill_contents_schema_version !=
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        _migrate_skill_contents_to_latest_schema(versioned_skill_contents)

    if (skill_model.misconceptions_schema_version !=
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        _migrate_misconceptions_to_latest_schema(versioned_misconceptions)

    if (skill_model.rubric_schema_version !=
            feconf.CURRENT_RUBRIC_SCHEMA_VERSION):
        _migrate_rubrics_to_latest_schema(versioned_rubrics)

    return skill_domain.Skill(
        skill_model.id, skill_model.description,
        [
            skill_domain.Misconception.from_dict(misconception)
            for misconception in versioned_misconceptions['misconceptions']
        ], [
            skill_domain.Rubric.from_dict(rubric)
            for rubric in versioned_rubrics['rubrics']
        ], skill_domain.SkillContents.from_dict(
            versioned_skill_contents['skill_contents']),
        versioned_misconceptions['schema_version'],
        versioned_rubrics['schema_version'],
        versioned_skill_contents['schema_version'],
        skill_model.language_code,
        skill_model.version, skill_model.next_misconception_id,
        skill_model.superseding_skill_id, skill_model.all_questions_merged,
        skill_model.prerequisite_skill_ids, skill_model.created_on,
        skill_model.last_updated)


def get_all_skill_summaries():
    """Returns the summaries of all skills present in the datastore.

    Returns:
        list(SkillSummary). The list of summaries of all skills present in the
            datastore.
    """
    skill_summaries_models = skill_models.SkillSummaryModel.get_all()
    skill_summaries = [
        get_skill_summary_from_model(summary)
        for summary in skill_summaries_models]
    return skill_summaries


def get_multi_skill_summaries(skill_ids):
    """Returns a list of skill summaries matching the skill IDs provided.

    Args:
        skill_ids: list(str). List of skill IDs to get skill summaries for.

    Returns:
        list(SkillSummary). The list of summaries of skills matching the
            provided IDs.
    """
    skill_summaries_models = skill_models.SkillSummaryModel.get_multi(skill_ids)
    skill_summaries = [
        get_skill_summary_from_model(skill_summary_model)
        for skill_summary_model in skill_summaries_models
        if skill_summary_model is not None]
    return skill_summaries


def get_multi_skills(skill_ids):
    """Returns a list of skills matching the skill IDs provided.

    Args:
        skill_ids: list(str). List of skill IDs to get skills for.

    Returns:
        list(Skill). The list of skills matching the provided IDs.
    """
    local_skill_models = skill_models.SkillModel.get_multi(skill_ids)
    for skill_id, skill_model in python_utils.ZIP(
            skill_ids, local_skill_models):
        if skill_model is None:
            raise Exception('No skill exists for ID %s' % skill_id)
    skills = [
        get_skill_from_model(skill_model)
        for skill_model in local_skill_models
        if skill_model is not None]
    return skills


def get_rubrics_of_skills(skill_ids):
    """Returns a list of rubrics corresponding to given skills.

    Args:
        skill_ids: list(str). The list of skill IDs.

    Returns:
        dict, list(str). The skill rubrics of skills keyed by their
            corresponding ids and the list of deleted skill ids, if any.
    """
    backend_skill_models = skill_models.SkillModel.get_multi(skill_ids)
    skill_id_to_rubrics_dict = {}

    for skill_model in backend_skill_models:
        if skill_model is not None:
            skill_id_to_rubrics_dict[skill_model.id] = skill_model.rubrics

    deleted_skill_ids = []
    for skill_id in skill_ids:
        if skill_id not in skill_id_to_rubrics_dict:
            skill_id_to_rubrics_dict[skill_id] = None
            deleted_skill_ids.append(skill_id)

    return skill_id_to_rubrics_dict, deleted_skill_ids


def get_descriptions_of_skills(skill_ids):
    """Returns a list of skill descriptions corresponding to the given skills.

    Args:
        skill_ids: list(str). The list of skill ids.

    Returns:
        dict, list(str). The skill descriptions of skills keyed by their
            corresponding ids and the list of deleted skill ids, if any.
    """
    skill_summary_models = skill_models.SkillSummaryModel.get_multi(skill_ids)
    skill_id_to_description_dict = {}

    for skill_summary_model in skill_summary_models:
        if skill_summary_model is not None:
            skill_id_to_description_dict[skill_summary_model.id] = (
                skill_summary_model.description)

    deleted_skill_ids = []
    for skill_id in skill_ids:
        if skill_id not in skill_id_to_description_dict:
            skill_id_to_description_dict[skill_id] = None
            deleted_skill_ids.append(skill_id)

    return skill_id_to_description_dict, deleted_skill_ids


def get_skill_summary_from_model(skill_summary_model):
    """Returns a domain object for an Oppia skill summary given a
    skill summary model.

    Args:
        skill_summary_model: SkillSummaryModel.

    Returns:
        SkillSummary.
    """
    return skill_domain.SkillSummary(
        skill_summary_model.id, skill_summary_model.description,
        skill_summary_model.language_code,
        skill_summary_model.version,
        skill_summary_model.misconception_count,
        skill_summary_model.worked_examples_count,
        skill_summary_model.skill_model_created_on,
        skill_summary_model.skill_model_last_updated
    )


def get_skill_by_id(skill_id, strict=True, version=None):
    """Returns a domain object representing a skill.

    Args:
        skill_id: str. ID of the skill.
        strict: bool. Whether to fail noisily if no skill with the given
            id exists in the datastore.
        version: int or None. The version number of the skill to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Skill or None. The domain object representing a skill with the
        given id, or None if it does not exist.
    """
    skill_memcache_key = _get_skill_memcache_key(
        skill_id, version=version)
    memcached_skill = memcache_services.get_multi(
        [skill_memcache_key]).get(skill_memcache_key)

    if memcached_skill is not None:
        return memcached_skill
    else:
        skill_model = skill_models.SkillModel.get(
            skill_id, strict=strict, version=version)
        if skill_model:
            skill = get_skill_from_model(skill_model)
            memcache_services.set_multi({skill_memcache_key: skill})
            return skill
        else:
            return None


def get_skill_summary_by_id(skill_id, strict=True):
    """Returns a domain object representing a skill summary.

    Args:
        skill_id: str. ID of the skill summary.
        strict: bool. Whether to fail noisily if no skill summary with the given
            id exists in the datastore.

    Returns:
        SkillSummary. The skill summary domain object corresponding to
        a skill with the given skill_id.
    """
    skill_summary_model = skill_models.SkillSummaryModel.get(
        skill_id, strict=strict)
    if skill_summary_model:
        skill_summary = get_skill_summary_from_model(
            skill_summary_model)
        return skill_summary
    else:
        return None


def get_new_skill_id():
    """Returns a new skill id.

    Returns:
        str. A new skill id.
    """
    return skill_models.SkillModel.get_new_id('')


def _create_skill(committer_id, skill, commit_message, commit_cmds):
    """Creates a new skill.

    Args:
        committer_id: str. ID of the committer.
        skill: Skill. The skill domain object.
        commit_message: str. A description of changes made to the skill.
        commit_cmds: list(SkillChange). A list of change commands made to the
            given skill.
    """
    skill.validate()
    create_new_skill_rights(skill.id, committer_id)
    model = skill_models.SkillModel(
        id=skill.id,
        description=skill.description,
        language_code=skill.language_code,
        misconceptions=[
            misconception.to_dict()
            for misconception in skill.misconceptions
        ],
        rubrics=[
            rubric.to_dict()
            for rubric in skill.rubrics
        ],
        skill_contents=skill.skill_contents.to_dict(),
        next_misconception_id=skill.next_misconception_id,
        misconceptions_schema_version=skill.misconceptions_schema_version,
        rubric_schema_version=skill.rubric_schema_version,
        skill_contents_schema_version=skill.skill_contents_schema_version,
        superseding_skill_id=skill.superseding_skill_id,
        all_questions_merged=skill.all_questions_merged,
        prerequisite_skill_ids=skill.prerequisite_skill_ids
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    skill.version += 1
    create_skill_summary(skill.id)
    opportunity_services.create_skill_opportunity(
        skill_id=skill.id,
        skill_description=skill.description)


def save_new_skill(committer_id, skill):
    """Saves a new skill.

    Args:
        committer_id: str. ID of the committer.
        skill: Skill. Skill to be saved.
    """
    commit_message = 'New skill created.'
    _create_skill(
        committer_id, skill, commit_message, [skill_domain.SkillChange({
            'cmd': skill_domain.CMD_CREATE_NEW
        })])


def apply_change_list(skill_id, change_list, committer_id):
    """Applies a changelist to a skill and returns the result.

    Args:
        skill_id: str. ID of the given skill.
        change_list: list(SkillChange). A change list to be applied to the given
            skill.
        committer_id: str. The ID of the committer of this change list.

    Returns:
        Skill. The resulting skill domain object.
    """
    skill = get_skill_by_id(skill_id)
    user = user_services.UserActionsInfo(committer_id)
    try:
        for change in change_list:
            if change.cmd == skill_domain.CMD_UPDATE_SKILL_PROPERTY:
                if (change.property_name ==
                        skill_domain.SKILL_PROPERTY_DESCRIPTION):
                    if role_services.ACTION_EDIT_SKILL_DESCRIPTION not in (
                            user.actions):
                        raise Exception(
                            'The user does not have enough rights to edit the '
                            'skill description.')
                    skill.update_description(change.new_value)
                    (opportunity_services
                     .update_skill_opportunity_skill_description(
                         skill.id, change.new_value))
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_LANGUAGE_CODE):
                    skill.update_language_code(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID):
                    skill.update_superseding_skill_id(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED):
                    skill.record_that_all_questions_are_merged(change.new_value)
            elif change.cmd == skill_domain.CMD_UPDATE_SKILL_CONTENTS_PROPERTY:
                if (change.property_name ==
                        skill_domain.SKILL_CONTENTS_PROPERTY_EXPLANATION):
                    skill.update_explanation(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES):
                    worked_examples_list = [
                        state_domain.SubtitledHtml.from_dict(worked_example)
                        for worked_example in change.new_value]
                    skill.update_worked_examples(worked_examples_list)
            elif change.cmd == skill_domain.CMD_ADD_SKILL_MISCONCEPTION:
                skill.add_misconception(change.new_misconception_dict)
            elif change.cmd == skill_domain.CMD_DELETE_SKILL_MISCONCEPTION:
                skill.delete_misconception(change.misconception_id)
            elif change.cmd == skill_domain.CMD_ADD_PREREQUISITE_SKILL:
                skill.add_prerequisite_skill(change.skill_id)
            elif change.cmd == skill_domain.CMD_DELETE_PREREQUISITE_SKILL:
                skill.delete_prerequisite_skill(change.skill_id)
            elif change.cmd == skill_domain.CMD_UPDATE_RUBRICS:
                skill.update_rubric(
                    change.difficulty, change.explanation)
            elif (change.cmd ==
                  skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY):
                if (change.property_name ==
                        skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME):
                    skill.update_misconception_name(
                        change.misconception_id, change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NOTES):
                    skill.update_misconception_notes(
                        change.misconception_id, change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_FEEDBACK):
                    skill.update_misconception_feedback(
                        change.misconception_id, change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_MUST_BE_ADDRESSED): # pylint: disable=line-too-long
                    skill.update_misconception_must_be_addressed(
                        change.misconception_id, change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif (change.cmd ==
                  skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION
                  or change.cmd ==
                  skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION # pylint: disable=line-too-long
                  or change.cmd ==
                  skill_domain.CMD_MIGRATE_RUBRICS_SCHEMA_TO_LATEST_VERSION):
                # Loading the skill model from the datastore into a
                # skill domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # skill is sufficient to apply the schema migration.
                continue

        return skill

    except Exception as e:
        logging.error(
            '%s %s %s %s' % (
                e.__class__.__name__, e, skill_id, change_list)
        )
        raise


def _save_skill(committer_id, skill, commit_message, change_list):
    """Validates a skill and commits it to persistent storage. If
    successful, increments the version number of the incoming skill domain
    object by 1.

    Args:
        committer_id: str. ID of the given committer.
        skill: Skill. The skill domain object to be saved.
        commit_message: str. The commit message.
        change_list: list(SkillChange). List of changes applied to a skill.

    Raises:
        Exception: The skill model and the incoming skill domain
            object have different version numbers.
        Exception: Received invalid change list.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save skill %s: %s' % (skill.id, change_list))
    skill.validate()

    # Skill model cannot be None as skill is passed as parameter here and that
    # is only possible if a skill model with that skill id exists.
    skill_model = skill_models.SkillModel.get(
        skill.id, strict=False)

    if skill.version > skill_model.version:
        raise Exception(
            'Unexpected error: trying to update version %s of skill '
            'from version %s. Please reload the page and try again.'
            % (skill_model.version, skill.version))
    elif skill.version < skill_model.version:
        raise Exception(
            'Trying to update version %s of skill from version %s, '
            'which is too old. Please reload the page and try again.'
            % (skill_model.version, skill.version))

    skill_model.description = skill.description
    skill_model.language_code = skill.language_code
    skill_model.superseding_skill_id = skill.superseding_skill_id
    skill_model.all_questions_merged = skill.all_questions_merged
    skill_model.prerequisite_skill_ids = skill.prerequisite_skill_ids
    skill_model.misconceptions_schema_version = (
        skill.misconceptions_schema_version)
    skill_model.rubric_schema_version = (
        skill.rubric_schema_version)
    skill_model.skill_contents_schema_version = (
        skill.skill_contents_schema_version)
    skill_model.skill_contents = skill.skill_contents.to_dict()
    skill_model.misconceptions = [
        misconception.to_dict() for misconception in skill.misconceptions
    ]
    skill_model.rubrics = [
        rubric.to_dict() for rubric in skill.rubrics
    ]
    skill_model.next_misconception_id = skill.next_misconception_id
    change_dicts = [change.to_dict() for change in change_list]
    skill_model.commit(committer_id, commit_message, change_dicts)
    memcache_services.delete(_get_skill_memcache_key(skill.id))
    skill.version += 1


def update_skill(committer_id, skill_id, change_list, commit_message):
    """Updates a skill. Commits changes.

    Args:
        committer_id: str. The id of the user who is performing the update
            action.
        skill_id: str. The skill id.
        change_list: list(SkillChange). These changes are applied in sequence to
            produce the resulting skill.
        commit_message: str or None. A description of changes made to the
            skill. For published skills, this must be present; for
            unpublished skills, it may be equal to None.

    Raises:
        ValueError: No commit message was provided.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    skill = apply_change_list(skill_id, change_list, committer_id)
    _save_skill(committer_id, skill, commit_message, change_list)
    create_skill_summary(skill.id)


def publish_skill(skill_id, committer_id):
    """Marks the given skill as published.

    Args:
        skill_id: str. The id of the given skill.
        committer_id: str. The user id of the committer.

    Raises:
        Exception. The given skill does not exist.
        Exception. The skill is already published.
        Exception. The user does not have permissions to publish the skill.
    """
    skill_rights = get_skill_rights(skill_id, strict=False)
    if skill_rights is None:
        raise Exception('The given skill does not exist.')
    user = user_services.UserActionsInfo(committer_id)
    if role_services.ACTION_PUBLISH_OWNED_SKILL not in user.actions:
        raise Exception(
            'The user does not have enough rights to publish the skill.')

    if not skill_rights.skill_is_private:
        raise Exception('The skill is already published.')
    skill_rights.skill_is_private = False
    commit_cmds = [skill_domain.SkillRightsChange({
        'cmd': skill_domain.CMD_PUBLISH_SKILL
    })]
    save_skill_rights(
        skill_rights, committer_id, 'Published the skill', commit_cmds)


def save_skill_rights(skill_rights, committer_id, commit_message, commit_cmds):
    """Saves a SkillRights domain object to the datastore.

    Args:
        skill_rights: SkillRights. The rights object for the given skill.
        committer_id: str. ID of the committer.
        commit_message: str. Descriptive message for the commit.
        commit_cmds: list(SkillRightsChange). A list of commands describing
            what kind of commit was done.
    """

    model = skill_models.SkillRightsModel.get(skill_rights.id, strict=False)

    model.skill_is_private = skill_rights.skill_is_private
    model.creator_id = skill_rights.creator_id
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)


def delete_skill(committer_id, skill_id, force_deletion=False):
    """Deletes the skill with the given skill_id.

    Args:
        committer_id: str. ID of the committer.
        skill_id: str. ID of the skill to be deleted.
        force_deletion: bool. If true, the skill and its history are fully
            deleted and are unrecoverable. Otherwise, the skill and all
            its history are marked as deleted, but the corresponding models are
            still retained in the datastore. This last option is the preferred
            one.
    """
    skill_rights_model = skill_models.SkillRightsModel.get(skill_id)
    skill_rights_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_SKILL_DELETED,
        force_deletion=force_deletion)

    skill_model = skill_models.SkillModel.get(skill_id)
    skill_model.delete(
        committer_id, feconf.COMMIT_MESSAGE_SKILL_DELETED,
        force_deletion=force_deletion)

    # This must come after the skill is retrieved. Otherwise the memcache
    # key will be reinstated.
    skill_memcache_key = _get_skill_memcache_key(skill_id)
    memcache_services.delete(skill_memcache_key)

    # Delete the summary of the skill (regardless of whether
    # force_deletion is True or not).
    delete_skill_summary(skill_id)
    opportunity_services.delete_skill_opportunity(skill_id)


def delete_skill_summary(skill_id):
    """Delete a skill summary model.

    Args:
        skill_id: str. ID of the skill whose skill summary is to
            be deleted.
    """

    skill_models.SkillSummaryModel.get(skill_id).delete()


def compute_summary_of_skill(skill):
    """Create a SkillSummary domain object for a given Skill domain
    object and return it.

    Args:
        skill: Skill. The skill object, for which the summary is to be computed.

    Returns:
        SkillSummary. The computed summary for the given skill.
    """
    skill_model_misconception_count = len(skill.misconceptions)
    skill_model_worked_examples_count = len(
        skill.skill_contents.worked_examples)

    skill_summary = skill_domain.SkillSummary(
        skill.id, skill.description, skill.language_code,
        skill.version, skill_model_misconception_count,
        skill_model_worked_examples_count,
        skill.created_on, skill.last_updated
    )

    return skill_summary


def create_skill_summary(skill_id):
    """Creates and stores a summary of the given skill.

    Args:
        skill_id: str. ID of the skill.
    """
    skill = get_skill_by_id(skill_id)
    skill_summary = compute_summary_of_skill(skill)
    save_skill_summary(skill_summary)


def save_skill_summary(skill_summary):
    """Save a skill summary domain object as a SkillSummaryModel
    entity in the datastore.

    Args:
        skill_summary: The skill summary object to be saved in the
            datastore.
    """
    skill_summary_model = skill_models.SkillSummaryModel(
        id=skill_summary.id,
        description=skill_summary.description,
        language_code=skill_summary.language_code,
        version=skill_summary.version,
        misconception_count=skill_summary.misconception_count,
        worked_examples_count=skill_summary.worked_examples_count,
        skill_model_last_updated=(
            skill_summary.skill_model_last_updated),
        skill_model_created_on=(
            skill_summary.skill_model_created_on)
    )

    skill_summary_model.put()


def create_new_skill_rights(skill_id, committer_id):
    """Creates a new skill rights object and saves it to the datastore.

    Args:
        skill_id: str. ID of the skill.
        committer_id: str. ID of the committer.
    """
    skill_rights = skill_domain.SkillRights(skill_id, True, committer_id)
    commit_cmds = [{'cmd': skill_domain.CMD_CREATE_NEW}]
    skill_models.SkillRightsModel(
        id=skill_rights.id,
        creator_id=skill_rights.creator_id,
        skill_is_private=skill_rights.skill_is_private
    ).commit(committer_id, 'Created new skill rights', commit_cmds)


def get_skill_rights_from_model(skill_rights_model):
    """Constructs a SkillRights object from the given skill rights model.

    Args:
        skill_rights_model: SkillRightsModel. Skill rights from the datastore.

    Returns:
        SkillRights. The rights object created from the model.
    """

    return skill_domain.SkillRights(
        skill_rights_model.id,
        skill_rights_model.skill_is_private,
        skill_rights_model.creator_id
    )


def get_skill_rights(skill_id, strict=True):
    """Retrieves the rights object for the given skill.

    Args:
        skill_id: str. ID of the skill.
        strict: bool. Whether to fail noisily if no skill with the given id
            exists in the datastore.

    Returns:
        SkillRights. The rights object associated with the given skill.

    Raises:
        EntityNotFoundError. The skill with ID skill_id was not found
            in the datastore.
    """

    model = skill_models.SkillRightsModel.get(skill_id, strict=strict)

    if model is None:
        return None

    return get_skill_rights_from_model(model)


def get_multi_skill_rights(skill_ids):
    """Retrieves the rights objects for the given skills.

    Args:
        skill_ids: list(str). Skill IDs of the skills for which rights are
            requested.

    Returns:
        list(SkillRights). The list of skill rights objects.
    """

    skill_rights_models = skill_models.SkillRightsModel.get_multi(skill_ids)
    skill_rights_list = [
        get_skill_rights_from_model(skill_rights_model)
        if skill_rights_model else None
        for skill_rights_model in skill_rights_models]
    return skill_rights_list


def get_unpublished_skill_rights_by_creator(user_id):
    """Retrives the rights objects that are private and were created by the
    user with the provided user ID.

    Args:
        user_id: str. The user ID of the user that created the skills being
            fetched.

    Returns:
        list(SkillRights). The list of skill rights objects that are private
        and created by the provided user.
    """

    skill_rights_models = (
        skill_models.SkillRightsModel.get_unpublished_by_creator_id(
            user_id))
    return [get_skill_rights_from_model(skill_rights_model)
            for skill_rights_model in skill_rights_models]


def get_all_unpublished_skill_rights():
    """Retrieves the rights objects that are private.

    Returns:
        list(SkillRights). The list of skill rights objects that are private.
    """

    skill_rights_models = (
        skill_models.SkillRightsModel.get_unpublished())
    return [get_skill_rights_from_model(skill_rights_model)
            for skill_rights_model in skill_rights_models]


def create_user_skill_mastery(user_id, skill_id, degree_of_mastery):
    """Creates skill mastery of a user.

    Args:
        user_id: str. The user ID of the user for whom to create the model.
        skill_id: str. The unique id of the skill.
        degree_of_mastery: float. The degree of mastery of user in the skill.
    """

    user_skill_mastery = skill_domain.UserSkillMastery(
        user_id, skill_id, degree_of_mastery)
    save_user_skill_mastery(user_skill_mastery)


def save_user_skill_mastery(user_skill_mastery):
    """Stores skill mastery of a user.

    Args:
        user_skill_mastery: dict. The user skill mastery model of a user.
    """
    user_skill_mastery_model = user_models.UserSkillMasteryModel(
        id=user_models.UserSkillMasteryModel.construct_model_id(
            user_skill_mastery.user_id, user_skill_mastery.skill_id),
        user_id=user_skill_mastery.user_id,
        skill_id=user_skill_mastery.skill_id,
        degree_of_mastery=user_skill_mastery.degree_of_mastery)

    user_skill_mastery_model.put()


def create_multi_user_skill_mastery(user_id, degrees_of_mastery):
    """Creates the mastery of a user in multiple skills.

    Args:
        user_id: str. The user ID of the user.
        degrees_of_mastery: dict(str, float). The keys are the requested
            skill IDs. The values are the corresponding mastery degree of
            the user.
    """
    user_skill_mastery_models = []

    for skill_id, degree_of_mastery in degrees_of_mastery.items():
        user_skill_mastery_models.append(user_models.UserSkillMasteryModel(
            id=user_models.UserSkillMasteryModel.construct_model_id(
                user_id, skill_id),
            user_id=user_id, skill_id=skill_id,
            degree_of_mastery=degree_of_mastery))
    user_models.UserSkillMasteryModel.put_multi(user_skill_mastery_models)


def get_user_skill_mastery(user_id, skill_id):
    """Fetches the mastery of user in a particular skill.

    Args:
        user_id: str. The user ID of the user.
        skill_id: str. Unique id of the skill for which mastery degree is
            requested.

    Returns:
        degree_of_mastery: float or None. Mastery degree of the user for the
            requested skill, or None if UserSkillMasteryModel does not exist
            for the skill.
    """
    model_id = user_models.UserSkillMasteryModel.construct_model_id(
        user_id, skill_id)
    user_skill_mastery_model = user_models.UserSkillMasteryModel.get(
        model_id, strict=False)

    if not user_skill_mastery_model:
        return None
    return user_skill_mastery_model.degree_of_mastery


def get_multi_user_skill_mastery(user_id, skill_ids):
    """Fetches the mastery of user in multiple skills.

    Args:
        user_id: str. The user ID of the user.
        skill_ids: list(str). Skill IDs of the skill for which mastery degree is
            requested.

    Returns:
        degrees_of_mastery: dict(str, float|None). The keys are the requested
            skill IDs. The values are the corresponding mastery degree of
            the user or None if UserSkillMasteryModel does not exist for the
            skill.
    """
    degrees_of_mastery = {}
    model_ids = []

    for skill_id in skill_ids:
        model_ids.append(user_models.UserSkillMasteryModel.construct_model_id(
            user_id, skill_id))

    skill_mastery_models = user_models.UserSkillMasteryModel.get_multi(
        model_ids)

    for skill_id, skill_mastery_model in python_utils.ZIP(
            skill_ids, skill_mastery_models):
        if skill_mastery_model is None:
            degrees_of_mastery[skill_id] = None
        else:
            degrees_of_mastery[skill_id] = skill_mastery_model.degree_of_mastery

    return degrees_of_mastery


def skill_has_associated_questions(skill_id):
    """Returns whether or not any question has this skill attached.

    Args:
        skill_id: str. The skill ID of the user.

    Returns:
        bool. Whether any question has this skill attached.
    """
    question_ids = (
        question_models.QuestionSkillLinkModel.get_all_question_ids_linked_to_skill_id( # pylint: disable=line-too-long
            skill_id))
    return len(question_ids) > 0
