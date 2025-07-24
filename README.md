# Pokemon TCG Chase Cards

A modern web application for discovering the most valuable chase cards from Pokemon Scarlet & Violet Trading Card Game sets. Built with Remix and TypeScript, featuring real-time pricing data and an elegant dark-themed interface.

## Features

- **Live Pricing Data**: Integrates with Pokemon Price Tracker API for real-time card values
- **Multiple Price Sources**: Shows pricing from TCGPlayer, eBay, and CardMarket
- **Currency Conversion**: Displays all prices in British Sterling (GBP)
- **Smart Filtering**: Prioritizes chase cards by rarity (Special Illustration Rare, Hyper Rare, etc.)
- **Interactive UI**: Card hover effects, detailed modal popups, and responsive design
- **Complete Set Coverage**: All Scarlet & Violet sets including latest releases

## How It Works

1. **Select a Set**: Choose from any Scarlet & Violet set using the dropdown
2. **View Top Cards**: See the top 10 highest-value chase cards ranked by price
3. **Explore Details**: Click any card for detailed pricing information and card details
4. **Real-time Updates**: Pricing data is fetched live from multiple marketplaces

## Tech Stack

- **Framework**: Remix with TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **API**: Pokemon Price Tracker integration
- **Features**: Server-side rendering, responsive design, accessibility support

## Built with AI Assistance

This application was developed with the assistance of **Claude AI** (Anthropic's AI assistant). Claude helped with:

- **Full-stack Development**: From initial project setup to final implementation
- **API Integration**: Pokemon Price Tracker API implementation and error handling
- **UI/UX Design**: Dark theme creation, responsive layouts, and interactive components
- **Code Architecture**: TypeScript interfaces, utility functions, and best practices
- **Problem Solving**: Debugging API responses, currency conversion, and card filtering logic
- **Performance Optimization**: Efficient data fetching and client-side state management

The iterative development process involved collaborative problem-solving, with Claude providing code solutions while I guided the feature requirements and design decisions. This demonstrates the potential of AI-assisted development for creating production-ready web applications.

## Development

Run the dev server:

```sh
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
