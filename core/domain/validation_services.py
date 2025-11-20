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
# limitations under the License.

"""Service functions for centralized validation logic."""

from __future__ import annotations

import re
import string

from core.constants import constants
from core import utils
from core.domain import html_cleaner
from core.domain import html_validation_service

from typing import List, Optional


def validate_email(email_address: str) -> None:
    """Validates the format of an email address.

    Args:
        email_address: str. The email address to validate.

    Raises:
        ValidationError. The email address is not a string.
        ValidationError. The email address is empty.
        ValidationError. The email address format is invalid.
    """
    if not isinstance(email_address, str):
        raise utils.ValidationError(
            'Expected email to be a string, received %s' % email_address
        )

    if not email_address:
        raise utils.ValidationError('No email address specified.')

    if (
        '@' not in email_address
        or email_address.startswith('@')
        or email_address.endswith('@')
    ):
        raise utils.ValidationError(
            'Invalid email address: %s' % email_address
        )


def is_email_valid(email_address: str) -> bool:
    """Checks if an email address is valid.

    Args:
        email_address: str. The email address to check.

    Returns:
        bool. Whether the email address is valid.
    """
    try:
        validate_email(email_address)
        return True
    except utils.ValidationError:
        return False


def validate_html_content(
    html_content: str, rte_format: Optional[str] = None
) -> str:
    """Validates HTML content for safety and correctness.

    Args:
        html_content: str. The HTML content to validate.
        rte_format: str|None. The RTE format for validation.

    Returns:
        str. The cleaned HTML content.

    Raises:
        ValidationError. The HTML content is not a string.
        ValidationError. The HTML content contains invalid tags or
            attributes.
    """
    if not isinstance(html_content, str):
        raise utils.ValidationError(
            'Expected HTML content to be a string, received %s'
            % html_content
        )

    cleaned_html = html_cleaner.clean(html_content)
    html_cleaner.validate_rte_tags(cleaned_html)
    html_cleaner.validate_tabs_and_collapsible_rte_tags(cleaned_html)

    if rte_format:
        error_dict = html_validation_service.validate_rte_format(
            [cleaned_html], rte_format
        )
        if any(error_dict.values()):
            raise utils.ValidationError(
                'Invalid HTML content for RTE format %s: %s'
                % (rte_format, error_dict)
            )
    
    return cleaned_html


def validate_tags(tags: List[str], field_name: str = 'tags') -> None:
    """Validates a list of tags for format and content.

    Args:
        tags: list(str). The list of tags to validate.
        field_name: str. The name of the field for error messages.

    Raises:
        ValidationError. The tags are not in a list.
        ValidationError. A tag is not a string.
        ValidationError. A tag is empty.
        ValidationError. A tag contains invalid characters.
        ValidationError. A tag starts or ends with whitespace.
        ValidationError. A tag contains adjacent whitespace.
        ValidationError. There are duplicate tags.
    """
    if not isinstance(tags, list):
        raise utils.ValidationError(
            'Expected \'%s\' to be a list, received %s' % (field_name, tags)
        )

    for tag in tags:
        if not isinstance(tag, str):
            raise utils.ValidationError(
                'Expected each tag in \'%s\' to be a string, received '
                '\'%s\'' % (field_name, tag)
            )

        if not tag:
            raise utils.ValidationError('Tags should be non-empty.')

        if not re.match(constants.TAG_REGEX, tag):
            raise utils.ValidationError(
                'Tags should only contain lowercase letters and spaces, '
                'received \'%s\'' % tag
            )

        if (
            tag[0] not in string.ascii_lowercase
            or tag[-1] not in string.ascii_lowercase
        ):
            raise utils.ValidationError(
                'Tags should not start or end with whitespace, received '
                '\'%s\'' % tag
            )

        if re.search(r'\s\s+', tag):
            raise utils.ValidationError(
                'Adjacent whitespace in tags should be collapsed, '
                'received \'%s\'' % tag
            )

    if len(set(tags)) != len(tags):
        raise utils.ValidationError('Some tags duplicate each other')