# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Support for batching operations."""


def get_batch(batch_cls, options=None):
    """Gets a data structure for storing batched calls to Datastore Lookup.

    The batch data structure is stored in the current context. If there is
    not already a batch started, a new structure is created and an idle
    callback is added to the current event loop which will eventually perform
    the batch look up.

    Args:
        batch_cls (type): Class representing the kind of operation being
            batched.
        options (_options.ReadOptions): The options for the request. Calls with
            different options will be placed in different batches.

    Returns:
        batch_cls: An instance of the batch class.
    """
    # prevent circular import in Python 2.7
    from google.cloud.ndb import context as context_module

    context = context_module.get_context()
    batches = context.batches.get(batch_cls)
    if batches is None:
        context.batches[batch_cls] = batches = {}

    if options is not None:
        options_key = tuple(
            sorted(
                ((key, value) for key, value in options.items() if value is not None)
            )
        )
    else:
        options_key = ()

    batch = batches.get(options_key)
    if batch is not None and not batch.full():
        return batch

    def idler(batch):
        def idle():
            if batches.get(options_key) is batch:
                del batches[options_key]
            batch.idle_callback()

        return idle

    batches[options_key] = batch = batch_cls(options)
    context.eventloop.add_idle(idler(batch))
    return batch
