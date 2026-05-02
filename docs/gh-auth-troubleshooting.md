# GH 인증 트러블슈팅 (PlayCard)

## 목적
- `gh auth status` 실패, 토큰 미인식, 프록시 오류를 빠르게 복구한다.

## 표준 실행 방법
- PlayCard에서는 `gh`를 직접 호출하지 말고 아래 래퍼를 우선 사용한다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gh-with-env.ps1 <gh args>
```

예시:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\gh-with-env.ps1 auth status
powershell -ExecutionPolicy Bypass -File .\scripts\gh-with-env.ps1 pr list
```

## 래퍼가 하는 일
1. `.env.local`에서 `GH_TOKEN`을 우선 로드한다. (`GH_TOKEN`이 없으면 `GITHUB_TOKEN` 사용)
2. 현재 세션에 `GH_TOKEN`을 주입한다.
3. 잘못된 로컬 프록시(`127.0.0.1:9`)를 자동 해제한다.
4. 이후 `gh` 명령을 실행한다.

## 흔한 실패 원인
1. 토큰이 시스템/사용자 환경변수에 없고, keyring 토큰만 만료됨
2. `HTTP_PROXY/HTTPS_PROXY`가 잘못된 로컬 주소로 설정됨
3. 새 터미널 세션에 토큰이 반영되지 않음

## 수동 점검 명령
```powershell
gh auth status
gh auth token
Get-ChildItem Env: | Where-Object { $_.Name -match 'GH_TOKEN|GITHUB_TOKEN|PROXY' }
```

## 보안 주의
- `.env.local`은 절대 커밋하지 않는다.
- 토큰을 채팅/PR/로그에 평문으로 붙여넣지 않는다.
