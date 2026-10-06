'use client'

import { RouteError } from '@/components/route-error'

export default function SiteError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} scope="site_route" />
}
