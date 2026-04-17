import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
    name:"product",
    initialState:{
        products:[],
        sellerProduct:[],
        loading:true,
        error:null,
    },
    reducers:{
        setProducts:(state,action)=>{
            state.products = action.payload
        },
        setSellerProducts:(state,action)=>{
            state.products = action.payload
        },
        setLoading:(state,action)=>{
            state.loading = action.payload
        },
        setError:(state,action)=>{
            state.error = action.payload
        }
    }
})

export const {setProducts,setSellerProducts,setLoading,setError} = productSlice.actions

export default productSlice.reducer