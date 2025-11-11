# 일일메모지 앱 (React + Vite + PWA + Capacitor)

이 폴더는 바로 실행/빌드 가능한 스타터입니다. 
- 웹으로 먼저 실행 → PWA 설치
- 필요하면 Capacitor로 Android/iOS 패키지 생성

## 0) 필수 설치
- Node.js 18 이상
- (Android 빌드 시) Android Studio
- (iOS 빌드 시) macOS + Xcode

## 1) 로컬 실행 (웹)
```bash
npm install
npm run dev
```
브라우저에서 `http://localhost:5173`를 열면 됩니다.

## 2) PWA 설치
- 위 주소 접속 후, Android 크롬: '홈 화면에 추가' → 설치
- iOS 사파리: 공유 버튼 → '홈 화면에 추가'

## 3) 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 4) Capacitor로 네이티브 패키지 만들기
```bash
# 웹 결과물 dist 생성 후 네이티브 프로젝트 동기화
npm run build
npx cap copy

# 안드로이드 스튜디오 열기
npx cap open android

# (선택) iOS Xcode 열기 (macOS)
npx cap open ios
```

### Android Studio에서
- Build > Generate Signed Bundle / APK → App Bundle(.aab) 생성
- Google Play Console에 업로드(내부 테스트 트랙 권장)

### Xcode에서
- Signing & Capabilities에 팀/프로비저닝 설정
- Product > Archive → App Store Connect 업로드

## 데이터 저장
- 브라우저 LocalStorage 사용 (네이티브 WebView에서도 동일)
- 앱 삭제 시 데이터도 삭제됩니다. 동기화가 필요하면 Firebase/SQLite 연동을 고려하세요.

## 아이콘 교체
- `public/icons/icon-192.png`, `public/icons/icon-512.png`를 교체하면 홈 화면 아이콘이 바뀝니다.

## 주의
- Tailwind는 CDN 방식으로 index.html에 로드되어 있어 빠르게 확인 가능합니다.
- 본격 배포 시엔 Tailwind를 빌드 인클루드로 전환하는 것을 권장합니다.
