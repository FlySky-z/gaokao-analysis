/**
 * 分数排名转换工具
 * 基于真实高考一分一段数据进行分数与排名的双向转换
 */

// 高考数据接口
interface GaokaoData {
  score: string;
  num: number;
  accumulate: number;
}

// 处理后的图表数据接口
interface ProcessedData {
  score: string;
  num: number;
  accumulate: number;
  scoreNum: number; // 用于排序的数字分数
}

// 分数排名转换器类
export class ScoreRankConverter {
  private dataCache: Map<string, ProcessedData[]> = new Map();
  private loadingCache: Map<string, Promise<ProcessedData[]>> = new Map(); // 防止重复请求
  private readonly apiBase = '/api/gaokao/data';

  /**
   * 获取高考数据
   * @param province 省份代码
   * @param subject 科目类型
   */
  private async fetchGaokaoData(province: string, subject: string): Promise<ProcessedData[]> {
    const cacheKey = `${province}-${subject}`;
    
    // 检查缓存
    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey)!;
    }

    // 检查是否已有相同请求在进行中
    if (this.loadingCache.has(cacheKey)) {
      return this.loadingCache.get(cacheKey)!;
    }

    // 创建请求Promise并缓存
    const loadingPromise = this._fetchData(province, subject, cacheKey);
    this.loadingCache.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      // 请求完成后清除loading缓存
      this.loadingCache.delete(cacheKey);
      return result;
    } catch (error) {
      // 请求失败也要清除loading缓存
      this.loadingCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * 实际的数据获取逻辑
   */
  private async _fetchData(province: string, subject: string, cacheKey: string): Promise<ProcessedData[]> {
    try {
      const response = await fetch(`${this.apiBase}?province=${province}&subject=${subject}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (jsonData.error) {
        throw new Error(jsonData.error);
      }

      // 处理数据，转换分数为数字用于排序和筛选
      const processedData: ProcessedData[] = jsonData.data.map((item: GaokaoData) => {
        let scoreNum = 0;
        if (item.score === "695-750") {
          scoreNum = 722.5; // 取中位数
        } else {
          scoreNum = parseInt(item.score);
        }

        return {
          ...item,
          scoreNum
        };
      }).reverse(); // 反转数组，让分数从低到高排列

      // 缓存数据
      this.dataCache.set(cacheKey, processedData);
      
      return processedData;
    } catch (error) {
      console.error('获取高考数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据分数计算排名
   * @param score 分数
   * @param province 省份代码，默认 hubei
   * @param subject 科目类型，默认 physics
   * @returns 排名（位次）
   */
  async scoreToRank(score: number, province: string = 'hubei', subject: string = 'physics'): Promise<number> {
    try {
      const data = await this.fetchGaokaoData(province, subject);
      
      // 查找最接近的分数对应的排名
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.scoreNum >= score) {
          return item.accumulate;
        }
      }
      
      // 如果分数超过最高分，返回1
      if (score > data[data.length - 1]?.scoreNum) {
        return 1;
      }
      
      // 如果分数低于最低分，返回最后一名
      return data[data.length - 1]?.accumulate || 50000;
    } catch (error) {
      console.error('分数转排名失败:', error);
      // 返回模拟排名作为降级方案
      return Math.max(1, Math.floor((750 - score) * 100));
    }
  }

  /**
   * 根据排名计算分数
   * @param rank 排名（位次）
   * @param province 省份代码，默认 hubei
   * @param subject 科目类型，默认 physics
   * @returns 分数
   */
  async rankToScore(rank: number, province: string = 'hubei', subject: string = 'physics'): Promise<number> {
    try {
      const data = await this.fetchGaokaoData(province, subject);
      
      // 查找最接近的排名对应的分数
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.accumulate <= rank) {
          return item.scoreNum;
        }
      }
      
      // 如果排名太靠前，返回最高分
      if (rank < data[0]?.accumulate) {
        return data[data.length - 1]?.scoreNum || 750;
      }
      
      // 如果排名太靠后，返回最低分
      return data[0]?.scoreNum || 200;
    } catch (error) {
      console.error('排名转分数失败:', error);
      // 返回模拟分数作为降级方案
      return Math.max(200, 750 - Math.floor(rank / 100));
    }
  }

  /**
   * 获取分数范围内的详细数据
   * @param minScore 最低分数
   * @param maxScore 最高分数
   * @param province 省份代码
   * @param subject 科目类型
   */
  async getScoreRangeData(
    minScore: number, 
    maxScore: number, 
    province: string = 'hubei', 
    subject: string = 'physics'
  ): Promise<ProcessedData[]> {
    try {
      const data = await this.fetchGaokaoData(province, subject);
      return data.filter(item => item.scoreNum >= minScore && item.scoreNum <= maxScore);
    } catch (error) {
      console.error('获取分数范围数据失败:', error);
      return [];
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.dataCache.clear();
  }

  /**
   * 检查是否支持指定省份和科目
   * @param province 省份代码
   * @param subject 科目类型
   */
  async isSupported(province: string, subject: string): Promise<boolean> {
    try {
      await this.fetchGaokaoData(province, subject);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取支持的省份列表
   */
  getSupportedProvinces(): { code: string; name: string }[] {
    return [
      { code: "hubei", name: "湖北" },
      // 可以根据实际支持的省份扩展
    ];
  }

  /**
   * 获取支持的科目列表
   */
  getSupportedSubjects(): { code: string; name: string }[] {
    return [
      { code: "physics", name: "首选物理" },
      { code: "history", name: "首选历史" },
    ];
  }
}

// 创建全局实例
export const scoreRankConverter = new ScoreRankConverter();

// 便捷函数
export const convertScoreToRank = (score: number, province?: string, subject?: string) => {
  return scoreRankConverter.scoreToRank(score, province, subject);
};

export const convertRankToScore = (rank: number, province?: string, subject?: string) => {
  return scoreRankConverter.rankToScore(rank, province, subject);
};
