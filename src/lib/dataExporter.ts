import ExcelJS from 'exceljs';
import { VoterRecord, MunicipalityData } from '@/contexts/VoterDataContext';
import { ParsedRecord } from './fileParser';

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json';
  includeAllColumns?: boolean;
  fileName?: string;
}

// Convert VoterRecord to exportable format
const voterToExportRow = (voter: VoterRecord, index: number) => ({
  'सि.नं.': index + 1,
  'SN': index + 1,
  'मतदाता नं': voter.id,
  'Voter ID': voter.id,
  'मतदाताको नाम': voter.fullName,
  'Voter Name': voter.fullName,
  'उमेर(वर्ष)': voter.age,
  'Age': voter.age,
  'लिङ्ग': voter.gender === 'male' ? 'पुरुष' : voter.gender === 'female' ? 'महिला' : 'अन्य',
  'Gender': voter.gender,
  'थर': voter.surname || '',
  'Surname': voter.surname || '',
  'जात': voter.caste || '',
  'Caste': voter.caste || '',
  'पति/पत्नीको नाम': voter.originalData?.['पति/पत्नीको नाम'] || '',
  'Spouse': voter.originalData?.['Spouse'] || voter.originalData?.['पति/पत्नीको नाम'] || '',
  'पिता/माताको नाम': voter.originalData?.['पिता/माताको नाम'] || '',
  'Parents': voter.originalData?.['Parents'] || voter.originalData?.['पिता/माताको नाम'] || '',
  'स्थिति': voter.voterStatus || 'available',
  'Status': voter.voterStatus || 'available',
});

// Convert ParsedRecord to exportable format
const parsedRecordToExportRow = (record: ParsedRecord, index: number) => ({
  'सि.नं.': index + 1,
  'SN': index + 1,
  'मतदाता नं': record.voterId,
  'Voter ID': record.voterId,
  'मतदाताको नाम': record.voterName,
  'Voter Name': record.voterName,
  'उमेर(वर्ष)': record.age,
  'Age': record.age,
  'लिङ्ग': record.gender === 'male' ? 'पुरुष' : record.gender === 'female' ? 'महिला' : 'अन्य',
  'Gender': record.gender,
  'थर': record.surname || '',
  'Surname': record.surname || '',
  'जात': record.caste || '',
  'Caste': record.caste || '',
  'पति/पत्नीको नाम': record.spouse || '',
  'Spouse': record.spouse || '',
  'पिता/माताको नाम': record.parents || '',
  'Parents': record.parents || '',
  'स्थिति': record.status || '',
  'Status': record.status || '',
  ...record.originalData,
});

export const exportToExcel = async (
  data: VoterRecord[] | ParsedRecord[],
  fileName: string = 'voter_data'
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Voter Data');

  // Determine if data is VoterRecord or ParsedRecord
  const isVoterRecord = data.length > 0 && 'fullName' in data[0];
  
  const rows = data.map((record, idx) => 
    isVoterRecord 
      ? voterToExportRow(record as VoterRecord, idx)
      : parsedRecordToExportRow(record as ParsedRecord, idx)
  );

  if (rows.length === 0) return;

  // Add headers
  const headers = Object.keys(rows[0]);
  worksheet.addRow(headers);

  // Style headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  rows.forEach(row => {
    worksheet.addRow(Object.values(row));
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, cell => {
      const cellLength = cell.value ? String(cell.value).length : 0;
      maxLength = Math.max(maxLength, cellLength);
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (
  data: VoterRecord[] | ParsedRecord[],
  fileName: string = 'voter_data'
): void => {
  const isVoterRecord = data.length > 0 && 'fullName' in data[0];
  
  const rows = data.map((record, idx) => 
    isVoterRecord 
      ? voterToExportRow(record as VoterRecord, idx)
      : parsedRecordToExportRow(record as ParsedRecord, idx)
  );

  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      Object.values(row).map(val => 
        `"${String(val).replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (
  data: VoterRecord[] | ParsedRecord[],
  fileName: string = 'voter_data'
): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export municipality data for backup
export const exportMunicipalityBackup = async (
  municipalities: MunicipalityData[],
  fileName: string = 'voter_data_backup'
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  for (const municipality of municipalities) {
    for (const ward of municipality.wards) {
      const sheetName = `${municipality.name}-W${ward.name}`.slice(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      const rows = ward.voters.map((voter, idx) => voterToExportRow(voter, idx));
      
      if (rows.length === 0) continue;

      const headers = Object.keys(rows[0]);
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      rows.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, cell => {
          const cellLength = cell.value ? String(cell.value).length : 0;
          maxLength = Math.max(maxLength, cellLength);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
