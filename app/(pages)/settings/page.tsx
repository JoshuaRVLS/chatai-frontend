import { QueryClient, usePrefetchQuery } from '@tanstack/react-query'
import { getServerSession } from 'next-auth';
import React from 'react'
import Settings from '../components/Settings/Settings';

const page = async () => {
  const queryClient = new QueryClient();
  const session = await getServerSession();

  await queryClient.prefetchQuery({
    queryKey: ['settingsData'],
    queryFn: () => fetch(`/api/users/${session?.user?.id}`).then(res => res.json())
  })
  return (
    <div><Settings /></div>
  )
}

export default page