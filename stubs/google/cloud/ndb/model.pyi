from . import Model, TYPE_MODEL
from google.cloud import datastore
from typing import Type

def _entity_to_ds_entity(entity: Model) -> datastore.Entity: ...

def _entity_from_ds_entity(
    entity: datastore.Entity,
    model_class: Type[TYPE_MODEL] = ...) -> TYPE_MODEL: ...
