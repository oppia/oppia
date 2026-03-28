from abc import ABC, abstractmethod


class SchemaRepositoryError(Exception):
    pass


class AbstractSchemaRepository(ABC):
    @abstractmethod
    def load(self, name):
        pass
