import Link from 'next/link';

export default function ExampleSpaces() {
  return (
    <p className="mt-4 text-gray-600 dark:text-gray-400">
      Try an example space: {' '}
      <Link href="/example/personal" className="text-blue-600 dark:text-blue-400 hover:underline">personal</Link>,{' '}
      <Link href="/example/project" className="text-blue-600 dark:text-blue-400 hover:underline">project</Link>,{' '}
      <Link href="/example/study" className="text-blue-600 dark:text-blue-400 hover:underline">study</Link>{' '}
      or{' '}
      <Link href="/example/work" className="text-blue-600 dark:text-blue-400 hover:underline">work</Link>
    </p>
  );
} 