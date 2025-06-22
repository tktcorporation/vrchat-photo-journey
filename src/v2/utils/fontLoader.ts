export async function loadInterFonts(): Promise<void> {
  await document.fonts.load('700 1em Inter');
  await document.fonts.load('600 1em Inter');
  await document.fonts.load('500 1em Inter');
  await document.fonts.load('400 1em Inter');
}
