import { toPng } from 'html-to-image';

export async function downloadChartPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    filter: (n) => {
      // Hide elements explicitly opted out (download buttons themselves).
      if (n instanceof HTMLElement && n.dataset.exportHide === 'true') return false;
      return true;
    },
    backgroundColor: getComputedStyle(document.documentElement)
      .getPropertyValue('--bg')
      .trim() || '#0F1419',
  });
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}
