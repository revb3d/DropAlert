/**
 * Amazon product data via Rainforest API
 * Docs: https://www.rainforestapi.com/docs
 */

const axios = require('axios');
const logger = require('../config/logger');

const BASE_URL = 'https://api.rainforestapi.com/request';

function apiKey() {
  const key = process.env.RAINFOREST_API_KEY;
  if (!key) throw new Error('RAINFOREST_API_KEY not configured in .env');
  return key;
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchProducts(keyword, { itemCount = 10, page = 1 } = {}) {
  let resp;
  try {
    resp = await axios.get(BASE_URL, {
      params: {
        api_key: apiKey(),
        type: 'search',
        amazon_domain: 'amazon.com',
        search_term: keyword,
        page,
      },
      timeout: 15_000,
    });
  } catch (err) {
    const msg = err.response?.data?.request_info?.message || err.message;
    logger.error(`Rainforest search failed: ${msg}`);
    throw new Error(`Amazon search failed: ${msg}`);
  }

  const results = resp.data.search_results || [];
  return results.slice(0, itemCount).map(normalizeSearchResult);
}

// ─── Lookup by ASIN ───────────────────────────────────────────────────────────

async function getItemsByASIN(asins) {
  if (!asins || asins.length === 0) return [];

  const results = await Promise.all(
    asins.map(async (asin) => {
      try {
        const resp = await axios.get(BASE_URL, {
          params: {
            api_key: apiKey(),
            type: 'product',
            amazon_domain: 'amazon.com',
            asin,
          },
          timeout: 15_000,
        });
        return normalizeProduct(resp.data.product, asin);
      } catch (err) {
        const msg = err.response?.data?.request_info?.message || err.message;
        logger.error(`Rainforest product lookup failed for ${asin}: ${msg}`);
        return null;
      }
    })
  );

  return results.filter(Boolean);
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function parsePrice(priceObj) {
  if (!priceObj) return null;
  if (typeof priceObj.value === 'number') return priceObj.value;
  // Fall back to parsing the raw string e.g. "$12.99"
  if (typeof priceObj.raw === 'string') {
    const n = parseFloat(priceObj.raw.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  }
  return null;
}

function normalizeSearchResult(item) {
  const price =
    parsePrice(item.price) ??
    parsePrice(item.prices?.[0]) ??
    parsePrice(item.buybox_winner?.price) ??
    null;
  const currency = item.price?.currency ?? item.prices?.[0]?.currency ?? 'USD';
  return {
    asin: item.asin,
    title: item.title || 'Unknown',
    brand: item.brand || null,
    image_url: item.image || item.thumbnail || null,
    product_url: item.link || `https://www.amazon.com/dp/${item.asin}`,
    current_price: price,
    currency,
    availability: item.availability?.raw || null,
  };
}

function normalizeProduct(product, asin) {
  if (!product) return null;
  const winner = product.buybox_winner;
  const price =
    parsePrice(winner?.price) ??
    parsePrice(product.price) ??
    parsePrice(product.prices?.[0]) ??
    null;
  const currency = winner?.price?.currency ?? product.price?.currency ?? 'USD';
  return {
    asin: product.asin || asin,
    title: product.title || 'Unknown',
    brand: product.brand || null,
    image_url: product.main_image?.link || null,
    product_url: product.link || `https://www.amazon.com/dp/${asin}`,
    current_price: price,
    currency,
    availability: winner?.availability?.raw || null,
  };
}

module.exports = { getItemsByASIN, searchProducts };
