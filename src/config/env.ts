const runtimeBrokerUrl = window.__APP_CONFIG__?.VITE_WS_BROKER_URL?.trim();
const configuredBrokerUrl = import.meta.env.VITE_WS_BROKER_URL?.trim();
const brokerUrl = runtimeBrokerUrl || configuredBrokerUrl;

if (!brokerUrl) {
	throw new Error('VITE_WS_BROKER_URL is required. Please set it in your environment.');
}

export const WS_BROKER_URL = brokerUrl;
