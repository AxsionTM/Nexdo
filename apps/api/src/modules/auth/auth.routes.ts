import 'dotenv/config';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../common/utils/prisma';
import { AppError } from '../../common/middleware/error-handler';
import { authMiddleware, AuthRequest } from '../../common/middleware/auth';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, 'Дата должна быть в формате YYYY-MM-DD');
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, 'Некорректная дата');
  }

  return date;
}

function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '30d' }
  );
}

async function ensureInbox(userId: string) {
  const existing = await prisma.projectMember.findFirst({
    where: { userId, project: { isInbox: true } },
  });
  if (existing) return existing.projectId;

  const inbox = await prisma.project.create({
    data: {
      name: 'Входящие',
      isInbox: true,
      color: '#4A90D9',
      members: { create: { userId, role: 'OWNER' } },
    },
  });
  return inbox.id;
}

async function findOrCreateOAuthUser(params: {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: params.provider,
        providerAccountId: params.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (account) {
    return account.user;
  }

  let user = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase() },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: params.email.toLowerCase(),
        name: params.name || params.email.split('@')[0],
        avatarUrl: params.avatarUrl,
      },
    });
    await ensureInbox(user.id);
  }

  await prisma.account.create({
    data: {
      userId: user.id,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
    },
  });

  return user;
}

router.get('/providers', (_req, res) => {
  res.json({
    providers: {
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError(409, 'Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name || data.email.split('@')[0],
      },
    });

    const inboxId = await ensureInbox(user.id);
    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        theme: user.theme,
        locale: user.locale,
      },
      token,
      inboxId,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'Неверный email или пароль');
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);

    if (!valid) {
      throw new AppError(401, 'Неверный email или пароль');
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        theme: user.theme,
        locale: user.locale,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        theme: true,
        locale: true,
        birthday: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'Пользователь не найден');
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).optional(),
      theme: z.string().optional(),
      locale: z.string().optional(),
      birthday: z.string().nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
        ...(data.locale !== undefined ? { locale: data.locale } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.birthday !== undefined
          ? { birthday: data.birthday ? parseDateOnly(data.birthday) : null }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        theme: true,
        locale: true,
        birthday: true,
        createdAt: true,
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// --- Google OAuth ---

router.get('/google', (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.redirect(
      `${FRONTEND_URL}/login?error=${encodeURIComponent('Google OAuth не настроен. Добавьте GOOGLE_CLIENT_ID в .env')}`
    );
  }

  const redirectUri = `${API_URL}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_denied`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${API_URL}/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_token_failed`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_profile_failed`);
    }

    const profile = (await profileRes.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    if (!profile.email) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
    }

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    const token = generateToken(user.id);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
  }
});

// --- GitHub OAuth ---

router.get('/github', (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.redirect(
      `${FRONTEND_URL}/login?error=${encodeURIComponent('GitHub OAuth не настроен. Добавьте GITHUB_CLIENT_ID в .env')}`
    );
  }

  const redirectUri = `${API_URL}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_denied`);
    }

    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_token_failed`);
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_token_failed`);
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!profileRes.ok) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_profile_failed`);
    }

    const profile = (await profileRes.json()) as {
      id: number;
      login: string;
      name?: string;
      email?: string;
      avatar_url?: string;
    };

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
        email = primary?.email;
      }
    }

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_no_email`);
    }

    const user = await findOrCreateOAuthUser({
      provider: 'github',
      providerAccountId: String(profile.id),
      email,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
    });

    const token = generateToken(user.id);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('GitHub OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
  }
});

export { router as authRouter };
