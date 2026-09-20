import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ExportService } from '../../src/services/exportService.js';

describe('ExportService', () => {
  const mockRecords = [
    { name: 'Arjun Sharma', jobTitle: 'CTO', company: 'ZeptoFin Labs', location: 'Bengaluru' },
    { name: 'Priya Patel', jobTitle: 'VP Eng', company: 'RazorPay', location: 'Mumbai' }
  ];

  const mockFields = [
    { key: 'name', label: 'Full Name' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'company', label: 'Company' },
    { key: 'location', label: 'Location' }
  ];

  test('exports valid CSV buffer with correct headers', async () => {
    const csvBuffer = await ExportService.exportToCsv(mockRecords, mockFields);
    assert.ok(csvBuffer instanceof Buffer);
    const csvText = csvBuffer.toString('utf-8');
    assert.ok(csvText.includes('Full Name'));
    assert.ok(csvText.includes('Arjun Sharma'));
    assert.ok(csvText.includes('RazorPay'));
  });

  test('exports valid Excel (xlsx) binary buffer', async () => {
    const xlsxBuffer = await ExportService.exportToExcel(mockRecords, mockFields);
    assert.ok(xlsxBuffer instanceof Buffer || xlsxBuffer instanceof Uint8Array);
    assert.ok(xlsxBuffer.length > 100);
  });

  test('exports valid formatted JSON buffer', () => {
    const jsonBuffer = ExportService.exportToJson(mockRecords, { query: 'test query' });
    const parsed = JSON.parse(jsonBuffer.toString('utf-8'));
    assert.equal(parsed.recordCount, 2);
    assert.equal(parsed.results[0].name, 'Arjun Sharma');
  });
});
