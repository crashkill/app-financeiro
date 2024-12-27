import { LRUCache } from 'lru-cache';
import { FinancialData } from './storageService';

interface CacheOptions {
  max: number;
  ttl: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: LRUCache<string, any>;

  private constructor() {
    this.cache = new LRUCache<string, any>({
      max: 500, // Store up to 500 items
      ttl: 1000 * 60 * 5, // Items expire after 5 minutes
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  public set<T>(key: string, value: T): void {
    this.cache.set(key, value);
  }

  public clear(): void {
    this.cache.clear();
  }

  // Specific methods for financial data
  public getFilteredData(
    data: FinancialData[],
    project: string,
    period: string[]
  ): { [key: string]: FinancialData[] } | undefined {
    const cacheKey = `filtered_data_${project}_${period.join('_')}`;
    return this.get(cacheKey);
  }

  public setFilteredData(
    data: FinancialData[],
    project: string,
    period: string[],
    result: { [key: string]: FinancialData[] }
  ): void {
    const cacheKey = `filtered_data_${project}_${period.join('_')}`;
    this.set(cacheKey, result);
  }

  public getCalculations(data: FinancialData[], months: string[]): any | undefined {
    const cacheKey = `calculations_${data.map(d => d.id).join('_')}_${months.join('_')}`;
    return this.get(cacheKey);
  }

  public setCalculations(data: FinancialData[], months: string[], calculations: any): void {
    const cacheKey = `calculations_${data.map(d => d.id).join('_')}_${months.join('_')}`;
    this.set(cacheKey, calculations);
  }
}

export const cacheService = CacheService.getInstance();
