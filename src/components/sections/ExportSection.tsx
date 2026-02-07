import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const ExportSection = () => {
  const { t } = useLanguage();
  const { municipalities, getSegmentCounts } = useVoterData();

  const segments = getSegmentCounts();
  const allVoters = municipalities.flatMap((m) => m.wards.flatMap((w) => w.voters));

  const exportToCSV = () => {
    if (allVoters.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Municipality', 'Ward', 'Full Name', 'Age', 'Gender', 'Caste', 'Surname', 'Is Newar', 'Phone', 'Email'];
    const rows = allVoters.map((v) => [
    v.municipality,
    v.ward,
    v.fullName,
    v.age,
    v.gender,
    v.caste,
    v.surname,
    v.isNewar ? 'Yes' : 'No',
    v.phone || '',
    v.email || '']
    );

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voter_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const exportToExcel = () => {
    // For simplicity, we'll export as CSV with .xlsx extension
    // In a real app, you'd use a library like xlsx
    exportToCSV();
    toast.info('For full Excel support, consider using specialized libraries');
  };

  const exportSummaryPDF = () => {
    // Show data sensitivity warning
    const confirmed = window.confirm(
      '⚠️ Data Sensitivity Warning\n\n' +
      'This report contains voter data which may be sensitive.\n\n' +
      '• The report will be downloaded as an HTML file\n' +
      '• You can open it in your browser and print to PDF\n' +
      '• Please handle the exported data responsibly\n' +
      '• Delete the file when no longer needed\n\n' +
      'Do you want to proceed with the export?'
    );

    if (!confirmed) {
      toast.info('Export cancelled');
      return;
    }

    // Generate HTML content with escaped data to prevent XSS
    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Voter Analysis Report</title>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 1200px; margin: 0 auto; }
      h1 { color: #2d5a7b; border-bottom: 2px solid #2a9d8f; padding-bottom: 10px; }
      h2 { color: #2d5a7b; margin-top: 30px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background-color: #2d5a7b; color: white; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
      .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
      .stat-value { font-size: 2em; font-weight: bold; color: #2d5a7b; }
      .stat-label { color: #666; margin-top: 5px; }
      .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 10px; margin-bottom: 20px; }
      @media print { body { padding: 20px; } .warning { display: none; } }
    </style>
  </head>
  <body>
    <div class="warning">
      ⚠️ This document contains sensitive voter data. Handle responsibly and delete when no longer needed.
    </div>
    <h1>Voter Analysis Report</h1>
    <p>Generated on ${escapeHtml(new Date().toLocaleDateString())}</p>
    
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${segments.total.toLocaleString()}</div>
        <div class="stat-label">Total Voters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${municipalities.length}</div>
        <div class="stat-label">Municipalities</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${municipalities.reduce((acc, m) => acc + m.wards.length, 0)}</div>
        <div class="stat-label">Wards</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Object.keys(segments.byCaste).length}</div>
        <div class="stat-label">Unique Castes</div>
      </div>
    </div>

    <h2>Gender Distribution</h2>
    <table>
      <tr><th>Gender</th><th>Count</th><th>Percentage</th></tr>
      ${Object.entries(segments.byGender).map(([gender, count]) => `
        <tr>
          <td>${escapeHtml(gender.charAt(0).toUpperCase() + gender.slice(1))}</td>
          <td>${count.toLocaleString()}</td>
          <td>${segments.total > 0 ? (count / segments.total * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('')}
    </table>

    <h2>Age Distribution</h2>
    <table>
      <tr><th>Age Range</th><th>Count</th><th>Percentage</th></tr>
      ${Object.entries(segments.byAge).map(([range, count]) => `
        <tr>
          <td>${escapeHtml(range)}</td>
          <td>${count.toLocaleString()}</td>
          <td>${segments.total > 0 ? (count / segments.total * 100).toFixed(1) : 0}%</td>
        </tr>
      `).join('')}
    </table>

    <h2>Newar vs Non-Newar</h2>
    <table>
      <tr><th>Category</th><th>Count</th><th>Percentage</th></tr>
      <tr>
        <td>Newar</td>
        <td>${segments.newarVsNonNewar.newar.toLocaleString()}</td>
        <td>${segments.total > 0 ? (segments.newarVsNonNewar.newar / segments.total * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td>Non-Newar</td>
        <td>${segments.newarVsNonNewar.nonNewar.toLocaleString()}</td>
        <td>${segments.total > 0 ? (segments.newarVsNonNewar.nonNewar / segments.total * 100).toFixed(1) : 0}%</td>
      </tr>
    </table>

    <h2>Top 10 Castes</h2>
    <table>
      <tr><th>Rank</th><th>Caste</th><th>Count</th></tr>
      ${Object.entries(segments.byCaste).
    sort((a, b) => b[1] - a[1]).
    slice(0, 10).
    map(([caste, count], i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(caste || 'Unknown')}</td>
            <td>${count.toLocaleString()}</td>
          </tr>
        `).join('')}
    </table>

    <p style="margin-top: 40px; color: #666; font-size: 12px;">
      To save as PDF: Open this file in your browser and use Print (Ctrl+P / Cmd+P) → Save as PDF
    </p>
  </body>
</html>`;

    // Use Blob URL for download instead of window.open to avoid browser history traces
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voter_report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke URL to free memory
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success('Report downloaded - open in browser and print to save as PDF');
  };

  const exportOptions = [
  {
    id: 'csv',
    icon: FileSpreadsheet,
    title: t('export.asCSV'),
    description: 'Export all voter data as a CSV file',
    action: exportToCSV,
    color: 'bg-chart-2/10 text-chart-2'
  },
  {
    id: 'excel',
    icon: FileSpreadsheet,
    title: t('export.asExcel'),
    description: 'Export all voter data in Excel format',
    action: exportToExcel,
    color: 'bg-chart-3/10 text-chart-3'
  },
  {
    id: 'pdf',
    icon: FileText,
    title: t('export.asPDF'),
    description: 'Generate a summary report as PDF',
    action: exportSummaryPDF,
    color: 'bg-chart-5/10 text-chart-5'
  }];


  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="grid gap-4 sm:grid-cols-3">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.id}
              className="card-shadow border-border/50 cursor-pointer transition-all hover:shadow-medium hover:-translate-y-1"
              onClick={option.action}>

              <CardContent className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${option.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{option.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
              </CardContent>
            </Card>);

        })}
      </div>

      {/* Data Summary */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileDown className="h-4 w-4 text-accent" />
            Export Summary
          </CardTitle>
          <CardDescription>Overview of data available for export</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{segments.total.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Municipalities</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{municipalities.length}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Wards</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{municipalities.reduce((acc, m) => acc + m.wards.length, 0)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Edited Records</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{allVoters.filter((v) => v.isEdited).length}</p>
            </div>
          </div>

          {segments.total === 0 &&
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No data available for export. Upload CSV files first.</p>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};