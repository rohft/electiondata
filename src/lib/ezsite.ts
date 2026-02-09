// Helper to access window.ezsite APIs with proper typing
const w = window as any;

export const ezsite = {
  get apis() {
    return w.ezsite?.apis ?? {};
  }
};