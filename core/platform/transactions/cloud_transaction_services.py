# coding: utf-8
#
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

"""Provides a seam for transaction services."""

from __future__ import annotations

import functools
import logging
import time

from google.cloud import datastore
from typing import Any, Callable, TypeVar

# Here we use MyPy ignore because the 'google.api_core' module is dynamically
# loaded, and MyPy cannot normally detect the 'exceptions' attribute.
from google.api_core import exceptions as google_api_exceptions  # type: ignore[attr-defined] # isort: skip

CLIENT = datastore.Client()

T = TypeVar('T')


# Define retry constants.
MAX_RETRIES = 5
INITIAL_RETRY_DELAY_SECS = 1.0


def run_in_transaction_wrapper(
    transactional_fn: Callable[..., T],
) -> Callable[..., T]:
    """Wrapper for transactional functions that retries on transient errors.

    Args:
        transactional_fn: Callable. The function to be wrapped.

    Returns:
        Callable. The wrapped function.
    """

    # Here we use type Any because this function is a generic wrapper for
    # other functions, which can have almost any types of arguments.
    @functools.wraps(transactional_fn)
    def wrapper(*args: Any, **kwargs: Any) -> T:
        """Wrapper for the transactional function.

        Returns:
            *. The return value of the transactional function.

        Raises:
            Exception. The exception raised by the transactional function
                if it is not a ServiceUnavailable error.
            google_api_exceptions.ServiceUnavailable. Raised if the transaction
                fails due to a transient error after all retries are exhausted.
        """
        # Implement exponential backoff for retries.
        for i in range(MAX_RETRIES):
            try:
                with CLIENT.transaction():
                    return transactional_fn(*args, **kwargs)
            except google_api_exceptions.ServiceUnavailable as e:
                # This is a transient error. Log it and retry.
                logging.exception(
                    'ServiceUnavailable error in transaction, retrying... (%s/%s)'
                    % (i + 1, MAX_RETRIES)
                )
                # If this was the last retry, re-raise the exception.
                if i == MAX_RETRIES - 1:
                    raise e

                # Wait before the next retry, with exponential backoff.
                time.sleep(INITIAL_RETRY_DELAY_SECS * (2**i))
            except Exception as e:
                # This is a non-retryable error (like a code bug).
                # Re-raise it immediately.
                raise e

        # This line should not be reachable, but as a fallback,
        # we raise the last exception if the loop finishes.
        raise Exception('Transaction failed after %s retries.' % MAX_RETRIES)

    return wrapper
