
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";

export const fetchUserData = async (userId, token, logout) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    try {
        const response = await axiosInterceptor.get(`${baseUrl}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("UserService: Response from server", response.data);
        return response.data; 
    } catch (error) {
        console.log("UserService: Error from server", error.response?.data);
        if (error.response?.status === 401) {
            logout();
        }
        return null;
    }
};

