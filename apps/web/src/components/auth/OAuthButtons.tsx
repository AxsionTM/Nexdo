'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Providers = { google: boolean; github: boolean };

export function OAuthButtons() {
  const [providers, setProviders] = useState<Providers | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/providers`)
      .then(async (r) => {
        if (!r.ok) throw new Error('providers request failed');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProviders({
            google: !!data.providers?.google,
            github: !!data.providers?.github,
          });
        }
      })
      .catch(() => {
        // Keep the provider state unknown instead of falsely telling the user
        // that .env is missing when the API is simply restarting/offline.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const googleEnabled = providers?.google === true;
  const githubEnabled = providers?.github === true;
  const anyEnabled = googleEnabled || githubEnabled;

  const buttonClass =
    'flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors';

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или</span>
        </div>
      </div>

      <div className="grid gap-2">
        <a
          href={googleEnabled ? `${API_URL}/auth/google` : undefined}
          aria-disabled={!googleEnabled}
          onClick={(e) => {
            if (!googleEnabled) e.preventDefault();
          }}
          className={`${buttonClass} ${
            googleEnabled
              ? 'hover:bg-accent hover:text-accent-foreground'
              : 'cursor-not-allowed opacity-60'
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Войти через Google
          {providers && !googleEnabled && (
            <span className="text-[10px] text-muted-foreground">(не настроено)</span>
          )}
        </a>

        <a
          href={githubEnabled ? `${API_URL}/auth/github` : undefined}
          aria-disabled={!githubEnabled}
          onClick={(e) => {
            if (!githubEnabled) e.preventDefault();
          }}
          className={`${buttonClass} ${
            githubEnabled
              ? 'hover:bg-accent hover:text-accent-foreground'
              : 'cursor-not-allowed opacity-60'
          }`}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Войти через GitHub
          {providers && !githubEnabled && (
            <span className="text-[10px] text-muted-foreground">(не настроено)</span>
          )}
        </a>
      </div>

      {providers && !anyEnabled && (
        <p className="text-[11px] text-center text-muted-foreground">
          OAuth не настроен. Для него укажите CLIENT_ID и CLIENT_SECRET в apps/api/.env.
        </p>
      )}
    </div>
  );
}
