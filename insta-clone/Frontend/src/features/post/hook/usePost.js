import { useContext, useEffect } from "react";
import { createPost, getFeed, getMyPosts, likePost, unlikePost } from "../services/post.api";
import { PostContext } from "../post.context";


export const usePost = ()=>{

    const context = useContext(PostContext);

    const {loading,setLoading,post,setPost,feed,setFeed} = context;


const handleLoggedInUserPosts = async () => {
    setLoading(true);
    try {
        const data = await getMyPosts();
        setPost(data.posts); 
    } catch (error) {
        console.error("Failed to fetch user posts", error);
    } finally {
        setLoading(false);
    }
}

    const handleGetFeed = async()=>{
        setLoading(true)

        const data = await getFeed();
        setFeed(data.posts)
        // reverses the feed, shows last at first
        // setFeed(data.posts.reverse())
        setLoading(false)
    }


    const handleCreatePost = async (imageFile,caption)=>{
        setLoading(true)
        const data = await createPost(imageFile,caption)
        setFeed([data.post,...feed])
        setLoading(false)

    }


    const handleLike = async (postId)=>{

        setFeed(prevFeed => prevFeed.map(p=>{
            if(p._id === postId){
                return {...p, isLiked:true, likeCount:p.likeCount+1};
            }
            return p;
        }));

        try{
            await likePost(postId);
        }
        catch(error){
            console.log("like failed",error);
            
        }

    
    }

    const handleUnlike = async (postId)=>{
        
        setFeed(prevFeed => prevFeed.map(p=>{
            if(p._id === postId){
                return {...p, isLiked:false, likeCount:p.likeCount-1};
            }
            return p;
        }));
        try{
            await unlikePost(postId);
        }
        catch(error){
            console.log("Unlike failed",error);
            
        }
    }



    useEffect(()=>{
        handleGetFeed()
    },[])

    return{
        loading,
        post,
        feed,
        handleGetFeed,
        handleCreatePost,
        handleLike,
        handleUnlike,
        handleLoggedInUserPosts
    }

}