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


def get_voiceover_regeneration_task(
    exploration_id: str, cloud_task_run_id: str
) -> Optional[cloud_task_domain.VoiceoverRegenerationTaskMapping]:
    """Returns the VoiceoverRegenerationTaskMapping instance for the given
    exploration id and cloud task run id.

    Args:
        exploration_id: str. The id of the exploration.
        cloud_task_run_id: str. The id of the cloud task run.

    Returns:
        VoiceoverRegenerationTaskMapping|None. The
        VoiceoverRegenerationTaskMapping instance for the given exploration id
        and cloud task run id.
    """
    voiceover_regeneration_task_id = '%s:%s' % (
        exploration_id,
        cloud_task_run_id,
    )
    voiceover_regeneration_task_run_model = (
        cloud_task_models.VoiceoverRegenerationTaskMappingModel.get(
            voiceover_regeneration_task_id, strict=False
        )
    )

    if voiceover_regeneration_task_run_model is None:
        return None

    return cloud_task_domain.VoiceoverRegenerationTaskMapping(
        voiceover_regeneration_task_run_model.exploration_id,
        voiceover_regeneration_task_run_model.cloud_task_run_id,
        voiceover_regeneration_task_run_model.language_accent_to_content_status_map,
    )


def get_existing_voiceover_regeneration_requests_in_task_queue(
    exploration_id: str,
) -> Dict[str, Dict[str, Dict[str, str]]]:
    """Returns the existing voiceover regeneration cloud task run requests for
    the given exploration ID.

    Args:
        exploration_id: str. The id of the exploration.

    Returns:
        dict. A mapping of language accents to their content regeneration
        status.
    """
    # Getting all the existing voiceover regeneration requests for the given
    # exploration ID.
    voiceover_regeneration_task_request_models: List[
        cloud_task_models.VoiceoverRegenerationTaskMappingModel
    ] = cloud_task_models.VoiceoverRegenerationTaskMappingModel.get_voiceover_regeneration_tasks_by_exploration_id(
        exploration_id
    )

    # Here we use cast because we are narrowing down the type from
    # Optional[datetime.datetime] to datetime.datetime for sorting purposes.
    voiceover_regeneration_task_request_models.sort(
        key=lambda model: cast(datetime.datetime, model.created_on)
    )

    # If multiple voiceover-regeneration requests exist in the Cloud Task queue
    # for the same exploration ID, they should be merged into a single
    # dictionary containing the latest status data.
    language_accent_to_content_status_map = (
        resolve_multiple_cloud_task_runs_for_exploration(
            voiceover_regeneration_task_request_models
        )
    )

    voiceover_regeneration_task_models_to_delete = []

    for (
        voiceover_regeneration_task_model
    ) in voiceover_regeneration_task_request_models:
        voiceover_regeneration_task = cloud_task_domain.VoiceoverRegenerationTaskMapping(
            voiceover_regeneration_task_model.exploration_id,
            voiceover_regeneration_task_model.cloud_task_run_id,
            voiceover_regeneration_task_model.language_accent_to_content_status_map,
        )

        if voiceover_regeneration_task.are_all_voiceovers_generated():
            voiceover_regeneration_task_models_to_delete.append(
                voiceover_regeneration_task_model
            )

    # Deleting the voiceover regeneration task run mapping if all
    # voiceovers have been generated successfully.
    cloud_task_models.VoiceoverRegenerationTaskMappingModel.delete_multi(
        voiceover_regeneration_task_models_to_delete
    )

    return {
        'language_accent_to_content_status_map': (
            language_accent_to_content_status_map
        )
    }


def delete_voiceover_regeneration_task_run_mapping(
    exploration_id: str,
    cloud_task_run_id: str,
) -> None:
    """Deletes the VoiceoverRegenerationTaskMappingModel entry for the given
    cloud task run id.

    Args:
        exploration_id: str. The id of the exploration.
        cloud_task_run_id: str. The id of the cloud task run.
    """
    model_id = '%s:%s' % (exploration_id, cloud_task_run_id)
    cloud_task_models.VoiceoverRegenerationTaskMappingModel.delete_by_id(
        model_id
    )


def update_voiceover_regeneration_task_run_mapping_for_content(
    exploration_id: str,
    language_accent_code: str,
    content_id: str,
    regeneration_status: str,
) -> None:
    """Updates the regeneration status of a specific content in all existing
    voiceover regeneration task run mappings for the given exploration ID.

    Args:
        exploration_id: str. The id of the exploration.
        language_accent_code: str. The language accent code of the content to be
            updated.
        content_id: str. The content ID of the content to be updated.
        regeneration_status: str. The new regeneration status to be set for the
            specified content.
    """
    voiceover_regeneration_task_requests = cloud_task_models.VoiceoverRegenerationTaskMappingModel.get_voiceover_regeneration_tasks_by_exploration_id(
        exploration_id
    )

    for task_mapping_model in voiceover_regeneration_task_requests:
        if (
            language_accent_code
            in task_mapping_model.language_accent_to_content_status_map
            and content_id
            in task_mapping_model.language_accent_to_content_status_map[
                language_accent_code
            ]
        ):
            task_mapping_model.language_accent_to_content_status_map[
                language_accent_code
            ][content_id] = regeneration_status
            task_mapping_model.update_timestamps()
            task_mapping_model.put()


def resolve_multiple_cloud_task_runs_for_exploration(
    voiceover_regeneration_task_request_models: List[
        cloud_task_models.VoiceoverRegenerationTaskMappingModel
    ],
) -> Dict[str, Dict[str, str]]:
    """Resolves multiple voiceover regeneration cloud task run requests for
    the same exploration by merging their content status.

    Args:
        voiceover_regeneration_task_request_models: list(
            VoiceoverRegenerationTaskMappingModel). A list of
            VoiceoverRegenerationTaskMappingModel instances.

    Returns:
        dict. A mapping of language accents to their content regeneration
        status.
    """
    reference_language_accent_to_content_status_map: Dict[
        str, Dict[str, str]
    ] = collections.defaultdict(dict)

    number_of_models = len(voiceover_regeneration_task_request_models)

    if number_of_models == 0:
        return {}

    if number_of_models == 1:
        language_accent_to_content_status_map: Dict[str, Dict[str, str]] = (
            voiceover_regeneration_task_request_models[
                0
            ].language_accent_to_content_status_map
        )
        return language_accent_to_content_status_map

    # Number of models is more than 1.
    for index in range(number_of_models - 1):
        earlier_model = voiceover_regeneration_task_request_models[index]
        later_model = voiceover_regeneration_task_request_models[index + 1]

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
        voiceover_regeneration_task_request_models[
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


def save_voiceover_regeneration_task_run_mapping(
    voiceover_regeneration_task: cloud_task_domain.VoiceoverRegenerationTaskMapping,
) -> None:
    """Saves the VoiceoverRegenerationTaskMapping object to the datastore.

    Args:
        voiceover_regeneration_task: VoiceoverRegenerationTaskMapping. The
            VoiceoverRegenerationTaskMapping domain object to be saved.
    """
    voiceover_regeneration_task_model_id = '%s:%s' % (
        voiceover_regeneration_task.exploration_id,
        voiceover_regeneration_task.task_run_id,
    )
    voiceover_regeneration_task_model = (
        cloud_task_models.VoiceoverRegenerationTaskMappingModel.get(
            voiceover_regeneration_task_model_id, strict=False
        )
    )

    if voiceover_regeneration_task_model is None:
        voiceover_regeneration_task_model = (
            cloud_task_models.VoiceoverRegenerationTaskMappingModel(
                id=voiceover_regeneration_task_model_id,
                exploration_id=voiceover_regeneration_task.exploration_id,
                cloud_task_run_id=voiceover_regeneration_task.task_run_id,
            )
        )

    voiceover_regeneration_task_model.language_accent_to_content_status_map = (
        voiceover_regeneration_task.language_accent_to_content_status_map
    )
    voiceover_regeneration_task_model.update_timestamps()
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


def create_voiceover_regeneration_task_with_status_generating(
    exploration_id: str,
    task_run_id: str,
    language_code_to_contents_mapping: Dict[str, Dict[str, str]],
    language_code_to_autogeneratable_accent_codes: Dict[str, List[str]],
) -> cloud_task_domain.VoiceoverRegenerationTaskMapping:
    """Creates a VoiceoverRegenerationTaskMapping object with all contents set
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
        VoiceoverRegenerationTaskMapping. An instance of
        VoiceoverRegenerationTaskMapping with all contents set to
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

    voiceover_regeneration_task_map = cloud_task_domain.VoiceoverRegenerationTaskMapping.create_default_voiceover_regeneration_task_mapping(
        exploration_id, task_run_id
    )

    voiceover_regeneration_task_map.language_accent_to_content_status_map = (
        language_accent_to_content_status_map
    )

    return voiceover_regeneration_task_map
