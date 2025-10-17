# Konfidence Docs

Official documentation for the Konfidence project, built with [VitePress](https://vitepress.dev/).

## Development Setup

### Prerequisites

- Node.js (v22 or higher)
- pnpm

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/konfidence-project/konfidence-docs.git
   cd konfidence-docs
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

   The docs will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm build
pnpm preview
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Read the guidelines** - Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines
2. **Find or create an issue** - Browse existing issues or create a new one
3. **Make your changes** - Edit documentation files in the `docs/` directory
4. **Test locally** - Run `pnpm dev` to preview your changes
5. **Submit a PR** - Create a pull request with a clear description

### Documentation Structure

- `docs/` - Documentation content (Markdown files)
- `.vitepress/` - VitePress configuration

## License

This project is licensed under the Apache 2.0 License - see [LICENSE](./LICENSE) for details.