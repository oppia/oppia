from collections import namedtuple
import json


class ValidationErrorData(
    namedtuple("ValidationErrorData", ["datum", "schema", "field"])
):
    def __str__(self):
        if self.datum is None:
            return f"Field({self.field}) is None expected {self.schema}"

        return (
            f"{self.field} is <{self.datum}> of type "
            + f"{type(self.datum)} expected {self.schema}"
        )


class ValidationError(Exception):
    def __init__(self, *errors):
        message = json.dumps([str(e) for e in errors], indent=2, ensure_ascii=False)
        super().__init__(message)
        self.errors = errors
