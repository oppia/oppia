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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import functools

from google.appengine.ext import ndb


def run_in_transaction_wrapper(fn):
    """Runs a decorated function in a transaction. Either all of the operations
    in the transaction are applied, or none of them are applied.

    If an exception is raised, the transaction is likely not safe to
    commit, since TransactionOptions.ALLOWED is used.

    Returns:
        function. Function wrapped in transaction.

    Raises:
        Exception. Whatever fn() raises.
        datastore_errors.TransactionFailedError. The transaction failed.
    """
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        """Wrapper for the transaction."""
        return ndb.transaction(
            lambda: fn(*args, **kwargs),
            xg=True,
            propagation=ndb.TransactionOptions.ALLOWED,
        )

    return wrapper


def toplevel_wrapper(*args, **kwargs):
    """Enables a WSGI application to not exit until all its asynchronous
    requests have finished.

    For more information, see
    https://developers.google.com/appengine/docs/python/ndb/async#intro

    Args:
        *args: list(*). Variable length argument list.
        **kwargs: *. Arbitrary keyword arguments.

    Returns:
        app. The entire app toplevel.
    """
    return ndb.toplevel(*args, **kwargs)
