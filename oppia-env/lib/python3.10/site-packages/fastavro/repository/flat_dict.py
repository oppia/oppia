import json
from os import path

from .base import AbstractSchemaRepository, SchemaRepositoryError


class FlatDictRepository(AbstractSchemaRepository):
    def __init__(self, path):
        self.path = path
        self.file_ext = "avsc"

    def load(self, name):
        file_path = path.join(self.path, f"{name}.{self.file_ext}")
        try:
            with open(file_path) as schema_file:
                return json.load(schema_file)
        except IOError as error:
            raise SchemaRepositoryError(
                f"Failed to load '{name}' schema",
            ) from error
        except json.decoder.JSONDecodeError as error:
            raise SchemaRepositoryError(
                f"Failed to parse '{name}' schema",
            ) from error
