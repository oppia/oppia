# coding=utf-8
"""
The Template Default Content API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/templates/default-content/
Schema: https://api.mailchimp.com/schema/3.0/Templates/Defaultcontent/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class TemplateDefaultContent(BaseApi):
    """
    Manage the default content for a MailChimp template.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(TemplateDefaultContent, self).__init__(*args, **kwargs)
        self.endpoint = 'templates'
        self.template_id = None


    def all(self, template_id, **queryparams):
        """
        Get the sections that you can edit in a template, including each
        section’s default content.

        :param template_id: The unique id for the template.
        :type template_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.template_id = template_id
        return self._mc_client._get(url=self._build_path(template_id, 'default-content'), **queryparams)
