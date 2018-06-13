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

"""Commands that can be used to operate on skills.
"""

import copy
import logging

from core.domain import skill_domain
from core.platform import models
import feconf

(skill_models, user_models) = models.Registry.import_models(
    [models.NAMES.skill, models.NAMES.user])
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
        versioned_misconceptions: A dict with two keys:
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


def get_skill_from_model(skill_model, run_conversion=True):
    """Returns a skill domain object given a skill model loaded
    from the datastore.

    Args:
        skill_model: SkillModel. The skill model loaded from the
            datastore.
        run_conversion: bool. If true, the the skill's schema version will
            be checked against the current schema version. If they do not match,
            the skill will be automatically updated to the latest schema
            version.

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

    # Migrate the skill if it is not using the latest schema version.
    if (run_conversion and skill_model.skill_contents_schema_version !=
            feconf.CURRENT_SKILL_CONTENTS_SCHEMA_VERSION):
        _migrate_skill_contents_to_latest_schema(versioned_skill_contents)

    if (run_conversion and skill_model.misconceptions_schema_version !=
            feconf.CURRENT_MISCONCEPTIONS_SCHEMA_VERSION):
        _migrate_misconceptions_to_latest_schema(versioned_misconceptions)

    return skill_domain.Skill(
        skill_model.id, skill_model.description,
        [
            skill_domain.Misconception.from_dict(misconception)
            for misconception in versioned_misconceptions['misconceptions']
        ], skill_domain.SkillContents.from_dict(
            versioned_skill_contents['skill_contents']),
        versioned_misconceptions['schema_version'],
        versioned_skill_contents['schema_version'],
        skill_model.language_code,
        skill_model.version, skill_model.created_on,
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
    model = skill_models.SkillModel(
        id=skill.id,
        description=skill.description,
        language_code=skill.language_code,
        misconceptions=[
            misconception.to_dict()
            for misconception in skill.misconceptions
        ],
        skill_contents=skill.skill_contents.to_dict(),
        misconceptions_schema_version=skill.misconceptions_schema_version,
        skill_contents_schema_version=skill.skill_contents_schema_version
    )
    commit_cmd_dicts = [commit_cmd.to_dict() for commit_cmd in commit_cmds]
    model.commit(committer_id, commit_message, commit_cmd_dicts)
    skill.version += 1
    create_skill_summary(skill.id)


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


def apply_change_list(skill_id, change_list):
    """Applies a changelist to a skill and returns the result.

    Args:
        skill_id: str. ID of the given skill.
        change_list: list(SkillChange). A change list to be applied to the given
            skill.

    Returns:
        Skill. The resulting skill domain object.
    """
    skill = get_skill_by_id(skill_id)
    try:
        for change in change_list:
            if change.cmd == skill_domain.CMD_UPDATE_SKILL_PROPERTY:
                if (change.property_name ==
                        skill_domain.SKILL_PROPERTY_DESCRIPTION):
                    skill.update_description(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_PROPERTY_LANGUAGE_CODE):
                    skill.update_language_code(change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif change.cmd == skill_domain.CMD_UPDATE_SKILL_CONTENTS_PROPERTY:
                if (change.property_name ==
                        skill_domain.SKILL_CONTENTS_PROPERTY_EXPLANATION):
                    skill.update_explanation(change.new_value)
                elif (change.property_name ==
                      skill_domain.SKILL_CONTENTS_PROPERTY_WORKED_EXAMPLES):
                    skill.update_worked_examples(change.new_value)
                else:
                    raise Exception('Invalid change dict.')
            elif change.cmd == skill_domain.CMD_ADD_SKILL_MISCONCEPTION:
                skill.add_misconception(change.misconception_id)
            elif change.cmd == skill_domain.CMD_DELETE_SKILL_MISCONCEPTION:
                skill.delete_misconception(change.misconception_id)
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
                else:
                    raise Exception('Invalid change dict.')
            elif (change.cmd ==
                  skill_domain.CMD_MIGRATE_CONTENTS_SCHEMA_TO_LATEST_VERSION
                  or change.cmd ==
                  skill_domain.CMD_MIGRATE_MISCONCEPTIONS_SCHEMA_TO_LATEST_VERSION): # pylint: disable=line-too-long
                # Loading the skill model from the datastore into a
                # skill domain object automatically converts it to use the
                # latest schema version. As a result, simply resaving the
                # skill is sufficient to apply the schema migration.
                continue
            else:
                raise Exception('Invalid change dict.')
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

    skill_model = skill_models.SkillModel.get(
        skill.id, strict=False)
    if skill_model is None:
        skill_model = skill_models.SkillModel(id=skill.id)
    else:
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
    skill_model.misconceptions_schema_version = (
        skill.misconceptions_schema_version)
    skill_model.skill_contents_schema_version = (
        skill.skill_contents_schema_version)
    skill_model.skill_contents = skill.skill_contents.to_dict()
    skill_model.misconceptions = [
        misconception.to_dict() for misconception in skill.misconceptions
    ]
    change_dicts = [change.to_dict() for change in change_list]
    skill_model.commit(committer_id, commit_message, change_dicts)
    memcache_services.delete(_get_skill_memcache_key(skill.id))
    skill.version += 1


def update_skill(committer_id, skill_id, change_list, commit_message):
    """Updates a skill. Commits changes.

    Args:
    - committer_id: str. The id of the user who is performing the update
        action.
    - skill_id: str. The skill id.
    - change_list: list(SkillChange). These changes are applied in sequence to
        produce the resulting skill.
    - commit_message: str or None. A description of changes made to the
        skill. For published skills, this must be present; for
        unpublished skills, it may be equal to None.

    Raises:
        ValueError: No commit message was provided.
    """
    if not commit_message:
        raise ValueError(
            'Expected a commit message, received none.')

    skill = apply_change_list(skill_id, change_list)
    _save_skill(committer_id, skill, commit_message, change_list)
    create_skill_summary(skill.id)


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
    skill_summary = skill_domain.SkillSummary(
        skill.id, skill.description, skill.language_code,
        skill.version, skill_model_misconception_count,
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
        skill_model_last_updated=(
            skill_summary.skill_model_last_updated),
        skill_model_created_on=(
            skill_summary.skill_model_created_on)
    )

    skill_summary_model.put()


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


def get_skill_mastery(user_id, skill_id):
    """Fetches the mastery of user in a particular skill.

    Args:
        user_id: str. The user ID of the user.
        skill_id: str. Unique id of the skill for which mastery degree is
            requested.

    Returns:
        degree_of_mastery: float. Mastery degree of the user for the
            requested skill.
    """
    model_id = user_models.UserSkillMasteryModel.construct_model_id(
        user_id, skill_id)
    degree_of_mastery = user_models.UserSkillMasteryModel.get(
        model_id).degree_of_mastery

    return degree_of_mastery


def get_multi_skill_mastery(user_id, skill_ids):
    """Fetches the mastery of user in multiple skills.

    Args:
        user_id: str. The user ID of the user.
        skill_ids: list(str). Skill IDs of the skill for which mastery degree is
            requested.

    Returns:
        degree_of_mastery: list(float). Mastery degree of the user for requested
            skills.
    """
    degrees_of_mastery = []
    model_ids = []

    for skill_id in skill_ids:
        model_ids.append(user_models.UserSkillMasteryModel.construct_model_id(
            user_id, skill_id))

    skill_mastery_models = user_models.UserSkillMasteryModel.get_multi(
        model_ids)

    for skill_mastery_model in skill_mastery_models:
        degrees_of_mastery.append(skill_mastery_model.degree_of_mastery)

    return degrees_of_mastery
