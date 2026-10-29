import { describe, expect, it } from 'vitest'
import { structureArticleHtml } from '@/lib/structure-article-html'

describe('structureArticleHtml', () => {
  it('promotes title-case lines to h2 and Use-it lines to a list', () => {
    const raw = [
      '<p>Clear documentation protects people. Using a live domain as an example can send them to the wrong place.</p>',
      '<p>What Example Domain Is and Why It Exists</p>',
      '<p>Example Domain is reserved so writers can show a URL without risking a real site.</p>',
      '<p>Use it to illustrate URL structure without naming a live brand.</p>',
      '<p>Use it in developer documentation and training materials.</p>',
      '<p>Use it when a screenshot needs a harmless sample address.</p>',
      '<p>The Hidden Cost of Using a Real Site as an Example</p>',
      '<p>Real domains create confusion, broken trust, and accidental traffic.</p>',
    ].join('')

    const html = structureArticleHtml(raw)

    expect(html).not.toMatch(/article-section|article-toc|article-layout/)
    expect(html).toMatch(/<h2>What Example Domain Is and Why It Exists<\/h2>/)
    expect(html).toMatch(/<h2>The Hidden Cost of Using a Real Site as an Example<\/h2>/)
    expect(html).toMatch(/<ul>/)
    expect(html.match(/<li>/g)?.length).toBeGreaterThanOrEqual(3)
  })

  it('splits br-separated lines inside a paragraph into headings and lists', () => {
    const raw =
      "<p>Clear docs protect patients when sample links stay safe.<br>" +
      'What Example Domain Is and Why It Exists<br>' +
      'Example Domain is reserved for documentation examples.<br>' +
      'Use it to illustrate URL structure without naming a live brand.<br>' +
      'Use it in developer documentation and training materials.<br>' +
      'The Hidden Cost of Using a Real Site as an Example<br>' +
      'Real domains create confusion and broken trust.</p>'

    const html = structureArticleHtml(raw)
    expect(html).toContain('<h2>What Example Domain Is and Why It Exists</h2>')
    expect(html).toMatch(/<ul>/)
    expect(html).not.toMatch(/article-section/)
  })

  it('unwraps legacy card layout into plain BP HTML', () => {
    const raw =
      '<div class="article-layout"><p class="lead">Hook text here.</p>' +
      '<nav class="article-toc"><p class="article-toc-label">In this article</p><ol><li>First</li></ol></nav>' +
      '<section class="article-section"><h2><span class="article-kicker">01</span>First Section</h2>' +
      '<p>Body copy.</p><ul><li>One</li><li>Two</li></ul></section></div>'

    const html = structureArticleHtml(raw)
    expect(html).not.toMatch(/article-layout|article-section|article-toc|article-kicker/)
    expect(html).toContain('First Section')
    expect(html).toContain('<li>One</li>')
  })

  it('sanitizes already-structured HTML instead of returning scripts raw', () => {
    const raw = [
      '<h2>First</h2>',
      '<h2>Second</h2>',
      '<ul><li>One</li><li>Two</li></ul>',
      '<script>alert(1)</script>',
      '<p onclick="evil()">Body</p>',
    ].join('')

    const html = structureArticleHtml(raw)
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/onclick/i)
    expect(html).toContain('<h2>First</h2>')
    expect(html).toContain('<li>One</li>')
  })
})
