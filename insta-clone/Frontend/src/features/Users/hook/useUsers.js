import { useContext } from "react";
import { followUser, getAllUsers, getFollowers, respondToFollower, unfollowUser } from '../services/user.api';
import { UserContext } from "../user.context";


export const useUsers = () => {
    const context = useContext(UserContext);

    const { loading, setLoading, users, setUsers, followers, setFollowers } = context;

    const handleAllUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data.users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }



    const handleGetFollowers = async () => {
        setLoading(true)
        try {
            const data = await getFollowers();
            setFollowers(data.data);
        }
        catch (error) {
            console.error("Failed to fetch followers", error);
        }
        finally {
            setLoading(false);
        }
    }

const handleFollow = async (userId) => {
        setUsers(prevUsers => prevUsers.map(user => 
            user._id === userId ? { ...user, isFollowing: true, followStatus: 'pending' } : user
        ));

        try {
            await followUser(userId);
        } catch (error) {
            console.error("Follow failed", error);
            setUsers(prevUsers => prevUsers.map(user => 
                user._id === userId ? { ...user, isFollowing: false, followStatus: null } : user
            ));
        }
    }

    const handleUnfollow = async (userId) => {
        setUsers(prevUsers => prevUsers.map(user => 
            user._id === userId ? { ...user, isFollowing: false, followStatus: null } : user
        ));

        try {
            await unfollowUser(userId); 
        } catch (error) {
            console.error("Unfollow failed", error);
            setUsers(prevUsers => prevUsers.map(user => 
                user._id === userId ? { ...user, isFollowing: true, followStatus: 'accepted' } : user
            ));
        }
    }

    const handleRespond = async (userId, status) => {
        try {
            await respondToFollower(userId, status);
            setFollowers(prev => prev.filter(f => f.follower._id !== userId));
        } catch (error) {
            console.error("Respond failed", error);
        }
    }

    return {
        loading,
        users,
        followers,             
        handleAllUsers,
        handleGetFollowers,    
        handleFollow,
        handleUnfollow,
        handleRespond
    }

}


