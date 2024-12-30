import { LRUCache } from 'lru-cache';
import { FinancialData } from './storageService';

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
    project: string,
    period: string[]
  ): { [key: string]: FinancialData[] } | undefined {
    const cacheKey = `filtered_data_${project}_${period.join('_')}`;
    return this.get(cacheKey);
  }

  public setFilteredData(
    project: string,
    period: string[],
    data: { [key: string]: FinancialData[] }
  ): void {
    const cacheKey = `filtered_data_${project}_${period.join('_')}`;
    this.set(cacheKey, data);
  }

  public getCalculations(key: string): any {
    return this.get(`calculations_${key}`);
  }

  public setCalculations(key: string, value: any): void {
    this.set(`calculations_${key}`, value);
  }
}

export const cacheService = CacheService.getInstance();
