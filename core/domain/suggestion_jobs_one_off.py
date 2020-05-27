

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import opportunity_services
from core.domain import skill_services
from core.domain import suggestion_services
from core.platform import models
import feconf
import utils
from core import jobs

(suggestion_models,) = models.Registry.import_models([models.NAMES.suggestion])




class SuggestionAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that tabulates the number of hints used by each state of an
    exploration.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return
        
        suggestion = suggestion_services.get_suggestion_from_model(item).to_dict()
        print("***************************************************************\n")
        print(" in SuggestionAuditOneOffJob\n")
        import json
        import pprint
        print(json.dumps(suggestion))

        yield (suggestion['suggestion_id'], suggestion['change']['translation_html'])

    @staticmethod
    def reduce(key, values):
        yield (key, values)
