const runtimeBrokerUrl = window.__APP_CONFIG__?.VITE_WS_BROKER_URL?.trim();
const configuredBrokerUrl = import.meta.env.VITE_WS_BROKER_URL?.trim();
const brokerUrl = runtimeBrokerUrl || configuredBrokerUrl;

if (!brokerUrl) {
	console.error('VITE_WS_BROKER_URL is missing. Set it in your runtime environment.');
}

export const WS_BROKER_URL = brokerUrl || '';
