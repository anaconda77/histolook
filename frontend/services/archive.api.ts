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
 * 아카이브 아이템
 */
export interface ArchiveItem {
  archiveId: string;
  imageUrls: string[];
  isInterest: boolean;
  authorId: string;
}

/**
 * 아카이브 리스트 응답
 */
export interface GetArchivesResponse {
  brand?: string;
  timeline?: string;
  category?: string;
  page: number;
  hasNext: boolean;
  archives: ArchiveItem[];
}

/**
 * 관심 아카이브 아이템
 */
export interface InterestArchiveItem {
  archiveId: string;
  imageUrls: string[];
}

/**
 * 관심 아카이브 리스트 응답
 */
export interface GetInterestArchivesResponse {
  page: number;
  hasNext: boolean;
  archives: InterestArchiveItem[];
}

/**
 * 내 아카이브 아이템
 */
export interface MyArchiveItem {
  archiveId: string;
  imageUrls: string[];
  brand: string;
  timeline: string;
  category: string;
  story: string;
  publishedAt: string;
}

/**
 * 내 아카이브 리스트 응답
 */
export interface GetMyArchivesResponse {
  page: number;
  hasNext: boolean;
  archives: MyArchiveItem[];
}

interface GetArchivesApiResponse {
  status: string;
  message: string;
  content: GetArchivesResponse;
}

/**
 * 아카이브 상세 응답
 */
export interface ArchiveDetail {
  archiveId: string;
  brand: string;
  timeline: string;
  category: string;
  imageUrls: string[];
  averagePrice?: number;
  story: string;
  authorId: string;
  authorImageUrl?: string;
  authorNickname: string;
  isJudged: boolean;
  isInterest?: boolean; // 관심 아카이브 여부
  myJudgement?: {
    isArchive: boolean;
    price?: number;
    comment?: string;
  };
  comments?: {
    archivedOne: string;
    deArchivedOne: string;
  };
  publishedAt: string;
}

interface GetArchiveDetailResponse {
  status: string;
  message: string;
  content: ArchiveDetail;
}

/**
 * 아카이브 코멘트 응답
 */
export interface ArchiveComment {
  judgementId: string;
  isArchive: boolean;
  comment?: string;
  memberId: string;
  memberNickname: string;
  memberImageUrl?: string;
  createdAt: string;
}

interface GetArchiveCommentsResponse {
  status: string;
  message: string;
  content: {
    comments: ArchiveComment[];
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

  /**
   * 홈화면 아카이브 리스트 조회
   */
  async getArchives(params: {
    page?: number;
    brand?: string;
    timeline?: string;
    category?: string;
  }, accessToken?: string): Promise<GetArchivesResponse> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await axios.get<GetArchivesApiResponse>(
      `${API_BASE_URL}/api/v1/archive`,
      {
        headers,
        params: {
          page: params.page || 1,
          ...(params.brand && { brand: params.brand }),
          ...(params.timeline && { timeline: params.timeline }),
          ...(params.category && { category: params.category }),
        },
      }
    );
    return response.data.content;
  }

  /**
   * 아카이브 상세 조회
   */
  async getArchiveDetail(archiveId: string, accessToken?: string): Promise<ArchiveDetail> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const url = `${API_BASE_URL}/api/v1/archive/${archiveId}`;

    const response = await axios.get<GetArchiveDetailResponse>(
      url,
      { headers }
    );
    
    return response.data.content;
  }

  /**
   * 아카이브 코멘트 리스트 조회
   */
  async getArchiveComments(archiveId: string): Promise<ArchiveComment[]> {
    const response = await axios.get<GetArchiveCommentsResponse>(
      `${API_BASE_URL}/api/v1/archive/${archiveId}/comments`
    );
    return response.data.content.comments;
  }

  /**
   * 관심 아카이브 등록
   */
  async addInterestArchive(archiveId: string, accessToken: string): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/api/v1/interest/archive/${archiveId}`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  /**
   * 관심 아카이브 삭제
   */
  async removeInterestArchive(archiveId: string, accessToken: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/v1/interest/archive/${archiveId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  /**
   * 아카이브 판정 등록
   */
  async createJudgement(
    archiveId: string,
    data: {
      isArchive: boolean;
      comment?: string;
      price?: number;
    },
    accessToken: string
  ): Promise<{ judgementId: string; createdAt: string }> {
    const response = await axios.post<{
      status: string;
      message: string;
      content: {
        judgementId: string;
        createdAt: string;
      };
    }>(
      `${API_BASE_URL}/api/v1/archive/${archiveId}/judgement`,
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data.content;
  }

  /**
   * Presigned URL 생성 (이미지 업로드용)
   * 보안: publicUrl은 백엔드에서만 생성하므로 objectNames만 반환
   */
  async generatePresignedUrls(
    fileCount: number,
    expiresInMinutes: number = 15,
    accessToken: string
  ): Promise<{ urls: string[]; objectNames: string[] }> {
    console.log('Presigned URL 생성 요청 시작');
    const response = await axios.post<{
      status: string;
      message: string;
      content: {
        urls: string[];
        objectNames: string[];
      };
    }>(
      `${API_BASE_URL}/api/v1/archive/upload-urls`,
      { fileCount, expiresInMinutes },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log('Presigned URL 생성 요청 성공:', response.data.content.urls);
    return response.data.content;
  }

  /**
   * Presigned URL로 이미지 업로드
   */
  async uploadImageToStorage(
    presignedUrl: string,
    imageUri: string
  ): Promise<void> {
    try {
      // React Native에서 이미지를 blob으로 읽어서 업로드
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`이미지 읽기 실패: ${response.status}`);
      }
      
      // blob으로 변환
      const blob = await response.blob();
      
      // Presigned URL로 업로드
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => 'Unknown error');
        throw new Error(`이미지 업로드 실패: ${uploadResponse.status} - ${errorText}`);
      }
      
      console.log(`이미지 업로드 성공: ${imageUri} -> ${presignedUrl}`);
    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      throw error;
    }
  }

  /**
   * 아카이브 등록
   * 보안: imageUrls 대신 imageObjectNames 전송
   */
  async createArchive(
    data: {
      brand: string;
      timeline: string;
      category: string;
      story: string;
      isJudgementAllow: boolean;
      isPriceJudgementAllow: boolean;
      imageObjectNames?: string[];
    },
    accessToken: string
  ): Promise<{ archiveId: string; createdAt: string }> {
    const response = await axios.post<{
      status: string;
      message: string;
      content: {
        archiveId: string;
        createdAt: string;
      };
    }>(
      `${API_BASE_URL}/api/v1/archive`,
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data.content;
  }

  /**
   * 아카이브 수정
   * 보안: imageUrls 대신 imageObjectNames 전송
   */
  async updateArchive(
    archiveId: string,
    data: {
      brand: string;
      timeline: string;
      category: string;
      story: string;
      isJudgementAllow: boolean;
      isPriceJudgementAllow: boolean;
      imageObjectNames?: string[];
    },
    accessToken: string
  ): Promise<void> {
    await axios.put(
      `${API_BASE_URL}/api/v1/archive/${archiveId}`,
      data,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  /**
   * 아카이브 삭제
   */
  async deleteArchive(
    archiveId: string,
    accessToken: string
  ): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/v1/archive/${archiveId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  /**
   * 관심 아카이브 리스트 조회
   */
  async getInterestArchives(
    page: number,
    accessToken: string
  ): Promise<GetInterestArchivesResponse> {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/interest/archive`,
      {
        params: { page, sort: 'recent' },
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data.content;
  }

  /**
   * 관심 아카이브 등록
   */
  async addInterest(archiveId: string, accessToken: string): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/api/v1/interest/archive/${archiveId}`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  /**
   * 관심 아카이브 삭제
   */
  async deleteInterest(archiveId: string, accessToken: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/v1/interest/archive/${archiveId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  }

  /**
   * 내 아카이브 리스트 조회
   */
  async getMyArchives(
    page: number,
    accessToken: string
  ): Promise<GetMyArchivesResponse> {
    const url = `${API_BASE_URL}/api/v1/my/archive`;
    const params = { page, sort: 'recent' };
    console.log('📡 [내 아카이브 API] 호출:', url, params);
    
    const response = await axios.get(url, {
      params,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    console.log('📡 [내 아카이브 API] 응답:', response.data);
    return response.data.content;
  }
}

export const archiveAPI = new ArchiveAPI();

