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

"""Service methods for voiceover cloud task run."""

from __future__ import annotations

import collections
import copy
import datetime

from core import feconf
from core.domain import cloud_task_domain
from core.platform import models

from typing import Dict, List, Optional, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import cloud_task_models

(cloud_task_models,) = models.Registry.import_models([models.Names.CLOUD_TASK])


def get_voiceover_regeneration_job(
    exploration_id: str, cloud_task_run_id: str
) -> Optional[cloud_task_domain.VoiceoverRegenerationJob]:
    """Returns the VoiceoverRegenerationJob instance for the given
    exploration id and cloud task run id.

    Args:
        exploration_id: str. The id of the exploration.
        cloud_task_run_id: str. The id of the cloud task run.

    Returns:
        VoiceoverRegenerationJob|None. The
        VoiceoverRegenerationJob instance for the given exploration id
        and cloud task run id.
    """
    voiceover_regeneration_job_id = '%s:%s' % (
        exploration_id,
        cloud_task_run_id,
    )
    voiceover_regeneration_job_model = (
        cloud_task_models.VoiceoverRegenerationJobModel.get(
            voiceover_regeneration_job_id, strict=False
        )
    )

    if voiceover_regeneration_job_model is None:
        return None

    return cloud_task_domain.VoiceoverRegenerationJob(
        voiceover_regeneration_job_model.exploration_id,
        voiceover_regeneration_job_model.cloud_task_run_id,
        voiceover_regeneration_job_model.language_accent_to_content_status_map,
    )


def get_existing_voiceover_regeneration_requests_in_task_queue(
    exploration_id: str,
) -> Dict[str, Dict[str, Dict[str, str]]]:
    """Returns the existing voiceover regeneration jobs for the given
    exploration ID.

    Args:
        exploration_id: str. The id of the exploration.

    Returns:
        dict. A mapping of language accents to their content regeneration
        status.
    """
    # Getting all the existing voiceover regeneration requests for the given
    # exploration ID.
    voiceover_regeneration_job_models: List[
        cloud_task_models.VoiceoverRegenerationJobModel
    ] = cloud_task_models.VoiceoverRegenerationJobModel.get_all_by_exp_id(
        exploration_id
    )

    # Here we use cast because we are narrowing down the type from
    # Optional[datetime.datetime] to datetime.datetime for sorting purposes.
    voiceover_regeneration_job_models.sort(
        key=lambda model: cast(datetime.datetime, model.created_on)
    )

    # If multiple voiceover-regeneration requests exist in the Cloud Task queue
    # for the same exploration ID, they should be merged into a single
    # dictionary containing the latest status data.
    language_accent_to_content_status_map = (
        resolve_multiple_cloud_task_runs_for_exploration(
            voiceover_regeneration_job_models
        )
    )

    voiceover_regeneration_task_models_to_delete = []

    for voiceover_regeneration_task_model in voiceover_regeneration_job_models:
        voiceover_regeneration_task = cloud_task_domain.VoiceoverRegenerationJob(
            voiceover_regeneration_task_model.exploration_id,
            voiceover_regeneration_task_model.cloud_task_run_id,
            voiceover_regeneration_task_model.language_accent_to_content_status_map,
        )

        if voiceover_regeneration_task.are_all_voiceovers_generated():
            voiceover_regeneration_task_models_to_delete.append(
                voiceover_regeneration_task_model
            )

    # Deleting the voiceover regeneration jobs if all voiceovers have been
    # generated successfully.
    cloud_task_models.VoiceoverRegenerationJobModel.delete_multi(
        voiceover_regeneration_task_models_to_delete
    )

    return {
        'language_accent_to_content_status_map': (
            language_accent_to_content_status_map
        )
    }


def delete_voiceover_regeneration_job(
    exploration_id: str,
    cloud_task_run_id: str,
) -> None:
    """Deletes the VoiceoverRegenerationJobModel entry for the given
    cloud task run id.

    Args:
        exploration_id: str. The id of the exploration.
        cloud_task_run_id: str. The id of the cloud task run.
    """
    model_id = '%s:%s' % (exploration_id, cloud_task_run_id)
    cloud_task_models.VoiceoverRegenerationJobModel.delete_by_id(model_id)


def update_voiceover_regeneration_job_status(
    exploration_id: str,
    language_accent_code: str,
    content_id: str,
    regeneration_status: str,
) -> None:
    """Updates the regeneration status of a specific content in all existing
    voiceover regeneration job models for the given exploration ID.

    Args:
        exploration_id: str. The id of the exploration.
        language_accent_code: str. The language accent code of the content to be
            updated.
        content_id: str. The content ID of the content to be updated.
        regeneration_status: str. The new regeneration status to be set for the
            specified content.
    """
    voiceover_regeneration_job_models = (
        cloud_task_models.VoiceoverRegenerationJobModel.get_all_by_exp_id(
            exploration_id
        )
    )

    for model_instance in voiceover_regeneration_job_models:
        if (
            language_accent_code
            in model_instance.language_accent_to_content_status_map
            and content_id
            in model_instance.language_accent_to_content_status_map[
                language_accent_code
            ]
        ):
            model_instance.language_accent_to_content_status_map[
                language_accent_code
            ][content_id] = regeneration_status
            model_instance.update_timestamps()
            model_instance.put()


def resolve_multiple_cloud_task_runs_for_exploration(
    voiceover_regeneration_job_models: List[
        cloud_task_models.VoiceoverRegenerationJobModel
    ],
) -> Dict[str, Dict[str, str]]:
    """Resolves multiple voiceover regeneration cloud task run requests for
    the same exploration by merging their content status.

    Args:
        voiceover_regeneration_job_models: list(
            VoiceoverRegenerationJobModel). A list of
            VoiceoverRegenerationJobModel instances.

    Returns:
        dict. A mapping of language accents to their content regeneration
        status.
    """
    reference_language_accent_to_content_status_map: Dict[
        str, Dict[str, str]
    ] = collections.defaultdict(dict)

    number_of_models = len(voiceover_regeneration_job_models)

    if number_of_models == 0:
        return {}

    if number_of_models == 1:
        language_accent_to_content_status_map: Dict[str, Dict[str, str]] = (
            voiceover_regeneration_job_models[
                0
            ].language_accent_to_content_status_map
        )
        return language_accent_to_content_status_map

    for index in range(number_of_models - 1):
        earlier_model = voiceover_regeneration_job_models[index]
        later_model = voiceover_regeneration_job_models[index + 1]

        earlier_language_accent_to_content_status_map = (
            earlier_model.language_accent_to_content_status_map
        )
        earlier_language_accent_to_content_status_map_clone = copy.deepcopy(
            earlier_language_accent_to_content_status_map
        )
        later_language_accent_to_content_status_map = (
            later_model.language_accent_to_content_status_map
        )

        for (
            language_accent
        ) in earlier_language_accent_to_content_status_map_clone.keys():
            if (
                language_accent
                not in later_language_accent_to_content_status_map
            ):
                reference_language_accent_to_content_status_map[
                    language_accent
                ] = earlier_language_accent_to_content_status_map_clone[
                    language_accent
                ]
                continue

            for (
                content_id,
                earlier_regeneration_status,
            ) in earlier_language_accent_to_content_status_map_clone[
                language_accent
            ].items():

                if (
                    content_id
                    not in later_language_accent_to_content_status_map[
                        language_accent
                    ]
                ):
                    reference_language_accent_to_content_status_map[
                        language_accent
                    ][content_id] = earlier_regeneration_status
                    continue

                # In case of conflict.
                later_regeneration_status = (
                    later_language_accent_to_content_status_map[
                        language_accent
                    ][content_id]
                )

                if earlier_regeneration_status == 'GENERATING':
                    reference_language_accent_to_content_status_map[
                        language_accent
                    ][content_id] = earlier_regeneration_status
                    continue

                reference_language_accent_to_content_status_map[
                    language_accent
                ][content_id] = later_regeneration_status

                del earlier_language_accent_to_content_status_map[
                    language_accent
                ][content_id]

    later_language_accent_to_content_status_map = (
        voiceover_regeneration_job_models[
            -1
        ].language_accent_to_content_status_map
    )
    for language_accent in later_language_accent_to_content_status_map.keys():
        if (
            language_accent
            not in reference_language_accent_to_content_status_map
        ):
            reference_language_accent_to_content_status_map[language_accent] = (
                later_language_accent_to_content_status_map[language_accent]
            )
            continue

        for (
            content_id,
            later_regeneration_status,
        ) in later_language_accent_to_content_status_map[
            language_accent
        ].items():
            if (
                content_id
                not in reference_language_accent_to_content_status_map[
                    language_accent
                ]
            ):
                reference_language_accent_to_content_status_map[
                    language_accent
                ][content_id] = later_regeneration_status

    return reference_language_accent_to_content_status_map


def save_voiceover_regeneration_job(
    voiceover_regeneration_job: cloud_task_domain.VoiceoverRegenerationJob,
) -> None:
    """Saves the VoiceoverRegenerationJob object to the datastore.

    Args:
        voiceover_regeneration_job: VoiceoverRegenerationJob. The
            VoiceoverRegenerationJob domain object to be saved.
    """
    voiceover_regeneration_job_model_id = '%s:%s' % (
        voiceover_regeneration_job.exploration_id,
        voiceover_regeneration_job.task_run_id,
    )
    voiceover_regeneration_job_model = (
        cloud_task_models.VoiceoverRegenerationJobModel.get(
            voiceover_regeneration_job_model_id, strict=False
        )
    )

    if voiceover_regeneration_job_model is None:
        voiceover_regeneration_job_model = (
            cloud_task_models.VoiceoverRegenerationJobModel(
                id=voiceover_regeneration_job_model_id,
                exploration_id=voiceover_regeneration_job.exploration_id,
                cloud_task_run_id=voiceover_regeneration_job.task_run_id,
            )
        )

    voiceover_regeneration_job_model.language_accent_to_content_status_map = (
        voiceover_regeneration_job.language_accent_to_content_status_map
    )
    voiceover_regeneration_job_model.update_timestamps()
    voiceover_regeneration_job_model.put()


def is_voiceover_regeneration_defer_function(function_id: str) -> bool:
    """Returns whether the given function ID corresponds to a voiceover
    regeneration task.

    Args:
        function_id: str. The function ID of the deferred task.

    Returns:
        bool. Whether the function ID corresponds to a voiceover regeneration
        task.
    """
    return function_id in [
        feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_CURATION'
        ],
        feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_REGENERATE_VOICEOVERS_ON_EXP_UPDATE'
        ],
        feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_REGENERATE_VOICEOVERS_BY_LANGUAGE_ACCENT'
        ],
        feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_REGENERATE_VOICEOVERS_AFTER_ACCEPTING_SUGGESTION'
        ],
        feconf.FUNCTION_ID_TO_FUNCTION_NAME_FOR_DEFERRED_JOBS[
            'FUNCTION_ID_REGENERATE_VOICEOVERS_FOR_BATCH_CONTENTS'
        ],
    ]


def create_voiceover_regeneration_task_with_status_generating(
    exploration_id: str,
    task_run_id: str,
    language_code_to_contents_mapping: Dict[str, Dict[str, str]],
    language_code_to_autogeneratable_accent_codes: Dict[str, List[str]],
) -> cloud_task_domain.VoiceoverRegenerationJob:
    """Creates a VoiceoverRegenerationJob object with all contents set
    to 'GENERATING' status.

    Args:
        exploration_id: str. The ID of the exploration for which voiceovers
            need to be regenerated.
        task_run_id: str. The unique identifier for the voiceover regeneration
            task.
        language_code_to_contents_mapping: dict. A dictionary mapping language
            codes to their corresponding content IDs and HTML that require
            voiceover regeneration.
        language_code_to_autogeneratable_accent_codes: dict. A dictionary
            mapping language codes to a list of accent codes that support
            autogeneration.

    Returns:
        VoiceoverRegenerationJob. An instance of
        VoiceoverRegenerationJob with all contents set to
        'GENERATING' status.
    """
    language_accent_to_content_status_map = {}
    for (
        language_code,
        content_ids_to_content_values,
    ) in language_code_to_contents_mapping.items():
        accent_codes = language_code_to_autogeneratable_accent_codes.get(
            language_code, []
        )
        for accent_code in accent_codes:
            language_accent_to_content_status_map[accent_code] = {
                content_id: feconf.VoiceoverRegenerationState.GENERATING.value
                for content_id in content_ids_to_content_values.keys()
            }

    voiceover_regeneration_job = (
        cloud_task_domain.VoiceoverRegenerationJob.create_default(
            exploration_id, task_run_id
        )
    )

    voiceover_regeneration_job.language_accent_to_content_status_map = (
        language_accent_to_content_status_map
    )

    return voiceover_regeneration_job


def create_voiceover_regeneration_task_batch_model(
    voiceover_regeneration_task_batch: cloud_task_domain.VoiceoverRegenerationTaskBatch,
) -> cloud_task_models.VoiceoverRegenerationBatchExecutionModel:
    """Creates a new instance of VoiceoverRegenerationBatchExecutionModel with the
    given parent and child Cloud Task run IDs and exploration ID.

    Args:
        voiceover_regeneration_task_batch: VoiceoverRegenerationTaskBatch. The
            domain object containing the details of the voiceover regeneration
            task batch for which the model instance needs to be created.

    Returns:
        VoiceoverRegenerationBatchExecutionModel. The newly created instance of
        VoiceoverRegenerationBatchExecutionModel.
    """
    return cloud_task_models.VoiceoverRegenerationBatchExecutionModel.create_and_save_model(
        voiceover_regeneration_task_batch.parent_cloud_task_run_id,
        voiceover_regeneration_task_batch.child_cloud_task_run_id,
        voiceover_regeneration_task_batch.exploration_id,
        voiceover_regeneration_task_batch.exploration_version,
        voiceover_regeneration_task_batch.language_accent_code,
        voiceover_regeneration_task_batch.content_ids_to_contents_map,
    )


def create_voiceover_regeneration_task_batch_models(
    voiceover_regeneration_task_batch_instances: List[
        cloud_task_domain.VoiceoverRegenerationTaskBatch
    ],
) -> None:
    """Creates new instances of VoiceoverRegenerationBatchExecutionModel for the
    given list of VoiceoverRegenerationTaskBatch domain objects.

    Args:
        voiceover_regeneration_task_batch_instances: list(
            VoiceoverRegenerationTaskBatch). The domain objects containing the
            details of the voiceover regeneration task batches for which the
            model instances need to be created.
    """
    model_instances = []
    for (
        voiceover_regeneration_task_batch
    ) in voiceover_regeneration_task_batch_instances:

        model_id = '%s:%s' % (
            voiceover_regeneration_task_batch.parent_cloud_task_run_id,
            voiceover_regeneration_task_batch.child_cloud_task_run_id,
        )
        model_instance = cloud_task_models.VoiceoverRegenerationBatchExecutionModel(
            id=model_id,
            parent_cloud_task_run_id=voiceover_regeneration_task_batch.parent_cloud_task_run_id,
            child_cloud_task_run_id=voiceover_regeneration_task_batch.child_cloud_task_run_id,
            exploration_id=voiceover_regeneration_task_batch.exploration_id,
            exploration_version=voiceover_regeneration_task_batch.exploration_version,
            language_accent_code=voiceover_regeneration_task_batch.language_accent_code,
            content_ids_to_contents_map=voiceover_regeneration_task_batch.content_ids_to_contents_map,
        )

        model_instances.append(model_instance)

    cloud_task_models.VoiceoverRegenerationBatchExecutionModel.put_multi(
        model_instances
    )


def get_voiceover_regeneration_batch_instances_by_parent_task_run_id(
    parent_cloud_task_run_id: str,
) -> List[cloud_task_domain.VoiceoverRegenerationTaskBatch]:
    """Returns the list of VoiceoverRegenerationTaskBatch instances corresponding
    to the given parent Cloud Task run ID.

    Args:
        parent_cloud_task_run_id: str. The Cloud Task run ID of the parent task.

    Returns:
        list(VoiceoverRegenerationTaskBatch). The list of
        VoiceoverRegenerationTaskBatch instances corresponding to the given
        parent Cloud Task run ID.
    """
    model_instances = cloud_task_models.VoiceoverRegenerationBatchExecutionModel.get_models_by_parent_id(
        parent_cloud_task_run_id
    )

    domain_instances = []
    for model_instance in model_instances:
        domain_instance = (
            convert_voiceover_regeneration_task_batch_model_to_domain_instance(
                model_instance
            )
        )
        domain_instances.append(domain_instance)

    return domain_instances


def get_voiceover_regeneration_task_batch_model(
    parent_cloud_task_run_id: str, child_cloud_task_run_id: str
) -> Optional[cloud_task_domain.VoiceoverRegenerationTaskBatch]:
    """Returns the instance of VoiceoverRegenerationBatchExecutionModel corresponding
    to the given parent and child Cloud Task run IDs.

    Args:
        parent_cloud_task_run_id: str. The Cloud Task run ID of the parent task.
        child_cloud_task_run_id: str. The Cloud Task run ID of the child task.

    Returns:
        VoiceoverRegenerationTaskBatch|None. The instance of
        VoiceoverRegenerationTaskBatch corresponding to the given parent and
        child Cloud Task run IDs, or None if no such model exists.
    """
    model_id = '%s:%s' % (parent_cloud_task_run_id, child_cloud_task_run_id)
    model_instance = (
        cloud_task_models.VoiceoverRegenerationBatchExecutionModel.get(
            model_id, strict=False
        )
    )

    if model_instance is None:
        return None

    return convert_voiceover_regeneration_task_batch_model_to_domain_instance(
        model_instance
    )


def convert_voiceover_regeneration_task_batch_model_to_domain_instance(
    model_instance: cloud_task_models.VoiceoverRegenerationBatchExecutionModel,
) -> cloud_task_domain.VoiceoverRegenerationTaskBatch:
    """Converts the given instance of VoiceoverRegenerationBatchExecutionModel to its
    corresponding domain object.

    Args:
        model_instance: VoiceoverRegenerationBatchExecutionModel. The instance of
            VoiceoverRegenerationBatchExecutionModel to be converted.

    Returns:
        VoiceoverRegenerationTaskBatch. The corresponding domain object for the
        given instance of VoiceoverRegenerationBatchExecutionModel.
    """
    return cloud_task_domain.VoiceoverRegenerationTaskBatch(
        model_instance.parent_cloud_task_run_id,
        model_instance.child_cloud_task_run_id,
        model_instance.exploration_id,
        model_instance.exploration_version,
        model_instance.language_accent_code,
        model_instance.content_ids_to_contents_map,
    )


def create_or_update_voiceover_regeneration_task_batch_model(
    domain_instance: cloud_task_domain.VoiceoverRegenerationTaskBatch,
) -> None:
    """Creates or updates the instance of VoiceoverRegenerationBatchExecutionModel
    corresponding to the given domain object.

    Args:
        domain_instance: VoiceoverRegenerationTaskBatch. The instance of
            VoiceoverRegenerationTaskBatch to be converted.
    """
    model_id = '%s:%s' % (
        domain_instance.parent_cloud_task_run_id,
        domain_instance.child_cloud_task_run_id,
    )
    model_instance = (
        cloud_task_models.VoiceoverRegenerationBatchExecutionModel.get(
            model_id, strict=False
        )
    )

    if model_instance is None:
        cloud_task_models.VoiceoverRegenerationBatchExecutionModel.create_and_save_model(
            parent_cloud_task_run_id=domain_instance.parent_cloud_task_run_id,
            child_cloud_task_run_id=domain_instance.child_cloud_task_run_id,
            exploration_id=domain_instance.exploration_id,
            exploration_version=domain_instance.exploration_version,
            language_accent_code=domain_instance.language_accent_code,
            content_ids_to_contents_map=domain_instance.content_ids_to_contents_map,
        )
        return

    model_instance.parent_cloud_task_run_id = (
        domain_instance.parent_cloud_task_run_id
    )
    model_instance.child_cloud_task_run_id = (
        domain_instance.child_cloud_task_run_id
    )
    model_instance.exploration_id = domain_instance.exploration_id
    model_instance.exploration_version = domain_instance.exploration_version
    model_instance.language_accent_code = domain_instance.language_accent_code
    model_instance.content_ids_to_contents_map = (
        domain_instance.content_ids_to_contents_map
    )
    model_instance.update_timestamps()
    model_instance.put()
