import QRCode from 'qrcode';

export interface QRCodeRenderOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate a pure vector SVG string for laser cutting, plotting, or vector editing
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeRenderOptions = {}
): Promise<string> {
  const {
    margin = 2,
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'H',
  } = options;

  return QRCode.toString(text, {
    type: 'svg',
    margin,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Generate high-resolution raster Data URL (PNG) up to 1024x1024
 */
export async function generateQRCodeDataUrl(
  text: string,
  options: QRCodeRenderOptions = {}
): Promise<string> {
  const {
    width = 1024,
    margin = 2,
    darkColor = '#000000',
    lightColor = '#ffffff',
    errorCorrectionLevel = 'H',
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Trigger direct download of PNG file in browser
 */
export async function downloadQRCodePNG(
  text: string,
  filename: string,
  options: QRCodeRenderOptions = {}
): Promise<void> {
  const dataUrl = await generateQRCodeDataUrl(text, {
    width: options.width || 1024,
    margin: options.margin ?? 2,
    darkColor: options.darkColor || '#000000',
    lightColor: options.lightColor || '#ffffff',
    errorCorrectionLevel: 'H',
  });

  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger direct download of pure SVG vector file
 */
export async function downloadQRCodeSVG(
  text: string,
  filename: string,
  options: QRCodeRenderOptions = {}
): Promise<void> {
  const svgString = await generateQRCodeSVG(text, options);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
