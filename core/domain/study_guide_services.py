# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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
# limitations under the License.]

"""Commands for operations on study guides, and related models."""

from __future__ import annotations

import copy

from core import feconf
from core.domain import (
    change_domain,
    classroom_config_services,
    learner_group_services,
    skill_services,
    study_guide_domain,
    subtopic_page_services,
    topic_domain,
    topic_fetchers,
)
from core.platform import models

from typing import Dict, List, Literal, Optional, Sequence, overload

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import subtopic_models

(subtopic_models,) = models.Registry.import_models([models.Names.SUBTOPIC])


# Remove no cover comment once migrations for study guides are available.
def _migrate_sections_to_latest_schema(
    versioned_sections: study_guide_domain.VersionedStudyGuideSectionsDict,
) -> None:  # pragma: no cover
    """Holds the responsibility of performing a step-by-step, sequential update
    of the sections structure based on the schema version of the input
    sections dictionary. If the current sections schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_sections: dict. A dict with two keys:
          - schema_version: int. The schema version for the page_contents dict.
          - sections: list. The list comprising the dicts of sections.

    Raises:
        Exception. The schema version of the sections is outside of what
            is supported at present.
    """
    sections_schema_version = versioned_sections['schema_version']
    if not (
        1
        <= sections_schema_version
        <= feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
    ):
        raise Exception(
            'Sorry, we can only process v1-v%d page schemas at '
            'present.' % feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
        )

    while (
        sections_schema_version
        < feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
    ):
        study_guide_domain.StudyGuide.update_sections_from_model(
            versioned_sections, sections_schema_version
        )
        sections_schema_version += 1


def get_study_guide_from_model(
    study_guide_model: subtopic_models.StudyGuideModel,
) -> study_guide_domain.StudyGuide:
    """Returns a domain object for an StudyGuide given a study guide model.

    Args:
        study_guide_model: StudyGuideModel. The study guide model to get
            the corresponding domain object.

    Returns:
        StudyGuide. The domain object corresponding to the given model object.
    """
    versioned_sections: study_guide_domain.VersionedStudyGuideSectionsDict = {
        'schema_version': study_guide_model.sections_schema_version,
        'sections': copy.deepcopy(study_guide_model.sections),
    }
    # Remove no cover comment once migrations for study guides are available.
    if (
        study_guide_model.sections_schema_version
        != feconf.CURRENT_STUDY_GUIDE_SECTIONS_SCHEMA_VERSION
    ):  # pragma: no cover pylint: disable=line-too-long
        _migrate_sections_to_latest_schema(versioned_sections)
    sections = []
    for section in versioned_sections['sections']:
        sections.append(study_guide_domain.StudyGuideSection.from_dict(section))
    return study_guide_domain.StudyGuide(
        study_guide_model.id,
        study_guide_model.topic_id,
        sections,
        versioned_sections['schema_version'],
        study_guide_model.next_content_id_index,
        study_guide_model.language_code,
        study_guide_model.version,
    )


@overload
def get_study_guide_by_id(
    topic_id: str, subtopic_id: int
) -> study_guide_domain.StudyGuide: ...


@overload
def get_study_guide_by_id(
    topic_id: str, subtopic_id: int, *, version: int
) -> study_guide_domain.StudyGuide: ...


@overload
def get_study_guide_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: Literal[True],
    version: Optional[int] = ...,
) -> study_guide_domain.StudyGuide: ...


@overload
def get_study_guide_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: Literal[False],
    version: Optional[int] = ...,
) -> Optional[study_guide_domain.StudyGuide]: ...


@overload
def get_study_guide_by_id(
    topic_id: str,
    subtopic_id: int,
    *,
    strict: bool = ...,
    version: Optional[int] = ...,
) -> Optional[study_guide_domain.StudyGuide]: ...


def get_study_guide_by_id(
    topic_id: str,
    subtopic_id: int,
    strict: bool = True,
    version: Optional[int] = None,
) -> Optional[study_guide_domain.StudyGuide]:
    """Returns a domain object representing a study guide.

    Args:
        topic_id: str. ID of the topic that the study guide is a part of.
        subtopic_id: int. The id of the subtopic containing the study guide.
        strict: bool. Whether to fail noisily if no study guide with the given
            id exists in the datastore.
        version: str or None. The version number of the study guide.

    Returns:
        StudyGuide or None. The domain object representing a study guide
        with the given id, or None if it does not exist.
    """
    study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
        topic_id, subtopic_id
    )
    study_guide_model = subtopic_models.StudyGuideModel.get(
        study_guide_id, strict=strict, version=version
    )
    if study_guide_model:
        study_guide = get_study_guide_from_model(study_guide_model)
        return study_guide
    else:
        return None


def get_study_guides_with_ids(
    topic_id: str, subtopic_ids: List[int]
) -> List[Optional[study_guide_domain.StudyGuide]]:
    """Returns a list of domain objects with given ids.

    Args:
        topic_id: str. ID of the topic that the study guides belong to.
        subtopic_ids: list(int). The ids of subtopics containing the
            study guides.

    Returns:
        list(StudyGuide) or None. The list of domain objects representing the
        study guides corresponding to given ids list or None if none exist.
    """
    study_guide_ids = []
    for subtopic_id in subtopic_ids:
        study_guide_ids.append(
            study_guide_domain.StudyGuide.get_study_guide_id(
                topic_id, subtopic_id
            )
        )
    study_guide_models = subtopic_models.StudyGuideModel.get_multi(
        study_guide_ids
    )
    study_guides: List[Optional[study_guide_domain.StudyGuide]] = []
    for study_guide_model in study_guide_models:
        if study_guide_model is None:
            study_guides.append(study_guide_model)
        else:
            study_guides.append(get_study_guide_from_model(study_guide_model))
    return study_guides


@overload
def get_study_guide_sections_by_id(
    topic_id: str, subtopic_id: int
) -> List[study_guide_domain.StudyGuideSection]: ...


@overload
def get_study_guide_sections_by_id(
    topic_id: str, subtopic_id: int, *, strict: Literal[True]
) -> List[study_guide_domain.StudyGuideSection]: ...


@overload
def get_study_guide_sections_by_id(
    topic_id: str, subtopic_id: int, *, strict: Literal[False]
) -> Optional[List[study_guide_domain.StudyGuideSection]]: ...


def get_study_guide_sections_by_id(
    topic_id: str, subtopic_id: int, strict: bool = True
) -> Optional[List[study_guide_domain.StudyGuideSection]]:
    """Returns the list of sections of a study guide

    Args:
        topic_id: str. ID of the topic that the study guide belongs to.
        subtopic_id: int. The id of the subtopic containing the study guide.
        strict: bool. Whether to fail noisily if no study guide with the given
            id exists in the datastore.

    Returns:
        List[StudyGuideSection] or None. The list of sections for a study guide,
        or None if study guide does not exist.
    """
    study_guide = get_study_guide_by_id(topic_id, subtopic_id, strict=strict)
    if study_guide is not None:
        return study_guide.sections
    else:
        return None


def save_study_guide(
    committer_id: str,
    study_guide: study_guide_domain.StudyGuide,
    commit_message: Optional[str],
    change_list: Sequence[change_domain.BaseChange],
) -> None:
    """Validates a study guide and commits it to persistent storage. If
    successful, increments the version number of the incoming study guide
    domain object by 1.

    Args:
        committer_id: str. ID of the given committer.
        study_guide: StudyGuide. The study guide domain object to be
            saved.
        commit_message: str|None. The commit description message, for
            unpublished topics, it may be equal to None.
        change_list: list(StudyGuideChange). List of changes applied to a
            study guide.

    Raises:
        Exception. Received invalid change list.
        Exception. The study guide and the incoming study guide domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (study_guide.id, change_list)
        )
    study_guide.validate()

    study_guide_model = subtopic_models.StudyGuideModel.get(
        study_guide.id, strict=False
    )
    if study_guide_model is None:
        study_guide_model = subtopic_models.StudyGuideModel(id=study_guide.id)
    else:
        if study_guide.version > study_guide_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of topic '
                'from version %s. Please reload the page and try again.'
                % (study_guide_model.version, study_guide.version)
            )

        if study_guide.version < study_guide_model.version:
            raise Exception(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (study_guide_model.version, study_guide.version)
            )

    study_guide_model.topic_id = study_guide.topic_id
    sections = []
    for section in study_guide.sections:
        sections.append(section.to_dict())
    study_guide_model.sections = sections
    study_guide_model.language_code = study_guide.language_code
    study_guide_model.sections_schema_version = (
        study_guide.sections_schema_version
    )
    study_guide_model.next_content_id_index = study_guide.next_content_id_index
    change_dicts = [change.to_dict() for change in change_list]
    study_guide_model.commit(committer_id, commit_message, change_dicts)
    study_guide.version += 1


def delete_study_guide(
    committer_id: str,
    topic_id: str,
    subtopic_id: int,
    force_deletion: bool = False,
) -> None:
    """Delete a study guide model.

    Args:
        committer_id: str. The user who is deleting the study guide.
        topic_id: str. The ID of the topic that this study guide belongs to.
        subtopic_id: int. ID of the subtopic from which the study guide was
            removed.
        force_deletion: bool. If true, the study guide and its history are
            fully deleted and are unrecoverable. Otherwise, the study guide
            and all its history are marked as deleted, but the corresponding
            models are still retained in the datastore. This last option is the
            preferred one.
    """
    study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
        topic_id, subtopic_id
    )
    subtopic_models.StudyGuideModel.get(study_guide_id).delete(
        committer_id,
        feconf.COMMIT_MESSAGE_STUDY_GUIDE_DELETED,
        force_deletion=force_deletion,
    )
    learner_group_services.remove_study_guide_reference_from_learner_groups(
        topic_id, subtopic_id
    )


def does_study_guide_model_exist(topic_id: str, subtopic_id: int) -> bool:
    """Check if a study guide model exists or not.

    Args:
        topic_id: str. The ID of the topic that this study guide belongs to.
        subtopic_id: int. ID of the subtopic to which the study guide
            belongs.

    Returns:
        boolean. Whether the study guide model exists or not.
    """
    study_guide_id = study_guide_domain.StudyGuide.get_study_guide_id(
        topic_id, subtopic_id
    )
    try:
        study_guide_model = subtopic_models.StudyGuideModel.get(study_guide_id)
        return study_guide_model is not None
    except Exception:
        return False


def generate_study_guide_models(
    topic_id: str, subtopics: List[topic_domain.Subtopic]
) -> None:
    """Generates study guide models corresponding to all subtopic page models in the given topic.

    Args:
        topic_id: str. The ID of the topic that this study guide belongs to.
        subtopics: list(Subtopic). The subtopics in the topic.
    """
    for subtopic in subtopics:
        if not does_study_guide_model_exist(topic_id, subtopic.id):
            subtopic_page = subtopic_page_services.get_subtopic_page_by_id(
                topic_id, subtopic.id
            )
            study_guide = study_guide_domain.StudyGuide.create_study_guide(
                subtopic.id,
                topic_id,
                subtopic.title,
                subtopic_page.page_contents.subtitled_html.html,
            )
            save_study_guide(
                feconf.SYSTEM_COMMITTER_ID,
                study_guide,
                'Generated Study Guide model corresponding to Subtopic Page Model with id: %s'
                % (subtopic_page.id),
                [
                    study_guide_domain.StudyGuideChange(
                        {
                            'cmd': 'create_new',
                            'topic_id': topic_id,
                            'subtopic_id': subtopic.id,
                        }
                    )
                ],
            )


def delete_study_guide_models(
    topic_id: str, subtopics: List[topic_domain.Subtopic]
) -> None:
    """Deletes all study guide models corresponding to the given topic id.

    Args:
        topic_id: str. The ID of the topic that this study guide belongs to.
        subtopics: list(Subtopic). The subtopics in the topic.
    """
    for subtopic in subtopics:
        if does_study_guide_model_exist(topic_id, subtopic.id):
            delete_study_guide(
                feconf.SYSTEM_COMMITTER_ID,
                topic_id,
                subtopic.id,
                force_deletion=True,
            )


def verify_study_guide_models(
    topic_id: str, subtopics: List[topic_domain.Subtopic]
) -> List[str]:
    """Verifies all study guide models corresponding to the given topic id.

    Args:
        topic_id: str. The ID of the topic that this study guide belongs to.
        subtopics: list(Subtopic). The subtopics in the topic.

    Returns:
        list(str). A list of issues found with the study guide models. If no issues
        are found, an empty list is returned.
    """
    study_guide_snapshot_metadata_ids = []
    study_guide_snapshot_content_ids = []
    study_guide_commit_log_entry_ids = []

    for subtopic in subtopics:
        if does_study_guide_model_exist(topic_id, subtopic.id):
            study_guide = get_study_guide_by_id(topic_id, subtopic.id)
            study_guide_id = study_guide.id
            model_version = study_guide.version

            for version in range(1, model_version + 1):
                snapshot_id = '%s-%d' % (study_guide_id, version)
                study_guide_snapshot_content_ids.append(snapshot_id)
                study_guide_snapshot_metadata_ids.append(snapshot_id)

                commit_log_id = 'studyguide-%s-%d' % (study_guide_id, version)
                study_guide_commit_log_entry_ids.append(commit_log_id)

    snapshot_content_models = (
        subtopic_models.StudyGuideSnapshotContentModel.get_multi(
            study_guide_snapshot_content_ids
        )
    )
    snapshot_metadata_models = (
        subtopic_models.StudyGuideSnapshotMetadataModel.get_multi(
            study_guide_snapshot_metadata_ids
        )
    )
    commit_log_entry_models = (
        subtopic_models.StudyGuideCommitLogEntryModel.get_multi(
            study_guide_commit_log_entry_ids
        )
    )

    issues = []

    # Check for missing snapshot content models.
    missing_snapshot_content_ids = [
        study_guide_snapshot_content_ids[i]
        for i, model in enumerate(snapshot_content_models)
        if model is None
    ]
    if missing_snapshot_content_ids:
        issues.append(
            'Missing snapshot content models: %s'
            % ', '.join(missing_snapshot_content_ids)
        )

    # Check for missing snapshot metadata models.
    missing_snapshot_metadata_ids = [
        study_guide_snapshot_metadata_ids[i]
        for i, model in enumerate(snapshot_metadata_models)
        if model is None
    ]
    if missing_snapshot_metadata_ids:
        issues.append(
            'Missing snapshot metadata models: %s'
            % ', '.join(missing_snapshot_metadata_ids)
        )

    # Check for missing commit log entry models.
    missing_commit_log_entry_ids = [
        study_guide_commit_log_entry_ids[i]
        for i, model in enumerate(commit_log_entry_models)
        if model is None
    ]
    if missing_commit_log_entry_ids:
        issues.append(
            'Missing commit log entry models: %s'
            % ', '.join(missing_commit_log_entry_ids)
        )

    return issues


def get_topic_ids_from_study_guide_ids(study_guide_ids: List[str]) -> List[str]:
    """Returns the topic ids corresponding to the given set of study guide
    ids.

    Args:
        study_guide_ids: list(str). The ids of the study guides.

    Returns:
        list(str). The topic ids corresponding to the given study guide ids.
        The returned list of topic ids is deduplicated and ordered
        alphabetically.
    """
    return sorted(
        list(
            {study_guide_id.split(':')[0] for study_guide_id in study_guide_ids}
        )
    )


def get_multi_users_study_guides_progress(
    user_ids: List[str], study_guide_ids: List[str]
) -> Dict[str, List[study_guide_domain.StudyGuideSummaryDict]]:
    """Returns the progress of the given user on the given study guides.

    Args:
        user_ids: list(str). The ids of the users.
        study_guide_ids: list(str). The ids of the study guide.

    Returns:
        dict(str, list(StudyGuideSummaryDict)). User IDs as keys and Study
        Guide Summary domain object dictionaries containing details of the
        study guide and users mastery in it as values.
    """

    topic_ids = get_topic_ids_from_study_guide_ids(study_guide_ids)
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)

    all_skill_ids_lists = [
        topic.get_all_skill_ids() for topic in topics if topic
    ]
    all_skill_ids = list(
        {
            skill_id
            for skill_list in all_skill_ids_lists
            for skill_id in skill_list
        }
    )

    all_users_skill_mastery_dicts = (
        skill_services.get_multi_users_skills_mastery(user_ids, all_skill_ids)
    )

    all_users_study_guide_prog_summaries: Dict[
        str, List[study_guide_domain.StudyGuideSummaryDict]
    ] = {user_id: [] for user_id in user_ids}
    for topic in topics:
        for subtopic in topic.subtopics:
            study_guide_id = '{}:{}'.format(topic.id, subtopic.id)
            if study_guide_id not in study_guide_ids:
                continue
            for (
                user_id,
                skills_mastery_dict,
            ) in all_users_skill_mastery_dicts.items():
                skill_mastery_dict = {
                    skill_id: mastery
                    for skill_id, mastery in skills_mastery_dict.items()
                    if mastery is not None and (skill_id in subtopic.skill_ids)
                }
                subtopic_mastery: Optional[float] = None

                # Subtopic mastery is average of skill masteries.
                if skill_mastery_dict:
                    subtopic_mastery = sum(skill_mastery_dict.values()) / len(
                        skill_mastery_dict
                    )

                all_users_study_guide_prog_summaries[user_id].append(
                    {
                        'subtopic_id': subtopic.id,
                        'subtopic_title': subtopic.title,
                        'parent_topic_id': topic.id,
                        'parent_topic_name': topic.name,
                        'thumbnail_filename': subtopic.thumbnail_filename,
                        'thumbnail_bg_color': subtopic.thumbnail_bg_color,
                        'subtopic_mastery': subtopic_mastery,
                        'parent_topic_url_fragment': topic.url_fragment,
                        'classroom_url_fragment': (
                            classroom_config_services.get_classroom_url_fragment_for_topic_id(
                                topic.id
                            )
                        ),
                    }
                )

    return all_users_study_guide_prog_summaries


def get_learner_group_syllabus_study_guide_summaries(
    study_guide_ids: List[str],
) -> List[study_guide_domain.StudyGuideSummaryDict]:
    """Returns summary dicts corresponding to the given study guide ids.

    Args:
        study_guide_ids: list(str). The ids of the study guides.

    Returns:
        list(StudyGuideSummaryDict). The summary dicts corresponding to the
        given study guide ids.
    """
    topic_ids = get_topic_ids_from_study_guide_ids(study_guide_ids)
    topics = topic_fetchers.get_topics_by_ids(topic_ids, strict=True)

    all_learner_group_study_guide_summaries: List[
        study_guide_domain.StudyGuideSummaryDict
    ] = []
    for topic in topics:
        for subtopic in topic.subtopics:
            study_guide_id = '{}:{}'.format(topic.id, subtopic.id)
            if study_guide_id not in study_guide_ids:
                continue
            all_learner_group_study_guide_summaries.append(
                {
                    'subtopic_id': subtopic.id,
                    'subtopic_title': subtopic.title,
                    'parent_topic_id': topic.id,
                    'parent_topic_name': topic.name,
                    'thumbnail_filename': subtopic.thumbnail_filename,
                    'thumbnail_bg_color': subtopic.thumbnail_bg_color,
                    'subtopic_mastery': None,
                    'parent_topic_url_fragment': topic.url_fragment,
                    'classroom_url_fragment': None,
                }
            )

    return all_learner_group_study_guide_summaries


def populate_study_guide_model_fields(
    study_guide_model: subtopic_models.StudyGuideModel,
    study_guide: study_guide_domain.StudyGuide,
) -> subtopic_models.StudyGuideModel:
    """Populate study guide model with the data from study guide object.

    Args:
        study_guide_model: StudyGuideModel. The model to populate.
        study_guide: StudyGuide. The study guide domain object which
            should be used to populate the model.

    Returns:
        StudyGuideModel. Populated model.
    """
    study_guide_model.topic_id = study_guide.topic_id
    sections = []
    for section in study_guide.sections:
        sections.append(section.to_dict())
    study_guide_model.sections = sections
    study_guide_model.sections_schema_version = (
        study_guide.sections_schema_version
    )

    study_guide_model.language_code = study_guide.language_code

    return study_guide_model
