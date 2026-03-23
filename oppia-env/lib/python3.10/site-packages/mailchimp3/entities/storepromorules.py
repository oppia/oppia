# coding=utf-8
"""
The E-commerce Stores Promo Rules API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/promo-rules
"""
from __future__ import unicode_literals
from mailchimp3.baseapi import BaseApi

class StorePromoRules(BaseApi):
    """
    Promo Rules help you create promo codes for your campaigns. Promo Rules define generic information about promo
    codes like expiration time, start time, amount of discount being offered etc
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the Endpoint
        :param args:
        :param kwargs:
        """
        super(StorePromoRules, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None

    def create(self, store_id, data):
        """
        Add new promo rule to a store

        :param store_id: The store id
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict'
        data = {
            "id": string*,
            "title": string,
            "description": string*,
            "starts_at": string,
            "ends_at": string,
            "amount": number*,
            "type": string*,
            "target": string*,
            "enabled": boolean,
            "created_at_foreign": string,
            "updated_at_foreign": string,
        }
        """
        self.store_id = store_id
        if 'id' not in data:
            raise KeyError('The promo rule must have an id')
        if 'description' not in data:
            raise KeyError('This promo rule must have a description')
        if 'amount' not in data:
            raise KeyError('This promo rule must have an amount')
        if 'target' not in data:
            raise KeyError('This promo rule must apply to a target (example per_item, total, or shipping')
        response = self._mc_client._post(url=self._build_path(store_id, 'promo-rules'), data=data)

        if response is not None:
            return response

    def all(self, store_id, get_all=False, **queryparams):
        """
        Get information about a store’s promo rules.

        :param store_id: The store's id
        :type store_id: `str`
        :param get_all:
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id = store_id
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'promo-rules'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(store_id, 'promo-rules'), **queryparams)

    def get(self, store_id, promo_rule_id, **queryparams):
        """
                Get information about a specific promo rule.

                :param store_id: The store's id
                :type store_id: `string`
                :param queryparams: The query string parameters
                queryparams['fields'] = []
                queryparams['exclude_fields'] = []
                queryparams['count'] = integer
                queryparams['offset'] = integer
                """
        self.store_id = store_id
        self.promo_rule_id = promo_rule_id
        return self._mc_client._get(url=self._build_path(store_id, 'promo-rules', promo_rule_id), **queryparams)


    def update(self, store_id, promo_rule_id, data):
        """
        Update a promo rule

        :param store_id: The store id
        :type :py:class:`str`
        :param promo_rule_id: The id for the promo rule of a store.
        :type :py:class:`str`
        :param data:
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string,
            "title": string,
            "description": string,
            "starts_at": string,
            "ends_at": string,
            "amount": number,
            "type": string,
            "target": string,
            "enabled": boolean,
            "created_at_foreign": string,
            "updated_at_foreign": string,
        }
        """
        self.store_id = store_id
        self.promo_rule_id = promo_rule_id
        return self._mc_client._patch(url=self._build_path(store_id, 'promo-rules', promo_rule_id), data=data)

    def delete(self, store_id, promo_rule_id):
        """
        Delete a promo rule
        :param store_id: The store id
        :type :py:class:`str`
        :param promo_rule_id: The id for the promo rule of a store.
        :type :py:class:`str`
        """
        self.store_id=store_id
        self.promo_rule_id=promo_rule_id
        return self._mc_client._delete(url=self._build_path(store_id, 'promo-rules', promo_rule_id))