import { describe, expect, it } from 'vitest'
import {
  modelContentToString,
  parseArticleJson,
  rapidApiErrorMessage,
  sanitizeArticleContent,
  stripCjkBleed,
} from '@/lib/rapidapi-chat'

describe('rapidApiErrorMessage', () => {
  it('explains timeouts without blaming the user', () => {
    expect(rapidApiErrorMessage(504)).toMatch(/timed out/i)
    expect(rapidApiErrorMessage(504)).toMatch(/nothing is wrong with your account/i)
  })

  it('explains auth failures as server-side', () => {
    expect(rapidApiErrorMessage(401)).toMatch(/server configuration/i)
  })

  it('explains rate limits', () => {
    expect(rapidApiErrorMessage(429)).toMatch(/busy/i)
  })
})

describe('modelContentToString', () => {
  it('returns plain strings unchanged', () => {
    expect(modelContentToString('hello')).toBe('hello')
  })

  it('extracts nested message.content objects from RapidAPI payloads', () => {
    expect(
      modelContentToString({
        message: { role: 'assistant', content: '{"hook":"Hi","body":"Main","cta":"Buy"}' },
      }),
    ).toBe('{"hook":"Hi","body":"Main","cta":"Buy"}')
  })
})

describe('parseArticleJson', () => {
  it('parses a JSON object string', () => {
    expect(parseArticleJson('{"hook":"H","body":"B","cta":"C"}')).toEqual({
      hook: 'H',
      body: 'B',
      cta: 'C',
    })
  })

  it('extracts JSON embedded in prose', () => {
    const raw = 'Here you go:\n{"hook":"H","body":"B","cta":"C"}\nThanks'
    expect(parseArticleJson(raw).body).toBe('B')
  })

  it('parses single-quoted value literals (model HTML quirk)', () => {
    const raw = `{ "hook": '<p>Hello there</p>', "body": '<h2>Title</h2><p>Main</p>', "cta": '<p>Go</p>' }`
    expect(parseArticleJson(raw)).toEqual({
      hook: '<p>Hello there</p>',
      body: '<h2>Title</h2><p>Main</p>',
      cta: '<p>Go</p>',
    })
  })
})

describe('sanitizeArticleContent', () => {
  it('unwraps raw hook/body JSON so users never see the keys', () => {
    const raw = `{ "hook": '<p>Are you ready?</p>', "body": '<h2>Understanding</h2>', "cta": '' }`
    const clean = sanitizeArticleContent(raw)
    expect(clean).not.toMatch(/["']hook["']/)
    expect(clean).not.toMatch(/["']body["']/)
    expect(clean).toContain('Are you ready?')
    expect(clean).toContain('Understanding')
  })

  it('strips Chinese bleed from saved English HTML', () => {
    const raw =
      '<h2>当它使用频率过高时 - overusing placeholder domains hurts trust</h2><p>Readers notice fake links fast when copy stays English.</p>'
    const clean = sanitizeArticleContent(raw)
    expect(clean).not.toMatch(/当它/)
    expect(clean).toContain('overusing placeholder domains hurts trust')
  })
})

describe('parseArticleJson outline', () => {
  it('turns a section outline into numbered blocks', () => {
    const raw = JSON.stringify({
      hook: 'Start here with a clear promise for the reader.',
      sections: [
        {
          heading: 'Why This Matters',
          paragraphs: ['Short reason one.', 'Short reason two.'],
          points: ['Point A', 'Point B', 'Point C'],
        },
        {
          heading: 'What To Do Next',
          paragraphs: ['Do the simple thing first.'],
          points: ['Step one', 'Step two'],
        },
      ],
      cta: 'Open the training and apply one step today.',
    })
    const parsed = parseArticleJson(raw)
    expect(parsed.body).toContain('<h2>Why This Matters</h2>')
    expect(parsed.body).toContain('<li>Point A</li>')
    expect(parsed.body).not.toMatch(/article-section|article-toc/)
  })
})

describe('stripCjkBleed', () => {
  it('removes Chinese prefixes from English headings', () => {
    const raw =
      '<h2>表示文献示例时 - domains like Example Domain need care</h2><p>Write clear English so readers trust the page and click through safely.</p>'
    const clean = stripCjkBleed(raw)
    expect(clean).not.toMatch(/[\u3400-\u9fff]/)
    expect(clean).toContain('domains like Example Domain need care')
    expect(clean).toMatch(/^<h2>domains/i)
  })

  it('leaves mostly-Chinese text alone', () => {
    const raw = '<p>这是一篇全中文短文</p>'
    expect(stripCjkBleed(raw)).toBe(raw)
  })
})
