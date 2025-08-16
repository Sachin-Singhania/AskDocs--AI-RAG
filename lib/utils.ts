import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
      export const isValidUrl = (url:string) => {
        const regex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}(:\d+)?(\/[^\s?#]*)?(\?[^\s#]*)?(#[^\s]*)?$/;
        return regex.test(url);
      };
// export async function getdatafromsources(sources: string[]): Promise<{ data: any[]; error?: undefined; } | { error: unknown; data?: never[]; }> {
//     try {
//         const browser = await chromium.launch({headless: true});
//         const page = await browser.newPage();
//         const context = [];
//         for (let source of sources) {
//             await page.goto(source, { waitUntil: "domcontentloaded" });
//             const content = await page.$eval("body", (e: { innerText: any; }) => e.innerText);
//             const cleanedText = content.replace(/\n+/g, ' ');
//             context.push(cleanedText);
//         }
//         await browser.close();
//         return {
//             data: context,
//         };
//     } catch (error: unknown) {
//         return {
//             data: [],
//             error: error
//         };
//     }
// }
