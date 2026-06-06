import axios from "../../../utils/axios";

export async function getSettings() {
    const response = await axios.get("/api/settings");
    return response.data;
}

export async function updateSettings(data) {
    const response = await axios.put("/api/settings", data);
    return response.data;
}
