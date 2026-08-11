import Link from 'next/link'
import { BandRule } from '@/components/brand/band'
import { PageHeader, Section, Wrap } from '@/components/brand/ui'
import { pagesInGroup, type LongTailPage } from '@/content/pages'

const EYEBROWS: Record<LongTailPage['group'], string> = {
  for: 'Who it is for',
  vs: 'How it compares',
  guide: 'Guides',
  in: 'Languages',
}

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
    <>
      <PageHeader eyebrow={EYEBROWS[group]} title={title} lead={intro} />

      <Section tight>
        <Wrap>
          <ul className="divide-y divide-ink-200 border-t border-ink-300">
            {pages.map((page, i) => (
              <li key={page.slug}>
                <Link
                  href={`/${group}/${page.slug}`}
                  className="group grid gap-x-8 gap-y-2 py-6 transition-colors duration-150 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
                >
                  <span className="figure hidden pt-1 text-xs text-ink-300 transition-colors duration-150 group-hover:text-seal-500 sm:block">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h2 className="t-heading text-ink-900 transition-colors duration-150 group-hover:text-seal-700">
                      {page.title}
                    </h2>
                    <BandRule
                      at={30 + ((i * 13) % 45)}
                      tone="muted"
                      className="mt-3 max-w-[4rem] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">{page.metaDescription}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Wrap>
      </Section>
    </>
  )
}
