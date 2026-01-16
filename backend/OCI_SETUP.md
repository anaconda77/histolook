# Oracle Cloud Infrastructure (OCI) 인증 설정 가이드

## ✅ 기존 API 키가 있는 경우

이미 API 키를 다운받아 놓았다면, 다음 단계만 진행하세요:

1. **Config 파일 확인** (이미 설정되어 있다면 건너뛰기)
   ```bash
   cat ~/.oci/config
   ```
   - `user`, `fingerprint`, `key_file`, `tenancy`, `region`이 올바르게 설정되어 있는지 확인

2. **키 파일 권한 확인**
   ```bash
   ls -lh ~/.oci/oci_api_key.pem
   ```
   - 권한이 `-rw-------` (600)인지 확인
   - 그렇지 않다면: `chmod 600 ~/.oci/oci_api_key.pem`

3. **백엔드 환경 변수 설정** (아래 "백엔드 환경 변수 설정" 섹션 참고)

## 방법 1: Config 파일 사용 (권장)

### 1단계: API 키 생성

```bash
# ~/.oci 디렉토리 생성
mkdir -p ~/.oci

# 개인 키 생성 (2048비트 RSA)
openssl genrsa -out ~/.oci/oci_api_key.pem 2048

# 공개 키 생성
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# 키 파일 권한 설정 (보안)
chmod 600 ~/.oci/oci_api_key.pem
chmod 644 ~/.oci/oci_api_key_public.pem
```

### 2단계: OCI 콘솔에서 공개 키 등록

1. [OCI 콘솔](https://cloud.oracle.com/)에 로그인
2. 우측 상단 사용자 아이콘 클릭 → **User Settings**
3. **API Keys** 센션으로 이동
4. **Add API Key** 클릭
5. **Paste Public Key** 선택
6. `~/.oci/oci_api_key_public.pem` 파일 내용을 복사하여 붙여넣기
7. **Add** 클릭
8. **Fingerprint**와 **User OCID**를 복사 (나중에 필요)

### 3단계: Config 파일 생성

```bash
# ~/.oci/config 파일 생성
nano ~/.oci/config
```

다음 내용을 입력:

```ini
[DEFAULT]
user=ocid1.user.oc1..<여기에_User_OCID_입력>
fingerprint=<여기에_Fingerprint_입력>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<여기에_Tenancy_OCID_입력>
region=ap-seoul-1
```

**각 값 찾는 방법:**
- **User OCID**: OCI 콘솔 → User Settings → User Information에서 확인
- **Fingerprint**: API Key 등록 시 표시된 값
- **Tenancy OCID**: OCI 콘솔 → Administration → Tenancy Details에서 확인
- **Region**: 사용할 리전 (예: `ap-seoul-1`, `us-ashburn-1`)

### 4단계: Config 파일 권한 설정

```bash
chmod 600 ~/.oci/config
```

## 방법 2: 환경 변수 사용

환경 변수로 인증 정보를 설정할 수도 있습니다:

```bash
export OCI_CLI_USER_OCID="ocid1.user.oc1..<user_ocid>"
export OCI_CLI_FINGERPRINT="<fingerprint>"
export OCI_CLI_KEY_FILE="~/.oci/oci_api_key.pem"
export OCI_CLI_TENANCY_OCID="ocid1.tenancy.oc1..<tenancy_ocid>"
export OCI_CLI_REGION="ap-seoul-1"
```

또는 `.env` 파일에 추가:

```env
OCI_CLI_USER_OCID=ocid1.user.oc1..<user_ocid>
OCI_CLI_FINGERPRINT=<fingerprint>
OCI_CLI_KEY_FILE=~/.oci/oci_api_key.pem
OCI_CLI_TENANCY_OCID=ocid1.tenancy.oc1..<tenancy_ocid>
OCI_CLI_REGION=ap-seoul-1
```

## 백엔드 환경 변수 설정

`backend/.env` 파일에 다음 변수 추가:

```env
# OCI Object Storage 설정
OCI_NAMESPACE=<your-namespace>
OCI_BUCKET_NAME=<your-bucket-name>
OCI_REGION=ap-seoul-1
```

**Namespace 찾는 방법:**
1. OCI 콘솔 → **Object Storage** → **Buckets**
2. 아무 버킷이나 선택
3. 버킷 상세 페이지에서 **Namespace** 확인

## 테스트

설정이 올바른지 확인:

```bash
# OCI CLI가 설치되어 있다면
oci iam user get --user-id <user_ocid>

# 또는 Node.js에서 테스트
cd backend
npm run start:dev
```

## 문제 해결

### 인증 오류가 발생하는 경우

1. **키 파일 경로 확인**: `key_file` 경로가 올바른지 확인
2. **권한 확인**: 키 파일과 config 파일의 권한이 올바른지 확인 (600)
3. **OCID 형식 확인**: 모든 OCID가 올바른 형식인지 확인
4. **리전 확인**: 올바른 리전 코드를 사용하는지 확인

### Fingerprint 확인 방법

```bash
openssl rsa -pubout -outform DER -in ~/.oci/oci_api_key.pem | openssl md5 -c
```

## 보안 주의사항

- ⚠️ **절대 개인 키 파일을 Git에 커밋하지 마세요**
- ⚠️ `.oci` 디렉토리를 `.gitignore`에 추가하세요
- ⚠️ 키 파일 권한은 반드시 `600`으로 설정하세요

