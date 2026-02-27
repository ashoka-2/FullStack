import axios from 'axios';

const api = axios.create({
    baseURL:"http://localhost:3000/api/users",
    withCredentials:true
})


export async function getAllUsers(){
    const response = await api.get('/allUsers');
    return response.data;
}

export async function followUser(userId){
    const response = await api.post('/follow/'+userId);
    return response.data;
}

export async function unfollowUser(userId){
    const response = await api.post('/unfollow/'+userId);
    return response.data;
}

export async function getFollowers(){
    const response = await api.get('/followers');
    return response.data;
}

export async function respondToFollower(userId, status){
    const response = await api.post('/followers/respond/'+userId, { status });
    return response.data;
}

