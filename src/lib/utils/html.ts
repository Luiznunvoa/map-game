/**
 * A lightweight tagged template literal function to create HTML elements easily.
 */
export function html(strings: TemplateStringsArray, ...values: any[]): HTMLElement {
  const rawHtml = strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '')
  const template = document.createElement('template')
  template.innerHTML = rawHtml.trim()
  
  // Return the first valid Element node (ignoring text/whitespace nodes at the start)
  for (let i = 0; i < template.content.childNodes.length; i++) {
    const node = template.content.childNodes[i]
    if (node.nodeType === Node.ELEMENT_NODE) {
      return node as HTMLElement
    }
  }
  
  throw new Error('No valid HTML element found in template.')
}
