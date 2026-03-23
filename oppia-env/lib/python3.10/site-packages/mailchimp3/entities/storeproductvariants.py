# coding=utf-8
"""
The E-commerce Store Product Variants API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/products/variants/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Products/Variants/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class StoreProductVariants(BaseApi):
    """
    A Product Variant represents a specific item for purchase, and is
    contained within a parent Product. At least one Product Variant is
    required for each Product.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(StoreProductVariants, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.product_id = None
        self.variant_id = None


    def create(self, store_id, product_id, data):
        """
        Add a new variant to the product.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "title": string*
        }
        """
        self.store_id = store_id
        self.product_id = product_id
        if 'id' not in data:
            raise KeyError('The product variant must have an id')
        if 'title' not in data:
            raise KeyError('The product variant must have a title')
        response = self._mc_client._post(url=self._build_path(store_id, 'products', product_id, 'variants'), data=data)
        if response is not None:
            self.variant_id = response['id']
        else:
            self.variant_id = None
        return response


    def all(self, store_id, product_id, get_all=False, **queryparams):
        """
        Get information about a product’s variants.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id = store_id
        self.product_id = product_id
        self.variant_id = None
        if get_all:
            return self._iterate(url=self._build_path(store_id, 'products', product_id, 'variants'), **queryparams)
        else:
            return self._mc_client._get(
                url=self._build_path(store_id, 'products', product_id, 'variants'),
                **queryparams
            )


    def get(self, store_id, product_id, variant_id, **queryparams):
        """
        Get information about a specific product variant.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param variant_id: The id for the product variant.
        :type variant_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        self.product_id = product_id
        self.variant_id = variant_id
        return self._mc_client._get(
            url=self._build_path(store_id, 'products', product_id, 'variants', variant_id),
            **queryparams
        )


    def update(self, store_id, product_id, variant_id, data):
        """
        Update a product variant.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param variant_id: The id for the product variant.
        :type variant_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        self.product_id = product_id
        self.variant_id = variant_id
        return self._mc_client._patch(
            url=self._build_path(store_id, 'products', product_id, 'variants', variant_id),
            data=data
        )


    def create_or_update(self, store_id, product_id, variant_id, data):
        """
        Add or update a product variant.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param variant_id: The id for the product variant.
        :type variant_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "title": string*
        }
        """
        self.store_id = store_id
        self.product_id = product_id
        self.variant_id = variant_id
        if 'id' not in data:
             raise KeyError('The product variant must have an id')
        if 'title' not in data:
            raise KeyError('The product variant must have a title')
        return self._mc_client._put(
            url=self._build_path(store_id, 'products', product_id, 'variants', variant_id),
            data=data
        )


    def delete(self, store_id, product_id, variant_id):
        """
        Delete a product variant.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param product_id: The id for the product of a store.
        :type product_id: :py:class:`str`
        :param variant_id: The id for the product variant.
        :type variant_id: :py:class:`str`
        """
        self.store_id = store_id
        self.product_id = product_id
        self.variant_id = variant_id
        return self._mc_client._delete(url=self._build_path(store_id, 'products', product_id, 'variants', variant_id))
