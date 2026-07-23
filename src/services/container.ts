import type { Services } from "@/services/index";

/**
 * A single, simple place to reach the app's services from anywhere (screens,
 * hooks) without prop-drilling. Set once in App.tsx after the database is
 * ready; read from everywhere else via getServices().
 */
let services: Services | null = null;

export function setServices(next: Services): void {
  services = next;
}

export function getServices(): Services {
  if (!services) {
    throw new Error("Services are not ready yet — wait for the database to finish initializing.");
  }
  return services;
}
