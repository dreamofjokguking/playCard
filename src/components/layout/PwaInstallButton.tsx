'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari legacy
  return Boolean((window.navigator as { standalone?: boolean }).standalone);
}

export default function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [iosEligible, setIosEligible] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setIosEligible(isIosSafari());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferred(null);
  }

  if (installed) return null;

  // Chromium 자동 prompt 가로챈 경우
  if (deferred) {
    return (
      <button
        type="button"
        className="pc-icon-btn pc-install-btn"
        onClick={() => triggerInstall()}
        aria-label="PlayCard 앱 설치"
        title="앱처럼 설치"
      >
        <DownloadIcon />
      </button>
    );
  }

  // iOS Safari — 자동 prompt 미지원 → 안내 모달
  if (iosEligible) {
    return (
      <>
        <button
          type="button"
          className="pc-icon-btn pc-install-btn"
          onClick={() => setShowIosGuide(true)}
          aria-label="홈 화면에 추가 안내"
          title="홈 화면에 추가"
        >
          <DownloadIcon />
        </button>
        {showIosGuide ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setShowIosGuide(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              zIndex: 'var(--pc-z-modal)' as unknown as number,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                width: 'min(420px, 100%)',
                background: 'var(--pc-surface-elevated)',
                borderTopLeftRadius: 'var(--pc-r-xl)',
                borderTopRightRadius: 'var(--pc-r-xl)',
                padding: 'var(--pc-space-6)',
                color: 'var(--pc-ink)',
                boxShadow: 'var(--pc-shadow-xl)'
              }}
            >
              <div className="pc-caption" style={{ marginBottom: 8 }}>iOS 설치 안내</div>
              <h2 style={{ marginTop: 0 }}>홈 화면에 추가하기</h2>
              <ol style={{ paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Safari 하단의 <strong>공유 버튼</strong>(↑ 박스 아이콘)을 누르세요</li>
                <li>메뉴에서 <strong>"홈 화면에 추가"</strong> 선택</li>
                <li>앱 이름 확인 후 <strong>추가</strong> → 홈 화면에서 단독 실행</li>
              </ol>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button type="button" className="pc-button" onClick={() => setShowIosGuide(false)}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return null;
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
