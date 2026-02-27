const fallbackBrokerUrl = 'ws://localhost:8080/ws';

const configuredBrokerUrl = import.meta.env.VITE_WS_BROKER_URL?.trim();

export const WS_BROKER_URL = configuredBrokerUrl || fallbackBrokerUrl;
