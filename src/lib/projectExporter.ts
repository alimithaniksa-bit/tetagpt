import JSZip from 'jszip';

export interface ProjectExportOptions {
  code: string;
  projectName: string;
  projectType: 'game' | '3d' | 'clone' | 'app';
  domainOrSource?: string;
}

/**
 * Downloads single standalone HTML file ready to double-click and run in any browser.
 */
export const downloadStandaloneHtml = (options: ProjectExportOptions) => {
  const { code, projectName, projectType } = options;
  if (!code) return;

  const sanitizedName = (projectName || `tetagpt-${projectType}`)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');

  const filename = `${sanitizedName}.html`;
  const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Creates and downloads a complete offline-ready ZIP bundle with index.html,
 * package.json, and a detailed README with local runner instructions.
 */
export const downloadProjectZip = async (options: ProjectExportOptions): Promise<void> => {
  const { code, projectName, projectType, domainOrSource } = options;
  if (!code) return;

  const zip = new JSZip();
  const safeName = (projectName || `tetagpt-${projectType}`)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');

  // 1. Standalone runnable index.html
  zip.file('index.html', code);

  // 2. Clear README.md with instructions
  const readmeContent = `# ${projectName || 'Tetagpt Cosmic Project'}

Generated with **Tetagpt Cosmic Builder**
Type: ${projectType.toUpperCase()} ${domainOrSource ? `(Clone of ${domainOrSource})` : ''}

---

## 🚀 How to Run Locally

### Method 1: Instant Run (Zero Setup - Easiest)
Simply **double-click \`index.html\`** on your computer. It will immediately open and run in Google Chrome, Safari, Microsoft Edge, Brave, or Firefox.

---

### Method 2: Local Web Server (Recommended for 3D & Advanced Games)
Some browser security policies restrict WebGL textures or Web Workers on \`file://\` protocol. Running a local HTTP server provides the best 60fps experience:

#### Using Node.js:
\`\`\`bash
# Run directly with npx (no install needed):
npx serve .

# Or using the included package.json:
npm start
\`\`\`
Then open \`http://localhost:3000\` in your browser.

#### Using Python (Built-in on macOS/Linux/Windows):
\`\`\`bash
# Python 3:
python3 -m http.server 8000

# Or Python 2:
python -m SimpleHTTPServer 8000
\`\`\`
Then open \`http://localhost:8000\` in your browser.

#### Using VS Code:
1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click \`index.html\` and select **"Open with Live Server"**.

---

## 📱 Mobile Device Testing
To play or test this on your iPhone, iPad, or Android phone:
1. Make sure your computer and phone are connected to the same Wi-Fi.
2. Start the local server (e.g. \`npx serve .\` or \`python3 -m http.server 8000\`).
3. Find your computer's local IP address (e.g. \`192.168.1.50\`).
4. On your mobile phone browser, open:
   \`http://<your-computer-ip>:8000\`
5. Tap **Add to Home Screen** or use Fullscreen mode for a native app experience!

---

*Crafted by Tetagpt Cosmic Builder — Autonomous Creation Engine.*
`;
  zip.file('README.md', readmeContent);

  // 3. package.json for one-command execution
  const packageJson = {
    name: safeName,
    version: '1.0.0',
    description: `Exported from Tetagpt Cosmic Builder - ${projectType}`,
    scripts: {
      start: 'npx serve .',
      dev: 'npx serve -l 3000 .'
    },
    keywords: ['tetagpt', projectType, 'offline-runnable']
  };
  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // Generate ZIP blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-bundle.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
