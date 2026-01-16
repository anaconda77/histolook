import { Injectable, Logger } from '@nestjs/common';
import * as common from 'oci-common';
import * as os from 'oci-objectstorage';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private objectStorageClient: os.ObjectStorageClient;
  private provider: common.ConfigFileAuthenticationDetailsProvider;
  private namespace: string;
  private bucketName: string;

  constructor() {
    try {
      // 1. OCI 인증 초기화
      // ~/.oci/config 파일을 자동으로 읽어옵니다.
      this.provider = new common.ConfigFileAuthenticationDetailsProvider();

      this.objectStorageClient = new os.ObjectStorageClient({
        authenticationDetailsProvider: this.provider,
      });

      // 2. 환경 변수에서 버킷 정보 로드
      // process.env 값은 undefined일 수 있으므로 빈 문자열('')을 기본값으로 할당하여 타입 에러 해결
      this.namespace = process.env.OCI_NAMESPACE || '';
      this.bucketName = process.env.OCI_BUCKET_NAME || '';

      if (!this.namespace || !this.bucketName) {
        this.logger.warn('OCI_NAMESPACE 또는 OCI_BUCKET_NAME 환경변수가 설정되지 않았습니다.');
      } else {
        // getProfileName() 메서드 제거
        this.logger.log('OCI Storage 초기화 성공');
      }
    } catch (error) {
      this.logger.error('OCI 인증 초기화 실패', error);
      throw new Error('OCI 설정 파일을 읽을 수 없습니다. ~/.oci/config 파일 설정을 확인해주세요.');
    }
  }

  /**
   * 단일 파일에 대한 Presigned URL 생성 (내부 호출용)
   */
  async generatePresignedUploadUrl(
    objectName: string,
    expiresInMinutes: number = 15,
  ): Promise<string> {
    try {
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + expiresInMinutes);

      const request: os.requests.CreatePreauthenticatedRequestRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        createPreauthenticatedRequestDetails: {
          name: `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          objectName: objectName,
          accessType: os.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite,
          timeExpires: expirationTime,
        },
      };

      const response = await this.objectStorageClient.createPreauthenticatedRequest(request);

      const endpoint = this.objectStorageClient.endpoint;
      const presignedUrl = `${endpoint}${response.preauthenticatedRequest.accessUri}`;

      return presignedUrl;
    } catch (error) {
      this.logger.error(`Presigned URL 생성 실패: ${error.message}`);
      throw new Error('Presigned URL 생성에 실패했습니다.');
    }
  }

  /**
   * [Controller에서 호출하는 메서드]
   * 여러 이미지에 대한 Presigned URL 생성 (업로드용)
   * 보안을 위해 publicUrl은 반환하지 않고, objectName만 반환하여 백엔드에서 검증 후 사용
   */
  async generatePresignedUploadUrls(
    userId: string,
    fileCount: number,
    expiresInMinutes: number = 15,
  ): Promise<{ urls: string[]; objectNames: string[] }> {
    const urls: string[] = [];
    const objectNames: string[] = [];

    const promises = Array.from({ length: fileCount }).map(async (_, i) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const objectName = `archives/${userId}/${timestamp}-${randomString}-${i}.jpg`;

      const url = await this.generatePresignedUploadUrl(
        objectName,
        expiresInMinutes,
      );

      return {
        url,
        objectName,
      };
    });

    try {
      const results = await Promise.all(promises);

      results.forEach((result) => {
        urls.push(result.url);
        objectNames.push(result.objectName);
      });

      return { urls, objectNames };
    } catch (error) {
      this.logger.error('다중 URL 생성 중 오류 발생', error);
      throw error;
    }
  }

  /**
   * objectName으로부터 publicUrl 생성 (내부 사용, 검증 후 DB 저장용)
   */
  getPublicUrlFromObjectName(objectName: string): string {
    return this.getPublicUrl(objectName);
  }

  /**
   * 읽기용 Presigned URL 생성 (이미지 조회용)
   */
  async generatePresignedReadUrl(
    objectName: string,
    expiresInMinutes: number = 60, // 기본 1시간
  ): Promise<string> {
    try {
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + expiresInMinutes);

      const request: os.requests.CreatePreauthenticatedRequestRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        createPreauthenticatedRequestDetails: {
          name: `read-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          objectName: objectName,
          accessType: os.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
          timeExpires: expirationTime,
        },
      };

      const response = await this.objectStorageClient.createPreauthenticatedRequest(request);

      const endpoint = this.objectStorageClient.endpoint;
      const presignedUrl = `${endpoint}${response.preauthenticatedRequest.accessUri}`;

      return presignedUrl;
    } catch (error) {
      this.logger.error(`읽기용 Presigned URL 생성 실패: ${error.message}`);
      throw new Error('읽기용 Presigned URL 생성에 실패했습니다.');
    }
  }

  /**
   * 여러 이미지에 대한 읽기용 Presigned URL 생성
   */
  async generatePresignedReadUrls(
    objectNames: string[],
    expiresInMinutes: number = 60, // 기본 1시간
  ): Promise<string[]> {
    const promises = objectNames.map((objectName) =>
      this.generatePresignedReadUrl(objectName, expiresInMinutes),
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      this.logger.error('다중 읽기 URL 생성 중 오류 발생', error);
      throw error;
    }
  }

  /**
   * 업로드된 객체의 공개(Public) URL 생성 (사용하지 않음 - Presigned URL 사용 권장)
   * @deprecated 공개 접근이 불가능하므로 generatePresignedReadUrl 사용 권장
   */
  getPublicUrl(objectName: string): string {
    const regionId = this.provider.getRegion().regionId;
    return `https://objectstorage.${regionId}.oraclecloud.com/n/${this.namespace}/b/${this.bucketName}/o/${encodeURIComponent(objectName)}`;
  }
}