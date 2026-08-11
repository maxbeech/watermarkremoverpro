import Link from 'next/link'
import { pagesInGroup, type LongTailPage } from '@/content/pages'

export function GroupIndex({
  group,
  title,
  intro,
}: {
  group: LongTailPage['group']
  title: string
  intro: string
}) {
  const pages = pagesInGroup(group)
  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-ink-900">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{intro}</p>

      <ul className="mt-8 divide-y divide-ink-200 border-t border-ink-200">
        {pages.map((page) => (
          <li key={page.slug} className="py-5">
            <Link href={`/${group}/${page.slug}`} className="group block">
              <h2 className="font-serif text-lg text-ink-900 group-hover:underline">{page.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{page.metaDescription}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
