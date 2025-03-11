
/**
 * Utility functions for exporting data from the application
 */

/**
 * Convert an array of objects to CSV and trigger download
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download
 */
export const downloadCSV = (data: Record<string, any>[], filename: string) => {
  if (!data || !data.length) {
    throw new Error('No data provided for CSV export');
  }

  // Extract headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        // Wrap values in quotes and escape existing quotes
        let value = row[header] === null || row[header] === undefined ? '' : row[header];
        value = String(value).replace(/"/g, '""');
        
        // If value contains commas, quotes, or newlines, wrap in quotes
        const shouldQuote = /[",\n\r]/.test(value);
        return shouldQuote ? `"${value}"` : value;
      }).join(',')
    )
  ];
  
  // Join rows with newlines
  const csvContent = csvRows.join('\n');
  
  // Create a blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add link to document
  document.body.appendChild(link);
  
  // Click the link to trigger download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data as JSON file
 * @param data Data to export
 * @param filename Name of the file to download
 */
export const downloadJSON = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format and export data for Excel/Google Sheets
 * @param data Data to export
 * @param sheetName Name of the sheet
 * @param filename Name of the file to download
 */
export const prepareExcelData = (data: Record<string, any>[], sheetName: string = 'Sheet1'): Record<string, any[]> => {
  // Convert data to format expected by xlsx library
  if (!data || !data.length) {
    return { [sheetName]: [] };
  }

  const headers = Object.keys(data[0]);
  
  const rows = [
    headers,
    ...data.map(row => headers.map(header => row[header]))
  ];
  
  return { [sheetName]: rows };
};
