import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import Home from '@/components/Home';
import { SubjectProvider } from '@/context/SubjectContext';
import { getStorageProvider } from '@/utils/storage';
import Shimmer from '@/components/Shimmer';
import { Suspense } from 'react';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SpacePage({ params, searchParams }: PageProps) {
  const { id: spaceId } = await params;
  console.log('==================== SPACE PAGE ====================');
  
  const session = await getServerSession(authOptions);
  const isExample = spaceId.toString().endsWith('-example');

  if (!isExample && (!session?.user?.email || !session.user.accessToken)) {
    console.log('Authentication missing, redirecting to sign in');
    redirect('/api/auth/signin');
  }

  try {
    return (
      <Suspense fallback={<Shimmer />}>
        <SpaceContent spaceId={spaceId} />
      </Suspense>
    );
  } catch (error) {
    console.error('==================== ERROR ====================');
    console.error('Failed to load space:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    const errorMessage = error instanceof Error && error.message === 'Invalid Credentials' 
      ? 'Google Drive API access is not properly configured. Please make sure the Google Drive API is enabled in your Google Cloud Console.'
      : 'There was an error loading this space.';
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error Loading Space</h1>
          <p className="text-gray-600">{errorMessage}</p>
          <p className="text-gray-600">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

async function SpaceContent({ spaceId }: { spaceId: string }) {
  const storage = await getStorageProvider();
  console.log('SpaceContent called...');
  const spaceData = await storage.getSpace(spaceId);

  if (!spaceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Space Not Found</h1>
          <p className="text-gray-600">The space "{spaceId}" could not be found.</p>
          <Link 
            href="/"
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-200"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  // For encrypted spaces, pass empty subjects/categories and the encrypted data
  if (spaceData.isLocked && spaceData.encryptedData) {
    return (
      <SubjectProvider 
        initialData={{
          id: spaceId,
          title: spaceData.title,
          subjects: [],
          categories: [],
          isLocked: true,
          encryptedData: spaceData.encryptedData,
          rawData: spaceData // Pass the entire raw data to avoid another fetch
        }}
      >
        <Home />
      </SubjectProvider>
    );
  }

  // For unencrypted spaces, pass the data directly
  return (
    <SubjectProvider initialData={spaceData}>
      <Home />
    </SubjectProvider>
  );
} 