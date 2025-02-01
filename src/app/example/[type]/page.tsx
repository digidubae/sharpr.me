'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Home from '@/components/Home';
import { SubjectProvider } from '@/context/SubjectContext';
import Shimmer from '@/components/Shimmer';
import { ImportedData } from '@/types';

const EXAMPLE_TYPES: { [key: string]: string } = {
  'personal': 'personal.json',
  'project': 'project.json',
  'study': 'study.json',
  'work': 'work.json'
};

export default function ExamplePage() {
  const params = useParams();
  const [exampleData, setExampleData] = useState<ImportedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExampleData = async () => {
      try {
        const type = params.type as string;
        const exampleFile = EXAMPLE_TYPES[type];
        
        if (!exampleFile) {
          setError('Invalid example type');
          return;
        }

        const example = await import(`@/data/examples/${exampleFile}`);
        setExampleData(example);
      } catch (error) {
        console.error('Error loading example:', error);
        setError('Failed to load example');
      } finally {
        setIsLoading(false);
      }
    };

    loadExampleData();
  }, [params.type]);

  if (isLoading) {
    return <Shimmer message="Loading example..." />;
  }

  if (error || !exampleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">{error || 'Example not found'}</h1>
        </div>
      </div>
    );
  }

  return (
    <SubjectProvider initialData={{
      id: `${params.type}-example`,
      title: exampleData.title,
      subjects: exampleData.subjects,
      categories: exampleData.categories || [],
      isExample: true
    }}>
      <Home />
    </SubjectProvider>
  );
} 