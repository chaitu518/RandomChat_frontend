const configuredBrokerUrl = import.meta.env.VITE_WS_BROKER_URL?.trim();

if (!configuredBrokerUrl) {
	throw new Error('VITE_WS_BROKER_URL is required. Please set it in your environment.');
}

export const WS_BROKER_URL = configuredBrokerUrl;
