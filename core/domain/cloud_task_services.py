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

"""Domain objects for Cloud task run."""

from __future__ import annotations

from core.domain import cloud_task_domain, voiceover_services

from typing import List, TypedDict
from core.platform import models
import feconf

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import cloud_task_models

(cloud_task_models,) = models.Registry.import_models([models.Names.CLOUD_TASK])


def get_voiceover_regeneration_task(
    exploration_id: str, cloud_task_run_id: str
):
    voiceover_regeneration_task_id = '%s:%s' % (
        exploration_id,
        cloud_task_run_id,
    )
    voiceover_regeneration_task_run_model = (
        cloud_task_models.VoiceoverRegenerationTaskMapping.get(
            voiceover_regeneration_task_id, None
        )
    )

    if voiceover_regeneration_task_run_model is not None:
        voiceover_regeneration_task_run = cloud_task_domain.VoiceoverRegenerationTaskMapping.from_dict(
            {
                'exploration_id': (
                    voiceover_regeneration_task_run_model.exploration_id
                ),
                'task_run_id': (
                    voiceover_regeneration_task_run_model.cloud_task_run_id
                ),
                'language_accent_to_content_status_map': (
                    voiceover_regeneration_task_run_model.language_accent_to_content_status_map
                ),
            }
        )
    else:
        voiceover_regeneration_task_run = None

    return voiceover_regeneration_task_run


def get_existing_voiceover_regeneration_requests_in_task_queue(
    exploration_id: str, exploration_version: int
):
    """Returns the existing voiceover regeneration cloud task run requests for
    the given exploration.

    Args:
        exploration_id: str. The id of the exploration.
        exploration_version: int. The version of the exploration.

    Returns:
        dict. A mapping of language accents to their content regeneration
        status.
    """

    # Getting all the existing voiceover regeneration requests for the given
    # exploration ID.
    voiceover_regeneration_task_requests = cloud_task_models.VoiceoverRegenerationTaskMapping.get_voiceover_regeneration_tasks_by_exploration_id(
        exploration_id
    )

    # List of domain instances for the voiceover regeneration requests.
    voiceover_regeneration_task_domain_objects = []

    for task_mapping_model in voiceover_regeneration_task_requests:
        voiceover_regeneration_task_domain_object = (
            cloud_task_domain.VoiceoverRegenerationTaskMapping.from_dict(
                {
                    'exploration_id': task_mapping_model.exploration_id,
                    'task_run_id': task_mapping_model.cloud_task_run_id,
                    'language_accent_to_content_status_map': (
                        task_mapping_model.language_accent_to_content_status_map
                    ),
                }
            )
        )

        voiceover_regeneration_task_domain_objects.append(
            voiceover_regeneration_task_domain_object
        )

    # If multiple voiceover-regeneration requests exist in the Cloud Task queue
    # for the same exploration ID, they should be merged into a single
    # dictionary containing the latest data.
    language_accent_to_content_status_map = (
        resolve_multiple_cloud_task_runs_for_exploration(
            voiceover_regeneration_task_domain_objects
        )
    )

    return {
        'exploration_id': exploration_id,
        'language_accent_to_content_status_map': (
            language_accent_to_content_status_map
        ),
    }


def delete_voiceover_regeneration_task_run_mapping(
    cloud_task_run_id: str,
) -> None:
    """Deletes the VoiceoverRegenerationTaskMapping model entry for the given
    cloud task run id.

    Args:
        cloud_task_run_id: str. The id of the cloud task run.
    """
    cloud_task_models.VoiceoverRegenerationTaskMapping.delete_by_id(
        cloud_task_run_id
    )


def resolve_multiple_cloud_task_runs_for_exploration(
    voiceover_regeneration_task_domain_objects,
):
    """Resolves multiple voiceover regeneration cloud task run requests for
    the same exploration by merging their content status.

    Args:
        voiceover_regeneration_task_domain_objects: list(
            VoiceoverRegenerationTaskMapping). A list of
            VoiceoverRegenerationTaskMapping domain objects.

    Returns:
        dict. A mapping of language accents to their content regeneration
        status.
    """
    # A reference mapping dictionary to hold the merged language accent to
    # content status data.
    reference_language_accent_to_content_status_map = {}

    for (
        voiceover_regeneration_task
    ) in voiceover_regeneration_task_domain_objects:
        for (
            language_accent,
            content_status_map,
        ) in (
            voiceover_regeneration_task.language_accent_to_content_status_map.items()
        ):

            if (
                language_accent
                not in reference_language_accent_to_content_status_map
            ):
                reference_language_accent_to_content_status_map[
                    language_accent
                ] = content_status_map
            else:
                reference_content_status_map = (
                    reference_language_accent_to_content_status_map[
                        language_accent
                    ]
                )

                for (
                    content_id,
                    regeneration_status,
                ) in content_status_map.items():
                    if content_id not in reference_content_status_map:
                        reference_content_status_map[content_id] = (
                            regeneration_status
                        )
                    elif reference_content_status_map[content_id] in [
                        'PENDING',
                        'RUNNING',
                        'FAILED_AND_AWAITING_RETRY',
                    ]:
                        # If any voiceover-regeneration request is not
                        # concluded, its status should be used as the final
                        # status for the content.
                        continue
                    else:
                        reference_content_status_map[content_id] = (
                            regeneration_status
                        )

    return reference_language_accent_to_content_status_map


def save_voiceover_regeneration_task_run_mapping(
    voiceover_regeneration_task: cloud_task_domain.VoiceoverRegenerationTaskMapping,
) -> None:
    voiceover_regeneration_task_model_id = '%s:%s' % (
        voiceover_regeneration_task.exploration_id,
        voiceover_regeneration_task.task_run_id,
    )
    voiceover_regeneration_task_model = (
        cloud_task_models.VoiceoverRegenerationTaskMapping.get(
            voiceover_regeneration_task_model_id, None
        )
    )

    if voiceover_regeneration_task_model is None:
        voiceover_regeneration_task_model = (
            cloud_task_models.VoiceoverRegenerationTaskMapping(
                id=voiceover_regeneration_task_model_id,
                exploration_id=voiceover_regeneration_task.exploration_id,
                task_run_id=voiceover_regeneration_task.task_run_id,
            )
        )

    voiceover_regeneration_task_model.language_accent_to_content_status_map = (
        voiceover_regeneration_task.language_accent_to_content_status_map
    )
    voiceover_regeneration_task_model.update_timestamp()
    voiceover_regeneration_task_model.put()


def is_voiceover_regeneration_task_function(function_id: str) -> bool:
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
    ]
