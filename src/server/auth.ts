import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { users, organizations } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Read Firebase project ID from config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let projectId = 'invertible-lambda-dk6kr';
try {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.projectId) {
      projectId = config.projectId;
    }
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json, using fallback projectId');
}

// Initialize Firebase Admin (uses default credentials)
if (!getApps().length) {
  initializeApp({
    projectId
  });
}

export interface AuthRequest extends Request {
  user?: any;
  dbUser?: typeof users.$inferSelect;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || (req.query.auth ? `Bearer ${req.query.auth}` : undefined);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Auto-create or fetch user in our DB
    const [dbUser] = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
    
    if (dbUser) {
      req.dbUser = dbUser;
    } else {
      // First time login - create an organization for them (SaaS MVP behavior)
      const orgName = decodedToken.name ? `${decodedToken.name}'s Organization` : 'My Organization';
      const [newOrg] = await db.insert(organizations).values({ name: orgName }).returning();
      
      const [newUser] = await db.insert(users).values({
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        role: 'org_admin',
        organizationId: newOrg.id,
      }).returning();
      
      req.dbUser = newUser;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
