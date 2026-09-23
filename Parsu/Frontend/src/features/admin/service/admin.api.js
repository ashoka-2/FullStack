import customAxios from "../../../utils/axios";

/**
 * Fetch overall admin metrics, integrations status, and traffic aggregates
 */
export async function getAdminOverview() {
    const res = await customAxios.get("/api/admin/overview");
    return res.data;
}

/**
 * Fetch paginated and filtered users
 */
export async function getAdminUsers({ page = 1, limit = 15, search = "", role = "", plan = "" } = {}) {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (search) params.append("search", search);
    if (role) params.append("role", role);
    if (plan) params.append("plan", plan);

    const res = await customAxios.get(`/api/admin/users?${params.toString()}`);
    return res.data;
}

/**
 * Update user role ('user' | 'admin')
 */
export async function updateUserRole(userId, newRole) {
    const res = await customAxios.patch(`/api/admin/users/${userId}/role`, { role: newRole });
    return res.data;
}

/**
 * Update user subscription mode/plan and status
 */
export async function updateUserSubscription(userId, { plan, status, billingCycle }) {
    const res = await customAxios.patch(`/api/admin/users/${userId}/subscription`, { plan, status, billingCycle });
    return res.data;
}

/**
 * Bootstrap or claim initial admin status
 */
export async function claimInitialAdmin(adminSecret = "") {
    const res = await customAxios.post("/api/admin/claim-initial-admin", { adminSecret });
    return res.data;
}

/**
 * Contact inquiries inbox
 */
export async function getAdminContacts({ page = 1, limit = 15, status = "", search = "" } = {}) {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (status) params.append("status", status);
    if (search) params.append("search", search);

    const res = await customAxios.get(`/api/admin/contacts?${params.toString()}`);
    return res.data;
}

export async function updateContactStatus(id, updateData) {
    const res = await customAxios.patch(`/api/admin/contacts/${id}`, updateData);
    return res.data;
}

export async function deleteContact(id) {
    const res = await customAxios.delete(`/api/admin/contacts/${id}`);
    return res.data;
}

/**
 * Newsletter subscriber directory
 */
export async function getAdminNewsletter({ page = 1, limit = 20, search = "" } = {}) {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (search) params.append("search", search);

    const res = await customAxios.get(`/api/admin/newsletter?${params.toString()}`);
    return res.data;
}

export async function deleteNewsletterSubscriber(id) {
    const res = await customAxios.delete(`/api/admin/newsletter/${id}`);
    return res.data;
}

/**
 * Live API consumption & quota monitoring
 */
export async function getAdminApiUsage() {
    const res = await customAxios.get("/api/admin/api-usage");
    return res.data;
}
