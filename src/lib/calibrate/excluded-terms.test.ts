import { describe, expect, it } from 'vitest'
import { splitExcludedWordsInput } from './excluded-terms'

describe('splitExcludedWordsInput', () => {
  it('splits one entry per line', () => {
    expect(splitExcludedWordsInput('WatermarkRemoverPro\non-device AI detector')).toEqual([
      'WatermarkRemoverPro',
      'on-device AI detector',
    ])
  })

  it('splits a comma-separated line', () => {
    expect(splitExcludedWordsInput('WatermarkRemoverPro, on-device AI detector')).toEqual([
      'WatermarkRemoverPro',
      'on-device AI detector',
    ])
  })

  it('accepts a mix of newlines and commas', () => {
    expect(splitExcludedWordsInput('foo, bar\nbaz,qux')).toEqual(['foo', 'bar', 'baz', 'qux'])
  })

  it('trims whitespace around each entry', () => {
    expect(splitExcludedWordsInput('  foo  ,  bar  ')).toEqual(['foo', 'bar'])
  })

  it('keeps a blank entry rather than dropping it, so a line in progress does not vanish', () => {
    expect(splitExcludedWordsInput('foo\n')).toEqual(['foo', ''])
    expect(splitExcludedWordsInput('foo,')).toEqual(['foo', ''])
  })
})
