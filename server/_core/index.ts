import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { getUtmLinkBySlug, createClickEvent, incrementClickCount } from "../db";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { UAParser } from "ua-parser-js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Route de redirection pour les liens courts avec tracking
  app.get("/s/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const utmLink = await getUtmLinkBySlug(slug);
      
      if (utmLink && utmLink.generatedUrl) {
        // Enregistrer le clic de manière asynchrone (ne pas bloquer la redirection)
        const userAgent = req.headers['user-agent'] || '';
        const referer = req.headers['referer'] || '';
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                          req.socket.remoteAddress || '';
        
        // Parser le User-Agent
        const uaParser = new UAParser(userAgent);
        const browser = uaParser.getBrowser();
        const os = uaParser.getOS();
        const device = uaParser.getDevice();
        
        // Déterminer le type d'appareil
        let deviceType = 'desktop';
        if (device.type === 'mobile') deviceType = 'mobile';
        else if (device.type === 'tablet') deviceType = 'tablet';
        
        // Enregistrer le clic (async, ne pas attendre)
        (async () => {
          try {
            // Géolocalisation via IP (utiliser un service gratuit)
            let country = 'Inconnu';
            let countryCode = '';
            let city = '';
            let region = '';
            
            if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') {
              try {
                const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,regionName,city`);
                const geoData = await geoResponse.json();
                if (geoData.status === 'success') {
                  country = geoData.country || 'Inconnu';
                  countryCode = geoData.countryCode || '';
                  city = geoData.city || '';
                  region = geoData.regionName || '';
                }
              } catch (geoError) {
                console.warn('Géolocalisation échouée:', geoError);
              }
            }
            
            await createClickEvent({
              utmLinkId: utmLink.id,
              country,
              countryCode,
              city,
              region,
              deviceType,
              browser: browser.name || 'Inconnu',
              browserVersion: browser.version || '',
              os: os.name || 'Inconnu',
              osVersion: os.version || '',
              platform: device.vendor || '',
              referer,
              userAgent,
              ipAddress,
            });
            await incrementClickCount(utmLink.id);
          } catch (trackError) {
            console.error('Erreur tracking clic:', trackError);
          }
        })();
        
        // Rediriger immédiatement (ne pas attendre le tracking)
        res.redirect(301, utmLink.generatedUrl);
      } else {
        res.status(404).send("Lien non trouvé");
      }
    } catch (error) {
      console.error("Erreur de redirection:", error);
      res.status(500).send("Erreur serveur");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
