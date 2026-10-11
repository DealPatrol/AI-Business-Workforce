import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { placesSearchEstimate } from '@/lib/prospector/constants';
import { dedupePlaces, parsePlacesResponse, queriesFromTargets } from '@/lib/prospector/places';
import { assertPublicUrl, isPrivateIp } from '@/lib/prospector/safe-fetch';
import { PublicFetchError } from '@/lib/prospector/errors';

describe('Google Places parsing', () => {
  it('reads Places API (New) fields and dedupes by place id', () => {
    const parsed = parsePlacesResponse({
      nextPageToken: 'next-1',
      places: [
        {
          id: 'place-1',
          displayName: { text: 'Oak Lawn Funeral Home' },
          formattedAddress: '1 Main St, Austin, TX',
          nationalPhoneNumber: '(512) 555-0100',
          websiteUri: 'https://oaklawnfuneral.com',
          rating: 4.7,
          userRatingCount: 88,
          googleMapsUri: 'https://maps.google.com/?cid=1',
          types: ['funeral_home', 'point_of_interest'],
          primaryTypeDisplayName: { text: 'Funeral home' },
        },
        {
          name: 'places/place-1',
          displayName: { text: 'Duplicate' },
        },
        {
          id: 'place-2',
          displayName: { text: 'No Site Monuments' },
          types: ['monument_maker'],
        },
      ],
    });
    assert.equal(parsed.nextPageToken, 'next-1');
    assert.equal(parsed.places.length, 3);
    assert.equal(parsed.places[0]?.category, 'Funeral home');
    assert.equal(parsed.places[0]?.website, 'https://oaklawnfuneral.com');
    assert.equal(parsed.places[1]?.placeId, 'place-1');
    assert.equal(parsed.places[2]?.website, null);
    assert.equal(parsed.places[2]?.category, 'monument maker');

    const unique = dedupePlaces(parsed.places);
    assert.deepEqual(unique.map((place) => place.placeId), ['place-1', 'place-2']);
  });

  it('caps selected search queries and estimates a modest request count', () => {
    const queries = queriesFromTargets([
      { selected: true, queries: ['funeral home', 'Funeral Home', 'cremation service'] },
      { selected: false, queries: ['ignore me'] },
      { selected: true, queries: ['monument company', 'pet boutique', 'florist', 'jeweler'] },
    ]);
    assert.equal(queries[0], 'funeral home');
    assert.equal(queries.filter((query) => query.toLowerCase() === 'funeral home').length, 1);
    assert.equal(queries.includes('ignore me'), false);
    assert.equal(queries.length <= 6, true);
    const estimate = placesSearchEstimate(queries.length);
    assert.equal(estimate.maxRequests, queries.length * 2);
    assert.equal(estimate.pageSize, 10);
  });
});

describe('public website fetch guard', () => {
  it('blocks private and local hosts before a request', () => {
    assert.equal(isPrivateIp('127.0.0.1'), true);
    assert.equal(isPrivateIp('10.1.2.3'), true);
    assert.equal(isPrivateIp('192.168.1.9'), true);
    assert.equal(isPrivateIp('169.254.169.254'), true);
    assert.equal(isPrivateIp('8.8.8.8'), false);
    assert.equal(isPrivateIp('::1'), true);

    assert.throws(() => assertPublicUrl('http://127.0.0.1/latest'), PublicFetchError);
    assert.throws(() => assertPublicUrl('http://localhost/admin'), PublicFetchError);
    assert.throws(() => assertPublicUrl('file:///etc/passwd'), PublicFetchError);
    const allowed = assertPublicUrl('https://oaklawnfuneral.com/contact');
    assert.equal(allowed.hostname, 'oaklawnfuneral.com');
  });
});
