import { stringify } from 'csv-stringify';
import ExcelJS from 'exceljs';

/**
 * Export Service
 * Handles multi-format data export dynamically conforming to user's selected fields.
 */
export class ExportService {
  /**
   * Export records as CSV Stream / Buffer
   * @param {Array<Object>} records - Result records
   * @param {Array<{ key: string, label?: string }>} fields - Dynamic fields
   * @returns {Promise<Buffer>}
   */
  static async exportToCsv(records, fields) {
    const columns = fields.map(f => ({
      key: f.key,
      header: f.label || f.key
    }));

    return new Promise((resolve, reject) => {
      stringify(
        records,
        {
          header: true,
          columns: columns,
          bom: true, // UTF-8 BOM for Excel compatibility
          cast: {
            date: value => value.toISOString(),
            boolean: value => (value ? 'true' : 'false')
          }
        },
        (err, output) => {
          if (err) return reject(err);
          resolve(Buffer.from(output, 'utf-8'));
        }
      );
    });
  }

  /**
   * Export records as styled Excel (.xlsx) Buffer
   * @param {Array<Object>} records - Result records
   * @param {Array<{ key: string, label?: string }>} fields - Dynamic fields
   * @param {Object} [meta] - Optional sheet metadata
   * @returns {Promise<Buffer>}
   */
  static async exportToExcel(records, fields, meta = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LinkedIn Research & Data Collection Tool';
    workbook.lastModifiedBy = 'LinkedIn Research Tool';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Research Results', {
      views: [{ state: 'frozen', ySplit: 1 }] // Freeze header row
    });

    // Define columns
    worksheet.columns = fields.map(f => {
      const headerText = f.label || f.key;
      return {
        header: headerText,
        key: f.key,
        width: Math.max(headerText.length + 5, 20)
      };
    });

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0A66C2' } // LinkedIn Brand Blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.height = 28;

    // Add Data Rows
    records.forEach((record, index) => {
      const row = worksheet.addRow(record);
      row.font = { name: 'Segoe UI', size: 10 };
      row.height = 22;
      
      // Alternate row background for high readability
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' } // Light subtle slate
        };
      }

      // Add light borders
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    // Auto-fit column widths based on content
    worksheet.columns.forEach(column => {
      let maxLen = (column.header ? column.header.toString().length : 10) + 4;
      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber > 1) {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) {
            maxLen = Math.min(val.length + 3, 60); // Cap max column width
          }
        }
      });
      column.width = maxLen;
    });

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Export records as formatted JSON Buffer
   * @param {Array<Object>} records - Result records
   * @param {Object} [meta] - Metadata
   * @returns {Buffer}
   */
  static exportToJson(records, meta = {}) {
    const payload = {
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      ...meta,
      results: records
    };
    return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
  }
}
