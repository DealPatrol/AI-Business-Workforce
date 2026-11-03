import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SMS_OPT_OUT,
  formatAvaLeadSmsBody,
  formatSalesQualifySmsBody,
  smsSegmentInfo,
  toGsm7,
} from '@/lib/ava/sms-format';

const typical = {
  caller_name: 'Dana Whitfield',
  caller_phone: '+12565550142',
  service_job_type: 'No heat',
  business_name: 'Porchlight Heating & Air',
};

describe('owner lead-alert SMS', () => {
  it('is GSM-7, one segment, and carries the opt-out for a typical lead', () => {
    const body = formatAvaLeadSmsBody(typical);
    const info = smsSegmentInfo(body);
    assert.equal(info.encoding, 'GSM-7');
    assert.equal(info.segments, 1);
    assert.ok(info.length <= 160, `${info.length} septets`);
    assert.ok(body.endsWith(SMS_OPT_OUT));
    assert.ok(body.startsWith('Executive Receptionist: New lead for Porchlight Heating & Air.'));
    assert.ok(body.includes('Dana Whitfield'));
    assert.ok(body.includes('+12565550142'));
  });

  it('replaces em dashes, curly quotes, and emoji', () => {
    const body = formatAvaLeadSmsBody({
      caller_name: 'Dana \u201CD\u201D Whitfield \uD83D\uDE00',
      caller_phone: '+12565550142',
      service_job_type: 'No heat \u2014 furnace won\u2019t start \u2026',
      business_name: 'Porchlight Heating & Air',
    });
    assert.equal(smsSegmentInfo(body).encoding, 'GSM-7');
    assert.ok(!/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/.test(body));
    assert.ok(!/\uD83D/.test(body));
    assert.ok(body.includes("won't start"));
  });

  it('truncates long fields and keeps the opt-out and one segment', () => {
    const body = formatAvaLeadSmsBody({
      caller_name: 'Bartholomew Featherstonehaugh-Montgomery the Third',
      caller_phone: '+12565550142',
      service_job_type:
        'Furnace will not ignite, strange clicking noise, and a smell of burning dust from the vents upstairs and downstairs',
      business_name: 'Porchlight Heating & Air Conditioning and Plumbing of North Alabama LLC',
    });
    const info = smsSegmentInfo(body);
    assert.equal(info.encoding, 'GSM-7');
    assert.equal(info.segments, 1);
    assert.ok(body.endsWith(SMS_OPT_OUT));
  });

  it('still has the opt-out when the caller gave no details', () => {
    const body = formatAvaLeadSmsBody({});
    assert.ok(body.endsWith(SMS_OPT_OUT));
    assert.equal(smsSegmentInfo(body).segments, 1);
  });

  it('counts UCS-2 and GSM-7 segments', () => {
    assert.deepEqual(smsSegmentInfo('a'.repeat(160)), { encoding: 'GSM-7', length: 160, segments: 1 });
    assert.equal(smsSegmentInfo('a'.repeat(161)).segments, 2);
    assert.equal(smsSegmentInfo('{'.repeat(81)).length, 162); // extension chars cost 2
    assert.equal(smsSegmentInfo('a\u2014b').encoding, 'UCS-2');
    assert.equal(smsSegmentInfo('a'.repeat(70) + '\u2014').segments, 2);
  });

  it('folds accents GSM-7 lacks and keeps ones it has', () => {
    assert.equal(toGsm7('Jos\u00E9 \u00C1lvarez'), 'Jos\u00E9 Alvarez');
  });

  it('sales-qualify alert is GSM-7 too', () => {
    const body = formatSalesQualifySmsBody('Acme \u2014 Heating');
    assert.equal(smsSegmentInfo(body).encoding, 'GSM-7');
  });
});
