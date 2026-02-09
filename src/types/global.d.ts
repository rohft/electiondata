interface EzsiteApis {
  getUserInfo(): Promise<{data: any;error: any;}>;
  logout(): Promise<void>;
  getDataByPage(options: any): Promise<{data: any;error: any;}>;
  updateRow(options: any): Promise<{data: any;error: any;}>;
  deleteRow(options: any): Promise<{data: any;error: any;}>;
  addRow(options: any): Promise<{data: any;error: any;}>;
  [key: string]: any;
}

interface Window {
  ezsite: {
    apis: EzsiteApis;
    [key: string]: any;
  };
}