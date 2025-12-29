import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * 필터 아이템
 */
interface FilterItem {
  name: string;
}

/**
 * 브랜드 목록 조회 응답
 */
interface GetBrandsResponse {
  status: string;
  message: string;
  content: {
    brands: FilterItem[];
  };
}

/**
 * 타임라인 목록 조회 응답
 */
interface GetTimelinesResponse {
  status: string;
  message: string;
  content: {
    timelines: FilterItem[];
  };
}

/**
 * 카테고리 목록 조회 응답
 */
interface GetCategoriesResponse {
  status: string;
  message: string;
  content: {
    categories: FilterItem[];
  };
}

/**
 * Archive API
 */
class ArchiveAPI {
  /**
   * 브랜드 목록 조회
   */
  async getBrands(): Promise<string[]> {
    const response = await axios.get<GetBrandsResponse>(`${API_BASE_URL}/api/v1/archive/filtering`, {
      params: { name: 'brand' },
    });
    return response.data.content.brands.map((item) => item.name);
  }

  /**
   * 타임라인 목록 조회
   */
  async getTimelines(): Promise<string[]> {
    const response = await axios.get<GetTimelinesResponse>(`${API_BASE_URL}/api/v1/archive/filtering`, {
      params: { name: 'timeline' },
    });
    return response.data.content.timelines.map((item) => item.name);
  }

  /**
   * 카테고리 목록 조회
   */
  async getCategories(): Promise<string[]> {
    const response = await axios.get<GetCategoriesResponse>(`${API_BASE_URL}/api/v1/archive/filtering`, {
      params: { name: 'category' },
    });
    return response.data.content.categories.map((item) => item.name);
  }

  /**
   * 통합 필터링 조회 (브랜드/타임라인/카테고리)
   */
  async getFiltering(type: 'brand' | 'timeline' | 'category'): Promise<string[]> {
    switch (type) {
      case 'brand':
        return this.getBrands();
      case 'timeline':
        return this.getTimelines();
      case 'category':
        return this.getCategories();
      default:
        throw new Error(`Unknown filtering type: ${type}`);
    }
  }
}

export const archiveAPI = new ArchiveAPI();

