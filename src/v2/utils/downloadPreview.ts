export async function downloadPreview(
  element: SVGSVGElement,
  worldName: string | null,
): Promise<void> {
  try {
    const clone = element.cloneNode(true) as SVGSVGElement;
    clone.style.background = '#ffffff';

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);

    const svgData = `<?xml version="1.0" encoding="UTF-8"?>
${svgString}`;

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${worldName || 'preview'}.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to generate SVG:', error);
  }
}
