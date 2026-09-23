import api from '../../../utils/axios.js';

export async function createRazorpayOrder({ plan, billingCycle }) {
    const response = await api.post('/api/subscription/create-order', { plan, billingCycle });
    return response.data;
}

export async function verifyPaymentSignature(payload) {
    const response = await api.post('/api/subscription/verify-payment', payload);
    return response.data;
}

export async function fetchSubscriptionStatus() {
    const response = await api.get('/api/subscription/me');
    return response.data;
}

export async function getPublicPlans() {
    const response = await api.get('/api/subscription/plans');
    return response.data;
}
