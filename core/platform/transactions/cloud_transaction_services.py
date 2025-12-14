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

from core import utils

from google.cloud import datastore
from typing import Callable, TypeVar

# TypeVar for the decorator to maintain function return type.
ReturnType = TypeVar('ReturnType')


class DatastoreClientSingleton(metaclass=utils.SingletonMeta):
    """Singleton wrapper for the Datastore client."""

    def __init__(self) -> None:
        """Initialize the Datastore client."""
        self._client: datastore.Client = datastore.Client()

    def get_client(self) -> datastore.Client:
        """Return the Datastore client instance.

        Returns:
            datastore.Client. The Datastore client instance.
        """
        return self._client


def get_client() -> datastore.Client:
    """Get or create the datastore client lazily.

    Returns:
        datastore.Client. The Datastore client instance.
    """
    return DatastoreClientSingleton().get_client()


def run_in_transaction_wrapper(
    fn: Callable[..., ReturnType],
) -> Callable[..., ReturnType]:
    """Runs a decorated function in a transaction. Either all of the operations
    in the transaction are applied, or none of them are applied.

    If an exception is raised, the transaction is likely not safe to
    commit, since TransactionOptions.ALLOWED is used.

    Args:
        fn: Callable[..., ReturnType]. The function to wrap in a transaction.

    Returns:
        Callable[..., ReturnType]. Function wrapped in transaction.

    Raises:
        Exception. Whatever fn() raises.
        datastore_errors.TransactionFailedError. The transaction failed.
    """

    # Here we use object because the wrapper needs to accept any argument types
    # that the wrapped function accepts.
    @functools.wraps(fn)
    def wrapper(*args: object, **kwargs: object) -> ReturnType:
        """Wrapper for the transaction.

        Args:
            *args: list(*). Variable positional arguments.
            **kwargs: object. Variable keyword arguments.

        Returns:
            ReturnType. The return value from the wrapped function.
        """
        with get_client().transaction():
            return fn(*args, **kwargs)

    return wrapper
