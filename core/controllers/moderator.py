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

"""Controllers for the moderator page."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import activity_domain
from core.domain import activity_services
from core.domain import email_manager
from core.domain import summary_services

from typing import Dict, List, TypedDict


class FeaturedActivitiesHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of FeaturedActivitiesHandler's
    normalized_Payload dictionary.
    """

    featured_activity_reference_dicts: List[activity_domain.ActivityReference]


class FeaturedActivitiesHandler(
    base.BaseHandler[
        FeaturedActivitiesHandlerNormalizedPayloadDict,
        Dict[str, str]
    ]
):
    """The moderator page handler for featured activities."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'featured_activity_reference_dicts': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': activity_domain.ActivityReference
                    }
                }
            }
        }
    }

    @acl_decorators.can_access_moderator_page
    def get(self) -> None:
        """Handles GET requests."""
        self.render_json({
            'featured_activity_references': [
                activity_reference.to_dict() for activity_reference in
                activity_services.get_featured_activity_references()
            ],
        })

    @acl_decorators.can_access_moderator_page
    def post(self) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        featured_activity_references = self.normalized_payload[
            'featured_activity_reference_dicts']

        try:
            # Retrieve the list for each type of inavlid ID.
            dne_exp, dne_col, priv_exp, priv_col = (
                summary_services.check_activity_id_validity(
                featured_activity_references)
            )

            # If all of the lists are empty, there are no invalid IDs.
            if ((not dne_exp) & (not dne_col) &
                (not priv_exp) & (not priv_col)):
                activity_services.update_featured_activity_references(
                featured_activity_references)
                self.render_json({})
            else:

                error_message = ''

                # If there are IDs for non-existent Explorations.
                if dne_exp:
                    error = (
                        f'These Exploration IDs do not exist: '
                        f'{", ".join(str(id) for id in dne_exp)}. '
                    )
                    error_message = error_message + error

                # If there are IDs for non-existent Collections.
                if dne_col:
                    error = (
                        f'These Collection IDs do not exist: '
                        f'{", ".join(str(id) for id in dne_col)}. '
                    )
                    error_message = error_message + error

                # If there are IDs for private Explorations.
                if priv_exp:
                    error = (
                        f'These Exploration IDs are private: '
                        f'{", ".join(str(id) for id in priv_exp)}. '
                    )
                    error_message = error_message + error

                # If there are IDs for private Collections.
                if priv_col:
                    error = (
                        f'These Collection IDs are private: '
                        f'{", ".join(str(id) for id in priv_col)}. '
                    )
                    error_message = error_message + error

                error_message = f'{error_message}Please enter a different ID.'

                raise self.InvalidInputException(error_message)

        except Exception as e:
            raise self.InvalidInputException(e)


class EmailDraftHandler(base.BaseHandler[Dict[str, str], Dict[str, str]]):
    """Provide default email templates for moderator emails."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_send_moderator_emails
    def get(self) -> None:
        """Handles GET requests."""
        self.render_json({
            'draft_email_body': (
                email_manager.get_moderator_unpublish_exploration_email()),
        })
