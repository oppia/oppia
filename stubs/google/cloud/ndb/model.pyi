from . import Model, TYPE_MODEL
from google.cloud import datastore

def _entity_from_ds_entity(
    entity: datastore.Entity,
    model_class: Type[TYPE_MODEL] = Model) -> TYPE_MODEL: ...
