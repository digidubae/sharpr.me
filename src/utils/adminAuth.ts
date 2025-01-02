import { NextRequest, NextResponse } from 'next/server';

// Make admin credentials mandatory
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function validateAdminAuth(request: NextRequest) {
  // Verify environment variables are set
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('Admin credentials not properly configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return false;
  }

  try {
    const encoded = authHeader.split(' ')[1];
    const decoded = atob(encoded);
    const [username, password] = decoded.split(':');

    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  } catch {
    return false;
  }
} 