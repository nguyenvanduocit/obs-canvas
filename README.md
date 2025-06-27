# Canvas Web Viewer

A web application to view and interact with Obsidian Canvas files through GitHub Gist.

🌐 **Access at:** https://canvas.aiocean.app

## How to Use

### 1. Prepare Canvas File

- Create a Canvas file in Obsidian (file with `.canvas` extension)
- Export the Canvas file from your Obsidian vault

### 2. Upload File to GitHub Gist

1. Visit [GitHub Gist](https://gist.github.com)
2. Sign in to your GitHub account
3. Create a new Gist:
   - Name the file with `.canvas` extension (e.g., `my-diagram.canvas`)
   - Copy the Canvas file content and paste it
   - Choose "Create public gist" or "Create secret gist"
4. After creation, you'll have a URL like: `https://gist.github.com/{username}/{gist-id}`

### 3. View Canvas on Web

Use the URL format:
```
https://canvas.aiocean.app/{username}/{gist-id}
```

**Example:**
- Gist URL: `https://gist.github.com/nguyenvanduocit/66b2cc8bbef5f299772fb486a9b36a11`
- Canvas Viewer URL: `https://canvas.aiocean.app/nguyenvanduocit/66b2cc8bbef5f299772fb486a9b36a11`

### 4. Features

- ✅ Display nodes and connections from Canvas files
- ✅ Zoom in/out and pan the canvas
- ✅ Auto-fit view on load
- ✅ Support for node types: text, file
- ✅ Display original colors and dimensions

## Notes

- Canvas files must be uploaded to GitHub Gist (public or secret both work)
- URL must follow the correct format: `/{username}/{gist-id}`
- The app will automatically load and display the canvas from Gist

## Support

If you encounter issues, please check:
1. Is the Gist URL in the correct format?
2. Does the Gist exist and is it accessible?
3. Is the Canvas file in proper JSON format?
