export interface FinancialData {
  id: string;
  visao: string;
  item: string;
  months: {
    [key: string]: {
      mensal: number;
      acumulado: number;
    };
  };
}

const FINANCIAL_DATA_KEY = 'financial_data';
const UPLOAD_HISTORY_KEY = 'upload_history';

interface UploadHistory {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'success' | 'error';
  message?: string;
}

export const storageService = {
  saveFinancialData: (data: FinancialData[]) => {
    localStorage.setItem(FINANCIAL_DATA_KEY, JSON.stringify(data));
  },

  getFinancialData: (): FinancialData[] => {
    const data = localStorage.getItem(FINANCIAL_DATA_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUploadHistory: (history: UploadHistory) => {
    const currentHistory = storageService.getUploadHistory();
    const updatedHistory = [history, ...currentHistory].slice(0, 10); // Keep only last 10 uploads
    localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updatedHistory));
  },

  getUploadHistory: (): UploadHistory[] => {
    const history = localStorage.getItem(UPLOAD_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  },

  clearFinancialData: () => {
    localStorage.removeItem(FINANCIAL_DATA_KEY);
  }
};
